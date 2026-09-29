var DAY=864e5,state={copies:{},loans:[]};
BOOKS.forEach(function(b){state.copies[b.id]=b.n});
try{var s=localStorage.getItem("lib-state");if(s)state=JSON.parse(s)}catch(e){}
state.fav=state.fav||[];state.wait=state.wait||[];state.extra=state.extra||[];state.extra.forEach(function(b){BOOKS.push(b)});
function save(){try{localStorage.setItem("lib-state",JSON.stringify(state))}catch(e){}}
var $=function(i){return document.getElementById(i)};
var cats=[];BOOKS.forEach(function(b){if(cats.indexOf(b.c)<0)cats.push(b.c)});
cats.forEach(function(c){var o=document.createElement("option");o.textContent=c;o.value=c;$("cat").appendChild(o)});
function toast(m){var t=$("toast");t.textContent=m;t.className="show";clearTimeout(toast.h);toast.h=setTimeout(function(){t.className=""},2200)}
function me(){return $("member").value}
function mine(){return state.loans.filter(function(l){return l.who===me()})}
function fmt(ts){return new Date(ts).toLocaleDateString(undefined,{day:"numeric",month:"short"})}
function el(html){var d=document.createElement("div");d.innerHTML=html;return d.firstChild}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function renderCatalog(){
  var q=$("q").value.toLowerCase(),cat=$("cat").value,av=$("avail").checked,ul=$("list");
  ul.innerHTML="";
  var rows=BOOKS.filter(function(b){
    return (!q||(b.t+" "+b.a).toLowerCase().indexOf(q)>=0)&&(!cat||b.c===cat)&&(!av||state.copies[b.id]>0)&&(!$("favo").checked||state.fav.indexOf(b.id)>=0)});rows.sort(function(x,y){var s=$("sort").value;return s==="new"?y.y-x.y:s==="avail"?state.copies[y.id]-state.copies[x.id]:x.t.localeCompare(y.t)});
  if(!rows.length){ul.appendChild(el('<li class="empty">No books match. Clear the search or pick another category.</li>'));return}
  rows.forEach(function(b,ix){
    var n=state.copies[b.id],have=mine().some(function(l){return l.id===b.id});
    var li=el('<li class="book" style="--c:'+COLORS[b.c]+'"><div class="b3d"><i></i></div><div><h2>'+esc(b.t)+'</h2><div class="meta">'+esc(b.a)+', '+b.y+' &middot; '+b.c+'</div><div class="status '+(n?"ok":"late")+'">'+(n?n+(n===1?" copy available":" copies available"):"All copies on loan")+'</div></div><div class="acts"><button class="fav" aria-label="Favorite">&#9825;</button><button class="btn"></button></div></li>');
    li.style.setProperty("--i",ix);var btn=li.querySelector(".btn");
    var w=state.wait.some(function(x){return x.id===b.id&&x.who===me()});
    btn.textContent=have?"Borrowed":n?"Borrow":w?"Reserved":"Reserve";
    btn.disabled=have||(!n&&w);
    btn.onclick=function(){if(n){state.copies[b.id]--;burst(btn);state.loans.push({id:b.id,who:me(),due:Date.now()+14*DAY,rn:0});save();toast("Borrowed. Due "+fmt(Date.now()+14*DAY))}else{state.wait.push({id:b.id,who:me()});save();toast("Reserved. You get the next returned copy.")}render()};
    var fv=li.querySelector(".fav"),on=state.fav.indexOf(b.id)>=0;fv.textContent=on?"\u2665":"\u2661";fv.setAttribute("aria-pressed",on);
    fv.onclick=function(){var i=state.fav.indexOf(b.id);i<0?state.fav.push(b.id):state.fav.splice(i,1);save();render()};
    ul.appendChild(li);
  });
}
function renderLoans(){
  var ul=$("loanlist"),ls=mine();ul.innerHTML="";
  $("count").textContent=ls.length?"("+ls.length+")":"";
  if(!ls.length){ul.appendChild(el('<li class="empty">You have no books on loan. Find one in the catalog.</li>'));return}
  ls.forEach(function(l){
    var b=BOOKS.filter(function(x){return x.id===l.id})[0],d=Math.ceil((l.due-Date.now())/DAY);
    var cls=d<0?"late":d<=3?"due":"ok",txt=d<0?"Overdue by "+(-d)+(d===-1?" day":" days")+". Fine \u20b9"+(-d)*2:"Due "+fmt(l.due)+" ("+d+(d===1?" day":" days")+" left)";
    var li=el('<li class="book" style="--c:'+COLORS[b.c]+'"><div class="b3d"><i></i></div><div><h2>'+esc(b.t)+'</h2><div class="meta">'+esc(b.a)+'</div><div class="status '+cls+'">'+txt+'</div></div><div class="acts"><button class="btn ghost rn">Renew</button><button class="btn ghost rt">Return</button></div></li>');
    var rt=li.querySelector(".rt"),rn=li.querySelector(".rn");
    rn.disabled=l.rn>=1||d<0;rn.textContent=l.rn>=1?"Renewed":"Renew +7d";
    rn.onclick=function(){l.due+=7*DAY;l.rn=1;save();toast("Renewed. New due date "+fmt(l.due));render()};
    rt.onclick=function(){state.loans.splice(state.loans.indexOf(l),1);var q=state.wait.filter(function(x){return x.id===l.id})[0];if(q){state.wait.splice(state.wait.indexOf(q),1);state.loans.push({id:l.id,who:q.who,due:Date.now()+14*DAY,rn:0});toast("Returned. Passed to "+q.who+" from the waitlist.")}else{state.copies[l.id]++;toast("Returned "+b.t)}save();render()};
    ul.appendChild(li);
  });
}
function render(){renderCatalog();renderLoans();renderStats()}
function tab(w){["cat","loans","add"].forEach(function(k){var s={cat:"catalog",loans:"loans",add:"add"}[k];$(s).hidden=k!==w;$("t-"+k).setAttribute("aria-selected",k===w)})}
$("t-cat").onclick=function(){tab("cat")};$("t-loans").onclick=function(){tab("loans")};$("t-add").onclick=function(){tab("add")};
["q","cat","avail","member","sort","favo"].forEach(function(i){$(i).addEventListener("input",render)});
render();
function burst(btn){var r=btn.getBoundingClientRect();for(var i=0;i<16;i++){var s=document.createElement("span"),a=Math.random()*6.28,d=40+Math.random()*70;s.className="pc";s.style.cssText="left:"+(r.left+r.width/2)+"px;top:"+(r.top+r.height/2)+"px;background:hsl("+Math.random()*360+",90%,60%);--x:"+Math.cos(a)*d+"px;--y:"+Math.sin(a)*d+"px";document.body.appendChild(s);setTimeout(function(e){e.remove()},900,s)}}
function renderStats(){var tot=0,av=0,h="";BOOKS.forEach(function(b){tot+=b.n;av+=state.copies[b.id]});
[["Titles",BOOKS.length],["Copies free",av],["On loan",tot-av]].forEach(function(x){h+='<div class="st"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>'});
h+='<div class="bars">';cats.forEach(function(c){var t=0,u=0;BOOKS.forEach(function(b){if(b.c===c){t+=b.n;u+=b.n-state.copies[b.id]}});h+='<div class="bar"><span>'+c+'</span><i style="--c:'+COLORS[c]+';width:'+(t?Math.round(u/t*100):0)+'%"></i></div>'});
$("stats").innerHTML=h+'</div>'}
function buildRing(){var r=$("ring");r.innerHTML="";BOOKS.slice(-10).forEach(function(b,i){var p=document.createElement("div");p.className="pn";p.style.cssText="--c:"+COLORS[b.c]+";transform:rotateY("+i*36+"deg) translateZ(210px)";p.innerHTML="<b>"+esc(b.t)+"</b><small>"+esc(b.a)+"</small>";r.appendChild(p)})}buildRing();
cats.forEach(function(c){var o=document.createElement("option");o.textContent=c;$("nc").appendChild(o)});
$("skip").onclick=function(){state.loans.forEach(function(l){l.due-=10*DAY});save();toast("Moved 10 days ahead");render()};
$("addbtn").onclick=function(){var t=$("nt").value.trim(),au=$("na").value.trim(),n=parseInt($("nn").value,10),y=parseInt($("ny").value,10)||2024;if(!t||!au||!(n>0)){toast("Enter a title, an author, and at least 1 copy.");return}var id=Date.now(),b={id:id,t:t,a:au,c:$("nc").value,y:y,n:n};BOOKS.push(b);state.extra.push(b);state.copies[id]=n;save();["nt","na","nn","ny"].forEach(function(i){$(i).value=""});toast("Added "+t);tab("cat");buildRing();render()};
var fxs=$("fx");
function setFx(f){document.documentElement.setAttribute("data-fx",f);try{localStorage.setItem("lib-fx",f)}catch(e){}[].forEach.call(fxs.children,function(x){x.setAttribute("aria-pressed",x.dataset.f===f)})}
["classic","aurora","neon","sunset","forest","ocean"].forEach(function(f){var x=document.createElement("button");x.className="fxb";x.dataset.f=f;x.textContent=f;x.onclick=function(){setFx(f)};fxs.appendChild(x)});
var saved="aurora";try{saved=localStorage.getItem("lib-fx")||"aurora"}catch(e){}setFx(saved);
var cv=$("fxc"),cx=cv.getContext("2d"),P=[],still=matchMedia("(prefers-reduced-motion:reduce)").matches;
function rs(){cv.width=innerWidth;cv.height=innerHeight}rs();addEventListener("resize",rs);
for(var k=0;k<40;k++)P.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:1+Math.random()*3,v:.2+Math.random()*.6});
function tick(){cx.clearRect(0,0,cv.width,cv.height);var f=document.documentElement.getAttribute("data-fx");if(f!=="classic"){cx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();cx.globalAlpha=.35;var d=f==="forest"?1:-1;P.forEach(function(p){p.y+=d*p.v;if(p.y<-5)p.y=cv.height+5;if(p.y>cv.height+5)p.y=-5;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.28);cx.fill()})}if(!still)requestAnimationFrame(tick)}
tick();render();
