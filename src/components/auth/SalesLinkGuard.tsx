import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function SalesLinkGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "approved" | "blocked">("loading");

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Non-sales roles are allowed through without extra checks
      if (!user || user.role !== "salesperson") {
        if (mounted) setStatus("approved");
        return;
      }
      try {
        const res = await api.salesperson.linkStatus();
        const s = res?.status?.state;
        if (mounted) setStatus(s === "approved" ? "approved" : "blocked");
      } catch {
        if (mounted) setStatus("blocked");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">Checking access…</div>
    );
  }

  if (status === "blocked") {
    return <Navigate to="/sales/link-distributor" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
