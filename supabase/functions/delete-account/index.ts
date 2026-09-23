import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Authentication or server configuration is missing.' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const accessToken = authorization.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return jsonResponse({ error: 'The signed-in user could not be verified.' }, 401);
  }

  const userId = userData.user.id;
  const [{ data: profile, error: profileError }, { data: ownedObjects, error: objectsError }] = await Promise.all([
    supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle(),
    supabase.rpc('list_account_storage_paths', { account_user_id: userId }),
  ]);
  if (profileError || objectsError) {
    console.error('Could not load account assets for deletion:', profileError || objectsError);
    return jsonResponse({ error: 'Could not prepare account deletion.' }, 500);
  }

  if (profile?.avatar_url) {
    const { error } = await supabase
      .from('meals')
      .update({ user_avatar: null })
      .eq('user_avatar', profile.avatar_url);
    if (error) {
      console.error('Could not clear account avatar references:', error);
      return jsonResponse({ error: 'Could not clean up account references.' }, 500);
    }
  }

  const objectPaths = [...new Set(
    (ownedObjects || []).map((object) => object.object_path).filter(Boolean)
  )];

  for (let index = 0; index < objectPaths.length; index += 100) {
    const { error } = await supabase.storage
      .from('meal-photos')
      .remove(objectPaths.slice(index, index + 100));
    if (error) {
      console.error('Could not remove account media:', error);
      return jsonResponse({ error: 'Could not remove account media; account was not deleted.' }, 500);
    }
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Could not delete account:', deleteError);
    return jsonResponse({ error: 'Could not delete the account.' }, 500);
  }

  return jsonResponse({ success: true });
});
