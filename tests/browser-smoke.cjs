"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright-core");
(async()=>{
 let exe=["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"].find(x=>fs.existsSync(x));
 if(!exe)throw Error("No system Chrome/Chromium found on Actions runner.");
 const browser=await chromium.launch({headless:true,executablePath:exe,args:["--no-sandbox","--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const page=await browser.newPage({viewport:{width:1365,height:850},deviceScaleFactor:1});
 const errors=[];
 page.on("pageerror",e=>errors.push("JS "+e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push("Console "+m.text())});
 await page.goto("file://"+path.join(__dirname,"..","index.html"),{waitUntil:"domcontentloaded"});
 await page.waitForTimeout(1700);
 const report=await page.evaluate(()=>({
  gl:!!document.querySelector("#world").getContext("webgl2"),
  debug:!!window.BeanDebug,
  fatal:!document.querySelector("#fatal").hidden,
  size:[document.querySelector("#world").width,document.querySelector("#world").height]
 }));
 console.log("Browser startup:",JSON.stringify(report));
 assert.equal(report.gl,true,"WebGL2 context unavailable");
 assert.equal(report.debug,true,"Controller did not start");
 assert.equal(report.fatal,false,"Fatal UI shown");
 await page.locator("#start").click();
 await page.locator("#story-next").click();
 await page.keyboard.press("e");
 await page.waitForTimeout(700);
 assert.equal(await page.evaluate(()=>BeanDebug.state.spans[0]),true,"First vine bridge didn't plant");
 await page.screenshot({path:"beanstalk-browser.png",fullPage:true});
 // Let the complete braided bridge flower and inspect it.
 await page.waitForTimeout(3800);
 await page.screenshot({path:"beanstalk-grown.png",fullPage:true});
 // Exercise the complete browser story, including both support interventions.
 async function arrive(i){
  await page.evaluate(id=>{BeanDebug.restorePlayer(id);BeanDebug.enter(id);},i);
  await page.locator("#story-next").click();
 }
 await arrive(1);
 await page.evaluate(()=>{BeanDebug.selectSeed("climber");BeanDebug.sow();});
 assert.equal(await page.evaluate(()=>BeanDebug.state.spans[1]),true);
 await arrive(2);
 await page.evaluate(()=>{BeanDebug.selectSeed("root");BeanDebug.sow();});
 assert.equal(await page.evaluate(()=>BeanDebug.state.rooted),true);
 await page.evaluate(()=>{BeanDebug.selectSeed("climber");BeanDebug.sow();});
 assert.equal(await page.evaluate(()=>BeanDebug.state.spans[2]),true);
 await arrive(3);
 await page.evaluate(()=>{BeanDebug.selectSeed("pulse");BeanDebug.sow();});
 assert.equal(await page.evaluate(()=>BeanDebug.state.heart),true);
 await page.evaluate(()=>{BeanDebug.selectSeed("climber");BeanDebug.sow();});
 assert.equal(await page.evaluate(()=>BeanDebug.state.spans[3]),true);
 await page.waitForTimeout(300);
 await page.screenshot({path:"beanstalk-heart.png",fullPage:true});
 await arrive(4);
 assert.equal(await page.locator("#ending-overlay").isVisible(),true);
 await page.locator("#choose-keep").click();
 assert.equal(await page.evaluate(()=>BeanDebug.state.ending),"keep");

 console.log("PNG beanstalk-browser.png created");
 assert.deepEqual(errors,[],"Browser errors");
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
