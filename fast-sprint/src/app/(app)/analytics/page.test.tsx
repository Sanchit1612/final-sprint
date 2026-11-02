import {expect,it,vi} from 'vitest';import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('@/lib/session',()=>({requireSession:async()=>({isPro:false,user:{id:'u'},tz:'UTC',supabase:{from:()=>({select(){return this;},eq(){return this;},not(){return this;},order(){return this;},range:async()=>({data:[],error:null})})}})}));
vi.mock('@/lib/coverage',()=>({loadCoverage:async()=>[{root:{id:'r',slug:'dsa-200',title:'Master 200'},data:{lastActivity:'2026-11-02',total:200,completed:3,difficulty:[],tree:[{id:'secret',title:'PRIVATE-PATTERN-SENTINEL',revision:7,total:20,completed:0,children:[]}]}}]}));
vi.mock('@/components/RevisionQueue',()=>({RevisionQueue:()=>null}));
vi.mock('@/components/ActivityCalendar',()=>({ActivityCalendar:()=> <div>Free calendar</div>}));
import Page from './page';
it('excludes protected insights from the Free server response while keeping basic analytics',async()=>{const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({})}));expect(html).toContain('Free calendar');expect(html).toContain('3 / 200');expect(html).toContain('Explore Pro analytics');expect(html).not.toContain('PRIVATE-PATTERN-SENTINEL');expect(html).not.toContain('Pattern explorer');expect(html).not.toContain('Revision queue');});
