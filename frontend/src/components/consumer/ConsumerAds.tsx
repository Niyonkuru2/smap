// components/consumer/ConsumerAds.tsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Eye, MousePointerClick, Calendar, ExternalLink, Loader2, Megaphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { getActiveAdvertisements, trackAdClick, type Advertisement } from '../../services/advertisementService';

export default function ConsumerAds() {
    const [ads, setAds] = useState<Advertisement[]>([]);
    const [loading, setLoading] = useState(true);
    const [clickedAdId, setClickedAdId] = useState<number | null>(null);
    const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchActiveAds();
    }, []);

    const fetchActiveAds = async () => {
        setLoading(true);
        try {
            const data = await getActiveAdvertisements({ limit: 12 });
            setAds(data);
        } catch (error) {
            console.error('Error fetching ads:', error);
            toast.error('Failed to load advertisements');
        } finally {
            setLoading(false);
        }
    };

    const handleAdClick = async (ad: Advertisement) => {
        setClickedAdId(ad.id);
        try {
            // Track the click
            await trackAdClick(ad.id);
            
            // Show modal with ad details instead of external navigation
            setSelectedAd(ad);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error tracking ad click:', error);
            // Still show the modal even if tracking fails
            setSelectedAd(ad);
            setIsModalOpen(true);
        } finally {
            setClickedAdId(null);
        }
    };

    const handleVisitWebsite = (targetUrl: string | null) => {
        if (targetUrl) {
            window.open(targetUrl, '_blank');
        } else {
            toast.info('No website link available for this offer');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Recently added';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Recently added';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Recently added';
        }
    };

    const getAdTypeLabel = (type: string) => {
        switch (type) {
            case 'featured':
                return { label: 'Featured', color: 'bg-amber-500/80' };
            case 'sponsored':
                return { label: 'Sponsored', color: 'bg-purple-500/80' };
            case 'banner':
                return { label: 'Banner', color: 'bg-blue-500/80' };
            case 'popup':
                return { label: 'Promotion', color: 'bg-emerald-500/80' };
            default:
                return { label: 'Offer', color: 'bg-primary/80' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading sponsored deals...</span>
            </div>
        );
    }

    if (ads.length === 0) {
        return (
            <Card className="p-16 text-center dark-glass border-white/10 shadow-lg rounded-2xl">
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Megaphone className="h-10 w-10 text-primary/60" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Sponsored Deals</h3>
                    <p className="text-muted-foreground">Check back later for great offers from our trusted vendors!</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold gradient-text">Sponsored Deals & Offers</h2>
                    <p className="text-sm text-muted-foreground">Exclusive promotions from our trusted vendors</p>
                </div>
                <div className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                    {ads.length} active offers
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => {
                    const adType = getAdTypeLabel(ad.advertisement_type);
                    return (
                        <Card 
                            key={ad.id} 
                            className="overflow-hidden rounded-2xl dark-glass border-white/10 shadow-lg hover:shadow-xl transition-all hover:border-primary/50 cursor-pointer group"
                            onClick={() => handleAdClick(ad)}
                        >
                            {/* Ad Image */}
                            <div className="relative h-48 bg-gradient-to-br from-primary/10 to-purple-500/10 overflow-hidden">
                                {ad.image_url ? (
                                    <img 
                                        src={ad.image_url} 
                                        alt={ad.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                                                <Megaphone className="h-8 w-8 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Badges */}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`text-xs ${adType.color} text-white px-2.5 py-1 rounded-full backdrop-blur-sm font-medium`}>
                                        {adType.label}
                                    </span>
                                </div>
                            </div>

                            {/* Ad Content */}
                            <div className="p-5">
                                <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    {ad.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {ad.description || 'Special offer from our trusted vendor. Click to learn more!'}
                                </p>

                                {/* Ad Stats */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-3.5 w-3.5" />
                                            {ad.views_count.toLocaleString()} views
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MousePointerClick className="h-3.5 w-3.5" />
                                            {ad.clicks_count.toLocaleString()} clicks
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(ad.created_at)}
                                    </span>
                                </div>

                                {/* Action Button */}
                                <Button 
                                    variant="outline" 
                                    className="w-full btn-outline-premium group-hover:border-primary/50 group-hover:text-primary"
                                    disabled={clickedAdId === ad.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdClick(ad);
                                    }}
                                >
                                    {clickedAdId === ad.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            View Offer
                                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Ad Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="dark-glass border-white/10 sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    {selectedAd && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="gradient-text text-xl flex items-center justify-between">
                                    <span>{selectedAd.title}</span>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5">
                                {/* Modal Image */}
                                {selectedAd.image_url && (
                                    <div className="rounded-xl overflow-hidden">
                                        <img 
                                            src={selectedAd.image_url} 
                                            alt={selectedAd.title}
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-2">About this offer</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedAd.description || 'Special offer from our trusted vendor.'}
                                    </p>
                                </div>

                                {/* Offer Details */}
                                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Offer Type</p>
                                        <p className="text-sm font-medium text-white capitalize">{selectedAd.advertisement_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Placement</p>
                                        <p className="text-sm font-medium text-white capitalize">{selectedAd.placement || 'Standard'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Added Date</p>
                                        <p className="text-sm font-medium text-white">{formatDate(selectedAd.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Performance</p>
                                        <p className="text-sm font-medium text-white">{selectedAd.views_count.toLocaleString()} views</p>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Button 
                                    className="w-full bg-primary hover:bg-primary/90"
                                    onClick={() => handleVisitWebsite(selectedAd.target_url)}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Visit Website
                                </Button>

                                <p className="text-xs text-muted-foreground text-center">
                                    You will be redirected to the vendor's website. Prices and availability may vary.
                                </p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}