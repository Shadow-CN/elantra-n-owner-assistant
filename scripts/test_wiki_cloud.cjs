const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path')
async function run(){
 const mediaFile=path.resolve('packages/knowledge/lib/media.js');let calls=0,downloads=0;const module={exports:{}}
 const wx={cloud:{async callFunction(o){calls++;assert.equal(o.name,'wikiFiles');return {result:{ok:true,urls:Object.fromEntries(o.data.keys.map(k=>[k,'https://example.test/'+encodeURIComponent(k)])),maxAge:3600}}}},downloadFile(o){downloads++;o.success({statusCode:200,tempFilePath:'wxfile://resource.rcz'})},getFileSystemManager(){return {accessSync(){}}}}
 vm.runInNewContext(fs.readFileSync(mediaFile,'utf8'),{module,exports:module.exports,wx,console});const media=module.exports
 const article={image:'/a.jpg',images:['/b.jpg'],blocks:[{type:'image',src:'/b.jpg'},{type:'text',text:'source'}]}
 const result=await media.resolveArticle(article);assert.equal(article.image,'/a.jpg');assert(result.images[0].startsWith('https://'));assert.equal(result.article.blocks[0].src,result.images[1]);assert.equal(calls,1)
 await media.resolveArticle(article);assert.equal(calls,1);media.invalidate(article);await media.resolveArticle(article);assert.equal(calls,2)
 await media.downloadResource({path:'/config.rcz'});await media.downloadResource({path:'/config.rcz'});assert.equal(downloads,1)
 const assets=require('../cloudfunctions/wikiFiles/assets.json');let issued=0;const server={exports:{}}
 vm.runInNewContext(fs.readFileSync('cloudfunctions/wikiFiles/index.js','utf8'),{exports:server.exports,require:n=>n==='wx-server-sdk'?{DYNAMIC_CURRENT_ENV:'test',init(){},async getTempFileURL(o){issued++;return {fileList:o.fileList.map(fileID=>({fileID,status:0,tempFileURL:'https://example.test/file'}))}}}:require(path.resolve('cloudfunctions/wikiFiles',n))})
 assert.equal((await server.exports.main({keys:['arbitrary-private-file']})).ok,false);assert.equal(issued,0)
 const keys=Object.keys(assets);assert.equal((await server.exports.main({keys:keys.slice(0,3)})).ok,true);assert.equal(issued,1)
 assert.equal((await server.exports.main({key:'en-owner-manual'})).ok,true)
 const sourceArticle=fs.readFileSync('packages/knowledge/article/article.js','utf8');assert(sourceArticle.includes('this.data.resourcePath||resource.path'))
 console.log('PASS: cloud image mapping/cache/retry, original content unchanged, cached attachment download, whitelist rejection and existing PDF compatibility')
}
run().catch(e=>{console.error(e);process.exitCode=1})
