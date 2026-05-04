import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useProducts, useMarkets, useCategories, type Product, type Market } from '../../hooks/useAppData';
import { toast } from 'sonner';
import { globalNotifications, globalPriceSubmissions, type Notification } from '../../state/globalState';
import { addPriceSubmission, addNotification } from '../../lib/localStorage';
import { useLanguage } from '../../contexts/LanguageContext';
import { submitPrice as submitPriceAPI } from '../../lib/api';

interface PriceSubmission {
  id: string;
  productId: string;
  marketId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  unit: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  ageInHours: number;
}

interface SubmitPriceProps {
  vendorName: string;
  vendorId: string;
}

export default function SubmitPrice({ vendorName, vendorId }: SubmitPriceProps) {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const selectedMarketData = markets.find(m => m.id === selectedMarket);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Submit to API
      await submitPriceAPI({
        productId: selectedProduct,
        productName: selectedProductData?.name,
        marketId: selectedMarket,
        marketName: selectedMarketData?.name,
        price: parseFloat(price),
        unit: selectedProductData?.unit || 'kg',
        notes: `Quantity: ${quantity}`
      });

      setSubmitted(true);
      toast.success(t('priceSubmitted') || 'Price submitted successfully!');
      
      // Reset form after delay
      setTimeout(() => {
        setSubmitted(false);
        setSelectedProduct('');
        setPrice('');
        setQuantity('1');
      }, 2000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit price');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = productsLoading || marketsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <Card className="p-6 bg-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </Card>
    );
  }

  const isFormValid = selectedProduct && selectedMarket && price && quantity;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 bg-gradient-to-br from-green-900 to-green-950">
        <h2 className="text-2xl font-bold mb-6 text-white">{t('submitNewPrice')}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="category" className="text-white font-semibold text-base">{t('category')}</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category" className="mt-1.5 bg-green-800 border-green-600 text-white">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product" className="text-white font-semibold text-base">{t('product')}</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="product" className="mt-1.5 bg-green-800 border-green-600 text-white">
                <SelectValue placeholder={t('selectProduct')} />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({t('per')} {product.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="market" className="text-white font-semibold text-base">{t('marketLocation')}</Label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger id="market" className="mt-1.5 bg-green-800 border-green-600 text-white">
                <SelectValue placeholder={t('selectMarket')} />
              </SelectTrigger>
              <SelectContent>
                {markets.map(market => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.name} - {market.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-white font-semibold text-base">{t('price')} (RWF)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('enterPrice')}
                className="mt-1.5 bg-green-800 border-green-600 text-white placeholder:text-green-300"
              />
              {selectedProductData && (
                <p className="text-xs text-green-200 mt-1">
                  {t('per')} {selectedProductData.unit}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity" className="text-white font-semibold text-base">{t('quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                className="mt-1.5 bg-green-800 border-green-600 text-white placeholder:text-green-300"
              />
            </div>
          </div>

          <div className="bg-green-950 border border-green-700 rounded-lg p-4">
            <h4 className="font-medium text-green-100 mb-2">{t('submissionGuidelines')}</h4>
            <ul className="text-sm text-green-300 space-y-1">
              <li>• {t('guidelineAccurate')}</li>
              <li>• {t('guidelineReview')}</li>
              <li>• {t('guidelineUpdate')}</li>
              <li>• {t('guidelineOutdated')}</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || submitted || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('submitting') || 'Submitting...'}
              </>
            ) : submitted ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('submittedSuccessfully')}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t('submitPrice')}
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

