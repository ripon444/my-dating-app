import React, { useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Volume2,
  ShieldCheck
} from 'lucide-react';
import { Call } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface IncomingCallModalProps {
  call: Call | null;
  onAccept: (call: Call) => void;
  onReject: (call: Call) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onReject,
}) => {
  const { t } = useTranslation();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  // WhatsApp / FB Messenger Incoming Ringtone & Vibration
  useEffect(() => {
    if (!call || call.status !== 'ringing') return;

    let isRunning = true;

    // Mobile vibration pattern if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250, 1000]);
      } catch (e) {}
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const playRingToneBurst = () => {
          if (!isRunning || !audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          
          try {
            if (audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume().catch(() => {});
            }

            const now = audioCtxRef.current.currentTime;
            
            // Dual frequency standard WhatsApp/FB ring chime
            const osc1 = audioCtxRef.current.createOscillator();
            const osc2 = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);

            // Ring sequence
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
            gain.gain.setValueAtTime(0.15, now + 1.2);
            gain.gain.linearRampToValueAtTime(0.001, now + 1.5);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtxRef.current.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.6);
            osc2.stop(now + 1.6);

            // Repeat vibration
            if ('vibrate' in navigator) {
              try {
                navigator.vibrate([400, 200, 400]);
              } catch (err) {}
            }
          } catch (e) {
            console.warn('Audio ringtone trigger:', e);
          }
        };

        playRingToneBurst();
        ringIntervalRef.current = setInterval(playRingToneBurst, 3000);
      }
    } catch (e) {}

    return () => {
      isRunning = false;
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(0);
        } catch (e) {}
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {}
        audioCtxRef.current = null;
      }
    };
  }, [call?.id, call?.status]);

  if (!call || call.status !== 'ringing') return null;

  const caller = call.caller_profile || {
    name: 'Global Match Member',
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'],
    city: 'New York',
    country: 'United States',
  };

  const [isProcessing, setIsProcessing] = React.useState(false);

  const isVideo = call.type === 'video';

  const handleAccept = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing) return;
    setIsProcessing(true);

    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(0); } catch (err) {}
    }
    onAccept(call);
  };

  const handleReject = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing) return;
    setIsProcessing(true);

    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate(0); } catch (err) {}
    }
    onReject(call);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-xl animate-in fade-in select-none">
      
      {/* Blurred Ambient Background from Caller Photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-3xl scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${caller.photos?.[0] || ''})` }}
      />

      <div className="relative z-10 bg-stone-900/90 border border-stone-800 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        
        {/* Incoming Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 mb-6 animate-pulse">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isVideo ? 'Incoming Video Call...' : 'Incoming Voice Call...'}</span>
        </div>

        {/* Caller Avatar with WhatsApp/FB Ringing Ripples */}
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-rose-500 shadow-2xl relative z-10 bg-stone-800">
            <img
              src={caller.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'}
              alt={caller.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-rose-500/60 animate-ping pointer-events-none" />
          <div className="absolute -inset-6 rounded-full border border-rose-500/30 animate-pulse pointer-events-none" />
        </div>

        {/* Caller Information */}
        <h2 className="text-2xl font-bold text-white font-serif mb-1">{caller.name}</h2>
        <p className="text-xs text-stone-400 mb-4">
          {caller.city ? `${caller.city}, ${caller.country}` : 'Global Match Member'}
        </p>

        <div className="flex items-center gap-1 text-[11px] text-emerald-400 mb-8 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/40">
          <ShieldCheck className="w-3 h-3" />
          <span>End-to-End Encrypted HD Call</span>
        </div>

        {/* Action Buttons: Decline (Red) & Accept (Green) */}
        <div className="flex items-center justify-between w-full px-6">
          
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              id="btn-call-decline"
              type="button"
              onClick={handleReject}
              onTouchStart={handleReject}
              disabled={isProcessing}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-rose-900/50 transition cursor-pointer disabled:opacity-50"
              title="Decline"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-stone-300 font-medium">Decline</span>
          </div>

          {/* Accept Button (1-Click Instant Answer with Glowing Halo Ring) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <span className="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />
              <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none" />
              <button
                id="btn-call-accept"
                type="button"
                onClick={handleAccept}
                onTouchStart={handleAccept}
                disabled={isProcessing}
                className="relative z-10 w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition cursor-pointer disabled:opacity-50"
                title="Accept Call"
              >
                {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </button>
            </div>
            <span className="text-xs text-emerald-400 font-bold">Accept</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default IncomingCallModal;
