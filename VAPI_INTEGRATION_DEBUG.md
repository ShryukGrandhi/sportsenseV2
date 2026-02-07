# VAPI Integration Debug - Complete Context

## Problem Statement

We're trying to connect VAPI voice calls to the SportsSense chatbot API so that VAPI can access live NBA data (scores, stats, standings) during phone conversations. Currently, VAPI is calling the webhook but not extracting user messages properly, causing the call to hang and eventually timeout.

## Current Architecture

### Flow
```
User calls VAPI → VAPI receives speech → VAPI POSTs to webhook → 
Webhook calls chatbot API → Chatbot fetches live NBA data → 
Webhook formats response → VAPI speaks response
```

### Files Involved

1. **`src/app/api/vapi/call/route.ts`** - Initiates VAPI calls
   - Sets up assistant with `serverUrl` pointing to webhook
   - Uses OpenAI GPT-4o model
   - Uses Vapi voice provider with "Elliot" voice

2. **`src/app/api/vapi/webhook/route.ts`** - Receives VAPI requests and proxies to chatbot
   - Should extract user message from VAPI request
   - Calls `/api/ai/chat` with the message
   - Formats response for voice
   - Returns to VAPI

3. **`src/app/api/ai/chat/route.ts`** - Main chatbot API with live NBA data
   - Fetches live scores, player stats, team data from ESPN
   - Uses Google Gemini for responses
   - Returns formatted responses with live data

## Current Configuration

### Environment Variables (Vercel)
```
NEXTAUTH_URL=https://sportsense-v2-49ma.vercel.app
VAPI_PRIVATE_KEY=e07d7d51-1890-406f-85d4-63307a729061
VAPI_PHONE_NUMBER_ID=[correct phone number ID]
VAPI_TARGET_PHONE=+18582108648
GEMINI_API_KEY=[set]
DATABASE_URL=[set]
```

### VAPI Call Configuration
```typescript
assistant: {
  serverUrl: `${WEBHOOK_BASE_URL}/api/vapi/webhook`,
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `You are Playmaker AI. You ONLY answer NBA questions using data from the webhook...`
    }]
  },
  voice: {
    provider: 'vapi',
    voiceId: 'Elliot',
  }
}
```

## Current Issues

### Issue 1: Webhook Not Extracting User Messages
**Symptoms:**
- Webhook receives many `conversation-update` and `speech-update` events
- Logs show: `[Vapi Webhook] Event type was: conversation-update`
- But then: `[Vapi Webhook] No user message found - this is likely a status update or event`
- Chatbot API is never called
- User asks question, AI says "I need access to the latest updates" then hangs

**Logs:**
```
Feb 04 07:37:10.12 POST /api/vapi/webhook [Vapi Webhook] Event type was: conversation-update
Feb 04 07:37:06.34 POST /api/vapi/webhook [Vapi Webhook] Event type was: speech-update
Feb 04 07:37:06.27 POST /api/vapi/webhook [Vapi Webhook] Event type was: conversation-update
...many more conversation-update events...
```

**Root Cause:**
The webhook's message extraction logic isn't finding the user message in VAPI's `conversation-update` event format. We need to see the actual structure of these events to fix extraction.

### Issue 2: Call Timeout
**Symptoms:**
- Call connects successfully
- User asks question
- AI responds with generic message
- Call hangs for 5+ seconds
- VAPI cuts the call due to silence timeout

**Root Cause:**
Because the webhook isn't extracting messages, it never calls the chatbot API, so no live data is returned. The AI falls back to its system prompt which says "I need to check the latest data" but never actually does.

## What We've Tried

1. ✅ Fixed voice configuration (changed from 11labs to Vapi provider with "Elliot")
2. ✅ Added webhook endpoint at `/api/vapi/webhook`
3. ✅ Added GET handler for testing
4. ✅ Improved error handling and logging
5. ✅ Added multiple message extraction formats
6. ✅ Added conversation-update event handling
7. ✅ Added detailed logging for conversation-update events

## Current Webhook Implementation

### Message Extraction Logic
The webhook tries to extract user messages from:
1. `body.transcript`
2. `body.message` (string or object)
3. `body.message.transcript`
4. `body.message.content`
5. `body.functionCall.parameters`
6. `body.messages` array
7. `body.text`
8. `body.query`
9. `conversation-update` events with `body.message.role === 'user'`
10. `conversation-update` events with `body.messages` array
11. `conversation-update` events with `body.message.messages` nested array
12. `conversation-update` events with `body.message.transcript`

### Response Format
```typescript
return NextResponse.json({
  response: voiceResponse, // Formatted text for voice
});
```

## Recent Logs Analysis

From the logs provided:
- Webhook is being called frequently (good)
- Events received: `conversation-update`, `speech-update`, `user-interrupted`, `status-update`
- No logs showing "Found user message" - extraction is failing
- No logs showing "Calling chatbot at" - chatbot API is never called
- `/api/live/nba` is being called (separate endpoint, not related to webhook)

## What We Need

1. **See the actual structure of `conversation-update` events**
   - The new logging should show `body.message` and `body.messages` in the logs
   - This will tell us exactly where the user's message is

2. **Fix message extraction**
   - Once we see the structure, update extraction logic to find the message

3. **Handle timeout issue**
   - Option A: Return quick acknowledgment, then process async
   - Option B: Optimize chatbot API to respond faster
   - Option C: Configure VAPI timeout settings

## Next Steps

1. After deployment, make a test call
2. Check Vercel logs for the new detailed logging:
   - Look for `[Vapi Webhook] Processing conversation-update event`
   - Look for `[Vapi Webhook] body.message:` - this will show the structure
   - Look for `[Vapi Webhook] body.messages:` - this will show the array structure
3. Use that structure to fix the extraction logic
4. Test again to verify chatbot API is called
5. Address timeout if still an issue

## Key Code Locations

### Webhook Message Extraction
File: `src/app/api/vapi/webhook/route.ts`
Lines: ~118-183 (message extraction logic)
Lines: ~175-182 (conversation-update handling)

### VAPI Call Setup
File: `src/app/api/vapi/call/route.ts`
Lines: ~74-93 (assistant configuration with serverUrl)

### Chatbot API
File: `src/app/api/ai/chat/route.ts`
- This is the main API that fetches live NBA data
- Called by webhook with: `POST /api/ai/chat` with `{ message, personality, length, type, requestVisuals }`
- Returns: `{ response, visual, model, intent, dataSource, dataTimestamp, gamesCount }`

## Deployment Info

- **Vercel URL**: `https://sportsense-v2-49ma.vercel.app`
- **Webhook URL**: `https://sportsense-v2-49ma.vercel.app/api/vapi/webhook`
- **GitHub Repo**: `https://github.com/ShryukGrandhi/sportsenseV2`
- **Branch**: `main`

## Error Messages Seen

1. `"eleven labs voice not found"` - Fixed by switching to Vapi provider
2. `"voiceId must be one of: Elliot, Kylie..."` - Fixed by capitalizing "Elliot"
3. `"phoneNumber does not exist"` - Fixed by updating VAPI_PHONE_NUMBER_ID
4. `"I need access to the latest updates"` - Current issue: webhook not extracting messages
5. Call timeout after 5 seconds - Caused by webhook not returning responses

## Testing Checklist

- [ ] Webhook is accessible (GET request returns status)
- [ ] VAPI can initiate calls
- [ ] Webhook receives conversation-update events
- [ ] Webhook extracts user message from events
- [ ] Webhook calls chatbot API
- [ ] Chatbot API returns live NBA data
- [ ] Webhook formats response for voice
- [ ] VAPI receives and speaks the response
- [ ] Response contains actual live data (not generic)

## Questions to Answer

1. What is the exact structure of `conversation-update` events from VAPI?
2. Where is the user's spoken message located in that structure?
3. Why is the chatbot API call taking so long (if it's being called)?
4. Should we return an immediate acknowledgment to prevent timeout?
5. Is VAPI configured correctly to use serverUrl for all responses?
