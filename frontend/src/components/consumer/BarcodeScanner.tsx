import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Camera, 
  ScanLine, 
  X, 
  Search, 
  Package,
  Loader2,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanResult {
  code: string;
  format: string;
  productName?: string;
  productId?: number;
}

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onProductFound?: (productId: number, productName: string) => void;
}

export function BarcodeScanner({ onScan, onProductFound }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera for scanning
  const startScanning = async () => {
    setCameraError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      toast.info('Point camera at barcode or QR code');
      
      // Start scanning loop
      requestAnimationFrame(scanFrame);
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Could not access camera');
      toast.error('Could not access camera. Try entering code manually.');
    }
  };

  // Stop camera
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Scan frame for barcodes (simulated - in production use a library like ZXing)
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // In production, use a barcode scanning library like:
      // - @zxing/library
      // - quagga
      // - dynamsoft-javascript-barcode
      
      // For demo, simulate occasional detection
      // This is a placeholder - real implementation would decode the image
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  // Handle manual code entry
  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a barcode or product code');
      return;
    }

    setLoading(true);
    
    try {
      // Look up product by code
      const result = await lookupProduct(manualCode.trim());
      
      if (result) {
        setLastScan({
          code: manualCode,
          format: 'manual',
          productName: result.name,
          productId: result.id
        });
        onScan({ code: manualCode, format: 'manual', ...result });
        if (onProductFound && result.id) {
          onProductFound(result.id, result.name);
        }
        toast.success(`Found: ${result.name}`);
      } else {
        setLastScan({
          code: manualCode,
          format: 'manual'
        });
        onScan({ code: manualCode, format: 'manual' });
        toast.info('Code scanned - product not in database');
      }
    } catch (error) {
      toast.error('Error looking up product');
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };



  // Look up product (would call backend API)
  const lookupProduct = async (code: string): Promise<{ id: number; name: string } | null> => {
    // Simulated lookup - in production, call your API
    const products: Record<string, { id: number; name: string }> = {
      // Grains & Cereals
      '5901234123457': { id: 1, name: 'Maize/Corn' },
      '5901234123458': { id: 2, name: 'Maize Flour' },
      '5901234123459': { id: 3, name: 'Rice (White)' },
      '5901234123460': { id: 4, name: 'Rice (Brown)' },
      '5901234123461': { id: 5, name: 'Wheat Flour' },
      '5901234123462': { id: 6, name: 'Millet' },
      // Legumes
      '5901234123463': { id: 7, name: 'Beans' },
      '5901234123464': { id: 8, name: 'Lentils' },
      '5901234123465': { id: 9, name: 'Peas' },
      // Vegetables
      '012345678905': { id: 10, name: 'Tomatoes' },
      '012345678906': { id: 11, name: 'Onions (Red)' },
      '012345678907': { id: 12, name: 'Onions (White)' },
      '012345678908': { id: 13, name: 'Potatoes' },
      '012345678909': { id: 14, name: 'Cabbage' },
      '012345678910': { id: 15, name: 'Carrots' },
      // Proteins
      '012345678920': { id: 19, name: 'Eggs' },
      '012345678921': { id: 20, name: 'Chicken (Fresh)' },
      '012345678922': { id: 21, name: 'Fish (Tilapia)' },
      '012345678923': { id: 22, name: 'Fish (Sambaza)' },
      // Fruits
      '012345678930': { id: 27, name: 'Bananas' },
      '012345678931': { id: 28, name: 'Plantains' },
      '012345678932': { id: 29, name: 'Oranges' },
      '012345678933': { id: 30, name: 'Mangoes' },
      // Cooking Essentials
      '012345678940': { id: 37, name: 'Cooking Oil' },
      '012345678941': { id: 38, name: 'Salt' },
      '012345678942': { id: 39, name: 'Sugar' },
      '012345678943': { id: 40, name: 'Pepper (Black)' },
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return products[code] || null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-green-500" />
          Barcode / QR Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera View */}
        {isScanning && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                
                {/* Scanning line animation */}
                <div className="absolute w-full h-0.5 bg-green-500 animate-scan"></div>
              </div>
            </div>

            {/* Close button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={stopScanning}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Demo scan button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-1/2 -translate-x-1/2"
              onClick={simulateScan}
            >
              Simulate Scan (Demo)
            </Button>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && (
          <div className="p-4 bg-green-950 dark:bg-green-950 border border-green-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-300 dark:text-green-300">Camera Error</p>
              <p className="text-sm text-green-400 dark:text-green-400">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Scan Buttons */}
        {!isScanning && (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={startScanning} className="h-24 flex-col">
              <Camera className="h-8 w-8 mb-2" />
              Scan Barcode
            </Button>
            <Button onClick={startScanning} variant="outline" className="h-24 flex-col">
              <QrCode className="h-8 w-8 mb-2" />
              Scan QR Code
            </Button>
          </div>
        )}

        {/* Manual Entry */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Or enter code manually:</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode or product code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
            />
            <Button onClick={handleManualEntry} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Last Scan Result */}
        {lastScan && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {lastScan.productName || 'Unknown Product'}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {lastScan.format}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {lastScan.code}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}

export default BarcodeScanner;
