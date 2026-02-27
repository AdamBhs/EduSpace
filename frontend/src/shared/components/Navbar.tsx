import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Menu,
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
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
import { cn } from "@/shared/lib/utils";

const navLinks = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FolderKanban, label: "Projects" },
  { icon: MessageSquare, label: "Messages" },
];

const notifications = [
  { title: "New comment on Dashboard", time: "2m ago", unread: true },
  { title: "Project Alpha deployed", time: "1h ago", unread: true },
  { title: "Team invite accepted", time: "3h ago", unread: false },
];

export default function Navbar() {
  const [active, setActive] = useState("Dashboard");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    // shrink-0 prevents the navbar from being compressed by the flex-col parent
    <header
      className="w-full shrink-0"
      style={{
        background: "white",
        borderBottom: "1px solid #bbebff",
      }}
    >
      <div className="mx-auto flex h-[60px] max-w-screen-xl items-center gap-3 px-4 md:px-6">
        {/* ── DESKTOP NAV LINKS ── */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ icon: Icon, label }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#d9f3ff] text-[#137fec]"
                    : "text-[#185390] hover:bg-[#d9f3ff80] hover:text-[#1a93f6]",
                )}
                style={
                  isActive
                    ? { border: "1px solid #8de0ff50" }
                    : { border: "1px solid transparent" }
                }
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-[#1a93f6]" : "text-[#57ccff]",
                  )}
                />
                {label}
                {isActive && (
                  <span
                    className="absolute -bottom-[1px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #1a93f6, #57ccff)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

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
                  <p
                    className="mt-0.5 text-[10px]"
                    style={{ color: "#57ccff" }}
                  >
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
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "#8de0ff50")
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
              <div className="hidden md:flex flex-col items-start">
                <span className="text-[12px] font-semibold text-[#133358]">
                  Alex Kim
                </span>
                <span
                  className="text-[9px] tracking-widest"
                  style={{ color: "#30b0ff" }}
                >
                  PRO PLAN
                </span>
              </div>
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
                Alex Kim
              </p>
              <p className="text-[11px]" style={{ color: "#57ccff" }}>
                alex@nucleus.io
              </p>
            </div>

            <div className="py-1">
              {[
                { icon: User, label: "Profile" },
                { icon: Settings, label: "Settings" },
                { icon: HelpCircle, label: "Support" },
              ].map(({ icon: Icon, label }) => (
                <DropdownMenuItem
                  key={label}
                  className="mx-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium cursor-pointer focus:bg-[#d9f3ff]"
                  style={{ color: "#185390" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: "#57ccff" }} />
                  {label}
                </DropdownMenuItem>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #bbebff" }} className="py-1">
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

            <nav className="flex flex-col gap-0.5 px-3 py-4">
              {navLinks.map(({ icon: Icon, label }) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActive(label)}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "border-[#57ccff50] bg-[#d9f3ff] text-[#137fec]"
                        : "border-transparent text-[#185390] hover:bg-[#d9f3ff80] hover:text-[#1a93f6]",
                    )}
                  >
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
                        "h-4 w-4",
                        isActive ? "text-[#1a93f6]" : "text-[#57ccff]",
                      )}
                    />
                    {label}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
