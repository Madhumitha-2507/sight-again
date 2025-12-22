import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Match {
  id: string;
  missing_person_id: string;
  confidence_score: number;
  frame_url: string | null;
  video_filename: string | null;
  location: string | null;
  detected_at: string;
  status: string;
  created_at: string;
  missing_person?: {
    name: string;
    age: number;
    image_url: string;
    description: string;
    last_seen_location: string;
    contact_info: string;
  };
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        missing_person:missing_persons(name, age, image_url, description, last_seen_location, contact_info)
      `)
      .order("detected_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
      setError(error);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const updateMatchStatus = async (matchId: string, status: string) => {
    const { error } = await supabase
      .from("matches")
      .update({ status })
      .eq("id", matchId);

    if (!error) {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status } : m))
      );
    }
    return error;
  };

  useEffect(() => {
    fetchMatches();

    // Subscribe to real-time matches
    const channel = supabase
      .channel("matches-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          const { data } = await supabase
            .from("matches")
            .select(`
              *,
              missing_person:missing_persons(name, age, image_url, description, last_seen_location, contact_info)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMatches((prev) => [data, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, loading, error, refetch: fetchMatches, updateMatchStatus };
}
