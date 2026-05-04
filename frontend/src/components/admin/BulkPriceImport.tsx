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
      <Card className="p-6 bg-gradient-to-br from-green-950 to-green-900 border-2 border-green-700">
        <div className="flex items-start gap-4">
          <div className="bg-green-600 p-3 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🪄 {t('autoGeneratePrices')}</h3>
            <p className="text-sm text-slate-600 mb-4">
              {t('autoGenerateDescription')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
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
                className="border-green-600"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
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

            <div className="mt-4 p-3 bg-green-950 rounded-lg border border-green-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-200">
                  <strong>{t('fillMissingProducts')}:</strong> {t('fillMissingDesc')}
                </div>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-200">
                  <strong>{t('generateAllProducts')}:</strong> {t('generateAllDesc')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CSV Import Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-green-600 p-3 rounded-lg">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> {t('bulkCsvImport')}</h3>
            <p className="text-sm text-slate-600">
              {t('csvImportDescription')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{t('csvData')}</label>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
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
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleBulkImport} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {t('importPrices')}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-green-950 rounded-lg border border-green-700">
          <h4 className="font-medium text-sm mb-2 text-green-200">{t('csvFormatGuide')}</h4>
          <div className="space-y-1 text-xs text-green-300">
            <p>• <strong>{t('csvColumn1')}</strong></p>
            <p>• <strong>{t('csvColumn2')}</strong></p>
            <p>• <strong>{t('csvColumn3')}</strong></p>
            <p>• {t('csvHeaderNote')}</p>
            <p>• {t('csvAutoApprove')}</p>
          </div>
        </div>
      </Card>

      {/* Reference IDs */}
      <Card className="p-6 bg-green-950 border border-green-700">
        <h3 className="font-semibold mb-4">{t('referenceIds')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">{t('productIds')}:</h4>
            <div className="space-y-1 text-xs font-mono">
              <p><Badge variant="outline">p1</Badge> Rice (Local)</p>
              <p><Badge variant="outline">p2</Badge> Rice (Imported)</p>
              <p><Badge variant="outline">p3</Badge> Beans (Red)</p>
              <p><Badge variant="outline">p4</Badge> Tomatoes</p>
              <p><Badge variant="outline">p5</Badge> Onions</p>
              <p><Badge variant="outline">p9</Badge> Bananas</p>
              <p><Badge variant="outline">p13</Badge> Chicken</p>
              <p className="text-slate-600">... {t('andMore').replace('{count}', '13')}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">{t('marketIds')}:</h4>
            <div className="space-y-1 text-xs font-mono">
              <p><Badge variant="outline" className="bg-green-900">m1-m5</Badge> 🏙️ {t('kigaliCity')} (5 {t('markets')})</p>
              <p><Badge variant="outline" className="bg-green-900">m6-m11</Badge> 🌄 {t('northernProvince')} (6 {t('markets')})</p>
              <p><Badge variant="outline" className="bg-green-900">m12-m14</Badge> 🌅 {t('easternProvince')} (3 {t('markets')})</p>
              <p><Badge variant="outline" className="bg-green-900">m15-m17</Badge> 🏞️ {t('southernProvince')} (3 {t('markets')})</p>
              <p><Badge variant="outline" className="bg-green-900">m18-m20</Badge> 🌊 {t('westernProvince')} (3 {t('markets')})</p>
              <p className="text-slate-600 mt-2"><strong>{t('totalMarkets').replace('{count}', '20')}</strong></p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
