import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Plus, Pencil, Trash2, Store, Mail, Phone, MapPin, CheckCircle, XCircle, Loader2, RefreshCw, Calendar, Filter } from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor, type Vendor as APIVendor } from '../../services/vendorService';
import { getAllCategories, type Category } from '../../services/categoryService';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  category_id?: number;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  joinDate: string;
  totalProducts: number;
  is_active?: boolean;
  verified?: boolean;
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { t } = useLanguage();

  // Fetch vendors and categories from API
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchVendors(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const apiVendors = await getVendors();
      
      const mappedVendors: Vendor[] = apiVendors.map((vendor: APIVendor) => {
        let status: 'active' | 'inactive' | 'pending' = 'pending';
        if (vendor.is_active === true && vendor.verified === true) {
          status = 'active';
        } else if (vendor.is_active === false) {
          status = 'inactive';
        } else if (vendor.is_active === true && vendor.verified === false) {
          status = 'pending';
        }

        return {
          id: vendor.id?.toString() || '',
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone || '',
          address: vendor.address || '',
          category: vendor.category || '',
          status: status,
          rating: vendor.rating || 0,
          joinDate: vendor.created_at ? new Date(vendor.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          totalProducts: vendor.totalProducts || 0,
          is_active: vendor.is_active,
          verified: vendor.verified
        };
      });
      
      setVendors(mappedVendors);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast.error(error.response?.data?.message || 'Failed to load vendors');
    }
  };

  const fetchCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      const vendorCategories = allCategories.filter(c => c.type === 'vendor' || c.type === 'business');
      setCategories(vendorCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      status: 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setIsDialogOpen(true);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (window.confirm(t('confirmDeleteVendor') || 'Are you sure you want to delete this vendor?')) {
      try {
        await deleteVendor(vendorId);
        toast.success('Vendor deleted successfully');
        await fetchVendors();
      } catch (error: any) {
        console.error('Error deleting vendor:', error);
        toast.error(error.response?.data?.message || 'Failed to delete vendor');
      }
    }
  };

  const handleSaveVendor = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const vendorData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        category: formData.category,
        status: formData.status
      };

      if (editingVendor) {
        await updateVendor(editingVendor.id, vendorData);
        toast.success('Vendor updated successfully');
      } else {
        await createVendor(vendorData);
        toast.success('Vendor added successfully');
      }
      
      setIsDialogOpen(false);
      setEditingVendor(null);
      setFormData({});
      await fetchVendors();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error(error.response?.data?.message || (editingVendor ? 'Failed to update vendor' : 'Failed to add vendor'));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: Vendor['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><RefreshCw className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
    
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const filteredVendors = vendors
    .filter(v => statusFilter === 'all' || v.status === statusFilter)
    .filter(v => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        v.name.toLowerCase().includes(search) ||
        v.email.toLowerCase().includes(search) ||
        v.phone.includes(search) ||
        v.category.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading vendors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold gradient-text text-xl mb-1">Vendor Management</h2>
            <p className="text-sm text-muted-foreground">Manage vendor profiles, approvals, and performance</p>
          </div>
          <Button onClick={handleAddVendor} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-xl font-semibold text-white">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Vendors</p>
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
              placeholder="Search by name, email, phone, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-muted-foreground font-medium text-sm">Vendor</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Contact</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Category</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Status</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Products</th>
                <th className="p-4 text-muted-foreground font-medium text-sm">Joined</th>
                <th className="p-4 text-muted-foreground font-medium text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No vendors found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-semibold shadow-sm">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{vendor.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {vendor.category ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {vendor.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-white">{vendor.totalProducts}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground" title={formatDate(vendor.joinDate)}>
                        <Calendar className="h-3 w-3" />
                        <span>{getTimeAgo(vendor.joinDate)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditVendor(vendor)}
                          className="hover:bg-white/10 h-8 w-8 p-0"
                          title="Edit vendor"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="hover:bg-red-500/10 h-8 w-8 p-0"
                          title="Delete vendor"
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

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px] md:max-w-[550px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-inherit pb-4 border-b border-white/10">
            <DialogTitle className="gradient-text text-xl">
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingVendor ? 'Update vendor information' : 'Fill in the vendor details below'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4 px-1">
            <div className="space-y-2">
              <Label className="text-white font-medium">
                Vendor Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="Enter vendor name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                placeholder="vendor@example.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Phone</Label>
              <Input
                placeholder="+250 XXX XXX XXX"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Address</Label>
              <Input
                placeholder="Enter business address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Category</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Groceries">Groceries</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Home & Living">Home & Living</SelectItem>
                      <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="Hospitality">Hospitality</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Select a business category</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Status</Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={(value: Vendor['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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
              onClick={handleSaveVendor} 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingVendor ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingVendor ? 'Update Vendor' : 'Add Vendor'
              )}
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