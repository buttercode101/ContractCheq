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
