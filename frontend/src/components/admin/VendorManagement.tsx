// VendorManagement.tsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Pencil, Trash2, Store, Mail, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Toast } from '../ui/toast';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  joinDate: string;
  totalProducts: number;
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const { t } = useLanguage();

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Fetch vendors from API
    const mockVendors: Vendor[] = [
      {
        id: '1',
        name: 'Fresh Market Supplies',
        email: 'contact@freshmarket.com',
        phone: '+250 788 123 456',
        address: 'Kigali, Rwanda',
        category: 'Groceries',
        status: 'active',
        rating: 4.5,
        joinDate: '2024-01-15',
        totalProducts: 156
      },
      {
        id: '2',
        name: 'Tech Gadgets Rwanda',
        email: 'sales@techgadgets.rw',
        phone: '+250 788 789 012',
        address: 'Kigali Heights, Rwanda',
        category: 'Electronics',
        status: 'active',
        rating: 4.8,
        joinDate: '2024-02-20',
        totalProducts: 89
      },
      {
        id: '3',
        name: 'Fashion Hub',
        email: 'info@fashionhub.com',
        phone: '+250 788 345 678',
        address: 'Kimironko, Kigali',
        category: 'Fashion',
        status: 'pending',
        rating: 0,
        joinDate: '2024-03-10',
        totalProducts: 0
      }
    ];
    setVendors(mockVendors);
  }, []);

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
      // API call to delete vendor
      setVendors(vendors.filter(v => v.id !== vendorId));
    }
  };

  const handleSaveVendor = async () => {
    if (!formData.name || !formData.email) {
      // Show error toast
      return;
    }

    if (editingVendor) {
      // Update existing vendor
      setVendors(vendors.map(v => 
        v.id === editingVendor.id ? { ...v, ...formData as Vendor } : v
      ));
    } else {
      // Add new vendor
      const newVendor: Vendor = {
        id: Date.now().toString(),
        ...formData as Vendor,
        rating: 0,
        joinDate: new Date().toISOString().split('T')[0],
        totalProducts: 0
      };
      setVendors([...vendors, newVendor]);
    }
    setIsDialogOpen(false);
    setEditingVendor(null);
    setFormData({});
  };

  const getStatusBadge = (status: Vendor['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalProducts') || 'Total Products'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{vendors.reduce((sum, v) => sum + v.totalProducts, 0)}</div>
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
                          <div className="text-xs text-muted-foreground">{vendor.joinDate}</div>
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
                          <span className="text-muted-foreground">{vendor.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {vendor.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                    <TableCell className="font-medium">{vendor.totalProducts}</TableCell>
                    <TableCell>
                      {vendor.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span>{vendor.rating}</span>
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
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Vendor Dialog - Optimized with proper sizing and scroll */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px] md:max-w-[550px] lg:max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-inherit pb-4 border-b border-white/10">
            <DialogTitle className="gradient-text text-xl">
              {editingVendor ? (t('editVendor') || 'Edit Vendor') : (t('addNewVendor') || 'Add New Vendor')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('vendorDialogDesc') || 'Fill in the vendor details below'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4 px-1">
            {/* Vendor Name */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('vendorName') || 'Vendor Name'}</Label>
              <Input
                placeholder={t('enterVendorName') || 'Enter vendor name'}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('email') || 'Email'}</Label>
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
              <Label className="text-white font-medium">{t('phone') || 'Phone'}</Label>
              <Input
                placeholder="+250 XXX XXX XXX"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('address') || 'Address'}</Label>
              <Input
                placeholder="Enter business address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('category') || 'Category'}</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-primary/50">
                  <SelectValue placeholder={t('selectCategory') || 'Select category'} />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="Groceries">Groceries</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Home & Living">Home & Living</SelectItem>
                  <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-white font-medium">{t('status') || 'Status'}</Label>
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
              className="btn-outline-premium flex-1 sm:flex-none"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button 
              onClick={handleSaveVendor} 
              className="btn-premium flex-1 sm:flex-none"
            >
              {editingVendor ? (t('update') || 'Update') : (t('add') || 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}