import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ModerationRequest {
  title?: string;
  description?: string;
  action: 'check' | 'report';
  listingId?: string;
  reason?: string;
  reporterId?: string;
}

// Simple keyword-based content moderation
const INAPPROPRIATE_WORDS = [
  // Add inappropriate words in French and local languages
  'arnaque', 'fraude', 'scam', 'interdit', 'illégal', 'drogue',
];

const SUSPICIOUS_PATTERNS = [
  /virement.*urgent/i,
  /paiement.*avance/i,
  /western\s*union/i,
  /moneygram/i,
];

function moderateContent(text: string): { isAppropriate: boolean; flags: string[] } {
  const flags: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    if (lowerText.includes(word)) {
      flags.push(`Mot inapproprié: ${word}`);
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(`Pattern suspect détecté`);
    }
  }

  // Check for phone numbers that might be suspicious
  const phoneCount = (text.match(/\d{8,}/g) || []).length;
  if (phoneCount > 3) {
    flags.push('Trop de numéros de téléphone');
  }

  return {
    isAppropriate: flags.length === 0,
    flags
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ModerationRequest = await req.json();

    if (body.action === 'check') {
      // Check content for moderation
      const titleResult = body.title ? moderateContent(body.title) : { isAppropriate: true, flags: [] };
      const descResult = body.description ? moderateContent(body.description) : { isAppropriate: true, flags: [] };

      const allFlags = [...titleResult.flags, ...descResult.flags];
      const isAppropriate = titleResult.isAppropriate && descResult.isAppropriate;

      return new Response(
        JSON.stringify({
          isAppropriate,
          flags: allFlags,
          recommendation: isAppropriate ? 'approve' : 'review',
          message: isAppropriate
            ? 'Contenu validé automatiquement'
            : `Contenu nécessite une révision: ${allFlags.join(', ')}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === 'report' && body.listingId && body.reason && body.reporterId) {
      // Store report in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          listing_id: body.listingId,
          reporter_id: body.reporterId,
          reason: body.reason,
          status: 'pending'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create report: ${error}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Signalement envoyé avec succès'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non spécifiée' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Moderation error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});