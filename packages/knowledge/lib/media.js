// Content data keeps logical asset paths. Only the server whitelist maps them to cloud files.
var urlCache={},downloads={}
function imagePaths(article){return Array.from(new Set((article.image?[article.image]:[]).concat(article.images||[],(article.blocks||[]).filter(function(b){return b.type==='image'}).map(function(b){return b.src}))))}
async function urls(keys){
  var result={},missing=[],now=Date.now()
  keys.forEach(function(k){if(urlCache[k]&&urlCache[k].expires>now)result[k]=urlCache[k].url;else missing.push(k)})
  if(missing.length){
    var res=await wx.cloud.callFunction({name:'wikiFiles',data:{keys:missing}})
    var data=res.result;if(!data||!data.ok)throw new Error(data&&data.message||'图片服务暂不可用')
    missing.forEach(function(k){if(!data.urls[k]||!/^https:\/\//.test(data.urls[k]))throw new Error('图片链接不可用');urlCache[k]={url:data.urls[k],expires:now+Math.min(data.maxAge||3600,3600)*1000-60000};result[k]=data.urls[k]})
  }
  return result
}
async function resolveArticle(article){
  var paths=imagePaths(article),map=paths.length?await urls(paths):{}
  var copy=Object.assign({},article)
  if(copy.image)copy.image=map[copy.image]
  if(copy.images)copy.images=copy.images.map(function(p){return map[p]})
  if(copy.blocks)copy.blocks=copy.blocks.map(function(b){return b.type==='image'?Object.assign({},b,{src:map[b.src]}):b})
  return {article:copy,images:(copy.image?[copy.image]:[]).concat(copy.images||[])}
}
async function downloadResource(resource){
  var saved=downloads[resource.path]
  if(saved){try{wx.getFileSystemManager().accessSync(saved);return saved}catch(e){delete downloads[resource.path]}}
  var links=await urls([resource.path])
  var file=await new Promise(function(resolve,reject){wx.downloadFile({url:links[resource.path],timeout:120000,success:resolve,fail:reject})})
  if(file.statusCode!==200||!file.tempFilePath)throw new Error('配置文件下载失败，请重试')
  downloads[resource.path]=file.tempFilePath;return file.tempFilePath
}
function invalidate(article){imagePaths(article).forEach(function(k){delete urlCache[k]})}
module.exports={imagePaths,resolveArticle,downloadResource,invalidate}
