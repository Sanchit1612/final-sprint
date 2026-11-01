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
# Supplemental official documentation: source pages were opened, not invented.
refs=[('frontend','Frontend foundations','https://developer.mozilla.org/en-US/docs/Learn_web_development'),('react','React fundamentals','https://react.dev/learn'),('nextjs','Next.js project learning','https://nextjs.org/learn'),('backend','Node.js backend foundations','https://nodejs.org/en/learn/getting-started/introduction-to-nodejs'),('python','Python language tutorial','https://docs.python.org/3/tutorial/'),('ml','Machine learning foundations','https://developers.google.com/machine-learning/crash-course')]
save('development','Development learning paths',[{'slug':k,'title':title,'type':'topic','description':'Official learning resource; follow the source curriculum. This is a foundation, not a complete job-readiness roadmap.','children':[{'slug':'official','title':'Open official learning path','type':'resource','url':u,'meta':{'verification':'page-opened-2026-11-01','attribution':'Official publisher'}}]} for k,title,u in refs],False,{'contentStatus':'foundational official links; full-stack and AI/LLM structured paths incomplete'})
for key,title in [('dbms','DBMS foundations'),('sql','SQL foundations')]:
 save(key,title,[{'slug':'relational-sql','title':'Relational databases and SQL','type':'topic','children':[{'slug':'postgres-tutorial','title':'PostgreSQL tutorial','type':'resource','url':'https://www.postgresql.org/docs/current/tutorial.html','meta':{'verification':'page-opened-2026-11-01'}}]},{'slug':'transactions','title':'Transactions','type':'topic','children':[{'slug':'postgres-transactions','title':'PostgreSQL transactions tutorial','type':'resource','url':'https://www.postgresql.org/docs/current/tutorial-transactions.html','meta':{'verification':'page-opened-2026-11-01'}}]}],False,{'contentStatus':'partial foundations; DBMS normalization/indexes/concurrency syllabus still missing'})
# Additional official chapters, checked separately from the supplied resources.
chapters=[('constraints','Keys and integrity constraints','https://www.postgresql.org/docs/current/ddl-constraints.html'),('indexes','Indexes','https://www.postgresql.org/docs/current/indexes.html'),('concurrency','Concurrency and transaction isolation','https://www.postgresql.org/docs/current/mvcc.html'),('query-plans','Reading query plans','https://www.postgresql.org/docs/current/using-explain.html')]
for key in ['dbms','sql']:
 p=out/(key+'.manifest.json');d=json.loads(p.read_text())
 for slug_,title,url in chapters:d['root']['children'].append({'slug':slug_,'title':title,'type':'topic','children':[{'slug':'official','title':'Official PostgreSQL chapter','type':'resource','url':url,'meta':{'verification':'page-opened-2026-11-01'}}]})
 if key=='dbms':d['root']['children'].append({'slug':'normalization','title':'Normalization fundamentals','type':'topic','children':[{'slug':'microsoft','title':'Microsoft normalization guide (legacy documentation)','type':'resource','url':'https://learn.microsoft.com/en-us/previous-versions/troubleshoot/microsoft-365/microsoft-365-apps/access/database-normalization-description','meta':{'verification':'page-opened-2026-11-01; legacy page may display sign-in warning'}}]})
 d['root']['meta']['contentStatus']='Official conceptual foundations; not a complete interview/practice bank'
 p.write_text(json.dumps(d,indent=2)+'\n')
p=out/'development.manifest.json';d=json.loads(p.read_text());d['root']['children'].append({'slug':'llm','title':'AI and LLM development foundations','type':'topic','description':'Hugging Face publisher course; follow its prerequisites and exercises.','children':[{'slug':'official','title':'Hugging Face LLM course','type':'resource','url':'https://huggingface.co/learn/llm-course/chapter1/1','meta':{'verification':'page-opened-2026-11-01'}}]});p.write_text(json.dumps(d,indent=2)+'\n')
