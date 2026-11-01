import json,re,collections
from pathlib import Path
out=Path('content/collections');base=Path('backups/resource-inspection/research/research/extracted-content')
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
def save(key,title,children,pro=False,meta=None):
 (out/(key+'.manifest.json')).write_text(json.dumps({'version':1,'root':{'slug':key,'title':title,'type':'subject','isPro':pro,'meta':meta or {},'children':children}},indent=2)+'\n')
for key,title,file,group,array in [('aptitude','Aptitude practice index','aptitude/aptitude-index.json','topic','items'),('companies','Company OA preparation index','company-preparation/company-oa-questions-index.json','company','questions')]:
 d=json.loads((base/file).read_text());groups={}
 for i,p in enumerate(d[array]):
  g=p[group];groups.setdefault(g,[]);text=p.get('title_line',p.get('title'))
  groups[g].append({'slug':p['id'],'title':text,'type':'topic','description':'Link-out source index; answers and company claims are not independently verified.','meta':{'provenance':{k:v for k,v in p.items() if k not in ['title','title_line']},'contentStatus':'index-only'},'children':[{'slug':'source','title':'Open original source','type':'resource','url':p['source_url']}]})
 save(key,title,[{'slug':slug(g),'title':g,'type':'section','children':ts} for g,ts in groups.items()],True,{'sourceMetadata':d['_meta'],'contentStatus':'index-only; not a verified mock/question bank'})
b=json.loads(Path('backups/resource-inspection/resources/behavioral_interview.json').read_text());sections=[]
sections.append({'slug':'core','title':'Core behavioural questions','type':'section','children':[{'slug':q['id'],'title':q['question'],'type':'topic','description':q['what_interviewer_wants']+'\n\n'+'\n'.join(q['approach_tips'])+'\n\nExample answer (supplied):\n'+json.dumps(q['example_answer'],ensure_ascii=False),'meta':{'tags':q.get('tags',[]),'exampleAnswer':q['example_answer'],'sourceNote':b['meta']['source_note'],'verification':'supplied-unverified'}} for q in b['core_questions']]})
for c in b['companies']:
 sections.append({'slug':c['id'],'title':c['name'],'type':'section','description':c.get('focus',''),'children':[{'slug':q['id'],'title':q['question'],'type':'topic','description':q.get('tip',''),'meta':{'sourceNote':b['meta']['source_note'],'verification':'supplied-unverified'}} for q in c['questions']]})
save('behavioural','Behavioural and HR preparation',sections,True,{'sourceNote':b['meta']['source_note'],'verification':'source attribution unresolved; draft review only'})
d=json.loads((base/'interview-questions/question-titles-from-pdfs.json').read_text());groups={}
for q in d['questions']:
 groups.setdefault(q['topic'],[]);groups[q['topic']].append({'slug':q['id'],'title':q['question'],'type':'topic','description':'Question title only. No answer supplied.','meta':q})
save('interview','Technical interview title index',[{'slug':slug(g),'title':g.upper(),'type':'section','children':qs} for g,qs in groups.items()],True,{'sourceMetadata':d['_meta'],'contentStatus':'title-index-only; not full Q&A'})
# GFG and specialised development curation is maintained separately.
# Run scripts/content/curate-library.py to rebuild DBMS, SQL and development indexes.
