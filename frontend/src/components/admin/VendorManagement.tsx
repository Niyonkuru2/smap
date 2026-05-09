// VendorManagement.tsx
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
import { Plus, Pencil, Trash2, Store, Mail, Phone, MapPin, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
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
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
          totalProducts: vendor.totalProducts || 0
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
      // Filter only vendor/business categories
      const vendorCategories = allCategories.filter(c => c.type === 'vendor' || c.type === 'business');
      setCategories(vendorCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't show error toast for categories - they're optional
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{t('vendorManagement') || 'Vendor Management'}</h2>
          <p className="text-muted-foreground mt-1">{t('manageVendorsDesc') || 'Manage vendor profiles, approvals, and performance'}</p>
        </div>
        <Button onClick={handleAddVendor} className="btn-premium">
          <Plus className="h-4 w-4 mr-2" />
          {t('addVendor') || 'Add Vendor'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalVendors') || 'Total Vendors'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activeVendors') || 'Active Vendors'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{vendors.filter(v => v.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pendingApproval') || 'Pending Approval'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{vendors.filter(v => v.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('inactiveVendors') || 'Inactive Vendors'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{vendors.filter(v => v.status === 'inactive').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card className="dark-glass border-white/10">
        <CardHeader>
          <CardTitle>{t('vendorList') || 'Vendor List'}</CardTitle>
          <CardDescription>{t('manageVendorsTableDesc') || 'View and manage all registered vendors'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>{t('vendor') || 'Vendor'}</TableHead>
                  <TableHead>{t('contact') || 'Contact'}</TableHead>
                  <TableHead>{t('category') || 'Category'}</TableHead>
                  <TableHead>{t('status') || 'Status'}</TableHead>
                  <TableHead>{t('products') || 'Products'}</TableHead>
                  <TableHead>{t('rating') || 'Rating'}</TableHead>
                  <TableHead>{t('actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="icon-container">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">Joined: {vendor.joinDate}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {vendor.category ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {vendor.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                    <TableCell className="font-medium text-white">{vendor.totalProducts}</TableCell>
                    <TableCell>
                      {vendor.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white">{vendor.rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                          className="h-8 w-8 p-0 hover:bg-white/10"
                          title="Edit vendor"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="h-8 w-8 p-0 hover:bg-red-500/10"
                          title="Delete vendor"
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

          {vendors.length === 0 && (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-white">No vendors found</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Vendor" to create your first vendor</p>
            </div>
          )}
        </CardContent>
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
            {/* Vendor Name */}
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

            {/* Email */}
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

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Phone</Label>
              <Input
                placeholder="+250 XXX XXX XXX"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-white font-medium">Address</Label>
              <Input
                placeholder="Enter business address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            {/* Category */}
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

            {/* Status */}
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
              className="btn-premium flex-1 sm:flex-none"
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
    </div>
  );
}