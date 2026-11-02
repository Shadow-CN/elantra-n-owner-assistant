const CURRENCIES=[{code:'CNY',name:'人民币'},{code:'KRW',name:'韩元'},{code:'USD',name:'美元'},{code:'JPY',name:'日元'},{code:'TWD',name:'新台币'},{code:'HKD',name:'港币'},{code:'AUD',name:'澳元'},{code:'CAD',name:'加元'},{code:'EUR',name:'欧元'}]
function convert(amount,from,to,rates){
 const text=String(amount).trim()
 if(!/^\d{1,12}(?:\.\d{0,4})?$/.test(text))throw new Error('请输入有效金额，最多12位整数、4位小数')
 if(!CURRENCIES.some(c=>c.code===from)||!CURRENCIES.some(c=>c.code===to))throw new Error('请选择币种')
 if(from===to)return Number(text).toFixed(2)
 if(!rates||!Number.isFinite(rates[from])||!Number.isFinite(rates[to])||rates[from]<=0||rates[to]<=0)throw new Error('请先获取汇率')
 return (Number(text)*rates[to]/rates[from]).toFixed(2)
}
module.exports={CURRENCIES,convert}
