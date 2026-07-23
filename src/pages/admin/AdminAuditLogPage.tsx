import { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, Eye, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SlideUp } from "@/components/public/Motion";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function AdminAuditLogPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtering
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  
  // Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("audit-logs-sync")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        // Only auto-fetch if we are on the first page, otherwise it might be disruptive
        if (page === 0) fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" });
      
      if (actionFilter !== "all") query = query.ilike("action", `%${actionFilter}%`);
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (error) throw error;
      setLogs(data as AuditLog[]);
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load audit logs", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (log.entity_type && log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.entity_id && log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">System Audit Logs</h1>
        <p className="text-xs text-muted-foreground font-sans">Review and track all admin actions and system events.</p>
      </div>

      <SlideUp className="bg-card border border-border/60 rounded-xl shadow-sm flex flex-col h-[75vh] overflow-hidden">
        <div className="p-3 border-b border-border/60 bg-muted/10">
          <div className="flex flex-col lg:flex-row gap-2.5 items-start lg:items-center justify-between">
            <div className="flex flex-1 gap-2.5 items-center w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs on this page..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11 text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  className="h-11 rounded-md border bg-background px-3 text-base font-semibold"
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                >
                  <option value="all">All Actions</option>
                  <option value="create">Creates</option>
                  <option value="update">Updates</option>
                  <option value="delete">Deletions</option>
                  <option value="approve">Approvals</option>
                  <option value="login">Logins</option>
                </select>
                <select 
                  className="h-11 rounded-md border bg-background px-3 text-base font-semibold"
                  value={entityFilter}
                  onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                >
                  <option value="all">All Tables</option>
                  <option value="profiles">Users & Roles</option>
                  <option value="accounts">Bank Accounts</option>
                  <option value="transactions">Transactions</option>
                  <option value="cards">Cards</option>
                  <option value="payment_sessions">Payment Sessions</option>
                  <option value="loans">Loans</option>
                  <option value="investment_orders">Investments</option>
                  <option value="cms_site_settings">Settings</option>
                  <option value="auth">Auth Events</option>
                </select>
              </div>
            </div>
            
            {/* Server Pagination Controls */}
            <div className="flex items-center gap-4 shrink-0 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> {totalCount.toLocaleString()} Total Events</span>
              <div className="flex items-center gap-1 bg-background border rounded-lg overflow-hidden">
                <button 
                  onClick={() => setPage(Math.max(0, page - 1))} 
                  disabled={page === 0}
                  className="p-1.5 hover:bg-muted disabled:opacity-50 transition-colors"
                ><ChevronLeft className="h-4 w-4" /></button>
                <span className="px-3 border-x font-bold">Page {page + 1}</span>
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={(page + 1) * PAGE_SIZE >= totalCount}
                  className="p-1.5 hover:bg-muted disabled:opacity-50 transition-colors"
                ><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor (User ID)</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Entity Table</th>
                <th className="px-6 py-3">Entity ID</th>
                <th className="px-6 py-3 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  Loading audit logs...
                </td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-semibold">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  No events found matching your current filters.
                </td></tr>
              ) : (
                filteredLogs.map(log => {
                  const isDbTrigger = log.user_id?.startsWith("db_trigger_");
                  
                  return (
                    <tr key={log.id} className={`transition-colors ${isDbTrigger ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/10"}`}>
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-muted-foreground font-semibold">
                        {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-6 py-3">
                        {isDbTrigger ? (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/20 border border-destructive/20 px-2 py-0.5 rounded-full flex w-max items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> System Trigger
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-primary bg-primary/5 px-2 py-1 rounded">
                            {log.user_id ? log.user_id.split('-')[0] + '...' : 'System'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold px-2 py-1 bg-muted border rounded text-[10px] uppercase tracking-wider text-foreground">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] font-bold text-muted-foreground uppercase">{log.entity_type || 'SYSTEM_GLOBAL'}</td>
                      <td className="px-6 py-3 font-mono text-[10px] font-bold">{log.entity_id || '-'}</td>
                      <td className="px-6 py-3 text-center">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SlideUp>

      {/* JSON Payload Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Event Record
            </DialogTitle>
            <DialogDescription>
              Log Entry ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border text-sm">
                <div><span className="text-muted-foreground font-semibold text-xs block mb-1">Timestamp</span> <span className="font-bold">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground font-semibold text-xs block mb-1">Action Performed</span> <span className="font-bold uppercase text-primary">{selectedLog.action.replace(/_/g, ' ')}</span></div>
                <div><span className="text-muted-foreground font-semibold text-xs block mb-1">Actor (UUID)</span> <span className="font-mono text-xs font-bold">{selectedLog.user_id || "SYSTEM"}</span></div>
                <div><span className="text-muted-foreground font-semibold text-xs block mb-1">Target Entity</span> <span className="font-mono text-xs font-bold">{selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id.split('-')[0]})` : ""}</span></div>
              </div>

              <div>
                <span className="text-sm font-bold text-foreground mb-2 block">Log Payload (JSON)</span>
                <div className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-xl overflow-auto max-h-[400px] border shadow-inner">
                  <pre className="font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedLog.details || { message: "No supplementary payload recorded." }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
