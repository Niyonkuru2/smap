/**
 * MOBILE-RESPONSIVE HEADER PATTERN
 * 
 * Apply this pattern to all dashboard headers for consistent mobile experience
 * 
 * Features:
 * - Desktop: Full layout with all controls
 * - Mobile: Compact layout with dropdown menu for controls
 * - Responsive breakpoint: md (768px)
 * - Z-index: 40 (allows bottom nav z-50 to overlap when needed)
 */

// IMPLEMENTATION CHECKLIST FOR NEW DASHBOARDS:

1. Add state:
   const [showMobileMenu, setShowMobileMenu] = useState(false);

2. Import MoreVertical icon:
   import { MoreVertical } from 'lucide-react';

3. Replace header with two-part structure:
   - <div className="hidden md:block">  {/* Desktop */}
   - <div className="md:hidden">         {/* Mobile */}

4. Desktop header (unchanged from original):
   - Keep all controls, full spacing
   - Use larger text (h-14, text-lg)
   - All buttons visible

5. Mobile header layout:
   const [
     Left (flex-1):
       - Icon (p-1.5, flex-shrink-0)
       - Title (truncate)
       - Subtitle (truncate)
     Right (flex-shrink-0):
       - ThemeToggle
       - MoreVertical button (opens dropdown)
   ]

6. Mobile dropdown menu:
   - Appears below MoreVertical button
   - z-50 for high stacking
   - Sections: Language, Settings/RoleView, Logout
   - Close menu after actions

7. Main content:
   - Add: pb-20 md:pb-3 (bottom padding for mobile nav)

8. Mobile Bottom Navigation:
   <div className="md:hidden">
     <MobileBottomNav 
       activeTab={activeTab}
       onTabChange={setActiveTab}
       userRole="admin|consumer|vendor|business"
       notificationCount={count}
       customItems={navItems}
     />
   </div>

// EXAMPLE MOBILE MENU STRUCTURE:

{showMobileMenu && (
  <div className="absolute right-2 top-12 bg-card border border-accent rounded-lg shadow-lg z-50 min-w-max">
    <div className="p-2 space-y-1">
      {/* Language Selector */}
      <div className="px-3 py-2">
        <LanguageSwitcher />
      </div>
      
      {/* Settings/Role Switcher (if applicable) */}
      <div className="px-3 py-2 border-t border-accent">
        <RoleViewSwitcher onViewAsRole={(role) => {
          onViewAsRole(role);
          setShowMobileMenu(false);
        }} />
      </div>
      
      {/* Logout */}
      <button
        onClick={() => {
          onLogout();
          setShowMobileMenu(false);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        {t('logout')}
      </button>
    </div>
  </div>
)}

// DASHBOARDS COMPLETED:
✅ ConsumerDashboard
✅ AdminDashboard

// DASHBOARDS PENDING:
- VendorDashboard
- BusinessDashboard
- AgentDashboard
