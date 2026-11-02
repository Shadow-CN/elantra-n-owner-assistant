const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm')
const location=require('../utils/trackLocation')
for(const [lat,lng,name] of [[39.9,116.4,'北京'],[31.23,121.47,'上海'],[30.28,120.15,'浙江'],[29.87,121.55,'浙江'],[30.67,104.07,'四川'],[23.13,113.26,'广东'],[22.54,114.05,'广东'],[32.06,118.8,'江苏'],[30.6,114.3,'湖北'],[39.12,117.2,'天津'],[39.6,109.78,'内蒙古']]){
 const province=location.provinceAt(lat,lng);assert(province,`${lat},${lng} should match`);assert.equal(location.normalize(province.name),name)
 const recommendation=location.recommend(lat,lng);assert(recommendation);assert([0,1,2,3,4,6,7,8,9,10,11].includes(recommendation.region))
}
for(const v of [[NaN,120],[100,120],[0,0],[50.33,6.94]])assert.equal(location.recommend(...v),null)
const square=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole=[[1,1],[3,1],[3,3],[1,3],[1,1]]
assert.equal(location.inPolygon(.5,.5,[square,hole]),true);assert.equal(location.inPolygon(2,2,[square,hole]),false)
let definition,pendingLocation,needsPrivacy=false,app={globalData:{}},cloudCalls=[]
const wx={getPrivacySetting({success}){success({needAuthorization:needsPrivacy,privacyContractName:'隐私指引'})},getFuzzyLocation(options){assert.equal(options.type,'gcj02');pendingLocation=options},cloud:{async callFunction(args){cloudCalls.push(args);return {result:{ok:true,rows:[],hasMore:false}}}}}
vm.runInNewContext(fs.readFileSync('pages/laps/laps.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>{definition=p},wx,getApp:()=>app,console})
function page(){const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),_alive:true,_selectionRevision:0};p.data.tab='submit';p.setData=(patch,cb)=>{Object.assign(p.data,patch);if(cb)cb()};return p}
async function run(){
 let p=page();await p.locate(true);pendingLocation.success({latitude:30.28,longitude:120.15});assert.equal(p.data.region,1);assert.equal(p.data.track,3);assert.equal(cloudCalls.length,0,'coordinates must not leave client')
 app.globalData={};p=page();await p.locate(true);pendingLocation.success({latitude:39.6,longitude:109.78});assert.equal(p.data.region,6);assert.equal(p.data.track,10);assert.equal(p.data.trackOptions[0],'鄂尔多斯国际赛车场')
 app.globalData={};p=page();await p.locate(true);p.regionChange({detail:{value:p.data.regionOptions.indexOf(p.data.regions[2])}});pendingLocation.success({latitude:39.9,longitude:116.4});assert.equal(p.data.region,2,'late GPS result must not override manual selection')
 app.globalData={};p=page();await p.locate(true);pendingLocation.fail({errMsg:'auth deny'});assert.equal(p.data.locating,false);p.regionChange({detail:{value:p.data.regionOptions.indexOf(p.data.regions[4])}});assert.equal(p.data.region,4)
 app.globalData={};needsPrivacy=true;pendingLocation=null;p=page();await p.locate(true);assert.equal(p.data.showPrivacy,true);assert.equal(pendingLocation,null);p.declinePrivacy();assert.equal(p.data.locating,false);assert.equal(pendingLocation,null)
 app.globalData={};p=page();await p.locate(true);p.agreePrivacy();assert(pendingLocation);assert.equal(cloudCalls.length,0)
 console.log('PASS: province polygons/holes, unsupported locations, same-province recommendation, local-only coordinates, privacy decline fallback, explicit consent continuation and manual-selection race protection')
}
run().catch(e=>{console.error(e);process.exitCode=1})

for(const [lat,lng,region] of [[39.12,117.2,7],[27.83,113.13,8],[30.6,114.3,9],[35.23,115.48,10],[39.94,119.6,11]]){
 const r=location.recommend(lat,lng);assert.equal(r.region,region);assert.equal(r.sameProvince,true)
}
