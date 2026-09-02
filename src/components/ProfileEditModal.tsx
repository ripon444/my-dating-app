import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload, 
  Check, 
  Wand2, 
  Image as ImageIcon, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Phone, 
  MessageCircle,
  Loader2,
  Globe,
  Camera,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';
import { AiBioModal } from './AiBioModal';
import { useTranslation } from '../i18n/LanguageContext';

interface ProfileEditModalProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: Profile) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Profile>>(profile || {});
  
  // Photo management state
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoTab, setPhotoTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Cover photo management state
  const [coverTab, setCoverTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [isAiBioOpen, setIsAiBioOpen] = useState(false);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newLangInput, setNewLangInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when profile or modal opens
  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        ...profile,
        photos: profile.photos || [],
        interests: profile.interests || [],
        languages: profile.languages || [],
        cover_photo: profile.cover_photo || '',
      });
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  // Process and compress image to base64 Data URL
  const processImageFile = (file: File, maxDim = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Multiple / single photo upload from device
  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setErrorMessage('');
    try {
      const current = formData.photos || [];
      const slotsLeft = 6 - current.length;
      if (slotsLeft <= 0) {
        alert('Maximum 6 photos allowed. Please remove a photo first.');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, slotsLeft);
      const newUrls: string[] = [];
      for (const file of filesToProcess) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await processImageFile(file, 1000);
          newUrls.push(dataUrl);
        }
      }
      if (newUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...newUrls]
        }));
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  // Replace single photo slot
  const handleReplaceSinglePhoto = async (file: File, index: number) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const dataUrl = await processImageFile(file, 1000);
      setFormData(prev => {
        const photos = [...(prev.photos || [])];
        photos[index] = dataUrl;
        return { ...prev, photos };
      });
    } catch (err) {
      console.error('Replace photo error:', err);
    } finally {
      setIsUploading(false);
      setReplaceIndex(null);
    }
  };

  // Cover photo upload handler
  const handleCoverFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploadingCover(true);
    setErrorMessage('');
    try {
      const dataUrl = await processImageFile(file, 1400);
      setFormData(prev => ({ ...prev, cover_photo: dataUrl }));
    } catch (err: any) {
      console.error('Cover photo upload error:', err);
      setErrorMessage(err.message || 'Failed to process cover photo');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAddPhoto = () => {
    if (!photoUrlInput.trim()) return;
    const currentPhotos = formData.photos || [];
    if (currentPhotos.length >= 6) {
      alert('Maximum 6 photos allowed.');
      return;
    }
    setFormData({ ...formData, photos: [...currentPhotos, photoUrlInput.trim()] });
    setPhotoUrlInput('');
  };

  const handleSetMainPhoto = (index: number) => {
    const currentPhotos = [...(formData.photos || [])];
    if (index === 0 || index >= currentPhotos.length) return;
    const [selected] = currentPhotos.splice(index, 1);
    currentPhotos.unshift(selected);
    setFormData({ ...formData, photos: currentPhotos });
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = formData.photos || [];
    setFormData({ ...formData, photos: currentPhotos.filter((_, i) => i !== index) });
  };

  const handleAddInterest = () => {
    if (!newInterestInput.trim()) return;
    const current = formData.interests || [];
    if (!current.includes(newInterestInput.trim())) {
      setFormData({ ...formData, interests: [...current, newInterestInput.trim()] });
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (item: string) => {
    setFormData({
      ...formData,
      interests: (formData.interests || []).filter((i) => i !== item),
    });
  };

  const handleAddLanguage = () => {
    if (!newLangInput.trim()) return;
    const current = formData.languages || [];
    if (!current.includes(newLangInput.trim())) {
      setFormData({ ...formData, languages: [...current, newLangInput.trim()] });
    }
    setNewLangInput('');
  };

  const handleRemoveLanguage = (item: string) => {
    setFormData({
      ...formData,
      languages: (formData.languages || []).filter((l) => l !== item),
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.name.trim()) {
      setErrorMessage('Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const res = await api.updateProfile(formData);
      if (res && res.profile) {
        onProfileUpdated(res.profile);
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        throw new Error('Could not update profile');
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="bg-stone-900 w-full max-w-2xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFilesUpload(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={replaceFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && replaceIndex !== null) {
                handleReplaceSinglePhoto(e.target.files[0], replaceIndex);
              }
              e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={coverFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleCoverFileUpload(e.target.files[0]);
              }
              e.target.value = '';
            }}
          />

          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-serif">{t('editProfile') || 'Edit Profile'}</h2>
                <p className="text-[11px] text-stone-400">Update your photos, cover banner, name, bio, and preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
            
            {/* Error or Success notification */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Profile saved successfully!</span>
              </div>
            )}

            {/* 1. COVER PHOTO BANNER MANAGER */}
            <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  COVER PHOTO BANNER
                </label>
                <span className="text-[10px] text-stone-400">Facebook-style header banner</span>
              </div>

              {/* Cover Preview Area */}
              <div className="relative h-28 sm:h-36 w-full rounded-2xl overflow-hidden bg-stone-800 border border-stone-700 group">
                {formData.cover_photo ? (
                  <img
                    src={formData.cover_photo}
                    alt="Cover banner"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_COVERS[0];
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-rose-950/40 via-stone-900 to-pink-950/40 flex flex-col items-center justify-center text-stone-400 gap-1">
                    <Camera className="w-6 h-6 text-stone-500" />
                    <span className="text-xs">No custom cover banner set</span>
                  </div>
                )}

                {/* Quick overlay button */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                  >
                    {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload New Cover</span>
                  </button>
                  {formData.cover_photo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cover_photo: '' }))}
                      className="px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-red-600 text-stone-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Options Tabs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setCoverTab('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      coverTab === 'upload'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 bg-stone-800/60'
                    }`}
                  >
                    <Upload className="w-3 h-3" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverTab('presets')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      coverTab === 'presets'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 bg-stone-800/60'
                    }`}
                  >
                    <Star className="w-3 h-3" /> Preset Banners
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverTab('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      coverTab === 'url'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 bg-stone-800/60'
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Banner URL
                  </button>
                </div>

                {coverTab === 'upload' && (
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className="p-3.5 rounded-xl border-2 border-dashed border-stone-700 hover:border-rose-400 bg-stone-900/80 text-stone-300 text-center cursor-pointer transition flex items-center justify-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Click to select cover image from Computer or Mobile Gallery</p>
                      <p className="text-[11px] text-stone-400">JPG, PNG, WebP banner image</p>
                    </div>
                  </div>
                )}

                {coverTab === 'presets' && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_COVERS.map((presetUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, cover_photo: presetUrl }))}
                        className={`h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition hover:scale-105 ${
                          formData.cover_photo === presetUrl ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-stone-700 hover:border-stone-500'
                        }`}
                      >
                        <img src={presetUrl} alt="Preset cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                )}

                {coverTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={coverUrlInput}
                      onChange={(e) => setCoverUrlInput(e.target.value)}
                      placeholder="Paste cover banner image URL (e.g. https://...)"
                      className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (coverUrlInput.trim()) {
                          setFormData(prev => ({ ...prev, cover_photo: coverUrlInput.trim() }));
                          setCoverUrlInput('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400 border border-stone-700 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Check className="w-4 h-4" /> Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. PROFILE PHOTOS MANAGER */}
            <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                  PROFILE PHOTOS ({formData.photos?.length || 0}/6)
                </label>
                <span className="text-[11px] text-stone-400">
                  ★ First photo is your main avatar
                </span>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {(formData.photos || []).map((url, idx) => (
                  <div 
                    key={idx} 
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-800 border transition-all group ${
                      idx === 0 
                        ? 'border-rose-500 ring-2 ring-rose-500/30' 
                        : 'border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`Photo ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800';
                      }}
                    />

                    {/* Hover controls */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceIndex(idx);
                          replaceFileInputRef.current?.click();
                        }}
                        title="Upload new image to replace"
                        className="w-full py-1 rounded-md bg-stone-700 hover:bg-stone-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Upload className="w-2.5 h-2.5" /> Replace
                      </button>

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMainPhoto(idx)}
                          title="Set as Main Profile Picture"
                          className="w-full py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Star className="w-2.5 h-2.5 fill-white" /> Main
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        title="Remove photo"
                        className="w-full py-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Delete
                      </button>
                    </div>

                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-[9px] text-white font-bold shadow">
                        Main
                      </span>
                    )}
                  </div>
                ))}

                {/* Empty Slot / Quick Upload Button */}
                {(formData.photos?.length || 0) < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition flex flex-col items-center justify-center gap-1 text-rose-400 cursor-pointer group"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition">
                          <Plus className="w-4 h-4 text-rose-400" />
                        </div>
                        <span className="text-[10px] font-bold">Add Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Photo Input Selector: Upload File or URL Link */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setPhotoTab('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      photoTab === 'upload'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 bg-stone-800/60'
                    }`}
                  >
                    <Upload className="w-3 h-3" /> Upload from Computer / Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      photoTab === 'url'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 bg-stone-800/60'
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Paste Image URL Link
                  </button>
                </div>

                {photoTab === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
                    }}
                    className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isDragging 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-300' 
                        : 'border-stone-700 hover:border-rose-400 bg-stone-900/80 text-stone-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click to select image file or Drag & Drop here
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Supports JPG, PNG, WebP (from mobile gallery, camera or desktop)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                      className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400 border border-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. BASIC PROFILE INFO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300 flex items-center gap-1">
                  Full Display Name <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Date of Birth (18+)</label>
                <input
                  type="date"
                  value={formData.date_of_birth || '1998-01-01'}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Dhaka, New York, Tokyo"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Country</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g. Bangladesh, United States, Japan"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* 4. BIO WITH AI GENERATOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                  About Me / Bio
                </label>
                <button
                  type="button"
                  onClick={() => setIsAiBioOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Generate AI Bio</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Share your passions, vibe, and what makes you smile..."
                className="w-full bg-stone-800 border border-stone-700 rounded-2xl p-3.5 text-stone-100 text-xs leading-relaxed focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* 5. LIFESTYLE & PROFESSIONAL DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Profession</label>
                <input
                  type="text"
                  value={formData.profession || ''}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="e.g. Software Engineer, Doctor, Designer"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Education</label>
                <input
                  type="text"
                  value={formData.education || ''}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="e.g. University, Degree"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Relationship Goal</label>
                <select
                  value={formData.relationship_goal || 'Long-term relationship'}
                  onChange={(e) => setFormData({ ...formData, relationship_goal: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="Long-term partner">Long-term partner</option>
                  <option value="Long-term relationship">Long-term relationship</option>
                  <option value="Serious dating">Serious dating</option>
                  <option value="Marriage & Family">Marriage & Family</option>
                  <option value="Casual dating">Casual dating</option>
                  <option value="Open to explore">Open to explore</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-300">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  placeholder="e.g. 175"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* 6. INTERESTS & LANGUAGES CHIPS */}
            <div className="space-y-3">
              <label className="font-bold text-stone-200 uppercase tracking-wider text-[11px] block">
                Interests & Passions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(formData.interests || []).map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1.5 text-xs">
                    {interest}
                    <button type="button" onClick={() => handleRemoveInterest(interest)} className="text-stone-400 hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  placeholder="Add new interest..."
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 text-xs font-bold hover:bg-stone-700 transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 7. PRIVACY & CALL PERMISSIONS */}
            <div className="p-4 rounded-2xl bg-stone-800/40 border border-stone-700/60 space-y-3">
              <div className="font-bold text-stone-200 text-xs uppercase tracking-wider">
                Privacy & Calling Preferences
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-200">Show Age on Profile</div>
                  <div className="text-[10px] text-stone-400">Your exact birth date remains private</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.show_age !== false}
                  onChange={(e) => setFormData({ ...formData, show_age: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-200">Show Approximate Location</div>
                  <div className="text-[10px] text-stone-400">Displays "Near {formData.city || 'City'}"</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.show_approx_location !== false}
                  onChange={(e) => setFormData({ ...formData, show_approx_location: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-200">Allow Audio/Video Calls</div>
                  <div className="text-[10px] text-stone-400">Matched members can call you</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_calls !== false}
                  onChange={(e) => setFormData({ ...formData, allow_calls: e.target.checked })}
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-stone-800 bg-stone-900 flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-white transition text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* AI Bio Generator Sub-modal */}
      <AiBioModal
        isOpen={isAiBioOpen}
        onClose={() => setIsAiBioOpen(false)}
        interests={formData.interests || []}
        profession={formData.profession}
        relationshipGoal={formData.relationship_goal}
        onBioGenerated={(bio) => setFormData({ ...formData, bio })}
      />
    </>
  );
};
