var themeUtil = require('../../../utils/theme')
var shareUtil = require('../../../utils/share')
var wiki = require('../lib/wiki')
Page({
  data:{navBg:'#FFFFFF',navColor:'black',themeMode:'auto',pageStyle:'',query:'',model:'elantra',modelName:'伊兰特 N',modelEnglish:'ELANTRA N',modelDescription:'',sourceLink:null,categoryLink:null,searchPlaceholder:'搜索词条',sourceNote:'',contacts:[],sections:[],categories:[],supplementalCategories:[],showEntries:true,activeCategory:'',categoryTitle:'全部词条',articleCount:0,resultCount:0,scrollTop:0},
  onLoad(options){shareUtil.enableShareMenu();this._setModel(options&&options.model==='5n'?'5n':'elantra');if(options&&options.category&&this._allSections.some(function(s){return s.id===options.category||(s.aliases||[]).includes(options.category)}))this._setCategory(options.category);this._applyTheme()},
  onShow(){this._applyTheme()},
  _applyTheme(){var mode=getApp().globalData.themeMode||'auto';var nav=themeUtil.navColors(themeUtil.isDarkEffective(mode));this.setData({themeMode:mode,pageStyle:themeUtil.getPageStyle(mode),navBg:nav.navBg,navColor:nav.navColor})},
  onThemeToggle(){var app=getApp();var mode=themeUtil.nextMode(app.globalData.themeMode||'auto');app.globalData.themeMode=mode;themeUtil.saveMode(mode);this._applyTheme()},
  onModelChange(e){this._setModel(e.currentTarget.dataset.model)},
  _setModel(model){
    model=model==='5n'?'5n':'elantra'
    var content=wiki.content(model)
    this._allSections=wiki.sections(model)
    this.setData({model:model,modelName:content.name,modelEnglish:content.english,modelDescription:content.description,sourceLink:content.sourceLink||null,searchPlaceholder:content.placeholder,sourceNote:content.source,contacts:content.contacts,categoryLink:null,query:'',activeCategory:'',categoryTitle:'全部词条',categories:this._allSections.filter(function(s){return !s.supplemental}).map(function(s){return {id:s.id,title:s.title,count:s.cards.length,description:s.description||''}}),supplementalCategories:this._allSections.filter(function(s){return s.supplemental}).map(function(s){return {id:s.id,title:s.title,count:s.cards.length,description:s.description||''}}),articleCount:wiki.articles(model).length,scrollTop:this.data.scrollTop===0?1:0})
    this._refresh()
  },
  _refresh(){var sections=wiki.filter(this._allSections||[],this.data.query,this.data.activeCategory);this.setData({showEntries:!!this.data.query||!!this.data.activeCategory,sections:sections,resultCount:sections.reduce(function(n,s){return n+s.cards.length},0)})},
  _setCategory(id){var category=(this._allSections||[]).find(function(s){return s.id===id||(s.aliases||[]).includes(id)});this.setData({activeCategory:category?category.id:'',categoryLink:category?category.externalLink||null:null,categoryTitle:category?category.title:'全部词条',scrollTop:this.data.scrollTop===0?1:0});this._refresh()},
  onCategory(e){this._setCategory(e.currentTarget.dataset.id)},
  onAllCategories(){this.setData({query:''});this._setCategory('')},
  onNavBack(){
    if(this.data.query){this.onClearSearch();return}
    if(this.data.activeCategory){this.onAllCategories();return}
    if(getCurrentPages().length>1){wx.navigateBack({delta:1});return}
    wx.reLaunch({url:'/pages/index/index'})
  },
  onSearch(e){this.setData({query:(e.detail.value||'').trim()});this._refresh()},
  onClearSearch(){this.setData({query:''});this._refresh()},
  onOpenArticle(e){wx.navigateTo({url:wiki.url(this.data.model,e.currentTarget.dataset.id)})},
  onCategoryLinkOpen(){
    var link=this.data.categoryLink
    if(!link||this._openingCategoryLink)return
    var url=link.url
    var fallback=()=>{this._openingCategoryLink=false;wx.showModal({title:'暂时无法打开腾讯文档',content:'可复制网页链接，在微信或浏览器中打开。',confirmText:'复制链接',success:function(r){if(r.confirm)wx.setClipboardData({data:url})}})}
    if(!link.shortLink||typeof wx.navigateToMiniProgram!=='function'){fallback();return}
    this._openingCategoryLink=true
    try{wx.navigateToMiniProgram({shortLink:link.shortLink,fail:function(e){if(!/cancel/i.test(e&&e.errMsg||''))fallback()},complete:()=>{this._openingCategoryLink=false}})}catch(e){fallback()}
  },
  onCategoryLinkCopy(){var link=this.data.categoryLink;if(link&&link.url)wx.setClipboardData({data:link.url,fail:function(){wx.showToast({title:'复制失败，请重试',icon:'none'})}})},
  onSourceLinkTap(){
    // Keep the source URL separate so a future web-view route can use this entry.
    var link=this.data.sourceLink
    if(link&&link.url)wx.setClipboardData({data:link.url,fail:function(){wx.showToast({title:'复制失败，请长按链接复制',icon:'none'})}})
  },
  onCopyLine(e){wx.setClipboardData({data:e.currentTarget.dataset.value})},
  onShareAppMessage(){return {title:this.data.modelName+' 车主 Wiki',path:'/packages/knowledge/knowledge/knowledge?model='+this.data.model+(this.data.activeCategory?'&category='+encodeURIComponent(this.data.activeCategory):'')}},
  onShareTimeline(){return {title:this.data.modelName+' 车主 Wiki',query:'model='+this.data.model+(this.data.activeCategory?'&category='+encodeURIComponent(this.data.activeCategory):'')}}
})
