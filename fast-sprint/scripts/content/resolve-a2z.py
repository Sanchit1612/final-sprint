"""Preserve uploaded A2Z identities/order; apply explicit, publisher-backed link mappings.
Requires private downloaded publisher sheet source. No database writes; no fuzzy auto-acceptance.
"""
import json,re,collections,hashlib
from pathlib import Path
from urllib.parse import urlencode
source=Path('backups/a2z-primary-review/items.json')
items=json.loads(source.read_text());byid={x['id']:x for x in items};bynorm=collections.defaultdict(list)
def norm(s):return re.sub('[^a-z0-9]','',s.lower())
for r in items:bynorm[norm(r['label'])].append(r)
manual=json.loads(Path('content/sources/a2z-publisher-mappings.json').read_text())['mappings']
p=Path('content/collections/dsa-a2z.manifest.json');d=json.loads(p.read_text());evidence=[]
originals=[(s['slug'],n['slug'],n['title'],n['meta']['originalNumber']) for s in d['root']['children'] for n in s['children']]
for section in d['root']['children']:
 for n in section['children']:
  number=str(n['meta']['originalNumber']);matches=bynorm[norm(n['title'])]
  r=byid[manual[number]['publisherId']] if number in manual else matches[0] if len(matches)==1 else None
  if not r:continue
  blog=r.get('free_blog_link');redirect=r.get('redirectTo');route=None
  if isinstance(redirect,dict) and redirect.get('subjectSlug')=='strivers-a2z-dsa-sheet' and redirect.get('itemSlug'):
   if redirect['layoutType']=='practice':route='https://takeuforward.org/practice/dsa/'+redirect['itemSlug']+'?'+urlencode({'category':redirect['category'],'source':redirect['subjectSlug']})
   elif redirect['layoutType']=='learning':route='https://takeuforward.org/learning/dsa/'+redirect['itemSlug']+'?'+urlencode({'source':redirect['subjectSlug']})
  destination=('https://takeuforward.org'+blog) if blog else route
  if not destination:continue
  old=n.get('url');lc=r.get('leetcode_link');keep=old and old==lc
  n['url']=old if keep else destination
  n['meta'].update(mappingStatus='publisher-topic-mapped',publisherId=r['id'],publisherTitle=r['label'],publisherSource='https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet',verification='publisher-metadata; destination HTTP check recorded separately; exact method/constraints not playback-audited',externalAccess='Publisher access restrictions may apply' if not blog and r.get('isPremium') else 'External publisher resource')
  # Do not infer LeetCode difficulty from publisher access labels Basic/Core/Pro.
  if old!=n['url']:n.pop('difficulty',None)
  n['description']='Uploaded title and order preserved. Publisher-backed topic/problem destination; implementation variants in the title are not all independently verified.'+(' The external publisher may require an account or paid access.' if not blog and r.get('isPremium') else '')
  children=[c for c in n.get('children',[]) if c['slug'] not in ['publisher-resource','publisher-video']] if keep else []
  if keep:children.append({'slug':'publisher-resource','title':'Striver publisher article / topic','type':'resource','url':destination})
  video=r.get('yt_video')
  if isinstance(video,str) and video.startswith(('https://youtu.be/','https://www.youtube.com/watch?')):
   children.append({'slug':'publisher-video','title':'Striver publisher lesson (method coverage unverified)','type':'resource','url':video,'meta':{'source':'publisher-metadata','playbackVerified':False}})
  n['children']=children
  evidence.append({'originalNumber':int(number),'originalTitle':n['title'],'publisherId':r['id'],'publisherTitle':r['label'],'destination':destination,'selectedURL':n['url'],'video':video,'externalPremium':bool(not blog and r.get('isPremium')),'match':'explicit-reviewed-alias' if number in manual else 'exact-normalized-title'})
assert originals==[(s['slug'],n['slug'],n['title'],n['meta']['originalNumber']) for s in d['root']['children'] for n in s['children']]
p.write_text(json.dumps(d,indent=2)+'\n')
Path('content/sources/a2z-publisher-evidence.json').write_text(json.dumps({'source':'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?page=sheet','sourceSHA256':hashlib.sha256(Path('backups/a2z-primary-review/sheet.html').read_bytes()).hexdigest(),'checkedAt':'2026-11-02','scope':'Selected public metadata only; no problem statements/editorials copied; no publisher endorsement implied','mappings':evidence},indent=2)+'\n')
rows=[n for s in d['root']['children'] for n in s['children']]
print(json.dumps({'preservedRows':len(rows),'publisherMapped':len(evidence),'noPrimaryURL':sum(not n.get('url') for n in rows),'remainingLegacyCandidates':sum(n['meta'].get('mappingStatus')!='publisher-topic-mapped' and bool(n.get('url')) for n in rows)},indent=2))
