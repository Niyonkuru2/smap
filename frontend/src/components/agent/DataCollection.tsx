import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Upload, Camera, MapPin, Plus, Loader2, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface DataCollectionProps {
  agentName: string;
  agentId: string;
}

// Sample markets - in production, fetch from API
const markets = [
  { id: 'musanze', name: 'Musanze Market', district: 'Musanze' },
  { id: 'kimironko', name: 'Kimironko Market', district: 'Gasabo' },
  { id: 'nyabugogo', name: 'Nyabugogo Market', district: 'Nyarugenge' },
];

// Sample product categories - STAPLE ESSENTIALS FOCUS
const categories = [
  { id: 'grains', name: 'Grains & Cereals', icon: '🌾' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
  { id: 'proteins', name: 'Proteins', icon: '🥚' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'cooking_essentials', name: 'Cooking Essentials', icon: '🧂' },
];

// Sample products per category - CORE STAPLE ITEMS ONLY
const productsByCategory: Record<string, { id: string; name: string; unit: string }[]> = {
  grains: [
    { id: 'maize', name: 'Maize/Corn', unit: 'kg' },
    { id: 'maize_flour', name: 'Maize Flour', unit: 'kg' },
    { id: 'rice_white', name: 'Rice (White)', unit: 'kg' },
    { id: 'rice_brown', name: 'Rice (Brown)', unit: 'kg' },
    { id: 'wheat_flour', name: 'Wheat Flour', unit: 'kg' },
    { id: 'millet', name: 'Millet', unit: 'kg' },
    { id: 'beans', name: 'Beans', unit: 'kg' },
    { id: 'lentils', name: 'Lentils', unit: 'kg' },
    { id: 'peas', name: 'Peas', unit: 'kg' },
  ],
  vegetables: [
    { id: 'tomatoes', name: 'Tomatoes', unit: 'kg' },
    { id: 'onions_red', name: 'Onions (Red)', unit: 'kg' },
    { id: 'onions_white', name: 'Onions (White)', unit: 'kg' },
    { id: 'potatoes', name: 'Potatoes', unit: 'kg' },
    { id: 'cabbage', name: 'Cabbage', unit: 'piece' },
    { id: 'carrots', name: 'Carrots', unit: 'kg' },
    { id: 'leafy_greens', name: 'Leafy Greens (Sukuma)', unit: 'bunch' },
    { id: 'spinach', name: 'Spinach', unit: 'bunch' },
    { id: 'kale', name: 'Kale', unit: 'bunch' },
  ],
  proteins: [
    { id: 'eggs', name: 'Eggs', unit: 'tray' },
    { id: 'chicken', name: 'Chicken (Fresh)', unit: 'kg' },
    { id: 'fish_tilapia', name: 'Fish (Tilapia)', unit: 'kg' },
    { id: 'fish_sambaza', name: 'Fish (Sambaza)', unit: 'kg' },
    { id: 'dried_fish', name: 'Dried Fish', unit: 'kg' },
    { id: 'milk', name: 'Milk (Fresh)', unit: 'liter' },
    { id: 'milk_powdered', name: 'Milk (Powdered)', unit: 'tin' },
    { id: 'yogurt', name: 'Yogurt', unit: 'liter' },
  ],
  fruits: [
    { id: 'bananas', name: 'Bananas', unit: 'bunch' },
    { id: 'plantains', name: 'Plantains', unit: 'bunch' },
    { id: 'oranges', name: 'Oranges', unit: 'kg' },
    { id: 'mangoes', name: 'Mangoes', unit: 'kg' },
    { id: 'avocado', name: 'Avocado', unit: 'piece' },
    { id: 'passion_fruit', name: 'Passion Fruit', unit: 'piece' },
    { id: 'pineapple', name: 'Pineapple', unit: 'piece' },
  ],
  cooking_essentials: [
    { id: 'cooking_oil', name: 'Cooking Oil', unit: 'liter' },
    { id: 'salt', name: 'Salt', unit: 'kg' },
    { id: 'sugar', name: 'Sugar', unit: 'kg' },
    { id: 'pepper', name: 'Pepper (Black)', unit: 'pack' },
    { id: 'cumin', name: 'Cumin', unit: 'pack' },
    { id: 'garlic', name: 'Garlic', unit: 'kg' },
    { id: 'ginger', name: 'Ginger', unit: 'kg' },
    { id: 'turmeric', name: 'Turmeric', unit: 'pack' },
  ],
};

interface PriceEntry {
  productId: string;
  productName: string;
  price: string;
  unit: string;
  vendorName?: string;
  notes?: string;
}

export default function DataCollection({ agentName, agentId }: DataCollectionProps) {
  const { t } = useLanguage();
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  // Form state for adding a product
  const [selectedProduct, setSelectedProduct] = useState('');
  const [price, setPrice] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddProduct = () => {
    if (!selectedProduct || !price) {
      toast.error('Please select a product and enter a price');
      return;
    }

    const product = productsByCategory[selectedCategory]?.find(p => p.id === selectedProduct);
    if (!product) return;

    const newEntry: PriceEntry = {
      productId: product.id,
      productName: product.name,
      price,
      unit: product.unit,
      vendorName: vendorName || undefined,
      notes: notes || undefined,
    };

    setPriceEntries([...priceEntries, newEntry]);
    
    // Reset form
    setSelectedProduct('');
    setPrice('');
    setVendorName('');
    setNotes('');
    setShowAddProduct(false);
    
    toast.success(`Added ${product.name} to collection`);
  };

  const handleRemoveEntry = (index: number) => {
    setPriceEntries(priceEntries.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    if (!selectedMarket) {
      toast.error('Please select a market');
      return;
    }

    if (priceEntries.length === 0) {
      toast.error('Please add at least one product price');
      return;
    }

    setSubmitting(true);

    try {
      // In production, send to API
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Successfully submitted ${priceEntries.length} prices for ${markets.find(m => m.id === selectedMarket)?.name}`);
      
      // Reset form
      setPriceEntries([]);
      setSelectedCategory('');
    } catch (error) {
      toast.error('Failed to submit prices. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-700 to-green-600 rounded-xl">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('collectPrices')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('collectPricesDesc')}
            </p>
          </div>
        </div>

        {/* Market Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>{t('selectMarket')}</Label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('chooseMarket')} />
              </SelectTrigger>
              <SelectContent>
                {markets.map(market => (
                  <SelectItem key={market.id} value={market.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      {market.name} - {market.district}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('selectCategory')}</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('chooseCategory') || 'Choose a category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Product Button */}
        {selectedMarket && selectedCategory && (
          <Button 
            onClick={() => setShowAddProduct(true)}
            className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addProduct') || 'Add Product Price'}
          </Button>
        )}
      </Card>

      {/* Add Product Form */}
      {showAddProduct && selectedCategory && (
        <Card className="p-6 glass-card border-green-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-300" />
            {t('addProductPrice') || 'Add Product Price'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('product') || 'Product'}</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('selectProduct') || 'Select product'} />
                </SelectTrigger>
                <SelectContent>
                  {productsByCategory[selectedCategory]?.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('price') || 'Price'} (RWF)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('vendorName') || 'Vendor Name'} ({t('optional') || 'optional'})</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder={t('enterVendorName') || 'Enter vendor name'}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('notes') || 'Notes'} ({t('optional') || 'optional'})</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('anyNotes') || 'Any additional notes'}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddProduct} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {t('add') || 'Add'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </Card>
      )}

      {/* Price Entries List */}
      {priceEntries.length > 0 && (
        <Card className="p-6 glass-card">
          <h3 className="font-semibold mb-4 flex items-center justify-between">
            <span>{t('collectedPrices') || 'Collected Prices'} ({priceEntries.length})</span>
            <span className="text-sm font-normal text-muted-foreground">
              {markets.find(m => m.id === selectedMarket)?.name}
            </span>
          </h3>

          <div className="space-y-3">
            {priceEntries.map((entry, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-950 rounded-lg border border-green-700"
              >
                <div>
                  <p className="font-medium">{entry.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.price} RWF / {entry.unit}
                    {entry.vendorName && ` • ${entry.vendorName}`}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveEntry(index)}
                  className="text-green-500 hover:text-green-700 hover:bg-green-950"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSubmitAll}
            disabled={submitting}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('submitting') || 'Submitting...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('submitAll') || 'Submit All Prices'}
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Quick Tips */}
      <Card className="p-4 bg-gradient-to-r from-green-950 to-green-900 border-green-700">
        <h4 className="font-semibold text-green-300 mb-2">💡 {t('quickTips') || 'Quick Tips'}</h4>
        <ul className="text-sm text-green-100 space-y-1">
          <li>• {t('tip1') || 'Verify prices with multiple vendors for accuracy'}</li>
          <li>• {t('tip2') || 'Include vendor names to track price sources'}</li>
          <li>• {t('tip3') || 'Submit prices daily for the best data quality'}</li>
          <li>• {t('tip4') || 'Note any unusual price changes or shortages'}</li>
        </ul>
      </Card>
    </div>
  );
}
