import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabCarouselProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function TabCarousel({
  items,
  activeTab,
  onTabChange,
  children,
}: TabCarouselProps) {
  const currentIndex = items.findIndex(item => item.id === activeTab);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onTabChange(items[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      onTabChange(items[currentIndex + 1].id);
    }
  };

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;
  const currentItem = items[currentIndex];

  return (
    <div className="md:hidden">
      {/* Mobile Step-by-Step Navigation */}
      <div className="bg-green-900/50 border border-green-700 rounded-lg overflow-hidden mb-3">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between px-3 py-3 gap-2">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="flex-shrink-0 p-2 rounded-md text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Current Step Display */}
          <div className="flex-1 text-center min-w-0">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentItem.icon && <span className="flex-shrink-0 text-green-400">{currentItem.icon}</span>}
              <span className="text-sm font-semibold text-white truncate">{currentItem.label}</span>
              {currentItem.badge && currentItem.badge > 0 && (
                <Badge className="flex-shrink-0 bg-red-600 text-white px-2 py-0 text-[9px] animate-pulse">
                  {currentItem.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-green-300 mt-1">Step {currentIndex + 1} of {items.length}</p>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="flex-shrink-0 p-2 rounded-md text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-green-900">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="border-t border-green-700 px-2 py-2 bg-green-950/30">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white ring-1 ring-green-400'
                    : idx < currentIndex
                      ? 'bg-green-700/50 text-green-200'
                      : 'bg-green-900/30 text-gray-400 hover:bg-green-900/50'
                }`}
                title={item.label}
              >
                <span className="font-bold">{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="rounded-lg">{children}</div>
    </div>
  );
}
