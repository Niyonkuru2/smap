import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LogOut,
  BarChart3,
  CheckSquare,
  Users,
  Settings,
  Bell,
  Upload,
  UserCog,
  Brain,
  Megaphone,
  AlertTriangle,
  MoreVertical,
  X,
  Store,
  Briefcase,
  Crown,
} from 'lucide-react';

import type { User, UserRole } from '../../App';
import { globalNotifications } from '../../state/globalState';

import PriceApprovals from './PriceApprovals';
import Analytics from './Analytics';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import NotificationManagement from './NotificationManagement';
import BulkPriceImport from './BulkPriceImport';
import { MLModelDashboard } from './MLModelDashboard';
import { AdAnalyticsDashboard } from './AdAnalyticsDashboard';
import { AnomalyAlertsDashboard } from './AnomalyAlertsDashboard';
import VendorManagement from './VendorManagement';
import BusinessUserManagement from './BusinessUserManagement';
import SubscriptionManagement from './SubscriptionManagement';

import LanguageSwitcher from '../LanguageSwitcherVibrant';
import RoleViewSwitcher from '../RoleViewSwitcher';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';

import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../ui/badge';
import { getAnomalyStats } from '../../services/anomalyService';
import { getUnreadCount as fetchUnreadNotifications } from '../../services/notificationService';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onViewAsRole: (role: UserRole) => void;
}

export default function AdminDashboard({
  user,
  onLogout,
  onViewAsRole,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('approvals');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(true);

  const { t } = useLanguage();

  // Fetch real anomaly count
  const fetchAnomalyCount = async () => {
    try {
      setIsLoadingAnomalies(true);
      const stats = await getAnomalyStats();
      
      // Count active anomalies (new + investigating)
      const activeCount = stats.stats.new_count + stats.stats.investigating_count;
      setAnomalyCount(activeCount);
    } catch (error) {
      console.error('Failed to fetch anomaly count:', error);
      setAnomalyCount(0);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  // Fetch real notification count from API
  const fetchNotificationCount = async () => {
    try {
      const response = await fetchUnreadNotifications();
      if (response.success) {
        setNotificationCount(response.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
      // Fallback to globalNotifications for backward compatibility
      const unreadCount = globalNotifications.filter(
        (n) => n.userRole === 'admin' && !n.read
      ).length;
      setNotificationCount(unreadCount);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnomalyCount();
    fetchNotificationCount();
    
    // Set up interval for real-time updates
    const notificationInterval = setInterval(fetchNotificationCount, 30000);
    const anomalyInterval = setInterval(fetchAnomalyCount, 30000);
    
    return () => {
      clearInterval(notificationInterval);
      clearInterval(anomalyInterval);
    };
  }, []);

  // Listen for anomaly updates via custom event
  useEffect(() => {
    const handleAnomalyUpdate = () => {
      fetchAnomalyCount();
    };
    
    const handleNotificationUpdate = () => {
      fetchNotificationCount();
    };
    
    window.addEventListener('anomaly-updated', handleAnomalyUpdate);
    window.addEventListener('notification-read', handleNotificationUpdate);
    window.addEventListener('notification-sent', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('anomaly-updated', handleAnomalyUpdate);
      window.removeEventListener('notification-read', handleNotificationUpdate);
      window.removeEventListener('notification-sent', handleNotificationUpdate);
    };
  }, []);

  const navItems = [
    {
      id: 'approvals',
      label: t('priceApprovals'),
      icon: <CheckSquare className="h-5 w-5" />,
      badge: notificationCount,
    },
    {
      id: 'anomalies',
      label: t('anomalyAlerts') || 'Anomaly Alerts',
      icon: <AlertTriangle className="h-5 w-5" />,
      badge: anomalyCount,
      badgeColor: anomalyCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : '',
    },
    {
      id: 'analytics',
      label: t('analytics'),
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'categories',
      label: t('categories'),
      icon: <Settings className="h-5 w-5" />,
    },
    {
      id: 'users',
      label: t('users'),
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'vendors',
      label: t('vendors') || 'Vendors',
      icon: <Store className="h-5 w-5" />,
    },
    {
      id: 'businesses',
      label: 'Businesses',
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: <Crown className="h-5 w-5" />,
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: <Bell className="h-5 w-5" />,
      badge: notificationCount,
    },
    {
      id: 'import',
      label: t('bulkPriceImport'),
      icon: <Upload className="h-5 w-5" />,
    },
    {
      id: 'ml',
      label: t('mlModels'),
      icon: <Brain className="h-5 w-5" />,
    },
    {
      id: 'ads',
      label: t('adAnalytics') || 'Ad Analytics',
      icon: <Megaphone className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Floating Glow Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark-glass backdrop-blur-2xl shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className="icon-container">
                  <UserCog className="h-6 w-6 text-emerald-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
                    {t('adminDashboard')}
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    {t('welcome')},{' '}
                    <span className="font-semibold text-white">
                      {user.name}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                <ThemeToggle />

                <LanguageSwitcher />

             

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="
                    bg-red-500/10
                    border
                    border-red-500/30
                    text-red-400
                    hover:bg-red-500/20
                    hover:text-red-300
                    hover:border-red-500/50
                    transition-all
                    duration-300
                    rounded-xl
                    px-4
                    focus:outline-none
                    focus:ring-0
                  "
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
          <div className="px-4 py-3 relative">
            <div className="flex items-center justify-between gap-3">
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="icon-container flex-shrink-0">
                  <UserCog className="h-6 w-6 text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">
                    {t('adminDashboard')}
                  </h1>

                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
                <ThemeToggle />

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="
                    p-2.5
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    text-muted-foreground
                    hover:text-white
                    hover:bg-white/10
                    transition-all
                  "
                >
                  {showMobileMenu ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <MoreVertical className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Dropdown */}
            {showMobileMenu && (
              <div
                className="
                  absolute
                  right-4
                  top-16
                  z-50
                  w-64
                  rounded-2xl
                  border
                  border-white/10
                  dark-glass
                  shadow-2xl
                  overflow-hidden
                  animate-scaleIn
                "
              >
                <div className="p-4 space-y-4">
                  <div>
                    <LanguageSwitcher />
                  </div>

                  

                  <button
                    onClick={() => {
                      onLogout();
                      setShowMobileMenu(false);
                    }}
                    className="
                      w-full
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-4
                      py-3
                      text-red-400
                      bg-red-500/5
                      border
                      border-red-500/20
                      hover:bg-red-500/10
                      transition-all
                    "
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

      {/* Main */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-24 md:pb-6">
        <Tabs
  value={activeTab}
  onValueChange={setActiveTab}
  className="flex flex-col"
>
  {/* =========================
      DESKTOP TABS
  ========================== */}
  <div className="hidden md:block mb-6">
    <TabsList
      className="
        flex
        flex-wrap
        items-center
        gap-3

        h-auto
        w-full

        bg-transparent
        p-0

        overflow-visible
      "
    >
      {navItems.map((item) => (
        <TabsTrigger
          key={item.id}
          value={item.id}
          className="tab-trigger-premium"
        >
          {/* Content */}
          <div className="flex items-center gap-2 relative">
            {/* Icon */}
            <span className="shrink-0">
              {item.icon}
            </span>

            {/* Label */}
            <span className="text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>

            {/* Badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge
                className={`
                  absolute
                  -top-2
                  -right-3
                  z-50

                  min-w-[20px]
                  h-5

                  px-1.5
                  py-0

                  flex
                  items-center
                  justify-center

                  text-[10px]
                  font-bold

                  rounded-full
                  border-none
                  shadow-lg

                  ${
                    item.id === 'anomalies'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-red-500 text-white'
                  }
                `}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  </div>

  {/* =========================
      MOBILE TABS
  ========================== */}
  <div className="md:hidden mb-4">
    <TabCarousel
      items={navItems.map((item) => ({
        ...item,
        badge:
          item.id === 'anomalies'
            ? anomalyCount
            : item.id === 'approvals'
            ? notificationCount
            : item.id === 'notifications'
            ? notificationCount
            : item.badge,
      }))}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  </div>

  {/* =========================
      TAB CONTENTS
  ========================== */}

  <TabsContent value="approvals" className="animate-fadeIn mt-4">
    <PriceApprovals
      onNotificationRead={fetchNotificationCount}
    />
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

  <TabsContent value="businesses" className="animate-fadeIn">
    <BusinessUserManagement />
  </TabsContent>

  <TabsContent value="subscriptions" className="animate-fadeIn">
    <SubscriptionManagement />
  </TabsContent>

  <TabsContent value="notifications" className="animate-fadeIn">
    <NotificationManagement
      onNotificationUpdate={fetchNotificationCount}
    />
  </TabsContent>

  <TabsContent value="import" className="animate-fadeIn">
    <BulkPriceImport />
  </TabsContent>

  <TabsContent value="ml" className="animate-fadeIn">
    <MLModelDashboard />
  </TabsContent>

  <TabsContent value="ads" className="animate-fadeIn">
    <AdAnalyticsDashboard />
  </TabsContent>
</Tabs>
      </main>

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes tabGlow {
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* ========================================
           PREMIUM TAB STYLES
           ======================================== */

        .tab-trigger-premium {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.7rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
          backdrop-filter: blur(10px);
        }

        /* Hover */
        .tab-trigger-premium:hover {
          color: white;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          transform: translateY(-1px);
        }

        /* Active / Selected */
        .tab-trigger-premium[data-state="active"] {
          background: linear-gradient(
            135deg,
            #059669 0%,
            #10b981 55%,
            #047857 100%
          ) !important;

          color: white !important;

          border: 1px solid rgba(16, 185, 129, 0.4);

          box-shadow:
            0 4px 20px rgba(5, 150, 105, 0.35),
            0 0 30px rgba(16, 185, 129, 0.15);

          transform: translateY(-2px);
        }

        /* Active icon */
        .tab-trigger-premium[data-state="active"] svg {
          color: white !important;
        }

        /* Glow animation */
        .tab-trigger-premium[data-state="active"]::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.18),
            transparent
          );

          transform: translateX(-100%);
          animation: tabGlow 2.5s infinite;
        }

        /* Button */
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.25s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* Icon container */
        .icon-container {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 4px 14px rgba(0, 0, 0, 0.2);

          backdrop-filter: blur(10px);
        }

        .gradient-text {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #d1fae5 45%,
            #6ee7b7 100%
          );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}