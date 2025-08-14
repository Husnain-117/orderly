import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Clock, User, LogOut, Store, LayoutGrid, Boxes } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
                key={item.title}
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

          {/* Right Side - Cart, Profile, Logout */}
          <div className="flex items-center gap-3">
            
            
            {/* Profile (role-based) */}
            <NavLink 
              to={user?.role === 'distributor' ? '/wholesale/profile' : '/shop/profile'} 
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
];

export const wholesaleItems: NavItem[] = [
  { title: "Dashboard", url: "/wholesale/dashboard", icon: LayoutGrid },
  { title: "Inventory", url: "/wholesale/inventory", icon: Boxes },
];

export const adminItems: NavItem[] = [
  { title: "Overview", url: "/admin/overview", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
  { title: "Users", url: "/admin/users", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { title: "Orders", url: "/admin/orders", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 8H3"/><path d="M21 12H3"/><path d="M21 16H3"/></svg> },
];
