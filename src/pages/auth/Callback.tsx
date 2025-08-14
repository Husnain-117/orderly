import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Simple callback page for Supabase email link/verification redirects
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Supabase will handle session in onAuthStateChange via AuthProvider
    // We can optionally route the user after a brief delay
    const from = (location.state as any)?.from?.pathname as string | undefined;
    const timer = setTimeout(() => {
      toast.success("Authentication complete");
      navigate(from || "/shop/dashboard", { replace: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-700">
      Completing authentication...
    </div>
  );
}
