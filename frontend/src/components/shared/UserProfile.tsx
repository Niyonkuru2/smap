import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Mail, Shield, MapPin, Building2, Edit2, Save, X, Lock, Camera } from 'lucide-react';
import type { User as UserType } from '../../App';
import { getProfile, updateProfile, changePassword } from '../../lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useMarkets } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserProfileProps {
  user: UserType;
  onUpdate?: (user: UserType) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [marketId, setMarketId] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { markets } = useMarkets();

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadFullProfile();
    // Load saved profile picture from localStorage
    const savedPicture = localStorage.getItem(`profile_picture_${user.id}`);
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, [user.id]);

  const loadFullProfile = async () => {
    try {
      const profile = await getProfile();
      setMarketId(profile.marketId || '');
      setProvince(profile.province || '');
      setDistrict(profile.district || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePicture(base64String);
        localStorage.setItem(`profile_picture_${user.id}`, base64String);
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    localStorage.removeItem(`profile_picture_${user.id}`);
    toast.success('Profile picture removed');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        name,
        email,
        marketId,
        province,
        district,
      });

      toast.success('Profile updated successfully!');
      setEditing(false);

      if (onUpdate) {
        onUpdate({ ...user, name, email });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);

      toast.success('Password changed successfully!');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getMarketName = (id: string) => {
    return markets.find(m => m.id === id)?.name || id;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-indigo-600 to-sky-600';
      case 'vendor': return 'bg-gradient-to-r from-emerald-600 to-teal-600';
      case 'business': return 'bg-gradient-to-r from-sky-600 to-blue-700';
      case 'consumer': return 'bg-gradient-to-r from-slate-700 to-slate-800';
      default: return 'bg-secondary0';
    }
  };

  // ... rest of the JSX stays the same
  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-green-700 bg-gradient-to-br from-green-900 to-green-950 backdrop-blur-sm shadow-[0_14px_34px_-22px_rgba(15,23,42,0.5)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Picture with Upload */}
            <div className="relative group">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full ${getRoleBadgeColor(user.role)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-slate-900/55 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-white text-sm ${getRoleBadgeColor(user.role)}`}>
                <Shield className="h-3 w-3" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              {profilePicture && (
                <button
                  onClick={handleRemoveProfilePicture}
                  className="block mt-2 text-xs text-green-600 hover:underline"
                >
                  {t('removePicture') || 'Remove picture'}
                </button>
              )}
            </div>
          </div>

          {!editing && (
            <Button onClick={() => setEditing(true)} variant="outline" className="h-8 px-2.5 text-xs border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
              <Edit2 className="h-4 w-4 mr-2" />
              {t('editProfile')}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white font-semibold">{t('fullName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white font-semibold">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
                />
                <p className="text-xs text-green-300 mt-1">
                  {t('forSMSVerification')}
                </p>
              </div>

              {user.role === 'vendor' && (
                <div>
                  <Label htmlFor="marketId" className="text-white font-semibold">{t('primaryMarket')}</Label>
                  <Select value={marketId} onValueChange={setMarketId}>
                    <SelectTrigger className="mt-1.5 border-green-600 bg-green-800 text-white">
                      <SelectValue placeholder={t('selectMarket')} />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map(market => (
                        <SelectItem key={market.id} value={market.id}>
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="province" className="text-white font-semibold">{t('province')}</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger className="mt-1.5 border-green-600 bg-green-800 text-white">
                    <SelectValue placeholder={t('allProvinces')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kigali">{t('kigaliCity')}</SelectItem>
                    <SelectItem value="eastern">{t('easternProvince')}</SelectItem>
                    <SelectItem value="western">{t('westernProvince')}</SelectItem>
                    <SelectItem value="northern">{t('northernProvince')}</SelectItem>
                    <SelectItem value="southern">{t('southernProvince')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="district" className="text-white font-semibold">{t('district')}</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g., Gasabo"
                  className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-green-700">
              <Button
                onClick={() => {
                  setEditing(false);
                  setName(user.name);
                  setEmail(user.email);
                }}
                variant="outline"
                className="h-8 px-2.5 text-xs border-green-700 bg-green-900 text-green-200 hover:bg-green-800"
              >
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading} className="h-8 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('loading') : t('saveChanges')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-300 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300">{t('email')}</p>
                  <p className="font-medium text-white">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-300 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300">{t('role')}</p>
                  <p className="font-medium capitalize text-white">{user.role}</p>
                </div>
              </div>

              {marketId && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-green-300 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-300">{t('primaryMarket')}</p>
                    <p className="font-medium text-white">{getMarketName(marketId)}</p>
                  </div>
                </div>
              )}

              {province && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-300 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-300">{t('location')}</p>
                    <p className="font-medium capitalize text-white">
                      {province.replace('_', ' ')}
                      {district && `, ${district}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-2xl border-green-700 bg-gradient-to-br from-green-900 to-green-950 backdrop-blur-sm shadow-[0_14px_34px_-22px_rgba(15,23,42,0.5)]">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-300" />
          {t('security')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-green-950 to-green-900 border border-green-700">
            <div>
              <p className="text-sm font-medium text-white">{t('password')}</p>
              <p className="text-xs text-green-400">{t('comingSoon')}</p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)} className="h-8 px-2.5 text-xs border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
              {t('changePassword')}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>
              {t('enterPassword')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="current-password" className="text-white font-semibold">{t('currentPassword')}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
              />
            </div>

            <div>
              <Label htmlFor="new-password" className="text-white font-semibold">{t('newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-white font-semibold">{t('confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 border-green-600 bg-green-800 text-white placeholder:text-green-300"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="flex-1 border-green-700 bg-green-900 text-green-200 hover:bg-green-800"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? t('loading') : t('changePassword')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

