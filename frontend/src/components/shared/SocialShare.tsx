import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Twitter,
  Facebook,
  Mail,
  Link2,
  QrCode
} from 'lucide-react';

interface ShareData {
  title: string;
  text: string;
  url?: string;
  productName?: string;
  marketName?: string;
  price?: number;
  unit?: string;
}

interface SocialShareProps {
  data: ShareData;
  variant?: 'button' | 'icon';
}

export function SocialShare({ data, variant = 'button' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = data.url || window.location.href;
  
  const generateWhatsAppText = () => {
    if (data.productName && data.price) {
      return encodeURIComponent(
        `🛒 Market Price Update!\n\n` +
        `📦 ${data.productName}\n` +
        `📍 ${data.marketName || 'Market'}\n` +
        `💰 ${data.price} RWF/${data.unit || 'kg'}\n\n` +
        `Check more prices: ${shareUrl}`
      );
    }
    return encodeURIComponent(`${data.text}\n\n${shareUrl}`);
  };

  const generateTwitterText = () => {
    if (data.productName && data.price) {
      return encodeURIComponent(
        `${data.productName} at ${data.marketName}: ${data.price} RWF/${data.unit || 'kg'} 🛒 #RwandaMarket`
      );
    }
    return encodeURIComponent(data.text);
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${generateWhatsAppText()}`,
    twitter: `https://twitter.com/intent/tweet?text=${generateTwitterText()}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(data.text)}`,
    email: `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.text}\n\n${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(data.text)}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          setIsOpen(true);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const ShareButton = ({ 
    icon: Icon, 
    label, 
    href, 
    color,
    onClick 
  }: { 
    icon: React.ElementType; 
    label: string; 
    href?: string; 
    color: string;
    onClick?: () => void;
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all hover:scale-105 ${color}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </a>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" onClick={handleNativeShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Price Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Price Preview */}
          {data.productName && data.price && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{data.productName}</p>
              {data.marketName && (
                <p className="text-sm text-muted-foreground">{data.marketName}</p>
              )}
              <p className="text-lg font-bold text-green-600">
                {data.price} RWF/{data.unit || 'kg'}
              </p>
            </div>
          )}

          {/* Share Buttons Grid */}
          <div className="grid grid-cols-4 gap-2">
            <ShareButton 
              icon={MessageCircle} 
              label="WhatsApp" 
              href={shareLinks.whatsapp}
              color="bg-green-100 text-green-700 hover:bg-green-200"
            />
            <ShareButton 
              icon={Facebook} 
              label="Facebook" 
              href={shareLinks.facebook}
              color="bg-green-100 text-green-700 hover:bg-green-200"
            />
            <ShareButton 
              icon={Twitter} 
              label="Twitter" 
              href={shareLinks.twitter}
              color="bg-green-100 text-green-700 hover:bg-green-200"
            />
            <ShareButton 
              icon={Mail} 
              label="Email" 
              href={shareLinks.email}
              color="bg-secondary text-muted-foreground hover:bg-gray-200"
            />
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="text-sm"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* QR Code Toggle */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowQR(!showQR)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>

          {showQR && (
            <div className="flex justify-center p-4 bg-card rounded-lg">
              {/* QR Code would be generated here - using a placeholder */}
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick share buttons for inline use
export function QuickShareButtons({ data }: { data: ShareData }) {
  const shareUrl = data.url || window.location.href;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${data.text}\n${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="flex gap-1">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full hover:bg-green-100 transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4 text-green-600" />
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full hover:bg-green-100 transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4 text-green-600" />
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full hover:bg-green-100 transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4 text-green-600" />
      </a>
    </div>
  );
}

export default SocialShare;

