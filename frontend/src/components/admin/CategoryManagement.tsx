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
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg">{t('productCategories')}</h3>
            </div>
            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCategory')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('addNewCategory')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="category-name">{t('categoryName')}</Label>
                    <Input
                      id="category-name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Electronics"
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={handleAddCategory} className="w-full">
                    {t('addCategory')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-green-950 border border-green-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <span>{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {products.filter(p => p.category === category).length} products
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Markets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg">{t('location')}</h3>
            </div>
            <Dialog open={isAddMarketOpen} onOpenChange={setIsAddMarketOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addMarket')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('addNewMarket')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="market-name">{t('marketName')}</Label>
                    <Input
                      id="market-name"
                      value={newMarket.name}
                      onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                      placeholder="e.g., Kimironko Market"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-location">{t('location')}</Label>
                    <Input
                      id="market-location"
                      value={newMarket.location}
                      onChange={(e) => setNewMarket({ ...newMarket, location: e.target.value })}
                      placeholder="e.g., Kimironko"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-district">{t('district')}</Label>
                    <Input
                      id="market-district"
                      value={newMarket.district}
                      onChange={(e) => setNewMarket({ ...newMarket, district: e.target.value })}
                      placeholder="e.g., Gasabo"
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={handleAddMarket} className="w-full">
                    {t('addMarket')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {markets.map((market) => (
              <div key={market.id} className="flex items-center justify-between p-3 rounded-xl bg-green-950 border border-green-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-medium">{market.name}</p>
                    <p className="text-sm text-slate-600">{market.location}, {market.district}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Products List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">{t('allProducts')} ({products.length})</h3>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('addProduct')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addProduct')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="product-name">{t('productName')}</Label>
                  <Input
                    id="product-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">{t('selectCategory')}</Label>
                  <select
                    id="product-category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2 rounded-md border border-input bg-background"
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="product-unit">{t('unit')}</Label>
                  <Input
                    id="product-unit"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="e.g., kg, piece, liter"
                    className="mt-1.5"
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  {t('addProduct')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.slice(0, 12).map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-green-950 border border-green-700 shadow-sm">
              <div>
                <p className="font-medium">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <span className="text-xs text-slate-600">per {product.unit}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
                  <Button variant="ghost" size="sm" className="text-green-500">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
