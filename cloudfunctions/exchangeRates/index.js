const cloud=require('wx-server-sdk')
const service=require('./rates')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database();let memory=null,inflight=null
const TTL=6*3600000,MAX_STALE=7*86400000
function valid(data){return data&&Number.isFinite(data.fetchedAt)&&service.CODES.every(c=>Number.isFinite(data.rates&&data.rates[c])&&data.rates[c]>0)}
function output(data,stale){return {ok:true,rates:data.rates,dates:data.dates,date:data.date,fetchedAt:data.fetchedAt,source:data.source,stale}}
exports.main=async()=>{
 let cached=memory
 if(!cached){try{const r=await db.collection('exchange_rates').doc('latest').get();if(valid(r.data))cached=r.data}catch(e){}}
 if(valid(cached)&&Date.now()-cached.fetchedAt<TTL){memory=cached;return output(cached,false)}
 try{
  if(!inflight)inflight=service.fetchRates().then(service.normalize).finally(()=>{inflight=null})
  const fresh=await inflight;memory=fresh
  try{await db.createCollection('exchange_rates')}catch(e){}
  try{await db.collection('exchange_rates').doc('latest').set({data:fresh})}catch(e){console.warn('Exchange cache persistence unavailable')}
  return output(fresh,false)
 }catch(e){
  if(valid(cached)&&Date.now()-cached.fetchedAt<MAX_STALE)return output(cached,true)
  return {ok:false,message:'暂时无法获取汇率，请稍后重试'}
 }
}
