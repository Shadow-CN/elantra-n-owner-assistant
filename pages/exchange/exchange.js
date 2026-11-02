const theme=require('../../utils/theme'),share=require('../../utils/share'),exchange=require('../../utils/exchange')
Page({
 data:{currencies:exchange.CURRENCIES,options:exchange.CURRENCIES.map(c=>c.name+' '+c.code),from:1,to:0,amount:'',result:'',rateLabel:'',rateDate:'',source:'',stale:false,cached:false,loading:false,error:'',inputError:'',themeMode:'auto',navBg:'#ffffff',navColor:'black',pageStyle:''},
 onLoad(){this._alive=true;share.enableShareMenu();this._applyTheme();try{const data=wx.getStorageSync('exchangeRates.v1');if(data&&data.rates&&Date.now()-data.fetchedAt<7*86400000)this.applyRates(data,true)}catch(e){};this.refresh()},
 onShow(){this._applyTheme()},onUnload(){this._alive=false},
 _applyTheme(){const mode=getApp().globalData.themeMode||'auto';this.setData(Object.assign({themeMode:mode,pageStyle:theme.getPageStyle(mode)},theme.navColors(theme.isDarkEffective(mode))))},
 onThemeToggle(){const app=getApp(),mode=theme.nextMode(app.globalData.themeMode||'auto');app.globalData.themeMode=mode;theme.saveMode(mode);this._applyTheme()},
 onAmount(e){this.setData({amount:e.detail.value});this.calculate()},
 onFrom(e){this.setData({from:Number(e.detail.value)});this.calculate()},onTo(e){this.setData({to:Number(e.detail.value)});this.calculate()},
 onSwap(){this.setData({from:this.data.to,to:this.data.from});this.calculate()},
 applyRates(data,cached){this._rates=data.rates;this._dates=data.dates||{};this.setData({source:data.source,stale:!!data.stale,cached:!!cached});this.calculate()},
 calculate(){
  const from=exchange.CURRENCIES[this.data.from].code,to=exchange.CURRENCIES[this.data.to].code
  const dates=[from,to].filter(c=>c!=='CNY').map(c=>this._dates&&this._dates[c]).filter(Boolean)
  const date=Array.from(new Set(dates)).sort().join(' / ')
  let label='';if(this._rates&&this._rates[from]&&this._rates[to])label='1 '+from+' ≈ '+Number((this._rates[to]/this._rates[from]).toPrecision(7)).toString()+' '+to
  this.setData({rateDate:date,rateLabel:label,inputError:'',result:''})
  if(!this.data.amount.trim())return
  try{this.setData({result:exchange.convert(this.data.amount,from,to,this._rates)})}catch(e){this.setData({inputError:e.message})}
 },
 async refresh(){
  if(this.data.loading)return;this.setData({loading:true,error:''})
  try{if(!wx.cloud)throw new Error('当前微信版本不支持云开发');const res=await wx.cloud.callFunction({name:'exchangeRates',data:{}});if(!res.result||!res.result.ok)throw new Error(res.result&&res.result.message||'汇率暂不可用');if(!this._alive)return;this.applyRates(res.result,false);try{wx.setStorageSync('exchangeRates.v1',res.result)}catch(e){}}
  catch(e){if(this._alive)this.setData({error:this._rates?'更新失败，当前使用本地缓存汇率':'暂时无法获取汇率，请点击重试',cached:!!this._rates})}
  finally{if(this._alive)this.setData({loading:false})}
 },
 onShareAppMessage(){return {title:'汇率换算 · 现代N车主助手',path:'/pages/exchange/exchange'}},onShareTimeline(){return {title:'汇率换算 · 现代N车主助手',query:''}}
})
