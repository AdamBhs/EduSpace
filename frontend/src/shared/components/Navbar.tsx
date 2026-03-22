import { Fragment, useEffect, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";

const notifications = [
  { title: "New comment on Dashboard", time: "2m ago", unread: true },
  { title: "Project Alpha deployed", time: "1h ago", unread: true },
  { title: "Team invite accepted", time: "3h ago", unread: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const breadcrumbState = location.state as {
    breadcrumb?: { name?: string; description?: string };
    className?: string;
    classDescription?: string;
  } | null;
  const classBreadcrumb =
    breadcrumbState?.breadcrumb ??
    (breadcrumbState?.className || breadcrumbState?.classDescription
      ? {
          name: breadcrumbState?.className,
          description: breadcrumbState?.classDescription,
        }
      : undefined);
  const classCodeFromPath = (() => {
    const path = location.pathname.replace(/\/+$/, "");
    const segments = path ? path.split("/").filter(Boolean) : [];
    const classIndex = segments.indexOf("c");
    if (classIndex === -1 || classIndex + 1 >= segments.length) {
      return null;
    }
    return segments[classIndex + 1];
  })();
  const [cachedBreadcrumb, setCachedBreadcrumb] = useState<{
    code: string;
    data: { name?: string; description?: string };
  } | null>(null);
  const effectiveClassBreadcrumb =
    classBreadcrumb ??
    (cachedBreadcrumb?.code === classCodeFromPath
      ? cachedBreadcrumb.data
      : undefined);

  const capitalized = (name: String) => {
    const newName = name
      ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
      : "";
    return newName;
  };

  useEffect(() => {
    if (!classCodeFromPath) {
      setCachedBreadcrumb(null);
      return;
    }
    const breadcrumbData = {
      name: classBreadcrumb?.name,
      description: classBreadcrumb?.description,
    };
    if (breadcrumbData.name || breadcrumbData.description) {
      setCachedBreadcrumb({ code: classCodeFromPath, data: breadcrumbData });
      sessionStorage.setItem(
        `classBreadcrumb:${classCodeFromPath}`,
        JSON.stringify(breadcrumbData),
      );
      return;
    }
    if (cachedBreadcrumb?.code === classCodeFromPath) {
      return;
    }
    const stored = sessionStorage.getItem(
      `classBreadcrumb:${classCodeFromPath}`,
    );
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        name?: string;
        description?: string;
      };
      setCachedBreadcrumb({ code: classCodeFromPath, data: parsed });
    } catch {
      // Ignore invalid cache entries.
    }
  }, [
    classBreadcrumb?.description,
    classBreadcrumb?.name,
    classCodeFromPath,
    cachedBreadcrumb?.code,
  ]);

  return (
    <div
      className="w-full shrink-0 flex h-15 items-center gap-3 px-4 md:px-6 border-b border-[#E2E8F0]"
      style={{ background: "white" }}
    >
      <div className="ml-5">
        <Breadcrumb>
          <BreadcrumbList className="flex items-center gap-2 text-sm font-medium text-slate-500">
            {(() => {
              const path = location.pathname.replace(/\/+$/, "") || "/";
              const segments =
                path === "/" ? [] : path.split("/").filter(Boolean);
              const labelMap: Record<string, string> = {
                users: "Users",
                calendar: "Calendar",
                c: "Class",
              };
              const crumbs = [
                { label: "", path: "/", isClassCode: false },
                ...segments.map((segment, index) => {
                  const isClassCode = segment === classCodeFromPath;
                  return {
                    isClassCode,
                    label: (() => {
                      if (isClassCode && effectiveClassBreadcrumb?.name) {
                        return effectiveClassBreadcrumb.name;
                      }
                      return (
                        labelMap[segment] ??
                        segment
                          .split("-")
                          .map(
                            (part) =>
                              part.charAt(0).toUpperCase() + part.slice(1),
                          )
                          .join(" ")
                      );
                    })(),
                    path:
                      segment === "c"
                        ? "/"
                        : `/${segments.slice(0, index + 1).join("/")}`,
                  };
                }),
              ];

              return crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <Fragment key={crumb.path + index}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-slate-900 font-semibold">
                          {crumb.isClassCode &&
                          effectiveClassBreadcrumb?.name ? (
                            <span className="flex flex-col leading-tight">
                              <span>{effectiveClassBreadcrumb.name}</span>
                              {effectiveClassBreadcrumb.description?.trim() ? (
                                <span className="text-xs font-normal text-slate-500">
                                  {effectiveClassBreadcrumb.description.trim()}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            crumb.label
                          )}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="transition-colors hover:text-slate-900"
                        >
                          <Link to={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && index > 0 && (
                      <BreadcrumbSeparator className="text-slate-500" />
                    )}
                  </Fragment>
                );
              });
            })()}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* ── SPACER ── */}
      <div className="flex-1" />

      {/* ── SEARCH ── */}
      <div className="hidden md:flex items-center">
        {searchOpen ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
            style={{
              background: "#d9f3ff",
              border: "1px solid #8de0ff",
            }}
          >
            <Search
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "#57ccff" }}
            />
            <input
              autoFocus
              placeholder="Search…"
              onBlur={() => setSearchOpen(false)}
              className="w-36 bg-transparent text-sm outline-none placeholder:text-[#57ccff80] text-[#133358]"
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-8 w-8 rounded-lg transition-colors hover:bg-[#d9f3ff]"
            style={{ color: "#57ccff" }}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── NOTIFICATIONS ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg hover:bg-[#d9f3ff]"
            style={{ color: "#57ccff" }}
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
              style={{
                background: "#1a93f6",
                boxShadow: "0 0 0 2px #eefaff",
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 p-0 overflow-hidden"
          style={{ background: "#eefaff", border: "1px solid #bbebff" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #bbebff" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#57ccff" }}
            >
              Notifications
            </span>
            <Badge
              className="h-4 rounded-full px-1.5 text-[9px] font-semibold"
              style={{
                background: "#bbebff",
                color: "#137fec",
                border: "1px solid #8de0ff",
              }}
            >
              2 new
            </Badge>
          </div>

          {notifications.map((n, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#d9f3ff]"
              style={{
                borderBottom:
                  i < notifications.length - 1 ? "1px solid #d9f3ff" : "none",
              }}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: n.unread ? "#1a93f6" : "transparent",
                  border: n.unread ? "none" : "1px solid #bbebff",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#133358]">
                  {n.title}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: "#57ccff" }}>
                  {n.time}
                </p>
              </div>
            </div>
          ))}

          <div
            className="px-4 py-2.5 text-center cursor-pointer hover:bg-[#d9f3ff] transition-colors"
            style={{ borderTop: "1px solid #bbebff" }}
          >
            <span
              className="text-[11px] font-semibold"
              style={{ color: "#1a93f6" }}
            >
              View all notifications →
            </span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── USER MENU ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#d9f3ff]"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = "#8de0ff50")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "transparent")
            }
          >
            <Avatar
              className="h-7 w-7 border"
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
            <ChevronDown
              className="hidden md:block h-3.5 w-3.5"
              style={{ color: "#57ccff" }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52 p-0 overflow-hidden"
          style={{ background: "#eefaff", border: "1px solid #bbebff" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid #bbebff" }}
          >
            <p className="text-[13px] font-semibold text-[#133358]">
              {capitalized(user?.profile?.firstName)}{" "}
              {capitalized(user?.profile?.lastName)}
            </p>
            <p className="text-[11px]" style={{ color: "#57ccff" }}>
              {user?.email}
            </p>
          </div>

          <div className="py-1">
            {[
              { icon: User, label: "Profile", path: "" },
              { icon: Settings, label: "Settings", path: "/settings" },
              { icon: HelpCircle, label: "Support", path: "" },
            ].map(({ icon: Icon, label, path }) => (
              <DropdownMenuItem
                key={label}
                onClick={() => path && navigate(path)}
                className="mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium cursor-pointer focus:bg-[#d9f3ff]"
                style={{ color: "#185390" }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: "#57ccff" }} />
                {label}
              </DropdownMenuItem>
            ))}
          </div>

          <div
            onClick={logout}
            style={{ borderTop: "1px solid #bbebff" }}
            className="py-1"
          >
            <DropdownMenuItem
              className="mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium cursor-pointer focus:bg-red-50"
              style={{ color: "#ef4444" }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── MOBILE HAMBURGER ── */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 rounded-lg hover:bg-[#d9f3ff]"
            style={{ color: "#57ccff" }}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0"
          style={{
            background: "#eefaff",
            borderRight: "1px solid #bbebff",
          }}
        >
          <div
            className="flex h-[60px] items-center gap-2.5 px-4"
            style={{ borderBottom: "1px solid #bbebff" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
              style={{
                background: "linear-gradient(135deg, #1a93f6, #57ccff)",
                boxShadow: "0 4px 14px rgba(26,147,246,0.28)",
              }}
            >
              N
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-[#133358]">
              Nucleus<span style={{ color: "#1a93f6" }}>.</span>
            </span>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
