const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-extraction-'));
const app=require('./index');
test('vector graphics and scanned text share the PDF renderer canvas constructors',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{const form=new FormData();form.set('file',new Blob([fs.readFileSync(path.join(__dirname,'fixtures/vector-scan.pdf'))],{type:'application/pdf'}),'vector-scan.pdf');form.set('jurisdiction','ZA');const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/analyze',{method:'POST',body:form});const body=await res.json();assert.equal(res.status,200,body.error);assert.equal(body.extraction.method,'pdf-ocr');assert.equal(body.extraction.pages,1);assert.ok(body.issues.some(x=>x.id.startsWith('rha-entry')));}finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
