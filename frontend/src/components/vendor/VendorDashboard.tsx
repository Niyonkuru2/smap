import { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LogOut,
  Upload,
  List,
  TrendingUp,
  Bell,
  User as UserIcon,
  ArrowLeft,
  Store,
  UserCog,
  Megaphone,
  Crown,
} from 'lucide-react';

import type { User } from '../../App';

import SubmitPrice from './SubmitPrice';
import MySubmissions from './MySubmissions';
import MySales from './MySales';
import Notifications from './Notifications';
import { AdvertisementManager } from './AdvertisementManager';
import UserProfile from '../shared/UserProfile';
import LanguageSwitcher from '../LanguageSwitcherVibrant';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';
import VendorSubscription from './VendorSubscription';

interface VendorDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function VendorDashboard({
  user,
  onLogout,
  isAdminViewing,
  onReturnToAdmin,
}: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState('submit');
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'submit',
      label: t('submitPrice'),
      icon: <Upload className="h-5 w-5" />,
    },
    {
      id: 'submissions',
      label: t('mySubmissions'),
      icon: <List className="h-5 w-5" />,
    },
    {
      id: 'sales',
      label: t('mySales'),
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: <Crown className="h-5 w-5" />,
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: 'advertise',
      label: t('advertise'),
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      id: 'profile',
      label: t('profile'),
      icon: <UserIcon className="h-5 w-5" />,
    },
  ];

  const allTabs = [...navItems];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-40 shadow-lg backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-emerald-400 to-green-500" />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left */}
              <div className="flex items-center gap-3">
                <div className="icon-container">
                  <Store className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h1 className="text-lg font-bold gradient-text">
                    {t('vendorPortal')}
                  </h1>

                  <p className="text-xs text-muted-foreground">
                    {t('welcome')},{' '}
                    <span className="font-semibold text-white">
                      {user.name}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">
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
                    duration-200
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
          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="icon-container flex-shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-base font-bold gradient-text truncate">
                    {t('vendorPortal')}
                  </h1>

                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 flex-shrink-0">
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
                    text-sm
                    px-3
                    py-1.5
                  "
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
        {/* Admin Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-4 dark-glass border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                {t('viewingAsAdmin')}
              </span>

              <Button
                onClick={onReturnToAdmin}
                size="sm"
                className="btn-secondary w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('returnToAdmin')}
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1"
        >
          {/* Desktop Tabs */}
          <TabsList
            className="
              hidden
              md:flex
              mb-6
              p-2
              dark-glass
              border
              border-white/10
              shadow-xl
              rounded-2xl
              flex-wrap
              gap-2
              h-auto
            "
          >
            <TabsTrigger
              value="submit"
              className="tab-trigger-premium"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('submitPrice')}
            </TabsTrigger>

            <TabsTrigger
              value="submissions"
              className="tab-trigger-premium"
            >
              <List className="h-4 w-4 mr-2" />
              {t('mySubmissions')}
            </TabsTrigger>

            <TabsTrigger
              value="sales"
              className="tab-trigger-premium"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('mySales')}
            </TabsTrigger>

            <TabsTrigger
              value="subscription"
              className="tab-trigger-premium"
            >
              <Crown className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="tab-trigger-premium"
            >
              <Bell className="h-4 w-4 mr-2" />
              {t('notifications')}
            </TabsTrigger>

            <TabsTrigger
              value="advertise"
              className="tab-trigger-premium"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              {t('advertise')}
            </TabsTrigger>

            <TabsTrigger
              value="profile"
              className="tab-trigger-premium"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              {t('profile')}
            </TabsTrigger>
          </TabsList>

          {/* Submit */}
          <TabsContent
            value="submit"
            className="flex-1 mt-4 animate-fadeIn"
          >
            <SubmitPrice
              vendorName={user.name}
              vendorId={user.id}
            />
          </TabsContent>

          {/* Submissions */}
          <TabsContent
            value="submissions"
            className="flex-1 animate-fadeIn"
          >
            <MySubmissions
              vendorName={user.name}
              vendorId={user.id}
            />
          </TabsContent>

          {/* Sales */}
          <TabsContent
            value="sales"
            className="flex-1 animate-fadeIn"
          >
            <MySales
              vendorName={user.name}
              vendorId={user.id}
            />
          </TabsContent>

          {/* Subscription */}
          <TabsContent
            value="subscription"
            className="flex-1 animate-fadeIn"
          >
            <VendorSubscription
              vendorId={user.id}
              vendorName={user.name}
            />
          </TabsContent>

          {/* Notifications */}
          <TabsContent
            value="notifications"
            className="flex-1 animate-fadeIn"
          >
            <Notifications
              vendorName={user.name}
              vendorId={user.id}
            />
          </TabsContent>

          {/* Advertise */}
          <TabsContent
            value="advertise"
            className="flex-1 animate-fadeIn"
          >
            <AdvertisementManager />
          </TabsContent>

          {/* Profile */}
          <TabsContent
            value="profile"
            className="flex-1 animate-fadeIn"
          >
            <UserProfile user={user} />
          </TabsContent>
        </Tabs>

        {/* Mobile Footer Tabs */}
        <div className="md:hidden">
          <TabCarousel
            items={allTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </main>

      {/* Local styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
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
          animation: fadeIn 0.25s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
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

        .btn-premium {
          background: linear-gradient(
            135deg,
            hsl(var(--primary)) 0%,
            #10b981 100%
          );

          color: white;
          transition: all 0.2s ease;
        }

        .btn-premium:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}