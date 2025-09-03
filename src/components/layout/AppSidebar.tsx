import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Clock, User, LogOut, Store, LayoutGrid, Boxes, Users, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useEffect, useRef, useState } from "react";

export type NavItem = { title: string; url: string; icon: React.ComponentType<any> };

export const AppSidebar = ({ items, cartInfo }: { items: NavItem[]; cartInfo?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Store className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-slate-800">Orderly</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {items.filter(item => item.url !== '#').map((item) => (
              <NavLink 
                key={item.url}
                to={item.url} 
                end 
                className={({ isActive }) => 
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                      : "text-slate-700 hover:text-emerald-600 hover:bg-emerald-50"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </div>

          {/* Right Side - Notifications, Profile, Logout */}
          <div className="flex items-center gap-3">
            <NotificationsBell />
            {/* Profile (role-based) */}
            <NavLink 
              to={user?.role === 'distributor' ? '/wholesale/profile' : user?.role === 'salesperson' ? '/sales/profile' : '/shop/profile'} 
              className="p-2 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            >
              <User className="h-5 w-5" />
            </NavLink>
            
            {/* Logout */}
            <button 
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              onClick={async () => {
                try {
                  await signOut();
                } catch {}
                localStorage.removeItem('joinAs');
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const shopItems: NavItem[] = [
  { title: "Dashboard", url: "/shop/dashboard", icon: LayoutGrid },
  { title: "Cart", url: "/shop/cart", icon: ShoppingCart },
  { title: "Orders", url: "/shop/orders", icon: Clock },
  { title: "Analytics", url: "/shop/analytics", icon: LayoutGrid },
];

export const wholesaleItems: NavItem[] = [
  { title: "Dashboard", url: "/wholesale/dashboard", icon: LayoutGrid },
  { title: "Inventory", url: "/wholesale/inventory", icon: Boxes },
  { title: "Salespersons", url: "/wholesale/sales-requests", icon: Users },
  { title: "Analytics", url: "/wholesale/analytics", icon: LayoutGrid },
];

export const adminItems: NavItem[] = [
  { title: "Overview", url: "/admin/overview", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
  { title: "Users", url: "/admin/users", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title: "Orders", url: "/admin/orders", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 8H3"/><path d="M21 12H3"/><path d="M21 16H3"/></svg> },
];

export const salespersonItems: NavItem[] = [
  { title: "Dashboard", url: "/sales/dashboard", icon: LayoutGrid },
  { title: "Cart", url: "/sales/cart", icon: ShoppingCart },
  { title: "Orders", url: "/sales/orders", icon: Clock },
];

function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead, refresh, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const latest = notifications.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
        onClick={async () => {
          const next = !open;
          setOpen(next);
          if (next) {
            try { await refresh(); } catch {}
          }
        }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
            <div className="text-sm font-medium text-slate-700">Notifications</div>
            <div className="flex items-center gap-3">
              <button
                className="text-xs text-slate-600 hover:underline"
                onClick={async () => {
                  if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
                  await clearAll();
                }}
              >
                Clear all
              </button>
              <button
                className="text-xs text-emerald-600 hover:underline disabled:text-slate-400"
                onClick={async () => { await markAllRead(); }}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            {latest.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {latest.map((n) => (
                  <li key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-emerald-50/60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{n.title || 'Notification'}</div>
                        <div className="text-sm text-slate-600 mt-0.5">{n.message}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      {!n.read && (
                        <button
                          className="text-xs text-emerald-600 hover:underline whitespace-nowrap"
                          onClick={() => markRead(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
