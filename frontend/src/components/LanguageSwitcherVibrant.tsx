import { useState } from 'react';
import { Languages, Check } from 'lucide-react';
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

export default function LanguageSwitcherVibrant() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const languages: { 
    code: Language; 
    name: string; 
    flagCode: 'uk' | 'rw' | 'fr';
    gradient: string;
    textColor: string;
    hoverGradient: string;
    badgeColor: string;
  }[] = [
    { 
      code: 'en', 
      name: 'English', 
      flagCode: 'uk',
      gradient: 'bg-gradient-to-r from-green-600 to-green-700',
      textColor: 'text-white',
      hoverGradient: 'hover:from-green-700 hover:to-green-800',
      badgeColor: 'bg-green-700'
    },
    { 
      code: 'rw', 
      name: 'Kinyarwanda', 
      flagCode: 'rw',
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
      textColor: 'text-white',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
      badgeColor: 'bg-green-600'
    },
    { 
      code: 'fr', 
      name: 'Français', 
      flagCode: 'fr',
      gradient: 'bg-gradient-to-r from-green-700 to-green-800',
      textColor: 'text-white',
      hoverGradient: 'hover:from-green-800 hover:to-green-900',
      badgeColor: 'bg-green-700'
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
            ${currentLanguage?.gradient}
            ${currentLanguage?.textColor}
            ${currentLanguage?.hoverGradient}
            border-0
            shadow-lg
            hover:shadow-xl
            transition-all
            duration-200
            hover:scale-105
            font-medium
          `}
        >
          <Languages className="h-4 w-4 mr-2" />
          {currentLanguage && <Flag country={currentLanguage.flagCode} className="w-6 h-4 mr-2 rounded-sm shadow-sm" />}
          <span>{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
          Select Language
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              cursor-pointer
              rounded-lg
              my-1
              py-3
              px-3
              transition-all
              duration-150
              ${language === lang.code 
                ? `${lang.gradient} ${lang.textColor} shadow-md` 
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
                <Check className="h-5 w-5" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

