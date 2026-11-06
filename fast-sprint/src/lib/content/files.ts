import {existsSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {LIBRARY} from '@/config/library';
import {planManifest,type ImportRow} from './manifest';
export const manifestRoots=['dsa-200','dsa-a2z','dsa-neetcode150','dbms','sql','os','cn','oop','aptitude','behavioural','interview','development','companies'];
const cache=new Map<string,{mtime:number;rows:ImportRow[]}>();
export function manifestPlan(root:string,isPro:boolean){
 if(!manifestRoots.includes(root))throw Error('Unknown collection.');
 if(LIBRARY.some(c=>c.slug===root&&c.pro)&&!isPro)throw Error('Pro access is required.');
 const file=join(process.cwd(),'content/collections',root+'.manifest.json');if(!existsSync(file))throw Error('Collection unavailable.');
 const mtime=statSync(file).mtimeMs,old=cache.get(root);if(old?.mtime===mtime){if(!isPro&&old.rows.some(r=>r.is_pro))throw Error('Pro access is required.');return old.rows;}
 const rows=planManifest(JSON.parse(readFileSync(file,'utf8')));if(rows.some(r=>r.is_pro)&&!isPro)throw Error('Pro access is required.');cache.set(root,{mtime,rows});return rows;
}
export function manifestLeaves(root:string,isPro:boolean){const rows=manifestPlan(root,isPro),parents=new Set(rows.filter(r=>r.item_type!=='resource').map(r=>r.parentPath));return rows.filter(r=>r.item_type!=='resource'&&!parents.has(r.path));}
