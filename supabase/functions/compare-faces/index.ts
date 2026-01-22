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
              content: `You are an expert person recognition system specialized in identifying missing persons from surveillance footage in CROWDED scenes. Your task is to compare a reference photo and physical description of a missing person with a person detected from CCTV footage.

IMPORTANT: This system is designed for CROWDED environments. Even if the detected face is partially visible, at an angle, or in poor lighting, attempt to analyze and provide your best assessment.

DETAILED FACIAL FEATURE ANALYSIS (provide specific observations for each):
1. FACE SHAPE: Classify as oval, round, square, heart-shaped, oblong, diamond, or triangular. Note specific observations.
2. EYES: Analyze spacing (close-set, average, wide-set), shape (almond, round, hooded, monolid), eye color if visible.
3. NOSE: Analyze bridge (high, flat, average), tip shape (upturned, downturned, rounded, pointed), width (narrow, average, wide).
4. MOUTH: Analyze lip thickness (thin, medium, full), mouth width, cupid's bow definition.
5. FOREHEAD: Height (low, medium, high), width, hairline pattern (straight, widow's peak, receding).
6. JAWLINE: Shape (square, rounded, pointed, angular), chin prominence.
7. EARS: Size and position if visible.
8. DISTINCTIVE MARKS: Any moles, scars, birthmarks, dimples, freckles.

PHYSICAL APPEARANCE ANALYSIS:
1. BODY BUILD: Slim, average, athletic, stocky, heavy
2. HEIGHT: Estimate if reference available
3. HAIR: Color, length, style, texture
4. CLOTHING: Colors, patterns, type, layering
5. ACCESSORIES: Glasses, jewelry, hats, bags

MATCHING RULES FOR CROWDED SCENES:
1. Even partial face visibility should be analyzed - do not dismiss matches due to occlusion
2. Weight facial feature matching heavily (60% of confidence)
3. Physical attributes (40% of confidence) - build, height, hair, clothing
4. Be GENEROUS with potential matches - human review will verify
5. Lower threshold is acceptable - it's better to flag for review than miss someone
6. Note the QUALITY of the match (how visible/clear the features were)

Respond with ONLY a JSON object (no markdown):
{
  "is_match": boolean,
  "confidence": number 0-100,
  "face_similarity": number 0-100,
  "appearance_match": number 0-100,
  "match_quality": "high" | "medium" | "low",
  "facial_features": {
    "face_shape": {"match": boolean, "reference": "description", "detected": "description", "confidence": number},
    "eyes": {"match": boolean, "reference": "description", "detected": "description", "confidence": number},
    "nose": {"match": boolean, "reference": "description", "detected": "description", "confidence": number},
    "mouth": {"match": boolean, "reference": "description", "detected": "description", "confidence": number},
    "jawline": {"match": boolean, "reference": "description", "detected": "description", "confidence": number},
    "distinctive_marks": {"match": boolean, "reference": "description", "detected": "description", "confidence": number}
  },
  "physical_attributes": {
    "build": {"match": boolean, "reference": "description", "detected": "description"},
    "hair": {"match": boolean, "reference": "description", "detected": "description"},
    "clothing": {"match": boolean, "reference": "description", "detected": "description"},
    "height": {"match": boolean, "reference": "description", "detected": "description"}
  },
  "reasoning": "detailed explanation of the match decision",
  "visibility_notes": "notes about image quality, occlusions, angles that affected analysis"
}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Compare these two images carefully. The first is a reference photo of a missing person named ${person.name}, age ${person.age}.${appearanceContext}

The second is a face extracted from CCTV footage in a potentially crowded scene. Analyze EVERY visible facial feature and physical attribute to determine if this could be the same person.

Note: This is face ${faceIndex || 1} of ${totalFaces || 1} detected in this video frame.`,
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

            // Prepare detailed analysis for storage
            const analysisDetails = {
              facial_features: analysisResult.facial_features || {},
              physical_attributes: analysisResult.physical_attributes || {},
              match_quality: analysisResult.match_quality || "medium",
              visibility_notes: analysisResult.visibility_notes || "",
              face_index: faceIndex || 1,
              total_faces_in_frame: totalFaces || 1,
            };

            // Create match record with detailed analysis
            const { data: matchData, error: matchError } = await supabase
              .from("matches")
              .insert({
                missing_person_id: person.id,
                confidence_score: analysisResult.confidence,
                face_similarity: analysisResult.face_similarity || null,
                appearance_match: analysisResult.appearance_match || null,
                analysis_details: analysisDetails,
                reasoning: analysisResult.reasoning || "",
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

            // Create alert with detailed message
            const alertMessage = `🚨 Potential match detected for ${person.name} with ${analysisResult.confidence}% confidence.\n\n` +
              `📊 Face Similarity: ${analysisResult.face_similarity}%\n` +
              `👤 Appearance Match: ${analysisResult.appearance_match}%\n` +
              `📝 ${analysisResult.reasoning}`;

            const { error: alertError } = await supabase.from("alerts").insert({
              match_id: matchData.id,
              missing_person_id: person.id,
              alert_type: analysisResult.confidence >= 70 ? "high_priority_match" : "potential_match",
              message: alertMessage,
            });

            if (alertError) {
              console.error("Error creating alert:", alertError);
            }

            matches.push({
              person,
              match: matchData,
              confidence: analysisResult.confidence,
              face_similarity: analysisResult.face_similarity,
              appearance_match: analysisResult.appearance_match,
              analysis_details: analysisDetails,
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