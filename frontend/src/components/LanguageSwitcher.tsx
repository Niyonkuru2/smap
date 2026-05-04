import { useState } from 'react';
import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../utils/translations';
import { Flag } from './ui/flags';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const languages: { 
    code: Language; 
    name: string; 
    flagCode: 'uk' | 'rw' | 'fr';
    buttonClass: string;
    dropdownClass: string;
    badgeClass: string;
  }[] = [
    { 
      code: 'en', 
      name: 'English', 
      flagCode: 'uk',
      buttonClass: 'bg-green-600 text-white border-green-700 hover:bg-green-700',
      dropdownClass: 'bg-green-900 text-green-100 border-l-green-600',
      badgeClass: 'bg-green-700 text-white'
    },
    { 
      code: 'rw', 
      name: 'Kinyarwanda', 
      flagCode: 'rw',
      buttonClass: 'bg-green-500 text-white border-green-600 hover:bg-green-600',
      dropdownClass: 'bg-green-100 text-green-900 border-l-green-500',
      badgeClass: 'bg-green-600 text-white'
    },
    { 
      code: 'fr', 
      name: 'Français', 
      flagCode: 'fr',
      buttonClass: 'bg-green-700 text-white border-green-800 hover:bg-green-800',
      dropdownClass: 'bg-green-950 text-green-100 border-l-green-700',
      badgeClass: 'bg-green-700 text-white'
    },
  ];

  const currentLanguage = languages.find((l) => l.code === language);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setOpen(false); // Close dropdown immediately
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className={`
            ${currentLanguage?.buttonClass}
            border-2
            transition-all
            duration-150
            shadow-lg
            hover:shadow-xl
            hover:scale-105
            font-semibold
          `}
        >
          <Languages className="h-4 w-4 mr-2" />
          {currentLanguage && <Flag country={currentLanguage.flagCode} className="w-6 h-4 mr-2 rounded-sm shadow-sm" />}
          <span>{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="text-xs font-semibold text-gray-500 px-3 py-2 mb-1">
          Select Language
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              cursor-pointer
              rounded-md
              mb-1
              transition-all
              duration-150
              py-3
              px-3
              ${language === lang.code 
                ? `${lang.dropdownClass} border-l-4 font-semibold` 
                : 'hover:bg-secondary'
              }
            `}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Flag country={lang.flagCode} className="w-7 h-5 rounded-sm shadow-sm" />
                <span className="font-medium">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Badge className={`${lang.badgeClass} text-xs px-2 py-0.5`}>
                  Active
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

