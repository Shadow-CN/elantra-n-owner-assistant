const theme=require('../../utils/theme')
const laps=require('../../utils/laps')
function call(data){
  return wx.cloud.callFunction({name:'lapBoard',data}).then(res=>{
    if(!res.result||!res.result.ok)throw new Error(res.result&&res.result.message||'详情暂时无法加载')
    return res.result
  })
}
Page({
  data:{themeMode:'auto',loading:true,error:'',detail:null,basicFields:[],modFields:[],videoUrl:'',videoLoading:false,videoError:'',videoLinkCanOpen:false},
  onLoad(options){this._alive=true;this._id=options.id||'';this._applyTheme();this.load()},
  onShow(){this._applyTheme()},
  onUnload(){this._alive=false;this._loadToken=(this._loadToken||0)+1},
  _applyTheme(){const mode=getApp().globalData.themeMode||'auto';this.setData(Object.assign({themeMode:mode,pageStyle:theme.getPageStyle(mode)},theme.navColors(theme.isDarkEffective(mode))))},
  onThemeToggle(){const app=getApp();const mode=theme.nextMode(app.globalData.themeMode||'auto');app.globalData.themeMode=mode;theme.saveMode(mode);this._applyTheme()},
  notify(e){if(this._alive)wx.showModal({title:'提示',content:e.message||'操作失败，请重试',showCancel:false})},
  async load(){
    const token=this._loadToken=(this._loadToken||0)+1
    if(!this._id){this.setData({loading:false,error:'成绩链接不完整，请返回圈速榜重新打开'});return}
    this.setData({loading:true,error:'',detail:null,videoUrl:'',videoError:'',videoLoading:false})
    try{
      const res=await call({action:'detail',id:this._id})
      if(!this._alive||token!==this._loadToken)return
      const detail=res.detail,details=detail.modificationDetails||{}
      const modFields=laps.MOD_FIELDS.filter(f=>details[f.key]).map(f=>({label:f.label,value:details[f.key]}))
      if(details.brakes)modFields.push({label:'刹车（旧记录）',value:details.brakes})
      const basicFields=[{label:'车手昵称',value:detail.driver},{label:'赛道',value:laps.TRACKS[detail.track]||'未知赛道'},{label:'日期',value:detail.date},{label:'气温',value:laps.formatTemperature(detail.temperature)},{label:'车辆名称',value:detail.vehicle},{label:'路面条件',value:detail.condition},{label:'车辆状态',value:detail.modifications==='原厂'?'原厂':'改装'}]
      this.setData({detail,basicFields,modFields,loading:false,videoLinkCanOpen:/^#小程序:\/\//.test(detail.videoLink||'')})
      if(detail.hasVideo)await this.loadVideo(token)
    }catch(e){if(this._alive&&token===this._loadToken)this.setData({loading:false,error:e.message||'详情加载失败，请重试'})}
  },
  async loadVideo(token){
    if(!this.data.detail)return
    token=typeof token==='number'?token:this._loadToken
    this.setData({videoLoading:true,videoError:'',videoUrl:''})
    try{
      const res=await call({action:'video',id:this._id})
      if(this._alive&&token===this._loadToken)this.setData({videoUrl:res.url||'',videoError:res.url?'':'视频暂时不可用'})
    }catch(e){if(this._alive&&token===this._loadToken)this.setData({videoError:e.message||'视频加载失败，请重试'})}
    finally{if(this._alive&&token===this._loadToken)this.setData({videoLoading:false})}
  },
  retryVideo(){this.loadVideo()},
  videoError(){this.setData({videoError:'视频播放失败，可尝试重新加载'})},
  openVideoLink(){
    if(this._openingVideoLink)return
    let link
    try{link=laps.normalizeVideoLink(this.data.detail&&this.data.detail.videoLink)}catch(e){this.notify(e);return}
    if(!link)return
    const fallback=()=>{
      this._openingVideoLink=false
      if(!this._alive)return
      wx.showModal({title:'暂时无法直接打开',content:'可复制链接，到对应平台或浏览器中粘贴打开。',confirmText:'复制链接',cancelText:'取消',success:r=>{if(r.confirm)this.copyVideoLink()}})
    }
    if(!/^#小程序:\/\//.test(link)||typeof wx.navigateToMiniProgram!=='function'){fallback();return}
    this._openingVideoLink=true
    try{wx.navigateToMiniProgram({shortLink:link,fail:e=>{if(!/cancel/i.test(e&&e.errMsg||''))fallback()},complete:()=>{this._openingVideoLink=false}})}catch(e){fallback()}
  },
  copyVideoLink(){
    try{
      const link=laps.normalizeVideoLink(this.data.detail&&this.data.detail.videoLink)
      if(!link)return
      wx.setClipboardData({data:link,fail:()=>this.notify(new Error('复制视频链接失败，请重试，也可长按链接复制'))})
    }catch(e){this.notify(e)}
  },
})
