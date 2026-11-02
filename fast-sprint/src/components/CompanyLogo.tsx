import Image from 'next/image';
import proof from '../../verification/company-logos.json';
export function CompanyLogo({slug,name}:{slug:string;name:string}) {
 const record=(proof.logos as Record<string,{format?:string}>)[slug];
 return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-2">{record?<Image unoptimized src={`/companies/${slug}.${record.format?'png':'svg'}`} width={32} height={32} alt="" className="h-8 w-8 object-contain"/>:<span className="text-xl font-bold text-black" aria-hidden>{name[0]}</span>}</span>;
}
