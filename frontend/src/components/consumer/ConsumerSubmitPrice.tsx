import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { toast } from 'sonner';
import { submitPrice } from '../../lib/api';

export default function ConsumerSubmitPrice() {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const [formData, setFormData] = useState({
    productId: '',
    marketId: '',
    price: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.marketId || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitPrice({
        productId: formData.productId,
        marketId: formData.marketId,
        price: parseFloat(formData.price),
        unit: selectedProduct?.unit || 'kg',
        notes: formData.notes
      });

      if (result.success) {
        toast.success('Price submitted successfully! Pending admin verification.');
        
        // Reset form
        setFormData({
          productId: '',
          marketId: '',
          price: '',
          notes: ''
        });
      } else {
        toast.error(result.error || 'Failed to submit price');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error?.message || 'Failed to submit price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Help the community by reporting prices you've seen at local markets. Your submission will be verified by our admin team before being published.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <h2 className="text-xl mb-6">Submit a Price</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product">Product *</Label>
            <Select 
              value={formData.productId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="market">Market *</Label>
            <Select 
              value={formData.marketId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, marketId: value }))}
            >
              <SelectTrigger id="market">
                <SelectValue placeholder="Select a market" />
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

          <div>
            <Label htmlFor="price">
              Price (RWF) * {selectedProduct && `per ${selectedProduct.unit}`}
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price in RWF"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              min="0"
              step="1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="E.g., Quality, availability, special offers..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-950 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <p className="text-sm text-green-300">
              By submitting, you confirm this price is accurate as of today.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Price'}
          </Button>
        </form>
      </Card>

      <Card className="p-6 bg-secondary">
        <h3 className="font-medium mb-2">Submission Guidelines</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Only submit prices you've personally seen or purchased</li>
          <li>Ensure prices are current (within the last 24 hours)</li>
          <li>Double-check the market and product selection</li>
          <li>Provide additional context if prices vary by quality or quantity</li>
          <li>Submissions typically reviewed within 2-4 hours</li>
        </ul>
      </Card>
    </div>
  );
}

