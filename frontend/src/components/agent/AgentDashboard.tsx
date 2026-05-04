import { useState } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LogOut, Upload, List, MapPin, Bell, User as UserIcon, ArrowLeft, UserCog, ClipboardList, CheckCircle2, CheckSquare } from 'lucide-react';
import type { User } from '../../App';
import DataCollection from './DataCollection';
import MyCollections from './MyCollections';
import AssignedMarkets from './AssignedMarkets';
import Notifications from './Notifications';
import { PriceVerification } from './PriceVerification';
import UserProfile from '../shared/UserProfile';
import LanguageSwitcher from '../LanguageSwitcherVibrant';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';
import TabCarousel from '../mobile/TabCarousel';

interface AgentDashboardProps {
  user: User;
  onLogout: () => void;
  isAdminViewing?: boolean;
  onReturnToAdmin?: () => void;
}

export default function AgentDashboard({ user, onLogout, isAdminViewing, onReturnToAdmin }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('verify');
  const { t } = useLanguage();

  const navItems = [
    { id: 'verify', label: t('verifyPrices'), icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'collect', label: t('collectData'), icon: <Upload className="h-4 w-4" /> },
    { id: 'collections', label: t('myCollections'), icon: <List className="h-4 w-4" /> },
    { id: 'markets', label: t('assignedMarkets'), icon: <MapPin className="h-4 w-4" /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'profile', label: t('profile'), icon: <UserIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(5,150,105,0.1),transparent_34%),linear-gradient(135deg,hsl(160,40%,20%)_0%,hsl(160,40%,22%)_45%,hsl(160,40%,20%)_100%)]">
      {/* Header */}
      <header className="dark-glass border-b border-white/10 sticky top-0 z-50 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-md">
                <ClipboardList className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">{t('agentPortal') || 'Market Agent Portal'}</h1>
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

        {/* Agent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mb-3">
          <div className="glass-card p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-900 rounded-md">
                <Upload className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-green-400">24</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t('todaySubmissions') || "Today's Submissions"}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-900 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-green-400">156</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t('totalVerified') || 'Total Verified'}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-900 rounded-md">
                <MapPin className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-green-400">3</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t('assignedMarkets') || 'Assigned Markets'}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-900 rounded-md">
                <List className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-green-400">48</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t('productsTracked') || 'Products Tracked'}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <TabsList className="mb-3 p-0.5 bg-green-900 border border-green-700 shadow-sm rounded-lg flex-wrap gap-0.5 h-auto hidden md:flex">
            <TabsTrigger value="verify" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <CheckSquare className="h-3 w-3 mr-1" />
              {t('verifyPrices') || 'Verify Prices'}
            </TabsTrigger>
            <TabsTrigger value="collect" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Upload className="h-3 w-3 mr-1" />
              {t('collectPrices') || 'Collect Prices'}
            </TabsTrigger>
            <TabsTrigger value="collections" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <List className="h-3 w-3 mr-1" />
              {t('myCollections') || 'My Collections'}
            </TabsTrigger>
            <TabsTrigger value="markets" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <MapPin className="h-3 w-3 mr-1" />
              {t('assignedMarkets') || 'Assigned Markets'}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <Bell className="h-3 w-3 mr-1" />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="profile" className="h-7 px-2 text-[11px] font-medium text-gray-600 rounded-md data-[state=active]:bg-green-900 data-[state=active]:text-white">
              <UserIcon className="h-3 w-3 mr-1" />
              {t('profile')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <PriceVerification />
          </TabsContent>

          <TabsContent value="collect">
            <DataCollection agentName={user.name} agentId={user.id} />
          </TabsContent>

          <TabsContent value="collections">
            <MyCollections agentName={user.name} agentId={user.id} />
          </TabsContent>

          <TabsContent value="markets">
            <AssignedMarkets agentId={user.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <Notifications agentId={user.id} />
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

