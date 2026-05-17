import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Plus, Pencil, Trash2, Briefcase, Mail, Phone, Building2, User, Calendar, 
  TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw, Search, Filter,
  CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessStats,
  formatCurrency,
  getBusinessStatusColor,
  getTierColor,
  type BusinessUser,
  type BusinessStats
} from '../../services/businessService';
import { getAllCategories, type Category } from '../../services/categoryService';

export default function BusinessUserManagement() {
  const { t } = useLanguage();
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessUser | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<BusinessUser | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessUser | null>(null);
  const [formData, setFormData] = useState<Partial<BusinessUser>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchBusinesses(),
        fetchCategories(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await getAllBusinesses();
      setBusinessUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load businesses');
    }
  };

  const fetchCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      const businessCategories = allCategories.filter(c => c.type === 'business');
      setCategories(businessCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getBusinessStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddBusiness = () => {
    setEditingBusiness(null);
    setFormData({
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      businessType: '',
      registrationNumber: '',
      taxId: '',
      status: 'pending',
      tier: 'basic'
    });
    setIsDialogOpen(true);
  };

  const handleEditBusiness = (business: BusinessUser) => {
    setEditingBusiness(business);
    setFormData(business);
    setIsDialogOpen(true);
  };

  const handleViewBusiness = (business: BusinessUser) => {
    setViewingBusiness(business);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (business: BusinessUser) => {
    setDeletingBusiness(business);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBusiness = async () => {
    if (!deletingBusiness) return;

    try {
      await deleteBusiness(deletingBusiness.id);
      toast.success('Business user deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingBusiness(null);
      await fetchBusinesses();
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete business');
    }
  };

  const handleSaveBusiness = async () => {
    if (!formData.businessName || !formData.email || !formData.ownerName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBusiness) {
        await updateBusiness(editingBusiness.id, {
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          address: formData.address,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          taxId: formData.taxId,
          tier: formData.tier,
          status: formData.status
        });
        toast.success('Business user updated successfully');
      } else {
        await createBusiness({
          businessName: formData.businessName!,
          ownerName: formData.ownerName!,
          email: formData.email!,
          phone: formData.phone,
          address: formData.address,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          taxId: formData.taxId,
          tier: formData.tier || 'basic',
          status: formData.status || 'pending'
        });
        toast.success('Business user added successfully');
      }
      
      setIsDialogOpen(false);
      setEditingBusiness(null);
      setFormData({});
      await fetchBusinesses();
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingBusiness ? 'Failed to update business' : 'Failed to add business'));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: BusinessUser['status']) => {
    const color = getBusinessStatusColor(status);
    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      pending: <RefreshCw className="h-3 w-3 mr-1" />,
      inactive: <XCircle className="h-3 w-3 mr-1" />,
      suspended: <AlertCircle className="h-3 w-3 mr-1" />
    };
    
    return (
      <Badge className={color}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTierBadge = (tier: BusinessUser['tier']) => {
    const color = getTierColor(tier);
    return <Badge className={color}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>;
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
    
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const filteredBusinesses = businessUsers
    .filter(b => statusFilter === 'all' || b.status === statusFilter)
    .filter(b => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        b.businessName.toLowerCase().includes(search) ||
        b.ownerName.toLowerCase().includes(search) ||
        b.email.toLowerCase().includes(search) ||
        b.businessType.toLowerCase().includes(search)
      );
    });

  const statsData = {
    total: stats?.total_businesses || 0,
    active: stats?.active_count || 0,
    pending: stats?.pending_count || 0,
    premium: (stats?.premium_count || 0) + (stats?.enterprise_count || 0),
    revenue: stats?.total_revenue || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading businesses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold gradient-text text-xl mb-1">Business User Management</h2>
            <p className="text-sm text-muted-foreground">Manage business accounts, track performance, and approve registrations</p>
          </div>
          <Button onClick={handleAddBusiness} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-white">{statsData.total}</p>
          <p className="text-xs text-muted-foreground">Total Businesses</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-emerald-400">{statsData.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-yellow-400">{statsData.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-primary">{statsData.premium}</p>
          <p className="text-xs text-muted-foreground">Premium</p>
        </Card>
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-white">{formatCurrency(statsData.revenue)}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by business name, owner, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Business Users Table */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-muted-foreground font-medium text-sm">Business</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Owner</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Contact</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Type</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Tier</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Joined</th>
                <th className="p-4 text-muted-foreground font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No businesses found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr 
                    key={business.id} 
                    className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleViewBusiness(business)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-semibold shadow-sm">
                          {business.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{business.businessName}</p>
                          <p className="text-xs text-muted-foreground">ID: {business.registrationNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{business.ownerName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{business.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{business.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {business.businessType ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {business.businessType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getTierBadge(business.tier)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(business.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground" title={formatDate(business.joinDate || business.created_at || '')}>
                        <Calendar className="h-3 w-3" />
                        <span>{getTimeAgo(business.joinDate || business.created_at || '')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditBusiness(business)}
                          className="hover:bg-white/10 h-8 w-8 p-0"
                          title="Edit business"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteClick(business)}
                          className="hover:bg-red-500/10 h-8 w-8 p-0"
                          title="Delete business"
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

      {/* Add/Edit Business Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px] md:max-w-[550px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-inherit pb-4 border-b border-white/10">
            <DialogTitle className="gradient-text text-xl">
              {editingBusiness ? 'Edit Business' : 'Add New Business'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the business details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4 px-1">
            <div className="space-y-2">
              <Label className="text-white font-medium">Business Name *</Label>
              <Input
                placeholder="Enter registered business name"
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Owner Name *</Label>
              <Input
                placeholder="Enter owner's full name"
                value={formData.ownerName || ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Email *</Label>
              <Input
                type="email"
                placeholder="business@example.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Phone</Label>
              <Input
                placeholder="+250 XXX XXX XXX"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Address</Label>
              <Input
                placeholder="Enter business address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium">Business Type</Label>
                <Select
                  value={formData.businessType || ''}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark-glass border-white/10">
                    <SelectItem value="Agriculture">Agriculture</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Hospitality">Hospitality</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Tier</Label>
                <Select
                  value={formData.tier || 'basic'}
                  onValueChange={(value: BusinessUser['tier']) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark-glass border-white/10">
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium">Registration Number</Label>
                <Input
                  placeholder="REG-XXXXX"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Tax ID</Label>
                <Input
                  placeholder="TAX-XXXXX"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Status</Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={(value: BusinessUser['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-inherit pt-4 border-t border-white/10 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBusiness} 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingBusiness ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingBusiness ? 'Update Business' : 'Add Business'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Business Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[600px] w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-inherit pb-4 border-b border-white/10">
            <DialogTitle className="gradient-text text-xl">Business Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete business profile information
            </DialogDescription>
          </DialogHeader>
          
          {viewingBusiness && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{viewingBusiness.businessName}</h3>
                  <p className="text-muted-foreground">ID: {viewingBusiness.registrationNumber || 'N/A'}</p>
                </div>
                {getStatusBadge(viewingBusiness.status)}
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold gradient-text">Owner Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Owner Name</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.ownerName}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold gradient-text">Business Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Business Type</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.businessType || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="text-white font-medium mt-1">{getTierBadge(viewingBusiness.tier)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Registration Number</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.registrationNumber || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Tax ID</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.taxId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold gradient-text">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Total Purchases</p>
                    <p className="text-xl font-bold text-white">{viewingBusiness.totalPurchases}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(viewingBusiness.totalSpent)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="text-xl font-bold text-white">{viewingBusiness.rating || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Joined Date</p>
                <p className="text-white font-medium mt-1">{formatDate(viewingBusiness.joinDate || viewingBusiness.created_at || '')}</p>
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-inherit pt-4 border-t border-white/10">
            <Button onClick={() => setIsViewDialogOpen(false)} className="btn-premium w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="gradient-text flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Delete Business
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingBusiness && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">
                    Are you sure you want to delete {deletingBusiness.businessName}?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong className="text-white">{deletingBusiness.ownerName}</strong>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Email: {deletingBusiness.email} • Status: {deletingBusiness.status}
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-red-400">
                Warning: This will permanently delete the business account and all associated data.
              </p>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBusiness}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Business
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