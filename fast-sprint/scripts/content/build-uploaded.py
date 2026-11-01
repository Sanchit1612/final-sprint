"""Preserve uploaded material; create offline manifests only. No database access."""
import json,re,hashlib,collections
from pathlib import Path
out=Path('content/collections');src=Path('backups/resource-inspection/resources')
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
def norm(s):return re.sub('[^a-z0-9]','',s.lower())
source=json.loads(Path('content/sources/neetcode/problems.json').read_text());matches=collections.defaultdict(list)
for p in source:matches[norm(p['problem'])].append(p)
aliases=json.loads(Path('content/sources/a2z-aliases.json').read_text())['mappings']; byid={int(p['code'].split('-')[0]):p for p in source}
rows=json.loads(Path('backups/resource-inspection/analysis/workbook-extraction.json').read_text())[-1]['rows']
steps=[];entry_count=0;mapped=0
for row in rows:
 title=next((v for k,v in row.items() if k.startswith('B')),None)
 if title and title.startswith('Step '):steps.append({'slug':'step-'+str(len(steps)+1),'title':title,'type':'section','children':[]})
 numbered=next((int(v) for k,v in row.items() if k.startswith('A') and v.isdigit()),None)
 if numbered and title:
  entry_count+=1;ps=matches[norm(title)];p=ps[0] if len(ps)==1 else byid.get(aliases.get(str(numbered)))
  node={'slug':f'entry-{numbered:03d}','title':title,'type':'problem','meta':{'originalNumber':numbered,'originalCells':list(row),'source':'Uploaded Striver A2Z DSA Sheet.xlsx','mappingStatus':('exact-normalized-title-match' if len(ps)==1 else 'explicit-alias-candidate-needs-final-review') if p else 'unresolved','originalStep':steps[-1]['title'],'verification':'candidate mapping pending semantic review' if p else 'unresolved-no-url'}}
  if p:
   mapped+=1;node['description']='Candidate source match: '+p['problem']+'. Final semantic review is pending; original workbook title is preserved.';node['url']='https://leetcode.com/problems/'+p['link'];node['difficulty']=p['difficulty'].lower();node['meta']['mappingSource']='neetcode-gh/leetcode@8fed5f7daa6a517e375a0562d876e4a72dfdafb8';node['children']=[{'slug':'solution','type':'resource','title':'NeetCode solution','url':'https://www.youtube.com/watch?v='+p['video'],'meta':{'educator':'NeetCode','verification':'publisher-source-mapped'}}] if p.get('video') else []
  steps[-1]['children'].append(node)
assert len(steps)==18 and entry_count==455
(out/'dsa-a2z.manifest.json').write_text(json.dumps({'version':1,'root':{'slug':'dsa-a2z','title':'Striver A2Z','type':'subject','isPro':False,'meta':{'sourceSHA256':'65c164dcf84cc070877075e7a03614b454c068d3abe36b17815aad0839b69e00','sourceEntryCount':455},'children':steps}},indent=2)+'\n')
core=[]
for name,key in [('operating-systems.json','os'),('computer-networks.json','cn'),('oops-cpp.json','oop')]:
 d=json.loads((src/'fast-sprint-gfg-topic-links'/name).read_text());groups=[]
 group_counts=collections.Counter()
 for gi,g in enumerate(d['groups']):
  ts=[]; topic_counts=collections.Counter()
  for ti,t in enumerate(g['topics']):
   ts_slug=slug(t['title']);topic_counts[ts_slug]+=1
   ts.append({'slug':ts_slug+('-'+str(topic_counts[ts_slug]) if topic_counts[ts_slug]>1 else ''),'title':t['title'],'type':'topic','children':[{'slug':'article','title':t['title']+' — GeeksforGeeks','type':'resource','url':t['url'],'meta':{'kind':'article','source':d['source_url'],'verification':'supplied-unverified'}}]})
  gslug=slug(g['title']);group_counts[gslug]+=1
  groups.append({'slug':gslug+('-'+str(group_counts[gslug]) if group_counts[gslug]>1 else ''),'title':g['title'],'type':'section','description':g.get('description',''),'children':ts})
 manifest={'version':1,'root':{'slug':key,'title':d['subject'],'type':'subject','isPro':False,'meta':{'source':d['source_url']},'children':groups}}
 (out/(key+'.manifest.json')).write_text(json.dumps(manifest,indent=2)+'\n');core.append({'subject':key,'groups':len(groups),'topics':sum(len(g['children']) for g in groups)})
Path('verification/uploaded-content-coverage.json').write_text(json.dumps({'a2z':{'steps':18,'entries':455,'sourceBackedCandidates':mapped,'unresolved':455-mapped,'mappingMethod':'exact titles or explicit alias candidates; final semantic confirmation still required'},'core':core},indent=2)+'\n')
print('A2Z',entry_count,'mapped',mapped,'unresolved',455-mapped);print(core)
