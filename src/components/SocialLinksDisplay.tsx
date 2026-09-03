import React, { useState } from 'react';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Send,
  MessageCircle,
  Music2,
  ExternalLink,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { SocialLinks } from '../types';

interface SocialLinksDisplayProps {
  socialLinks?: SocialLinks;
  website?: string;
  isOwnProfile?: boolean;
  onAddLinks?: () => void;
  className?: string;
  compact?: boolean;
}

interface PlatformConfig {
  key: keyof SocialLinks;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  hoverClass: string;
  formatUrl: (val: string) => string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-600/10',
    borderClass: 'border-blue-500/20',
    hoverClass: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://facebook.com/${val.replace(/^@/, '')}`),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    colorClass: 'text-pink-500',
    bgClass: 'bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-500/10',
    borderClass: 'border-rose-500/20',
    hoverClass: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:border-transparent',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://instagram.com/${val.replace(/^@/, '')}`),
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: Twitter,
    colorClass: 'text-stone-100',
    bgClass: 'bg-stone-800/80',
    borderClass: 'border-stone-700',
    hoverClass: 'hover:bg-white hover:text-black hover:border-white',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://x.com/${val.replace(/^@/, '')}`),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: Music2,
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/20',
    hoverClass: 'hover:bg-teal-500 hover:text-black hover:border-teal-500',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://tiktok.com/@${val.replace(/^@/, '')}`),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    hoverClass: 'hover:bg-red-600 hover:text-white hover:border-red-600',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://youtube.com/${val.startsWith('@') ? val : '@' + val}`),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    hoverClass: 'hover:bg-sky-600 hover:text-white hover:border-sky-600',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://linkedin.com/in/${val.replace(/^@/, '')}`),
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: Send,
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    hoverClass: 'hover:bg-cyan-500 hover:text-white hover:border-cyan-500',
    formatUrl: (val) => (val.startsWith('http') ? val : `https://t.me/${val.replace(/^@/, '')}`),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    hoverClass: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
    formatUrl: (val) => {
      if (val.startsWith('http')) return val;
      const cleanNum = val.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanNum}`;
    },
  },
];

export const SocialLinksDisplay: React.FC<SocialLinksDisplayProps> = ({
  socialLinks = {},
  website,
  isOwnProfile,
  onAddLinks,
  className = '',
  compact = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeLinks = PLATFORMS.filter((p) => {
    const val = socialLinks[p.key];
    return typeof val === 'string' && val.trim().length > 0;
  });

  const hasWebsite = Boolean(website && website.trim());
  const hasAnyLinks = activeLinks.length > 0 || hasWebsite;

  const handleCopyLink = (e: React.MouseEvent, key: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCleanDisplayUrl = (url: string) => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
      return url;
    }
  };

  if (!hasAnyLinks) {
    if (isOwnProfile && onAddLinks) {
      return (
        <div className={`p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center ${className}`}>
          <p className="text-xs text-neutral-400 mb-2.5">
            Add your Facebook, Instagram, WhatsApp or website to let people connect with you across platforms!
          </p>
          <button
            onClick={onAddLinks}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition shadow-md shadow-rose-900/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Social Media Links</span>
          </button>
        </div>
      );
    }
    return null;
  }

  // Compact Mode (used in header bar or quick badges)
  if (compact) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {hasWebsite && (
          <a
            href={website?.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Personal Website: ${website}`}
            className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center shadow-sm"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}

        {activeLinks.map((p) => {
          const rawVal = socialLinks[p.key] || '';
          const targetUrl = p.formatUrl(rawVal);
          const Icon = p.icon;

          return (
            <a
              key={p.key}
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${p.label}: ${rawVal}`}
              className={`w-9 h-9 rounded-xl ${p.bgClass} border ${p.borderClass} ${p.colorClass} ${p.hoverClass} transition flex items-center justify-center shadow-sm`}
            >
              <Icon className="w-4 h-4" />
            </a>
          );
        })}
      </div>
    );
  }

  // Full Rich Card Layout
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Personal Website */}
        {hasWebsite && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/40 transition group">
            <a
              href={website?.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-emerald-400">Personal Website</div>
                <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition">
                  {getCleanDisplayUrl(website!)}
                </div>
              </div>
            </a>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={(e) => handleCopyLink(e, 'website', website?.startsWith('http') ? website : `https://${website}`)}
                title="Copy website link"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                {copiedKey === 'website' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={website?.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Visit website"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Social Links */}
        {activeLinks.map((p) => {
          const rawVal = socialLinks[p.key] || '';
          const targetUrl = p.formatUrl(rawVal);
          const Icon = p.icon;

          return (
            <div
              key={p.key}
              className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition group"
            >
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${p.bgClass} border ${p.borderClass} ${p.colorClass} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-neutral-400">{p.label}</div>
                  <div className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition">
                    {rawVal.replace(/^https?:\/\/(www\.)?/, '')}
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, p.key, targetUrl)}
                  title={`Copy ${p.label} link`}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  {copiedKey === p.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${p.label}`}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
