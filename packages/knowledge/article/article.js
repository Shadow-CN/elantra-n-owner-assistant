var theme = require('../../../utils/theme')
var share = require('../../../utils/share')
var wiki = require('../lib/wiki')
var media = require('../lib/media')
var fileHelper = require('../../../utils/fileHelper')
Page({
  data:{mediaLoading:false,mediaError:'',resourceLoading:false,resourcePath:'',documentLoading:false,article:null,model:'elantra',modelName:'',related:[],images:[],sourceNote:'',pageStyle:'',themeMode:'auto',navBg:'#ffffff',navColor:'black',scrollTarget:'',canGoBack:false},
  onLoad(options){
    this._alive=true
    share.enableShareMenu()
    var model=options&&options.model==='5n'?'5n':'elantra'
    var article=wiki.find(model,options&&options.id)
    this.setData({model:model,modelName:wiki.content(model).name,article:article,related:article?wiki.related(model,article):[],images:article?(article.image?[article.image]:[]).concat(article.images||[]):[],sourceNote:wiki.content(model).source,firstImageAnchor:article&&article.blocks?'article-block-'+article.blocks.findIndex(function(b){return b.type==='image'}):'article-images',canGoBack:getCurrentPages().length>1})
    this._applyTheme()
    this._sourceArticle=article
    if(article&&wx.cloud){this.loadMedia();if(article.resource)this.prepareResource()}
  },
  async loadMedia(){
    if(!this._sourceArticle)return
    if(this.data.mediaError)media.invalidate(this._sourceArticle)
    var token=this._mediaToken=(this._mediaToken||0)+1
    var empty=Object.assign({},this._sourceArticle,{image:'',images:[],blocks:(this._sourceArticle.blocks||[]).map(function(b){return b.type==='image'?Object.assign({},b,{src:''}):b})})
    if(!this._sourceArticle.blocks)delete empty.blocks
    this.setData({article:empty,images:[],mediaLoading:true,mediaError:''})
    try{var result=await media.resolveArticle(this._sourceArticle);if(this._alive&&token===this._mediaToken)this.setData({article:result.article,images:result.images,mediaLoading:false})}
    catch(e){if(this._alive&&token===this._mediaToken)this.setData({mediaLoading:false,mediaError:e.message||'图片加载失败，请重试'})}
  },
  async prepareResource(){
    var resource=this._sourceArticle&&this._sourceArticle.resource
    if(!resource||this.data.resourceLoading)return
    this.setData({resourceLoading:true})
    try{var path=await media.downloadResource(resource);if(this._alive)this.setData({resourcePath:path})}
    catch(e){if(this._alive)wx.showToast({title:e.message||'配置文件下载失败',icon:'none'})}
    finally{if(this._alive)this.setData({resourceLoading:false})}
  },
  onMediaError(){if(this._alive&&!this.data.mediaError)this.setData({mediaError:'部分图片加载失败，请检查网络后重试'})},
  onShow(){this._applyTheme()},
  _applyTheme(){var mode=getApp().globalData.themeMode||'auto';this.setData(Object.assign({themeMode:mode,pageStyle:theme.getPageStyle(mode)},theme.navColors(theme.isDarkEffective(mode))))},
  onThemeToggle(){var app=getApp();var mode=theme.nextMode(app.globalData.themeMode||'auto');app.globalData.themeMode=mode;theme.saveMode(mode);this._applyTheme()},
  onWikiHome(){wx.redirectTo({url:'/packages/knowledge/knowledge/knowledge?model='+this.data.model})},
  onCategory(){if(this.data.article)wx.redirectTo({url:'/packages/knowledge/knowledge/knowledge?model='+this.data.model+'&category='+encodeURIComponent(this.data.article.sectionId)})},
  onRelated(e){wx.redirectTo({url:wiki.url(this.data.model,e.currentTarget.dataset.id)})},
  onAnchor(e){var target=e.currentTarget.dataset.target;this.setData({scrollTarget:''},()=>this.setData({scrollTarget:target}))},
  onCopyLine(e){wx.setClipboardData({data:e.currentTarget.dataset.value})},
  onBlockCategory(e){wx.redirectTo({url:'/packages/knowledge/knowledge/knowledge?model='+this.data.model+'&category='+encodeURIComponent(e.currentTarget.dataset.category)})},
  onCopyArticle(){if(this.data.article)wx.setClipboardData({data:this.data.article.title+'\n'+this.data.article.lines.join('\n')})},
  onPreviewImage(e){var src=e.currentTarget.dataset.src;wx.previewImage({current:src,urls:this.data.images})},
  onUnload(){this._alive=false},
  async onOpenDocument(){
    var document=this.data.article&&this.data.article.document
    if(!document||this.data.documentLoading)return
    this.setData({documentLoading:true})
    wx.showLoading({title:'正在读取资料'})
    try{
      var response=await wx.cloud.callFunction({name:'wikiFiles',data:{key:document.key}})
      if(!response.result||!response.result.ok)throw new Error(response.result&&response.result.message||'资料服务暂不可用')
      var file=await new Promise(function(resolve,reject){wx.downloadFile({url:response.result.url,timeout:120000,success:resolve,fail:reject})})
      if(file.statusCode!==200)throw new Error('资料下载失败，请稍后重试')
      if(this._alive)await new Promise(function(resolve,reject){wx.openDocument({filePath:file.tempFilePath,fileType:'pdf',showMenu:true,success:resolve,fail:reject})})
    }catch(err){if(this._alive)wx.showModal({title:'资料暂不可用',content:err.message||err.errMsg||'请稍后重试',showCancel:false})}
    finally{wx.hideLoading();if(this._alive)this.setData({documentLoading:false})}
  },
  onShareResource(){
    var resource=this.data.article&&this.data.article.resource
    if(!resource)return
    if(wx.cloud&&!this.data.resourcePath){this.prepareResource();return}
    try{
      var content=wx.getFileSystemManager().readFileSync(this.data.resourcePath||resource.path.replace(/^\//,''))
      fileHelper.saveBinaryAndShare(resource.name,content,function(info){if(info.shareSkipped)wx.showModal({title:'文件已保存',content:info.filePath,showCancel:false})},function(err){wx.showToast({title:err.message,icon:'none'})})
    }catch(e){this.setData({resourcePath:''});wx.showToast({title:'文件读取失败，请重新下载',icon:'none'})}
  },
  onShareAppMessage(){var a=this.data.article;return a?{title:a.title+' · '+this.data.modelName+' Wiki',path:wiki.url(this.data.model,a.id)}:{title:'车主 Wiki',path:'/packages/knowledge/knowledge/knowledge'}},
  onShareTimeline(){var a=this.data.article;return {title:a?a.title+' · '+this.data.modelName+' Wiki':'车主 Wiki',query:'model='+this.data.model+(a?'&id='+encodeURIComponent(a.id):'')}}
})
