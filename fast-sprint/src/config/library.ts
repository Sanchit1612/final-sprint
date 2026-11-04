export const LIBRARY = [
 {slug:"dbms",title:"DBMS",pro:false,status:"Curated GFG learning index"},
 {slug:"os",title:"Operating Systems",pro:false,status:"Processes, memory and concurrency"},
 {slug:"cn",title:"Computer Networks",pro:false,status:"Protocols, addressing and transport"},
 {slug:"oop",title:"OOP",pro:false,status:"Objects, interfaces and design patterns"},
 {slug:"sql",title:"SQL",pro:false,status:"Curated GFG learning index"},
 {slug:"aptitude",title:"Aptitude",pro:true,status:"Work through aptitude topics and exercises"},
 {slug:"behavioural",title:"Behavioural and HR",pro:true,status:"Practise stories and follow-up questions"},
 {slug:"interview",title:"Interview preparation",pro:true,status:"Practise technical interview prompts"},
 {slug:"companies",title:"Company preparation",pro:true,status:"50 company sheets with frequency-informed priority practice"},
 {slug:"development",title:"Development paths",pro:true,status:"Structured development paths and project resources"},
] as const;
export const isCoreRoot=(slug:string)=>["dbms","os","cn","oop","sql"].includes(slug);

/** Deliberately public headings only; no premium text, answers or hidden payload. */
export const PUBLIC_PRO_HEADINGS: Record<string, readonly string[]> = {
 development: ["Full Stack Development", "Frontend Development", "Backend Development"],
 analytics: ["Detailed pattern coverage", "Weekly and monthly completion trends", "Your least-completed learning groups"],
};
PUBLIC_PRO_HEADINGS["aptitude"] = ["Problem on Averages-1 - Placement Exercise", "Problem on Averages-2 - Placement Exercise", "Problem on Averages-3 - Placement Exercise"];
PUBLIC_PRO_HEADINGS["behavioural"] = ["Tell me about a time you worked well within a team", "Tell me about a time you dealt with conflict on a team. How did you solve it?", "Tell me about a time you failed at work"];
PUBLIC_PRO_HEADINGS["interview"] = ["Explain TCP model", "Name layers of the OSI Model with protocols belonging to the layers", "What is the significance of Data Link Layer"];
PUBLIC_PRO_HEADINGS["companies"] = ["Health Center Networking", "Supply Station Chain", "Jump To The Flag"];
