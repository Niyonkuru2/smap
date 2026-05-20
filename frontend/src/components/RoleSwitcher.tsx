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
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole | null;
  onRoleChange: (role: UserRole | null) => void;
}

export default function RoleSwitcher({
  currentRole,
  onRoleChange,
}: RoleSwitcherProps) {
  // Only show admin role in this component
  const roles = [
    {
      value: 'admin',
      label: 'Admin Dashboard',
      description: 'Manage platform, users & analytics',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      bgGradient: 'from-emerald-500/20 to-emerald-600/10',
      badge: 'Current',
    },
  ];

  const handleValueChange = (value: string) => {
    if (value === 'admin') {
      onRoleChange(null);
    }
  };

  const selectedRole = roles[0];

  const SelectedIcon = selectedRole.icon;

  return (
    <div className="relative group">
      {/* Glow effect behind the switcher */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500" />
      
      <Select
        value="admin"
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="
            relative
            h-12
            min-w-[260px]
            rounded-2xl
            border
            border-white/10
            bg-gradient-to-br
            from-white/10
            to-white/5
            backdrop-blur-xl
            px-4
            transition-all
            duration-300
            hover:bg-white/10
            hover:border-emerald-500/40
            focus:ring-2
            focus:ring-emerald-500/30
            shadow-lg
            cursor-pointer
          "
        >
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {/* Icon Container with Gradient */}
                <div
                  className="
                    relative
                    flex
                    items-center
                    justify-center
                    h-10
                    w-10
                    rounded-xl
                    bg-gradient-to-br
                    from-emerald-500/20
                    to-emerald-600/10
                    border
                    border-emerald-500/30
                    shadow-lg
                    overflow-hidden
                    group-hover:scale-105
                    transition-transform
                    duration-300
                  "
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-shimmer" />
                  
                  <SelectedIcon
                    className={`h-5 w-5 ${selectedRole.iconColor} relative z-10`}
                  />
                </div>

                <div className="flex flex-col items-start leading-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                      {selectedRole.label}
                    </span>
                    <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRole.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Current badge pill */}
                <span
                  className="
                    hidden sm:inline-flex
                    items-center
                    gap-1
                    rounded-full
                    bg-emerald-500/15
                    border
                    border-emerald-500/30
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold
                    text-emerald-300
                    shadow-sm
                  "
                >
                  <ShieldCheck className="h-3 w-3" />
                  Admin Access
                </span>
                
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:rotate-180" />
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          className="
            border
            border-white/10
            bg-[#0a0f1a]/95
            backdrop-blur-2xl
            rounded-2xl
            shadow-2xl
            overflow-hidden
            min-w-[280px]
            animate-in
            fade-in-0
            zoom-in-95
            duration-200
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
                  transition-all
                  duration-200
                  focus:bg-white/10
                  data-[highlighted]:bg-gradient-to-r
                  data-[highlighted]:from-white/10
                  data-[highlighted]:to-transparent
                  data-[highlighted]:border
                  data-[highlighted]:border-white/10
                "
              >
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-3">
                    {/* Icon Container */}
                    <div
                      className="
                        relative
                        flex
                        items-center
                        justify-center
                        h-11
                        w-11
                        rounded-xl
                        bg-gradient-to-br
                        from-emerald-500/20
                        to-emerald-600/10
                        border
                        border-emerald-500/30
                        shadow-md
                      "
                    >
                      <Icon
                        className={`h-5 w-5 ${role.iconColor}`}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        {role.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </div>

                  {/* Badge with shine effect */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-500/0 rounded-full blur-sm" />
                    <span
                      className="
                        relative
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-gradient-to-r
                        from-emerald-500/20
                        to-emerald-600/10
                        border
                        border-emerald-500/40
                        px-3
                        py-1.5
                        text-[10px]
                        font-bold
                        text-emerald-300
                        shadow-sm
                      "
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {role.badge}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Add shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}