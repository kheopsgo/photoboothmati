import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 12 * 1024 * 1024;
const LINK_SECONDS = 60 * 60 * 24 * 30; // 30 jours

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { image } = await req.json();
    if (typeof image !== "string") return json({ error: "image manquante" }, 400);
    const m = image.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!m) return json({ error: "format invalide" }, 400);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bytes.length > MAX_BYTES) return json({ error: "image trop lourde" }, 413);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ext = m[1] === "png" ? "png" : "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("photos").upload(path, bytes, { contentType: `image/${m[1]}` });
    if (up.error) return json({ error: up.error.message }, 500);
    const signed = await supabase.storage.from("photos").createSignedUrl(path, LINK_SECONDS);
    if (signed.error) return json({ error: signed.error.message }, 500);
    return json({ url: signed.data.signedUrl });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
