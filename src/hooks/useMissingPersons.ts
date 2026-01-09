import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  description: string;
  last_seen_location: string;
  contact_info: string;
  image_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  height_cm: number | null;
  build: string | null;
  hair_color: string | null;
  clothing_description: string | null;
  distinctive_features: string | null;
}

export function useMissingPersons() {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMissingPersons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("missing_persons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching missing persons:", error);
      setError(error);
    } else {
      setMissingPersons(data || []);
    }
    setLoading(false);
  };

  const deleteMissingPerson = async (id: string, imageUrl: string) => {
    // Extract file path from URL to delete from storage
    const urlParts = imageUrl.split("/person-images/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("person-images").remove([filePath]);
    }

    const { error } = await supabase
      .from("missing_persons")
      .delete()
      .eq("id", id);

    if (!error) {
      setMissingPersons((prev) => prev.filter((p) => p.id !== id));
    }
    return error;
  };

  useEffect(() => {
    fetchMissingPersons();
  }, []);

  return { missingPersons, loading, error, refetch: fetchMissingPersons, deleteMissingPerson };
}
