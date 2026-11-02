"""Bounded read-only HTTP/title and video-metadata checks; no claims of playback correctness."""
import json,re,urllib.request,urllib.error,concurrent.futures,time
from pathlib import Path
from urllib.parse import urlencode
m=json.loads(Path('content/collections/dsa-a2z.manifest.json').read_text());urls=set()
for s in m['root']['children']:
 for n in s['children']:
  if n.get('url'):urls.add(n['url'])
  for c in n.get('children',[]):
   if c.get('url'):urls.add(c['url'])
old=json.loads(Path('verification/dsa-link-checks.json').read_text())
# Reuse recorded NeetCode/LeetCode evidence where the exact URL was already checked.
print('Previously checked evidence shape',type(old).__name__,flush=True)
cache={}
if isinstance(old,list):cache={x['url']:x for x in old if isinstance(x,dict) and 'url' in x}
elif isinstance(old,dict):
 for v in old.values():
  if isinstance(v,list):cache.update({x['url']:x for x in v if isinstance(x,dict) and 'url' in x})
report=Path('verification/a2z-link-checks.json');existing={}
if report.exists():existing={r['url']:r for r in json.loads(report.read_text()).get('checks',[])}
def check(u):
 if u in existing:return existing[u]
 if u in cache:return {**cache[u],'evidenceReused':True}
 requrl=u;video=('youtu.be/' in u or 'youtube.com/watch' in u)
 if video:requrl='https://www.youtube.com/oembed?'+urlencode({'url':u,'format':'json'})
 try:
  with urllib.request.urlopen(urllib.request.Request(requrl,headers={'User-Agent':'Mozilla/5.0'}),timeout=15) as r:
   b=r.read();result={'url':u,'status':r.status,'finalURL':r.url if not video else u,'scope':'video-oembed-not-playback' if video else 'HTTP-title-only'}
   if video:
    j=json.loads(b);result.update(title=j.get('title'),author=j.get('author_name'))
   else:
    title=re.search(r'<title[^>]*>(.*?)</title>',b.decode('utf8',errors='replace'),re.S|re.I);result['title']=title.group(1).strip() if title else None
   result['state']='reachable-metadata' if r.status==200 else 'unverified'
   return result
 except urllib.error.HTTPError as e:return {'url':u,'status':e.code,'state':'inconclusive-blocked' if e.code in (403,429) else 'unreachable-at-check','scope':'HTTP-only'}
 except Exception as e:return {'url':u,'status':None,'state':'inconclusive-error','errorType':type(e).__name__}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for i,r in enumerate(pool.map(check,sorted(urls))):
  results.append(r)
  if (i+1)%50==0:print('Checked',i+1,'/',len(urls),flush=True)
report.write_text(json.dumps({'checkedAt':'2026-11-02','scope':'HTTP/title or oEmbed metadata only; not exact variant correctness or playback audit','checks':results},indent=2)+'\n')
print('Total',len(results),'HTTP200',sum(r.get('status')==200 for r in results),'other',sum(r.get('status')!=200 for r in results),flush=True)
