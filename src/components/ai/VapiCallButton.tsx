'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type CallState = 'idle' | 'connecting' | 'active';

export function VapiCallButton() {
  const [callState, setCallState] = useState<CallState>('idle');

  const handleCall = async () => {
    if (callState === 'active') {
      // End call - reset state
      setCallState('idle');
      return;
    }

    setCallState('connecting');

    try {
      const response = await fetch('/api/vapi/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setCallState('active');
      } else {
        console.error('[VapiCall] Failed:', data.error);
        setCallState('idle');
      }
    } catch (error) {
      console.error('[VapiCall] Error:', error);
      setCallState('idle');
    }
  };

  return (
    <button
      onClick={handleCall}
      className={cn(
        "fixed bottom-6 right-20 p-4 rounded-full transition-all shadow-lg z-40",
        callState === 'idle' && "glass hover:bg-white/20 text-white/70 hover:text-white border border-white/10",
        callState === 'connecting' && "glass text-orange-400 border border-orange-500/30",
        callState === 'active' && "bg-red-500 text-white shadow-red-500/30 animate-pulse"
      )}
      title={
        callState === 'idle' ? 'Start voice call with Playmaker AI' :
        callState === 'connecting' ? 'Connecting...' :
        'End call'
      }
    >
      {callState === 'connecting' ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : callState === 'active' ? (
        <PhoneOff className="w-5 h-5" />
      ) : (
        <Phone className="w-5 h-5" />
      )}
    </button>
  );
}
