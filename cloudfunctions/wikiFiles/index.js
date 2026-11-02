const cloud=require('wx-server-sdk')
const files=require('./files.json')
const assets=require('./assets.json')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const has=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k)
exports.main=async(event={})=>{
  try{
    if(Array.isArray(event.keys)){
      const keys=[...new Set(event.keys)]
      if(!keys.length||keys.length>50||keys.some(k=>!has(assets,k)))return {ok:false,message:'资料参数无效'}
      const result=await cloud.getTempFileURL({fileList:keys.map(k=>assets[k])})
      const byID=new Map(result.fileList.map(f=>[f.fileID,f]))
      const urls={};for(const key of keys){const f=byID.get(assets[key]);if(!f||f.status!==0||!f.tempFileURL)return {ok:false,message:'部分资料暂不可用，请重试'};urls[key]=f.tempFileURL}
      return {ok:true,urls,maxAge:3600}
    }
    const fileID=has(files,event.key)?files[event.key]:null
    if(!fileID)return {ok:false,message:'该资料尚未配置，请稍后重试'}
    const result=await cloud.getTempFileURL({fileList:[fileID]});const f=result.fileList[0]
    if(!f||f.status!==0||!f.tempFileURL)return {ok:false,message:'资料暂不可用，请稍后重试'}
    return {ok:true,url:f.tempFileURL}
  }catch(e){return {ok:false,message:'资料暂不可用，请稍后重试'}}
}
