import { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, TrendingUp, BarChart3, ShoppingCart, Download, User as UserIcon, ArrowLeft, Briefcase, UserCog } from 'lucide-react';
import type { User } from '../../App';
import PriceAnalysis from './PriceAnalysis';
import ComparisonTools from './ComparisonTools';
import PurchasePlanning from './PurchasePlanning';
import BusinessAnalytics from './BusinessAnalytics';
import DataExport from './DataExport';
import UserProfile from '../shared/UserProfile';
import LanguageSwitcher from '../LanguageSwitcherVibrant';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';

interface BusinessDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function BusinessDashboard({ user, onLogout, isAdminViewing, onReturnToAdmin }: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const { t } = useLanguage();

  const navItems = [
    { id: 'analysis', label: t('priceAnalysis'), icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'compare', label: t('comparisonTools'), icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'purchase', label: t('purchasePlanning'), icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'analytics', label: t('businessAnalytics'), icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'export', label: t('dataExport'), icon: <Download className="h-5 w-5" /> },
    { id: 'profile', label: t('userProfile'), icon: <UserIcon className="h-5 w-5" /> },
  ];

  // All tabs for mobile carousel
  const allTabs = [...navItems];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background - Same as consumer dashboard */}
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
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">{t('businessPortal')}</h1>
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
                  className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all duration-200 focus:outline-none focus:ring-0"
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
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">{t('businessPortal')}</h1>
                  <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <ThemeToggle />
                <LanguageSwitcher />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout} 
                  className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm px-3 py-1.5"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            <TabsTrigger value="analysis" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('priceAnalysis')}
            </TabsTrigger>
            <TabsTrigger value="compare" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('comparisonTools')}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('purchasePlanning')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('businessAnalytics')}
            </TabsTrigger>
            <TabsTrigger value="export" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Download className="h-4 w-4 mr-2" />
              {t('dataExport')}
            </TabsTrigger>
            <TabsTrigger value="profile" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <UserIcon className="h-4 w-4 mr-2" />
              {t('userProfile')}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="analysis" className="mt-4 animate-fadeIn">
            <PriceAnalysis />
          </TabsContent>

          <TabsContent value="compare" className="animate-fadeIn">
            <ComparisonTools />
          </TabsContent>

          <TabsContent value="purchase" className="animate-fadeIn">
            <PurchasePlanning />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fadeIn">
            <BusinessAnalytics />
          </TabsContent>

          <TabsContent value="export" className="animate-fadeIn">
            <DataExport />
          </TabsContent>

          <TabsContent value="profile" className="animate-fadeIn">
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

        .icon-container {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}