import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
    Search, Filter, SlidersHorizontal, X, ChevronDown, ChevronUp,
    MapPin, Tag, ArrowUpDown, Loader2 
} from 'lucide-react';
import { RatingStars } from '../shared/RatingStars';
import { useLanguage } from '../../contexts/LanguageContext';

// Hardcoded production URL for Render deployment
const API_BASE = (() => {
  // For production Render deployment
  if (typeof window !== 'undefined' && window.location.hostname === 'smpmps-test.onrender.com') {
    return 'https://smpmps-test-1.onrender.com';
  }
  // Fall back to env variable or local development
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
})();

interface FilterOptions {
    markets: string[];
    categories: string[];
    sortOptions: { value: string; label: string }[];
}

interface SearchResult {
    id: string;
    product: string;
    market: string;
    price: number;
    unit: string;
    category: string;
    rating: number;
    ratingCount: number;
}

interface SearchFiltersProps {
    onResultsChange?: (results: SearchResult[]) => void;
}

export function SearchFilters({ onResultsChange }: SearchFiltersProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMarket, setSelectedMarket] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [showFilters, setShowFilters] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Fetch filter options on mount
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const response = await fetch(`${API_BASE}/search/filters`);
            if (response.ok) {
                const data = await response.json();
                setFilterOptions(data);
            }
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedMarket) params.append('market', selectedMarket);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            params.append('sortBy', sortBy);

            const response = await fetch(`${API_BASE}/search/products?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.results);
                onResultsChange?.(data.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedCategory('');
        setSelectedMarket('');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('name');
        setResults([]);
        setSearched(false);
    };

    const hasActiveFilters = selectedCategory || selectedMarket || minPrice || maxPrice || sortBy !== 'name';

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products or markets..."
                            className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button 
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        className={`dark:border-gray-600 dark:text-gray-300 ${hasActiveFilters ? 'border-green-500 text-green-600' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        {t('filterButton') || 'Filters'}
                        {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />}
                        {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </Button>
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Tag className="w-4 h-4" />
                                    {t('category')}
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">{t('all')}</option>
                                    {filterOptions?.categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Market Filter */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {t('market')}
                                </label>
                                <select
                                    value={selectedMarket}
                                    onChange={(e) => setSelectedMarket(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">{t('allMarkets') || 'All Markets'}</option>
                                    {filterOptions?.markets.map(market => (
                                        <option key={market} value={market}>{market}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1">
                                    {t('priceRange')}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        placeholder="Min"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <Input
                                        type="number"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        placeholder="Max"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <ArrowUpDown className="w-4 h-4" />
                                    {t('sortBy')}
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    {filterOptions?.sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={clearFilters}
                                className="dark:border-gray-600 dark:text-gray-300"
                            >
                                <X className="w-4 h-4 mr-1" />
                                {t('clearAll')}
                            </Button>
                            <Button 
                                size="sm"
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {t('applyFilters')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Results */}
            {searched && (
                <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-foreground dark:text-white">
                            {loading ? t('searching') : `${results.length} ${t('resultsFound')}`}
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {results.map((item) => (
                                <div 
                                    key={item.id}
                                    className="p-3 bg-secondary dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-foreground dark:text-white">{item.product}</h4>
                                        <span className="text-green-600 dark:text-green-400 font-bold">
                                            {item.price.toLocaleString()} RWF
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {item.market}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {item.category} • per {item.unit}
                                        </div>
                                        {item.rating > 0 && (
                                            <div className="flex items-center gap-1">
                                                <RatingStars rating={item.rating} size="sm" />
                                                <span className="text-xs">({item.ratingCount})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No results found. Try adjusting your filters.
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
}

export default SearchFilters;

