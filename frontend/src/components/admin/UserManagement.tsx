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
      case 'admin': return 'bg-green-900 text-green-100 border-green-700';
      case 'vendor': return 'bg-green-900 text-green-100 border-green-700';
      case 'business': return 'bg-green-900 text-green-100 border-green-700';
      case 'consumer': return 'bg-green-900 text-green-100 border-green-700';
      default: return 'bg-secondary text-foreground border-accent';
    }
  };

  const getUserInitialColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-green-500';
      case 'vendor': return 'bg-green-500';
      case 'business': return 'bg-green-500';
      case 'consumer': return 'bg-green-500';
      default: return 'bg-secondary0';
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
      <Card className="p-6 rounded-2xl border border-green-700/50 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-green-900 mb-1">{t('users')}</h2>
            <p className="text-sm text-green-700">{t('searchUsers')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center rounded-xl border border-green-700 bg-green-950 shadow-sm">
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
        </Card>
        {/* ... stats display ... */}
      </div>

      <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-green-700 bg-green-950 text-green-100"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] border-green-700 bg-green-950 text-green-100">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allRoles')}</SelectItem>
              <SelectItem value="admin">{t('admins')}</SelectItem>
              <SelectItem value="vendor">{t('vendors')}</SelectItem>
              <SelectItem value="business">{t('businesses')}</SelectItem>
              <SelectItem value="consumer">{t('consumers')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="rounded-2xl border border-green-700/50 bg-green-950/80 backdrop-blur-sm shadow-[0_14px_32px_-22px_rgba(0,0,0,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-green-700 bg-green-900">
                <th className="p-4 text-muted-foreground">{t('user')}</th>
                <th className="p-4 text-muted-foreground">{t('role')}</th>
                <th className="p-4 text-muted-foreground">{t('joined')}</th>
                <th className="p-4 text-right text-muted-foreground">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const profilePic = getUserProfilePicture(user.id);
                return (
                <tr key={user.id} className="border-b border-green-700 hover:bg-green-900 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {profilePic ? (
                        <img 
                          src={profilePic} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${getUserInitialColor(user.role)} flex items-center justify-center text-white font-semibold shadow-sm`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} className="text-green-600 hover:text-green-800 hover:bg-green-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changeRole')}</DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('newRole')}</Label>
              <Select onValueChange={handleUpdateRole} defaultValue={selectedUser?.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('admins')}</SelectItem>
                  <SelectItem value="vendor">{t('vendors')}</SelectItem>
                  <SelectItem value="business">{t('businesses')}</SelectItem>
                  <SelectItem value="consumer">{t('consumers')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteUser')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User: <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {t('deleteUser')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

