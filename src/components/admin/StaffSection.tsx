import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCog } from "lucide-react";

type LogEntry = {
  id: string;
  staff_name: string;
  action: string;
  created_at: string;
};

const StaffSection = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200);
      setLogs((data || []) as LogEntry[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Staff Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">Staff accounts are managed through the authentication system. Below is the activity log tracking all staff actions.</p>
      </div>

      <div className="bg-background rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Activity Log ({logs.length})</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No activity recorded yet.</div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.staff_name}</TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSection;
