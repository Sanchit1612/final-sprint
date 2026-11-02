import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
export interface Company {name:string;slug:string;count:number;score:number}
export interface CompanySheet extends Company {problems:{title:string;slug:string;url:string;difficulty:string;frequency:number;paidOnly:false;topics?:string[];coreRelevance?:boolean}[]}
export function companyIndex():Company[]{const p=join(process.cwd(),'content/companies/index.json');return existsSync(p)?JSON.parse(readFileSync(p,'utf8')):[];}
export function companySheet(slug:string):CompanySheet|null {if(!companyIndex().some(c=>c.slug===slug))return null;const sheet=JSON.parse(readFileSync(join(process.cwd(),'content/companies',slug+'.json'),'utf8')) as CompanySheet;return {...sheet,count:sheet.problems.length};}
