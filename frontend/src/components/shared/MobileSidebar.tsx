import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface MobileSidebarProps {
  items: NavItem[];
  activeItem: string;
  onItemSelect: (id: string) => void;
  title?: string;
}

export function MobileSidebar({ items, activeItem, onItemSelect, title = 'Menu' }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string) => {
    onItemSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden h-9 w-9 p-0 text-foreground hover:bg-secondary/20"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar Overlay - Mobile Only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer - Mobile Only */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeItem === item.id
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
