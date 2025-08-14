const b64 = (s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const te = new TextEncoder(); const td = new TextDecoder();

async function getKey() {
  const raw = b64(Deno.env.get('ENCRYPTION_KEY')!); // 32 bytes base64
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt','decrypt']);
}

export async function seal(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const enc = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, te.encode(plain));
  return { iv: btoa(String.fromCharCode(...iv)), data: btoa(String.fromCharCode(...new Uint8Array(enc))) };
}

export async function open(cipher:{iv:string,data:string}) {
  const key = await getKey();
  const iv = b64(cipher.iv); const data = b64(cipher.data);
  const dec = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, data);
  return td.decode(dec);
}