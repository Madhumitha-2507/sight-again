import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Alert {
  id: string;
  match_id: string;
  missing_person_id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  missing_person?: {
    name: string;
    image_url: string;
  };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select(`
        *,
        missing_person:missing_persons(name, image_url)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching alerts:", error);
      return;
    }

    setAlerts(data || []);
    setUnreadCount(data?.filter((a) => !a.is_read).length || 0);
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("is_read", false);

    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time alerts
    const channel = supabase
      .channel("alerts-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        async (payload) => {
          console.log("New alert received:", payload);

          // Fetch the full alert with related data
          const { data } = await supabase
            .from("alerts")
            .select(`
              *,
              missing_person:missing_persons(name, image_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setAlerts((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast notification
            toast({
              title: "🚨 New Alert!",
              description: data.message,
              variant: data.alert_type === "high_priority_match" ? "destructive" : "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { alerts, unreadCount, markAsRead, markAllAsRead, refetch: fetchAlerts };
}
