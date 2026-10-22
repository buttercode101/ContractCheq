const fs=require('node:fs'),assert=require('node:assert/strict');

// Separate fresh contexts exercise failure recovery without touching real receipts or storage.
module.exports=async function verifyEdges({browser,base,out,outDir,matrix,bounded}){
 const backup=JSON.parse(fs.readFileSync(outDir+'/checklist-'+out.browser+'.json','utf8'));
 async function fresh(path='/',checkoutScript){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  page.setDefaultTimeout(20000);page.on('pageerror',e=>{out.errors.push(e.message);console.error('edge-page-error',JSON.stringify({url:page.url(),message:e.message,stack:e.stack}));});
  await page.route('https://js.paystack.co/v1/inline.js',r=>r.fulfill({contentType:'text/javascript',body:checkoutScript||'/* Checkout is not used in failure recovery. */'}));
  // Gate on the configuration used by the UI; background telemetry must not block user journeys.
  const ready=page.waitForResponse(r=>r.url()===base+'/api/config').then(r=>r.json());
  await page.goto(base+path,{waitUntil:'domcontentloaded'});await bounded(ready,'Fresh-context configuration '+path);
  if(checkoutScript)await page.waitForFunction(()=>typeof window.PaystackPop?.setup==='function',null,{timeout:20000});
  return page;
 }
 const page=await fresh('/checklists');
 const poisoned={...backup,id:'untrusted-import',title:'Imported edge checklist',role:'__proto__',items:backup.items.map((i,n)=>n===0?{...i,quote:'<img src=x onerror="window.injectedBackup=true"> Client must pay after acceptance.'}:i)};
 await page.getByLabel('Restore checklist backup',{exact:true}).setInputFiles({name:'untrusted-role.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(poisoned))});
 await page.locator('.saved-card').waitFor();assert.match(await page.locator('.saved-card').innerText(),/General review/);
 let editor=page.getByRole('region',{name:'Saved checklist editor'}),first=editor.locator('.action-item').first();
 await first.locator('.action-source summary').click();assert.match(await first.locator('blockquote').innerText(),/<img src=x/);assert.equal(await first.locator('blockquote img').count(),0);assert.equal(await page.evaluate(()=>window.injectedBackup),undefined);
 await first.locator('.action-date summary').click();await first.getByLabel('Calendar date',{exact:true}).fill('2026-12-02');
 assert.equal(await first.getByRole('checkbox',{name:/^Confirm calendar date/}).isChecked(),false);
 await editor.getByRole('button',{name:'Export confirmed dates',exact:true}).click();assert.match(await page.locator('.action-message').innerText(),/Confirm an item/);
 await first.getByRole('checkbox',{name:/^Confirm item/}).uncheck();assert.equal(await first.getByRole('checkbox',{name:/Mark complete/}).isChecked(),false);assert(await first.getByRole('checkbox',{name:/Mark complete/}).isDisabled());
 await first.getByRole('checkbox',{name:/^Confirm item/}).check();await first.getByRole('checkbox',{name:/Mark complete/}).check();await first.getByRole('checkbox',{name:/^Confirm calendar date/}).check();
 await editor.getByRole('button',{name:'Save checklist changes',exact:true}).click();assert.match(await page.locator('.action-message').innerText(),/changes saved/);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.saved-card').click();editor=page.getByRole('region',{name:'Saved checklist editor'});
 assert(await editor.locator('.action-item').first().getByRole('checkbox',{name:/Mark complete/}).isChecked());
 const download=page.waitForEvent('download');await editor.getByRole('button',{name:'Export confirmed dates',exact:true}).click();const file=outDir+'/edited-dates-'+out.browser+'.ics';const editedDownload=await bounded(download,'Edited calendar download event');console.log('Edited calendar download started',editedDownload.suggestedFilename());try{await bounded(editedDownload.saveAs(file),'Edited calendar download completion');}catch(error){await editedDownload.cancel();throw error;}assert.match(fs.readFileSync(file,'utf8'),/DTSTART;VALUE=DATE:20261202/);
 await page.getByLabel('Restore checklist backup',{exact:true}).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});
 await page.getByRole('status').filter({hasText:'not a supported checklist'}).waitFor();assert.equal(await page.locator('.saved-card').count(),1);
 await page.evaluate(()=>{localStorage.setItem('cc_v3',JSON.stringify({email:'synthetic@example.test',credits:0,notes:{}}));localStorage.setItem('cc_checklists_v1','{');});
 await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('alert').filter({hasText:'could not be read'}).waitFor();
 const receiptStorage=await page.evaluate(()=>localStorage.getItem('cc_v3'));assert.equal(JSON.parse(receiptStorage).email,'synthetic@example.test');
 await page.getByText('Replace unreadable checklist storage',{exact:true}).click();await page.getByRole('button',{name:'Clear unreadable checklist data',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('cc_v3')),receiptStorage);
 await page.getByLabel('Restore checklist backup',{exact:true}).setInputFiles({name:'recovered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.locator('.saved-card').waitFor();
 out.checks.push('Untrusted backup roles and HTML remain safe; edited dates require reconfirmation, saved changes survive reload, invalid imports preserve existing data, corrupt storage recovery preserves receipt settings');await page.context().close();

 const quota=await fresh();
 await quota.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='cc_checklists_v1')throw new DOMException('Quota full','QuotaExceededError');return original.call(this,key,value);};});
 await quota.getByRole('button',{name:'Explore Residential lease example report',exact:true}).click();await quota.locator('#report-actions').waitFor();
 await quota.getByRole('button',{name:'Save checklist on this device',exact:true}).click();await quota.locator('.action-message').filter({hasText:'Could not save'}).waitFor();
 assert(await quota.getByRole('heading',{name:'Your contract, in everyday language',exact:true}).isVisible());
 const backupDownload=quota.waitForEvent('download');await quota.getByRole('button',{name:'Download checklist backup',exact:true}).click();const backupFile=outDir+'/quota-backup-'+out.browser+'.json';await(await backupDownload).saveAs(backupFile);assert.equal(JSON.parse(fs.readFileSync(backupFile,'utf8')).version,1);
 await quota.getByLabel('Questions to send back',{exact:true}).fill('Please confirm the payment trigger.');await quota.getByRole('button',{name:'Copy questions',exact:true}).click();
 await quota.locator('.action-message').filter({hasText:/Questions copied|Select and copy/}).waitFor();
 await matrix(quota,'storage-failure');
 out.checks.push('A full browser store reports save failure while report, backup download and copy-or-manual-copy questions remain usable');await quota.context().close();

 const asset=await fresh();await asset.route('**/checklist-tools.js',r=>r.abort());await asset.reload({waitUntil:'domcontentloaded'});
 await asset.getByRole('button',{name:'Explore Residential lease example report',exact:true}).click();await asset.getByRole('alert').filter({hasText:'Checklist tools could not load'}).waitFor();
 assert(await asset.getByRole('heading',{name:'Your contract, in everyday language',exact:true}).isVisible());
 await asset.unroute('**/checklist-tools.js');await asset.goto(base,{waitUntil:'domcontentloaded'});await asset.getByRole('button',{name:'Explore Residential lease example report',exact:true}).click();await asset.locator('#report-actions').waitFor();
 out.checks.push('Missing checklist asset preserves the full report and recovers on reload');await asset.context().close();

 const retry=await fresh();await retry.route('**/api/analyze',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic analysis outage. Please retry.'})}));
 const input={name:'retry-contract.txt',mimeType:'text/plain',buffer:Buffer.from('RESIDENTIAL LEASE. The landlord may enter the dwelling without notice. The tenant shall pay R8000 monthly.')};
 await retry.getByLabel('Choose a contract document').setInputFiles(input);await retry.getByRole('alert').filter({hasText:'Synthetic analysis outage'}).waitFor();await retry.getByLabel('Choose a contract document').waitFor();
 await retry.unroute('**/api/analyze');await retry.getByLabel('Choose a contract document').setInputFiles(input);await retry.locator('.risk-gauge').waitFor();assert.equal(await retry.getByRole('alert').count(),0);
 out.checks.push('A failed upload surfaces its error and the same file succeeds after retry');await retry.context().close();

 const damaged=await fresh();
 await damaged.getByLabel('Choose a contract document').setInputFiles({name:'damaged.txt',mimeType:'text/plain',buffer:Buffer.alloc(60)});
 await damaged.getByRole('alert').filter({hasText:'binary data instead of readable text'}).waitFor();
 assert.equal(await damaged.locator('.risk-gauge').count(),0);
 await damaged.getByLabel('Choose a contract document').setInputFiles(input);
 await damaged.locator('.risk-gauge').waitFor();assert.equal(await damaged.getByRole('alert').count(),0);
 out.checks.push('Binary text is rejected without displaying a risk score; a valid contract succeeds immediately afterwards');await damaged.context().close();

 const landscape=await fresh();await landscape.setViewportSize({width:844,height:390});
 await landscape.getByRole('button',{name:'Open navigation menu',exact:true}).click();
 await landscape.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Saved checklists',exact:true}).click();
 await landscape.getByRole('heading',{name:'Saved checklists',exact:true}).waitFor();assert.equal(new URL(landscape.url()).pathname,'/checklists');assert.equal(await landscape.getByRole('dialog').count(),0);
 await landscape.goBack({waitUntil:'domcontentloaded'});await landscape.locator('.upload-panel').waitFor();assert.equal(new URL(landscape.url()).pathname,'/');
 await landscape.getByRole('button',{name:'Pricing',exact:true}).click();await landscape.getByRole('button',{name:'Buy R19',exact:true}).click();
 const modal=landscape.getByRole('dialog');await modal.waitFor();await modal.getByLabel('Email address',{exact:true}).fill('invalid');await modal.getByRole('button',{name:'Continue to Paystack',exact:true}).click();
 assert.equal(await modal.getByLabel('Email address',{exact:true}).evaluate(el=>el.validity.valid),false);assert(await modal.isVisible());
 const box=await modal.boundingBox();assert(box.height<=390,'Landscape checkout must fit the viewport');
 await landscape.keyboard.press('Escape');assert.equal(await landscape.getByRole('dialog').count(),0);assert.equal(await landscape.getByRole('button',{name:'Buy R19',exact:true}).evaluate(el=>el===document.activeElement),true);
 assert(await landscape.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 out.checks.push('844x390 landscape: mobile navigation, history back, checkout scrolling, invalid email and Escape focus restoration pass');await landscape.context().close();

 // A delayed payment completion must retain the receipt without replacing a later page/report.
 const payRace=await fresh('/',"window.PaystackPop={setup:function(o){return{openIframe:function(){o.callback({reference:'CC-navigation-browser-receipt'})}}}}");
 await payRace.getByLabel('Choose a contract document').setInputFiles(input);await payRace.locator('.risk-gauge').waitFor();
 let releaseUnlock,unlockStarted;const unlockGate=new Promise(r=>releaseUnlock=r),unlockReady=new Promise(r=>unlockStarted=r);
 await payRace.route('**/api/unlock-analysis',async route=>{const response=await route.fetch();unlockStarted();await unlockGate;await route.fulfill({response});});
 await payRace.getByRole('button',{name:/Full report/}).click();await payRace.getByLabel('Email address',{exact:true}).fill('synthetic@example.test');await payRace.getByRole('button',{name:'Continue to Paystack'}).click();await bounded(unlockReady,'Navigation payment unlock request');
 await payRace.getByRole('button',{name:'Open navigation menu',exact:true}).click();await payRace.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Pricing',exact:true}).click();releaseUnlock();await payRace.getByRole('status').filter({hasText:'Your report was unlocked'}).waitFor();
 await payRace.getByRole('button',{name:'Return to current report',exact:true}).click();assert.equal(await payRace.getByRole('button',{name:'Export PDF',exact:true}).count(),0);await payRace.context().close();

 const pricingBuy=await fresh('/',"window.PaystackPop={setup:function(o){if(o.metadata.analysisId)throw Error('Pricing must not attach an incidental report');return{openIframe:function(){o.callback({reference:'CC-pricing-browser-receipt'})}}}}");let incidentalUnlocks=0;
 await pricingBuy.getByRole('button',{name:'Explore Residential lease example report',exact:true}).click();await pricingBuy.locator('.risk-gauge').waitFor();
 await pricingBuy.route('**/api/unlock-analysis',route=>{incidentalUnlocks++;return route.abort();});
 await pricingBuy.getByRole('button',{name:'Open navigation menu',exact:true}).click();await pricingBuy.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Pricing',exact:true}).click();await pricingBuy.getByRole('button',{name:'Buy R19',exact:true}).click();await pricingBuy.getByLabel('Email address',{exact:true}).fill('synthetic@example.test');await pricingBuy.getByRole('button',{name:'Continue to Paystack'}).click();
 await pricingBuy.getByRole('status').filter({hasText:'1 report credits added'}).waitFor();assert.equal(incidentalUnlocks,0);
 out.checks.push('Pricing purchases after exploring an example add a reusable credit without attaching or unlocking the example');await pricingBuy.context().close();
 // Receipt restoration has a finite deadline and becomes retryable without another checkout.
 const stalled=await fresh('/pricing');
 await stalled.evaluate(()=>{const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===25000?100:ms,...args);});
 let releaseReceipt;const receiptGate=new Promise(r=>releaseReceipt=r);
 await stalled.route('**/api/verify-payment',async route=>{await receiptGate;await route.abort().catch(()=>{});});
 await stalled.getByLabel('Payment reference').fill('CC-stalled-browser-receipt');await stalled.getByLabel('Receipt email').fill('synthetic@example.test');await stalled.getByRole('button',{name:'Restore existing payment'}).click();
 await stalled.getByRole('alert').filter({hasText:'do not pay again'}).waitFor();assert(await stalled.getByRole('button',{name:'Restore existing payment'}).isEnabled());releaseReceipt();
 out.checks.push('Delayed payment completion retains recovery without overwriting later navigation; stalled receipt requests time out, preserve the reference and allow retry without paying again');await stalled.context().close();

 // A failed initial configuration must recover in-place, on every layout.
 const reconnect=await fresh();
 await reconnect.route('**/api/config',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Synthetic configuration outage'})}));
 await reconnect.reload({waitUntil:'domcontentloaded'});
 await reconnect.getByRole('button',{name:'Retry connection',exact:true}).waitFor();
 assert(await reconnect.getByRole('checkbox',{name:/Add AI insights/}).isDisabled());
 await reconnect.getByRole('button',{name:'Pricing',exact:true}).click();
 assert(await reconnect.getByRole('button',{name:'Buy R19',exact:true}).isDisabled());
 await matrix(reconnect,'connection-recovery');
 await reconnect.unroute('**/api/config');
 await reconnect.getByRole('button',{name:'Retry connection',exact:true}).click();
 await reconnect.locator('.service-status').waitFor({state:'hidden'});
 assert(await reconnect.getByRole('button',{name:'Buy R19',exact:true}).isEnabled());
 await reconnect.getByRole('button',{name:'ContractCheck home',exact:true}).click();
 assert(await reconnect.getByRole('checkbox',{name:/Add AI insights/}).isEnabled());
 assert.equal(await reconnect.getByRole('checkbox',{name:/Add AI insights/}).isChecked(),false);
 out.checks.push('Configuration outage keeps checkout and AI disabled, renders accessible recovery at every tested width, and retries in-place without restoring AI consent');
 await reconnect.context().close();

};
