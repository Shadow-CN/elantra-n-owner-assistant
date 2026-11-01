const provinces = require('../data/location/provinces')
const REGIONS = ['北京','浙江','上海','四川','广东','德国','内蒙古']
function normalize(name){return name.replace(/省|市|特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区/g,'')}
function inRing(x,y,ring){
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j]
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside
  }
  return inside
}
function inPolygon(x,y,rings){return inRing(x,y,rings[0])&&!rings.slice(1).some(r=>inRing(x,y,r))}
function provinceAt(latitude,longitude){
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return null
  return provinces.find(p=>{
    const b=p.bbox
    if(longitude<b[0]||longitude>b[2]||latitude<b[1]||latitude>b[3])return false
    const polygons=p.type==='Polygon'?[p.coordinates]:p.coordinates
    return polygons.some(rings=>inPolygon(longitude,latitude,rings))
  })||null
}
function angularDistance(a,b){const rad=x=>x*Math.PI/180;return Math.sin(rad(b[1]-a[1])/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(rad(b[0]-a[0])/2)**2}
function recommend(latitude,longitude){
  const province=provinceAt(latitude,longitude)
  if(!province)return null
  const local=REGIONS.indexOf(normalize(province.name))
  if(local>=0)return {province:province.name,region:local,sameProvince:true}
  // Province-level recommendation only; these are province centers, not circuit coordinates.
  const candidates=REGIONS.map((name,region)=>({region,province:provinces.find(p=>normalize(p.name)===name)})).filter(p=>p.province&&p.province.center)
  if(!province.center||!candidates.length)return null
  candidates.sort((a,b)=>angularDistance(province.center,a.province.center)-angularDistance(province.center,b.province.center))
  return {province:province.name,region:candidates[0].region,sameProvince:false}
}
module.exports={provinceAt,recommend,normalize,inRing,inPolygon}
