from pathlib import Path
import json,re,hashlib
root=Path('ioniq_5n_china_owner_wiki-main/docs')
order=[('01','charging','CHARGING'),('02','infotainment','CONTROLS & INFOTAINMENT'),('03','maintenance','MAINTENANCE & PARTS'),('04','faq','OWNER FAQ'),('05','manual','FILES')]
assets='/packages/knowledge/assets/knowledge/ioniq5n/'
route_map={'charging':'01','infotainment':'02','maintenance':'03','faq':'04','manual':'05'}
def text(raw):
 raw=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',raw)
 return re.sub(r'\*\*|`','',raw).strip()
def parse_chunk(lines,category):
 blocks=[];search=[];images=[];i=0
 while i<len(lines):
  raw=lines[i];s=raw.strip()
  if not s:i+=1;continue
  img=re.search(r'<img[^>]+src="([^"]+)"|!\[[^]]*\]\(([^)]+)\)',s)
  if img:
   src=img.group(1) or img.group(2);base=Path(src).stem;dest=assets+category+'-'+base+'.jpg';blocks.append({'type':'image','src':dest});images.append(dest);i+=1;continue
  if s.startswith('|') and i+1<len(lines) and re.match(r'^\s*\|[\s:|\-]+\|\s*$',lines[i+1]):
   cells=lambda value:[text(c) for c in value.strip().strip('|').split('|')]
   headers=cells(s);i+=2;rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):rows.append(cells(lines[i]));i+=1
   blocks.append({'type':'table','headers':headers,'rows':rows});search.append(' / '.join(headers));search+=[' / '.join(row) for row in rows];continue
  heading=re.match(r'^(#{3,6})\s+(.*)',s)
  if heading:blocks.append({'type':'heading','text':text(heading.group(2))});search.append(text(heading.group(2)));i+=1;continue
  value=text(s);links=[]
  for label,target in re.findall(r'\[([^]]+)\]\(([^)]+)\)',s):
   match=re.search(r'(?:\.\./|/)(charging|infotainment|maintenance|faq|manual)/',target)
   if match:links.append({'label':label,'category':route_map[match.group(1)]})
  blocks.append({'type':'text','text':value,'indent':min(3,(len(raw)-len(raw.lstrip()))//2),'links':links});search.append(value);i+=1
 return blocks,search,images
sections=[];manifest=[]
for sid,category,english in order:
 path=root/category/'index.md';raw=path.read_text(encoding='utf-8');title=re.search(r'^#\s+(.+)$',raw,re.M).group(1);cards=[]
 if category=='manual':
  for label,target in re.findall(r'\[([^]]+)\]\(([^)]+)\)',raw):
   filename=Path(target).name.replace('%20',' ');key='5n-manual' if filename.startswith('5n') else 'etc-manual';cards.append({'title':label,'lines':[label+'：'+filename],'blocks':[{'type':'text','text':label+'：'+filename,'indent':0,'links':[]}],'document':{'key':key,'name':filename},'sourceFile':str(path).replace('\\','/')})
  cards.insert(1,{'title':'RaceChrono OBD配置文件','lines':['RaceChrono OBD配置文件：vehicle_i5n.rcz'],'blocks':[{'type':'text','text':'RaceChrono OBD配置文件：vehicle_i5n.rcz','indent':0,'links':[]}],'resource':{'path':assets+'vehicle_i5n.rcz','name':'vehicle_i5n.rcz'},'sourceFile':str(path).replace('\\','/')})
 else:
  chunks=[];current_title=title;current=[]
  for line in raw.splitlines()[1:]:
   h=re.match(r'^##\s+(.+)$',line)
   if h:
    if any(x.strip() for x in current):chunks.append((current_title,current))
    current_title=h.group(1);current=[]
   else:current.append(line)
  if any(x.strip() for x in current):chunks.append((current_title,current))
  for card_title,lines in chunks:
   blocks,search,images=parse_chunk(lines,category)
   card={'title':card_title,'lines':search,'blocks':blocks,'sourceFile':str(path).replace('\\','/')}
   if images:card['images']=images
   cards.append(card)
 sections.append({'id':sid,'title':title,'subtitle':english,'cards':cards})
 manifest.append({'file':str(path).replace('\\','/'),'sha256':hashlib.sha256(raw.encode()).hexdigest()})
# Preserve previously shared article IDs when reorganising to source headings.
legacy={
'01':{'充电时在车内等候':'充电','直流快充与冬季预热':'直流快充','充电后的功率限制提示':'直流快充','跳枪与电动系统警告':'直流快充','充电接口检查':'其他注意事项'},
'02':{name:'方向盘、仪表、车机、中控' for name in ['巡航车距与驾驶风格联动','Drive Mode 与语音助手','车道辅助与启动后的设置','电车模式下的拨片','E-Shift 下的拨片','摄像头视角','摄像头、雷达与自动泊车','USB 数据与充电模式','界面布局与导航声音']},
'03':{'雨刮规格与维护模式':'雨刮','12 V 电瓶':'电瓶','轮毂规格与紧固':'轮毂','轮胎选型记录':'轮胎','制动与胎压规格':'其他数据','四轮定位参考':'其他数据','OBD 监测器':'OBD监测器'},
'04':{'客服与救援':'常见问题','12 V 电瓶亏电':'电瓶亏电','亏电后的机械开门与尾门':'电瓶亏电','ICCU 与供电系统警告':'ICCU','逆变器与充电故障':'逆变器','高压电池模组与 BMS':'高压电池模组','ETC 开通与按键':'ETC','大灯起雾与干燥剂':'大灯起雾','RaceChrono 数据流与刷新率':'RaceChrono读取不到OBD数据流','RaceChrono：同一 PID 的通道':'RaceChrono读取不到OBD数据流','RaceChrono：其他 PID':'RaceChrono读取不到OBD数据流'},
'05':{'RaceChrono OBD 配置':'RaceChrono OBD配置文件'}}
def article_hash(value):
 n=2166136261
 for ch in value:n=((n^ord(ch))*16777619)&0xffffffff
 alphabet='0123456789abcdefghijklmnopqrstuvwxyz';result=''
 while n:result=alphabet[n%36]+result;n//=36
 return result or '0'
for section in sections:
 for old,new in legacy.get(section['id'],{}).items():
  card=next(c for c in section['cards'] if c['title']==new)
  card.setdefault('aliases',[]).append('s'+section['id']+'-'+article_hash(old))

# Keep manuals separate from the RaceChrono article's downloadable configuration.
manual_section=next(section for section in sections if section['id']=='05')
manual_section['title']='手册与资料'
race_file=next(card for card in manual_section['cards'] if card.get('resource'))
manual_section['cards'].remove(race_file)
race_article=next(card for section in sections for card in section['cards'] if card['title']=='RaceChrono读取不到OBD数据流')
race_article['resource']=race_file['resource']
race_article['lines']+=race_file['lines']
race_article['aliases']=list(dict.fromkeys(race_article.get('aliases',[])+race_file.get('aliases',[])+['s05-'+article_hash(race_file['title'])]))

data={
 'name':'艾尼氪 5 N · IONIQ 5 N · NE1N',
 'english':'IONIQ 5 N · NE1N',
 'description':'整理日常使用的常见问题和小技巧。',
 'sourceLink':{'label':'源Wiki链接','url':'https://5nwiki.antarescorn.fyi/'},
 'placeholder':'搜索原文标题、配件编号、车机操作或常见问题',
 'source':'资料来源：德国鸡腿堡整理的Wiki（见页面顶部链接），维护规格与故障处理请结合随车手册及售后诊断确认。',
 'contacts':[], 'sections':sections
}
for section in sections:
 for card in section['cards']:
  card['id']='s'+section['id']+'-'+article_hash(card['title'])
  if 'blocks' in card:
   card.pop('lines',None)
   card.pop('images',None)
# Generate an import candidate; never overwrite owner-maintained runtime content.
candidate=Path('docs/generated/knowledge5n.import.js')
candidate.parent.mkdir(parents=True,exist_ok=True)
candidate.write_text('// Import candidate only. Review and merge into knowledge5n.js.\nmodule.exports = '+json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('docs/5n-wiki-source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Import candidate:',candidate);print('5N categories:',[s['title'] for s in sections]);print('articles:',sum(len(s['cards']) for s in sections))
