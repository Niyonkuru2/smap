// BusinessUserManagement.tsx - Updated to use API
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Plus, Pencil, Trash2, Briefcase, Mail, Phone, MapPin, 
  CheckCircle, XCircle, Building2, User, Calendar, 
  TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw
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
  const [editingBusiness, setEditingBusiness] = useState<BusinessUser | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<BusinessUser | null>(null);
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

  const handleDeleteBusiness = async (businessId: string) => {
    if (window.confirm('Are you sure you want to delete this business user?')) {
      try {
        await deleteBusiness(businessId);
        toast.success('Business user deleted successfully');
        await fetchBusinesses();
        await fetchStats();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete business');
      }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Business User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage business accounts, track performance, and approve registrations
          </p>
        </div>
        <Button onClick={handleAddBusiness} className="btn-premium">
          <Plus className="h-4 w-4 mr-2" />
          Add Business User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_businesses || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats?.active_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats?.pending_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premium Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(stats?.premium_count || 0) + (stats?.enterprise_count || 0)}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats?.total_revenue || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="dark-glass border-white/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by business name, owner, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
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
        </CardContent>
      </Card>

      {/* Business Users Table */}
      <Card className="dark-glass border-white/10">
        <CardHeader>
          <CardTitle>Business Directory</CardTitle>
          <CardDescription>View and manage all registered business users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id} className="border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => handleViewBusiness(business)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="icon-container">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{business.businessName}</div>
                          <div className="text-xs text-muted-foreground">ID: {business.registrationNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{business.ownerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {business.businessType || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTierBadge(business.tier)}</TableCell>
                    <TableCell>{getStatusBadge(business.status)}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-emerald-400">
                        {formatCurrency(business.totalSpent)}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBusiness(business)}
                          className="h-8 w-8 p-0 hover:bg-white/10"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBusiness(business.id)}
                          className="h-8 w-8 p-0 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-white">No businesses found</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Business User" to create one</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Business Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px] md:max-w-[550px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-inherit pb-4 border-b border-white/10">
            <DialogTitle className="gradient-text text-xl">
              {editingBusiness ? 'Edit Business User' : 'Add New Business User'}
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
              className="btn-outline-premium flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBusiness} 
              disabled={isSaving}
              className="btn-premium flex-1 sm:flex-none"
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
                  <p className="text-muted-foreground">Registered: {viewingBusiness.joinDate || 'N/A'}</p>
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
                      <span className="text-yellow-400">★</span>
                      <span className="text-yellow-400">★</span>
                      <span className="text-yellow-400">★</span>
                      <span className="text-yellow-400">★</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="text-xl font-bold text-white">{viewingBusiness.rating || 'N/A'}</p>
                  </div>
                </div>
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
    </div>
  );
}