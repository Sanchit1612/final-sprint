import {z} from 'zod';
export const interviewAnswerSchema=z.object({answer:z.string().min(30).max(5000),keywords:z.array(z.string().min(1).max(100)).min(2).max(8),avoid:z.string().min(10).max(1000)});
export type InterviewAnswer=z.infer<typeof interviewAnswerSchema>;
export function parseInterviewAnswer(value:unknown){const parsed=interviewAnswerSchema.safeParse(value);return parsed.success?parsed.data:undefined;}
