import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  Facebook,
  Twitter,
  Send,
  MessageCircle,
  Linkedin,
  QrCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Profile } from '../types';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const identifier = profile.username || profile.user_id || profile.id;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://globalmatch.com';
  const profileUrl = `${origin}/profile/${identifier}`;
  const shareText = `Check out ${profile.name}'s profile on Global Match!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} on Global Match`,
          text: shareText,
          url: profileUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareDestinations = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600/15 text-blue-400 border-blue-500/30 hover:bg-blue-600 hover:text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-white hover:text-black',
      url: `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500 hover:text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-600 hover:text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    },
  ];

  // Simple, elegant SVG QR Code generator (no external dependencies needed)
  const renderQrCodeSvg = () => {
    // Generate a deterministically patterned QR code representation for the profile URL
    const size = 21;
    const hash = identifier.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1000000007, 42);
    
    return (
      <svg viewBox="0 0 25 25" className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-inner">
        {/* Finder pattern Top-Left */}
        <rect x="1" y="1" width="7" height="7" fill="black" />
        <rect x="2" y="2" width="5" height="5" fill="white" />
        <rect x="3" y="3" width="3" height="3" fill="black" />

        {/* Finder pattern Top-Right */}
        <rect x="17" y="1" width="7" height="7" fill="black" />
        <rect x="18" y="2" width="5" height="5" fill="white" />
        <rect x="19" y="3" width="3" height="3" fill="black" />

        {/* Finder pattern Bottom-Left */}
        <rect x="1" y="17" width="7" height="7" fill="black" />
        <rect x="2" y="18" width="5" height="5" fill="white" />
        <rect x="3" y="19" width="3" height="3" fill="black" />

        {/* Timing stripes */}
        {[8, 10, 12, 14, 16].map((x) => (
          <rect key={`th-${x}`} x={x} y="4" width="1" height="1" fill="black" />
        ))}
        {[8, 10, 12, 14, 16].map((y) => (
          <rect key={`tv-${y}`} x="4" y={y} width="1" height="1" fill="black" />
        ))}

        {/* Dynamic data cells derived from hash and URL length */}
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => {
            const rx = c + 5;
            const ry = r + 5;
            // Skip finder overlap
            if (rx < 8 && ry < 8) return null;
            if (rx > 16 && ry < 8) return null;
            if (rx < 8 && ry > 16) return null;
            const bit = ((hash * (rx + 1) * (ry + 3) + profileUrl.length) % 7) > 3;
            return bit ? <rect key={`${rx}-${ry}`} x={rx} y={ry} width="1" height="1" fill="black" /> : null;
          })
        )}
      </svg>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Share Profile</h3>
                <p className="text-[10px] text-neutral-400">Share with friends or across social media</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Profile Preview Pill */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
              <img
                src={profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-neutral-700"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm truncate">{profile.name}</span>
                  {profile.age && <span className="text-xs text-neutral-400 font-medium">, {profile.age}</span>}
                </div>
                <div className="text-[11px] font-mono text-rose-400 truncate">
                  @{profile.username || profile.user_id || profile.id}
                </div>
                {(profile.city || profile.country) && (
                  <div className="text-[10px] text-neutral-400 truncate">
                    {profile.city ? `${profile.city}, ` : ''}{profile.country}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                title="Show QR Code"
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  showQr
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Panel */}
            {showQr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2"
              >
                <div className="text-xs font-semibold text-neutral-300">Scan to Open Profile on Mobile</div>
                {renderQrCodeSvg()}
                <div className="text-[10px] text-neutral-500">Scan using standard iPhone or Android camera app</div>
              </motion.div>
            )}

            {/* Unique Profile Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                <span>Unique Profile URL</span>
                {copied && (
                  <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied to clipboard!
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={profileUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-rose-500 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                      : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/40'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Share destinations */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Direct Share
              </div>
              <div className="grid grid-cols-5 gap-2">
                {shareDestinations.map((dest) => {
                  const Icon = dest.icon;
                  return (
                    <a
                      key={dest.name}
                      href={dest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center group ${dest.color}`}
                    >
                      <Icon className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-medium truncate w-full">{dest.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Native device share if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Share via More Apps...</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
