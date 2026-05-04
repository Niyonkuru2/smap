import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  MapPin,
  Calendar,
  Flag,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface VendorSubmission {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  market: string;
  product: string;
  category: string;
  price: number;
  unit: string;
  previousPrice: number;
  priceChange: number;
  submittedAt: string;
  submissionMethod: 'app' | 'sms' | 'ussd';
  status: 'pending' | 'verified' | 'rejected' | 'flagged';
  anomalyScore: number;
  anomalyReasons: string[];
}

// Sample vendor submissions awaiting verification
const SAMPLE_SUBMISSIONS: VendorSubmission[] = [
  {
    id: 'sub1',
    vendorId: 'v1',
    vendorName: 'Jean Baptiste',
    vendorPhone: '+250788123456',
    market: 'Kimironko Market',
    product: 'Tomatoes',
    category: 'Vegetables',
    price: 850,
    unit: 'kg',
    previousPrice: 800,
    priceChange: 6.25,
    submittedAt: '2026-02-12 09:15:00',
    submissionMethod: 'app',
    status: 'pending',
    anomalyScore: 15,
    anomalyReasons: [],
  },
  {
    id: 'sub2',
    vendorId: 'v2',
    vendorName: 'Marie Claire',
    vendorPhone: '+250788234567',
    market: 'Nyabugogo Market',
    product: 'Potatoes',
    category: 'Vegetables',
    price: 450,
    unit: 'kg',
    previousPrice: 400,
    priceChange: 12.5,
    submittedAt: '2026-02-12 09:30:00',
    submissionMethod: 'sms',
    status: 'pending',
    anomalyScore: 25,
    anomalyReasons: ['Price increase above 10% threshold'],
  },
  {
    id: 'sub3',
    vendorId: 'v3',
    vendorName: 'Emmanuel',
    vendorPhone: '+250788345678',
    market: 'Muhima Market',
    product: 'Chicken (Fresh)',
    category: 'Proteins',
    price: 4500,
    unit: 'kg',
    previousPrice: 3200,
    priceChange: 40.6,
    submittedAt: '2026-02-12 08:45:00',
    submissionMethod: 'app',
    status: 'flagged',
    anomalyScore: 85,
    anomalyReasons: ['Price spike above 30%', 'Unusual for this time period', 'Significant deviation from market average'],
  },
  {
    id: 'sub4',
    vendorId: 'v4',
    vendorName: 'Ange',
    vendorPhone: '+250788456789',
    market: 'Kimironko Market',
    product: 'Onions',
    category: 'Vegetables',
    price: 600,
    unit: 'kg',
    previousPrice: 580,
    priceChange: 3.4,
    submittedAt: '2026-02-12 10:00:00',
    submissionMethod: 'ussd',
    status: 'pending',
    anomalyScore: 8,
    anomalyReasons: [],
  },
  {
    id: 'sub5',
    vendorId: 'v5',
    vendorName: 'Patrick',
    vendorPhone: '+250788567890',
    market: 'Kicukiro Market',
    product: 'Milk (Fresh)',
    category: 'Proteins',
    price: 700,
    unit: 'liter',
    previousPrice: 650,
    priceChange: 7.7,
    submittedAt: '2026-02-12 07:30:00',
    submissionMethod: 'app',
    status: 'verified',
    anomalyScore: 12,
    anomalyReasons: [],
  },
];

export function PriceVerification() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<VendorSubmission[]>(SAMPLE_SUBMISSIONS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMarket, setFilterMarket] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleVerify = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status: 'verified' as const } : sub
    ));
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status: 'rejected' as const } : sub
    ));
    setRejectionReason('');
    setExpandedId(null);
  };

  const handleFlag = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status: 'flagged' as const } : sub
    ));
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesMarket = filterMarket === 'all' || sub.market === filterMarket;
    const matchesSearch = sub.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesMarket && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-green-900 text-green-100 border-green-700',
      verified: 'bg-green-700 text-white border-green-600',
      rejected: 'bg-green-950 text-green-50 border-green-800',
      flagged: 'bg-green-800 text-green-50 border-green-700',
    };
    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="h-3 w-3" />,
      verified: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      flagged: <AlertTriangle className="h-3 w-3" />,
    };
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getAnomalyBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-950 text-green-50">{t('highRisk') || 'High Risk'}</Badge>;
    if (score >= 40) return <Badge className="bg-green-900 text-green-100">{t('mediumRisk') || 'Medium Risk'}</Badge>;
    if (score >= 20) return <Badge className="bg-green-800 text-green-50">{t('lowRisk') || 'Low Risk'}</Badge>;
    return <Badge className="bg-green-700 text-white">{t('normal') || 'Normal'}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const styles: Record<string, string> = {
      app: 'bg-green-700 text-white',
      sms: 'bg-green-800 text-green-50',
      ussd: 'bg-green-900 text-green-100',
    };
    return <Badge className={styles[method]}>{method.toUpperCase()}</Badge>;
  };

  const uniqueMarkets = [...new Set(submissions.map(s => s.market))];

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    verified: submissions.filter(s => s.status === 'verified').length,
    flagged: submissions.filter(s => s.status === 'flagged').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 glass-card bg-gradient-to-br from-green-950 to-green-900">
          <p className="text-xs text-muted-foreground">{t('todaysSubmissions')}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{stats.total}</p>
        </Card>
        <Card className="p-4 glass-card bg-gradient-to-br from-green-900 to-green-800">
          <p className="text-xs text-muted-foreground">{t('pendingReview') || 'Pending Review'}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{stats.pending}</p>
        </Card>
        <Card className="p-4 glass-card bg-gradient-to-br from-green-900 to-green-800">
          <p className="text-xs text-muted-foreground">{t('verified')}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{stats.verified}</p>
        </Card>
        <Card className="p-4 glass-card bg-gradient-to-br from-green-900 to-green-800">
          <p className="text-xs text-muted-foreground">{t('flagged')}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{stats.flagged}</p>
        </Card>
        <Card className="p-4 glass-card bg-gradient-to-br from-green-900 to-green-800">
          <p className="text-xs text-muted-foreground">{t('rejected')}</p>
          <p className="text-xl sm:text-2xl font-bold text-green-300">{stats.rejected}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 glass-card">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex-1 min-w-full sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('searchProductOrVendor') || 'Search product or vendor...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('status') || 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus') || 'All Status'}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="verified">{t('verified')}</SelectItem>
              <SelectItem value="flagged">{t('flagged')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMarket} onValueChange={setFilterMarket}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('market') || 'Market'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allMarkets') || 'All Markets'}</SelectItem>
              {uniqueMarkets.map(market => (
                <SelectItem key={market} value={market}>{market}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((sub) => (
          <Card 
            key={sub.id} 
            className={`p-4 glass-card transition-all ${
              sub.anomalyScore >= 70 ? 'border-green-700 bg-green-950/50' :
              sub.anomalyScore >= 40 ? 'border-green-700 bg-green-950/50' :
              ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{sub.product}</h3>
                  {getStatusBadge(sub.status)}
                  {getAnomalyBadge(sub.anomalyScore)}
                  {getMethodBadge(sub.submissionMethod)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.vendorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.market}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{sub.submittedAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{sub.price.toLocaleString()} RWF</span>
                    <span className="text-muted-foreground">/{sub.unit}</span>
                    <span className={`flex items-center gap-1 text-sm ${
                      sub.priceChange > 0 ? 'text-green-600' : sub.priceChange < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {sub.priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : 
                       sub.priceChange < 0 ? <TrendingDown className="h-3 w-3" /> : 
                       <Minus className="h-3 w-3" />}
                      {sub.priceChange > 0 ? '+' : ''}{sub.priceChange.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Anomaly Warnings */}
                {sub.anomalyReasons.length > 0 && (
                  <div className="mt-3 p-3 bg-green-950 border border-green-700 rounded-lg">
                    <p className="text-sm font-medium text-green-200 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t('anomalyDetectionWarnings') || 'Anomaly Detection Warnings:'}
                    </p>
                    <ul className="mt-1 text-sm text-green-100 list-disc list-inside">
                      {sub.anomalyReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedId === sub.id && (
                  <div className="mt-4 p-4 bg-green-900 rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('vendorPhone') || 'Vendor Phone'}</p>
                        <p className="font-medium">{sub.vendorPhone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('previousPrice') || 'Previous Price'}</p>
                        <p className="font-medium">{sub.previousPrice.toLocaleString()} RWF/{sub.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('category')}</p>
                        <p className="font-medium">{sub.category}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('anomalyScore') || 'Anomaly Score'}</p>
                        <p className="font-medium">{sub.anomalyScore}/100</p>
                      </div>
                    </div>

                    {sub.status === 'pending' || sub.status === 'flagged' ? (
                      <div className="space-y-3">
                        <Textarea 
                          placeholder={t('rejectionReasonPlaceholder') || 'Rejection reason (required for rejection)...'}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleVerify(sub.id)}
                            className="bg-green-700 hover:bg-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('verifyPrices')}
                          </Button>
                          <Button 
                            onClick={() => handleReject(sub.id)}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {t('reject') || 'Reject'}
                          </Button>
                          {sub.status !== 'flagged' && (
                            <Button 
                              onClick={() => handleFlag(sub.id)}
                              variant="outline"
                              className="border-green-700 text-green-300 hover:bg-green-950"
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              {t('flagForAdmin') || 'Flag for Admin'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                >
                  {expandedId === sub.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {sub.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerify(sub.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-green-700 text-green-300"
                      onClick={() => handleFlag(sub.id)}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredSubmissions.length === 0 && (
          <Card className="p-8 glass-card text-center">
            <p className="text-muted-foreground">No submissions found matching your criteria.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
