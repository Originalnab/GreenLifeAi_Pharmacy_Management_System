import React, { useState, useRef } from 'react';
import { 
  X, User as UserIcon, Camera, KeyRound, Shield, 
  Calendar, Phone, Mail, CheckCircle2, AlertCircle, 
  Upload, Trash2, Check, Lock, Eye, EyeOff, Award, Building2 
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'avatar' | 'security' | 'access';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200', // Female doctor
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', // Male doctor
  'https://images.unsplash.com/photo-1594824813589-3221b6d0c644?auto=format&fit=crop&q=80&w=200', // Female pharmacist
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', // Male professional
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200', // Healthcare pro
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { currentUser, updateUserProfile, changeUserPassword, getUserAuthorization, formatCurrency, toast } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'security' | 'access'>(initialTab);

  // Profile Form States
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [middleName, setMiddleName] = useState(currentUser.middleName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(currentUser.alternatePhone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Avatar States
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!isOpen) return null;

  const authLimits = getUserAuthorization(currentUser.id);

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      dob,
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      email: email.trim(),
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Handle Image File Upload (Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Image file size must be under 2MB.', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Avatar Save
  const handleSaveAvatar = () => {
    updateUserProfile(currentUser.id, { avatarUrl });
    setAvatarSuccess(true);
    toast.success('Profile avatar updated successfully.', 'Avatar Saved');
    setTimeout(() => setAvatarSuccess(false), 3000);
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    const result = changeUserPassword(currentUser.id, currentPassword, newPassword);
    if (!result.success) {
      setPasswordError(result.error || 'Failed to update password.');
    } else {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    }
  };

  const userInitials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header with User Info */}
        <div className="bg-gradient-to-r from-brand-600 to-clinical-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold border-2 border-white/40 shadow-inner">
                  {userInitials}
                </div>
              )}
              <button
                onClick={() => setActiveTab('avatar')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white text-brand-600 rounded-full shadow hover:bg-slate-100 transition"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black">{currentUser.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30 text-white">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">@{currentUser.username} • {currentUser.email}</p>
              <div className="flex items-center space-x-3 text-[11px] text-white/70 mt-1.5">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>{currentUser.branchName}</span>
                </span>
                {currentUser.licenseNumber && (
                  <span className="flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>PCN: {currentUser.licenseNumber}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Personal Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('avatar')}
            className={`py-3 px-3.5 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'avatar'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Profile Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3.5 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'security'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`py-3 px-3.5 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'access'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role & Limits</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Your personal profile was updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth (Calendar Picker)
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Telephone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+233 24 123 4567"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alternate Telephone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={e => setAlternatePhone(e.target.value)}
                      placeholder="+233 20 987 6543"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition"
                >
                  Save Personal Details
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PROFILE AVATAR PHOTO */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {avatarSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Profile avatar updated successfully!</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center text-3xl font-extrabold border-4 border-white dark:border-slate-700 shadow-lg">
                      {userInitials}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">Profile Photo & Identity</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Upload a high-resolution portrait or pick from modern medical healthcare avatars. JPG, PNG or WebP (max 2MB).
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center space-x-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatars Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Or Select from Healthcare Avatar Presets
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {PRESET_AVATARS.map((preset, index) => {
                    const isSelected = avatarUrl === preset;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition group ${
                          isSelected
                            ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105'
                            : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset}
                          alt={`Preset avatar ${index + 1}`}
                          className="w-full h-16 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand-600/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition"
                >
                  Save Profile Photo
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Password updated successfully! Your new password is now active.</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ACCESS & LIMITS */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Clinical & System Permissions
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned System Role</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currentUser.role}</p>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Operating Branch</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{currentUser.branchName}</p>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Max Line Discount</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {authLimits.maxDiscountPercent}%
                    </p>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Max Single Refund Ceiling</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(authLimits.maxRefundLimit)}
                    </p>
                  </div>
                </div>

                {currentUser.licenseNumber && (
                  <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/60 text-brand-900 dark:text-brand-200 flex items-center space-x-2">
                    <Award className="w-4 h-4 text-brand-600" />
                    <div>
                      <span className="font-bold">PCN / Practice License: </span>
                      <span className="font-mono">{currentUser.licenseNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
