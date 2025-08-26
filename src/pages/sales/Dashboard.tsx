import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SalespersonDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["salesperson", "link-status"],
    queryFn: () => api.salesperson.linkStatus(),
  });

  const [distributorEmail, setDistributorEmail] = useState("");

  const requestMut = useMutation({
    mutationFn: (email: string) => api.salesperson.requestLink(email),
    onSuccess: () => {
      toast.success("Request sent to distributor");
      setDistributorEmail("");
      qc.invalidateQueries({ queryKey: ["salesperson", "link-status"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to send request"),
  });

  const logoutMut = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      toast.success("Logged out");
      navigate("/login", { replace: true });
    },
    onError: (e: any) => toast.error(e?.message || "Logout failed"),
  });

  useEffect(() => {
    if (user?.role === "salesperson" && data?.status?.state === "unlinked") {
      navigate("/sales/link-distributor", { replace: true });
    }
  }, [user?.role, data?.status?.state, navigate]);

  const state = data?.status?.state || "unlinked";
  const distributorId = data?.status?.distributorId;

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sales Dashboard</CardTitle>
          <CardDescription>Your current link status and actions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          {error && (
            <div className="text-red-600 text-sm mb-3">{(error as Error).message}</div>
          )}

          {state === "unlinked" && (
            <div className="space-y-3">
              <p className="text-sm">You're not linked to any distributor yet.</p>
              <Button onClick={() => navigate("/sales/link-distributor")}>Link to Distributor</Button>
            </div>
          )}

          {state === "pending" && (
            <div className="space-y-4">
              <p className="text-sm">Your link request is pending distributor approval. You can wait, logout, or request another distributor.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()}>Refresh Status</Button>
                <Button variant="secondary" onClick={() => logoutMut.mutate()} disabled={logoutMut.isPending}>Logout</Button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Request another distributor</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="distributor@example.com"
                    type="email"
                    value={distributorEmail}
                    onChange={(e) => setDistributorEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => distributorEmail && requestMut.mutate(distributorEmail)}
                    disabled={requestMut.isPending || !distributorEmail}
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "rejected" && (
            <div className="space-y-4">
              <p className="text-sm">Your link request was rejected. You can try linking to a different distributor or logout.</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/sales/link-distributor")}>Start New Link</Button>
                <Button variant="secondary" onClick={() => logoutMut.mutate()} disabled={logoutMut.isPending}>Logout</Button>
                <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Request another distributor</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="distributor@example.com"
                    type="email"
                    value={distributorEmail}
                    onChange={(e) => setDistributorEmail(e.target.value)}
                  />
                  <Button
                    onClick={() => distributorEmail && requestMut.mutate(distributorEmail)}
                    disabled={requestMut.isPending || !distributorEmail}
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === "approved" && (
            <div className="space-y-4">
              <p className="text-sm">Linked to distributor: <span className="font-mono">{distributorId}</span></p>
              <div className="rounded border p-4">
                <p className="text-sm text-muted-foreground">Welcome! This is a placeholder dashboard for salesperson activities.</p>
                <p className="text-sm text-muted-foreground">Future: show assigned shops, orders pipeline, performance, etc.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
