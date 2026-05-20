import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LogOut,
  Search,
  TrendingUp,
  Heart,
  Bell,
  AlertCircle,
  User as UserIcon,
  ArrowLeft,
  UserCog,
  Map,
  Brain,
  Users,
  MoreVertical,
  X,
  Megaphone,
} from 'lucide-react';

import type { User } from '../../App';

import ProductSearch from './ProductSearch';
import PriceComparison from './PriceComparison';
import PriceTrends from './PriceTrends';
import Favorites from './Favorites';
import Notifications from './Notifications';
import PriceAlerts from './PriceAlerts';
import MultiMarketComparison from './MultiMarketComparison';
import PriceForecast from './PriceForecast';
import ConsumerAds from './ConsumerAds';

import UserProfile from '../shared/UserProfile';
import { VendorProfiles } from '../shared/VendorProfiles';

import LanguageSwitcher from '../LanguageSwitcherVibrant';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';
import { getUnreadCount } from '../../services/notificationService';
import { Badge } from '../ui/badge';

interface ConsumerDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function ConsumerDashboard({
  user,
  onLogout,
  isAdminViewing,
  onReturnToAdmin,
}: ConsumerDashboardProps) {
  const [activeTab, setActiveTab] = useState('search');
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
      id: 'search',
      label: t('searchProducts'),
      icon: <Search className="h-5 w-5" />,
    },
    {
      id: 'compare',
      label: t('comparePrices'),
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'markets',
      label: t('multiMarket'),
      icon: <Map className="h-5 w-5" />,
    },
    {
      id: 'forecast',
      label: t('aiForecast'),
      icon: <Brain className="h-5 w-5" />,
    },
    {
      id: 'trends',
      label: t('priceTrends'),
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'favorites',
      label: t('favorites'),
      icon: <Heart className="h-5 w-5" />,
    },
    {
      id: 'ads',
      label: 'Sponsored Ads',
      icon: <Megaphone className="h-5 w-5" />,
    },
  ];

  const moreMenuItems = [
    {
      id: 'notifications',
      label: t('notifications'),
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotificationCount,
    },
    {
      id: 'alerts',
      label: t('priceAlerts'),
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      id: 'vendors',
      label: t('vendors') || 'Vendors',
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'profile',
      label: t('profile'),
      icon: <UserIcon className="h-5 w-5" />,
    },
  ];

  const allTabs = [...navItems, ...moreMenuItems];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Decorative Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-2xl bg-black/20">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-700" />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className="icon-container">
                  <UserIcon className="h-6 w-6 text-emerald-400" />
                </div>

                <div>
                  <h1 className="text-xl font-bold premium-gradient-text">
                    {t('consumerDashboard')}
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
                  className="logout-btn-premium"
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
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="icon-container flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-base font-bold premium-gradient-text truncate">
                    {t('consumerDashboard')}
                  </h1>

                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ThemeToggle />

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="mobile-menu-btn"
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
              <div className="absolute right-4 top-16 z-50 w-60 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="p-3 space-y-2">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <LanguageSwitcher />
                  </div>

                  <button
                    onClick={() => {
                      onLogout();
                      setShowMobileMenu(false);
                    }}
                    className="mobile-dropdown-btn text-red-400 hover:bg-red-500/10"
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
        {/* Admin Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCog className="h-4 w-4 text-emerald-400" />
                {t('viewingAsAdmin')}
              </div>

              <Button
                onClick={onReturnToAdmin}
                size="sm"
                className="btn-outline-premium w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('returnToAdmin')}
              </Button>
            </div>
          </div>
        )}

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
      {/* Search */}
      <TabsTrigger
        value="search"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Search className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('searchProducts')}
          </span>
        </div>
      </TabsTrigger>

      {/* Compare */}
      <TabsTrigger
        value="compare"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <TrendingUp className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('comparePrices')}
          </span>
        </div>
      </TabsTrigger>

      {/* Markets */}
      <TabsTrigger
        value="markets"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Map className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('multiMarket')}
          </span>
        </div>
      </TabsTrigger>

      {/* Forecast */}
      <TabsTrigger
        value="forecast"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Brain className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('aiForecast')}
          </span>
        </div>
      </TabsTrigger>

      {/* Trends */}
      <TabsTrigger
        value="trends"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <TrendingUp className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('priceTrends')}
          </span>
        </div>
      </TabsTrigger>

      {/* Favorites */}
      <TabsTrigger
        value="favorites"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Heart className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('favorites')}
          </span>
        </div>
      </TabsTrigger>

      {/* Ads */}
      <TabsTrigger
        value="ads"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Megaphone className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            Sponsored Ads
          </span>
        </div>
      </TabsTrigger>

      {/* Notifications */}
      <TabsTrigger
        value="notifications"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Bell className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('notifications')}
          </span>

          {unreadNotificationCount > 0 && (
            <Badge
              className="
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

                bg-red-500
                text-white

                animate-pulse
                shadow-lg
              "
            >
              {unreadNotificationCount > 99
                ? '99+'
                : unreadNotificationCount}
            </Badge>
          )}
        </div>
      </TabsTrigger>

      {/* Alerts */}
      <TabsTrigger
        value="alerts"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <AlertCircle className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('priceAlerts')}
          </span>
        </div>
      </TabsTrigger>

      {/* Vendors */}
      <TabsTrigger
        value="vendors"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <Users className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('vendors') || 'Vendors'}
          </span>
        </div>
      </TabsTrigger>

      {/* Profile */}
      <TabsTrigger
        value="profile"
        className="tab-trigger-premium"
      >
        <div className="flex items-center gap-2 relative">
          <UserIcon className="h-4 w-4 shrink-0" />

          <span className="text-sm font-medium whitespace-nowrap">
            {t('profile')}
          </span>
        </div>
      </TabsTrigger>
    </TabsList>
  </div>

  {/* =========================
      TAB CONTENT
  ========================== */}

  <TabsContent value="search" className="animate-fadeIn mt-4">
    <ProductSearch />
  </TabsContent>

  <TabsContent value="compare" className="animate-fadeIn">
    <PriceComparison />
  </TabsContent>

  <TabsContent value="markets" className="animate-fadeIn">
    <MultiMarketComparison />
  </TabsContent>

  <TabsContent value="forecast" className="animate-fadeIn">
    <PriceForecast />
  </TabsContent>

  <TabsContent value="trends" className="animate-fadeIn">
    <PriceTrends />
  </TabsContent>

  <TabsContent value="favorites" className="animate-fadeIn">
    <Favorites userId={user.id} />
  </TabsContent>

  <TabsContent value="ads" className="animate-fadeIn">
    <ConsumerAds />
  </TabsContent>

  <TabsContent value="notifications" className="animate-fadeIn">
    <Notifications
      userId={user.id}
      onNotificationRead={fetchUnreadCount}
    />
  </TabsContent>

  <TabsContent value="alerts" className="animate-fadeIn">
    <PriceAlerts userId={user.id} />
  </TabsContent>

  <TabsContent value="vendors" className="animate-fadeIn">
    <VendorProfiles />
  </TabsContent>

  <TabsContent value="profile" className="animate-fadeIn">
    <UserProfile user={user} />
  </TabsContent>
</Tabs>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <TabCarousel
            items={allTabs.map(item => ({
              ...item,
              badge: item.id === 'notifications' ? unreadNotificationCount : undefined
            }))}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
          animation: fadeIn 0.35s ease;
        }

        .animate-scaleIn {
          animation: scaleIn 0.35s ease;
        }

        .premium-gradient-text {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #10b981 45%,
            #34d399 100%
          );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-container {
          padding: 0.8rem;
          border-radius: 1rem;

          background: rgba(255, 255, 255, 0.05);

          border: 1px solid rgba(255, 255, 255, 0.1);

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);

          backdrop-filter: blur(20px);
        }

        .mobile-menu-btn {
          padding: 0.65rem;
          border-radius: 0.9rem;

          color: hsl(var(--muted-foreground));

          background: rgba(255, 255, 255, 0.04);

          border: 1px solid rgba(255, 255, 255, 0.08);

          transition: all 0.25s ease;
        }

        .mobile-menu-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
        }

        .mobile-dropdown-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;

          padding: 0.9rem 1rem;

          border-radius: 1rem;

          transition: all 0.25s ease;
        }

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

          backdrop-filter: blur(20px);
        }

        .tab-trigger-premium:hover {
          color: white;

          background: rgba(16, 185, 129, 0.12);

          border: 1px solid rgba(16, 185, 129, 0.25);

          transform: translateY(-1px);
        }

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

        .tab-trigger-premium[data-state="active"] svg {
          color: white !important;
        }

        .tab-trigger-premium[data-state="active"]::before {
          content: '';

          position: absolute;
          inset: 0;

          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.18),
            transparent
          );

          transform: translateX(-100%);

          animation: tabGlow 2.5s infinite;
        }

        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);

          border: 1px solid rgba(255, 255, 255, 0.12);

          color: white;

          transition: all 0.25s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(16, 185, 129, 0.12);

          border-color: rgba(16, 185, 129, 0.35);

          transform: translateY(-1px);
        }

        .logout-btn-premium {
          background: rgba(239, 68, 68, 0.08);

          border: 1px solid rgba(239, 68, 68, 0.25);

          color: rgb(248 113 113);

          transition: all 0.25s ease;
        }

        .logout-btn-premium:hover {
          background: rgba(239, 68, 68, 0.18);

          border-color: rgba(239, 68, 68, 0.4);

          color: white;

          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}