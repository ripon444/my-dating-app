import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  Video, 
  Languages, 
  MoreVertical, 
  Image as ImageIcon, 
  Paperclip,
  FileText,
  Music,
  Film,
  Download,
  X,
  Smile, 
  ShieldAlert, 
  UserX, 
  Check, 
  CheckCheck, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  Loader2,
  Lock,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { Conversation, Message, Profile, User, MessageAttachment } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useTranslation } from '../i18n/LanguageContext';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: User | null;
  onBack?: () => void;
  onInitiateCall: (receiverId: string, type: 'voice' | 'video') => void;
  onViewProfile: (profile: Profile) => void;
  onReportUser: (profile: Profile) => void;
  onUnmatch: (matchId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUser,
  onBack,
  onInitiateCall,
  onViewProfile,
  onReportUser,
  onUnmatch,
}) => {
  const { currentLanguage, t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  
  // Pending File Attachment State
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl: string;
    type: 'image' | 'video' | 'audio' | 'file';
    filename: string;
    size: number;
    base64Data: string;
  } | null>(null);

  // Lightbox Modal for Fullscreen Image View
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = conversation.other_user;
  const activeUserId = currentUser?.id || 'usr_me_01';

  // 1. Load messages and mark conversation as read
  useEffect(() => {
    if (conversation.id) {
      api.getMessages(conversation.id).then((data) => {
        setMessages(data.messages || []);
      });

      // Mark unread messages as read
      api.markConversationAsRead(conversation.id).catch(() => {});

      // Join conversation socket room
      const socket = getSocket();
      socket.emit('conversation:join', conversation.id);

      return () => {
        socket.emit('conversation:leave', conversation.id);
      };
    }
  }, [conversation.id]);

  // 2. Real-time Socket listeners for new messages, typing, and read receipts
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: Message) => {
      if (msg.conversation_id === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // If I received this message while chat is open, mark it as read immediately
        if (msg.receiver_id === activeUserId) {
          api.markConversationAsRead(conversation.id).catch(() => {});
        }
      }
    };

    const handleTypingStart = (data: { conversation_id: string; sender_id: string; sender_name?: string }) => {
      if (data.conversation_id === conversation.id && data.sender_id !== activeUserId) {
        setIsTyping(true);
        setTypingUserName(data.sender_name || otherUser.name || 'Member');
      }
    };

    const handleTypingStop = (data: { conversation_id: string; sender_id: string }) => {
      if (data.conversation_id === conversation.id && data.sender_id !== activeUserId) {
        setIsTyping(false);
        setTypingUserName(null);
      }
    };

    const handleMessageRead = (data: { conversation_id: string; read_by: string }) => {
      if (data.conversation_id === conversation.id && data.read_by !== activeUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === activeUserId && !m.read_at
              ? { ...m, read_at: new Date().toISOString() }
              : m
          )
        );
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:received', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:received', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
    };
  }, [conversation.id, activeUserId, otherUser.name]);

  // 3. Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, pendingAttachment]);

  // 4. Handle Typing input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);

    const socket = getSocket();
    socket.emit('typing:start', {
      conversation_id: conversation.id,
      sender_id: activeUserId,
      sender_name: currentUser?.email?.split('@')[0] || 'Member',
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversation_id: conversation.id,
        sender_id: activeUserId,
      });
    }, 1500);
  };

  // 5. Handle File Selection (Images, Videos, Audio, Documents)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check: 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      let type: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      setPendingAttachment({
        file,
        previewUrl: type === 'image' || type === 'video' ? URL.createObjectURL(file) : '',
        type,
        filename: file.name,
        size: file.size,
        base64Data: base64,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 6. Handle Send Message (Text + Multimedia Attachment)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputVal.trim() && !pendingAttachment) || isSending) return;

    setIsSending(true);
    const content = inputVal.trim();
    setInputVal('');

    try {
      let attachmentPayload: any = undefined;
      let msgType: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text';

      if (pendingAttachment) {
        msgType = pendingAttachment.type;
        // Upload attachment
        const uploadRes = await api.uploadAttachment({
          data: pendingAttachment.base64Data,
          filename: pendingAttachment.filename,
          mimeType: pendingAttachment.file.type,
          size: pendingAttachment.size,
        });

        if (uploadRes.success && uploadRes.file) {
          attachmentPayload = {
            url: uploadRes.file.url,
            filename: uploadRes.file.filename,
            size: uploadRes.file.size,
            mimeType: uploadRes.file.mimeType,
          };
        }
      }

      const res = await api.sendMessage({
        conversation_id: conversation.id,
        receiver_id: otherUser.id || otherUser.user_id || '',
        content: content || (pendingAttachment ? pendingAttachment.filename : ''),
        attachment: attachmentPayload,
        attachment_url: attachmentPayload?.url,
        file_name: pendingAttachment?.filename,
        file_size: pendingAttachment?.size,
        message_type: msgType,
      });

      setMessages((prev) => [...prev, res.message]);
      setPendingAttachment(null);

      // Stop typing
      const socket = getSocket();
      socket.emit('typing:stop', {
        conversation_id: conversation.id,
        sender_id: activeUserId,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 7. Translate Message with Gemini
  const handleTranslateMessage = async (msgId: string, content: string) => {
    if (translationsMap[msgId]) {
      setTranslationsMap((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }

    setIsTranslating((prev) => ({ ...prev, [msgId]: true }));
    try {
      const res = await api.translateText(content, currentLanguage);
      setTranslationsMap((prev) => ({ ...prev, [msgId]: res.translatedText }));
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isExternal = otherUser.source_type === 'external';

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden shadow-2xl relative">
      
      {/* Lightbox Modal for Fullscreen Images */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <a
              href={lightboxImage}
              download="downloaded-image"
              className="p-2 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition"
              title="Download Photo"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="p-2 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={lightboxImage}
            alt="Expanded Attachment"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Chat Top Header */}
      <div className="px-4 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onViewProfile(otherUser)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={otherUser.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover border border-rose-500/30 group-hover:border-rose-500 transition"
                referrerPolicy="no-referrer"
              />
              {otherUser.is_online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-900" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm group-hover:text-rose-400 transition font-serif">
                  {otherUser.name}
                </span>
                <span className="text-xs text-stone-400">{otherUser.age}</span>
                {isExternal ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                    Partner
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-semibold">
                    Member
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                {isTyping ? (
                  <span className="text-rose-400 font-semibold animate-pulse">
                    typing...
                  </span>
                ) : otherUser.is_online ? (
                  <span className="text-emerald-400">{t('onlineNow')}</span>
                ) : (
                  `${otherUser.city}, ${otherUser.country}`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions: Call triggers, More menu */}
        <div className="flex items-center gap-1.5 relative">
          {!isExternal && (
            <>
              <button
                onClick={() => onInitiateCall(otherUser.id || otherUser.user_id || '', 'voice')}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-emerald-400 transition active:scale-95 shadow-sm"
                title={t('startVoiceCall')}
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => onInitiateCall(otherUser.id || otherUser.user_id || '', 'video')}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-rose-400 transition active:scale-95 shadow-sm"
                title={t('startVideoCall')}
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          {/* More options dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-stone-950 rounded-xl shadow-2xl border border-stone-800 py-1 z-50 animate-in fade-in">
                <button
                  onClick={() => {
                    onViewProfile(otherUser);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    onReportUser(otherUser);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-stone-800 flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t('report')}
                </button>
                {conversation.match_id && (
                  <button
                    onClick={() => {
                      onUnmatch(conversation.match_id!);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-stone-800 flex items-center gap-2 border-t border-stone-800"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    {t('unmatch')}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* External Partner Guard Notice if External */}
      {isExternal && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>This is a syndicated partner profile from {otherUser.provider_name}.</span>
          </div>
          {otherUser.external_profile_url && (
            <a
              href={otherUser.external_profile_url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded bg-amber-500 text-stone-950 font-bold text-[11px] flex items-center gap-1 hover:bg-amber-400"
            >
              <span>{t('viewOnPartner')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-stone-400 space-y-2">
            <Sparkles className="w-8 h-8 text-rose-500/50" />
            <p className="text-xs font-semibold text-stone-300">{t('startConversation')}</p>
            <p className="text-[11px] text-stone-500 max-w-xs">
              Send a text, photo, video, audio note, or document to start chatting!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === activeUserId;
            const hasTranslation = Boolean(translationsMap[msg.id] || msg.translated_text);
            const translatedText = translationsMap[msg.id] || msg.translated_text;
            const attachmentUrl = msg.attachment?.url || msg.attachment_url;
            const msgType = msg.message_type || (attachmentUrl ? 'image' : 'text');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 relative group shadow-md space-y-2 ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-none'
                      : 'bg-stone-800 text-stone-100 border border-stone-700/80 rounded-bl-none'
                  }`}
                >
                  
                  {/* Render Image Attachment */}
                  {msgType === 'image' && attachmentUrl && (
                    <div className="relative rounded-xl overflow-hidden bg-black/20 group/img cursor-pointer max-w-sm">
                      <img
                        src={attachmentUrl}
                        alt="Attachment"
                        onClick={() => setLightboxImage(attachmentUrl)}
                        className="w-full max-h-72 object-cover rounded-xl hover:scale-[1.02] transition duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => setLightboxImage(attachmentUrl)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition shadow-md"
                        title="Expand Image"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Render Video Attachment */}
                  {msgType === 'video' && attachmentUrl && (
                    <div className="rounded-xl overflow-hidden bg-black/40 max-w-sm">
                      <video
                        src={attachmentUrl}
                        controls
                        playsInline
                        className="w-full max-h-72 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Render Audio / Voice Note */}
                  {msgType === 'audio' && attachmentUrl && (
                    <div className="p-2 rounded-xl bg-black/30 flex items-center gap-3 min-w-[220px]">
                      <div className="p-2 rounded-full bg-rose-500 text-white shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <audio src={attachmentUrl} controls className="w-full h-8" />
                      </div>
                    </div>
                  )}

                  {/* Render File / Document Attachment */}
                  {msgType === 'file' && attachmentUrl && (
                    <div className="p-2.5 rounded-xl bg-black/30 flex items-center justify-between gap-3 border border-white/10">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold truncate text-white">{msg.file_name || 'Document'}</p>
                          {msg.file_size && (
                            <p className="text-[10px] text-white/60">{formatFileSize(msg.file_size)}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={attachmentUrl}
                        download={msg.file_name || 'attachment'}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Text Message Content (if not just media filename) */}
                  {msg.content && (msgType === 'text' || (msg.content !== msg.file_name && msg.content !== 'attachment')) && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}

                  {/* Gemini AI Translation Box if available */}
                  {hasTranslation && (
                    <div className="pt-2 border-t border-white/20 text-[11px] bg-black/20 p-2 rounded-lg">
                      <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold mb-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI Translation:
                      </div>
                      <p className="italic text-stone-200">{translatedText}</p>
                    </div>
                  )}

                  {/* Footer info: time, read status, translate button */}
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/60 pt-0.5">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Instant Translate Trigger */}
                    {!isMe && msg.content && (
                      <button
                        onClick={() => handleTranslateMessage(msg.id, msg.content)}
                        disabled={isTranslating[msg.id]}
                        className="hover:text-white transition flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded text-[9px] font-semibold ml-1"
                        title={t('translateWithAi')}
                      >
                        {isTranslating[msg.id] ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Languages className="w-2.5 h-2.5 text-sky-300" />
                        )}
                        <span>{hasTranslation ? 'Original' : t('translateWithAi')}</span>
                      </button>
                    )}

                    {/* Read Receipts Status */}
                    {isMe && (
                      <span className="ml-1" title={msg.read_at ? `Read at ${new Date(msg.read_at).toLocaleTimeString()}` : msg.delivered_at ? 'Delivered' : 'Sent'}>
                        {msg.read_at ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                        ) : msg.delivered_at ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/60" />
                        )}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Indicator Bouncing Bubbles */}
        {isTyping && (
          <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-stone-700 bg-stone-800">
              <img
                src={otherUser.photos?.[0]}
                alt={otherUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-3 py-2 rounded-2xl rounded-bl-none bg-stone-800 border border-stone-700/60 flex items-center gap-1.5 shadow-sm">
              <span className="text-[11px] text-stone-300 font-medium">{typingUserName || otherUser.name} is typing</span>
              <div className="flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachment Preview Bar (WhatsApp Style) */}
      {pendingAttachment && (
        <div className="px-4 py-2 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            {pendingAttachment.type === 'image' ? (
              <img
                src={pendingAttachment.previewUrl}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover border border-stone-700 shadow"
              />
            ) : pendingAttachment.type === 'video' ? (
              <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-rose-400">
                <Film className="w-6 h-6" />
              </div>
            ) : pendingAttachment.type === 'audio' ? (
              <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-purple-400">
                <Music className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-sky-400">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{pendingAttachment.filename}</p>
              <p className="text-[10px] text-stone-400">{formatFileSize(pendingAttachment.size)} • Ready to send</p>
            </div>
          </div>

          <button
            onClick={() => setPendingAttachment(null)}
            className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white transition"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.zip,.txt"
        className="hidden"
      />

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-stone-900/90 border-t border-stone-800 flex items-center gap-2">
        {/* Attachment Options Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-rose-400 transition shadow-sm"
          title="Attach Photo, Video, Audio or Document"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Quick Photo Button */}
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*';
              fileInputRef.current.click();
            }
          }}
          className="p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-pink-400 transition shadow-sm hidden sm:block"
          title="Send Photo"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          placeholder={pendingAttachment ? 'Add a caption (optional)...' : t('typeMessage')}
          className="flex-1 bg-stone-800 border border-stone-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-rose-500 transition"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputVal.trim() && !pendingAttachment) || isSending}
          className="p-2.5 sm:px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold transition shadow-lg shadow-rose-900/30 flex items-center gap-1.5 active:scale-95"
          title="Send"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Send</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
};
