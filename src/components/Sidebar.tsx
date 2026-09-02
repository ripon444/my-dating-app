import React from 'react';
import { 
  Flame, 
  Heart, 
  MessageCircle, 
  PhoneCall, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  matchesCount: number;
  unreadMessagesCount: number;
  user: User | null;
  onOpenLegal: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  matchesCount,
  unreadMessagesCount,
  user,
  onOpenLegal,
}) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'discover', label: t('discover'), icon: Flame, badge: undefined },
    { id: 'matches', label: t('matches'), icon: Heart, badge: matchesCount > 0 ? matchesCount : undefined },
    { id: 'messages', label: t('messages'), icon: MessageCircle, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'calls', label: t('calls'), icon: PhoneCall, badge: undefined },
    { id: 'profile', label: t('profile'), icon: UserIcon, badge: undefined },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-stone-900 border-r border-stone-800 p-4 min-h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/20'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legal & Compliance Footer in Sidebar */}
        <div className="border-t border-stone-800/80 pt-4 space-y-2 text-xs text-stone-400">
          <div className="px-3 text-[11px] font-semibold uppercase text-stone-500">
            Trust & Safety
          </div>
          <button
            onClick={() => onOpenLegal('disclosure')}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('disclosure')}</span>
          </button>
          <button
            onClick={() => onOpenLegal('guidelines')}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('guidelines')}</span>
          </button>
          <div className="px-3 pt-2 text-[10px] text-stone-600">
            © 2026 Global Match Platform. Licensed integrations strictly adhere to partner syndication agreements.
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${
                isActive ? 'text-rose-500 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
