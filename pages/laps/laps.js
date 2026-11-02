const theme = require('../../utils/theme')
const laps = require('../../utils/laps')
const share = require('../../utils/share')
const REGIONS = ['北京','浙江','上海','四川','广东','德国','内蒙古','天津','湖南','湖北','山东','河北']
const REGION_TRACKS = [[0,1],[2,3],[4,5],[6],[7,14,15],[8,9],[10],[11,19,18],[12],[13],[16],[17]]
// Sort picker options by explicit pinyin keys, independent of platform locale support.
// Stable region/track IDs remain unchanged for GPS, saved records and shared links.
const REGION_PINYIN = ['beijing','zhejiang','shanghai','sichuan','guangdong','deguo','neimenggu','tianjin','hunan','hubei','shandong','hebei']
const TRACK_PINYIN = ['beijingruisi','beijingyichejingang','zhejiangguoji','ningboguoji','shanghaitianma','shanghaiguoji','chengdutianfuguoji','guangdongjingsuguoji','niubogelinbeihuan-full','niubogelinbeihuan-btg','eerduosiguoji','tianjinv1-2.4','zhuzhouguoji','wuhanguoji','zhuhaiguoji','guangdongguoji','shandonghezeguoji','shougang','tianjingogogo','tianjinv1-4.29']
function compareKey(a,b){return a<b?-1:a>b?1:0}
const REGION_ORDER = REGIONS.map((_,i)=>i).sort((a,b)=>compareKey(REGION_PINYIN[a],REGION_PINYIN[b]))
REGION_TRACKS.forEach(ids=>ids.sort((a,b)=>compareKey(TRACK_PINYIN[a]||laps.TRACKS[a],TRACK_PINYIN[b]||laps.TRACKS[b])))
function call(data) {
  if (!wx.cloud) return Promise.reject(new Error('当前微信版本不支持云开发，请升级微信'))
  return wx.cloud.callFunction({name:'lapBoard',data}).then(res => {
    if (!res.result || !res.result.ok) throw new Error(res.result && res.result.message || '云端服务未就绪')
    return res.result
  })
}
Page({
  data:{themeMode:'auto',tracks:laps.TRACKS,regions:REGIONS,regionOptions:REGION_ORDER.map(i=>REGIONS[i]),regionPicker:0,region:0,regionTrack:0,trackOptions:REGION_TRACKS[0].map(i=>laps.TRACKS[i]),track:0,tab:'board',rows:[],hasMore:false,loading:false,error:'',busy:false,showPrivacy:false,locating:false,locationHint:'',privacyTitle:'选择视频前，请阅读隐私指引',privacyCopy:'圈速榜会使用你主动选择或拍摄的视频。只有提交成绩时才会上传，上传后其他用户可查看。视频为选填，不同意也可继续提交成绩。',privacyAgreeText:'同意并选择视频',privacyContractName:'隐私保护指引',editId:'',editVersion:0,existingVideo:false,removeVideo:false,progress:0,video:null,lapParts:{minutes:'',seconds:'',milliseconds:''},lapError:'',conditions:['干地','湿地'],modTypes:['原厂','改装'],modFields:laps.MOD_FIELDS,form:{driver:'',vehicle:'',date:'',temperature:'',videoLink:'',lap:'',modifications:'原厂',modificationDetails:{},condition:'干地'}},
  onLoad(options) {
    share.enableShareMenu()
    this._alive = true
    this._applyTheme()
    const now = new Date(Date.now()+8*3600000).toISOString().slice(0,10)
    this.setData({'form.date':now,today:now})
    const value=options&&options.track
    const track=typeof value==='string'&&/^\d+$/.test(value)?Number(value):-1
    const region=REGION_TRACKS.findIndex(ids=>ids.includes(track))
    const sharedTrack=region>=0
    if(sharedTrack)this.setData({region,regionPicker:REGION_ORDER.indexOf(region),regionTrack:REGION_TRACKS[region].indexOf(track),track,trackOptions:REGION_TRACKS[region].map(i=>laps.TRACKS[i])})
    this._selectionRevision=sharedTrack?1:0
    this.load(true)
    if(!sharedTrack)this.locate(true)
  },
  onShareAppMessage(){return {title:laps.TRACKS[this.data.track]+' · 圈速榜',path:'/pages/laps/laps?track='+this.data.track}},
  onShareTimeline(){return {title:laps.TRACKS[this.data.track]+' · 圈速榜',query:'track='+this.data.track}},
  onShow(){this._visible=true;this._applyTheme()},
  onHide(){this._visible=false;if(this._task)this._uploadHidden=true},
  _applyTheme(){const mode=getApp().globalData.themeMode||'auto';this.setData(Object.assign({themeMode:mode,pageStyle:theme.getPageStyle(mode)},theme.navColors(theme.isDarkEffective(mode))))},
  onThemeToggle(){
    const app=getApp()
    const mode=theme.nextMode(app.globalData.themeMode||'auto')
    app.globalData.themeMode=mode
    theme.saveMode(mode)
    this._applyTheme()
  },
  onUnload(){this._alive=false;if(this._task)this._task.abort()},
  notify(e){if(this._alive)wx.showModal({title:'提示',content:e.message || '网络异常，请重试',showCancel:false})},
  changeTab(e){if(this.data.busy)return;this._loadId=(this._loadId||0)+1;if(this.data.editId)this.cancelEdit();this.setData({tab:e.currentTarget.dataset.tab,loading:false});if(this.data.tab!=='submit')this.load(true)},
  regionChange(e){if(this.data.busy)return;this._selectionRevision=(this._selectionRevision||0)+1;const region=REGION_ORDER[Number(e.detail.value)];this.setData({region,regionPicker:REGION_ORDER.indexOf(region),regionTrack:0,track:REGION_TRACKS[region][0],trackOptions:REGION_TRACKS[region].map(i=>laps.TRACKS[i])});if(this.data.tab!=='submit')this.load(true)},
  trackChange(e){if(this.data.busy)return;this._selectionRevision=(this._selectionRevision||0)+1;const regionTrack=Number(e.detail.value);this.setData({regionTrack,track:REGION_TRACKS[this.data.region][regionTrack]});if(this.data.tab!=='submit')this.load(true)},
  formInput(e){if(!this.data.busy)this.setData({['form.'+e.currentTarget.dataset.field]:e.detail.value})},
  lapPartInput(e){
    if(this.data.busy)return
    const key=e.currentTarget.dataset.part
    if(!['minutes','seconds','milliseconds'].includes(key))return
    const digits=String(e.detail.value).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).replace(/[^0-9]/g,'').slice(0,key==='milliseconds'?3:2)
    this.setData({['lapParts.'+key]:digits,lapError:Number(key==='seconds'?digits:this.data.lapParts.seconds)>59?'秒数请填写 00—59':''})
    return digits
  },
  _lapValue(){
    const parts=this.data.lapParts
    if(!parts.minutes&&!parts.seconds&&!parts.milliseconds)throw new Error('请填写圈速')
    if(!/^\d{0,2}$/.test(parts.minutes)||!/^\d{0,2}$/.test(parts.seconds)||!/^\d{0,3}$/.test(parts.milliseconds))throw new Error('圈速各栏请只填写数字')
    if(Number(parts.seconds)>59)throw new Error('秒数请填写 00—59')
    const ms=Number(parts.minutes||0)*60000+Number(parts.seconds||0)*1000+Number(parts.milliseconds||0)
    if(ms<=0)throw new Error('圈速必须大于零')
    return laps.formatLap(ms)
  },
  _lapParts(value){
    const text=laps.formatLap(laps.lapMs(value))
    return {minutes:text.split(':')[0],seconds:text.split(':')[1].split('.')[0],milliseconds:text.split('.')[1]}
  },
  modTypeChange(e){if(!this.data.busy)this.setData({'form.modifications':this.data.modTypes[Number(e.detail.value)]})},
  modInput(e){if(!this.data.busy)this.setData({['form.modificationDetails.'+e.currentTarget.dataset.field]:e.detail.value})},
  conditionChange(e){this.setData({'form.condition':this.data.conditions[Number(e.detail.value)]})},
  async load(reset){
    if(this.data.loading&&!reset)return
    const token=this._loadId=(this._loadId||0)+1
    const rows=reset?[]:this.data.rows
    this.setData({loading:true,error:'',...(reset?{rows:[],hasMore:false}:{})})
    try {
      const res=await call({action:'list',mine:this.data.tab==='mine',track:this.data.track,offset:rows.length})
      if(this._alive&&token===this._loadId)this.setData({rows:rows.concat(res.rows.map((r,i)=>Object.assign(r,{rank:rows.length+i+1,trackName:laps.TRACKS[r.track],temperatureLabel:laps.formatTemperature(r.temperature)}))),hasMore:res.hasMore})
    }catch(e){if(this._alive&&token===this._loadId)this.setData({error:e.message||'加载失败，请重试'})}
    finally{if(this._alive&&token===this._loadId)this.setData({loading:false})}
  },
  search(){this.load(true)},
  more(){this.load(false)},
  choose(){
    if(this.data.busy||this._choosingMedia)return
    if(typeof wx.chooseMedia!=='function'){this.notify(new Error('当前微信版本不支持选择视频，请升级微信'));return}
    this._choosingMedia=true
    this._privacyAction='media'
    this.setData({privacyTitle:'选择视频前，请阅读隐私指引',privacyCopy:'圈速榜会使用你主动选择或拍摄的视频。只有提交成绩时才会上传，上传后其他用户可查看。视频为选填，不同意也可继续提交成绩。',privacyAgreeText:'同意并选择视频'})
    if(typeof wx.getPrivacySetting!=='function'){this._chooseVideo();return}
    wx.getPrivacySetting({
      success:res=>{
        if(!this._alive){this._choosingMedia=false;return}
        if(res.needAuthorization)this.setData({showPrivacy:true,privacyContractName:res.privacyContractName||'隐私保护指引'})
        else this._chooseVideo()
      },
      fail:e=>{this._choosingMedia=false;this._mediaFailure(e)}
    })
  },
  async locate(automatic){
    automatic=automatic===true
    if(this.data.busy||this.data.editId||this.data.locating||this._choosingMedia)return
    const app=getApp()
    if(automatic&&app.globalData.lapLocationAsked)return
    app.globalData.lapLocationAsked=true
    this._locationRevision=this._selectionRevision||0
    this.setData({locating:true,locationHint:'正在按省份推荐赛道…'})
    try{
      if(typeof wx.getFuzzyLocation!=='function')throw new Error('微信版本暂不支持模糊定位')
      const privacy=typeof wx.getPrivacySetting==='function'?await new Promise((resolve,reject)=>wx.getPrivacySetting({success:resolve,fail:reject})):{needAuthorization:false}
      if(!this._alive)return
      if(this._choosingMedia||this._locationRevision!==(this._selectionRevision||0)){this.setData({locating:false,locationHint:''});return}
      this._privacyAction='location'
      if(privacy.needAuthorization)this.setData({showPrivacy:true,privacyTitle:'按所在省份推荐赛道',privacyCopy:'同意后使用微信模糊定位，在手机本地识别省份，优先推荐同省或附近地区的赛道。不向云端上传或保存你的坐标。拒绝也可手动选择。',privacyAgreeText:'同意并推荐赛道',privacyContractName:privacy.privacyContractName||'隐私保护指引'})
      else this._getFuzzyLocation()
    }catch(e){if(this._alive)this.setData({locating:false,locationHint:'定位暂不可用，可手动选择地区和赛道'})}
  },
  _getFuzzyLocation(){
    if(!this._alive)return
    wx.getFuzzyLocation({type:'gcj02',success:position=>{
      if(!this._alive)return
      if(this._locationRevision!==(this._selectionRevision||0)||this.data.editId||this.data.busy){this.setData({locating:false,locationHint:'已保留你手动选择的赛道'});return}
      const result=require('../../utils/trackLocation').recommend(position.latitude,position.longitude)
      if(!result){this.setData({locating:false,locationHint:'暂未识别所在省份，请手动选择地区和赛道'});return}
      const region=result.region
      this.setData({region,regionPicker:REGION_ORDER.indexOf(region),track:REGION_TRACKS[region][0],regionTrack:0,trackOptions:REGION_TRACKS[region].map(i=>laps.TRACKS[i]),locating:false,locationHint:result.province+' · '+(result.sameProvince?'优先推荐同省赛道':'按省份推荐附近地区赛道')})
      if(this.data.tab==='board')this.load(true)
    },fail:()=>{if(this._alive)this.setData({locating:false,locationHint:'未获取到位置，可手动选择地区和赛道'})}})
  },
  openPrivacy(){
    if(typeof wx.openPrivacyContract==='function')wx.openPrivacyContract({fail:e=>this._mediaFailure(e)})
    else this.notify(new Error('当前微信版本不支持查看隐私保护指引，请升级微信'))
  },
  agreePrivacy(){
    // Called only by the official agreePrivacyAuthorization button event.
    this.setData({showPrivacy:false})
    if(this._privacyAction==='location')this._getFuzzyLocation()
    else this._chooseVideo()
  },
  declinePrivacy(){this._choosingMedia=false;this.setData({showPrivacy:false,locating:false});if(this._privacyAction==='location')this.setData({locationHint:'未启用定位，可手动选择地区和赛道'})},
  stopPrivacyTap(){},
  _chooseVideo(){
    if(!this._alive){this._choosingMedia=false;return}
    wx.chooseMedia({count:1,mediaType:['video'],sourceType:['album','camera'],sizeType:['original'],
      success:res=>{
        const v=res.tempFiles&&res.tempFiles[0]
        if(v&&this._alive)this.setData({video:{path:v.tempFilePath,size:v.size,sizeLabel:(v.size/1000000).toFixed(2)+' MB'},progress:0,removeVideo:false})
      },
      fail:e=>this._mediaFailure(e),
      complete:()=>{this._choosingMedia=false}
    })
  },
  _mediaFailure(e){
    const message=e.errMsg||e.message||'未知错误'
    if(/cancel/i.test(message))return
    console.error('[laps] media selection failed',{errMsg:message,errCode:e.errCode,errno:e.errno})
    if(!this._alive)return
    if(/not declared|privacy agreement.*(config|scope)|privacy.*not.*configured/i.test(message)){
      this.notify(new Error('小程序的隐私保护指引尚未声明选择照片或视频的用途，请联系开发者完善配置。'))
    }else if(/privacy/i.test(message)){
      this.notify(new Error('选择视频需要先同意隐私保护指引。你也可以暂不上传视频，直接提交成绩。'))
    }else if(/auth|permission|denied|deny/i.test(message)){
      let system={}
      try{if(wx.getAppAuthorizeSetting)system=wx.getAppAuthorizeSetting()}catch(ignore){}
      const denied=[]
      if(system.albumAuthorized==='denied')denied.push('照片或相册')
      if(system.cameraAuthorized==='denied')denied.push('摄像头')
      if(system.microphoneAuthorized==='denied')denied.push('麦克风')
      const systemDenied=denied.length>0||/system/i.test(message)
      wx.showModal({title:'需要媒体访问权限',content:systemDenied?'请在手机系统设置中允许微信访问'+(denied.join('、')||'照片或摄像头')+'，然后返回重试。视频仍可跳过。':'请检查此小程序的摄像头授权；如果从相册选择，请同时检查手机系统中微信的照片权限。视频仍可跳过。',confirmText:'打开设置',cancelText:'暂不上传',success:r=>{
        if(!r.confirm)return
        if(systemDenied&&typeof wx.openAppAuthorizeSetting==='function')wx.openAppAuthorizeSetting({fail:err=>this.notify(new Error(err.errMsg||'请手动打开手机系统设置，找到微信的照片或摄像头权限'))})
        else if(!systemDenied&&typeof wx.openSetting==='function')wx.openSetting({})
        else this.notify(new Error('请打开手机系统设置，找到微信并允许照片或摄像头访问。'))
      }})
    }else{
      this.notify(new Error('视频选择失败，请重试。错误信息：'+message))
    }
  },
  _keepScreenOn(keepScreenOn){
    if(typeof wx.setKeepScreenOn==='function')wx.setKeepScreenOn({keepScreenOn,fail:()=>{}})
  },
  async upload(path,filePath){
    // Check metadata only: never load a large video into JS memory or modify it.
    if(!filePath)throw new Error('未读取到视频，请重新选择视频')
    await new Promise((resolve,reject)=>wx.getFileSystemManager().access({path:filePath,success:resolve,fail:()=>reject(new Error('所选视频已无法读取，请重新从相册选择后重试'))}))
    if(!this._alive)throw new Error('页面已关闭，上传已取消')
    this._uploadHidden=false
    this._keepScreenOn(true)
    const started=Date.now()
    try{
      return await new Promise((resolve,reject)=>{
        this._task=wx.cloud.uploadFile({cloudPath:path,filePath,success:res=>{
          if(!res.fileID){reject(new Error('视频上传未返回文件编号，请重试'));return}
          resolve(res)
        },fail:e=>{
          e=e||{}
          const raw=[e.errMsg,e.message].filter(Boolean).join(' / ') || '未知上传错误'
          // Keep diagnostics free of local paths, signed links and credentials.
          console.error('[laps] video upload failed',{errCode:e.errCode,errno:e.errno,elapsedMs:Date.now()-started,progress:this.data.progress,size:this.data.video&&this.data.video.size,hidden:this._uploadHidden})
          let message
          if(/interrupt|abort/i.test(raw))message='视频上传被中断'+(this._uploadHidden?'（上传期间小程序曾进入后台）':'')+'。请保持微信和此页面在前台、网络稳定，再点提交重试；表单已保留。'
          else if(/timeout|timed out/i.test(raw))message='视频上传超时，请换用稳定网络后重试；表单已保留。'
          else if(/no such file|not found|file.*exist/i.test(raw))message='所选视频已无法读取，请重新选择视频后重试。'
          else message='视频上传失败，请重试。错误信息：'+raw
          reject(new Error(message))
        }})
        if(this._task&&this._task.onProgressUpdate)this._task.onProgressUpdate(r=>{if(this._alive)this.setData({progress:r.progress})})
      })
    }finally{this._task=null;this._keepScreenOn(false)}
  },
  async submit(){
    if(this.data.busy)return
    let value
    try{value=laps.validate(Object.assign({},this.data.form,{track:this.data.track,lap:this._lapValue()}));this.setData({'form.lap':value.lap})}catch(e){this.notify(e);return}
    this.setData({busy:true,progress:0})
    try {
      // Keep the uploaded file and intent on publish failures so retry never uploads it twice.
      if(!this._pending||this._pending.localPath!==(this.data.video&&this.data.video.path)||this._pending.editId!==this.data.editId){
        const intent=(!this.data.editId||this.data.video)?await call({action:'prepare'}):{}
        this._pending={id:intent.id,path:intent.path,localPath:this.data.video&&this.data.video.path,editId:this.data.editId}
      }
      if(this.data.video&&!this._pending.fileID){const file=await this.upload(this._pending.path,this._pending.localPath);this._pending.fileID=file.fileID}
      const result = this.data.editId
        ? await call({action:'update',id:this.data.editId,version:this.data.editVersion,value,uploadId:this.data.video?this._pending.id:undefined,fileID:this._pending.fileID,removeVideo:this.data.removeVideo})
        : await call({action:'submit',id:this._pending.id,fileID:this._pending.fileID,value})
      this._pending=null
      if(this._alive){this.setData({tab:'mine',editId:'',existingVideo:false,removeVideo:false,video:null,progress:0,'form.videoLink':'','form.lap':'',lapParts:{minutes:'',seconds:'',milliseconds:''},lapError:''});wx.showToast({title:'已保存',icon:'success'});this.load(true);if(result.cleanupPending)this.notify(new Error('成绩已保存，旧视频清理暂未完成，请稍后联系管理员清理'))}
    }catch(e){this.notify(new Error(e.message||e.errMsg||'上传失败，请重试；较大视频可能受微信平台或网络限制'))}
    finally{this._task=null;if(this._alive)this.setData({busy:false})}
  },
  edit(e){
    if(this.data.busy)return
    this._selectionRevision=(this._selectionRevision||0)+1
    const row=this.data.rows.find(r=>r._id===e.currentTarget.dataset.id)
    if(!row)return
    const region=REGION_TRACKS.findIndex(ids=>ids.includes(row.track))
    const form={};['driver','vehicle','date','temperature','lap','condition'].forEach(k=>{form[k]=row[k]});form.videoLink=row.videoLink||'';form.modifications=row.modifications==='原厂'?'原厂':'改装';form.modificationDetails=Object.assign({},row.modificationDetails||{})
    this._pending=null
    this.setData({tab:'submit',editId:row._id,editVersion:row.version||0,form,lapParts:this._lapParts(row.lap),lapError:'',region,regionPicker:REGION_ORDER.indexOf(region),regionTrack:REGION_TRACKS[region].indexOf(row.track),track:row.track,trackOptions:REGION_TRACKS[region].map(i=>laps.TRACKS[i]),existingVideo:!!row.hasVideo,removeVideo:false,video:null,scrollTarget:''})
  },
  clearVideo(){if(!this.data.busy){this._pending=null;this.setData({video:null,removeVideo:!this.data.video && this.data.existingVideo,progress:0})}},
  cancelEdit(){
    if(this.data.busy)return
    this._pending=null
    this.setData({editId:'',existingVideo:false,removeVideo:false,video:null,lapParts:{minutes:'',seconds:'',milliseconds:''},lapError:'',form:{driver:'',vehicle:'',date:this.data.today,temperature:'',videoLink:'',lap:'',modifications:'原厂',modificationDetails:{},condition:'干地'}})
  },
  remove(e){
    if(this.data.busy)return
    const row=this.data.rows.find(r=>r._id===e.currentTarget.dataset.id)
    if(!row)return
    wx.showModal({title:'删除这条成绩？',content:'删除后将从榜单移除，对应视频也会删除。此操作无法撤销。',confirmText:'删除',confirmColor:'#e63312',success:async res=>{
      if(!res.confirm||this.data.busy)return
      this.setData({busy:true})
      try{const result=await call({action:'delete',id:row._id,version:row.version||0});this.load(true);wx.showToast({title:'已删除'});if(result.cleanupPending)this.notify(new Error('成绩已从榜单移除，视频清理暂未完成，请稍后联系管理员处理'))}
      catch(e){this.notify(e)}finally{if(this._alive)this.setData({busy:false})}
    }})
  },
  openDetail(e){
    if(this.data.busy)return
    const id=e.currentTarget.dataset.id
    if(!id)return
    wx.navigateTo({url:'/pages/lap-detail/lap-detail?id='+encodeURIComponent(id),fail:()=>this.notify(new Error('详情页暂时无法打开，请重试'))})
  }
})
