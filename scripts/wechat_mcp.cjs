const {spawn}=require('node:child_process')
const entry='D:/微信web开发者工具/resources/app.asar.unpacked/js/common/cli/skill-index.js'
const child=spawn('D:/微信web开发者工具/微信开发者工具.exe',['-e',"const e=process.argv[1];process.argv=[process.execPath,e,'--electron',...process.argv.slice(2)];require(e)",entry,'mcp','--token',process.env.WECHAT_DEVTOOLS_CLI_TOKEN],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1',cwd:process.cwd()},stdio:['pipe','pipe','pipe']})
let buffer='',done=false
const timer=setTimeout(()=>{console.error('MCP timeout');child.kill();process.exitCode=1},45000)
function send(x){child.stdin.write(JSON.stringify(x)+'\n')}
function stop(){done=true;clearTimeout(timer);child.kill()}
child.stderr.on('data',x=>process.stderr.write(x))
child.stdout.on('data',chunk=>{buffer+=chunk;let n;while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);let msg;try{msg=JSON.parse(line)}catch{continue}
 if(msg.id===1){send({jsonrpc:'2.0',method:'notifications/initialized'});const input=process.argv[2]?JSON.parse(require('node:fs').readFileSync(process.argv[2],'utf8')):null;send({jsonrpc:'2.0',id:2,method:input?'tools/call':'tools/list',params:input||{}})}
 if(msg.id===2){const result=msg.result||msg.error; if(result.tools){require('node:fs').writeFileSync('scripts/wechat_tools.local.json',JSON.stringify(result));console.log(result.tools.map(t=>t.name).join('\n'))}else console.log(JSON.stringify(result,null,2));stop()}
}})
child.on('exit',()=>{clearTimeout(timer);if(!done)process.exitCode=1})
send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'lap-board-setup',version:'1.0.0'}}})
