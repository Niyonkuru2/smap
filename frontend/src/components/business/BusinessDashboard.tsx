import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import {
  LogOut,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Download,
  User as UserIcon,
  ArrowLeft,
  Briefcase,
  UserCog,
  MoreVertical,
  X,
  Bell,
} from 'lucide-react';

import type { User } from '../../App';

import PriceAnalysis from './PriceAnalysis';
import ComparisonTools from './ComparisonTools';
import PurchasePlanning from './PurchasePlanning';
import BusinessAnalytics from './BusinessAnalytics';
import DataExport from './DataExport';
import Notifications from './Notifications';

import UserProfile from '../shared/UserProfile';

import LanguageSwitcher from '../LanguageSwitcherVibrant';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';

import { useLanguage } from '../../contexts/LanguageContext';
import { getUnreadCount } from '../../services/notificationService';
import { Badge } from '../ui/badge';

interface BusinessDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function BusinessDashboard({
  user,
  onLogout,
  isAdminViewing,
  onReturnToAdmin,
}: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { t } = useLanguage();

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadNotificationCount(response.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'analysis',
      label: t('priceAnalysis') || 'Price Analysis',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'compare',
      label: t('comparisonTools') || 'Comparison',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'purchase',
      label: t('purchasePlanning') || 'Purchase Planning',
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      id: 'notifications',
      label: t('notifications') || 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotificationCount,
    },
    {
      id: 'analytics',
      label: t('businessAnalytics') || 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'export',
      label: t('dataExport') || 'Export',
      icon: <Download className="h-5 w-5" />,
    },
    {
      id: 'profile',
      label: t('userProfile') || 'Profile',
      icon: <UserIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Glow Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-16 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark-glass backdrop-blur-2xl shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500" />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className="icon-container">
                  <Briefcase className="h-6 w-6 text-cyan-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
                    {t('businessPortal') || 'Business Portal'}
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    {t('welcome') || 'Welcome'},{' '}
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
                  {t('logout') || 'Logout'}
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
                  <Briefcase className="h-6 w-6 text-cyan-400" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">
                    {t('businessPortal') || 'Business Portal'}
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
                    {t('logout') || 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-24 md:pb-6">
        {/* Admin Viewing Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCog className="h-4 w-4 text-cyan-400" />
                {t('viewingAsAdmin') || 'Viewing as Admin'}
              </div>

              <Button
                onClick={onReturnToAdmin}
                size="sm"
                className="btn-outline-premium w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('returnToAdmin') || 'Return to Admin'}
              </Button>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col"
        >
          {/* Desktop Tabs */}
          <TabsList
            className="
              hidden
              md:flex
              mb-6
              h-auto
              flex-wrap
              gap-2
              rounded-2xl
              border
              border-white/10
              dark-glass
              p-2
              shadow-2xl
            "
          >
            <TabsTrigger value="analysis" className="tab-trigger-premium">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('priceAnalysis') || 'Price Analysis'}
            </TabsTrigger>

            <TabsTrigger value="compare" className="tab-trigger-premium">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('comparisonTools') || 'Comparison'}
            </TabsTrigger>

            <TabsTrigger value="purchase" className="tab-trigger-premium">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('purchasePlanning') || 'Purchase Planning'}
            </TabsTrigger>

            <TabsTrigger value="notifications" className="tab-trigger-premium relative">
              <Bell className="h-4 w-4 mr-2" />
              {t('notifications') || 'Notifications'}
              {unreadNotificationCount > 0 && (
                <Badge 
                  className="
                    absolute 
                    -top-2 
                    -right-2 
                    px-1.5 
                    py-0.5 
                    min-w-[20px] 
                    h-5 
                    text-[10px] 
                    font-bold 
                    bg-red-500 
                    text-white 
                    border-none 
                    rounded-full 
                    animate-pulse
                    shadow-lg
                  "
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="analytics" className="tab-trigger-premium">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('businessAnalytics') || 'Analytics'}
            </TabsTrigger>

            <TabsTrigger value="export" className="tab-trigger-premium">
              <Download className="h-4 w-4 mr-2" />
              {t('dataExport') || 'Export'}
            </TabsTrigger>

            <TabsTrigger value="profile" className="tab-trigger-premium">
              <UserIcon className="h-4 w-4 mr-2" />
              {t('userProfile') || 'Profile'}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="analysis" className="animate-fadeIn mt-4">
            <PriceAnalysis />
          </TabsContent>

          <TabsContent value="compare" className="animate-fadeIn">
            <ComparisonTools />
          </TabsContent>

          <TabsContent value="purchase" className="animate-fadeIn">
            <PurchasePlanning />
          </TabsContent>

          <TabsContent value="notifications" className="animate-fadeIn">
            <Notifications userId={user.id} onNotificationRead={fetchUnreadCount} />
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

        {/* Mobile Bottom Tabs */}
        <div className="md:hidden">
          <TabCarousel
            items={navItems.map(item => ({
              ...item,
              badge: item.id === 'notifications' ? unreadNotificationCount : undefined
            }))}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
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

        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }

        /* Premium Tabs */

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

        .tab-trigger-premium:hover {
          color: white;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          transform: translateY(-1px);
        }

        .tab-trigger-premium[data-state='active'] {
          background: linear-gradient(
            135deg,
            #0891b2 0%,
            #06b6d4 55%,
            #1d4ed8 100%
          ) !important;

          color: white !important;

          border: 1px solid rgba(6, 182, 212, 0.4);

          box-shadow:
            0 4px 20px rgba(6, 182, 212, 0.35),
            0 0 30px rgba(59, 130, 246, 0.15);

          transform: translateY(-2px);
        }

        .tab-trigger-premium[data-state='active'] svg {
          color: white !important;
        }

        .tab-trigger-premium[data-state='active']::before {
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

        /* Icon */

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

        /* Gradient Text */

        .gradient-text {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #cffafe 45%,
            #67e8f9 100%
          );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}