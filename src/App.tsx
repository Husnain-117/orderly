import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/register";
import NotFound from "./pages/NotFound";
import ShopDashboard from "./pages/shop/ShopDashboard";
import ShopOrders from "./pages/shop/OrderHistory";
import ShopProfile from "./pages/shop/Profile";
import WholesaleOrders from "./pages/wholesale/OrdersManagement";
import AdminOverview from "./pages/admin/Overview";
import Register from "./pages/register";
import Login from "./pages/login";
import DistributorDashboard from "./pages/wholesale/Distributor_dashboard";
import Inventory from "./pages/wholesale/inventory";
import WholesaleProfile from "./pages/wholesale/Profile";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import AuthCallback from "./pages/auth/Callback";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Redirect base URL to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Shopkeeper */}
            <Route
              path="/shop/dashboard"
              element={
                <ProtectedRoute>
                  <ShopDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/cart"
              element={
                <ProtectedRoute>
                  <AddToCart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/orders"
              element={
                <ProtectedRoute>
                  <ShopOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop/profile"
              element={
                <ProtectedRoute>
                  <ShopProfile />
                </ProtectedRoute>
              }
            />
            {/* Wholesaler */}
            <Route
              path="/wholesale/orders"
              element={
                <ProtectedRoute>
                  <WholesaleOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wholesale/dashboard"
              element={
                <ProtectedRoute>
                  <DistributorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wholesale/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wholesale/profile"
              element={
                <ProtectedRoute>
                  <WholesaleProfile />
                </ProtectedRoute>
              }
            />
            {/* Admin */}
            <Route
              path="/admin/overview"
              element={
                <ProtectedRoute>
                  <AdminOverview />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

import AddToCart from './pages/shop/AddToCart';
// ...other imports

// Add this route inside your router/switch
// <Route path="/shop/cart" element={<AddToCart />} />

export default App;
