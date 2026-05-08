import { UserRole } from '../App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Eye, ShieldCheck, Store, Building2, User } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole | null;
  onRoleChange: (role: UserRole | null) => void;
}

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const roles = [
    { value: 'admin', label: 'Admin Dashboard', icon: ShieldCheck, color: 'text-green-700' },
    { value: 'vendor', label: 'Vendor Dashboard', icon: Store, color: 'text-green-600' },
    { value: 'business', label: 'Business Dashboard', icon: Building2, color: 'text-green-600' },
    { value: 'consumer', label: 'Consumer Dashboard', icon: User, color: 'text-green-700' },
  ];

  const handleValueChange = (value: string) => {
    if (value === 'admin') {
      onRoleChange(null);
    } else {
      onRoleChange(value as UserRole);
    }
  };

  const getCurrentValue = () => {
    return currentRole || 'admin';
  };

  const getCurrentRole = roles.find(r => r.value === getCurrentValue());

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-white/70" />
      <Select value={getCurrentValue()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] bg-card/60 text-foreground border-accent/40 hover:bg-card/80 hover:border-accent/60\">
          <SelectValue>
            <div className="flex items-center gap-2">
              {getCurrentRole && <getCurrentRole.icon className="h-4 w-4" />}
              <span>{getCurrentRole?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-2">
                <role.icon className={`h-4 w-4 ${role.color}`} />
                <span>{role.label}</span>
                {role.value === 'admin' && (
                  <span className="ml-2 text-xs text-gray-500">(Your Role)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

