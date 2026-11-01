import json,re
from pathlib import Path
for key in ['dsa-200','dsa-neetcode150']:
 d=json.loads(Path('content/collections/'+key+'.json').read_text());groups={}
 for p in d['problems']:
  pattern=p['pattern'];groups.setdefault(pattern,[])
  video=p['video'];node={'slug':p['id'],'title':p['title'],'type':'problem','description':p['concept']+(' Original destination may require LeetCode Premium.' if p['externalAccess']=='may-require-LeetCode-Premium' else ''),'url':p['url'],'difficulty':p['difficulty'],'meta':{'source':p['source'],'pattern':pattern,'order':p['order'],'verification':p['verification'],'selectionRationale':p['selectionRationale'],'externalAccess':p['externalAccess']},'children':[]}
  if video:node['children'].append({'slug':'solution','title':video['educator']+' solution','type':'resource','url':video['url'],'meta':{'educator':video['educator'],'verification':p['verification']['videoHTTP']}})
  groups[pattern].append(node)
 root={'slug':key,'title':d['title'],'type':'subject','isPro':False,'meta':{'source':d['source'],'sourceCommit':d['sourceCommit'],'validationStatus':d['validationStatus']},'children':[{'slug':re.sub('[^a-z0-9]+','-',pattern.lower()).strip('-'),'title':pattern,'type':'section','children':nodes} for pattern,nodes in groups.items()]}
 Path('content/collections/'+key+'.manifest.json').write_text(json.dumps({'version':1,'root':root},indent=2)+'\n')
