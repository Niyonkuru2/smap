import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShoppingCart, Plus, Trash2, TrendingDown, Calculator, Share2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../lib/clipboard';

export interface ShoppingListItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
}

export interface MarketTotal {
  marketId: string;
  marketName: string;
  totalPrice: number;
  distance?: number;
}

interface ShoppingListProps {
  items: ShoppingListItem[];
  onAddItem: (item: Omit<ShoppingListItem, 'id'>) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  marketTotals?: MarketTotal[];
}

export function ShoppingList({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  marketTotals = []
}: ShoppingListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: '',
    quantity: 1,
    unit: 'kg',
    estimatedPrice: 0
  });

  const handleAddItem = () => {
    if (!newItem.productName) {
      toast.error('Please enter a product name');
      return;
    }

    if (newItem.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    onAddItem(newItem);

    // Reset form
    setNewItem({
      productName: '',
      quantity: 1,
      unit: 'kg',
      estimatedPrice: 0
    });
    setShowAddForm(false);

    toast.success('Item added to shopping list!');
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0);
  };

  const handleShare = async () => {
    const listText = items
      .map(item => `${item.quantity} ${item.unit} ${item.productName} - ${(item.estimatedPrice * item.quantity).toLocaleString()} RWF`)
      .join('\n');
    
    const totalText = `\nTotal: ${calculateTotal().toLocaleString()} RWF`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Shopping List',
          text: listText + totalText
        });
      } catch (error) {
        // User cancelled share or fallback to clipboard
        const success = await copyToClipboard(listText + totalText);
        if (success) {
          toast.success('Shopping list copied to clipboard!');
        } else {
          toast.error('Failed to copy. Please try selecting and copying manually.');
        }
      }
    } else {
      const success = await copyToClipboard(listText + totalText);
      if (success) {
        toast.success('Shopping list copied to clipboard!');
      } else {
        toast.error('Failed to copy. Please try selecting and copying manually.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List & Budget Calculator
          </h3>
          <p className="text-sm text-muted-foreground">
            Plan your shopping and compare prices across markets
          </p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <Card className="p-4">
          <h4 className="mb-4">Add Item to List</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g., Tomatoes"
                value={newItem.productName}
                onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="kg"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedPrice">Estimated Price (per unit)</Label>
              <Input
                id="estimatedPrice"
                type="number"
                min="0"
                placeholder="1000"
                value={newItem.estimatedPrice || ''}
                onChange={(e) => setNewItem({ ...newItem, estimatedPrice: parseFloat(e.target.value) || 0 })}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll find the best prices for you
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="flex-1">
                Add Item
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Shopping List Items */}
      {items.length > 0 ? (
        <>
          <Card className="p-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4>{item.productName}</h4>
                      <span className="text-sm text-muted-foreground">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.estimatedPrice.toLocaleString()} RWF per {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-medium">
                        {(item.estimatedPrice * item.quantity).toLocaleString()} RWF
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0.1, item.quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onRemoveItem(item.id);
                        toast.success('Item removed');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Total Calculation */}
          <Card className="p-4 bg-gradient-to-br from-green-950 to-green-900 border-green-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="flex items-center gap-2 text-green-100">
                <Calculator className="h-5 w-5" />
                Budget Summary
              </h4>
              <div className="text-right">
                <p className="text-sm text-green-400">Total Cost</p>
                <p className="text-2xl text-green-100">{calculateTotal().toLocaleString()} RWF</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-700">
              <div>
                <p className="text-xs text-green-400">Items</p>
                <p className="text-lg text-green-100">{items.length}</p>
              </div>
              <div>
                <p className="text-xs text-green-400">Average per item</p>
                <p className="text-lg text-green-100">
                  {items.length > 0 ? Math.round(calculateTotal() / items.length).toLocaleString() : 0} RWF
                </p>
              </div>
              <div>
                <p className="text-xs text-green-400">Total units</p>
                <p className="text-lg text-green-100">
                  {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}
                </p>
              </div>
            </div>
          </Card>

          {/* Market Comparison */}
          {marketTotals.length > 0 && (
            <Card className="p-4">
              <h4 className="mb-4">Best Markets for Your List</h4>
              <div className="space-y-3">
                {marketTotals
                  .sort((a, b) => a.totalPrice - b.totalPrice)
                  .map((market, index) => (
                    <div 
                      key={market.marketId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-green-500 text-white' :
                          index === 1 ? 'bg-green-600 text-white' :
                          index === 2 ? 'bg-green-700 text-white' :
                          'bg-green-300 text-green-900'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{market.marketName}</p>
                          {market.distance && (
                            <p className="text-sm text-muted-foreground">
                              {market.distance.toFixed(1)} km away
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {market.totalPrice.toLocaleString()} RWF
                        </p>
                        {index === 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <TrendingDown className="h-3 w-3" />
                            Best value
                          </div>
                        )}
                        {index > 0 && (
                          <p className="text-sm text-muted-foreground">
                            +{(market.totalPrice - marketTotals[0].totalPrice).toLocaleString()} RWF
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {marketTotals.length > 1 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900 flex items-center gap-1">
                    <Coins className="h-4 w-4" /> Save{' '}
                    <span className="font-semibold">
                      {(marketTotals[marketTotals.length - 1].totalPrice - marketTotals[0].totalPrice).toLocaleString()} RWF
                    </span>
                    {' '}by shopping at {marketTotals[0].marketName}!
                  </p>
                </div>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="mb-2">Your shopping list is empty</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add items to compare prices and plan your budget
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Item
          </Button>
        </Card>
      )}
    </div>
  );
}
