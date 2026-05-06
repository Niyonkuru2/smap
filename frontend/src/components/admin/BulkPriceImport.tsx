import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Upload, Download, Sparkles, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { generateAllPrices, generateMissingPrices } from '../../lib/autoPriceGenerator';
import { usePrices, useProducts, useMarkets } from '../../hooks/useAppData';
import { globalPriceSubmissions } from '../../state/globalState';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BulkPriceImport() {
  const { t } = useLanguage();
  const [importText, setImportText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { prices: priceData } = usePrices();
  const { products } = useProducts();
  const { markets } = useMarkets();

  const handleAutoGenerate = () => {
    setIsGenerating(true);

    // Simulate generation delay
    setTimeout(() => {
      // Generate prices for all products without prices
      const newPrices = generateMissingPrices(products, markets, priceData);

      // Add to global submissions as pre-approved
      newPrices.forEach((price: any) => {
        const submission = {
          id: Math.random().toString(36).substr(2, 9),
          productId: price.productId,
          marketId: price.marketId,
          vendorId: 'system',
          vendorName: 'System Generated',
          price: price.current,
          quantity: 1,
          unit: 'kg',
          submittedAt: new Date(),
          status: 'approved' as const,
          ageInHours: 0
        };

        globalPriceSubmissions.push(submission);
      });

      setIsGenerating(false);
      toast.success(`Successfully generated ${newPrices.length} prices for products without data!`);
    }, 1500);
  };

  const handleGenerateAll = () => {
    setIsGenerating(true);

    setTimeout(() => {
      // Generate prices for ALL products in ALL markets
      const allPrices = generateAllPrices(products, markets);

      // Add to global submissions as pre-approved
      allPrices.forEach((price: any) => {
        const submission = {
          id: Math.random().toString(36).substr(2, 9),
          productId: price.productId,
          marketId: price.marketId,
          vendorId: 'system',
          vendorName: 'System Generated',
          price: price.current,
          quantity: 1,
          unit: 'kg',
          submittedAt: new Date(),
          status: 'approved' as const,
          ageInHours: 0
        };

        globalPriceSubmissions.push(submission);
      });

      setIsGenerating(false);
      toast.success(`Successfully generated ${allPrices.length} prices across all products and markets!`);
    }, 2000);
  };

  const handleBulkImport = () => {
    if (!importText.trim()) {
      toast.error('Please paste CSV data to import');
      return;
    }

    try {
      // Parse CSV format: productId, marketId, price
      const lines = importText.trim().split('\n');
      let successCount = 0;
      let errorCount = 0;

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('product')) {
          return; // Skip header
        }

        const [productId, marketId, price] = line.split(',').map(s => s.trim());

        if (productId && marketId && price) {
          const submission = {
            id: Math.random().toString(36).substr(2, 9),
            productId,
            marketId,
            vendorId: 'bulk-import',
            vendorName: 'Bulk Import',
            price: parseFloat(price),
            quantity: 1,
            unit: 'kg',
            submittedAt: new Date(),
            status: 'approved' as const,
            ageInHours: 0
          };

          globalPriceSubmissions.push(submission);
          successCount++;
        } else {
          errorCount++;
        }
      });

      if (successCount > 0) {
        toast.success(`Imported ${successCount} prices successfully!`);
        setImportText('');
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} rows had errors and were skipped`);
      }
    } catch (error) {
      toast.error('Error parsing CSV data. Please check the format.');
    }
  };

  const downloadTemplate = () => {
    const template = `productId,marketId,price
p1,m1,1200
p4,m2,850
p9,m1,3500
p13,m3,5200`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Auto-Generate Section */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 p-3 rounded-xl">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 gradient-text">🪄 {t('autoGeneratePrices')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('autoGenerateDescription')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('fillMissingProducts')}
                  </>
                )}
              </Button>

              <Button
                onClick={handleGenerateAll}
                disabled={isGenerating}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('generateAllProducts')}
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-white">{t('fillMissingProducts')}:</strong> {t('fillMissingDesc')}
                </div>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-white">{t('generateAllProducts')}:</strong> {t('generateAllDesc')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CSV Import Section */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-primary/20 p-3 rounded-xl">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 gradient-text">
              <BarChart3 className="h-5 w-5" /> {t('bulkCsvImport')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('csvImportDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">{t('csvData')}</label>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="btn-outline-premium"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadTemplate')}
              </Button>
            </div>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="productId,marketId,price&#10;p1,m1,1200&#10;p4,m2,850&#10;p9,m1,3500"
              rows={8}
              className="font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>

          <Button onClick={handleBulkImport} className="w-full bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            {t('importPrices')}
          </Button>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="font-medium text-sm mb-2 text-white">{t('csvFormatGuide')}</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• <strong className="text-white">{t('csvColumn1')}</strong></p>
            <p>• <strong className="text-white">{t('csvColumn2')}</strong></p>
            <p>• <strong className="text-white">{t('csvColumn3')}</strong></p>
            <p>• {t('csvHeaderNote')}</p>
            <p>• {t('csvAutoApprove')}</p>
          </div>
        </div>
      </Card>

      {/* Reference IDs */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="font-semibold mb-4 gradient-text">{t('referenceIds')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-white">{t('productIds')}:</h4>
            <div className="space-y-1 text-xs font-mono">
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p1</Badge> <span className="text-muted-foreground">Rice (Local)</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p2</Badge> <span className="text-muted-foreground">Rice (Imported)</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p3</Badge> <span className="text-muted-foreground">Beans (Red)</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p4</Badge> <span className="text-muted-foreground">Tomatoes</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p5</Badge> <span className="text-muted-foreground">Onions</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p9</Badge> <span className="text-muted-foreground">Bananas</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">p13</Badge> <span className="text-muted-foreground">Chicken</span></p>
              <p className="text-muted-foreground">... {t('andMore').replace('{count}', '13')}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-white">{t('marketIds')}:</h4>
            <div className="space-y-1 text-xs font-mono">
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">m1-m5</Badge> <span className="text-muted-foreground">🏙️ {t('kigaliCity')} (5 {t('markets')})</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">m6-m11</Badge> <span className="text-muted-foreground">🌄 {t('northernProvince')} (6 {t('markets')})</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">m12-m14</Badge> <span className="text-muted-foreground">🌅 {t('easternProvince')} (3 {t('markets')})</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">m15-m17</Badge> <span className="text-muted-foreground">🏞️ {t('southernProvince')} (3 {t('markets')})</span></p>
              <p><Badge variant="outline" className="bg-white/5 border-primary/30 text-primary">m18-m20</Badge> <span className="text-muted-foreground">🌊 {t('westernProvince')} (3 {t('markets')})</span></p>
              <p className="text-muted-foreground mt-2"><strong className="text-white">{t('totalMarkets').replace('{count}', '20')}</strong></p>
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.2s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}