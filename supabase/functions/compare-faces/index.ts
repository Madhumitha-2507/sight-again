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

      // Build appearance context from database fields
      const appearanceDetails = [];
      if (person.height_cm) appearanceDetails.push(`Height: approximately ${person.height_cm}cm`);
      if (person.build) appearanceDetails.push(`Build: ${person.build}`);
      if (person.hair_color) appearanceDetails.push(`Hair color: ${person.hair_color}`);
      if (person.clothing_description) appearanceDetails.push(`Last known clothing: ${person.clothing_description}`);
      if (person.distinctive_features) appearanceDetails.push(`Distinctive features: ${person.distinctive_features}`);
      
      const appearanceContext = appearanceDetails.length > 0 
        ? `\n\nKnown physical attributes:\n${appearanceDetails.join('\n')}`
        : '';

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
              content: `You are an expert person recognition system specialized in identifying missing persons from surveillance footage. Your task is to compare a reference photo and physical description of a missing person with a person detected from CCTV footage.

IMPORTANT: Analyze BOTH facial features AND physical appearance attributes.

FACIAL FEATURES to analyze:
- Overall face SHAPE (oval, round, square, heart-shaped)
- Eye SPACING and general shape
- Nose STRUCTURE (bridge shape, tip shape)
- Mouth and lip PROPORTIONS
- Forehead HEIGHT and hairline pattern
- Jawline and chin SHAPE
- Any PERMANENT distinctive features (moles, scars, birthmarks)

PHYSICAL APPEARANCE to analyze:
- Body BUILD (slim, average, athletic, heavy)
- Approximate HEIGHT if reference available in frame
- HAIR COLOR and style
- CLOTHING colors and type (match against last known clothing)
- Any DISTINCTIVE FEATURES mentioned (glasses, tattoos, scars, etc.)

MATCHING RULES:
1. Face match alone with >60% confidence = potential match
2. Face match + 2 or more physical attributes matching = increase confidence by 15%
3. Clothing match + build match can indicate potential even with lower face confidence
4. DO NOT penalize for different lighting, angles, or image quality
5. Be GENEROUS - it's better to flag for human review than miss a person

Respond with ONLY a JSON object (no markdown):
{"is_match": boolean, "confidence": number 0-100, "face_similarity": number 0-100, "appearance_match": number 0-100, "reasoning": "brief explanation including what matched"}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Compare these two images. The first is a missing person named ${person.name}, age ${person.age}.${appearanceContext}\n\nThe second is a frame from CCTV footage. Determine if they could be the same person by analyzing BOTH facial features AND physical appearance.`,
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

          // Lower threshold to 40% to catch more potential matches for human review
          if (analysisResult.is_match && analysisResult.confidence >= 40) {
            console.log(`Match found for ${person.name} with confidence ${analysisResult.confidence}%`);

            // Create match record
            const { data: matchData, error: matchError } = await supabase
              .from("matches")
              .insert({
                missing_person_id: person.id,
                confidence_score: analysisResult.confidence,
                video_filename: videoFilename,
                location: location || "Unknown",
                status: analysisResult.confidence >= 70 ? "high_priority" : "pending",
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
              alert_type: analysisResult.confidence >= 70 ? "high_priority_match" : "potential_match",
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
