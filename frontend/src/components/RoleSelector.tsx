import { useState } from 'react';
import { User, Store, Briefcase, Settings, ClipboardList, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../types';

interface RoleConfig {
  id: UserRole;
  description: string;
  descriptionRw: string;
  descriptionFr: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  bg: string;
  text: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'consumer',
    description: 'Browse & compare prices',
    descriptionRw: 'Reba no kugereranya ibiciro',
    descriptionFr: 'Parcourir et comparer les prix',
    icon: User,
    color: 'bg-green-600',
    border: 'border-green-500',
    bg: 'bg-gradient-to-r from-green-50 to-green-100',
    text: 'text-green-900',
  },
  {
    id: 'vendor',
    description: 'Submit & manage prices',
    descriptionRw: 'Tanga no gucunga ibiciro',
    descriptionFr: 'Soumettre et gérer les prix',
    icon: Store,
    color: 'bg-green-500',
    border: 'border-green-400',
    bg: 'bg-gradient-to-r from-green-50 to-green-100',
    text: 'text-green-900',
  },
  {
    id: 'business',
    description: 'Analytics & bulk tools',
    descriptionRw: "Isesengura n'ibikoresho byinshi",
    descriptionFr: 'Analyses et outils en masse',
    icon: Briefcase,
    color: 'bg-green-700',
    border: 'border-green-600',
    bg: 'bg-gradient-to-r from-green-50 to-green-100',
    text: 'text-green-900',
  },
  {
    id: 'agent',
    description: 'Collect market data',
    descriptionRw: "Gukusanya amakuru y'isoko",
    descriptionFr: 'Collecter des données de marché',
    icon: ClipboardList,
    color: 'bg-green-600',
    border: 'border-green-500',
    bg: 'bg-gradient-to-r from-green-50 to-green-100',
    text: 'text-green-900',
  },
  {
    id: 'admin',
    description: 'System management',
    descriptionRw: 'Imicungire ya sisitemu',
    descriptionFr: 'Gestion du système',
    icon: Settings,
    color: 'bg-green-800',
    border: 'border-green-700',
    bg: 'bg-gradient-to-r from-green-50 to-green-100',
    text: 'text-green-900',
  },
];

const ROLE_NAMES: Record<UserRole, { en: string; rw: string; fr: string }> = {
  consumer: { en: 'Consumer', rw: 'Umuguzi', fr: 'Consommateur' },
  vendor:   { en: 'Vendor',   rw: 'Umucuruzi', fr: 'Vendeur' },
  business: { en: 'Business', rw: 'Ubucuruzi', fr: 'Entreprise' },
  agent:    { en: 'Market Agent', rw: 'Umukozi w\'Isoko', fr: 'Agent de Marché' },
  admin:    { en: 'Admin',    rw: 'Umuyobozi', fr: 'Administrateur' },
};

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  label?: string;
}

export function RoleSelector({ value, onChange, label }: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const lang = language === 'rw' ? 'rw' : language === 'fr' ? 'fr' : 'en';

  const selected = ROLES.find(r => r.id === value) ?? ROLES[0];
  const SelectedIcon = selected.icon;

  const getRoleName = (roleId: UserRole) => ROLE_NAMES[roleId][lang];

  const getDescription = (role: RoleConfig) => {
    if (lang === 'rw') return role.descriptionRw;
    if (lang === 'fr') return role.descriptionFr;
    return role.description;
  };

  const defaultLabel =
    lang === 'fr' ? 'Se connecter en tant que' :
    lang === 'rw' ? 'Injira nka' :
    'Sign in as';

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-muted-foreground mb-1">
        {label || defaultLabel}
      </label>

      {/* Selected role trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all duration-300 hover:shadow-sm ${selected.border} ${selected.bg}`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${selected.color}`}>
            <SelectedIcon className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-xs ${selected.text}`}>
              {getRoleName(value)}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">{getDescription(selected)}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Options list */}
          <div className="absolute z-20 w-full mt-1.5 bg-card border border-accent rounded-lg shadow-lg overflow-hidden">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = role.id === value;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { onChange(role.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2 p-2.5 hover:bg-secondary transition-colors ${
                    isSelected ? 'bg-green-50/60' : ''
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${isSelected ? role.color : 'bg-secondary'}`}>
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-medium text-xs ${isSelected ? 'text-green-700' : 'text-foreground'}`}>
                      {getRoleName(role.id)}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-tight">{getDescription(role)}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

