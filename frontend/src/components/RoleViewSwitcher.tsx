import { UserRole } from '../App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Eye, ShieldCheck, Store, Briefcase, User } from 'lucide-react';

interface RoleViewSwitcherProps {
  onViewAsRole: (role: UserRole) => void;
}

export default function RoleViewSwitcher({ onViewAsRole }: RoleViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-white/70" />
      <Select defaultValue="admin" onValueChange={(value) => onViewAsRole(value as UserRole)}>
        <SelectTrigger className="w-[200px] bg-card/60 border-accent/40 text-foreground hover:bg-card/80 hover:border-accent/60">
          <div className="flex items-center gap-2">
            <SelectValue placeholder="View as..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-700" />
              <span>Admin Dashboard</span>
            </div>
          </SelectItem>
          <SelectItem value="vendor">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-green-600" />
              <span>Vendor Dashboard</span>
            </div>
          </SelectItem>
          <SelectItem value="business">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-green-600" />
              <span>Business Dashboard</span>
            </div>
          </SelectItem>
          <SelectItem value="consumer">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-700" />
              <span>Consumer Dashboard</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

