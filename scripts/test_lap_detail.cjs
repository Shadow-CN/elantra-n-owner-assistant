const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm')
let definition,videoFails=false,detailFails=false,videoCalls=0,delayed=null
let record={_id:'lap1',track:10,driver:'车手',vehicle:'EN',lap:'01:17.456',date:'2026-11-01',temperature:0,condition:'干地',modifications:'改装',hasVideo:false,videoLink:'https://b23.tv/lap123',modificationDetails:{brakeCalipers:'六活塞',brakePads:'赛道皮',brakes:'历史刹车描述'}}
const wx={cloud:{async callFunction({data}){
 if(data.action==='detail'){if(delayed)return delayed;if(detailFails)return {result:{ok:false,message:'该成绩不可用'}};return {result:{ok:true,detail:JSON.parse(JSON.stringify(record))}}}
 if(data.action==='video'){videoCalls++;if(videoFails)throw Error('视频暂时不可用');return {result:{ok:true,url:'https://example.com/video.mp4'}}}
}}}
vm.runInNewContext(fs.readFileSync('pages/lap-detail/lap-detail.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>definition=p,wx,getApp:()=>({globalData:{}}),console})
function page(){const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),_alive:true,_id:'lap1'};p.setData=patch=>Object.assign(p.data,patch);return p}
async function run(){
 let p=page();await p.load();assert.equal(p.data.loading,false);assert.equal(p.data.detail.lap,'01:17.456');assert.equal(videoCalls,0,'link-only results do not request video URLs')
 assert.equal(p.data.basicFields.find(f=>f.label==='赛道').value,'鄂尔多斯国际赛车场');assert.equal(p.data.basicFields.find(f=>f.label==='气温').value,'0℃')
 assert.equal(p.data.modFields[0].label,'刹车卡钳');assert.equal(p.data.modFields[1].label,'刹车皮');assert.equal(p.data.modFields[2].label,'刹车（旧记录）')
 record.hasVideo=true;videoFails=true;p=page();await p.load();assert.equal(p.data.error,'');assert(p.data.detail);assert(p.data.videoError);assert.equal(p.data.videoLoading,false)
 videoFails=false;await p.loadVideo();assert(p.data.videoUrl);assert.equal(p.data.videoError,'')
 record.hasVideo=false;record.videoLink='#小程序://平台/视频/abc';record.modificationDetails={};p=page();await p.load();assert(p.data.videoLinkCanOpen);assert.equal(p.data.modFields.length,0)
 detailFails=true;p=page();await p.load();assert.equal(p.data.error,'该成绩不可用');assert.equal(p.data.detail,null)
 p=page();p._id='';await p.load();assert(p.data.error.includes('不完整'))
 let resolve;detailFails=false;delayed=new Promise(r=>resolve=r);p=page();const pending=p.load();p.onUnload();resolve({result:{ok:true,detail:record}});await pending;assert.equal(p.data.detail,null,'unloaded page must not accept late responses')
 const markup=fs.readFileSync('pages/lap-detail/lap-detail.wxml','utf8');assert(markup.indexOf('media-section')<markup.indexOf('basic-section'));assert(markup.indexOf('basic-section')<markup.indexOf('modification-section'))
 console.log('PASS: standalone detail by ID, media/info/modification order, link-only loading, video failure isolation/retry, exact brake fields, optional mods, private/deleted errors and unload race')
}
run().catch(e=>{console.error(e);process.exitCode=1})
