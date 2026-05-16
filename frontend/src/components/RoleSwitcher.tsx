import { UserRole } from '../App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

import {
  ShieldCheck,
  Store,
  Building2,
  User,
  ChevronDown,
} from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole | null;
  onRoleChange: (role: UserRole | null) => void;
}

export default function RoleSwitcher({
  currentRole,
  onRoleChange,
}: RoleSwitcherProps) {
  const roles = [
    {
      value: 'admin',
      label: 'Admin Dashboard',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      badge: 'Current',
    },
    {
      value: 'vendor',
      label: 'Vendor Dashboard',
      icon: Store,
      iconColor: 'text-blue-400',
    },
    {
      value: 'business',
      label: 'Business Dashboard',
      icon: Building2,
      iconColor: 'text-purple-400',
    },
    {
      value: 'consumer',
      label: 'Consumer Dashboard',
      icon: User,
      iconColor: 'text-orange-400',
    },
  ];

  const handleValueChange = (value: string) => {
    if (value === 'admin') {
      onRoleChange(null);
    } else {
      onRoleChange(value as UserRole);
    }
  };

  const selectedRole =
    roles.find((role) => role.value === (currentRole || 'admin')) ||
    roles[0];

  const SelectedIcon = selectedRole.icon;

  return (
    <div className="flex items-center">
      <Select
        value={currentRole || 'admin'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="
            h-11
            min-w-[220px]
            rounded-2xl
            border
            border-white/10
            bg-white/5
            backdrop-blur-xl
            px-4
            transition-all
            duration-300
            hover:bg-white/10
            hover:border-emerald-500/30
            focus:ring-2
            focus:ring-emerald-500/20
            shadow-lg
          "
        >
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    h-8
                    w-8
                    rounded-xl
                    bg-white/5
                    border
                    border-white/10
                  "
                >
                  <SelectedIcon
                    className={`h-4 w-4 ${selectedRole.iconColor}`}
                  />
                </div>

                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-semibold text-white">
                    {selectedRole.label}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Switch dashboard
                  </span>
                </div>
              </div>

              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          className="
            border
            border-white/10
            bg-[#0f172a]/95
            backdrop-blur-2xl
            rounded-2xl
            shadow-2xl
            overflow-hidden
          "
        >
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <SelectItem
                key={role.value}
                value={role.value}
                className="
                  cursor-pointer
                  rounded-xl
                  my-1
                  mx-1
                  px-3
                  py-3
                  focus:bg-white/10
                  data-[highlighted]:bg-white/10
                "
              >
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        h-9
                        w-9
                        rounded-xl
                        bg-white/5
                        border
                        border-white/10
                      "
                    >
                      <Icon
                        className={`h-4 w-4 ${role.iconColor}`}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {role.label}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Access dashboard
                      </span>
                    </div>
                  </div>

                  {role.badge && (
                    <span
                      className="
                        rounded-full
                        bg-emerald-500/15
                        border
                        border-emerald-500/20
                        px-2
                        py-1
                        text-[10px]
                        font-semibold
                        text-emerald-300
                      "
                    >
                      {role.badge}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}