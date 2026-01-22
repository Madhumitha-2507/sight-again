import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playAlarmSound } from "@/utils/alarmSound";

export interface AnalysisDetails {
  facial_features?: {
    face_shape?: { match: boolean; reference: string; detected: string; confidence?: number };
    eyes?: { match: boolean; reference: string; detected: string; confidence?: number };
    nose?: { match: boolean; reference: string; detected: string; confidence?: number };
    mouth?: { match: boolean; reference: string; detected: string; confidence?: number };
    jawline?: { match: boolean; reference: string; detected: string; confidence?: number };
    distinctive_marks?: { match: boolean; reference: string; detected: string; confidence?: number };
  };
  physical_attributes?: {
    build?: { match: boolean; reference: string; detected: string };
    hair?: { match: boolean; reference: string; detected: string };
    clothing?: { match: boolean; reference: string; detected: string };
    height?: { match: boolean; reference: string; detected: string };
  };
  match_quality?: "high" | "medium" | "low";
  visibility_notes?: string;
  face_index?: number;
  total_faces_in_frame?: number;
}

export interface Match {
  id: string;
  missing_person_id: string;
  confidence_score: number;
  face_similarity?: number | null;
  appearance_match?: number | null;
  analysis_details?: AnalysisDetails | null;
  reasoning?: string | null;
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
        id,
        missing_person_id,
        confidence_score,
        face_similarity,
        appearance_match,
        analysis_details,
        reasoning,
        frame_url,
        video_filename,
        location,
        detected_at,
        status,
        created_at,
        missing_person:missing_persons(name, age, image_url, description, last_seen_location, contact_info)
      `)
      .order("detected_at", { ascending: false });

    if (error) {
      console.error("Error fetching matches:", error);
      setError(error);
    } else {
      // Cast data to Match[] since new columns may not be in types yet
      setMatches((data as unknown as Match[]) || []);
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
              id,
              missing_person_id,
              confidence_score,
              face_similarity,
              appearance_match,
              analysis_details,
              reasoning,
              frame_url,
              video_filename,
              location,
              detected_at,
              status,
              created_at,
              missing_person:missing_persons(name, age, image_url, description, last_seen_location, contact_info)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMatches((prev) => [(data as unknown as Match), ...prev]);
            // Play alarm sound when new match is detected
            playAlarmSound();
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
