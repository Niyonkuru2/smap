import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, BarChart3, CheckSquare, Users, Settings, Bell, Download, Upload, UserCog, Mail, Smartphone, Brain, Megaphone, AlertTriangle, MoreVertical } from 'lucide-react';
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
import MobileBottomNav from '../mobile/MobileNavigation';
import TabCarousel from '../mobile/TabCarousel';

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
    { id: 'approvals', label: t('priceApprovals'), icon: <CheckSquare className="h-4 w-4" />, badge: notificationCount },
    { id: 'anomalies', label: t('anomalyAlerts') || 'Anomaly Alerts', icon: <AlertTriangle className="h-4 w-4" />, badge: 3 },
    { id: 'analytics', label: t('analytics'), icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'categories', label: t('categories'), icon: <Settings className="h-4 w-4" /> },
    { id: 'users', label: t('users'), icon: <Users className="h-4 w-4" /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell className="h-4 w-4" />, badge: notificationCount },
    { id: 'import', label: t('bulkPriceImport'), icon: <Upload className="h-4 w-4" /> },
    { id: 'emails', label: t('emailTemplates'), icon: <Mail className="h-4 w-4" /> },
    { id: 'sms', label: t('smsUssd'), icon: <Smartphone className="h-4 w-4" /> },
    { id: 'ml', label: t('mlModels'), icon: <Brain className="h-4 w-4" /> },
    { id: 'ads', label: t('adAnalytics') || 'Ad Analytics', icon: <Megaphone className="h-4 w-4" /> },
  ];

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(5,150,105,0.1),transparent_34%),linear-gradient(135deg,hsl(160,40%,20%)_0%,hsl(160,40%,22%)_45%,hsl(160,40%,20%)_100%)]">
      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />
        
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md">
                  <UserCog className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">{t('adminDashboard')}</h1>
                  <p className="text-xs text-green-300">{t('welcome')}, <span className="font-semibold text-white">{user.name}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
                <RoleViewSwitcher onViewAsRole={onViewAsRole} />
                <Button variant="outline" size="sm" onClick={onLogout} className="bg-accent/20 text-foreground border-accent/40 hover:bg-accent/30">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="relative px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Icon + Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg shadow-md flex-shrink-0">
                  <UserCog className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-white truncate">{t('adminDashboard')}</h1>
                  <p className="text-xs text-green-300 truncate">{user.name}</p>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ThemeToggle />
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={`p-2 rounded-lg transition-all touch-target transform ${
                    showMobileMenu 
                      ? 'bg-green-500/30 text-green-300 scale-110 shadow-lg' 
                      : 'text-gray-300 hover:bg-white/10 active:bg-white/20'
                  }`}
                  aria-label="Menu"
                  title="Admin Menu"
                >
                  <MoreVertical className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 top-14 z-40 bg-black/50 backdrop-blur-sm touch-target" 
                  onClick={() => setShowMobileMenu(false)}
                />
                
                {/* Menu Panel - fixed positioning for mobile */}
                <div 
                  className="fixed top-16 right-4 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-green-500/80 rounded-2xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Menu Header */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 border-b-2 border-green-500/50">
                    <p className="text-white font-bold text-lg">⚙️ Admin Menu</p>
                  </div>
                  
                  {/* Menu Items Container */}
                  <div className="px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
                    {/* Language Switcher Section */}
                    <div className="rounded-xl border-2 border-green-700/50 p-4 bg-slate-800/80 backdrop-blur">
                      <p className="text-sm text-green-400 font-bold mb-3 uppercase tracking-widest">🌐 Language</p>
                      <LanguageSwitcher />
                    </div>

                    {/* Role Switcher Section */}
                    <div className="rounded-xl border-2 border-green-700/50 p-4 bg-slate-800/80 backdrop-blur">
                      <p className="text-sm text-green-400 font-bold mb-3 uppercase tracking-widest">👤 View As</p>
                      <RoleViewSwitcher onViewAsRole={(role) => {
                        onViewAsRole(role);
                        setShowMobileMenu(false);
                      }} />
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-slate-700 my-2" />

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        onLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 active:from-red-800 active:via-red-900 active:to-red-950 transition-all shadow-xl hover:shadow-2xl touch-target border-2 border-red-500/50"
                    >
                      <LogOut className="h-6 w-6" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 sm:max-w-7xl py-4 sm:py-6 pb-24 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-3 p-0.5 bg-green-900 border border-green-700 shadow-sm rounded-lg flex-wrap gap-0.5 h-auto hidden md:flex">
            <TabsTrigger value="approvals" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <CheckSquare className="h-3 w-3 mr-1" />
              {t('priceApprovals')}
              {notificationCount > 0 && (
                <Badge className="ml-1 bg-green-700 text-white px-1 py-0 text-[10px] animate-pulse">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {t('anomalyAlerts') || 'Anomaly Alerts'}
              <Badge className="ml-1 bg-green-700 text-white px-1 py-0 text-[10px]">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <BarChart3 className="h-3 w-3 mr-1" />
              {t('analytics')}
            </TabsTrigger>
            <TabsTrigger value="categories" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Settings className="h-3 w-3 mr-1" />
              {t('categories')}
            </TabsTrigger>
            <TabsTrigger value="users" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Users className="h-3 w-3 mr-1" />
              {t('users')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Bell className="h-3 w-3 mr-1" />
              {t('notifications')}
              {notificationCount > 0 && (
                <Badge className="ml-1 bg-green-700 text-white px-1 py-0 text-[10px]">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="import" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Upload className="h-3 w-3 mr-1" />
              {t('bulkPriceImport')}
            </TabsTrigger>
            <TabsTrigger value="emails" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Mail className="h-3 w-3 mr-1" />
              {t('emailTemplates')}
            </TabsTrigger>
            <TabsTrigger value="sms" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Smartphone className="h-3 w-3 mr-1" />
              {t('smsUssd')}
            </TabsTrigger>
            <TabsTrigger value="ml" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Brain className="h-3 w-3 mr-1" />
              {t('mlModels')}
            </TabsTrigger>
            <TabsTrigger value="ads" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Megaphone className="h-3 w-3 mr-1" />
              {t('adAnalytics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <PriceApprovals />
          </TabsContent>

          <TabsContent value="anomalies">
            <AnomalyAlertsDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>

          <TabsContent value="import">
            <BulkPriceImport />
          </TabsContent>

          <TabsContent value="emails">
            <EmailPreview />
          </TabsContent>

          <TabsContent value="sms">
            <SMSUSSDManagement />
          </TabsContent>

          <TabsContent value="ml">
            <MLModelDashboard />
          </TabsContent>

          <TabsContent value="ads">
            <AdAnalyticsDashboard />
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

