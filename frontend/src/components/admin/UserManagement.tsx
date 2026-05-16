import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, Users, Edit2, Trash2, Filter, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { adminGetUsers, adminUpdateRole, adminDeleteUser } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  market_id: string | null;
  province: string | null;
  district: string | null;
  verified: boolean;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
    loadUsers();

    // Refresh every 30 seconds
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminGetUsers();
      // Handle both possible response structures
      let usersData = [];
      if (response.users) {
        usersData = response.users;
      } else if (response.data) {
        usersData = response.data;
      } else if (Array.isArray(response)) {
        usersData = response;
      }
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await adminUpdateRole(selectedUser.id.toString(), newRole);
      toast.success(`User role updated to ${newRole}!`);
      setEditDialogOpen(false);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminDeleteUser(selectedUser.id.toString());
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

  const getStatusBadge = (isActive: boolean, verified: boolean) => {
    if (isActive && verified) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>;
    } else if (isActive && !verified) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>;
    }
  };

  const getUserInitialColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-br from-primary/80 to-primary';
      case 'vendor': return 'bg-gradient-to-br from-emerald-500/80 to-emerald-600';
      case 'business': return 'bg-gradient-to-br from-blue-500/80 to-blue-600';
      case 'consumer': return 'bg-gradient-to-br from-purple-500/80 to-purple-600';
      default: return 'bg-gradient-to-br from-slate-500/80 to-slate-600';
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

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const filteredUsers = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search) ||
        (u.phone && u.phone.includes(search))
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    vendors: users.filter(u => u.role === 'vendor').length,
    businesses: users.filter(u => u.role === 'business').length,
    consumers: users.filter(u => u.role === 'consumer').length,
    active: users.filter(u => u.is_active && u.verified).length,
    pending: users.filter(u => u.is_active && !u.verified).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold gradient-text text-xl mb-1">User Management</h2>
            <p className="text-sm text-muted-foreground">Manage user accounts, roles, and permissions</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-white">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-primary">{stats.admins}</p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-emerald-400">{stats.vendors}</p>
          <p className="text-xs text-muted-foreground">Vendors</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-blue-400">{stats.businesses}</p>
          <p className="text-xs text-muted-foreground">Businesses</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-purple-400">{stats.consumers}</p>
          <p className="text-xs text-muted-foreground">Consumers</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-emerald-400">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-red-400">{stats.inactive}</p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="business">Businesses</SelectItem>
              <SelectItem value="consumer">Consumers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-muted-foreground font-medium text-sm">User</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Contact</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Role</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Joined</th>
                <th className="p-4 text-muted-foreground font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No users found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getUserInitialColor(user.role)} flex items-center justify-center text-white font-semibold shadow-sm`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">📧 {user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">📞 {user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user.is_active, user.verified)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground" title={formatDate(user.created_at)}>
                        <Calendar className="h-3 w-3" />
                        <span>{getTimeAgo(user.created_at)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-white/10 h-8 w-8 p-0"
                          title="Edit role"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} 
                          className="hover:bg-red-500/10 h-8 w-8 p-0"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Change User Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Current Role</Label>
              <Badge className={getRoleBadgeColor(selectedUser?.role || '')}>
                {selectedUser?.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-white">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="btn-outline-premium">
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} className="bg-primary hover:bg-primary/90">
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Delete User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className={`w-10 h-10 rounded-full ${getUserInitialColor(selectedUser.role)} flex items-center justify-center text-white font-semibold`}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {selectedUser.role}</p>
                </div>
              </div>
              <p className="text-sm text-red-400">
                Warning: This will permanently delete the user account and all associated data.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="btn-outline-premium">
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              Delete User
            </Button>
          </DialogFooter>
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

        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}