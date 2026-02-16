import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { videoFrameBase64, videoFilename, location, faceIndex, totalFaces } = await req.json();

    console.log(`Received request to compare face ${faceIndex || 1}/${totalFaces || 1} from video:`, videoFilename);

    // Get all active missing persons
    const { data: missingPersons, error: fetchError } = await supabase
      .from("missing_persons")
      .select("*")
      .eq("status", "active");

    if (fetchError) {
      console.error("Error fetching missing persons:", fetchError);
      throw fetchError;
    }

    if (!missingPersons || missingPersons.length === 0) {
      console.log("No active missing persons to compare against");
      return new Response(
        JSON.stringify({ message: "No active missing persons to compare", matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Comparing face against ${missingPersons.length} missing persons`);

    const matches = [];

    // Process all missing persons in PARALLEL for speed
    const results = await Promise.allSettled(missingPersons.map(async (person) => {
      console.log(`Analyzing frame against missing person: ${person.name}`);

      const appearanceDetails = [];
      if (person.height_cm) appearanceDetails.push(`Height: approximately ${person.height_cm}cm`);
      if (person.build) appearanceDetails.push(`Build: ${person.build}`);
      if (person.hair_color) appearanceDetails.push(`Hair color: ${person.hair_color}`);
      if (person.clothing_description) appearanceDetails.push(`Last known clothing: ${person.clothing_description}`);
      if (person.distinctive_features) appearanceDetails.push(`Distinctive features: ${person.distinctive_features}`);
      
      const appearanceContext = appearanceDetails.length > 0 
        ? `\n\nKnown physical attributes:\n${appearanceDetails.join('\n')}`
        : '';

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a person recognition system. Compare a reference photo of a missing person with a face from CCTV footage. Respond with ONLY a JSON object:
{
  "is_match": boolean,
  "confidence": number 0-100,
  "face_similarity": number 0-100,
  "appearance_match": number 0-100,
  "reasoning": "brief explanation"
}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Compare these images. First: missing person ${person.name}, age ${person.age}.${appearanceContext} Second: face from CCTV. Are they the same person?`,
                },
                {
                  type: "image_url",
                  image_url: { url: person.image_url },
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${videoFrameBase64}` },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`AI API error for ${person.name}:`, response.status);
        return null;
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);

          if (analysisResult.is_match && analysisResult.confidence >= 40) {
            console.log(`Match found for ${person.name} with confidence ${analysisResult.confidence}%`);

            const { data: matchData, error: matchError } = await supabase
              .from("matches")
              .insert({
                missing_person_id: person.id,
                confidence_score: analysisResult.confidence,
                face_similarity: analysisResult.face_similarity || null,
                appearance_match: analysisResult.appearance_match || null,
                reasoning: analysisResult.reasoning || "",
                video_filename: videoFilename,
                location: location || "Unknown",
                status: analysisResult.confidence >= 70 ? "high_priority" : "pending",
              })
              .select()
              .single();

            if (matchError) {
              console.error("Error creating match:", matchError);
              return null;
            }

            await supabase.from("alerts").insert({
              match_id: matchData.id,
              missing_person_id: person.id,
              alert_type: analysisResult.confidence >= 70 ? "high_priority_match" : "potential_match",
              message: `Potential match for ${person.name} - ${analysisResult.confidence}% confidence`,
            });

            return {
              person,
              match: matchData,
              confidence: analysisResult.confidence,
              face_similarity: analysisResult.face_similarity,
              appearance_match: analysisResult.appearance_match,
              reasoning: analysisResult.reasoning,
            };
          }
        }
      } catch (parseError) {
        console.error(`Error parsing AI response for ${person.name}:`, parseError);
      }
      return null;
    }));

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        matches.push(result.value);
      }
    }

    console.log(`Analysis complete. Found ${matches.length} potential matches.`);

    return new Response(
      JSON.stringify({
        message: `Analysis complete. Found ${matches.length} potential matches.`,
        matches,
        facesAnalyzed: faceIndex || 1,
        totalFaces: totalFaces || 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in compare-faces function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});