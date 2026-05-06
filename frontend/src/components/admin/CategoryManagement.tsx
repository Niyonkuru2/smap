import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, MapPin, Tag } from 'lucide-react';
import { useCategories, useMarkets, useProducts } from '../../hooks/useAppData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CategoryManagement() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMarketOpen, setIsAddMarketOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newMarket, setNewMarket] = useState({ name: '', location: '', district: '' });
  const [newProduct, setNewProduct] = useState({ name: '', category: '', unit: '' });
  const { t } = useLanguage();
  const { categories } = useCategories();
  const { markets } = useMarkets();
  const { products } = useProducts();

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      alert(`Category "${newCategory}" added successfully`);
      setNewCategory('');
      setIsAddCategoryOpen(false);
    }
  };

  const handleAddMarket = () => {
    if (newMarket.name && newMarket.location && newMarket.district) {
      alert(`Market "${newMarket.name}" added successfully`);
      setNewMarket({ name: '', location: '', district: '' });
      setIsAddMarketOpen(false);
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.unit) {
      alert(`Product "${newProduct.name}" added successfully`);
      setNewProduct({ name: '', category: '', unit: '' });
      setIsAddProductOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg gradient-text">{t('productCategories')}</h3>
            </div>
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCategory')}
                </Button>
              </DialogTrigger>
              <DialogContent className="dark-glass border-white/10">
                <DialogHeader>
                  <DialogTitle className="gradient-text">{t('addNewCategory')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="category-name" className="text-white">{t('categoryName')}</Label>
                    <Input
                      id="category-name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Electronics"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button onClick={handleAddCategory} className="w-full bg-primary hover:bg-primary/90">
                    {t('addCategory')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-white">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {products.filter(p => p.category === category).length} products
                  </Badge>
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
              <DialogContent className="dark-glass border-white/10">
                <DialogHeader>
                  <DialogTitle className="gradient-text">{t('addNewMarket')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="market-name" className="text-white">{t('marketName')}</Label>
                    <Input
                      id="market-name"
                      value={newMarket.name}
                      onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                      placeholder="e.g., Kimironko Market"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-location" className="text-white">{t('location')}</Label>
                    <Input
                      id="market-location"
                      value={newMarket.location}
                      onChange={(e) => setNewMarket({ ...newMarket, location: e.target.value })}
                      placeholder="e.g., Kimironko"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-district" className="text-white">{t('district')}</Label>
                    <Input
                      id="market-district"
                      value={newMarket.district}
                      onChange={(e) => setNewMarket({ ...newMarket, district: e.target.value })}
                      placeholder="e.g., Gasabo"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button onClick={handleAddMarket} className="w-full bg-primary hover:bg-primary/90">
                    {t('addMarket')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {markets.map((market) => (
              <div key={market.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
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
            <DialogContent className="dark-glass border-white/10">
              <DialogHeader>
                <DialogTitle className="gradient-text">{t('addProduct')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="product-name" className="text-white">{t('productName')}</Label>
                  <Input
                    id="product-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="product-category" className="text-white">{t('selectCategory')}</Label>
                  <select
                    id="product-category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 rounded-md bg-white/5 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-slate-800">{t('selectCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="product-unit" className="text-white">{t('unit')}</Label>
                  <Input
                    id="product-unit"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="e.g., kg, piece, liter"
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full bg-primary hover:bg-primary/90">
                  {t('addProduct')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div>
                <p className="font-medium text-white">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                    {product.category}
                  </Badge>
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
          ))}
        </div>
      </Card>
    </div>
  );
}