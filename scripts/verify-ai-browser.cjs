const assert=require('node:assert/strict');
module.exports=async function verifyAI({browser,base,out,outDir,matrix,aiCalls,setAIMode}){
 assert.equal(aiCalls.length,0,'Uploads without consent must not invoke AI');
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.setDefaultTimeout(20000);page.on('pageerror',e=>out.errors.push(e.message));
 await page.route('https://js.paystack.co/v1/inline.js',r=>r.fulfill({contentType:'text/javascript',body:'/* No payment during synthetic AI coverage. */'}));
 let releaseConfig;const configGate=new Promise(resolve=>{releaseConfig=resolve;});await page.route('**/api/config',async route=>{await configGate;await route.continue();});
 const ready=page.waitForResponse(r=>r.url()===base+'/api/config').then(r=>r.finished());
 await page.goto(base,{waitUntil:'domcontentloaded'});assert(await page.getByRole('checkbox',{name:/Add AI insights/}).isDisabled());releaseConfig();await ready;
 const checkbox=page.getByRole('checkbox',{name:/Add AI insights/});assert(await checkbox.isEnabled());assert.equal(await checkbox.isChecked(),false);await checkbox.check();
 const fixture={name:'ai-consent.txt',mimeType:'text/plain',buffer:Buffer.from('RESIDENTIAL LEASE. The tenant shall pay R8000 each month. The landlord may enter the dwelling without notice.')};
 await page.getByLabel('Choose a contract document').setInputFiles(fixture);await page.locator('.risk-gauge').waitFor();await page.locator('.enrichment-label').waitFor();assert.equal(aiCalls.length,1);
 assert(await page.getByText('Optional AI insights included. AI findings are marked below.',{exact:true}).isVisible());assert.equal(await page.locator('#report-actions').count(),0);
 await matrix(page,'ai-completed');
 await page.getByRole('button',{name:'New scan',exact:true}).click();setAIMode('unavailable');
 await page.getByLabel('Choose a contract document').setInputFiles(fixture);await page.locator('.risk-gauge').waitFor();
 await page.getByRole('status').filter({hasText:'AI insights could not be added. Your rules-based report is ready.'}).waitFor();assert.equal(aiCalls.length,2);assert.equal(await page.locator('.enrichment-label').count(),0);assert(await page.locator('.findings-list').isVisible());
 await matrix(page,'ai-unavailable');setAIMode('success');
 // Load the actual public SDK without opening checkout or creating a transaction.
 const sdkPage=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();sdkPage.on('pageerror',e=>out.errors.push(e.message));
 const sdkResponse=sdkPage.waitForResponse(r=>r.url()==='https://js.paystack.co/v1/inline.js');await sdkPage.goto(base,{waitUntil:'domcontentloaded'});assert.equal((await sdkResponse).status(),200);await sdkPage.waitForFunction(()=>typeof window.PaystackPop?.setup==='function');
 out.checks.push('The real Paystack public SDK loads and exposes setup in the browser; checkout is not opened and no transaction is created');
 out.checks.push('AI consent reaches the pinned OpenRouter request, labels grounded extras, keeps paid fields gated and returns a visible rules-based report after provider failure');
};
