#!/usr/bin/env npx tsx
/**
 * Gemini API Smoketest Script
 * 
 * Purpose: Send exactly ONE request to Gemini API to verify:
 * 1. API key is valid and properly configured
 * 2. Which quota tier is being used (free vs paid)
 * 3. The exact endpoint being called
 * 
 * Usage: npx tsx scripts/gemini_smoketest.ts
 */

import * as crypto from 'crypto';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('='.repeat(60));
console.log('GEMINI API SMOKETEST');
console.log('='.repeat(60));

// Log API key info (safely)
if (!GEMINI_API_KEY) {
  console.error('\n❌ ERROR: GEMINI_API_KEY environment variable is not set!');
  console.log('\nCheck your .env file and ensure GEMINI_API_KEY is defined.');
  process.exit(1);
}

// Hash the API key for verification (never log the full key)
const keyHash = crypto.createHash('sha256').update(GEMINI_API_KEY).digest('hex').substring(0, 16);
const keyPrefix = GEMINI_API_KEY.substring(0, 8);
const keyLength = GEMINI_API_KEY.length;

console.log('\n📌 API Key Info:');
console.log(`   - Length: ${keyLength} characters`);
console.log(`   - Prefix: ${keyPrefix}...`);
console.log(`   - Hash (first 16 chars): ${keyHash}`);
console.log(`   - Source: ${process.env.GEMINI_API_KEY ? '.env file' : 'unknown'}`);

// Check key format
if (!GEMINI_API_KEY.startsWith('AIza')) {
  console.warn('\n⚠️  WARNING: API key does not start with "AIza" - may not be a valid Google API key');
}

async function runSmoketest() {
  console.log('\n📡 Making single API request...');
  console.log('   Model: gemini-2.5-flash');
  console.log('   Prompt: "Say hello in exactly 3 words"');
  
  const startTime = Date.now();
  
  try {
    // Import the SDK
    const { GoogleGenAI } = await import('@google/genai');
    
    // Initialize client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Make the request
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say hello in exactly 3 words',
    });
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ SUCCESS!');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Response: "${response.text}"`);
    console.log('\n📊 This confirms:');
    console.log('   - API key is valid');
    console.log('   - SDK is working correctly');
    console.log('   - Network connectivity is fine');
    
    // Note about endpoint
    console.log('\n📌 Note: @google/genai SDK uses:');
    console.log('   Endpoint: https://generativelanguage.googleapis.com/v1beta/');
    console.log('   (This is the correct endpoint for AI Studio keys)');
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.log(`\n❌ FAILED after ${duration}ms`);
    
    // Parse error details
    const errorMessage = error?.message || String(error);
    console.log('\n📋 Error Details:');
    console.log('   Message:', errorMessage);
    
    if (error?.status) {
      console.log('   HTTP Status:', error.status);
    }
    
    // Check for quota/rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.log('\n🔴 DIAGNOSIS: Rate limit / Quota exceeded');
      
      if (errorMessage.includes('free_tier')) {
        console.log('\n⚠️  CRITICAL FINDING:');
        console.log('   The error mentions "free_tier_requests" which means:');
        console.log('   1. Your API key is being attributed to FREE TIER');
        console.log('   2. Despite AI Studio showing "Tier 1"');
        console.log('\n   Possible causes:');
        console.log('   A) Wrong API key - using a key from a different project');
        console.log('   B) Billing not properly linked to this specific API key');
        console.log('   C) Key was created before billing was enabled');
        console.log('   D) Quota propagation delay after upgrading');
        console.log('\n   Recommended fix:');
        console.log('   1. Go to https://aistudio.google.com/app/apikey');
        console.log('   2. DELETE the current API key');
        console.log('   3. Create a NEW API key');
        console.log('   4. Update your .env file with the new key');
        console.log('   5. Restart your dev server');
      } else {
        console.log('\n   This is a per-minute rate limit (not tier issue)');
        console.log('   Wait 60 seconds and try again');
      }
    } else if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401')) {
      console.log('\n🔴 DIAGNOSIS: Invalid API key');
      console.log('   The API key is not valid or has been revoked.');
      console.log('   Generate a new key at: https://aistudio.google.com/app/apikey');
    } else if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
      console.log('\n🔴 DIAGNOSIS: Permission denied');
      console.log('   The Gemini API may not be enabled for this project.');
      console.log('   Enable it at: https://console.cloud.google.com/apis/library');
    } else {
      console.log('\n🔴 DIAGNOSIS: Unknown error');
      console.log('   Check the full error message above.');
    }
    
    // Log full error for debugging
    console.log('\n📋 Full Error Object:');
    console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    process.exit(1);
  }
}

runSmoketest();


