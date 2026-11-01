"""Bounded live probes. HTTP blocks/timeouts remain inconclusive, never 'verified'."""
import json,urllib.request,urllib.error,concurrent.futures,datetime,collections
from pathlib import Path
paths=list(Path('content/collections').glob('dsa-*.json'));docs={p:json.loads(p.read_text()) for p in paths};jobs={}
for d in docs.values():
 for p in d['problems']:
  jobs[p['url']]=p['url']
  if p['video']:jobs[p['video']['url']]='https://www.youtube.com/oembed?format=json&url='+urllib.parse.quote(p['video']['url'],safe='')
def check(pair):
 original,url=pair
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'FastSprintResourceAudit/1.0'})
  with urllib.request.urlopen(req,timeout=12) as r:
   text=r.read(350000).decode(errors='replace');v={'status':r.status,'finalURL':r.url,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
   if 'oembed' in url:
    x=json.loads(text);v.update(title=x.get('title'),author=x.get('author_name'),state='reachable-oembed')
   else:v.update(state='reachable',pageTitle=(text.split('<title>')[1].split('</title>')[0] if '<title>' in text else None))
 except urllib.error.HTTPError as e:v={'status':e.code,'state':'inconclusive-blocked' if e.code in [403,429] else 'http-error'}
 except Exception:v={'state':'inconclusive-network'}
 return original,v
results={}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for u,v in pool.map(check,jobs.items()):
  results[u]=v
  if len(results)%25==0:print('Checked',len(results),'of',len(jobs),flush=True)
Path('verification/dsa-link-checks.json').write_text(json.dumps(results,indent=2)+'\n')
for path,d in docs.items():
 for p in d['problems']:
  p['verification']['problemHTTP']=results[p['url']]
  if p['video']:p['verification']['videoHTTP']=results[p['video']['url']]
 path.write_text(json.dumps(d,indent=2)+'\n')
print(dict(collections.Counter(x['state'] for x in results.values())),flush=True)
