export const GOOGLE_ANALYTICS_ID='G-H63CDF4BH2';
/** Never send authentication links, query strings, item IDs or personal text. */
export function analyticsPath(path:string){
 const clean=path.split(/[?#]/)[0];
 if(/^\/(auth|login|register|forgot-password|reset-password|onboarding|settings|billing|api)(\/|$)/.test(clean))return null;
 if(clean.startsWith('/companies/'))return '/companies/sheet';
 if(clean.startsWith('/core/'))return '/core/subject';
 if(clean.startsWith('/resources/'))return '/resources/collection';
 return ['/', '/pricing','/dashboard','/dsa','/analytics','/practice','/sql-practice','/system-design','/sprint','/applications','/saved','/companies','/resources','/core'].includes(clean)?clean:null;
}

/** gtag consumes Arguments entries, rather than plain arrays. */
export function analyticsCommandQueue(queue:unknown[]): (...args:unknown[])=>void {
 return function(){
  // eslint-disable-next-line prefer-rest-params -- Required by Google's gtag queue protocol.
  queue.push(arguments);
 };
}
