import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {decodePrivateContent,restorePrivateContent} from './restore-private-content';
const bundle=(data:unknown)=>{const bytes=gzipSync(JSON.stringify(data));return {bytes,hash:createHash('sha256').update(bytes).digest('hex')};};
it('accepts pinned JSON data only and rejects corrupted content',()=>{
  const {bytes,hash}=bundle({'content/companies/example.json':{problems:[]},'content/collections/aptitude.manifest.json':{title:'Example'}});
  expect(decodePrivateContent(bytes,hash)).toHaveLength(2);
  expect(()=>decodePrivateContent(Buffer.concat([bytes,Buffer.from('tampered')]),hash)).toThrow('integrity');
});
it.each(['../.env.local','content/companies/../../package.json','src/app/page.tsx','content/collections/dsa-master200.manifest.json','__proto__'])('rejects unexpected restore path %s',(path)=>{
  const {bytes,hash}=bundle({[path]:{value:'data'}});expect(()=>decodePrivateContent(bytes,hash)).toThrow('path');
});
it('allows public-clone builds without private storage configuration',async()=>{await expect(restorePrivateContent({})).resolves.toBeUndefined();});
