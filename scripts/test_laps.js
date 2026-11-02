const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const validation = require('../utils/laps')
const base = {track:0,driver:'车手',vehicle:'Elantra N',date:'2026-01-01',temperature:'-2',lap:'01:32.456',modifications:'原厂',tires:'PS4S',condition:'干地'}
assert.equal(validation.lapMs(base.lap),92456)
for(const input of ['1:32.456','01：32.456','０１：３２．４５６','92.456'])assert.equal(validation.lapMs(input),92456)
for(const [input,output] of [['1:32.4','01:32.400'],['92.45','01:32.450'],['1:32','01:32.000'],['8:09.001','08:09.001']])assert.equal(validation.validate({...base,lap:input}).lap,output)
for(const input of ['1:60.000','1:32.4567','01:32.456x','100:00.000','6000','-92.456'])assert.throws(()=>validation.lapMs(input))
assert(validation.lapMs('01:32.455') < validation.lapMs(base.lap))
for (const lap of ['00:00.000','01:60.000','NaN','-1:32.000']) assert.throws(()=>validation.lapMs(lap))
for (const change of [{track:999},{temperature:'Infinity'},{date:'2026-02-30'},{date:'2099-01-01'},{vehicle:''},{condition:'雪地'}]) assert.throws(()=>validation.validate({...base,...change}))
for (const temperature of ['', ' ', null, undefined]) assert.equal(validation.validate({...base,temperature}).temperature,null)
assert.equal(validation.validate({...base,temperature:'0'}).temperature,0)
assert.equal(validation.formatTemperature(null),'未填气温')
assert.equal(validation.formatTemperature(0),'0℃')
assert.throws(()=>validation.validate({...base,temperature:false}))
assert.equal(validation.validate(base).temperature,-2)
assert.deepEqual(validation.validate({...base,modifications:'改装',modificationDetails:{}}).modificationDetails,{})
assert(!validation.MOD_FIELDS.some(f=>f.key==='brakes'))
assert.equal(validation.MOD_FIELDS.find(f=>f.key==='brakeCalipers').label,'刹车卡钳')
assert.equal(validation.MOD_FIELDS.find(f=>f.key==='brakePads').label,'刹车皮')
const brakeDetails=validation.validate({...base,modifications:'改装',modificationDetails:{brakeCalipers:'卡钳',brakePads:'刹车皮',brakes:'旧描述'}}).modificationDetails
assert.deepEqual(brakeDetails,{brakeCalipers:'卡钳',brakePads:'刹车皮',brakes:'旧描述'})
for(const key of ['brakeCalipers','brakePads','brakes'])assert.throws(()=>validation.validate({...base,modifications:'改装',modificationDetails:{[key]:'a'.repeat(201)}}))
assert.equal(validation.validate({...base,modifications:'改装',modificationDetails:{ecu:' Stage 1 '}}).modificationDetails.ecu,'Stage 1')
assert.deepEqual(validation.validate({...base,modifications:'原厂',modificationDetails:{ecu:'Stage 1'}}).modificationDetails,{})
assert.throws(()=>validation.validate({...base,modifications:'改装',modificationDetails:{ecu:'a'.repeat(201)}}))
assert.throws(()=>validation.validate({...base,modifications:'其他'}))
assert.equal(validation.TRACKS.length,20)
assert.equal(validation.TRACKS[10],'鄂尔多斯国际赛车场')
assert.equal(validation.validate({...base,track:10}).track,10)
assert.equal(fs.readFileSync(path.join(__dirname,'../utils/laps.js'),'utf8'),fs.readFileSync(path.join(__dirname,'../cloudfunctions/lapBoard/validation.js'),'utf8'))
assert.equal(validation.validate(base).videoLink,'')
for(const input of ['https://v.douyin.com/Ab12/','【圈速视频】 https://v.douyin.com/Ab12/ 复制打开抖音'])assert.equal(validation.normalizeVideoLink(input),'https://v.douyin.com/Ab12/')
assert.equal(validation.normalizeVideoLink('看看这个 https://b23.tv/abc。'),'https://b23.tv/abc')
assert.equal(validation.normalizeVideoLink('伊兰特N首试易车金港 #赛道第一视角 https://v.douyin.com/tJeyV1wK-u8/ 复制此链接，打开Dou音搜索，直接观看视频！'),'https://v.douyin.com/tJeyV1wK-u8/')
assert.equal(validation.normalizeVideoLink('https://www.bilibili.com/video/BVabc/?p=1&t=2'),'https://www.bilibili.com/video/BVabc/?p=1&t=2')
for(const input of ['只有分享口令','javascript:alert(1)','file:///tmp/a.mp4','https://u:password@example.com/x','https://one.com https://two.com',{},'a'.repeat(4097)])assert.throws(()=>validation.normalizeVideoLink(input))
assert.equal(validation.normalizeVideoLink('分享 #小程序://视频平台/视频详情/ABC123 看看吧'),'#小程序://视频平台/视频详情/ABC123')
assert.throws(()=>validation.normalizeVideoLink('#小程序://缺少路径'))
assert.throws(()=>validation.normalizeVideoLink('#小程序://平台/ABC https://b23.tv/other'))
let owner='user-A', docs=new Map(), lastWhere, projection, deleted=[], deleteFails=false
const collection = {
 doc(id){return {
   async set({data}){docs.set(id,{_id:id,...data})},
   async get(){if(!docs.has(id))throw Error('missing');return {data:{...docs.get(id)}}},
   async update({data}){docs.set(id,{...docs.get(id),...data})},
   async remove(){docs.delete(id)}
 }},
 where(w){lastWhere=w;return this},field(f){projection=f;return this},orderBy(){return this},skip(){return this},limit(){return this},async get(){return {data:[]}},
 async update({data}){let updated=0;for(const [id,row] of docs){if(Object.entries(lastWhere).every(([k,v])=>v&&v.existsFalse?row[k]===undefined:row[k]===v)){docs.set(id,{...row,...data});updated++}}return {stats:{updated}}}
}
const cloud = {DYNAMIC_CURRENT_ENV:'env',init(){},getWXContext(){return {OPENID:owner,ENV:'env'}},database(){return {collection(){return collection},serverDate(){return 'server-time'},command:{exists(){return {existsFalse:true}}}}},async getTempFileURL({fileList}){return {fileList:fileList.map(x=>({status:0,tempFileURL:'https://example.com/video'}))}},async deleteFile({fileList}){if(deleteFails)throw Error('storage down');deleted.push(...fileList);return {fileList:fileList.map(fileID=>({fileID,status:0}))}}}
const box={exports:{},console:{error(){}},require(name){if(name==='wx-server-sdk')return cloud;if(name==='./validation')return validation;return require(name)}}
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cloudfunctions/lapBoard/index.js'),'utf8'),box)
const main=box.exports.main
async function run(){
 const intent=await main({action:'prepare'})
 assert(intent.ok)
 const fileID='cloud://env.bucket/'+intent.path
 owner='user-B'
 assert.equal((await main({action:'submit',id:intent.id,fileID,value:base})).ok,false,'other user cannot publish')
 owner='user-A'
 assert.equal((await main({action:'submit',id:intent.id,fileID:'cloud://env.bucket/laps/someone/video.mp4',value:base})).ok,false,'unrelated video rejected')
 assert.equal((await main({action:'submit',id:intent.id,fileID,value:{...base,lap:'bad'}})).ok,false)
 assert.equal((await main({action:'submit',id:intent.id,fileID,value:base})).ok,true)
 assert.equal(docs.get(intent.id).lapMs,92456)
 const publicDetail=await main({action:'detail',id:intent.id});assert.equal(publicDetail.ok,true);assert.equal(publicDetail.detail.lapMs,92456)
 for(const key of ['owner','path','fileID','status','cleanupFileIDs'])assert.equal(publicDetail.detail[key],undefined,'private fields must not be exposed: '+key)
 assert.equal((await main({action:'submit',id:intent.id,fileID,value:base})).ok,true)
 assert.equal(docs.size,1,'retry does not create another result')
 await main({action:'list',mine:true})
 assert.equal(lastWhere.owner,'user-A')
 assert.equal(projection.owner,undefined)
 assert.equal(projection.fileID,undefined)
 assert.equal(projection.videoLink,true)
 await main({action:'list',track:0,layout:'全场'})
 assert.equal(lastWhere.layout,undefined)
 assert.equal(lastWhere.track,0)
 assert.equal(lastWhere.status,'published')
 assert.equal(lastWhere.owner,undefined)
 assert.equal((await main({action:'list',track:0,offset:-1})).ok,false)
 assert.equal((await main({action:'video',id:intent.id})).ok,true)
 const unpublished=await main({action:'prepare'})
 assert.equal((await main({action:'video',id:unpublished.id})).ok,false)
 assert.equal((await main({action:'detail',id:unpublished.id})).ok,false)
 // No-video records can publish, edit and delete; no storage requests are needed.
 const noVideo=await main({action:'prepare'})
 assert.equal((await main({action:'submit',id:noVideo.id,value:{...base,videoLink:'分享视频 https://b23.tv/lap123 复制打开'}})).ok,true)
 assert.equal(docs.get(noVideo.id).hasVideo,false)
 assert.equal(docs.get(noVideo.id).videoLink,'https://b23.tv/lap123')
 assert.equal((await main({action:'video',id:noVideo.id})).videoLink,'https://b23.tv/lap123')
 assert.equal((await main({action:'video',id:noVideo.id})).url,'')
 owner='user-B'
 for(const action of ['update','delete'])assert.equal((await main({action,id:noVideo.id,version:1,value:base})).ok,false)
 owner='user-A'
 assert.equal((await main({action:'update',id:noVideo.id,version:1,value:{...base,lap:'01:30.001'}})).ok,true)
 assert.equal(docs.get(noVideo.id).lapMs,90001)
 assert.equal(docs.get(noVideo.id).videoLink,'','editing can remove the external link')
 assert.equal((await main({action:'update',id:noVideo.id,version:1,value:base})).ok,false,'stale edit rejected')
 assert.equal((await main({action:'delete',id:noVideo.id,version:1})).ok,false,'stale delete rejected')
 assert.equal((await main({action:'delete',id:noVideo.id,version:2})).ok,true)
 assert.equal(docs.has(noVideo.id),false)
 // Replace the video, clean up the old file only after update, then remove the attachment.
 const replacement=await main({action:'prepare'})
 const newFile='cloud://env.bucket/'+replacement.path
 assert.equal((await main({action:'update',id:intent.id,version:1,uploadId:replacement.id,fileID:newFile,value:base})).ok,true)
 assert.equal(docs.get(intent.id).fileID,newFile)
 assert(deleted.includes(fileID),'old video cleaned after successful replacement')
 assert.equal(docs.get(replacement.id).status,'consumed')
 assert.equal((await main({action:'submit',id:replacement.id,fileID:newFile,value:base})).ok,false,'consumed upload cannot republish')
 assert.equal((await main({action:'update',id:intent.id,version:2,removeVideo:true,value:base})).ok,true)
 assert.equal(docs.get(intent.id).hasVideo,false)
 assert(deleted.includes(newFile))
 // Failed storage deletion hides the record and retains a retryable tombstone.
 const pending=await main({action:'prepare'})
 const pendingFile='cloud://env.bucket/'+pending.path
 await main({action:'submit',id:pending.id,fileID:pendingFile,value:base})
 deleteFails=true
 const failedCleanup=await main({action:'delete',id:pending.id,version:1})
 assert.equal(failedCleanup.ok,true)
 assert.equal(failedCleanup.cleanupPending,true)
 assert.equal(docs.get(pending.id).status,'deleted')
 assert.equal((await main({action:'detail',id:pending.id})).ok,false)
 assert.equal((await main({action:'video',id:pending.id})).ok,false)
 deleteFails=false
 assert.equal((await main({action:'delete',id:pending.id,version:2})).ok,true)
 assert.equal(docs.has(pending.id),false)
 console.log('PASS: validation, ownership, optional video, edit/delete, stale-write protection, replacement cleanup, deletion failure recovery, board isolation and private projection')
}
run().catch(e=>{console.error(e);process.exitCode=1})

assert(validation.TRACKS[11].includes("2.4km"));assert(validation.TRACKS[19].includes("4.29km"))
