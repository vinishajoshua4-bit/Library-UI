var DAY=864e5,state={copies:{},loans:[]};
BOOKS.forEach(function(b){state.copies[b.id]=b.n});
try{var s=localStorage.getItem("lib-state");if(s)state=JSON.parse(s)}catch(e){}
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
    return (!q||(b.t+" "+b.a).toLowerCase().indexOf(q)>=0)&&(!cat||b.c===cat)&&(!av||state.copies[b.id]>0)});
  if(!rows.length){ul.appendChild(el('<li class="empty">No books match. Clear the search or pick another category.</li>'));return}
  rows.forEach(function(b){
    var n=state.copies[b.id],have=mine().some(function(l){return l.id===b.id});
    var li=el('<li class="book" style="--c:'+COLORS[b.c]+'"><span class="spine"></span><div><h2>'+esc(b.t)+'</h2><div class="meta">'+esc(b.a)+', '+b.y+' &middot; '+b.c+'</div><div class="status '+(n?"ok":"late")+'">'+(n?n+(n===1?" copy available":" copies available"):"All copies on loan")+'</div></div><button class="btn"></button></li>');
    var btn=li.querySelector("button");
    btn.textContent=have?"Borrowed":"Borrow";
    btn.disabled=have||!n;
    btn.onclick=function(){state.copies[b.id]--;state.loans.push({id:b.id,who:me(),due:Date.now()+14*DAY});save();toast("Borrowed. Due "+fmt(Date.now()+14*DAY));render()};
    ul.appendChild(li);
  });
}
function renderLoans(){
  var ul=$("loanlist"),ls=mine();ul.innerHTML="";
  $("count").textContent=ls.length?"("+ls.length+")":"";
  if(!ls.length){ul.appendChild(el('<li class="empty">You have no books on loan. Find one in the catalog.</li>'));return}
  ls.forEach(function(l){
    var b=BOOKS.filter(function(x){return x.id===l.id})[0],d=Math.ceil((l.due-Date.now())/DAY);
    var cls=d<0?"late":d<=3?"due":"ok",txt=d<0?"Overdue by "+(-d)+(d===-1?" day":" days"):"Due "+fmt(l.due)+" ("+d+(d===1?" day":" days")+" left)";
    var li=el('<li class="book" style="--c:'+COLORS[b.c]+'"><span class="spine"></span><div><h2>'+esc(b.t)+'</h2><div class="meta">'+esc(b.a)+'</div><div class="status '+cls+'">'+txt+'</div></div><button class="btn ghost">Return</button></li>');
    li.querySelector("button").onclick=function(){state.loans.splice(state.loans.indexOf(l),1);state.copies[l.id]++;save();toast("Returned "+b.t);render()};
    ul.appendChild(li);
  });
}
function render(){renderCatalog();renderLoans()}
function tab(w){var c=w==="cat";$("catalog").hidden=!c;$("loans").hidden=c;$("t-cat").setAttribute("aria-selected",c);$("t-loans").setAttribute("aria-selected",!c)}
$("t-cat").onclick=function(){tab("cat")};$("t-loans").onclick=function(){tab("loans")};
["q","cat","avail","member"].forEach(function(i){$(i).addEventListener("input",render)});
render();
