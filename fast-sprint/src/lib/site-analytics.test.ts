import {expect,it} from 'vitest';
import {analyticsCommandQueue,analyticsPath} from './site-analytics';
it('excludes authentication data and strips personal URL details',()=>{
 for(const path of ['/auth/callback?code=secret','/settings','/billing','/api/billing/verify','/reset-password#token'])expect(analyticsPath(path)).toBeNull();
 expect(analyticsPath('/dsa?q=private-note#personal-item')).toBe('/dsa');
 expect(analyticsPath('/companies/private-company')).toBe('/companies/sheet');
 expect(analyticsPath('/resources/aptitude')).toBe('/resources/collection');
 expect(analyticsPath('/unknown-personal-path')).toBeNull();
});

it('queues commands using the Google tag Arguments protocol',()=>{
 const queue:unknown[]=[];analyticsCommandQueue(queue)('event','page_view',{page_location:'https://example.com/dsa'});
 expect(Object.prototype.toString.call(queue[0])).toBe('[object Arguments]');
 expect(Array.from(queue[0] as IArguments)).toEqual(['event','page_view',{page_location:'https://example.com/dsa'}]);
});
