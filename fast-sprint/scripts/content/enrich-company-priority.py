"""Offline enrichment from the preserved official LeetCode catalog; no refetch/import."""
import json
from pathlib import Path
proof={p['titleSlug']:p for p in json.loads(Path('backups/company-review/leetcode-access.json').read_text())}
master=json.loads(Path('content/collections/dsa-200.manifest.json').read_text());urls=set()
def walk(n):
 if n.get('url'):urls.add(n['url'].rstrip('/').split('/')[-1])
 for c in n.get('children',[]):walk(c)
walk(master['root'])
for p in Path('content/companies').glob('*.json'):
 if p.name=='index.json':continue
 c=json.loads(p.read_text())
 for row in c['problems']:
  source=proof[row['slug']];row['topics']=[t['slug'] for t in source.get('topicTags',[])];row['coreRelevance']=row['slug'] in urls
 c['problems']=[r for r in c['problems'] if r.get('topics')]
 p.write_text(json.dumps(c))
print('Enriched company bank with preserved publisher topic tags and Master 200 overlap.')

index_path=Path('content/companies/index.json')
index=json.loads(index_path.read_text())
for row in index: row['count']=len(json.loads(Path('content/companies',row['slug']+'.json').read_text())['problems'])
index_path.write_text(json.dumps(index))
