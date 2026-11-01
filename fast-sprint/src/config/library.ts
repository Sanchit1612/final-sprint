export const LIBRARY = [
 {slug:"dbms",title:"DBMS",pro:false,status:"Partial foundations"},
 {slug:"os",title:"Operating Systems",pro:false,status:"57 supplied topics"},
 {slug:"cn",title:"Computer Networks",pro:false,status:"118 supplied topics"},
 {slug:"oop",title:"OOP",pro:false,status:"36 supplied topics"},
 {slug:"sql",title:"SQL",pro:false,status:"Partial foundations"},
 {slug:"aptitude",title:"Aptitude",pro:true,status:"75 link-out entries; not a verified quiz bank"},
 {slug:"behavioural",title:"Behavioural and HR",pro:true,status:"60 supplied questions; attribution review pending"},
 {slug:"interview",title:"Interview preparation",pro:true,status:"59 question titles; answers missing"},
 {slug:"companies",title:"Company preparation",pro:true,status:"86 community-reported OA source links"},
 {slug:"development",title:"Development paths",pro:false,status:"Official foundations; advanced roadmaps incomplete"},
] as const;
export const isCoreRoot=(slug:string)=>["dbms","os","cn","oop","sql"].includes(slug);
