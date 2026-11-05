import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const privateManifests = new Set(['aptitude','behavioural','companies','interview','development']);
/** Only data files in the existing server-side tracing paths may be restored. */
export function decodePrivateContent(bytes:Buffer,expectedHash:string):[string,string][] {
  if(!/^[a-f0-9]{64}$/.test(expectedHash)||bytes.length>2*1024*1024||createHash('sha256').update(bytes).digest('hex')!==expectedHash)throw new Error('Private content integrity check failed.');
  const data:unknown=JSON.parse(gunzipSync(bytes,{maxOutputLength:32*1024*1024}).toString('utf8'));
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid private content bundle.');
  const entries=Object.entries(data);
  if(!entries.length||entries.length>100)throw new Error('Invalid private content file count.');
  return entries.map(([path,value])=>{
    const company=/^content\/companies\/[a-z0-9-]+\.json$/.test(path);
    const manifest=path.match(/^content\/collections\/([a-z]+)\.manifest\.json$/);
    if(!company&&!(manifest&&privateManifests.has(manifest[1])))throw new Error('Unexpected private content path.');
    if(!value||typeof value!=='object')throw new Error('Invalid private content record.');
    return [path,JSON.stringify(value)];
  });
}

export async function restorePrivateContent(env:Record<string,string|undefined>=process.env) {
  const hash=env.PRIVATE_CONTENT_SHA256;
  if(!hash)return;
  const url=new URL(env.NEXT_PUBLIC_SUPABASE_URL??'');
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Private content storage is not configured.');
  const response=await fetch(new URL('/storage/v1/object/authenticated/fast-sprint-builds/'+hash+'.json.gz',url),{
    headers:{Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,apikey:env.SUPABASE_SERVICE_ROLE_KEY},
    redirect:'error',signal:AbortSignal.timeout(30000),
  });
  if(!response.ok)throw new Error('Private content download failed.');
  const reader=response.body?.getReader();if(!reader)throw new Error('Private content is empty.');
  const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw new Error('Private content is too large.');}chunks.push(value);}}finally{reader.releaseLock();}
  const files=decodePrivateContent(Buffer.concat(chunks),hash);
  for(const [path,contents] of files){const target=join(process.cwd(),path);await mkdir(dirname(target),{recursive:true});await writeFile(target,contents,{mode:0o600});}
  console.log(`Restored ${files.length} private content data files for server-side packaging.`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  restorePrivateContent().catch(()=>{console.error('Private build input failed. Check the configured bundle hash and storage access.');process.exitCode=1;});
}
