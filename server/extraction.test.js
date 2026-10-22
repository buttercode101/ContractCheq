const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
for (const key of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN']) delete process.env[key];
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-extraction-'));
const app=require('./index');
test('vector graphics and scanned text share the PDF renderer canvas constructors',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{const form=new FormData();form.set('file',new Blob([fs.readFileSync(path.join(__dirname,'fixtures/vector-scan.pdf'))],{type:'application/pdf'}),'vector-scan.pdf');form.set('jurisdiction','ZA');const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/analyze',{method:'POST',body:form});const body=await res.json();assert.equal(res.status,200,body.error);assert.equal(body.extraction.method,'pdf-ocr');assert.equal(body.extraction.pages,1);assert.ok(body.issues.some(x=>x.id.startsWith('rha-entry')));}finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});

function fixturePDF(texts) {
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const kids=[];
 for(const text of texts){const page=objects.length+1,stream=page+1;kids.push(page+' 0 R');const program=text?'BT /F1 12 Tf 40 740 Td ('+text.replace(/[\\()]/g,'\\$&')+') Tj ET':'';objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${stream} 0 R >>`,`<< /Length ${Buffer.byteLength(program)} >>\nstream\n${program}\nendstream`);}
 objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${texts.length} >>`;
 let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${o}\nendobj\n`;});
 const xref=Buffer.byteLength(out);out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Root 1 0 R /Size ${objects.length+1} >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out);
}
test('a genuinely blank PDF page does not invalidate readable later pages',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{
  const form=new FormData();form.set('file',new Blob([fixturePDF(['','RESIDENTIAL LEASE. Landlord may enter the dwelling without notice.'])],{type:'application/pdf'}),'blank-and-contract.pdf');
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/analyze',{method:'POST',body:form});const body=await r.json();
  assert.equal(r.status,200,body.error);assert.equal(body.extraction.pages,2);assert.match(body.extraction.warning,/blank page/);assert.ok(body.issues.some(i=>i.id.startsWith('rha-entry')));
 }finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});

test('short signature text is retained rather than rejected or called blank',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{
  const form=new FormData();form.set('file',new Blob([fixturePDF(['RESIDENTIAL LEASE. The deposit is refundable with interest. A joint inspection is required.','Signature of tenant:','Landlord may enter the dwelling without notice.'])],{type:'application/pdf'}),'signature-page.pdf');
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/analyze',{method:'POST',body:form});const body=await r.json();
  assert.equal(r.status,200,body.error);assert.equal(body.extraction.pages,3);
  const stored=await require('./store').getAnalysis(body._id);
  assert.ok(stored.full.plainLanguageGuide.sections.some(s=>s.original.includes('Signature of tenant:')));
  assert.ok(!String(body.extraction.warning).includes('blank page'));
  assert.ok(body.issues.some(i=>i.id.startsWith('rha-entry')));
 }finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});

test('a clear phone-style PNG reaches OCR and retains the clause in the saved report',async()=>{
 const {createCanvas}=require('@napi-rs/canvas'),canvas=createCanvas(1500,420),ctx=canvas.getContext('2d');
 ctx.fillStyle='white';ctx.fillRect(0,0,1500,420);ctx.fillStyle='black';ctx.font='40px sans-serif';
 ['RESIDENTIAL LEASE AGREEMENT.','Landlord may enter the dwelling without notice.','The tenant shall pay rent of R8000 per month.'].forEach((line,i)=>ctx.fillText(line,50,90+i*100));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{
  const form=new FormData();form.set('file',new Blob([canvas.toBuffer('image/png')],{type:'image/png'}),'phone-contract.png');form.set('jurisdiction','ZA');form.set('perspective','tenant');
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/analyze',{method:'POST',body:form});const body=await response.json();
  assert.equal(response.status,200,body.error);assert.equal(body.extraction.method,'tesseract');assert.ok(body.issues.some(i=>i.id.startsWith('rha-entry')));
  const saved=await require('./store').getAnalysis(body._id);assert.ok(saved.full.plainLanguageGuide.sections.some(s=>/without notice/i.test(s.original)));
  assert.equal(body.actionPlan,undefined);
 }finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
