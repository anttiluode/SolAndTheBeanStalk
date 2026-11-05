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
 console.log("PNG beanstalk-browser.png created");
 assert.deepEqual(errors,[],"Browser errors");
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
