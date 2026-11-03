const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm')
let definition,saved={}
const app={globalData:{themeMode:'auto',systemTheme:'dark'}}
const wx={showActionSheet(){throw new Error('Theme toggle must not open a menu')},setStorageSync(k,v){saved[k]=v},getAppBaseInfo(){return {theme:app.globalData.systemTheme}}}
global.getApp=()=>app;global.wx=wx
vm.runInNewContext(fs.readFileSync('pages/laps/laps.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>{definition=p},wx,getApp:()=>app,console})
const p={...definition,data:JSON.parse(JSON.stringify(definition.data))}
p.setData=patch=>{for(const [key,value] of Object.entries(patch)){const parts=key.split('.');let o=p.data;for(const part of parts.slice(0,-1))o=o[part];o[parts.at(-1)]=value}}
p._applyTheme();assert.equal(p.data.navColor,'white')
p.onThemeToggle();assert.equal(p.data.themeMode,'dark');assert.equal(p.data.navColor,'white');assert.equal(saved.themeMode,'dark')
p.onThemeToggle();assert.equal(p.data.themeMode,'light');assert.equal(p.data.navColor,'black');assert.equal(saved.themeMode,'light');const light=p.data.pageStyle
app.globalData.systemTheme='dark';p._applyTheme();assert.equal(p.data.pageStyle,light,'manual light overrides dark system')
p.onThemeToggle();assert.equal(p.data.themeMode,'auto');assert.equal(saved.themeMode,'auto');app.globalData.systemTheme='light';p._applyTheme();assert.equal(p.data.navColor,'black');assert.equal(p.data.pageStyle,light)
p.formInput({currentTarget:{dataset:{field:'driver'}},detail:{value:'昵称填入示例'}});assert.equal(p.data.form.driver,'昵称填入示例')
console.log('PASS: one-tap auto/dark/light cycle without a menu, persistence, system-following, manual override and nickname input updates')

function part(key,value){return p.lapPartInput({currentTarget:{dataset:{part:key}},detail:{value}})}
part('minutes','01');part('seconds','17');assert.equal(p._lapValue(),'01:17.000')
part('milliseconds','1');assert.equal(p._lapValue(),'01:17.001','milliseconds are integer milliseconds, not fractional seconds')
part('milliseconds','456');assert.equal(p._lapValue(),'01:17.456')
part('seconds','60');assert.throws(()=>p._lapValue(),/00—59/);assert(p.data.lapError)
part('seconds','５９');assert.equal(p.data.lapParts.seconds,'59');assert.equal(p.data.lapError,'')
p.data.busy=true;part('minutes','99');assert.equal(p.data.lapParts.minutes,'01');p.data.busy=false
p.data.lapParts=p._lapParts('08:09.012');assert.equal(p._lapValue(),'08:09.012','editing preserves leading zeroes and millisecond precision')
p.data.rows=[{_id:'edit-test',version:2,track:0,driver:'车手',vehicle:'EN',date:'2026-01-01',lap:'01:17.456',condition:'干地',modifications:'原厂'}]
p.edit({currentTarget:{dataset:{id:'edit-test'}}});assert.equal(p.data.lapParts.seconds,'17');assert.equal(p.data.lapParts.milliseconds,'456')
p.cancelEdit();assert.throws(()=>p._lapValue(),/请填写圈速/)
part('seconds','0');assert.throws(()=>p._lapValue(),/大于零/)
part('minutes','99');part('seconds','59');part('milliseconds','999');assert.equal(p._lapValue(),'99:59.999')
const markup=fs.readFileSync('pages/laps/laps.wxml','utf8');assert(!markup.includes('data-field="lap"'));assert.equal((markup.match(/bindinput="lapPartInput"/g)||[]).length,3)
console.log('PASS: split numeric lap entry, optional milliseconds, exact millisecond units, seconds bounds, busy guard, edit prefill and reset')

p.data.rows[0].videoLink='https://b23.tv/lap123';p.edit({currentTarget:{dataset:{id:'edit-test'}}});assert.equal(p.data.form.videoLink,'https://b23.tv/lap123')
p.cancelEdit();assert.equal(p.data.form.videoLink,'')
let detailDefinition
vm.runInNewContext(fs.readFileSync('pages/lap-detail/lap-detail.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>detailDefinition=p,wx,getApp:()=>app,console})
const d={...detailDefinition,data:JSON.parse(JSON.stringify(detailDefinition.data)),_alive:true};d.setData=patch=>Object.assign(d.data,patch)
let copied='';wx.setClipboardData=options=>{copied=options.data};d.data.detail={videoLink:'https://b23.tv/lap123'};d.copyVideoLink();assert.equal(copied,'https://b23.tv/lap123')
console.log('PASS: external video link edit prefill, reset and clipboard copy')

d._alive=true;let destination='',fallback=null;wx.navigateToMiniProgram=o=>{destination=o.shortLink;o.success&&o.success({});o.complete()};wx.showModal=o=>{fallback=o}
d.data.detail={videoLink:'#小程序://视频平台/详情/ABC123'};d.openVideoLink();assert.equal(destination,d.data.detail.videoLink);assert.equal(d._openingVideoLink,false);assert.equal(fallback,null)
wx.navigateToMiniProgram=o=>{o.fail({errMsg:'navigateToMiniProgram:fail unavailable'});o.complete()};d.openVideoLink();assert(fallback.content.includes('复制'));fallback.success({confirm:true});assert.equal(copied,d.data.detail.videoLink)
fallback=null;wx.navigateToMiniProgram=o=>{o.fail({errMsg:'navigateToMiniProgram:fail cancel'});o.complete()};d.openVideoLink();assert.equal(fallback,null,'cancel does not copy or prompt again')
d.data.detail={videoLink:'https://b23.tv/lap123'};destination='';d.openVideoLink();assert(fallback);assert.equal(destination,'','ordinary URLs are not passed to mini-program navigation')
console.log('PASS: official mini-program short-link navigation, failure copy fallback, cancellation and ordinary-link fallback')

let opened='';wx.navigateTo=o=>opened=o.url
p.openDetail({currentTarget:{dataset:{id:'test/id'}}});assert.equal(opened,'/pages/lap-detail/lap-detail?id=test%2Fid')
assert(!fs.readFileSync('pages/laps/laps.wxml','utf8').includes('id="lap-detail"'))
console.log('PASS: result and modification badge route to standalone detail page')

// Shared track selection must survive automatic location and never share an edit form.
let located=0,loaded=0,shareMenus=0
wx.showShareMenu=()=>{shareMenus++}
p.locate=()=>{located++};p.load=()=>{loaded++}
p.onLoad({track:'10'});assert.equal(p.data.track,10);assert.equal(p.data.region,6);assert.equal(located,0);assert.equal(loaded,1);assert.equal(shareMenus,1)
assert.equal(p.onShareAppMessage().path,'/pages/laps/laps?track=10');assert.equal(p.onShareTimeline().query,'track=10')
p.onLoad({track:'999'});assert.equal(located,1)
p.onLoad({});assert.equal(located,2)
console.log('PASS: share menu, track-specific links, shared track selection without location override, invalid link fallback')

// Picker positions are display-only; cloud/share/edit IDs stay stable.
assert.deepEqual(p.data.regionOptions,[0,4,11,9,8,6,10,2,3,7,1,5].map(i=>p.data.regions[i]))
p.data.tab='submit'
for(const [region,ids] of [[1,[3,2]],[2,[5,4]],[4,[15,7,14]],[7,[18,11,19]]]){
 p.regionChange({detail:{value:p.data.regionOptions.indexOf(p.data.regions[region])}})
 assert.equal(p.data.region,region);assert.equal(p.data.regionOptions[p.data.regionPicker],p.data.regions[region])
 assert.deepEqual(Array.from(p.data.trackOptions),ids.map(i=>p.data.tracks[i]))
 p.trackChange({detail:{value:ids.length-1}});assert.equal(p.data.track,ids.at(-1))
}
p.onLoad({track:'19'});assert.equal(p.data.track,19);assert.equal(p.data.regionTrack,2);assert.equal(p.data.regionOptions[p.data.regionPicker],p.data.regions[7])
console.log('PASS: pinyin order, picker-to-stable-ID mapping and shared V1 layout selection')
