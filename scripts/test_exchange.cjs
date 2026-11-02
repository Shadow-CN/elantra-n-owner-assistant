const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path')
const exchange=require('../utils/exchange'),service=require('../cloudfunctions/exchangeRates/rates')
assert.equal(exchange.CURRENCIES.length,9)
const rows=service.CODES.filter(c=>c!=='CNY').map((quote,i)=>({base:'CNY',quote,rate:i+2,date:'2026-11-02'}))
const data=service.normalize(rows);assert.equal(data.rates.CNY,1)
assert.equal(exchange.convert('100','KRW','CNY',{KRW:200,CNY:1}),'0.50');assert.equal(exchange.convert('10','USD','EUR',{USD:2,EUR:3}),'15.00');assert.equal(exchange.convert('0','CNY','KRW',{CNY:1,KRW:200}),'0.00');assert.equal(exchange.convert('10','CNY','CNY'),'10.00')
for(const input of ['-1','1e3','Infinity','1.12345','1234567890123','abc'])assert.throws(()=>exchange.convert(input,'CNY','KRW',data.rates))
assert.throws(()=>service.normalize(rows.slice(1)));assert.throws(()=>service.normalize(rows.map(r=>({...r,rate:NaN}))));assert.throws(()=>exchange.convert('1','USD','EUR',{USD:0,EUR:2}))
let cached=null,fetches=0,offline=false
const db={collection(){return {doc(){return {async get(){if(!cached)throw Error('missing');return {data:cached}},async set(o){cached=o.data}}}}},async createCollection(){}}
function server(){const module={exports:{}};vm.runInNewContext(fs.readFileSync('cloudfunctions/exchangeRates/index.js','utf8'),{exports:module.exports,console,require:n=>n==='wx-server-sdk'?{DYNAMIC_CURRENT_ENV:'test',init(){},database:()=>db}:Object.assign({},service,{async fetchRates(){fetches++;if(offline)throw Error('offline');return rows}})});return module.exports}
async function run(){const a=server();assert.equal((await a.main()).ok,true);assert.equal(fetches,1);assert.equal((await a.main()).stale,false);assert.equal(fetches,1);cached.fetchedAt-=7*3600000;offline=true;assert.equal((await server().main()).stale,true);cached.fetchedAt-=8*86400000;assert.equal((await server().main()).ok,false)
 console.log('PASS: nine currencies, cross-rate conversion, invalid input, complete daily feed, server cache and stale-rate fallback')}
run().catch(e=>{console.error(e);process.exitCode=1})
