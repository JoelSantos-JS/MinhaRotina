// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SuggestionPayload = {
  category?: string;
  title?: string;
  message?: string;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function clean(input: unknown): string {
  return String(input ?? '').trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function validatePayload(payload: SuggestionPayload): string | null {
  const category = clean(payload.category);
  const title = clean(payload.title);
  const message = clean(payload.message);

  if (!category) return 'Categoria obrigatoria.';
  if (title.length < 4 || title.length > 120) return 'Titulo invalido.';
  if (message.length < 20 || message.length > 2000) return 'Mensagem invalida.';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Metodo nao permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const ownerEmail = Deno.env.get('SUGGESTIONS_OWNER_EMAIL');
  const fromEmail = Deno.env.get('SUGGESTIONS_FROM_EMAIL');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { ok: false, error: 'Configuracao incompleta da funcao.' });
  }

  if (!resendApiKey || !ownerEmail || !fromEmail) {
    return json(503, { ok: false, error: 'Canal de sugestoes temporariamente indisponivel.' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { ok: false, error: 'Nao autenticado.' });

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) return json(401, { ok: false, error: 'Sessao invalida.' });

  let payload: SuggestionPayload;
  try {
    payload = (await req.json()) as SuggestionPayload;
  } catch {
    return json(400, { ok: false, error: 'Payload invalido.' });
  }

  const validationError = validatePayload(payload);
  if (validationError) return json(400, { ok: false, error: validationError });

  const category = clean(payload.category);
  const title = clean(payload.title);
  const message = clean(payload.message);

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: parent } = await adminClient
    .from('parent_accounts')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle();

  const parentName = clean(parent?.name || user.user_metadata?.name || 'Responsavel');
  const parentEmail = clean(parent?.email || user.email || '');

  const { data: inserted, error: insertError } = await adminClient
    .from('parent_suggestions')
    .insert({
      parent_id: user.id,
      category,
      title,
      message,
    })
    .select('id')
    .single();

  if (insertError) {
    return json(500, { ok: false, error: 'Falha ao registrar sugestao.' });
  }

  const safeCategory = escapeHtml(category);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br/>');
  const safeParentName = escapeHtml(parentName);
  const safeParentEmail = escapeHtml(parentEmail || '(email nao informado)');
  const safeSuggestionId = escapeHtml(inserted.id);

  const emailHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#2B2C41;line-height:1.5;">
      <h2 style="margin:0 0 12px 0;">Nova sugestao de melhoria</h2>
      <p style="margin:0 0 8px 0;"><strong>ID:</strong> ${safeSuggestionId}</p>
      <p style="margin:0 0 8px 0;"><strong>Categoria:</strong> ${safeCategory}</p>
      <p style="margin:0 0 8px 0;"><strong>Titulo:</strong> ${safeTitle}</p>
      <p style="margin:0 0 8px 0;"><strong>Responsavel:</strong> ${safeParentName}</p>
      <p style="margin:0 0 16px 0;"><strong>Email da conta:</strong> ${safeParentEmail}</p>
      <div style="padding:12px;border:1px solid #D2EBFF;border-radius:8px;background:#F8FCFF;">
        ${safeMessage}
      </div>
    </div>
  `.trim();

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [ownerEmail],
      subject: `[Minha Rotina][${category}] ${title}`,
      html: emailHtml,
    }),
  });

  if (!emailResponse.ok) {
    return json(502, {
      ok: false,
      error: 'Sugestao registrada, mas houve falha ao enviar notificacao por email.',
    });
  }

  return json(200, { ok: true, suggestionId: inserted.id });
});
