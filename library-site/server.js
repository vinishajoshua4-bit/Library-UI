"use strict";
// Municipal Library: zero-dependency Node server (static site + JSON API + accounts).
const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,"data"),FILE=path.join(DIR,"db.json"),PUB=path.join(__dirname,"public"),DAY=864e5;
const CATS=["Fiction","Science","History","Biography","Technology"];
const SEED=[["The Left Hand of Darkness","Ursula K. Le Guin","Fiction",1969,2],["Things Fall Apart","Chinua Achebe","Fiction",1958,1],["A Brief History of Time","Stephen Hawking","Science",1988,3],["The Selfish Gene","Richard Dawkins","Science",1976,1],["Sapiens","Yuval Noah Harari","History",2011,2],["The Discovery of India","Jawaharlal Nehru","History",1946,1],["Wings of Fire","A. P. J. Abdul Kalam","Biography",1999,4],["Long Walk to Freedom","Nelson Mandela","Biography",1994,1],["Clean Code","Robert C. Martin","Technology",2008,2],["The Pragmatic Programmer","Hunt and Thomas","Technology",1999,1]];
let db;try{db=JSON.parse(fs.readFileSync(FILE,"utf8"))}catch(e){}
if(!db){db={secret:crypto.randomBytes(32).toString("hex"),users:[],books:SEED.map((s,i)=>({id:i+1,t:s[0],a:s[1],c:s[2],y:s[3],n:s[4],free:s[4]})),loans:[],wait:[],fav:{}};save()}
function save(){fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(FILE+".tmp",JSON.stringify(db));fs.renameSync(FILE+".tmp",FILE)}
const send=(res,c,o,h)=>{res.writeHead(c,Object.assign({"Content-Type":"application/json"},h));res.end(JSON.stringify(o))};
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString("hex");
const tok=id=>id+"."+crypto.createHmac("sha256",db.secret).update(String(id)).digest("hex");
function who(req){const m=/(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie||"");if(!m)return;const id=m[1].split(".")[0],a=Buffer.from(m[1]),e=Buffer.from(tok(id));if(a.length!==e.length||!crypto.timingSafeEqual(a,e))return;return db.users.find(u=>String(u.id)===id)}
const tries=new Map();
function limited(ip){const now=Date.now(),t=(tries.get(ip)||[]).filter(x=>now-x<6e5);t.push(now);tries.set(ip,t);return t.length>10}
const bk=id=>db.books.find(b=>b.id===id);
const view=u=>({books:db.books,loans:db.loans.filter(l=>l.uid===u.id).map(l=>({id:l.id,due:l.due,rn:l.rn})),wait:db.wait.filter(w=>w.uid===u.id),fav:db.fav[u.id]||[]});
const A={
borrow(u,{id}){const b=bk(id);if(!b)throw"Unknown book.";if(db.loans.some(l=>l.id===id&&l.uid===u.id))throw"You already have this book.";if(b.free<1)throw"No copy is free. Reserve it instead.";b.free--;db.loans.push({id,uid:u.id,due:Date.now()+14*DAY,rn:0});return"Borrowed. Due in 14 days."},
"return"(u,{id}){const i=db.loans.findIndex(l=>l.id===id&&l.uid===u.id);if(i<0)throw"You do not have this book.";db.loans.splice(i,1);const q=db.wait.findIndex(w=>w.id===id);if(q>=0){const w=db.wait.splice(q,1)[0];db.loans.push({id,uid:w.uid,due:Date.now()+14*DAY,rn:0});return"Returned. Passed to the next person on the waitlist."}bk(id).free++;return"Returned. Thank you."},
renew(u,{id}){const l=db.loans.find(l=>l.id===id&&l.uid===u.id);if(!l)throw"You do not have this book.";if(l.rn>=1)throw"Already renewed once.";if(l.due<Date.now())throw"Overdue books cannot be renewed.";l.due+=7*DAY;l.rn=1;return"Renewed for 7 days."},
reserve(u,{id}){const b=bk(id);if(!b)throw"Unknown book.";if(b.free>0)throw"A copy is free. Borrow it instead.";if(db.wait.some(w=>w.id===id&&w.uid===u.id))throw"Already reserved.";db.wait.push({id,uid:u.id});return"Reserved. You get the next returned copy."},
fav(u,{id}){const f=db.fav[u.id]=db.fav[u.id]||[],i=f.indexOf(id);i<0?f.push(id):f.splice(i,1);return""},
books(u,b){if(!u.admin)throw"Only the librarian can add books.";const t=String(b.t||"").trim(),a=String(b.a||"").trim(),y=Number(b.y)||2024,n=Number(b.n);if(!t||!a||t.length>120||a.length>120)throw"Enter a title and author (120 characters max).";if(!CATS.includes(b.c))throw"Pick a category.";if(!(n>=1&&n<=99))throw"Copies must be 1 to 99.";db.books.push({id:Date.now(),t,a,c:b.c,y:Math.min(2100,Math.max(1000,y)),n,free:n});return"Added "+t}};
function route(req,res,p,raw){
 const post=req.method==="POST";
 if(post&&!/json/.test(req.headers["content-type"]||""))throw"Bad request";
 let b={};try{b=raw?JSON.parse(raw):{}}catch(e){throw"Bad request"}
 if(p==="register"||p==="login"){
  if(!post)throw"Bad request";if(limited(req.socket.remoteAddress))throw"Too many attempts. Try again in a few minutes.";
  const email=String(b.email||"").trim().toLowerCase(),pw=String(b.password||"");let u=db.users.find(x=>x.email===email);
  if(p==="register"){const name=String(b.name||"").trim().slice(0,60);if(!name)throw"Enter your name.";if(!/^\S+@\S+\.\S+$/.test(email))throw"Enter a valid email.";if(pw.length<8)throw"Password needs 8 or more characters.";if(u)throw"That email already has an account.";const salt=crypto.randomBytes(16).toString("hex");u={id:db.users.length+1,name,email,salt,hash:hash(pw,salt),admin:db.users.length===0};db.users.push(u);save()}
  else if(!u||!crypto.timingSafeEqual(Buffer.from(hash(pw,u.salt),"hex"),Buffer.from(u.hash,"hex")))throw"Wrong email or password.";
  return send(res,200,{ok:1},{"Set-Cookie":"sid="+tok(u.id)+"; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000"+(req.headers["x-forwarded-proto"]==="https"?"; Secure":"")})}
 if(p==="logout")return send(res,200,{},{"Set-Cookie":"sid=; Path=/; Max-Age=0"});
 const u=who(req);if(!u)return send(res,401,{error:"Please sign in."});
 if(p==="me")return send(res,200,{user:{name:u.name,admin:u.admin}});
 if(p==="state")return send(res,200,view(u));
 if(post&&Object.prototype.hasOwnProperty.call(A,p)){const msg=A[p](u,b);save();return send(res,200,{msg,state:view(u)})}
 send(res,404,{error:"Not found"})}
const MIME={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml"};
function serve(p,res){const f=path.join(PUB,p==="/"?"index.html":p);if(!f.startsWith(PUB+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":MIME[path.extname(f)]||"application/octet-stream"});fs.createReadStream(f).pipe(res)}
http.createServer((req,res)=>{
 res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","same-origin");
 res.setHeader("Content-Security-Policy","default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com");
 const url=new URL(req.url,"http://x");if(!url.pathname.startsWith("/api/"))return serve(url.pathname,res);
 let body="";req.on("data",d=>{body+=d;if(body.length>1e4)req.destroy()});
 req.on("end",()=>{try{route(req,res,url.pathname.slice(5),body)}catch(e){typeof e==="string"?send(res,400,{error:e}):(console.error(e),send(res,500,{error:"Server error"}))}});
}).listen(PORT,()=>console.log("Library running on port "+PORT));
