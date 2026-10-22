(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ContractChecklist=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const KEY='cc_checklists_v1',MAX=10,MAX_ITEMS=80;
 const clean=(v,max)=>typeof v==='string'?v.slice(0,max):'';
 function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'0001-01-01'||value>'9999-12-30')return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
 function normalize(value){
  if(!value||value.version!==1||typeof value.id!=='string'||!value.id||value.id.length>150||typeof value.title!=='string'||!Array.isArray(value.items)||value.items.length>MAX_ITEMS)throw Error('This is not a supported checklist backup.');
  const ids=new Set();
  const items=value.items.map(item=>{
   if(!item||typeof item.id!=='string'||!item.id||item.id.length>100||ids.has(item.id)||!['obligation','payment','date'].includes(item.kind)||typeof item.quote!=='string'||typeof item.label!=='string')throw Error('This checklist contains invalid or duplicate items.');
   ids.add(item.id);const date=validDate(item.calendarDate)?item.calendarDate:'';
   return {id:item.id,kind:item.kind,label:clean(item.label,200),party:clean(item.party,100),sourceLabel:clean(item.sourceLabel,100),quote:clean(item.quote,1100),confirmed:item.confirmed===true,done:item.confirmed===true&&item.done===true,calendarDate:date,dateConfirmed:item.confirmed===true&&Boolean(date)&&item.dateConfirmed===true};
  });
  return {version:1,id:value.id,title:clean(value.title,200),role:['neutral','tenant','landlord','employee','employer','freelancer','client'].includes(value.role)?value.role:'neutral',savedAt:clean(value.savedAt,40),items};
 }
 function read(storage){try{const raw=storage.getItem(KEY);if(!raw)return {entries:[],error:''};if(raw.length>1500000)throw Error('too large');const list=JSON.parse(raw);if(!Array.isArray(list)||list.length>MAX)throw Error('invalid');const entries=list.map(normalize);if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('duplicate');return {entries,error:''};}catch(e){return {entries:[],error:'Saved checklists could not be read. Restore a valid backup or clear the saved checklist data.'};}}
 function write(storage,entries){try{if(entries.length>MAX)throw Error('limit');const safe=entries.map(normalize);const raw=JSON.stringify(safe);if(raw.length>1500000)throw Error('too large');storage.setItem(KEY,raw);return true;}catch(e){return false;}}
 function save(storage,entry){const previous=read(storage);if(previous.error)throw Error(previous.error);const safe=normalize({...entry,savedAt:new Date().toISOString()});const entries=previous.entries.filter(e=>e.id!==safe.id);if(entries.length>=MAX)throw Error('Up to 10 checklists can be saved. Remove one or export a backup first.');if(!write(storage,[safe,...entries]))throw Error('Could not save this checklist. Browser storage may be unavailable or full. Download a backup instead.');return safe;}
 function remove(storage,id){const previous=read(storage);if(previous.error)throw Error(previous.error);if(!write(storage,previous.entries.filter(e=>e.id!==id)))throw Error('Could not remove the checklist.');}
 function escape(value){return String(value).replace(/\r\n?|\n/g,'\n').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
 function fold(line){let result='',part='',count=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(count+bytes>75){result+=part+'\r\n';part=' ';count=1;}part+=char;count+=bytes;}return result+part;}
 function calendar(entry,now=new Date()){
  const safe=normalize(entry),items=safe.items.filter(i=>i.confirmed&&i.dateConfirmed&&validDate(i.calendarDate));if(!items.length)throw Error('Confirm an item and its calendar date before exporting.');
  const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ContractCheck//Confirmed checklist dates//EN','CALSCALE:GREGORIAN'];
  for(const item of items){const day=item.calendarDate.replace(/-/g,''),end=new Date(item.calendarDate+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);const uid=Array.from(safe.id+'|'+item.id+'|'+day).map(c=>c.codePointAt(0).toString(16)).join('');lines.push('BEGIN:VEVENT','UID:'+uid+'@contractcheck.online','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+day,'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replace(/-/g,''),'SUMMARY:'+escape(safe.title+' — '+item.label),'DESCRIPTION:'+escape('User-confirmed date. '+item.sourceLabel+'\n'+item.quote),'END:VEVENT');}
  lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
 }
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return {KEY,normalize,read,save,remove,validDate,calendar,download};
});
