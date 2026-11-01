const assert=require('node:assert/strict')
const fs=require('node:fs'),vm=require('node:vm')
let definition,calls=0,modal,settingOpened='',privacyNeeded=true,pickFailure=null,privacyOpened=false
const wx={
 getPrivacySetting({success}){success({needAuthorization:privacyNeeded,privacyContractName:'《隐私保护指引》'})},
 chooseMedia(options){calls++;assert.deepEqual(Array.from(options.mediaType),['video']);assert.deepEqual(Array.from(options.sizeType),['original']);if(pickFailure)options.fail(pickFailure);else options.success({tempFiles:[{tempFilePath:'wxfile://tmp/test.mp4',size:12345}]});options.complete()},
 showModal(options){modal=options},getAppAuthorizeSetting(){return {albumAuthorized:'authorized',cameraAuthorized:'authorized'}},
 openSetting(){settingOpened='miniProgram'},openAppAuthorizeSetting(){settingOpened='system'},openPrivacyContract(){privacyOpened=true}
}
vm.runInNewContext(fs.readFileSync('pages/laps/laps.js','utf8'),{require:p=>require('../'+p.replace('../../','')),Page:p=>{definition=p},wx,console:{error(){}},getApp:()=>({globalData:{}})})
function page(){const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),_alive:true};p.setData=(patch,cb)=>{Object.assign(p.data,patch);if(cb)cb()};return p}
let p=page();p.data.form.driver='保留的表单'
p.choose();assert.equal(p.data.showPrivacy,true);assert.equal(calls,0,'no media access before agreement')
p.choose();assert.equal(calls,0,'duplicate taps do not enter picker')
p.openPrivacy();assert.equal(privacyOpened,true)
p.declinePrivacy();assert.equal(p.data.showPrivacy,false);assert.equal(p.data.form.driver,'保留的表单');assert.equal(calls,0)
p.choose();p.agreePrivacy();assert.equal(calls,1);assert.equal(p.data.video.path,'wxfile://tmp/test.mp4');assert.equal(p._choosingMedia,false)
privacyNeeded=false;p=page();p.choose();assert.equal(calls,2);assert.equal(p.data.showPrivacy,false)
modal=null;pickFailure={errMsg:'chooseMedia:fail cancel'};p.choose();assert.equal(modal,null)
pickFailure={errMsg:'chooseMedia:fail api scope is not declared in the privacy agreement'};p.choose();assert(modal.content.includes('尚未声明'));assert(!modal.content.includes('检查相册权限'))
pickFailure={errMsg:'chooseMedia:fail privacy permission is not authorized'};p.choose();assert(modal.content.includes('隐私保护指引'))
pickFailure={errMsg:'chooseMedia:fail unsupported file format'};p.choose();assert(modal.content.includes('unsupported file format'));assert(!modal.content.includes('相册权限'))
wx.getAppAuthorizeSetting=()=>({albumAuthorized:'denied'});pickFailure={errMsg:'chooseMedia:fail auth deny'};p.choose();assert(modal.content.includes('系统设置'));modal.success({confirm:true});assert.equal(settingOpened,'system')
wx.getAppAuthorizeSetting=()=>({albumAuthorized:'authorized'});p.choose();modal.success({confirm:true});assert.equal(settingOpened,'miniProgram')
console.log('PASS: privacy consent gate, decline retains draft, duplicate tap guard, native media success, cancellation, undeclared scopes, privacy denial, generic errors and distinct settings routes')
