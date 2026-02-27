import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  MessageSquare,
  FileText,
  CalendarDays,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

const navSections = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", badge: null },
      { icon: BarChart3, label: "Analytics", badge: "3" },
      { icon: FolderKanban, label: "Projects", badge: null },
      { icon: MessageSquare, label: "Messages", badge: "12" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { icon: FileText, label: "Documents", badge: null },
      { icon: CalendarDays, label: "Calendar", badge: null },
      { icon: Users, label: "Team", badge: null },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: Settings, label: "Settings", badge: null },
      { icon: HelpCircle, label: "Help", badge: null },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Dashboard");

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          // h-full instead of h-screen — fills the flex row (your layout's <div className="flex flex-1">)
          "relative flex h-full flex-col border-r transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[220px]",
        )}
        style={{ background: "white", borderColor: "#bbebff" }}
      >
        {/* Top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, #30b0ff90, transparent)",
          }}
        />

        {/* ── HEADER ── */}
        <div
          className="flex h-[60px] shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "#bbebff" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{
              background: "linear-gradient(135deg, #1a93f6, #57ccff)",
              boxShadow: "0 4px 14px rgba(26,147,246,0.28)",
            }}
          >
            E
          </div>

          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide text-[#133358] transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-full opacity-100",
            )}
          >
            EduSpace
          </span>
        </div>

        {/* ── NAVIGATION — flex-1 + min-h-0 allows ScrollArea to shrink and scroll ── */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-3 py-4">
            <div className="flex flex-col gap-5">
              {navSections.map((section, si) => (
                <div key={section.label}>
                  {/* Section label */}
                  <p
                    className={cn(
                      "mb-1.5 overflow-hidden whitespace-nowrap px-2 text-[9px] font-semibold uppercase tracking-widest transition-all duration-200",
                      collapsed ? "h-0 opacity-0" : "h-4 opacity-100",
                    )}
                    style={{ color: "#57ccff" }}
                  >
                    {section.label}
                  </p>

                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = active === item.label;

                      const navButton = (
                        <button
                          key={item.label}
                          onClick={() => setActive(item.label)}
                          className={cn(
                            "group relative flex w-full items-center gap-2.5 rounded-lg border px-2 py-2 text-left transition-all duration-150",
                            isActive
                              ? "border-[#57ccff50] bg-[#d9f3ff] text-[#137fec]"
                              : "border-transparent text-[#185390] hover:bg-[#d9f3ff80] hover:text-[#1a93f6]",
                          )}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                              style={{
                                background:
                                  "linear-gradient(180deg, #1a93f6, #57ccff)",
                              }}
                            />
                          )}

                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-[#1a93f6]"
                                : "text-[#57ccff] group-hover:text-[#1a93f6]",
                            )}
                          />

                          <span
                            className={cn(
                              "flex-1 overflow-hidden whitespace-nowrap text-xs font-medium tracking-wide transition-all duration-300",
                              collapsed
                                ? "w-0 opacity-0"
                                : "w-full opacity-100",
                            )}
                          >
                            {item.label}
                          </span>

                          {item.badge && !collapsed && (
                            <Badge
                              variant="secondary"
                              className="h-4 min-w-[18px] rounded-full px-1.5 text-[9px] font-semibold"
                              style={{
                                background: "#bbebff",
                                color: "#137fec",
                                border: "1px solid #8de0ff",
                              }}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      );

                      return collapsed ? (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="flex items-center gap-2 bg-[#133358] text-white border-[#1662b7]"
                          >
                            {item.label}
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[9px] bg-[#1a93f6] text-white border-none"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        navButton
                      );
                    })}
                  </div>

                  {si < navSections.length - 1 && (
                    <Separator
                      className="mt-4"
                      style={{ background: "#bbebff" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── FOOTER — user card ── */}
        <div
          className="shrink-0 border-t p-3"
          style={{ borderColor: "#bbebff" }}
        >
          <div className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[#d9f3ff]">
            <Avatar
              className="h-7 w-7 shrink-0 border"
              style={{ borderColor: "#8de0ff" }}
            >
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #1a93f6, #57ccff)",
                }}
              >
                AK
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col transition-all duration-300",
                collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100",
              )}
            >
              <span className="truncate text-[11px] font-semibold text-[#133358]">
                Alex Kim
              </span>
              <span
                className="text-[9px] tracking-widest"
                style={{ color: "#30b0ff" }}
              >
                PRO PLAN
              </span>
            </div>

            {!collapsed && (
              <Bell
                className="h-3.5 w-3.5 shrink-0 transition-colors"
                style={{ color: "#57ccff" }}
              />
            )}
          </div>
        </div>

        {/* ── COLLAPSE TOGGLE ── */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-[22px] z-20 h-7 w-7 rounded-full border-[1.5px] shadow-md transition-all duration-200 hover:shadow-lg [&>svg]:h-3.5 [&>svg]:w-3.5"
          style={{
            background: "#eefaff",
            borderColor: "#8de0ff",
            color: "#1a93f6",
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
