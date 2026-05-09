import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, MapPin, Tag, Loader2 } from 'lucide-react';
import { useMarkets, useProducts } from '../../hooks/useAppData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  type Category
} from '../../services/categoryService';

export default function CategoryManagement() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isAddMarketOpen, setIsAddMarketOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', type: 'product' });
  const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '', type: 'product' });
  const [newMarket, setNewMarket] = useState({ name: '', location: '', district: '' });
  const [newProduct, setNewProduct] = useState({ name: '', categoryId: '', unit: '' });
  
  const { t } = useLanguage();
  const { markets } = useMarkets();
  const { products } = useProducts();

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
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

  const handleAddMarket = () => {
    if (newMarket.name && newMarket.location && newMarket.district) {
      // TODO: Implement market creation API
      toast.info('Market creation API will be implemented soon');
      setNewMarket({ name: '', location: '', district: '' });
      setIsAddMarketOpen(false);
    } else {
      toast.error('Please fill in all market fields');
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.categoryId && newProduct.unit) {
      // TODO: Implement product creation API
      toast.info('Product creation API will be implemented soon');
      setNewProduct({ name: '', categoryId: '', unit: '' });
      setIsAddProductOpen(false);
    } else {
      toast.error('Please fill in all product fields');
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  // Group categories by type
  const productCategories = categories.filter(c => c.type === 'product');
  const businessCategories = categories.filter(c => c.type === 'business');
  const vendorCategories = categories.filter(c => c.type === 'vendor');

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
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} className="btn-outline-premium">
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
            <Dialog open={isAddMarketOpen} onOpenChange={setIsAddMarketOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addMarket')}
                </Button>
              </DialogTrigger>
              <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="gradient-text">{t('addNewMarket')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-white">{t('marketName')} *</Label>
                    <Input
                      value={newMarket.name}
                      onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                      placeholder="e.g., Kimironko Market"
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">{t('location')} *</Label>
                    <Input
                      value={newMarket.location}
                      onChange={(e) => setNewMarket({ ...newMarket, location: e.target.value })}
                      placeholder="e.g., Kimironko"
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">{t('district')} *</Label>
                    <Input
                      value={newMarket.district}
                      onChange={(e) => setNewMarket({ ...newMarket, district: e.target.value })}
                      placeholder="e.g., Gasabo"
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMarketOpen(false)} className="btn-outline-premium">
                    Cancel
                  </Button>
                  <Button onClick={handleAddMarket} className="bg-primary hover:bg-primary/90">
                    {t('addMarket')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {markets.map((market) => (
              <div key={market.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-white">{market.name}</p>
                    <p className="text-sm text-muted-foreground">{market.location}, {market.district}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="hover:bg-white/10">
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-white" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Products List */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg gradient-text">{t('allProducts')} ({products.length})</h3>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {t('addProduct')}
              </Button>
            </DialogTrigger>
            <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="gradient-text">{t('addProduct')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-white">{t('productName')} *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">{t('selectCategory')} *</Label>
                  <Select 
                    value={newProduct.categoryId} 
                    onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select product category" />
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
                  <Label className="text-white">{t('unit')} *</Label>
                  <Input
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="e.g., kg, piece, liter"
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddProductOpen(false)} className="btn-outline-premium">
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
                  {t('addProduct')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.slice(0, 12).map((product) => {
            const category = productCategories.find(c => c.id.toString() === product.categoryId?.toString());
            return (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div>
                  <p className="font-medium text-white">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {category && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        {category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">per {product.unit}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="hover:bg-white/10">
                    <Edit className="h-3 w-3 text-muted-foreground hover:text-white" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)} className="btn-outline-premium">
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