import { useEffect, useRef, useState } from "react";
import { FileText, CalendarDays, Users, Settings } from "lucide-react";
import { GoHomeFill } from "react-icons/go";
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
import { LuListTodo } from "react-icons/lu";
import { MdOutlineArchive } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { IoMenu } from "react-icons/io5";

const navSections = [
  {
    items: [
      { icon: GoHomeFill, label: "Home", path: "/", badge: null },
      {
        icon: CalendarDays,
        label: "Calendar",
        path: "/calendar",
        badge: null,
      },
      {
        icon: LuListTodo,
        label: "To-do",
        path: "/todo",
        badge: null,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        icon: FileText,
        label: "Documents",
        path: "/documents",
        badge: null,
      },
      { icon: Users, label: "Users", path: "/users", badge: null },
    ],
  },
];

const footerItems = [
  { icon: MdOutlineArchive, label: "Archive", path: "/archive" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(
    () => localStorage.getItem("sidebarHidden") === "true",
  );
  const [overlayOpen, setOverlayOpen] = useState(false);
  const isClassRoute = location.pathname.startsWith("/c/");
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isClassRoute) {
      if (hidden) {
        setHidden(false);
      }
      localStorage.setItem("sidebarHidden", "false");
      setOverlayOpen(false);
      return;
    }

    const storedHidden = localStorage.getItem("sidebarHidden") === "true";
    setHidden(storedHidden);
    setOverlayOpen(false);
  }, [isClassRoute, location.pathname, hidden]);

  useEffect(() => {
    if (hidden && collapsed) {
      setCollapsed(false);
    }
  }, [hidden, collapsed]);

  useEffect(() => {
    const shouldListen = isClassRoute && (hidden ? overlayOpen : !collapsed);
    if (!shouldListen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        sidebarRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }

      if (hidden) {
        setOverlayOpen(false);
      } else {
        setCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [hidden, overlayOpen, collapsed, isClassRoute]);

  const handleMenuClick = () => {
    if (hidden) {
      setOverlayOpen((prev) => !prev);
      return;
    }

    setCollapsed((prev) => !prev);
  };

  const menuButton = (
    <button
      ref={menuButtonRef}
      type="button"
      onClick={handleMenuClick}
      className={cn(
        "z-50 border-none cursor-pointer rounded-full flex items-center justify-center w-8 h-8 transition-all duration-200 hover:bg-gray-200",
        hidden ? "fixed left-3.5 top-3.5" : "absolute left-3.5 top-3.5",
      )}
      aria-label={
        hidden
          ? overlayOpen
            ? "Close sidebar"
            : "Open sidebar"
          : collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
      }
    >
      <IoMenu size={22} className="text-[#475569]" />
    </button>
  );

  const renderNavButton = (
    item: { icon: any; label: string; path: string; badge?: string | null },
    siKey: string,
  ) => {
    const Icon = item.icon;
    // Use startsWith for index route, exact match for others
    const isActive =
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path);

    const btn = (
      <button
        key={item.label}
        onClick={() => navigate(item.path)}
        className={cn(
          "group relative flex items-center gap-2.5 cursor-pointer rounded-lg border px-2 py-2 text-left transition-all duration-150",
          isActive
            ? "border-[#57ccff50] bg-[#d9f3ff] text-[#137fec]"
            : "border-transparent text-[#185390] hover:bg-[#d9f3ff80] hover:text-[#1a93f6]",
          collapsed ? "w-max" : "w-full",
        )}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-4 w-0.75 -translate-y-1/2 rounded-r-full"
            style={{ background: "linear-gradient(180deg, #1a93f6, #57ccff)" }}
          />
        )}

        <Icon
          className={cn(
            "h-4.5 w-4.5 shrink-0 transition-colors",
            isActive
              ? "text-[#1a93f6]"
              : "text-[#475569] group-hover:text-[#1a93f6]",
          )}
        />

        <span
          className={cn(
            "flex-1 overflow-hidden whitespace-nowrap text-xs font-medium tracking-wide transition-all duration-300",
            collapsed ? "hidden" : "w-full opacity-100",
          )}
        >
          {item.label}
        </span>

        {item.badge && !collapsed && (
          <Badge
            variant="secondary"
            className="h-4 min-w-4.5 rounded-full px-1.5 text-[9px] font-semibold"
            style={{
              background: "#E2E8F0",
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
      <Tooltip key={`${siKey}-${item.label}`}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-2 bg-[#56aaff] text-white border-[#1662b7]"
        >
          {item.label}
          {item.badge && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[9px] bg-[#137FEC]/80 text-white border-none"
            >
              {item.badge}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    ) : (
      btn
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      {hidden ? menuButton : null}
      <aside
        ref={sidebarRef}
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          hidden
            ? "fixed left-0 top-0 z-40 h-screen w-62.5 shadow-lg transition-transform"
            : "relative h-full",
          hidden
            ? overlayOpen
              ? "translate-x-0"
              : "-translate-x-full pointer-events-none"
            : collapsed
              ? "w-17"
              : "w-62.5",
        )}
        style={{ background: "white", borderColor: "#E2E8F0" }}
      >
        {/* ── HEADER ── */}
        <div
          className="flex h-[60px] shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 ml-12 items-center justify-center rounded-lg text-sm font-black text-white"
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
              collapsed ? "w-full opacity-100" : "w-full opacity-100",
            )}
          >
            EduSpace
          </span>
          {!hidden ? menuButton : null}
        </div>

        {/* ── NAVIGATION ── */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-3 py-4">
            <div className="flex flex-col gap-5">
              {navSections.map((section, si) => (
                <div key={section.label ?? si}>
                  {section.label && (
                    <p
                      className={cn(
                        "mb-1.5 overflow-hidden whitespace-nowrap px-2 text-[9px] font-semibold uppercase tracking-widest transition-all duration-200",
                        collapsed ? "h-0 opacity-0" : "h-4 opacity-100",
                      )}
                      style={{ color: "#57ccff" }}
                    >
                      {section.label}
                    </p>
                  )}

                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) =>
                      renderNavButton(item, String(si)),
                    )}
                  </div>

                  {si < navSections.length - 1 && (
                    <Separator
                      className="mt-4"
                      style={{ background: "#E2E8F0" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 border-t px-3 py-3 flex flex-col gap-0.5"
          style={{ borderColor: "#E2E8F0" }}
        >
          {footerItems.map((item) => renderNavButton(item, "footer"))}
        </div>

        {/* ── COLLAPSE TOGGLE ── */}
      </aside>
    </TooltipProvider>
  );
}
