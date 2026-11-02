"""Apply explicitly reviewed supplementary topic URLs; never changes source row identity."""
import json
from pathlib import Path
p=Path('content/collections/dsa-a2z.manifest.json');d=json.loads(p.read_text());mapping=json.loads(Path('content/sources/a2z-supplemental-mappings.json').read_text())['mappings']
for group in d['root']['children']:
 for n in group['children']:
  extra=mapping.get(str(n['meta']['originalNumber']))
  if not extra:continue
  n['url']=extra['urls'][0];n['description']='Original uploaded heading preserved. '+extra['note'];n['meta'].update(mappingStatus='supplemental-topic-mapped',mappingScope=extra['note'],verification='source URL located; HTTP/title check recorded separately')
  n['children']=[r for r in n.get('children',[]) if not r['slug'].startswith('supplement-')]+[{'slug':'supplement-'+str(i),'title':'Companion topic resource','type':'resource','url':u} for i,u in enumerate(extra['urls'][1:])]
p.write_text(json.dumps(d,indent=2)+'\n')
