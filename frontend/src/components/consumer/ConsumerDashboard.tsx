import { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, Search, TrendingUp, Heart, Bell, AlertCircle, User as UserIcon, ArrowLeft, UserCog, Map, Brain, Users, MoreVertical, X } from 'lucide-react';
import type { User } from '../../App';
import ProductSearch from './ProductSearch';
import PriceComparison from './PriceComparison';
import PriceTrends from './PriceTrends';
import Favorites from './Favorites';
import Notifications from './Notifications';
import PriceAlerts from './PriceAlerts';
import MultiMarketComparison from './MultiMarketComparison';
import PriceForecast from './PriceForecast';
import UserProfile from '../shared/UserProfile';
import { VendorProfiles } from '../shared/VendorProfiles';
import LanguageSwitcher from '../LanguageSwitcherVibrant';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';

interface ConsumerDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function ConsumerDashboard({ user, onLogout, isAdminViewing, onReturnToAdmin }: ConsumerDashboardProps) {
  const [activeTab, setActiveTab] = useState('search');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { id: 'search', label: t('searchProducts'), icon: <Search className="h-5 w-5" /> },
    { id: 'compare', label: t('comparePrices'), icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'markets', label: t('multiMarket'), icon: <Map className="h-5 w-5" /> },
    { id: 'forecast', label: t('aiForecast'), icon: <Brain className="h-5 w-5" /> },
    { id: 'trends', label: t('priceTrends'), icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'favorites', label: t('favorites'), icon: <Heart className="h-5 w-5" /> },
  ];

  const moreMenuItems = [
    { id: 'notifications', label: t('notifications'), icon: <Bell className="h-5 w-5" /> },
    { id: 'alerts', label: t('priceAlerts'), icon: <AlertCircle className="h-5 w-5" /> },
    { id: 'vendors', label: t('vendors') || 'Vendors', icon: <Users className="h-5 w-5" /> },
    { id: 'profile', label: t('profile'), icon: <UserIcon className="h-5 w-5" /> },
  ];

  // All tabs combined for carousel (mobile)
  const allTabs = [...navItems, ...moreMenuItems];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background - Same as login page */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-40 shadow-lg backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-slate-500 to-purple-500" />
        
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="icon-container">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">{t('consumerDashboard')}</h1>
                  <p className="text-xs text-muted-foreground">{t('welcome')}, <span className="font-semibold text-white">{user.name}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout} 
                  className="btn-outline-premium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="icon-container flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">{t('consumerDashboard')}</h1>
                  <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <ThemeToggle />
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                  aria-label="Menu"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <MoreVertical className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <div className="absolute right-4 top-14 dark-glass border border-white/10 rounded-lg shadow-lg z-50 min-w-max">
                <div className="p-3 space-y-2">
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 relative z-10">
        {/* Admin Viewing Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-4 dark-glass border border-white/10 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                {t('viewingAsAdmin')}
              </span>
              <Button onClick={onReturnToAdmin} size="sm" className="btn-outline-premium w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('returnToAdmin')}
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-6 p-1 dark-glass border border-white/10 shadow-lg rounded-xl flex-wrap gap-1 h-auto hidden md:flex">
            <TabsTrigger value="search" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Search className="h-4 w-4 mr-2" />
              {t('searchProducts')}
            </TabsTrigger>
            <TabsTrigger value="compare" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('comparePrices')}
            </TabsTrigger>
            <TabsTrigger value="markets" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Map className="h-4 w-4 mr-2" />
              {t('multiMarket')}
            </TabsTrigger>
            <TabsTrigger value="forecast" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Brain className="h-4 w-4 mr-2" />
              {t('aiForecast')}
            </TabsTrigger>
            <TabsTrigger value="trends" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('priceTrends')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Heart className="h-4 w-4 mr-2" />
              {t('favorites')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Bell className="h-4 w-4 mr-2" />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t('priceAlerts')}
            </TabsTrigger>
            <TabsTrigger value="vendors" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              {t('vendors') || 'Vendors'}
            </TabsTrigger>
            <TabsTrigger value="profile" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <UserIcon className="h-4 w-4 mr-2" />
              {t('profile')}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="search" className="mt-4">
            <ProductSearch />
          </TabsContent>

          <TabsContent value="compare">
            <PriceComparison />
          </TabsContent>

          <TabsContent value="markets">
            <MultiMarketComparison />
          </TabsContent>

          <TabsContent value="forecast">
            <PriceForecast />
          </TabsContent>

          <TabsContent value="trends">
            <PriceTrends />
          </TabsContent>

          <TabsContent value="favorites">
            <Favorites userId={user.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <Notifications />
          </TabsContent>

          <TabsContent value="alerts">
            <PriceAlerts userId={user.id} />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorProfiles />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile user={user} />
          </TabsContent>
        </Tabs>

        {/* Mobile Tab Carousel Footer */}
        <div className="md:hidden">
          <TabCarousel
            items={allTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .tab-trigger-premium {
          transition: all 0.2s ease;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }

        .tab-trigger-premium:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .tab-trigger-premium[data-state="active"] {
          background: hsl(var(--primary));
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

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