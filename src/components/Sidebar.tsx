import { NavLink } from "react-router-dom";
import {
      LayoutDashboard,
      Send,
      MessageSquare,
      Package,
      Users,
      History,
      Settings,
      Upload,
      FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Importação", url: "/ingestao", icon: Upload },
  { title: "Agente Ativo", url: "/agente-ativo", icon: Send },
  { title: "Agente Reativo", url: "/agente-reativo", icon: MessageSquare },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Configuração", url: "/configuracao", icon: Settings },
      // Expose the onboarding page in the sidebar so users can return to it
      // after initial setup or to adjust prompts and numbers
      { title: "Onboarding", url: "/onboarding", icon: FilePlus },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          SDR Performance
        </h1>
        <p className="text-sm text-sidebar-foreground/70">& Gestão</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          Modo: {import.meta.env.VITE_DATA_SOURCE || "Demo"}
        </p>
      </div>
    </aside>
  );
}
