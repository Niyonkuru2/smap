import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, MapPin, Tag, Loader2, DollarSign, Calendar, Store, FileText } from 'lucide-react';
import { useMarkets, useProducts } from '../../hooks/useAppData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category
} from '../../services/categoryService';
import referencePriceService, { 
  type ReferencePriceWithDetails, 
  type CreateProductWithPriceRequest 
} from '../../services/referencePriceService';
import { 
  createMarket, 
  updateMarket, 
  deleteMarket,
  type Market 
} from '../../services/marketService';

// Extended Product type with reference prices
interface ProductWithDetails {
  id: number;
  name: string;
  unit: string;
  description?: string;
  image_url?: string;
  category_id?: number;
  category_name?: string;
  reference_prices: {
    market_id: string;
    market_name: string;
    province: string;
    district: string;
    reference_price: number;
    reference_price_id: number;
    effective_date: string;
    expiry_date: string | null;
    is_current: boolean;
  }[];
}

export default function CategoryManagement() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isAddMarketOpen, setIsAddMarketOpen] = useState(false);
  const [isEditMarketOpen, setIsEditMarketOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSetPriceOpen, setIsSetPriceOpen] = useState(false);
  const [isEditPriceOpen, setIsEditPriceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [editingPrice, setEditingPrice] = useState<ReferencePriceWithDetails | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', type: 'product' });
  const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '', type: 'product' });
  const [newMarket, setNewMarket] = useState({ id: '', name: '', province: '', district: '', location: '' });
  const [editMarketData, setEditMarketData] = useState<Market | null>(null);
  const [newProduct, setNewProduct] = useState<CreateProductWithPriceRequest>({ 
    product_name: '', 
    product_unit: '', 
    product_description: '',
    category_id: undefined,
    market_id: '',
    reference_price: 0,
    price_unit: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });
  const [priceData, setPriceData] = useState({
    product_id: 0,
    market_id: '',
    price: 0,
    unit: '',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });

  const { t } = useLanguage();
  const { markets, loading: marketsLoading } = useMarkets();

  // Fetch categories and products with prices
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchProductsWithPrices()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchProductsWithPrices = async () => {
    try {
      const result = await referencePriceService.getProductsWithPrices({ limit: 100 });
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching products with prices:', error);
      toast.error('Failed to load products');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await createCategory({
        name: newCategory.name,
        description: newCategory.description || null,
        type: newCategory.type as 'product' | 'business' | 'vendor'
      });
      toast.success('Category added successfully');
      setNewCategory({ name: '', description: '', type: 'product' });
      setIsAddCategoryOpen(false);
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryData({
      name: category.name,
      description: category.description || '',
      type: category.type
    });
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    if (!editCategoryData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await updateCategory(editingCategory.id, {
        name: editCategoryData.name,
        description: editCategoryData.description || null,
        type: editCategoryData.type as 'product' | 'business' | 'vendor'
      });
      toast.success('Category updated successfully');
      setIsEditCategoryOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategory(category.id);
        toast.success('Category deleted successfully');
        await fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  // Market Management Functions
  const handleAddMarket = () => {
    setEditingMarket(null);
    setNewMarket({ id: '', name: '', province: '', district: '', location: '' });
    setIsAddMarketOpen(true);
  };

  const handleEditMarket = (market: any) => {
    setEditingMarket(market);
    setEditMarketData(market);
    setIsEditMarketOpen(true);
  };

  const handleUpdateMarketSubmit = async () => {
    if (!editMarketData) return;
    if (!editMarketData.name?.trim()) {
      toast.error('Market name is required');
      return;
    }

    try {
      await updateMarket(editMarketData.id, {
        name: editMarketData.name,
        province: editMarketData.province,
        district: editMarketData.district,
        latitude: editMarketData.latitude ? parseFloat(editMarketData.latitude as any) : undefined,
        longitude: editMarketData.longitude ? parseFloat(editMarketData.longitude as any) : undefined,
      });
      toast.success('Market updated successfully');
      setIsEditMarketOpen(false);
      setEditingMarket(null);
      setEditMarketData(null);
      // Refresh markets
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update market');
    }
  };

  const handleSaveMarket = async () => {
    if (!newMarket.name.trim()) {
      toast.error('Market name is required');
      return;
    }
    if (!newMarket.province) {
      toast.error('Province is required');
      return;
    }
    if (!newMarket.district) {
      toast.error('District is required');
      return;
    }

    try {
      await createMarket({
        id: newMarket.id || newMarket.name.toLowerCase().replace(/\s+/g, '_'),
        name: newMarket.name,
        province: newMarket.province,
        district: newMarket.district,
      });
      toast.success('Market added successfully');
      setNewMarket({ id: '', name: '', province: '', district: '', location: '' });
      setIsAddMarketOpen(false);
      // Refresh markets
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add market');
    }
  };

  const handleDeleteMarket = async (marketId: string, marketName: string) => {
    if (window.confirm(`Are you sure you want to delete "${marketName}"? This action cannot be undone.`)) {
      try {
        await deleteMarket(marketId, true);
        toast.success('Market deleted successfully');
        // Refresh markets
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete market');
      }
    }
  };

  // Product Management Functions
  const handleAddProduct = async () => {
    if (!newProduct.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!newProduct.product_unit.trim()) {
      toast.error('Product unit is required');
      return;
    }
    if (!newProduct.market_id) {
      toast.error('Please select a market');
      return;
    }
    if (!newProduct.reference_price || newProduct.reference_price <= 0) {
      toast.error('Please enter a valid reference price');
      return;
    }

    try {
      await referencePriceService.createProductWithReferencePrice(newProduct);
      toast.success('Product and reference price created successfully');
      setNewProduct({ 
        product_name: '', 
        product_unit: '', 
        product_description: '',
        category_id: undefined,
        market_id: '',
        reference_price: 0,
        price_unit: '',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        notes: ''
      });
      setIsAddProductOpen(false);
      await fetchProductsWithPrices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    }
  };

  const handleSetPrice = async () => {
    if (!priceData.product_id || !priceData.market_id || !priceData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await referencePriceService.setReferencePrice(priceData);
      toast.success('Reference price set successfully');
      setPriceData({
        product_id: 0,
        market_id: '',
        price: 0,
        unit: '',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        notes: ''
      });
      setIsSetPriceOpen(false);
      setSelectedProduct(null);
      await fetchProductsWithPrices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set reference price');
    }
  };

  const handleEditPrice = async () => {
    if (!editingPrice) return;

    try {
      await referencePriceService.updateReferencePrice(editingPrice.id!, {
        price: editingPrice.price,
        unit: editingPrice.unit,
        effective_date: editingPrice.effective_date,
        expiry_date: editingPrice.expiry_date,
        notes: editingPrice.notes
      });
      toast.success('Reference price updated successfully');
      setIsEditPriceOpen(false);
      setEditingPrice(null);
      await fetchProductsWithPrices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update reference price');
    }
  };

  const handleDeletePrice = async (priceId: number, productName: string, marketName: string) => {
    if (window.confirm(`Are you sure you want to delete the reference price for "${productName}" at "${marketName}"?`)) {
      try {
        await referencePriceService.deleteReferencePrice(priceId);
        toast.success('Reference price deleted successfully');
        await fetchProductsWithPrices();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete reference price');
      }
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This will also delete all its reference prices.`)) {
      try {
        toast.info('Product deletion will be implemented soon');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete product');
      }
    }
  };

  const openSetPriceDialog = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setPriceData({
      product_id: product.id,
      market_id: '',
      price: 0,
      unit: product.unit,
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: ''
    });
    setIsSetPriceOpen(true);
  };

  const openEditPriceDialog = (price: ReferencePriceWithDetails) => {
    setEditingPrice(price);
    setIsEditPriceOpen(true);
  };

  const getCategoryTypeColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'business':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'vendor':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  if (isLoading || marketsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  // Group categories by type
  const productCategories = categories.filter(c => c.type === 'product');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Categories */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg gradient-text">Product Categories</h3>
            </div>
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Add New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-white">Category Name *</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Electronics"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Category description (optional)"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Category Type</Label>
                    <Select value={newCategory.type} onValueChange={(value) => setNewCategory({ ...newCategory, type: value })}>
                      <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark-glass border-white/10">
                        <SelectItem value="product">Product Category</SelectItem>
                        <SelectItem value="business">Business Category</SelectItem>
                        <SelectItem value="vendor">Vendor Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {productCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-white">{category.name}</span>
                  {category.description && (
                    <span className="text-xs text-muted-foreground">- {category.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryTypeColor(category.type)}>
                    {category.type}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditCategory(category)}
                    className="hover:bg-white/10"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-white" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category)}
                    className="hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </Button>
                </div>
              </div>
            ))}
            
            {productCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No product categories yet</p>
                <p className="text-sm">Click "Add Category" to create one</p>
              </div>
            )}
          </div>
        </Card>

        {/* Markets */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg gradient-text">{t('location')}</h3>
            </div>
            <Button size="sm" onClick={handleAddMarket} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t('addMarket')}
            </Button>
          </div>

          <div className="space-y-2">
            {markets.map((market) => (
              <div key={market.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-white">{market.name}</p>
                    <p className="text-sm text-muted-foreground">{market.district}, {market.province}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditMarket(market)} className="hover:bg-white/10">
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-white" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteMarket(market.id, market.name)} className="hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Products with Reference Prices */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg gradient-text">{t('allProducts')} ({products.length})</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage products and their reference prices across markets</p>
          </div>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Product with Price
              </Button>
            </DialogTrigger>
            <DialogContent className="dark-glass border-white/10 sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="gradient-text">Add New Product with Reference Price</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-white">Product Name *</Label>
                  <Input
                    value={newProduct.product_name}
                    onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                    placeholder="e.g., Organic Red Beans"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Product Unit *</Label>
                  <Input
                    value={newProduct.product_unit}
                    onChange={(e) => setNewProduct({ ...newProduct, product_unit: e.target.value })}
                    placeholder="e.g., kg, piece, liter"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Description</Label>
                  <Input
                    value={newProduct.product_description}
                    onChange={(e) => setNewProduct({ ...newProduct, product_description: e.target.value })}
                    placeholder="Product description (optional)"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Category</Label>
                  <Select 
                    value={newProduct.category_id?.toString() || ''} 
                    onValueChange={(value) => setNewProduct({ ...newProduct, category_id: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent className="dark-glass border-white/10">
                      {productCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Market *</Label>
                  <Select 
                    value={newProduct.market_id} 
                    onValueChange={(value) => setNewProduct({ ...newProduct, market_id: value })}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent className="dark-glass border-white/10">
                      {markets.map((market) => (
                        <SelectItem key={market.id} value={market.id}>
                          {market.name} - {market.district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Reference Price *</Label>
                  <Input
                    type="number"
                    value={newProduct.reference_price || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, reference_price: parseFloat(e.target.value) })}
                    placeholder="e.g., 1200"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Effective Date</Label>
                  <Input
                    type="date"
                    value={newProduct.effective_date}
                    onChange={(e) => setNewProduct({ ...newProduct, effective_date: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newProduct.expiry_date}
                    onChange={(e) => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Notes</Label>
                  <Input
                    value={newProduct.notes}
                    onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                    placeholder="Additional notes (optional)"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
                  Create Product & Set Price
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
              {/* Product Header */}
              <div className="p-4 border-b border-white/10 bg-white/10 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-white">{product.name}</h4>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {product.unit}
                    </Badge>
                    {product.category_name && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        {product.category_name}
                      </Badge>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openSetPriceDialog(product)}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Price
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="hover:bg-red-500/10 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Reference Prices List */}
              {product.reference_prices.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {product.reference_prices.map((price) => (
                    <div key={price.reference_price_id} className="p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span className="font-medium text-white">{price.market_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {price.province}, {price.district}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          <span className="text-lg font-bold text-emerald-400">
                            {price.reference_price.toLocaleString()} RWF
                          </span>
                          <span className="text-sm text-muted-foreground">per {product.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Effective: {new Date(price.effective_date).toLocaleDateString()}</span>
                          {price.expiry_date && (
                            <>
                              <span>→</span>
                              <span>Expires: {new Date(price.expiry_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        {!price.is_current && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const fullPrice: ReferencePriceWithDetails = {
                              id: price.reference_price_id,
                              product_id: product.id,
                              market_id: price.market_id,
                              price: price.reference_price,
                              unit: product.unit,
                              effective_date: price.effective_date,
                              expiry_date: price.expiry_date,
                              notes: '',
                              product_name: product.name,
                              market_name: price.market_name
                            };
                            openEditPriceDialog(fullPrice);
                          }}
                          className="hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-white" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePrice(price.reference_price_id, product.name, price.market_name)}
                          className="hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No reference prices set for this product</p>
                  <Button 
                    variant="link" 
                    onClick={() => openSetPriceDialog(product)}
                    className="text-primary mt-2"
                  >
                    Add Reference Price
                  </Button>
                </div>
              )}
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No products found</p>
              <p className="text-sm">Click "Add Product with Price" to create one</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Market Dialog */}
      <Dialog open={isAddMarketOpen} onOpenChange={setIsAddMarketOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">{t('addNewMarket')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">{t('marketId')} (Optional)</Label>
              <Input
                value={newMarket.id}
                onChange={(e) => setNewMarket({ ...newMarket, id: e.target.value })}
                placeholder="e.g., kimironko"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for auto-generated ID</p>
            </div>
            <div>
              <Label className="text-white">{t('marketName')} *</Label>
              <Input
                value={newMarket.name}
                onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                placeholder="e.g., Kimironko Market"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-white">{t('province')} *</Label>
              <Input
                value={newMarket.province}
                onChange={(e) => setNewMarket({ ...newMarket, province: e.target.value })}
                placeholder="e.g., Kigali City"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-white">{t('district')} *</Label>
              <Input
                value={newMarket.district}
                onChange={(e) => setNewMarket({ ...newMarket, district: e.target.value })}
                placeholder="e.g., Gasabo"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMarketOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMarket} className="bg-primary hover:bg-primary/90">
              {t('addMarket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Market Dialog */}
      <Dialog open={isEditMarketOpen} onOpenChange={setIsEditMarketOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Edit Market</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Market ID</Label>
              <Input
                value={editMarketData?.id || ''}
                disabled
                className="mt-1.5 bg-white/10 border-white/10 text-white/70"
              />
              <p className="text-xs text-muted-foreground mt-1">ID cannot be changed</p>
            </div>
            <div>
              <Label className="text-white">Market Name *</Label>
              <Input
                value={editMarketData?.name || ''}
                onChange={(e) => setEditMarketData(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="e.g., Kimironko Market"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-white">Province *</Label>
              <Input
                value={editMarketData?.province || ''}
                onChange={(e) => setEditMarketData(prev => prev ? { ...prev, province: e.target.value } : null)}
                placeholder="e.g., Kigali City"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-white">District *</Label>
              <Input
                value={editMarketData?.district || ''}
                onChange={(e) => setEditMarketData(prev => prev ? { ...prev, district: e.target.value } : null)}
                placeholder="e.g., Gasabo"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMarketOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMarketSubmit} className="bg-primary hover:bg-primary/90">
              Update Market
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Reference Price Dialog */}
      <Dialog open={isSetPriceOpen} onOpenChange={setIsSetPriceOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              Set Reference Price for {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Market *</Label>
              <Select 
                value={priceData.market_id} 
                onValueChange={(value) => setPriceData({ ...priceData, market_id: value })}
              >
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name} - {market.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Reference Price *</Label>
              <Input
                type="number"
                value={priceData.price || ''}
                onChange={(e) => setPriceData({ ...priceData, price: parseFloat(e.target.value) })}
                placeholder="Enter price in RWF"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Unit</Label>
              <Input
                value={priceData.unit}
                onChange={(e) => setPriceData({ ...priceData, unit: e.target.value })}
                placeholder="e.g., kg, piece"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Effective Date</Label>
              <Input
                type="date"
                value={priceData.effective_date}
                onChange={(e) => setPriceData({ ...priceData, effective_date: e.target.value })}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={priceData.expiry_date}
                onChange={(e) => setPriceData({ ...priceData, expiry_date: e.target.value })}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Notes</Label>
              <Input
                value={priceData.notes}
                onChange={(e) => setPriceData({ ...priceData, notes: e.target.value })}
                placeholder="Additional notes"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetPriceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPrice} className="bg-primary hover:bg-primary/90">
              Set Reference Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reference Price Dialog */}
      <Dialog open={isEditPriceOpen} onOpenChange={setIsEditPriceOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              Edit Reference Price for {editingPrice?.product_name} at {editingPrice?.market_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Reference Price (RWF) *</Label>
              <Input
                type="number"
                value={editingPrice?.price || ''}
                onChange={(e) => setEditingPrice(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Unit</Label>
              <Input
                value={editingPrice?.unit || ''}
                onChange={(e) => setEditingPrice(prev => prev ? { ...prev, unit: e.target.value } : null)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Effective Date</Label>
              <Input
                type="date"
                value={editingPrice?.effective_date?.split('T')[0] || ''}
                onChange={(e) => setEditingPrice(prev => prev ? { ...prev, effective_date: e.target.value } : null)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={editingPrice?.expiry_date?.split('T')[0] || ''}
                onChange={(e) => setEditingPrice(prev => prev ? { ...prev, expiry_date: e.target.value } : null)}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Notes</Label>
              <Input
                value={editingPrice?.notes || ''}
                onChange={(e) => setEditingPrice(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Additional notes"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPriceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPrice} className="bg-primary hover:bg-primary/90">
              Update Reference Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Category Name *</Label>
              <Input
                value={editCategoryData.name}
                onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                placeholder="Category name"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Description</Label>
              <Input
                value={editCategoryData.description}
                onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                placeholder="Category description (optional)"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Category Type</Label>
              <Select 
                value={editCategoryData.type} 
                onValueChange={(value) => setEditCategoryData({ ...editCategoryData, type: value })}
              >
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="product">Product Category</SelectItem>
                  <SelectItem value="business">Business Category</SelectItem>
                  <SelectItem value="vendor">Vendor Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} className="bg-primary hover:bg-primary/90">
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}