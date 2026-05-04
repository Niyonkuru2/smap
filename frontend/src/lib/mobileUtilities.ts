/**
 * Mobile Responsive Utilities - Tailwind Class References
 * 
 * Use these class names in your Tailwind markup
 * No CSS compilation - pure Tailwind utilities
 */

export const mobileClasses = {
  // Touch target - 44x44px minimum (WCAG AA compliant)
  touchTarget: 'min-w-[2.75rem] min-h-[2.75rem]',
  
  // Mobile card spacing
  mobileCard: 'p-4 rounded-lg border border-accent/20 bg-card/80 backdrop-blur-sm',
  mobileCardCompact: 'p-3 rounded-md border border-accent/15 bg-card/50',
  
  // Mobile button sizing
  mobileButton: 'py-3 px-4 rounded-lg transition-all active:scale-95 min-h-[2.75rem]',
  mobileButtonSm: 'py-2 px-3 rounded-lg transition-all active:scale-95 min-h-[2.5rem]',
  
  // Typography scaling
  mobileHeading: 'text-base sm:text-lg font-bold',
  mobileSubheading: 'text-sm sm:text-base font-semibold',
  mobileLabel: 'text-xs sm:text-sm',
  
  // List spacing
  mobileList: 'space-y-0 divide-y divide-accent/10',
  mobileListItem: 'py-3 px-4 first:pt-0 last:pb-0',
  mobileListCompact: 'space-y-0 divide-y divide-accent/10',
  mobileListItemCompact: 'py-2 px-3 first:pt-0 last:pb-0',
  
  // Grid responsive
  mobileGrid1: 'grid grid-cols-1',
  mobileGrid2: 'grid grid-cols-1 sm:grid-cols-2',
  mobileGrid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  
  // Spacing
  mobileSpacing: 'gap-4 sm:gap-6',
  mobileSpacingCompact: 'gap-3 sm:gap-4',
};

/**
 * Safe area constants for notched devices
 * Use with padding utilities
 */
export const safeAreaClasses = {
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  top: 'pt-[env(safe-area-inset-top)]',
  left: 'pl-[env(safe-area-inset-left)]',
  right: 'pr-[env(safe-area-inset-right)]',
  all: 'p-[env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]',
};

/**
 * Header classes for responsive design
 */
export const headerClasses = {
  // Mobile header styling
  mobileContainer: 'md:hidden px-4 py-3.5 relative',
  desktopContainer: 'hidden md:block px-6',
  
  // Icon sizing
  headerIconLarge: 'h-6 w-6', // 24px
  headerIconMedium: 'h-5 w-5', // 20px
  headerIconSmall: 'h-4 w-4', // 16px
  
  // Text sizing
  headerTitle: 'text-base sm:text-lg md:text-2xl font-bold',
  headerSubtitle: 'text-xs sm:text-sm text-gray-400',
};

/**
 * Form input classes for mobile
 * Prevents iOS auto-zoom on focus (requires 16px+ font)
 */
export const inputClasses = {
  base: 'text-base py-3 px-4 min-h-[2.75rem] focus:text-base',
  sm: 'text-base py-2 px-3 min-h-[2.5rem]',
  textarea: 'text-base p-4 min-h-[6rem] focus:text-base',
};
