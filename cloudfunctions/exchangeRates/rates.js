const https=require('https')
const CODES=['CNY','KRW','USD','JPY','TWD','HKD','AUD','CAD','EUR']
const API='https://api.frankfurter.dev/v2/rates?base=CNY&quotes='+CODES.filter(c=>c!=='CNY').join(',')
function fetchRates(){return new Promise((resolve,reject)=>{
  const req=https.get(API,{headers:{'User-Agent':'HN-Owner-Assistant/1.0'}},res=>{
    if(res.statusCode!==200){res.resume();reject(new Error('汇率服务暂不可用'));return}
    let body='';res.setEncoding('utf8');res.on('data',c=>{body+=c;if(body.length>65536){res.destroy();reject(new Error('汇率响应过大'))}});res.on('end',()=>{try{resolve(JSON.parse(body))}catch(e){reject(new Error('汇率数据格式异常'))}});res.on('error',reject)
  });req.setTimeout(10000,()=>req.destroy(new Error('汇率请求超时')));req.on('error',reject)
})}
function normalize(rows){
  if(!Array.isArray(rows))throw new Error('汇率数据格式异常')
  const rates={CNY:1},dates={};const today=new Date().toISOString().slice(0,10)
  for(const row of rows){if(row.base!=='CNY'||!CODES.includes(row.quote)||row.quote==='CNY'||!Number.isFinite(row.rate)||row.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||row.date>today)throw new Error('汇率数据不完整');rates[row.quote]=row.rate;dates[row.quote]=row.date}
  if(CODES.some(c=>!rates[c]))throw new Error('汇率数据缺少币种')
  const date=Object.values(dates).sort()[0];return {rates,dates,date,fetchedAt:Date.now(),source:'Frankfurter 每日参考汇率'}
}
module.exports={CODES,fetchRates,normalize}
