import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Mail, Shield, MapPin, Building2, Edit2, Save, X, Lock, Camera, Phone } from 'lucide-react';
import type { User as UserType } from '../../App';
import { updateProfile, changePassword } from '../../lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useMarkets } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';

interface UserProfileProps {
  user: UserType;
  onUpdate?: (user: UserType) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const UPLOAD_URL = `${API_BASE_URL}/upload`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [phone, setPhone] = useState('');
  const [marketId, setMarketId] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    // Load saved avatar from localStorage or user data
    const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    } else if (user.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user.id]);

  const loadFullProfile = async () => {
    try {
      // Get current user data from backend
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: getAuthHeaders()
      });
      if (response.data && response.data.user) {
        setPhone(response.data.user.phone || '');
        setMarketId(response.data.user.market_id || '');
        setProvince(response.data.user.province || '');
        setDistrict(response.data.user.district || '');
        if (response.data.user.avatar_url) {
          setAvatarUrl(response.data.user.avatar_url);
          localStorage.setItem(`avatar_${user.id}`, response.data.user.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP images are allowed');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(`${UPLOAD_URL}/avatar`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success && response.data.url) {
        const imageUrl = response.data.url;
        setAvatarUrl(imageUrl);
        localStorage.setItem(`avatar_${user.id}`, imageUrl);
        
        // Update profile with avatar URL
        await updateProfile({ avatar_url: imageUrl });
        toast.success('Profile picture updated!');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    localStorage.removeItem(`avatar_${user.id}`);
    
    try {
      await updateProfile({ avatar_url: null });
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = { name };
      if (phone !== undefined) updateData.phone = phone;
      if (marketId !== undefined) updateData.market_id = marketId;
      if (province !== undefined) updateData.province = province;
      if (district !== undefined) updateData.district = district;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

      await updateProfile(updateData);

      toast.success('Profile updated successfully!');
      setEditing(false);

      if (onUpdate) {
        onUpdate({ ...user, name });
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
      case 'admin': return 'bg-gradient-to-r from-primary to-purple-600';
      case 'vendor': return 'bg-gradient-to-r from-emerald-500 to-teal-600';
      case 'business': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      case 'consumer': return 'bg-gradient-to-r from-slate-600 to-slate-700';
      default: return 'bg-secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'vendor': return <Building2 className="h-3 w-3" />;
      case 'business': return <Building2 className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-5">
              {/* Avatar with Upload */}
              <div className="relative group">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-primary/50"
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
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold gradient-text">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-white text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="block mt-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Remove picture
                  </button>
                )}
              </div>
            </div>

            {!editing && (
              <Button onClick={() => setEditing(true)} variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-white font-medium">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="mt-1.5 bg-white/10 border-white/10 text-white/70 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label className="text-white font-medium">Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 XXX XXX XXX"
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </div>

                {user.role === 'vendor' && (
                  <div>
                    <Label className="text-white font-medium">Primary Market</Label>
                    <Select value={marketId} onValueChange={setMarketId}>
                      <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent className="dark-glass border-white/10">
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
                  <Label className="text-white font-medium">Province</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent className="dark-glass border-white/10">
                      <SelectItem value="Kigali City">Kigali City</SelectItem>
                      <SelectItem value="Eastern">Eastern Province</SelectItem>
                      <SelectItem value="Western">Western Province</SelectItem>
                      <SelectItem value="Northern">Northern Province</SelectItem>
                      <SelectItem value="Southern">Southern Province</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">District</Label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g., Gasabo"
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={() => {
                    setEditing(false);
                    setName(user.name);
                    loadFullProfile();
                  }}
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium text-white">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-white">{user.email}</p>
                  </div>
                </div>

                {phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-white">{phone}</p>
                    </div>
                  </div>
                )}

                {marketId && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Market</p>
                      <p className="font-medium text-white">{getMarketName(marketId)}</p>
                    </div>
                  </div>
                )}

                {(province || district) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-white">
                        {province && province}
                        {district && `, ${district}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Security Card */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <div className="relative">
          <h3 className="text-lg font-semibold gradient-text mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Password</p>
              <p className="text-xs text-muted-foreground">Last changed: {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setPasswordDialogOpen(true)} 
    
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Change Password</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-white font-medium">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            <div>
              <Label className="text-white font-medium">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            <div>
              <Label className="text-white font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Change Password
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}