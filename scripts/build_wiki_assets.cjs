// Rebuild the whitelist without rewriting user-maintained EN/5N content.
const fs=require('fs'),crypto=require('crypto')
const root='packages/knowledge/assets/knowledge'
const cloudRoot=process.argv[2]||'knowledge/assets/media-20261103'
if(!/^knowledge\/assets\/[a-zA-Z0-9_-]+$/.test(cloudRoot))throw Error('Use a versioned knowledge/assets/<version> cloud directory')
const prefix='cloud://hn-owner-asst-d7gufu33n85700993.686e-hn-owner-asst-d7gufu33n85700993-1522211425/'+cloudRoot+'/'
const assets={},manifest=[]
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else{const relative=p.slice(root.length+1),bytes=fs.readFileSync(p);assets['/'+p]=prefix+relative;manifest.push({path:p,cloudPath:cloudRoot+'/'+relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')})}}}
walk(root)
fs.writeFileSync('cloudfunctions/wikiFiles/assets.json',JSON.stringify(assets,null,2)+'\n')
fs.writeFileSync('docs/wiki-assets-manifest.json',JSON.stringify(manifest,null,2)+'\n')
console.log('Mapped '+manifest.length+' cloud assets. Upload the same directory and deploy wikiFiles before publishing.')
