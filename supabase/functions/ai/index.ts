import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, deepSearch, model } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the authorization header to authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the LOVABLE_API_KEY from environment (automatically provided)
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      console.error("LOVABLE_API_KEY not found in environment, please enable the AI gateway");
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user's organization to fetch relevant data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's organization
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userRoles) {
      throw new Error('No organization found for user');
    }

    const organizationId = userRoles.organization_id;

    // Fetch relevant CRM data for context
    const [leadsData, dealsData, contactsData, companiesData, tasksData, notesData] = await Promise.all([
      supabase.from('leads').select('*').eq('organization_id', organizationId).limit(50),
      supabase.from('deals').select('*').eq('organization_id', organizationId).limit(50),
      supabase.from('contacts').select('*').eq('organization_id', organizationId).limit(50),
      supabase.from('companies').select('*').eq('organization_id', organizationId).limit(50),
      supabase.from('tasks').select('*').eq('organization_id', organizationId).limit(50),
      supabase.from('notes').select('*').eq('organization_id', organizationId).limit(50)
    ]);

    // Prepare context data for AI
    const contextData = {
      leads: leadsData.data || [],
      deals: dealsData.data || [],
      contacts: contactsData.data || [],
      companies: companiesData.data || [],
      tasks: tasksData.data || [],
      notes: notesData.data || []
    };

    // Call the Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
				
				model: model || "google/gemini-2.5-flash",
				
        messages: [
					
          {
            role: "system",
            content: deepSearch 
              ? `You are an advanced AI assistant with enhanced research capabilities and access to the user's CRM Template data. Current data summary:
                - ${contextData.leads.length} leads
                - ${contextData.deals.length} deals  
                - ${contextData.contacts.length} contacts
                - ${contextData.companies.length} companies
                - ${contextData.tasks.length} tasks
                - ${contextData.notes.length} notes
                
                When responding: 1) Provide comprehensive, well-researched answers 2) Consider multiple perspectives and sources of information 3) Break down complex topics into understandable components 4) Cite relevant examples and use cases 5) Offer actionable insights and recommendations. Be thorough but concise, and always aim for accuracy and depth. Format your responses using markdown for better readability - use headers, lists, code blocks, tables, and emphasis where appropriate.`
              : `You are a helpful AI assistant integrated into CRM Template with access to the user's actual CRM data.

                CURRENT CRM DATA SUMMARY:
                - Leads: ${contextData.leads.length} total leads
                - Deals: ${contextData.deals.length} total deals  
                - Contacts: ${contextData.contacts.length} total contacts
                - Companies: ${contextData.companies.length} total companies
                - Tasks: ${contextData.tasks.length} total tasks
                - Notes: ${contextData.notes.length} total notes

                You can analyze and provide insights about:
                - Lead quality and scoring
                - Deal pipeline status and forecasting
                - Contact relationship management
                - Company performance metrics
                - Sales trends and opportunities
                - Task management and productivity
                - Note insights and organization

                When users ask about specific data, analyze the provided information and give actionable insights.
                Format your responses using markdown for better readability with bullet points, headers, and tables when appropriate.`,
          },
					
          {
            role: "user",
            content: deepSearch 
              ? message 
              : `User question: ${message}\n\nCRM Data Context:\n${JSON.stringify(contextData, null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", await response.text());
			if (response.status === 429) {
				console.error("Rate limit exceeded");
				return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
					status: 429,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      console.error("No response from AI", data);
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ response: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI call:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
