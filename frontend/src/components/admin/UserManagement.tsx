import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Users, Shield, Mail, MapPin, Edit2, Trash2, Filter, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { adminGetUsers, adminUpdateRole, adminDeleteUser } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  marketId?: string;
  province?: string;
  district?: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadUsers();

    // Refresh every 30 seconds
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminGetUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUser) return;

    try {
      await adminUpdateRole(selectedUser.id, newRole);
      toast.success('User role updated successfully!');
      setEditDialogOpen(false);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminDeleteUser(selectedUser.id);
      toast.success('User deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/20 text-primary border-primary/30';
      case 'vendor': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'business': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'consumer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getUserInitialColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary';
      case 'vendor': return 'bg-emerald-500';
      case 'business': return 'bg-blue-500';
      case 'consumer': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const getUserProfilePicture = (userId: string) => {
    return localStorage.getItem(`profile_picture_${userId}`);
  };

  const filteredUsers = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search)
      );
    });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    vendors: users.filter(u => u.role === 'vendor').length,
    businesses: users.filter(u => u.role === 'business').length,
    consumers: users.filter(u => u.role === 'consumer').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold gradient-text mb-1">{t('users')}</h2>
            <p className="text-sm text-muted-foreground">{t('searchUsers')}</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-semibold text-white">{stats.total}</p>
          <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-semibold text-primary">{stats.admins}</p>
          <p className="text-sm text-muted-foreground">Admins</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-semibold text-emerald-400">{stats.vendors}</p>
          <p className="text-sm text-muted-foreground">Vendors</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-semibold text-blue-400">{stats.businesses}</p>
          <p className="text-sm text-muted-foreground">Businesses</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-semibold text-purple-400">{stats.consumers}</p>
          <p className="text-sm text-muted-foreground">Consumers</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
              <SelectItem value="all">{t('allRoles')}</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="business">Businesses</SelectItem>
              <SelectItem value="consumer">Consumers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-muted-foreground font-medium">{t('user')}</th>
                <th className="p-4 text-muted-foreground font-medium">{t('role')}</th>
                <th className="p-4 text-muted-foreground font-medium">{t('joined')}</th>
                <th className="p-4 text-right text-muted-foreground font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const profilePic = getUserProfilePicture(user.id);
                return (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {profilePic ? (
                          <img 
                            src={profilePic} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${getUserInitialColor(user.role)} flex items-center justify-center text-white font-semibold shadow-sm`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-white" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} 
                        className="hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="dark-glass border-white/10">
          <DialogHeader>
            <DialogTitle className="gradient-text">{t('changeRole')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">{t('newRole')}</Label>
              <Select onValueChange={handleUpdateRole} defaultValue={selectedUser?.role}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="dark-glass border-white/10">
          <DialogHeader>
            <DialogTitle className="gradient-text">{t('deleteUser')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('deleteConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User: <strong className="text-white">{selectedUser?.name}</strong> ({selectedUser?.email})
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="btn-outline-premium">
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              {t('deleteUser')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.2s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}