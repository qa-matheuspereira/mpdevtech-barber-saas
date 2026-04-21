import { useLocation } from "wouter";
import { LayoutDashboard, Calendar, Users, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/appointments" },
  { icon: Users, label: "Equipe", path: "/barbers" },
  { icon: MessageSquare, label: "WhatsApp", path: "/settings/whatsapp" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16">
        {items.map(({ icon: Icon, label, path }) => {
          const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-primary rounded-b-full" />
              )}
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={cn(
                "text-[10px] leading-none",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
