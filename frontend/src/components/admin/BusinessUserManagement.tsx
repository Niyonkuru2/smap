// BusinessUserManagement.tsx
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
  TrendingUp, DollarSign, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessUser {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'basic' | 'premium' | 'enterprise';
  joinDate: string;
  totalPurchases: number;
  totalSpent: number;
  rating: number;
  markets: string[];
}

export default function BusinessUserManagement() {
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessUser | null>(null);
  const [viewingBusiness, setViewingBusiness] = useState<BusinessUser | null>(null);
  const [formData, setFormData] = useState<Partial<BusinessUser>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { t } = useLanguage();

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockBusinessUsers: BusinessUser[] = [
      {
        id: '1',
        businessName: 'Rwanda Fresh Produce Ltd',
        ownerName: 'Jean Paul Ndagijimana',
        email: 'contact@rwandafresh.rw',
        phone: '+250 788 123 456',
        address: 'KG 123 St, Kigali, Rwanda',
        businessType: 'Agriculture',
        registrationNumber: 'REG-2024-001',
        taxId: 'TAX-123456',
        status: 'active',
        tier: 'premium',
        joinDate: '2024-01-15',
        totalPurchases: 1250,
        totalSpent: 24500000,
        rating: 4.8,
        markets: ['Kimironko', 'Nyabugogo', 'Kicukiro']
      },
      {
        id: '2',
        businessName: 'Kigali Supermarket Chain',
        ownerName: 'Marie Claire Uwase',
        email: 'info@kigalisupermarket.rw',
        phone: '+250 788 789 012',
        address: 'KN 5 Rd, Kigali, Rwanda',
        businessType: 'Retail',
        registrationNumber: 'REG-2024-002',
        taxId: 'TAX-789012',
        status: 'active',
        tier: 'enterprise',
        joinDate: '2024-02-20',
        totalPurchases: 3450,
        totalSpent: 78200000,
        rating: 4.9,
        markets: ['Kimironko', 'Nyabugogo', 'Muhima', 'Remera', 'Gikondo']
      },
      {
        id: '3',
        businessName: 'Volcanoes Hospitality Group',
        ownerName: 'Emmanuel Rukundo',
        email: 'emmanuel@volcanoes.rw',
        phone: '+250 788 345 678',
        address: 'Musanze, Northern Province',
        businessType: 'Hospitality',
        registrationNumber: 'REG-2024-003',
        taxId: 'TAX-345678',
        status: 'pending',
        tier: 'basic',
        joinDate: '2024-03-10',
        totalPurchases: 0,
        totalSpent: 0,
        rating: 0,
        markets: ['Musanze', 'Ruhengeri']
      }
    ];
    setBusinessUsers(mockBusinessUsers);
  }, []);

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
      tier: 'basic',
      markets: []
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
      setBusinessUsers(businessUsers.filter(b => b.id !== businessId));
      toast.success('Business user deleted successfully');
    }
  };

  const handleSaveBusiness = async () => {
    if (!formData.businessName || !formData.email || !formData.ownerName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingBusiness) {
      // Update existing business
      setBusinessUsers(businessUsers.map(b => 
        b.id === editingBusiness.id ? { ...b, ...formData as BusinessUser } : b
      ));
      toast.success('Business user updated successfully');
    } else {
      // Add new business
      const newBusiness: BusinessUser = {
        id: Date.now().toString(),
        ...formData as BusinessUser,
        joinDate: new Date().toISOString().split('T')[0],
        totalPurchases: 0,
        totalSpent: 0,
        rating: 0,
        markets: formData.markets || []
      };
      setBusinessUsers([...businessUsers, newBusiness]);
      toast.success('Business user added successfully');
    }
    setIsDialogOpen(false);
    setEditingBusiness(null);
    setFormData({});
  };

  const getStatusBadge = (status: BusinessUser['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle className="h-3 w-3 mr-1" /> Active
        </Badge>;
      case 'inactive':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
          <XCircle className="h-3 w-3 mr-1" /> Inactive
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          Pending
        </Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertCircle className="h-3 w-3 mr-1" /> Suspended
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTierBadge = (tier: BusinessUser['tier']) => {
    switch (tier) {
      case 'basic':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Basic</Badge>;
      case 'premium':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Enterprise</Badge>;
      default:
        return <Badge>{tier}</Badge>;
    }
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

  const stats = {
    total: businessUsers.length,
    active: businessUsers.filter(b => b.status === 'active').length,
    pending: businessUsers.filter(b => b.status === 'pending').length,
    premium: businessUsers.filter(b => b.tier === 'premium' || b.tier === 'enterprise').length,
    totalSpent: businessUsers.reduce((sum, b) => sum + b.totalSpent, 0),
  };

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
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premium Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.premium}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSpent.toLocaleString()} RWF</div>
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
                          <div className="text-xs text-muted-foreground">ID: {business.registrationNumber}</div>
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
                          <span className="text-muted-foreground">{business.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {business.businessType}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTierBadge(business.tier)}</TableCell>
                    <TableCell>{getStatusBadge(business.status)}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-emerald-400">
                        {business.totalSpent.toLocaleString()} RWF
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="btn-outline-premium flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSaveBusiness} className="btn-premium flex-1 sm:flex-none">
              {editingBusiness ? 'Update' : 'Add Business'}
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
              {/* Business Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{viewingBusiness.businessName}</h3>
                  <p className="text-muted-foreground">Registered: {viewingBusiness.joinDate}</p>
                </div>
                {getStatusBadge(viewingBusiness.status)}
              </div>

              {/* Owner Information */}
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
                    <p className="text-white font-medium mt-1">{viewingBusiness.phone}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.address}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold gradient-text">Business Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Business Type</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.businessType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="text-white font-medium mt-1">{getTierBadge(viewingBusiness.tier)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Registration Number</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.registrationNumber}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Tax ID</p>
                    <p className="text-white font-medium mt-1">{viewingBusiness.taxId}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
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
                    <p className="text-xl font-bold text-white">{viewingBusiness.totalSpent.toLocaleString()} RWF</p>
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

              {/* Markets */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold gradient-text">Active Markets</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingBusiness.markets.map((market, index) => (
                    <Badge key={index} className="bg-primary/20 text-primary border-primary/30">
                      <MapPin className="h-3 w-3 mr-1" />
                      {market}
                    </Badge>
                  ))}
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