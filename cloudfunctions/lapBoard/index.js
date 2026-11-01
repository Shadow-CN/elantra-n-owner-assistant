const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const {validate, TRACKS} = require('./validation')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db = cloud.database()
const records = db.collection('lap_records')
const publicFields = {track:true,driver:true,vehicle:true,date:true,temperature:true,condition:true,lap:true,lapMs:true,modifications:true,modificationDetails:true,hasVideo:true,videoLink:true,version:true}
async function checkedVideo(fileID, row) {
  const env = cloud.getWXContext().ENV
  if (!fileID.startsWith('cloud://' + env + '.') || !fileID.endsWith('/' + row.path)) throw new Error('视频文件与本次上传不匹配')
  const files = await cloud.getTempFileURL({fileList:[fileID]})
  if (!files.fileList[0] || files.fileList[0].status !== 0) throw new Error('视频尚未上传完成')
}
function guard(row, owner) {
  return {_id:row._id,owner,status:row.status,version:row.version === undefined ? db.command.exists(false) : row.version}
}
async function cleanup(ids) {
  if (!ids.length) return false
  try {
    const res = await cloud.deleteFile({fileList:ids})
    return res.fileList.some(f => f.status !== 0)
  } catch (e) { console.error('video cleanup failed',e); return true }
}
exports.main = async (event) => {
  try {
    const owner = cloud.getWXContext().OPENID
    if (!owner) throw new Error('无法识别微信用户，请重新进入小程序')
    if (event.action === 'prepare') {
      const id = crypto.randomBytes(16).toString('hex')
      const path = `laps/${owner}/${id}.mp4`
      await records.doc(id).set({data:{owner,path,status:'uploading',createdAt:db.serverDate()}})
      return {ok:true,id,path}
    }
    if (event.action === 'submit') {
      const value = validate(event.value || {})
      const {data:row} = await records.doc(String(event.id)).get()
      if (row.owner !== owner) throw new Error('无权提交此记录')
      if (row.status === 'published') return {ok:true,id:row._id}
      const fileID = String(event.fileID || '')
      if (fileID) await checkedVideo(fileID,row)
      if (row.status !== 'uploading') throw new Error('该成绩不可提交')
      await records.doc(row._id).update({data:Object.assign(value,{fileID,hasVideo:!!fileID,version:1,status:'published',publishedAt:db.serverDate()})})
      return {ok:true,id:row._id}
    }
    if (event.action === 'update' || event.action === 'delete') {
      const {data:row} = await records.doc(String(event.id)).get()
      if (row.owner !== owner) throw new Error('无权修改或删除其他人的成绩')
      if (event.action === 'delete') {
        if (!['published','deleted'].includes(row.status)) throw new Error('该成绩不可删除')
        if (row.status === 'published') {
          if ((row.version || 0) !== event.version) throw new Error('该成绩已更新，请刷新后重试')
          const changed=await records.where(guard(row,owner)).update({data:{status:'deleted',version:(row.version||0)+1,deletedAt:db.serverDate()}})
          if (!changed.stats.updated) throw new Error('该成绩已更新，请刷新后重试')
        }
        const pending=await cleanup([row.fileID,...(row.cleanupFileIDs||[])].filter(Boolean))
        if (!pending) await records.doc(row._id).remove()
        return {ok:true,cleanupPending:pending}
      }
      if (row.status !== 'published') throw new Error('该成绩不可编辑')
      if ((row.version || 0) !== event.version) throw new Error('该成绩已更新，请刷新后重试')
      const value=validate(event.value || {})
      let fileID=row.fileID || ''
      let replacement
      if (event.uploadId) {
        const res=await records.doc(String(event.uploadId)).get(); replacement=res.data
        if (replacement.owner !== owner || replacement.status !== 'uploading') throw new Error('无权使用此上传视频')
        fileID=String(event.fileID || '')
        await checkedVideo(fileID,replacement)
      } else if (event.removeVideo) fileID=''
      const retired=[...(row.cleanupFileIDs||[])]
      if (row.fileID && row.fileID !== fileID) retired.push(row.fileID)
      const version=(row.version||0)+1
      const changed=await records.where(guard(row,owner)).update({data:Object.assign(value,{fileID,hasVideo:!!fileID,version,cleanupFileIDs:retired,updatedAt:db.serverDate()})})
      if (!changed.stats.updated) throw new Error('该成绩已更新，请刷新后重试')
      if (replacement) await records.doc(replacement._id).update({data:{status:'consumed',recordId:row._id}}).catch(console.error)
      const pending=await cleanup(retired)
      if (!pending && retired.length) await records.where({_id:row._id,owner,version}).update({data:{cleanupFileIDs:[]}})
      return {ok:true,id:row._id,cleanupPending:pending}
    }
    if (event.action === 'list') {
      const offset = Number(event.offset || 0)
      if (!Number.isInteger(offset) || offset < 0 || offset > 100000) throw new Error('分页参数无效')
      const where = {status:'published'}
      if (event.mine) where.owner = owner
      else {
        if (!Number.isInteger(event.track) || event.track < 0 || event.track >= TRACKS.length) throw new Error('请选择赛道')
        where.track = event.track
      }
      const result = await records.where(where).field(publicFields).orderBy('lapMs','asc').orderBy('_id','asc').skip(offset).limit(20).get()
      return {ok:true,rows:result.data,hasMore:result.data.length === 20}
    }
    if (event.action === 'detail') {
      const {data:row} = await records.doc(String(event.id)).get()
      if (row.status !== 'published') throw new Error('该成绩不可用')
      const detail={_id:row._id}
      Object.keys(publicFields).forEach(key=>{if(row[key]!==undefined)detail[key]=row[key]})
      return {ok:true,detail}
    }
    if (event.action === 'video') {
      const {data:row} = await records.doc(String(event.id)).get()
      if (row.status !== 'published') throw new Error('该成绩不可用')
      if (!row.fileID) return {ok:true,url:'',hasVideo:false,videoLink:row.videoLink||''}
      const result = await cloud.getTempFileURL({fileList:[row.fileID]})
      const file = result.fileList[0]
      if (!file || file.status !== 0) throw new Error('视频暂时不可用')
      return {ok:true,url:file.tempFileURL,videoLink:row.videoLink||''}
    }
    throw new Error('未知操作')
  } catch (err) {
    console.error(err)
    return {ok:false,message: /^请|^圈速|^请选择|^视频|^无法|^无权|^该成绩|^改装/.test(err.message) ? err.message : '云端操作失败，请稍后重试；首次使用请确认已部署云函数及数据库索引'}
  }
}
