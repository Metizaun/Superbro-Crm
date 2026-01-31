import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, contentType, context, crmData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user info from authorization header
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Create content type specific system prompts
    const systemPrompts: Record<string, string> = {
      linkedin: `You are an expert LinkedIn content composer. Generate professional, engaging LinkedIn messages and sequences with HTML markup for formatting. Your output should:
        - Sound natural and conversational
        - Be personalized based on provided context
        - Follow LinkedIn best practices
        - Include clear call-to-actions
        - Maintain professional tone
        - Be optimized for engagement
        - Use HTML tags like <p>, <strong>, <em>, <br>, <ul>, <li> for proper formatting
        - Format names, companies, and key points with <strong> tags
        - Use line breaks <br> for better readability`,
      
      email: `You are an expert email marketing composer. Generate effective email sequences with HTML markup for formatting. Your output should:
        - Have compelling subject lines
        - Use personalization effectively
        - Follow email marketing best practices
        - Include clear value propositions
        - Have strong call-to-actions
        - Be mobile-friendly and scannable
        - Use HTML tags like <p>, <strong>, <em>, <br>, <ul>, <li>, <h3> for structure
        - Format subject lines with <strong> tags
        - Use bullet points <ul><li> for key benefits
        - Include proper paragraph breaks with <p> tags`,
      
      sms: `You are an expert SMS marketing composer. Generate concise, effective text messages with minimal HTML markup for formatting. Your output should:
        - Respect character limits (160-320 chars)
        - Be direct and action-oriented
        - Include clear value propositions
        - Use personalization appropriately
        - Follow SMS compliance best practices
        - Have clear call-to-actions
        - Use minimal HTML like <strong> for emphasis and <br> for line breaks only
        - Keep formatting simple due to character constraints`,
      
      custom: `You are an expert content composer. Generate high-quality content with HTML markup for formatting based on the specific requirements and context provided. Use appropriate HTML tags like <p>, <strong>, <em>, <br>, <ul>, <li>, <h3>, <h4> to structure and format the content for better readability and visual appeal.`
    };

    const systemPrompt = systemPrompts[contentType] || systemPrompts.custom;

    // Construct context-aware user message
    let contextualMessage = message;
    if (context) {
      contextualMessage += `\n\nContext: ${context}`;
    }
    if (crmData) {
      contextualMessage += `\n\nCRM Data: ${JSON.stringify(crmData)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextualMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    return new Response(JSON.stringify({ 
      content: generatedContent,
      contentType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Composer AI Error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || "Failed to generate content" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});