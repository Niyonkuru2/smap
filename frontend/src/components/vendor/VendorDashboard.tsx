import { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, Upload, List, TrendingUp, Bell, User as UserIcon, ArrowLeft, Store, UserCog, Megaphone } from 'lucide-react';
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

interface VendorDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function VendorDashboard({ user, onLogout, isAdminViewing, onReturnToAdmin }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState('submit');
  const { t } = useLanguage();

  const navItems = [
    { id: 'submit', label: t('submitPrice'), icon: <Upload className="h-4 w-4" /> },
    { id: 'submissions', label: t('mySubmissions'), icon: <List className="h-4 w-4" /> },
    { id: 'sales', label: t('mySales'), icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'advertise', label: t('advertise'), icon: <Megaphone className="h-4 w-4" /> },
    { id: 'profile', label: t('profile'), icon: <UserIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(5,150,105,0.1),transparent_34%),linear-gradient(135deg,hsl(160,40%,20%)_0%,hsl(160,40%,22%)_45%,hsl(160,40%,20%)_100%)]">
      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-50 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-md">
                <Store className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">{t('vendorPortal')}</h1>
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 min-h-screen flex flex-col">
        {/* Admin Viewing Banner */}
        {isAdminViewing && onReturnToAdmin && (
          <div className="mb-3 bg-green-950 border border-green-700 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-300 flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> {t('viewingAsAdmin')}</span>
              <Button
                onClick={onReturnToAdmin}
                size="sm"
                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                {t('returnToAdmin')}
              </Button>
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-3 p-0.5 bg-green-900 border border-green-700 shadow-sm rounded-lg flex-wrap gap-0.5 h-auto hidden md:flex">
            <TabsTrigger value="submit" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Upload className="h-3 w-3 mr-1" />
              {t('submitPrice')}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <List className="h-3 w-3 mr-1" />
              {t('mySubmissions')}
            </TabsTrigger>
            <TabsTrigger value="sales" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('mySales')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Bell className="h-3 w-3 mr-1" />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="advertise" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Megaphone className="h-3 w-3 mr-1" />
              {t('advertise')}
            </TabsTrigger>
            <TabsTrigger value="profile" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <UserIcon className="h-3 w-3 mr-1" />
              {t('profile')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="flex-1">
            <SubmitPrice vendorName={user.name} vendorId={user.id} />
          </TabsContent>

          <TabsContent value="submissions" className="flex-1">
            <MySubmissions vendorName={user.name} vendorId={user.id} />
          </TabsContent>

          <TabsContent value="sales" className="flex-1">
            <MySales vendorName={user.name} vendorId={user.id} />
          </TabsContent>

          <TabsContent value="notifications" className="flex-1">
            <Notifications vendorName={user.name} vendorId={user.id} />
          </TabsContent>

          <TabsContent value="advertise" className="flex-1">
            <AdvertisementManager />
          </TabsContent>

          <TabsContent value="profile" className="flex-1">
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

