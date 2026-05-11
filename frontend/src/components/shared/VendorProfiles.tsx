import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  ShieldCheck,
  ThumbsUp,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  User,
  Store,
  Loader2,
  RefreshCw,
  Award,
  Zap,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVendors, type Vendor as APIVendor } from '../../services/vendorService';
import { getVendorPriceStats } from '../../services/priceSubmissionService';

// Types
interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  marketId?: string;
  marketName?: string;
  province?: string;
  district?: string;
  joinedDate: string;
  verified: boolean;
  trustScore: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectionRate: number;
  averageRating: number;
  totalReviews: number;
  topProducts: string[];
  recentActivity: string;
  badges: VendorBadge[];
  category?: string;
  is_active?: boolean;
}

interface VendorBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
}

interface VendorReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  category: 'accuracy' | 'reliability' | 'service';
  verified: boolean;
}

// Main Export - Vendor Profiles Page
export function VendorProfiles() {
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  const handleSubmitReview = (review: Partial<VendorReview>) => {
    console.log('Review submitted:', review);
  };

  if (selectedVendor) {
    return (
      <VendorProfileDetail
        vendor={selectedVendor}
        onBack={() => setSelectedVendor(null)}
        onSubmitReview={handleSubmitReview}
      />
    );
  }

  return <VendorList onSelectVendor={setSelectedVendor} />;
}

// Vendor List Component
interface VendorListProps {
  onSelectVendor: (vendor: VendorProfile) => void;
}

export function VendorList({ onSelectVendor }: VendorListProps) {
  const { language } = useLanguage();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'trust' | 'recent'>('rating');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = {
    en: {
      title: 'Vendor Directory',
      subtitle: 'Find trusted vendors in Rwanda markets',
      search: 'Search vendors...',
      allMarkets: 'All Markets',
      sortBy: 'Sort by',
      rating: 'Rating',
      trustScore: 'Trust Score',
      recent: 'Recent Activity',
      verified: 'Verified',
      reviews: 'reviews',
      submissions: 'submissions',
      viewProfile: 'View Profile',
      noVendors: 'No vendors found',
      refresh: 'Refresh',
    },
    rw: {
      title: 'Urutonde rw\'abacuruzi',
      subtitle: 'Shaka abacuruzi b\'icyizere mu masoko y\'u Rwanda',
      search: 'Shakisha abacuruzi...',
      allMarkets: 'Amasoko Yose',
      sortBy: 'Shyira',
      rating: 'Amanota',
      trustScore: 'Icyizere',
      recent: 'Ibikorwa bya vuba',
      verified: 'Byemejwe',
      reviews: 'ibitekerezo',
      submissions: 'byoherejwe',
      viewProfile: 'Reba Umwirondoro',
      noVendors: 'Nta bacuruzi babonetse',
      refresh: 'Ongera',
    },
    fr: {
      title: 'Annuaire des vendeurs',
      subtitle: 'Trouvez des vendeurs de confiance sur les marchés rwandais',
      search: 'Rechercher des vendeurs...',
      allMarkets: 'Tous les marchés',
      sortBy: 'Trier par',
      rating: 'Note',
      trustScore: 'Score de confiance',
      recent: 'Activité récente',
      verified: 'Vérifié',
      reviews: 'avis',
      submissions: 'soumissions',
      viewProfile: 'Voir le profil',
      noVendors: 'Aucun vendeur trouvé',
      refresh: 'Actualiser',
    },
  };
  const texts = t[language as keyof typeof t] || t.en;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchVendors();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const apiVendors = await getVendors();
      
      const vendorProfiles = await Promise.all(
        apiVendors.map(async (vendor: APIVendor) => {
          let stats = { total_submissions: 0, approved_submissions: 0, pending_submissions: 0, flagged_submissions: 0 };
          try {
            if (vendor.id) {
              const priceStats = await getVendorPriceStats(vendor.id);
              stats = priceStats;
            }
          } catch (error) {
            console.error(`Error fetching stats for vendor ${vendor.id}:`, error);
          }
          
          let rating = 0;
          if (vendor.rating) {
            rating = typeof vendor.rating === 'string' ? parseFloat(vendor.rating) : vendor.rating;
            if (isNaN(rating)) rating = 0;
          }
          
          let rejectionRate = 0;
          if (stats.total_submissions > 0) {
            rejectionRate = ((stats.total_submissions - stats.approved_submissions) / stats.total_submissions) * 100;
          }
          
          return {
            id: vendor.id?.toString() || '',
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || '',
            marketId: (vendor as any).market_id,
            marketName: (vendor as any).market_id || 'Unknown Market',
            province: (vendor as any).province || '',
            district: (vendor as any).district || '',
            joinedDate: vendor.created_at || new Date().toISOString(),
            verified: vendor.verified || false,
            trustScore: calculateTrustScore(stats),
            totalSubmissions: stats.total_submissions || 0,
            approvedSubmissions: stats.approved_submissions || 0,
            rejectionRate: rejectionRate,
            averageRating: rating,
            totalReviews: 0,
            topProducts: [],
            recentActivity: vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A',
            badges: getBadgesForVendor(vendor, stats),
            category: vendor.category,
            is_active: vendor.is_active,
          };
        })
      );
      
      setVendors(vendorProfiles);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast.error(error.response?.data?.message || 'Failed to load vendors');
    }
  };

  const calculateTrustScore = (stats: any): number => {
    if (!stats.total_submissions || stats.total_submissions === 0) return 0;
    const approvalRate = (stats.approved_submissions / stats.total_submissions) * 100;
    const anomalyPenalty = (stats.flagged_submissions || 0) * 5;
    const score = approvalRate - anomalyPenalty;
    return Math.max(0, Math.min(100, isNaN(score) ? 0 : score));
  };

  const getBadgesForVendor = (vendor: APIVendor, stats: any): VendorBadge[] => {
    const badges: VendorBadge[] = [];
    
    if (vendor.verified) {
      badges.push({
        id: 'verified',
        name: 'Verified Vendor',
        icon: '✓',
        description: 'Email verified and approved',
        earnedDate: vendor.created_at || new Date().toISOString(),
      });
    }
    
    if (stats.approved_submissions >= 100) {
      badges.push({
        id: 'top-contributor',
        name: 'Top Contributor',
        icon: '🏆',
        description: 'Over 100 approved price submissions',
        earnedDate: new Date().toISOString(),
      });
    } else if (stats.approved_submissions >= 50) {
      badges.push({
        id: 'reliable',
        name: 'Reliable Vendor',
        icon: '⭐',
        description: 'Over 50 approved price submissions',
        earnedDate: new Date().toISOString(),
      });
    }
    
    if (stats.flagged_submissions === 0 && stats.total_submissions > 10) {
      badges.push({
        id: 'accurate',
        name: 'Price Accuracy',
        icon: '🎯',
        description: 'No flagged submissions',
        earnedDate: new Date().toISOString(),
      });
    }
    
    return badges;
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchVendors();
    setRefreshing(false);
  };

  const marketOptions = [...new Map(
    vendors.filter(v => v.marketId).map(v => [v.marketId, { id: v.marketId, name: v.marketName }])
  ).values()];

  const filteredVendors = vendors
    .filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.marketName && v.marketName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMarket = filterMarket === 'all' || v.marketId === filterMarket;
      return matchesSearch && matchesMarket;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'trust') return b.trustScore - a.trustScore;
      return new Date(b.recentActivity).getTime() - new Date(a.recentActivity).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading vendors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{texts.title}</h2>
          <p className="text-muted-foreground mt-1">{texts.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={refreshing}
          className="btn-outline-premium"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {texts.refresh}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={texts.search}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
              aria-label={texts.search}
            />
          </div>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:border-primary/50 focus:outline-none"
            aria-label={texts.allMarkets}
          >
            <option value="all">{texts.allMarkets}</option>
            {marketOptions.filter(m => m.id).map((market) => (
              <option key={market.id} value={market.id}>
                {market.name?.replace(' Market', '') || market.id}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:border-primary/50 focus:outline-none"
            aria-label={texts.sortBy}
          >
            <option value="rating">{texts.rating}</option>
            <option value="trust">{texts.trustScore}</option>
            <option value="recent">{texts.recent}</option>
          </select>
        </div>
      </Card>

      {/* Stats Cards */}
      {vendors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-semibold text-white">{vendors.length}</p>
              </div>
              <Store className="h-8 w-8 text-primary/40" />
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-semibold text-emerald-400">{vendors.filter(v => v.verified).length}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-emerald-500/60" />
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Trust Score</p>
                <p className="text-2xl font-semibold text-primary">
                  {Math.round(vendors.reduce((acc, v) => acc + v.trustScore, 0) / vendors.length)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-primary/60" />
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-semibold text-white">
                  {vendors.reduce((acc, v) => acc + v.totalSubmissions, 0).toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-primary/40" />
            </div>
          </Card>
        </div>
      )}

      {/* Vendor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="group rounded-xl dark-glass border-white/10 shadow-lg hover:border-primary/50 transition-all cursor-pointer hover:shadow-xl overflow-hidden"
            onClick={() => onSelectVendor(vendor)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
                  <Store className="h-7 w-7 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-base truncate">{vendor.name}</h3>
                    {vendor.verified && (
                      <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.marketName?.replace(' Market', '') || 'Unknown Market'}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="ml-1 text-sm font-semibold text-white">
                        {typeof vendor.averageRating === 'number' ? vendor.averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">{vendor.trustScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{vendor.totalSubmissions}</span>
                    </div>
                  </div>

                  {vendor.badges.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {vendor.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge.id}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
                          title={badge.description}
                        >
                          {badge.icon} {badge.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
            <p className="font-medium text-white">{texts.noVendors}</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Vendor Profile Detail Component (simplified for brevity - same functionality)
interface VendorProfileDetailProps {
  vendor: VendorProfile;
  onBack: () => void;
  onSubmitReview: (review: Partial<VendorReview>) => void;
}

export function VendorProfileDetail({ vendor, onBack, onSubmitReview }: VendorProfileDetailProps) {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', category: 'accuracy' as const });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    en: {
      back: 'Back to vendors',
      about: 'About',
      reviews: 'Reviews',
      statistics: 'Statistics',
      memberSince: 'Member since',
      trustScore: 'Trust Score',
      totalSubmissions: 'Total Submissions',
      approvalRate: 'Approval Rate',
      lastActive: 'Last Active',
      writeReview: 'Write a Review',
      yourRating: 'Your Rating',
      category: 'Category',
      accuracy: 'Price Accuracy',
      reliability: 'Reliability',
      service: 'Service',
      yourComment: 'Your Comment',
      commentPlaceholder: 'Share your experience with this vendor...',
      submitReview: 'Submit Review',
      helpful: 'Helpful',
      verifiedPurchase: 'Verified Purchase',
      badges: 'Badges & Achievements',
      noProducts: 'No products yet',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
    },
    rw: {
      back: 'Subira ku bacuruzi',
      about: 'Ibyerekeye',
      reviews: 'Ibitekerezo',
      statistics: 'Imibare',
      memberSince: 'Umunyamuryango kuva',
      trustScore: 'Amanota y\'icyizere',
      totalSubmissions: 'Byoherejwe byose',
      approvalRate: 'Igipimo cy\'kwemeza',
      lastActive: 'Igihe yakoresheje',
      writeReview: 'Andika Igitekerezo',
      yourRating: 'Amanota yawe',
      category: 'Icyiciro',
      accuracy: 'Ubwiza bw\'ibiciro',
      reliability: 'Kwizerwa',
      service: 'Serivisi',
      yourComment: 'Igitekerezo cyawe',
      commentPlaceholder: 'Sangiza uburambe bwawe n\'uyu mucuruzi...',
      submitReview: 'Ohereza Igitekerezo',
      helpful: 'Bifasha',
      verifiedPurchase: 'Kugura kwemejwe',
      badges: 'Ibihembo n\'Ibyagezweho',
      noProducts: 'Nta bicuruzwa biri',
      email: 'Imeri',
      phone: 'Telefone',
      location: 'Aho aherereye',
    },
    fr: {
      back: 'Retour aux vendeurs',
      about: 'À propos',
      reviews: 'Avis',
      statistics: 'Statistiques',
      memberSince: 'Membre depuis',
      trustScore: 'Score de confiance',
      totalSubmissions: 'Total des soumissions',
      approvalRate: "Taux d'approbation",
      lastActive: 'Dernière activité',
      writeReview: 'Écrire un avis',
      yourRating: 'Votre note',
      category: 'Catégorie',
      accuracy: 'Précision des prix',
      reliability: 'Fiabilité',
      service: 'Service',
      yourComment: 'Votre commentaire',
      commentPlaceholder: 'Partagez votre expérience avec ce vendeur...',
      submitReview: 'Soumettre un avis',
      helpful: 'Utile',
      verifiedPurchase: 'Achat vérifié',
      badges: 'Badges et réalisations',
      noProducts: 'Aucun produit',
      email: 'Email',
      phone: 'Téléphone',
      location: 'Emplacement',
    },
  };
  const texts = t[language as keyof typeof t] || t.en;

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const review: VendorReview = {
        id: `r${Date.now()}`,
        reviewerName: 'You',
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        category: newReview.category,
        verified: false,
      };

      setReviews([review, ...reviews]);
      setNewReview({ rating: 5, comment: '', category: 'accuracy' });
      toast.success('Review submitted successfully!');
      onSubmitReview(review);
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    const safeRating = typeof rating === 'number' ? rating : 0;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= safeRating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const approvalRate = vendor.totalSubmissions > 0 
    ? ((vendor.approvedSubmissions / vendor.totalSubmissions) * 100).toFixed(0)
    : '0';

  const displayRating = typeof vendor.averageRating === 'number' ? vendor.averageRating.toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-white hover:bg-white/10">
        <ArrowLeft className="h-4 w-4" />
        {texts.back}
      </Button>

      {/* Profile Header - Dark Glass Style */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold gradient-text">{vendor.name}</h1>
                  {vendor.verified && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {vendor.marketName || 'Unknown Market'}, {vendor.district || ''}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {renderStars(Math.floor(typeof vendor.averageRating === 'number' ? vendor.averageRating : 0))}
                  <span className="text-sm text-muted-foreground">
                    {displayRating} ({vendor.totalReviews} {texts.reviews})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-green-900/20 border border-green-700/30">
                <p className="text-2xl font-bold text-green-400">{vendor.trustScore}%</p>
                <p className="text-[11px] text-muted-foreground">{texts.trustScore}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-bold text-white">{vendor.totalSubmissions}</p>
                <p className="text-[11px] text-muted-foreground">{texts.totalSubmissions}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30">
                <p className="text-2xl font-bold text-emerald-400">{approvalRate}%</p>
                <p className="text-[11px] text-muted-foreground">{texts.approvalRate}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-bold text-white">{vendor.totalReviews}</p>
                <p className="text-[11px] text-muted-foreground">{texts.reviews}</p>
              </div>
            </div>
          </div>

          {vendor.badges.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{texts.badges}</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.badges.map((badge) => (
                  <Badge key={badge.id} variant="outline" className="gap-1 py-1 border-white/10 bg-white/5">
                    <span>{badge.icon}</span>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs - Dark Glass Style */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="about" className="text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            {texts.about}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            {texts.reviews}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            {texts.statistics}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4 mt-4">
          <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{texts.memberSince}</p>
                  <p className="flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(vendor.joinedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{texts.lastActive}</p>
                  <p className="flex items-center gap-2 text-white">
                    <Clock className="h-4 w-4 text-primary" />
                    {vendor.recentActivity}
                  </p>
                </div>
                {vendor.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">{texts.phone}</p>
                    <p className="flex items-center gap-2 text-white">
                      <Phone className="h-4 w-4 text-primary" />
                      {vendor.phone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">{texts.email}</p>
                  <p className="flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-primary" />
                    {vendor.email}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">{texts.location}</p>
                  <p className="flex items-center gap-2 text-white">
                    <MapPin className="h-4 w-4 text-primary" />
                    {vendor.district || ''}, {vendor.province || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 mt-4">
          <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg gradient-text">{texts.writeReview}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{texts.yourRating}</label>
                <div className="mt-1">
                  {renderStars(newReview.rating, true, (r) => setNewReview({ ...newReview, rating: r }))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{texts.category}</label>
                <select
                  value={newReview.category}
                  onChange={(e) => setNewReview({ ...newReview, category: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-primary/50 focus:outline-none"
                  aria-label={texts.category}
                >
                  <option value="accuracy">{texts.accuracy}</option>
                  <option value="reliability">{texts.reliability}</option>
                  <option value="service">{texts.service}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{texts.yourComment}</label>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder={texts.commentPlaceholder}
                  rows={3}
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                />
              </div>

              <Button onClick={handleSubmitReview} disabled={isSubmitting} className="btn-premium w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : texts.submitReview}
              </Button>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="rounded-xl dark-glass border-white/10 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{review.reviewerName}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {texts.verifiedPurchase}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="text-xs bg-white/5 text-muted-foreground border-white/10">
                        {review.category === 'accuracy' ? texts.accuracy :
                         review.category === 'reliability' ? texts.reliability : texts.service}
                      </Badge>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                        {texts.helpful} ({review.helpful})
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-white mb-4">Submission History</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-muted-foreground">Total Submissions</span>
                      <span className="font-medium text-white">{vendor.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-muted-foreground">Approved</span>
                      <span className="font-medium text-emerald-400">{vendor.approvedSubmissions}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-muted-foreground">Rejection Rate</span>
                      <span className="font-medium text-rose-400">
                        {typeof vendor.rejectionRate === 'number' ? vendor.rejectionRate.toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-muted-foreground">Trust Score</span>
                      <span className="font-medium text-primary">{vendor.trustScore}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-4">Rating Breakdown</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-8 text-sm text-white">{star} ★</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VendorProfiles;