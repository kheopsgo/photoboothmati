import { supabase } from "@/integrations/supabase/client";

/** Charge l'image, la pivote de -90° (comme à l'écran) et renvoie un JPEG en data URL. */
async function toRotatedJpeg(src: string): Promise<string> {
  let objectUrl: string | null = null;
  let url = src;
  if (!src.startsWith("data:")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error("image inaccessible");
    objectUrl = URL.createObjectURL(await res.blob());
    url = objectUrl;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("image illisible"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Met la photo en ligne et renvoie un lien accessible depuis n'importe quel réseau. */
export async function uploadPhotoOnline(src: string): Promise<string> {
  const image = await toRotatedJpeg(src);
  const { data, error } = await supabase.functions.invoke("share-photo", { body: { image } });
  if (error || !data?.url) throw new Error(error?.message || data?.error || "envoi impossible");
  return data.url as string;
}
