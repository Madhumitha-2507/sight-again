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

    const { videoFrameBase64, videoFilename, location } = await req.json();

    console.log("Received request to compare faces from video:", videoFilename);

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

    console.log(`Comparing against ${missingPersons.length} missing persons`);

    const matches = [];

    for (const person of missingPersons) {
      console.log(`Analyzing frame against missing person: ${person.name}`);

      // Use AI to compare the video frame with the missing person's image
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert face recognition system. Your task is to compare two images and determine if they show the same person. 
              
              Analyze facial features carefully including:
              - Face shape and structure
              - Eye shape, color, and spacing
              - Nose shape and size
              - Mouth and lip shape
              - Ear shape (if visible)
              - Hair style and color
              - Any distinctive features like moles, scars, or birthmarks
              
              Respond with a JSON object containing:
              - "is_match": boolean (true if likely the same person)
              - "confidence": number between 0 and 100
              - "reasoning": brief explanation of your analysis
              
              Be conservative in matching - only return high confidence for clear matches.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Compare these two images. The first is a missing person named ${person.name}, age ${person.age}. The second is a frame from CCTV footage. Determine if they could be the same person.`,
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
        const errorText = await response.text();
        console.error(`AI API error for ${person.name}:`, response.status, errorText);
        continue;
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content;

      console.log(`AI response for ${person.name}:`, content);

      try {
        // Parse the AI response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisResult = JSON.parse(jsonMatch[0]);

          if (analysisResult.is_match && analysisResult.confidence >= 60) {
            console.log(`Match found for ${person.name} with confidence ${analysisResult.confidence}%`);

            // Create match record
            const { data: matchData, error: matchError } = await supabase
              .from("matches")
              .insert({
                missing_person_id: person.id,
                confidence_score: analysisResult.confidence,
                video_filename: videoFilename,
                location: location || "Unknown",
                status: analysisResult.confidence >= 80 ? "high_priority" : "pending",
              })
              .select()
              .single();

            if (matchError) {
              console.error("Error creating match:", matchError);
              continue;
            }

            // Create alert
            const { error: alertError } = await supabase.from("alerts").insert({
              match_id: matchData.id,
              missing_person_id: person.id,
              alert_type: analysisResult.confidence >= 80 ? "high_priority_match" : "potential_match",
              message: `Potential match detected for ${person.name} with ${analysisResult.confidence}% confidence. ${analysisResult.reasoning}`,
            });

            if (alertError) {
              console.error("Error creating alert:", alertError);
            }

            matches.push({
              person,
              match: matchData,
              confidence: analysisResult.confidence,
              reasoning: analysisResult.reasoning,
            });
          }
        }
      } catch (parseError) {
        console.error(`Error parsing AI response for ${person.name}:`, parseError);
      }
    }

    console.log(`Analysis complete. Found ${matches.length} potential matches.`);

    return new Response(
      JSON.stringify({
        message: `Analysis complete. Found ${matches.length} potential matches.`,
        matches,
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
