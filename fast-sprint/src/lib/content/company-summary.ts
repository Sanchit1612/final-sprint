import {companySheet} from './companies';import {priorityProblems} from './company-priority';import type {CompanyProgress} from '../company-progress';
export function companySummaries(progress:CompanyProgress[]) {
 return [...new Set(progress.filter(p=>p.completed||p.bookmarked).map(p=>p.company_slug))].flatMap(slug=>{const sheet=companySheet(slug);if(!sheet)return [];const priority=priorityProblems(sheet.problems),rows=progress.filter(p=>p.company_slug===slug),done=new Set(rows.filter(p=>p.completed).map(p=>p.problem_slug));return [{slug,name:sheet.name,total:priority.length,completed:priority.filter(p=>done.has(p.slug)).length,bookmarked:rows.filter(p=>p.bookmarked&&sheet.problems.some(q=>q.slug===p.problem_slug)).length}];});
}
