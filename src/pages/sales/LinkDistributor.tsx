import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getDashboardPath } from "@/utils/routes";

export default function LinkDistributor() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    { state: "unlinked" | "pending" | "approved" | "rejected"; distributorId?: string; requestId?: string } | null
  >(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const s = await api.salesperson.linkStatus();
        setStatus(s.status);
        if (s.status.state === "approved") {
          toast.success("Distributor approved you. Redirecting...");
          navigate(getDashboardPath("salesperson"), { replace: true });
        }
      } catch {}
    })();
  }, [navigate]);

  const submit = async () => {
    if (!email) return toast.error("Please enter distributor email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter valid email");
    setLoading(true);
    try {
      const res = await api.salesperson.requestLink(email.trim().toLowerCase());
      toast.success("Request sent to distributor");
      setStatus({ state: "pending", distributorId: res.request.distributorId, requestId: res.request.id });
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();
      if (msg.includes("distributor_not_found")) return toast.error("Distributor not found");
      if (msg.includes("already_requested")) return toast.info("You already have a pending request with this distributor.");
      if (msg.includes("already_linked_active")) return toast.info("You're already linked to a distributor. Ask them to unlink you first.");
      toast.error(e?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Link to your Distributor</h1>
        <p className="text-slate-600 text-sm mb-4">
          Welcome{user?.email ? `, ${user.email}` : ""}. To continue, enter your distributor's email to request approval.
        </p>

        {status?.state === "pending" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-4 mb-4">
            <p className="font-medium">Request pending</p>
            <p className="text-sm">Your distributor has been notified. You'll gain access once approved.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={async () => {
                try { const s = await api.salesperson.linkStatus(); setStatus(s.status); } catch {}
              }}>Refresh status</Button>
              <Button variant="ghost" onClick={signOut}>Logout</Button>
            </div>
          </div>
        ) : status?.state === "rejected" ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-900 p-4 mb-4">
            <p className="font-medium">Request rejected</p>
            <p className="text-sm">Please verify the distributor email or contact your distributor.</p>
          </div>
        ) : null}

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Distributor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Note: Access to salesperson features is blocked until your distributor approves your request.
        </div>
      </div>
    </div>
  );
}
