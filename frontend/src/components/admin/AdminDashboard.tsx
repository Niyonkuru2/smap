import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, BarChart3, CheckSquare, Users, Settings, Bell, Download, Upload, UserCog, Mail, Smartphone, Brain, Megaphone, AlertTriangle, MoreVertical, X, Store, Plus, Briefcase } from 'lucide-react';
import type { User, UserRole } from '../../App';
import { globalNotifications } from '../../state/globalState';
import PriceApprovals from './PriceApprovals';
import Analytics from './Analytics';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import NotificationManagement from './NotificationManagement';
import BulkPriceImport from './BulkPriceImport';
import { EmailPreview } from './EmailPreview';
import SMSUSSDManagement from './SMSUSSDManagement';
import { MLModelDashboard } from './MLModelDashboard';
import { AdAnalyticsDashboard } from './AdAnalyticsDashboard';
import { AnomalyAlertsDashboard } from './AnomalyAlertsDashboard';
import UserProfile from '../shared/UserProfile';
import LanguageSwitcher from '../LanguageSwitcherVibrant';
import RoleViewSwitcher from '../RoleViewSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../ui/badge';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';
import VendorManagement from './VendorManagement';
import BusinessUserManagement from './BusinessUserManagement'; 

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onViewAsRole: (role: UserRole) => void;
}

export default function AdminDashboard({ user, onLogout, onViewAsRole }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('approvals');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t } = useLanguage();
  const [notificationCount, setNotificationCount] = useState(0);

  const navItems = [
    { id: 'approvals', label: t('priceApprovals'), icon: <CheckSquare className="h-5 w-5" />, badge: notificationCount },
    { id: 'anomalies', label: t('anomalyAlerts') || 'Anomaly Alerts', icon: <AlertTriangle className="h-5 w-5" />, badge: 3 },
    { id: 'analytics', label: t('analytics'), icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'categories', label: t('categories'), icon: <Settings className="h-5 w-5" /> },
    { id: 'users', label: t('users'), icon: <Users className="h-5 w-5" /> },
    { id: 'vendors', label: t('vendors') || 'Vendors', icon: <Store className="h-5 w-5" /> },
    { id: 'businesses', label: 'Businesses', icon: <Briefcase className="h-5 w-5" /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell className="h-5 w-5" />, badge: notificationCount },
    { id: 'import', label: t('bulkPriceImport'), icon: <Upload className="h-5 w-5" /> },
    { id: 'emails', label: t('emailTemplates'), icon: <Mail className="h-5 w-5" /> },
    { id: 'sms', label: t('smsUssd'), icon: <Smartphone className="h-5 w-5" /> },
    { id: 'ml', label: t('mlModels'), icon: <Brain className="h-5 w-5" /> },
    { id: 'ads', label: t('adAnalytics') || 'Ad Analytics', icon: <Megaphone className="h-5 w-5" /> },
  ];

  // All tabs for mobile carousel
  const allTabs = [...navItems];

  useEffect(() => {
    // Update notification count
    const interval = setInterval(() => {
      const unreadCount = globalNotifications.filter(
        n => n.userRole === 'admin' && !n.read
      ).length;
      setNotificationCount(unreadCount);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
                  <UserCog className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">{t('adminDashboard')}</h1>
                  <p className="text-xs text-muted-foreground">{t('welcome')}, <span className="font-semibold text-white">{user.name}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
                <RoleViewSwitcher onViewAsRole={onViewAsRole} />
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
                  <UserCog className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">{t('adminDashboard')}</h1>
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
                  <div className="px-4 py-2 border-t border-white/10">
                    <RoleViewSwitcher onViewAsRole={(role) => {
                      onViewAsRole(role);
                      setShowMobileMenu(false);
                    }} />
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-6 p-1 dark-glass border border-white/10 shadow-lg rounded-xl flex-wrap gap-1 h-auto hidden md:flex">
            <TabsTrigger value="approvals" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <CheckSquare className="h-4 w-4 mr-2" />
              {t('priceApprovals')}
              {notificationCount > 0 && (
                <Badge className="ml-1 bg-primary/20 text-primary border border-primary/30 px-1 py-0 text-[10px]">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('anomalyAlerts') || 'Anomaly Alerts'}
              <Badge className="ml-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1 py-0 text-[10px]">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('analytics')}
            </TabsTrigger>
            <TabsTrigger value="categories" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Settings className="h-4 w-4 mr-2" />
              {t('categories')}
            </TabsTrigger>
            <TabsTrigger value="users" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              {t('users')}
            </TabsTrigger>
            <TabsTrigger value="vendors" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Store className="h-4 w-4 mr-2" />
              {t('vendors') || 'Vendors'}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
               <Briefcase className="h-4 w-4 mr-2" />
                Businesses
             </TabsTrigger>
            <TabsTrigger value="notifications" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Bell className="h-4 w-4 mr-2" />
              {t('notifications')}
              {notificationCount > 0 && (
                <Badge className="ml-1 bg-primary/20 text-primary border border-primary/30 px-1 py-0 text-[10px]">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="import" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Upload className="h-4 w-4 mr-2" />
              {t('bulkPriceImport')}
            </TabsTrigger>
            <TabsTrigger value="emails" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Mail className="h-4 w-4 mr-2" />
              {t('emailTemplates')}
            </TabsTrigger>
            <TabsTrigger value="sms" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Smartphone className="h-4 w-4 mr-2" />
              {t('smsUssd')}
            </TabsTrigger>
            <TabsTrigger value="ml" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Brain className="h-4 w-4 mr-2" />
              {t('mlModels')}
            </TabsTrigger>
            <TabsTrigger value="ads" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              <Megaphone className="h-4 w-4 mr-2" />
              {t('adAnalytics')}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="approvals" className="mt-4 animate-fadeIn">
            <PriceApprovals />
          </TabsContent>

          <TabsContent value="anomalies" className="animate-fadeIn">
            <AnomalyAlertsDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="animate-fadeIn">
            <Analytics />
          </TabsContent>

          <TabsContent value="categories" className="animate-fadeIn">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="users" className="animate-fadeIn">
            <UserManagement />
          </TabsContent>

          <TabsContent value="vendors" className="animate-fadeIn">
            <VendorManagement />
          </TabsContent>

          <TabsContent value="notifications" className="animate-fadeIn">
            <NotificationManagement />
          </TabsContent>

          <TabsContent value="import" className="animate-fadeIn">
            <BulkPriceImport />
          </TabsContent>

          <TabsContent value="emails" className="animate-fadeIn">
            <EmailPreview />
          </TabsContent>

          <TabsContent value="sms" className="animate-fadeIn">
            <SMSUSSDManagement />
          </TabsContent>

          <TabsContent value="ml" className="animate-fadeIn">
            <MLModelDashboard />
          </TabsContent>

          <TabsContent value="ads" className="animate-fadeIn">
            <AdAnalyticsDashboard />
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