const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm')
let definition,failUpload=true,readable=true,failPublish=false,uploads=0,prepares=0,publishes=0,modal,progress,aborts=0
const screen=[],paths=[],published=[]
const wx={
 getFileSystemManager(){return {access({success,fail}){readable?success():fail({errMsg:'not found'})}}},
 setKeepScreenOn({keepScreenOn}){screen.push(keepScreenOn)},showModal(o){modal=o},showToast(){},
 cloud:{
  callFunction({data}){
   if(data.action==='prepare'){prepares++;return Promise.resolve({result:{ok:true,id:'intent',path:'laps/owner/intent.mp4'}})}
   if(data.action==='submit'){publishes++;published.push(data);return Promise.resolve({result:failPublish?{ok:false,message:'保存暂时失败'}:{ok:true}})}
   return Promise.resolve({result:{ok:true,rows:[],hasMore:false}})
  },
  uploadFile(options){
   uploads++;paths.push(options.cloudPath)
   queueMicrotask(()=>{progress({progress:36});if(failUpload)options.fail({errMsg:'cloud.uploadFile:fail undefined / uploadFile:fail interrupted'});else options.success({fileID:'cloud://env.bucket/laps/owner/intent.mp4'})})
   return {onProgressUpdate(fn){progress=fn},abort(){aborts++}}
  }
 }
}
vm.runInNewContext(fs.readFileSync('pages/laps/laps.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>definition=p,wx,getApp:()=>({globalData:{}}),console:{error(){}},Date})
function page(){
 const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),_alive:true}
 p.setData=(patch,cb)=>{for(const [key,value] of Object.entries(patch)){const keys=key.split('.');let o=p.data;for(const k of keys.slice(0,-1))o=o[k];o[keys.at(-1)]=value}if(cb)cb()}
 p.data.form={driver:'车手',vehicle:'EN',date:'2026-01-01',lap:'０１：３２．４５６',temperature:'',condition:'干地',modifications:'原厂'}
 p.data.lapParts={minutes:'01',seconds:'32',milliseconds:'456'}
 p.data.video={path:'wxfile://tmp/test.mp4',size:9042138};return p
}
async function run(){
 let p=page()
 await p.submit()
 assert.equal(p.data.form.lap,'01:32.456');assert.equal(p.data.busy,false)
 assert(modal.content.includes('上传被中断'));assert(!modal.content.includes('undefined'))
 assert.equal(p.data.form.driver,'车手');assert(p.data.video);assert.equal(publishes,0)
 assert.equal(p._pending.id,'intent');assert.deepEqual(screen,[true,false])
 failUpload=false;await p.submit()
 assert.equal(prepares,1,'retry uses same upload intent');assert.equal(uploads,2);assert.equal(publishes,1)
 assert.equal(paths[0],paths[1]);assert.equal(published[0].value.lapMs,92456)
 assert.equal(p.data.video,null);assert.equal(p.data.busy,false)
 p=page();failPublish=true;await p.submit();const count=uploads
 assert(p._pending.fileID,'successful upload retained after publication failure')
 failPublish=false;await p.submit();assert.equal(uploads,count,'publication retry does not reupload')
 p=page();readable=false;await p.submit();assert(modal.content.includes('无法读取'));assert.equal(uploads,count)
 readable=true;p=page();p.data.video=null;p.data.form.videoLink='分享视频 https://b23.tv/lap123 复制打开';await p.submit();assert.equal(uploads,count,'link-only submission does not upload video');assert.equal(published.at(-1).value.videoLink,'https://b23.tv/lap123');assert.equal(p.data.form.videoLink,'','successful submission clears the link')
 p=page();p._task={abort(){aborts++}};p.onHide();assert.equal(p._uploadHidden,true);p.onUnload();assert.equal(aborts,1)
 console.log('PASS: normalized submission, interrupted upload retains form, upload retry reuses intent, successful file reused after publication failure, unreadable-file guard, optional video, screen release and unload abort')
}
run().catch(e=>{console.error(e);process.exitCode=1})
