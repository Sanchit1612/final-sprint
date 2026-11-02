import {z} from 'zod';
export function authFormSchema(mode:'login'|'register') {
 return z.object({name:z.string().trim().max(100).optional(),email:z.string().trim().email('Enter a valid email'),password:mode==='register'?z.string().min(8,'Use at least 8 characters'):z.string().min(1,'Enter your password')});
}
