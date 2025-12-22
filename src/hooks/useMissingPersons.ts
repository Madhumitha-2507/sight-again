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

  useEffect(() => {
    fetchMissingPersons();
  }, []);

  return { missingPersons, loading, error, refetch: fetchMissingPersons };
}
