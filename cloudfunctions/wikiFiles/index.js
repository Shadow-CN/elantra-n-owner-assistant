const cloud=require('wx-server-sdk')
const files=require('./files.json')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
exports.main=async event=>{
  const fileID=Object.prototype.hasOwnProperty.call(files,event.key)?files[event.key]:null
  if(!fileID)return {ok:false,message:'该资料尚未配置，请稍后重试'}
  try{
    const result=await cloud.getTempFileURL({fileList:[fileID]})
    const file=result.fileList[0]
    if(!file||file.status!==0||!file.tempFileURL)return {ok:false,message:'资料暂不可用，请稍后重试'}
    return {ok:true,url:file.tempFileURL}
  }catch(e){return {ok:false,message:'资料暂不可用，请稍后重试'}}
}
