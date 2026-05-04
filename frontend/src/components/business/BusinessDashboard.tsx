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
    { id: 'analysis', label: t('priceAnalysis'), icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'compare', label: t('comparisonTools'), icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'purchase', label: t('purchasePlanning'), icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'analytics', label: t('businessAnalytics'), icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'export', label: t('dataExport'), icon: <Download className="h-4 w-4" /> },
    { id: 'profile', label: t('userProfile'), icon: <UserIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(5,150,105,0.1),transparent_34%),linear-gradient(135deg,hsl(160,40%,20%)_0%,hsl(160,40%,22%)_45%,hsl(160,40%,20%)_100%)]">
      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-50 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-green-400 to-green-600" />
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">{t('businessPortal')}</h1>
                <p className="text-[10px] text-green-300 leading-tight">{t('welcome')}, <span className="font-semibold text-white">{user.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <LanguageSwitcher />
              <Button variant="outline" size="sm" onClick={onLogout} className="h-7 px-2 text-xs bg-accent/20 text-foreground border-accent/40 hover:bg-accent/30 transition-all">
                <LogOut className="h-3 w-3 mr-1" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        {/* Admin Viewing Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-3 bg-green-900 border border-green-700 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-300 flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> {t('viewingAsAdmin')}</span>
              <Button
                onClick={onReturnToAdmin}
                size="sm"
                className="h-7 px-2 text-xs bg-green-900 hover:bg-green-800"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                {t('returnToAdmin')}
              </Button>
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-3 p-0.5 bg-card border border-accent shadow-sm rounded-lg flex-wrap gap-0.5 h-auto hidden md:flex">
            <TabsTrigger value="analysis" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('priceAnalysis')}
            </TabsTrigger>
            <TabsTrigger value="compare" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('comparePrices')}
            </TabsTrigger>
            <TabsTrigger value="purchase" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {t('purchasePlanning')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <BarChart3 className="h-3 w-3 mr-1" />
              {t('businessAnalytics')}
            </TabsTrigger>
            <TabsTrigger value="export" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Download className="h-3 w-3 mr-1" />
              {t('dataExport')}
            </TabsTrigger>
            <TabsTrigger value="profile" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <UserIcon className="h-3 w-3 mr-1" />
              {t('userProfile')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <PriceAnalysis />
          </TabsContent>

          <TabsContent value="compare">
            <ComparisonTools />
          </TabsContent>

          <TabsContent value="purchase">
            <PurchasePlanning />
          </TabsContent>

          <TabsContent value="analytics">
            <BusinessAnalytics />
          </TabsContent>

          <TabsContent value="export">
            <DataExport />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile user={user} />
          </TabsContent>
        </Tabs>

        {/* Mobile Tab Carousel Footer */}
        <div className="md:hidden">
          <TabCarousel
            items={navItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </main>
    </div>
  );
}

