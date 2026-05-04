import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { List, Search, Filter, CheckCircle2, Clock, XCircle, Eye, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MyCollectionsProps {
  agentName: string;
  agentId: string;
}

// Sample collection data
const sampleCollections = [
  {
    id: '1',
    date: '2026-02-12',
    market: 'Musanze Market',
    productsCount: 15,
    status: 'approved',
    submittedAt: '09:30 AM',
  },
  {
    id: '2',
    date: '2026-02-12',
    market: 'Kimironko Market',
    productsCount: 22,
    status: 'pending',
    submittedAt: '11:45 AM',
  },
  {
    id: '3',
    date: '2026-02-11',
    market: 'Musanze Market',
    productsCount: 18,
    status: 'approved',
    submittedAt: '10:15 AM',
  },
  {
    id: '4',
    date: '2026-02-11',
    market: 'Nyabugogo Market',
    productsCount: 12,
    status: 'rejected',
    submittedAt: '02:30 PM',
    rejectionReason: 'Prices significantly differ from verified sources',
  },
  {
    id: '5',
    date: '2026-02-10',
    market: 'Musanze Market',
    productsCount: 20,
    status: 'approved',
    submittedAt: '09:00 AM',
  },
];

export default function MyCollections({ agentName, agentId }: MyCollectionsProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const filteredCollections = sampleCollections.filter(collection => {
    const matchesSearch = collection.market.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-900 text-green-300 border-green-700',
      pending: 'bg-green-900 text-green-400 border-green-700',
      rejected: 'bg-green-900 text-green-300 border-green-700',
    };
    return styles[status] || 'bg-green-900 text-green-400 border-green-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
            <List className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('myCollections') || 'My Collections'}</h2>
            <p className="text-sm text-muted-foreground">
              {t('viewPastSubmissions') || 'View and track your past price submissions'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchByMarket') || 'Search by market...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
              <SelectItem value="approved">{t('approved') || 'Approved'}</SelectItem>
              <SelectItem value="pending">{t('pending') || 'Pending'}</SelectItem>
              <SelectItem value="rejected">{t('rejected') || 'Rejected'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 glass-card text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-500">
            {sampleCollections.filter(c => c.status === 'approved').length}
          </p>
          <p className="text-xs text-muted-foreground">{t('approved') || 'Approved'}</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-400">
            {sampleCollections.filter(c => c.status === 'pending').length}
          </p>
          <p className="text-xs text-muted-foreground">{t('pending') || 'Pending'}</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-500">
            {sampleCollections.filter(c => c.status === 'rejected').length}
          </p>
          <p className="text-xs text-muted-foreground">{t('rejected') || 'Rejected'}</p>
        </Card>
      </div>

      {/* Collections List */}
      <Card className="glass-card overflow-hidden">
        <div className="divide-y">
          {filteredCollections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('noCollectionsFound') || 'No collections found'}</p>
            </div>
          ) : (
            filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="p-4 hover:bg-green-900 transition-colors cursor-pointer"
                onClick={() => setSelectedCollection(selectedCollection === collection.id ? null : collection.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(collection.status)}
                    <div>
                      <p className="font-medium">{collection.market}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {collection.date} at {collection.submittedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {collection.productsCount} {t('products') || 'products'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(collection.status)}`}>
                      {collection.status}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCollection(selectedCollection === collection.id ? null : collection.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCollection === collection.id && (
                  <div className="mt-4 pt-4 border-t">
                    {collection.status === 'rejected' && collection.rejectionReason && (
                      <div className="bg-green-950 border border-green-700 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-300">
                          <strong>{t('rejectionReason') || 'Rejection Reason'}:</strong> {collection.rejectionReason}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('market') || 'Market'}</p>
                        <p className="font-medium">{collection.market}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('date') || 'Date'}</p>
                        <p className="font-medium">{collection.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('time') || 'Time'}</p>
                        <p className="font-medium">{collection.submittedAt}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('products') || 'Products'}</p>
                        <p className="font-medium">{collection.productsCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
