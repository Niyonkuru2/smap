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
  StarHalf,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Package,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Search,
  Filter,
  ArrowLeft,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

// Types
interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  market: string;
  marketName: string;
  province: string;
  district: string;
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

interface VendorStats {
  weeklySubmissions: number;
  monthlySubmissions: number;
  priceAccuracy: number;
  responseTime: string;
  activeProducts: number;
}

// Components
interface VendorListProps {
  onSelectVendor: (vendor: VendorProfile) => void;
}

export function VendorList({ onSelectVendor }: VendorListProps) {
  const { language } = useLanguage();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'trust' | 'recent'>('rating');

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
    },
  };
  const texts = t[language as keyof typeof t] || t.en;

  // Filter and sort vendors
  const filteredVendors = vendors
    .filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.marketName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMarket = filterMarket === 'all' || v.market === filterMarket;
      return matchesSearch && matchesMarket;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'trust') return b.trustScore - a.trustScore;
      return new Date(b.recentActivity).getTime() - new Date(a.recentActivity).getTime();
    });

  const markets = [...new Set(vendors.map((v) => v.market))];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{texts.title}</h2>
        <p className="text-sm text-muted-foreground">{texts.subtitle}</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border-border bg-secondary backdrop-blur-sm shadow-[0_10px_28px_-22px_rgba(15,23,42,0.45)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={texts.search}
            className="h-9 pl-10 border-accent bg-card text-sm"
          />
        </div>
        <select
          value={filterMarket}
          onChange={(e) => setFilterMarket(e.target.value)}
          className="h-9 px-3 rounded-md border border-accent bg-card text-sm text-muted-foreground"
        >
          <option value="all">{texts.allMarkets}</option>
          {markets.map((market) => (
            <option key={market} value={market}>
              {vendors.find((v) => v.market === market)?.marketName || market}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-9 px-3 rounded-md border border-accent bg-card text-sm text-muted-foreground"
        >
          <option value="rating">{texts.rating}</option>
          <option value="trust">{texts.trustScore}</option>
          <option value="recent">{texts.recent}</option>
        </select>
      </div>

      {/* Vendor Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="rounded-2xl border-border bg-card backdrop-blur-sm shadow-[0_14px_30px_-24px_rgba(15,23,42,0.5)] hover:shadow-[0_18px_36px_-22px_rgba(2,132,199,0.35)] transition-all cursor-pointer"
            onClick={() => onSelectVendor(vendor)}
          >
            <CardContent className="p-3.5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-green-100/90 border border-green-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-700" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name and Verified Badge */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{vendor.name}</h3>
                    {vendor.verified && (
                      <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Market */}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.marketName}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-green-500 fill-green-500" />
                      <span className="ml-1 text-xs font-semibold text-foreground">{vendor.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ({vendor.totalReviews} {texts.reviews})
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {vendor.totalSubmissions} {texts.submissions}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {vendor.trustScore}%
                    </span>
                  </div>

                  {/* Badges */}
                  {vendor.badges.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {vendor.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge.id}
                          className="text-sm"
                          title={badge.description}
                        >
                          {badge.icon}
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
    </div>
  );
}

// Vendor Profile Detail
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
      contact: 'Contact',
      memberSince: 'Member since',
      trustScore: 'Trust Score',
      totalSubmissions: 'Total Submissions',
      approvalRate: 'Approval Rate',
      topProducts: 'Top Products',
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
    },
    rw: {
      back: 'Subira ku bacuruzi',
      about: 'Ibyerekeye',
      reviews: 'Ibitekerezo',
      statistics: 'Imibare',
      contact: 'Twandikire',
      memberSince: 'Umunyamuryango kuva',
      trustScore: 'Amanota y\'icyizere',
      totalSubmissions: 'Byoherejwe byose',
      approvalRate: 'Igipimo cy\'kwemeza',
      topProducts: 'Ibicuruzwa byiza',
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
    },
    fr: {
      back: 'Retour aux vendeurs',
      about: 'À propos',
      reviews: 'Avis',
      statistics: 'Statistiques',
      contact: 'Contact',
      memberSince: 'Membre depuis',
      trustScore: 'Score de confiance',
      totalSubmissions: 'Total des soumissions',
      approvalRate: "Taux d'approbation",
      topProducts: 'Meilleurs produits',
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
      // Simulate API call
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
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-green-500 fill-green-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80">
        <ArrowLeft className="h-4 w-4" />
        {texts.back}
      </Button>

      {/* Profile Header */}
      <Card className="rounded-2xl border-border bg-card backdrop-blur-sm shadow-[0_14px_30px_-22px_rgba(15,23,42,0.5)]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                <User className="h-10 w-10 text-green-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
                  {vendor.verified && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {texts.contact === 'Contact' ? 'Verified' : 'Vérifié'}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {vendor.marketName}, {vendor.district}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {renderStars(Math.floor(vendor.averageRating))}
                  <span className="text-sm">
                    {vendor.averageRating.toFixed(1)} ({vendor.totalReviews} {texts.reviews})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-green-900 border border-green-700">
                <p className="text-2xl font-bold text-green-100">{vendor.trustScore}%</p>
                <p className="text-xs text-gray-400">{texts.trustScore}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary border border-accent">
                <p className="text-2xl font-bold text-foreground">{vendor.totalSubmissions}</p>
                <p className="text-xs text-muted-foreground">{texts.totalSubmissions}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-100 border border-green-700">
                <p className="text-2xl font-bold text-green-700">
                  {((vendor.approvedSubmissions / vendor.totalSubmissions) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">{texts.approvalRate}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-100 border border-green-700">
                <p className="text-2xl font-bold text-green-700">{vendor.totalReviews}</p>
                <p className="text-xs text-muted-foreground">{texts.reviews}</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          {vendor.badges.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">{texts.badges}</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.badges.map((badge) => (
                  <Badge key={badge.id} variant="outline" className="gap-1 py-1">
                    <span>{badge.icon}</span>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border-border p-1 rounded-lg">
          <TabsTrigger value="about" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white">{texts.about}</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white">{texts.reviews}</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white">{texts.statistics}</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <Card className="rounded-2xl border-border bg-card backdrop-blur-sm shadow-[0_12px_28px_-22px_rgba(15,23,42,0.45)]">
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">{texts.memberSince}</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(vendor.joinedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{texts.lastActive}</p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {vendor.recentActivity}
                  </p>
                </div>
                {vendor.phone && (
                  <div>
                    <p className="text-sm text-slate-500">{texts.contact}</p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {vendor.phone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {vendor.email}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">{texts.topProducts}</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.topProducts.map((product) => (
                    <Badge key={product} variant="secondary">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          {/* Write Review */}
          <Card className="rounded-2xl border-border bg-card backdrop-blur-sm shadow-[0_12px_28px_-22px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">{texts.writeReview}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{texts.yourRating}</label>
                <div className="mt-1">
                  {renderStars(newReview.rating, true, (r) => setNewReview({ ...newReview, rating: r }))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{texts.category}</label>
                <select
                  value={newReview.category}
                  onChange={(e) => setNewReview({ ...newReview, category: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-accent bg-card"
                >
                  <option value="accuracy">{texts.accuracy}</option>
                  <option value="reliability">{texts.reliability}</option>
                  <option value="service">{texts.service}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">{texts.yourComment}</label>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder={texts.commentPlaceholder}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleSubmitReview} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? 'Submitting...' : texts.submitReview}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Reviews */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="rounded-xl border-accent bg-card shadow-[0_10px_22px_-20px_rgba(15,23,42,0.5)]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 border border-green-700 flex items-center justify-center">
                          <User className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium">{review.reviewerName}</p>
                          <p className="text-xs text-slate-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {texts.verifiedPurchase}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground">
                        {review.category === 'accuracy' ? texts.accuracy :
                         review.category === 'reliability' ? texts.reliability : texts.service}
                      </Badge>
                      <button className="flex items-center gap-1 hover:text-primary">
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

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card className="rounded-2xl border-border bg-card backdrop-blur-sm shadow-[0_12px_28px_-22px_rgba(15,23,42,0.45)]">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4 text-foreground">Submission History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Submissions</span>
                      <span className="font-medium">{vendor.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved</span>
                      <span className="font-medium text-green-600">{vendor.approvedSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rejection Rate</span>
                      <span className="font-medium text-green-600">{vendor.rejectionRate}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4 text-foreground">Rating Breakdown</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const percentage = (count / reviews.length) * 100 || 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-8 text-sm">{star} ★</span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs text-slate-500">{count}</span>
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

// Main Export - Vendor Profiles Page
export function VendorProfiles() {
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  const handleSubmitReview = (review: Partial<VendorReview>) => {
    console.log('Review submitted:', review);
    // In production, this would call an API
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

export default VendorProfiles;

