const P=[
{id:'psu',name:'Power Supply (PSU)',x:4,y:74,w:26,h:20,deps:[],fn:'Nagko-convert ng AC papuntang DC at nagbibigay ng kuryente sa lahat ng parte.',tip:'Ikabit muna ito bago ang ibang parte. Kailangang tugma ang wattage (hal. 550W–750W).'},
{id:'mb',name:'Motherboard',x:34,y:7,w:42,h:64,deps:['psu'],z:1,fn:'Pangunahing circuit board kung saan nakakabit ang CPU, RAM, GPU at storage.',tip:'I-align sa standoffs at lagyan ng I/O shield bago i-screw.'},
{id:'cpu',name:'CPU',x:47,y:15,w:10,h:15,deps:['mb'],z:2,fn:'Ang “utak” ng computer; nagpoproseso ng mga instruction.',tip:'I-align ang gold triangle sa socket. Huwag pilitin ang pagpasok.'},
{id:'cooler',name:'CPU Fan',x:44.5,y:11,w:15,h:23,deps:['cpu'],z:4,fn:'Nagpapalamig sa CPU gamit ang heatsink at fan.',tip:'Lagyan ng thermal paste (size ng gisantes) bago ikabit.'},
{id:'ram1',name:'RAM 1',x:63.5,y:11,w:3.6,h:34,deps:['mb'],z:3,fn:'Pansamantalang memory para sa mga running program.',tip:'Itulak hanggang mag-“click” ang clips sa magkabilang dulo.'},
{id:'ram2',name:'RAM 2',x:68,y:11,w:3.6,h:34,deps:['mb'],z:3,fn:'Pangalawang RAM stick para sa dual-channel mode (mas mabilis).',tip:'Ilagay sa alternate slot (A2/B2) para sa dual-channel.'},
{id:'ssd',name:'M.2 SSD',x:37.5,y:37,w:15,h:5,deps:['mb'],z:3,fn:'Mabilis na storage para sa operating system at programs.',tip:'I-screw ang dulo nito sa standoff pagkatapos isaksak sa slot.'},
{id:'gpu',name:'Graphics Card (GPU)',x:36.5,y:47,w:38,h:12,deps:['mb'],z:3,fn:'Nagpoproseso ng graphics para sa games, video at display.',tip:'Ikabit sa PCIe x16 slot at i-screw sa case bracket.'},
{id:'hdd',name:'Hard Disk (HDD)',x:79,y:42,w:17,h:27,deps:['psu'],z:2,fn:'Malaking storage para sa files, videos at backup.',tip:'Kailangan ng SATA data cable at SATA power connector.'},
{id:'cable',name:'Power Cables (24-pin / 8-pin)',x:31.5,y:78,w:44,h:6,deps:['psu','mb'],z:3,fn:'Nagdadala ng kuryente mula PSU papunta sa motherboard at CPU.',tip:'Isaksak ang 24-pin ATX at 8-pin CPU power hanggang mag-lock.'},
{id:'fan',name:'Case Fan',x:79,y:8,w:17,h:27,deps:[],z:2,fn:'Naglalabas ng mainit na hangin at nagpapadaloy ng hangin sa loob ng case.',tip:'Bigyang-pansin ang direksyon ng arrow sa gilid ng fan.'}];
const $=s=>document.querySelector(s),stage=$('#stage');
const S={on:{},mode:'explore',sel:null,score:100,steps:0,t0:0,tm:null,quiz:null,auto:false};
const MODES={explore:'🔍 Explore',dis:'🔧 Disassembly',asm:'🛠️ Assembly',quiz:'🎯 Quiz'};
const by=id=>P.find(p=>p.id===id);
P.forEach(p=>{const d=document.createElement('div');d.className='part '+(p.id.startsWith('ram')?'ram ':p.id)+' off';d.id='p-'+p.id;
Object.assign(d.style,{left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%',zIndex:p.z||2});
d.innerHTML='<span class="lbl">'+p.name+'</span>';d.onclick=()=>click(p);stage.appendChild(d)});
Object.entries(MODES).forEach(([k,v])=>{const b=document.createElement('button');b.className='tab';b.textContent=v;b.id='t-'+k;b.onclick=()=>setMode(k);$('#tabs').appendChild(b)});
function toast(m,e){const t=$('#toast');t.textContent=m;t.className='show'+(e?' err':'');clearTimeout(t._);t._=setTimeout(()=>t.className='',2400)}
function log(m,c=''){const d=document.createElement('div');d.className=c;d.textContent=m;$('#log').prepend(d)}
function penalty(m,id){S.score=Math.max(0,S.score-5);toast('⚠ '+m,1);log(m,'e');if(id){const e=$('#p-'+id);e.classList.add('bad');setTimeout(()=>e.classList.remove('bad'),400)}hud()}
function hud(){$('#score').textContent=S.score;$('#steps').textContent=S.steps;const n=P.filter(p=>S.on[p.id]).length;$('#pc').textContent=n+'/'+P.length;$('#bar').style.width=n/P.length*100+'%'}
function startTimer(){if(S.t0)return;S.t0=Date.now();S.tm=setInterval(()=>{const s=Math.floor((Date.now()-S.t0)/1000);$('#time').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},500)}
function stopTimer(){clearInterval(S.tm)}
function paint(){stage.className=($('#lblT').checked&&S.mode!=='quiz'?'':'nolbl')+(S.mode==='asm'?' asm':'');
stage.id='stage';P.forEach(p=>{const e=$('#p-'+p.id);e.classList.toggle('on',!!S.on[p.id]);e.classList.toggle('off',!S.on[p.id]);e.classList.toggle('pick',S.sel===p.id)});
const tr=$('#tray');tr.innerHTML='';const off=P.filter(p=>!S.on[p.id]);
if(!off.length)tr.innerHTML='<span style="color:var(--mute);font-size:.8rem">'+(S.mode==='asm'?'Kumpleto na ang PC! ✅':'Walang natanggal na parte.')+'</span>';
off.forEach(p=>{const b=document.createElement('button');b.className='chip'+(S.sel===p.id?' sel':'');b.textContent=p.name;b.onclick=()=>{if(S.mode==='asm'){S.sel=S.sel===p.id?null:p.id;info(p);paint()}else info(p)};tr.appendChild(b)});hud()}
function info(p){$('#info').innerHTML='<h3>📘 Impormasyon</h3><div class="nm">'+p.name+'</div><p><b>Gamit:</b> '+p.fn+'</p><p><b>Tip:</b> '+p.tip+'</p><p><b>Dependency:</b> '+(p.deps.length?p.deps.map(d=>by(d).name).join(', '):'Wala (pwedeng unahin)')+'</p>'}
function strapOK(){if($('#strap').checked||S.auto)return true;const e=$('#esd');e.classList.add('warn');setTimeout(()=>e.classList.remove('warn'),1800);toast('Isuot muna ang anti-static wrist strap para iwas ESD!',1);return false}
function remove(p){const b=P.filter(q=>S.on[q.id]&&q.deps.includes(p.id));if(b.length)return penalty('Tanggalin muna ang: '+b.map(x=>x.name).join(', '),p.id),false;
S.on[p.id]=0;S.steps++;log('Tinanggal: '+p.name,'g');return true}
function install(p){const m=p.deps.filter(d=>!S.on[d]);if(m.length)return penalty('Ikabit muna ang: '+m.map(d=>by(d).name).join(', '),p.id),false;
S.on[p.id]=1;S.steps++;if(S.sel===p.id)S.sel=null;log('Naikabit: '+p.name,'g');return true}
function click(p){
if(S.mode==='quiz')return quizClick(p);
if(S.mode==='explore'||(S.mode==='dis'&&!S.on[p.id])){info(p);return}
if(!strapOK())return;startTimer();
if(S.mode==='dis'){if(remove(p)){info(p);if(!P.some(q=>S.on[q.id]))done('Disassembly')}}
else if(S.mode==='asm'){if(S.on[p.id]){info(p);return}
if(S.sel&&S.sel!==p.id)return penalty('Maling slot! Hindi iyan ang '+by(S.sel).name,p.id);
if(install(p)){info(p);if(P.every(q=>S.on[q.id]))done('Assembly')}}
paint()}
function done(n){stopTimer();const t=$('#time').textContent;toast('🎉 Tapos na ang '+n+'! Score '+S.score+' · '+t);log(n+' complete — Score '+S.score+', oras '+t,'g')}
function setMode(m){S.auto=false;S.mode=m;S.sel=null;S.score=100;S.steps=0;S.t0=0;stopTimer();$('#time').textContent='0:00';
P.forEach(p=>S.on[p.id]=m==='asm'?0:1);S.quiz=null;
document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.id==='t-'+m));
$('#auto').style.display=(m==='dis'||m==='asm')?'':'none';$('#auto').textContent=m==='dis'?'▶ Auto Disassemble':'▶ Auto Assemble';
$('#log').innerHTML='';
const msg={explore:'I-click ang parte para makita ang detalye.',dis:'Tanggalin ang mga parte sa tamang pagkakasunod-sunod (kabaligtaran ng pagkakabit).',asm:'Pumili sa tray, saka i-click ang tamang slot. Sundin ang tamang order.',quiz:'Hanapin ang parte na itatanong. 10 rounds!'}[m];
log(msg);toast(msg);if(m==='quiz')nextQ();paint()}
function nextQ(){if(S.quiz===null||S.quiz===undefined||S.quiz.n===undefined)S.quiz={n:0,ok:0};
if(S.quiz.n>=10){toast('🏁 Quiz tapos! '+S.quiz.ok+'/10 tama',0);log('Final: '+S.quiz.ok+'/10','g');S.quiz.cur=null;$('#info').innerHTML='<h3>🎯 Resulta</h3><div class="nm">'+S.quiz.ok+' / 10</div><p>Pindutin ang Quiz ulit para mag-retry.</p>';return}
S.quiz.cur=P[Math.floor(Math.random()*P.length)];$('#info').innerHTML='<h3>🎯 Round '+(S.quiz.n+1)+'/10</h3><div class="nm">Hanapin: '+S.quiz.cur.name+'</div><p>Hint: '+S.quiz.cur.fn+'</p>'}
function quizClick(p){const q=S.quiz;if(!q||!q.cur)return;q.n++;
if(p.id===q.cur.id){q.ok++;S.score+=0;log('✔ Tama: '+p.name,'g');toast('✔ Tama!')}else{log('✖ Mali. Ito ay '+p.name+', hindi '+q.cur.name,'e');toast('✖ Mali! Ito ay '+p.name,1)}
nextQ()}
$('#reset').onclick=()=>setMode(S.mode);$('#lblT').onchange=paint;
$('#auto').onclick=async()=>{if(S.auto)return;setMode(S.mode);const m=S.mode;S.auto=true;
const order=m==='dis'?[...P].reverse():P;
for(const p of(m==='dis'?[...P].sort((a,b)=>depth(b)-depth(a)):[...P].sort((a,b)=>depth(a)-depth(b)))){if(!S.auto)return;await new Promise(r=>setTimeout(r,550));(m==='dis'?remove(p):install(p));info(p);paint()}
S.auto=false;stopTimer()};
function depth(p){return p.deps.length?1+Math.max(...p.deps.map(d=>depth(by(d)))):0}
setMode('explore');
