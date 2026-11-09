const enc=new TextEncoder();
function unb64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function sign(v,s){const k=await crypto.subtle.importKey("raw",enc.encode(s),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(v)))}
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a[i]^b[i];return n===0}
async function ok(req,secret){const c=(req.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("tiktok_spend_session="));if(!c)return false;const p=c.slice(21).split(".");if(p.length!==2||!/^\d+$/.test(p[0])||Number(p[0])<Date.now()/1000)return false;try{return equal(await sign(p[0],secret),unb64(p[1]))}catch{return false}}
export async function onRequest({request,env,params}){
  if(!env.SESSION_SECRET||!env.TIKTOK_WORKER_URL||!env.DASHBOARD_API_KEY)return Response.json({error:"Pages 环境变量未配置"},{status:503});
  if(!await ok(request,env.SESSION_SECRET))return Response.json({error:"未登录"},{status:401});
  if(request.method!=="GET")return Response.json({error:"只允许只读 GET 请求"},{status:405,headers:{"Allow":"GET"}});
  const p=Array.isArray(params.path)?params.path.join("/"):(params.path||"");
  const incoming=new URL(request.url);
  const allowed={
    "business-centers":[],
    "business-center-accounts":["bc_id"],
    "daily-spend":["start_date","end_date"],
    "daily-report":["date","bc_id"]
  };
  if(!Object.prototype.hasOwnProperty.call(allowed,p))return Response.json({error:"接口未开放"},{status:404});
  const keys=[...incoming.searchParams.keys()];
  if(keys.some(k=>!allowed[p].includes(k))||allowed[p].some(k=>!incoming.searchParams.has(k))||keys.length!==allowed[p].length)return Response.json({error:"查询参数不符合只读接口要求"},{status:400});
  const u=new URL("/api/tiktok/"+p,env.TIKTOK_WORKER_URL);
  u.search=incoming.search;
  const h=new Headers();h.set("X-Dashboard-Key",env.DASHBOARD_API_KEY);
  const upstream=await fetch(u,{method:"GET",headers:h,redirect:"manual"});
  const headers=new Headers(upstream.headers);headers.set("Cache-Control","no-store");
  return new Response(upstream.body,{status:upstream.status,headers});
}
