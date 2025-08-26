import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SalesRequests() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["distributor", "sales-requests"],
    queryFn: () => api.distributor.salesRequests(),
  });
  const { data: members, isLoading: loadingMembers, error: membersError } = useQuery({
    queryKey: ["distributor", "salespersons"],
    queryFn: () => api.distributor.salespersons(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.distributor.approveSalesRequest(id),
    onSuccess: () => {
      toast.success("Request approved");
      qc.invalidateQueries({ queryKey: ["distributor", "sales-requests"] });
      qc.invalidateQueries({ queryKey: ["distributor", "salespersons"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to approve"),
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.distributor.rejectSalesRequest(id),
    onSuccess: () => {
      toast.success("Request rejected");
      qc.invalidateQueries({ queryKey: ["distributor", "sales-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reject"),
  });
  const unlink = useMutation({
    mutationFn: (salespersonId: string) => api.distributor.unlinkSalesperson(salespersonId),
    onSuccess: () => {
      toast.success("Salesperson unlinked");
      qc.invalidateQueries({ queryKey: ["distributor", "salespersons"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to unlink"),
  });

  const requests = data?.requests || [];
  const salespersons = members?.salespersons || [];

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Salesperson Link Requests</CardTitle>
          <CardDescription>Review and approve/reject salesperson linking requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-600 text-sm">{(error as Error).message}</p>}
          {!isLoading && requests.length === 0 && (
            <p className="text-sm text-muted-foreground">No requests</p>
          )}
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between border rounded p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Request #{r.id}</div>
                  <div className="text-xs text-muted-foreground">Salesperson ID: {r.salespersonId}</div>
                  <div className="text-xs">Status: <span className="font-medium">{r.status}</span></div>
                  <div className="text-xs text-muted-foreground">Updated: {new Date(r.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={approve.isPending || reject.isPending || r.status === 'approved'} onClick={() => approve.mutate(r.id)}>Approve</Button>
                  <Button variant="destructive" disabled={approve.isPending || reject.isPending || r.status === 'rejected'} onClick={() => reject.mutate(r.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="h-6" />
      <Card>
        <CardHeader>
          <CardTitle>Linked Salespersons</CardTitle>
          <CardDescription>Current members linked to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers && <p>Loading...</p>}
          {membersError && <p className="text-red-600 text-sm">{(membersError as Error).message}</p>}
          {!loadingMembers && salespersons.length === 0 && (
            <p className="text-sm text-muted-foreground">No linked salespersons</p>
          )}
          <div className="space-y-3">
            {salespersons.map((s: any) => (
              <div key={s.salespersonId} className="flex items-center justify-between border rounded p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{s?.salesperson?.name || 'Salesperson'}</div>
                  <div className="text-xs text-muted-foreground">{s?.salesperson?.email || s.salespersonId}</div>
                  <div className="text-xs text-muted-foreground">Linked: {new Date(s.updatedAt).toLocaleString()}</div>
                </div>
                <div>
                  <Button variant="destructive" disabled={unlink.isPending} onClick={() => unlink.mutate(s.salespersonId)}>Unlink</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
