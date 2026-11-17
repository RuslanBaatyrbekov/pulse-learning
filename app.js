(function(){
'use strict';
var C={weeks:[],roadmap:[]}, WK=[], ALL=[], LBY={}, TOTAL=0, KEY='puls-daten-v1', CKEY='puls-course-v1', courseErr='';
/* Неделя с полем track входит в курс, только если ученица выбрала этот трек. До выбора курс заканчивается перед первой неделей трека. */
function weeksFor(st){st=st||{};var out=[],stop=false;(C.weeks||[]).forEach(function(w){if(stop)return;if(w.track){if(st.track===w.track)out.push(w);else if(!st.track)stop=true;}else out.push(w);});return out;}
function daysFor(st){var a=[];weeksFor(st).forEach(function(w){a=a.concat(w.days);});return a;}
function rebuild(){WK=weeksFor(S);ALL=[];WK.forEach(function(w,wi){w.days.forEach(function(d){d.week=wi;d.idx=ALL.length;ALL.push(d);});});}
function setCourse(c){if(!c||!c.weeks)return false;C=c;LBY={};TOTAL=0;var tr=null;
  C.weeks.forEach(function(w){if(w.track&&!tr)tr=w.track;if(!w.track||w.track===tr)TOTAL+=w.days.length;w.days.forEach(function(d){LBY[d.id]=d;(d.tasks||[]).forEach(function(t,i){t._k=d.id+':'+i;});});});
  rebuild();return true;}
function hasTracks(){return (C.weeks||[]).some(function(w){return !!w.track;});}
function trackName(t){var m=C.tracks||{};return (m[t]&&m[t].name)||({ds:'Medical Data Science',dh:'Digital Health'})[t]||t;}
if(window.COURSE)setCourse(window.COURSE);
var LEVELS=[[0,'Новичок в отделении'],[120,'Сборщик данных'],[300,'Младший аналитик'],[550,'Детектив данных'],[900,'Клинический аналитик'],[1400,'Знаток Python'],[2000,'Хранитель таблиц'],[3000,'Статистик у постели'],[4500,'Строитель моделей'],[6500,'Переводчик стандартов'],[9000,'Знаток регуляторики'],[12000,'Исследователь сигналов'],[15000,'Специалист своего трека'],[18000,'Готова к новой профессии']];
var TAGS={py:'Python',dom:'Медицина и ИТ',stat:'Статистика',sql:'SQL',ml:'Машинное обучение',reg:'Регуляторика',sig:'Сигналы',car:'Карьера',boss:'Контрольная'};
var $=function(s){return document.querySelector(s);};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ds(d){var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x;}
function today(){return ds(new Date());}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function def(){return {name:'',xp:0,done:{},days:{},frozen:{},freezes:0,missed:{},missions:{},newDay:'',newN:0,best:0,perfect:0,reviews:0,t:0};}

/* ---------- состояние ---------- */
var S=def(), SB=null, ME=null, EMAIL='', OWNER=false, syncState='local', pushT=null, pushing=false, again=false, loginErr='', loginBusy=false, loginEm='';
try{var raw=localStorage.getItem(KEY);if(raw)S=Object.assign(def(),JSON.parse(raw));}catch(e){}
function cfgOk(){var c=window.PULS_CONFIG||{};return !!(c.url&&c.anonKey&&c.url.indexOf('ВСТАВЬ')<0&&window.supabase&&window.supabase.createClient);}
function save(){S.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}schedulePush();}
function adopt(c){S=Object.assign(def(),JSON.parse(JSON.stringify(c)));try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function schedulePush(){if(!SB||!ME||OWNER)return;clearTimeout(pushT);pushT=setTimeout(push,600);}
function push(){if(!SB||!ME||OWNER)return;if(pushing){again=true;return;}pushing=true;again=false;
  SB.from('progress').upsert({user_id:ME,state:JSON.parse(JSON.stringify(S)),updated_at:new Date().toISOString()})
  .then(function(r){syncState=r.error?'error':'cloud';},function(){syncState='error';})
  .then(function(){pushing=false;if(again)push();if(view==='progress')render();});}
function pull(){if(!SB||!ME||OWNER)return;
  SB.from('progress').select('state').eq('user_id',ME).maybeSingle().then(function(r){
    if(r.error){syncState='error';if(view==='progress')render();return;}
    var c=r.data&&r.data.state;
    if(c&&(c.t||0)>(S.t||0)){adopt(c);syncState='cloud';if(view!=='run'&&view!=='result')render();}
    else if(S.t&&(!c||(c.t||0)<S.t))push();
    else{syncState='cloud';if(view==='progress')render();}
  },function(){syncState='error';});}
function onSession(sess){var id=sess&&sess.user?sess.user.id:null;
  if(!id){ME=null;EMAIL='';OWNER=false;syncState='local';view='login';render();return;}
  if(id===ME&&view!=='boot'&&view!=='login')return;
  ME=id;EMAIL=sess.user.email||'';
  if(S.uid&&S.uid!==ME){S=def();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
  S.uid=ME;S.email=EMAIL;
  SB.from('observers').select('user_id').eq('user_id',ME).maybeSingle().then(function(r){OWNER=!!(r&&r.data);},function(){OWNER=false;})
  .then(loadCourse)
  .then(function(ok){if(!ok){view='nocourse';render();return;}
    if(OWNER)syncState='owner';else{syncState='connecting';pull();}
    if(view==='boot'||view==='login'||view==='nocourse')view=fromHash();render();});}
function loadCourse(){
  return SB.from('course_content').select('data').eq('id','main').maybeSingle().then(function(r){
    if(!r.error&&r.data&&setCourse(r.data.data)){courseErr='';try{localStorage.setItem(CKEY,JSON.stringify(r.data.data));}catch(e){}return true;}
    courseErr=r.error?'Сервер не отдал уроки: '+(r.error.message||'ошибка доступа')+'.':'В базе нет уроков. Выполни content.sql в Supabase.';
    return fromCache();
  },function(){courseErr='Нет связи с сервером.';return fromCache();});}
function fromCache(){try{var c=JSON.parse(localStorage.getItem(CKEY)||'null');if(c&&setCourse(c)){toast('Нет связи: уроки открыты из сохранённой копии.');return true;}}catch(e){}return false;}
function vNoCourse(){var noCfg=!cfgOk();
  return '<div class="top"><div class="brand"><svg viewBox="0 0 28 16"><path d="M0 9h7l2-3 3 9 3-14 3 8h10"/></svg>Пульс данных</div></div><section class="card hero"><h1>'+(noCfg?'Курс не настроен':'Уроки не загрузились')+'</h1><p class="small" style="margin:0">'+
  (noCfg?'Заполни адрес базы и ключ в config.js. Подробности в README.':esc(courseErr))+'</p>'+(noCfg?'':'<div class="foot"><button class="btn" data-a="retry">Попробовать снова</button>'+(ME?'<button class="btn ghost" data-a="logout">Выйти</button>':'')+'</div>')+'</section>';}
function initCloud(){if(!cfgOk())return;var c=window.PULS_CONFIG;
  SB=window.supabase.createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  view='boot';render();
  SB.auth.getSession().then(function(r){onSession(r&&r.data&&r.data.session);},function(){onSession(null);});
  SB.auth.onAuthStateChange(function(ev,sess){if(ev==='SIGNED_OUT')onSession(null);});
  document.addEventListener('visibilitychange',function(){if(document.hidden)return;pull();if(OWNER&&view==='watch')loadWatch();});
  window.addEventListener('online',function(){pull();});}
function doLogin(){var em=$('#em').value.trim(),pw=$('#pw').value;loginEm=em;if(!em||!pw){loginErr='Введи email и пароль.';render();return;}
  loginBusy=true;loginErr='';render();
  SB.auth.signInWithPassword({email:em,password:pw}).then(function(r){loginBusy=false;
    if(r.error){loginErr=/invalid/i.test(r.error.message)?'Неверный email или пароль.':'Не получилось войти: '+r.error.message;render();return;}
    onSession(r.data.session);},function(){loginBusy=false;loginErr='Нет связи с сервером. Проверь интернет.';render();});}
function vLogin(){return '<div class="top"><div class="brand"><svg viewBox="0 0 28 16"><path d="M0 9h7l2-3 3 9 3-14 3 8h10"/></svg>Пульс данных</div></div>'+
  '<section class="card hero"><div class="eyebrow">Вход</div><h1>Твой курс ждёт</h1><p class="small muted" style="margin:0">Вход нужен, чтобы прогресс сохранялся на сервере и был виден на всех твоих устройствах. Аккаунт выдаёт владелец курса, регистрации нет.</p>'+
  '<form id="lf" style="display:flex;flex-direction:column;gap:10px"><label class="small" for="em">Email</label><input class="txt" style="max-width:none" id="em" type="email" autocomplete="username" inputmode="email" required value="'+esc(loginEm)+'">'+
  '<label class="small" for="pw">Пароль</label><input class="txt" style="max-width:none" id="pw" type="password" autocomplete="current-password" required>'+
  (loginErr?'<p class="small" role="alert" style="margin:0;color:var(--bad)">'+esc(loginErr)+'</p>':'')+
  '<button class="btn" type="submit"'+(loginBusy?' disabled':'')+'>'+(loginBusy?'Вхожу…':'Войти')+'</button></form></section>';}
function vBoot(){return '<div class="card">Загрузка…</div>';}

function active(k,st){st=st||S;return st.days[k]!==undefined||!!(st.frozen&&st.frozen[k]);}
function streak(st){st=st||S;var d=new Date();if(!active(ds(d),st)){d=addDays(d,-1);if(!active(ds(d),st))return 0;}var n=0;while(active(ds(d),st)){if(st.days[ds(d)]!==undefined)n++;d=addDays(d,-1);}return n;}
function applyFreezes(){var keys=Object.keys(S.days).concat(Object.keys(S.frozen)).sort();if(!keys.length||!S.freezes)return;var last=keys[keys.length-1],gap=[],d=addDays(new Date(),-1);
  while(ds(d)>last&&gap.length<6){gap.push(ds(d));d=addDays(d,-1);}
  if(gap.length&&gap.length<=S.freezes){gap.forEach(function(k){S.frozen[k]=1;});S.freezes-=gap.length;save();}}
function level(st){st=st||S;var i=0;for(var k=0;k<LEVELS.length;k++)if(st.xp>=LEVELS[k][0])i=k;var nx=LEVELS[i+1];return {i:i,name:LEVELS[i][1],from:LEVELS[i][0],to:nx?nx[0]:null};}
function listFor(st){return (!st||st===S)?ALL:daysFor(st);}
function nextIdx(st){var list=listFor(st);st=st||S;for(var i=0;i<list.length;i++)if(!st.done[list[i].id])return i;return -1;}
function nextLesson(st){var i=nextIdx(st);return i<0?null:listFor(st)[i];}
function needTrack(st){st=st||S;return hasTracks()&&!st.track&&listFor(st).length>0&&nextIdx(st)<0;}
function newToday(){return S.newDay===today()?S.newN:0;}
function doneCount(st){st=st||S;var n=0;Object.keys(st.done||{}).forEach(function(id){if(LBY[id])n++;});return n;}

/* ---------- маршрут ---------- */
var VIEWS=['path','glossary','sandbox','progress','watch'], view='path', R=null, T=null, RES=null, toastT=null;
function fromHash(){var h=(location.hash||'').slice(1);return VIEWS.indexOf(h)>=0?h:'path';}
window.addEventListener('hashchange',function(){if(view==='run'||view==='result')return;view=fromHash();render();});
function toast(m){var o=$('.toast');if(o)o.remove();var t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);clearTimeout(toastT);toastT=setTimeout(function(){t.remove();},3600);}

/* ---------- лента ЭКГ ---------- */
function stripSvg(st){st=st||S;var n=14,w=560/n,y=46,p='M0 '+y,lab='',t=new Date();
  for(var i=0;i<n;i++){var d=addDays(t,i-(n-1)),k=ds(d),x=i*w;
    if(st.days[k]!==undefined){var h=Math.min(36,16+(st.days[k]||0)/5);p+=' L'+(x+w*.2)+' '+y+' Q'+(x+w*.28)+' '+(y-6)+' '+(x+w*.36)+' '+y+' L'+(x+w*.44)+' '+(y+5)+' L'+(x+w*.52)+' '+(y-h)+' L'+(x+w*.6)+' '+(y+9)+' L'+(x+w*.66)+' '+y+' Q'+(x+w*.78)+' '+(y-9)+' '+(x+w*.9)+' '+y+' L'+(x+w)+' '+y;}
    else if(st.frozen&&st.frozen[k]){p+=' L'+(x+w*.4)+' '+y+' Q'+(x+w*.5)+' '+(y-5)+' '+(x+w*.6)+' '+y+' L'+(x+w)+' '+y;}
    else p+=' L'+(x+w)+' '+y;
    lab+='<text x="'+(x+w/2)+'" y="70" text-anchor="middle">'+d.getDate()+'</text>';}
  return '<svg class="strip" viewBox="0 0 560 76" preserveAspectRatio="none" role="img" aria-label="Активность за 14 дней"><line class="today" x1="'+(560-w)+'" y1="4" x2="'+(560-w)+'" y2="60"/><path d="'+p+'"/>'+lab+'</svg>';}

/* ---------- экраны ---------- */
function header(){return '<div class="top"><div class="brand"><svg viewBox="0 0 28 16"><path d="M0 9h7l2-3 3 9 3-14 3 8h10"/></svg>Пульс данных</div><div class="chips"><span class="chip num" title="Дней подряд"><b>♥</b> '+streak()+'</span><span class="chip xp num" title="Очки опыта"><b>XP</b> '+S.xp+'</span></div></div>';}
function dayRow(L){var done=!!S.done[L.id],nx=nextIdx()===L.idx,cls=done?'done':nx?'next':'lock';
  var st=done?(S.done[L.id].p?'Без ошибок':'Пройдено')+' · можно повторить':nx?(L.boss?'Контрольная и практика · 20 мин':'Урок · 15 мин'):'Откроется после предыдущего дня';
  return '<button class="day '+cls+'" data-a="open" data-i="'+L.idx+'"'+(cls==='lock'?' aria-disabled="true"':'')+'><span class="n">'+(done?'✓':L.idx+1)+'</span><span class="grow"><span class="tt">'+esc(L.title)+'</span><br><span class="st">'+st+'</span></span><span class="tag">'+TAGS[L.tag]+'</span></button>';}
function vPath(){var s=streak(),lv=level(),ni=nextIdx(),did=S.days[today()]!==undefined,cap=newToday()>=2,h=header();
  var pct=lv.to?Math.round((S.xp-lv.from)/(lv.to-lv.from)*100):100,cta,sub;
  if(needTrack()){cta='<button class="btn" data-a="track" data-v="ds">'+esc(trackName('ds'))+'</button><button class="btn ghost" data-a="track" data-v="dh">'+esc(trackName('dh'))+'</button>';sub='Общая часть пройдена. Выбери трек на следующие пять недель: Medical Data Science — модели и исследования, Digital Health — продукт, стандарты и качество. Сменить можно в настройках.';}
  else if(ni<0){cta='<button class="btn" data-a="review">Повторение</button>';sub='Весь курс пройден. Повторение держит знания свежими, а вкладка «Прогресс» хранит твой путь.';}
  else if(cap){cta='<button class="btn" data-a="review">Повторение</button>';sub='Два новых урока сегодня уже пройдены. День '+(ni+1)+' откроется завтра.';}
  else{cta='<button class="btn" data-a="open" data-i="'+ni+'">'+(did?'Ещё один урок: день ':'Начать день ')+(ni+1)+'</button>'+(doneCount()?'<button class="btn ghost" data-a="review">Повторение</button>':'');sub=did?'Сегодняшний пульс есть. Можно остановиться или пройти ещё один урок.':s>0?'Пульс ровный. Не пропусти сегодняшний день.':'Один урок в день, 15 минут. Сегодня: '+esc(ALL[ni].title)+'.';}
  h+='<section class="card hero"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="eyebrow">'+esc(S.name||'Привет')+', твой пульс</div><div class="row" style="align-items:baseline;gap:8px"><span class="big num">'+s+'</span><span class="muted">'+plural(s,'день подряд','дня подряд','дней подряд')+'</span></div></div><div class="small muted" style="text-align:right">Заморозки: <b class="num">'+S.freezes+'</b><br>Рекорд: <b class="num">'+Math.max(S.best,s)+'</b></div></div>'+stripSvg()+
    '<div><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+S.xp+(lv.to?' / '+lv.to:'')+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+pct+'%"></i></div></div><p class="small" style="margin:0">'+sub+'</p><div class="foot">'+cta+'</div></section>';
  WK.forEach(function(w,wi){var d=w.days.filter(function(l){return S.done[l.id];}).length;
    h+='<section class="week"><div><div class="eyebrow">Неделя '+(wi+1)+(w.track?' · трек '+esc(trackName(w.track)):'')+' · <span class="num">'+d+' из '+w.days.length+'</span></div><h2>'+esc(w.title)+'</h2><p class="small muted" style="margin:4px 0 0">'+esc(w.sub)+'</p></div><div class="days">'+w.days.map(dayRow).join('')+'</div></section>';});
  if(C.roadmap&&C.roadmap.length)h+='<section class="card"><div class="eyebrow">Дальше по плану · 9 месяцев всего</div><h2 style="margin:4px 0 12px">Маршрут до смены профессии</h2><div class="road">'+C.roadmap.map(function(r){return '<div><span class="small muted">'+r.w+'</span><br><b>'+r.t+'</b><br><span class="small">'+r.d+'</span></div>';}).join('')+'</div></section>';
  return h;}
function plural(n,a,b,c){var m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c;}

function allTerms(){var out=[];ALL.forEach(function(l){(l.terms||[]).forEach(function(t){out.push({t:t,open:!!S.done[l.id],day:l.idx+1});});});return out;}
function vGloss(){var ts=allTerms(),op=ts.filter(function(x){return x.open;});
  var h=header()+'<section><div class="eyebrow">Словарь · <span class="num">'+op.length+' из '+ts.length+'</span></div><h1>Термины на трёх языках</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Немецкий термин, английский и пояснение. Именно так они стоят в вакансиях. Новые открываются после каждого урока.</p></section>';
  if(!op.length)h+='<div class="card">Пройди первый урок, и здесь появятся первые три термина.</div>';
  h+='<div class="terms">'+op.map(function(x){return '<div class="term"><b lang="de">'+esc(x.t[0])+'</b><span lang="en">'+esc(x.t[1])+'</span><em>'+esc(x.t[2])+'</em></div>';}).join('')+'</div>';
  if(op.length<ts.length)h+='<p class="small muted">Ещё закрыто: '+(ts.length-op.length)+'.</p>';
  return h;}

var sandSrc='werte = [72, 80, 95, 110]\nfor w in werte:\n    if w > 100:\n        print(w, "Tachykardie")\n    else:\n        print(w, "ok")', sandOut='', py=null, pyLoading=false;
function vSand(){return header()+'<section><div class="eyebrow">Песочница</div><h1>Python прямо здесь</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Пиши код и запускай. Первый запуск загружает Python, это до минуты. Код из уроков открывается здесь кнопкой «Запустить».</p></section>'+
  '<label class="eyebrow" for="src">Код</label><textarea id="src" spellcheck="false" autocapitalize="off" autocomplete="off">'+esc(sandSrc)+'</textarea><div class="foot"><button class="btn" data-a="run" id="runbtn"'+(pyLoading?' disabled':'')+'>'+(pyLoading?'Выполняю…':'Запустить')+'</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="https://colab.research.google.com" target="_blank" rel="noopener">Открыть Google Colab</a></div><div class="eyebrow">Результат</div><pre class="out" id="out" aria-live="polite">'+esc(sandOut||'Здесь появится вывод программы.')+'</pre>';}
function loadPy(){if(py)return Promise.resolve(py);return new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';s.onload=res;s.onerror=function(){rej(new Error('load'));};document.head.appendChild(s);}).then(function(){return window.loadPyodide();}).then(function(p){py=p;return p;});}
function execPy(code,show){if(pyLoading)return;pyLoading=true;show('Загружаю Python. Первый раз это до минуты…');var buf=[],out;
  var timer=setTimeout(function(){if(pyLoading)show('Python всё ещё загружается. Если это длится дольше двух минут, открой Google Colab.',true);},25000);
  loadPy().then(function(p){p.setStdout({batched:function(s){buf.push(s);}});p.setStderr({batched:function(s){buf.push(s);}});return p.loadPackagesFromImports(code).then(function(){return p.runPythonAsync(code);});})
  .then(function(){out=buf.join('\n')||'Программа выполнилась, но ничего не напечатала. Добавь print().';},function(e){var m=String(e&&e.message||e);if(!py)out='Не получилось загрузить Python в этом окне. Открой Google Colab и вставь код туда.';else{var ls=m.trim().split('\n');out=(buf.length?buf.join('\n')+'\n\n':'')+'Ошибка: '+ls[ls.length-1];}})
  .then(function(){clearTimeout(timer);pyLoading=false;show(out);});}
function runPy(){var ta=$('#src');if(ta)sandSrc=ta.value;execPy(sandSrc,function(o){sandOut=o;if(view==='sandbox')render();});}
function runHere(){var run=R,pos=R.pos,c=R.q[pos].c;execPy(c.code,function(o){if(R===run&&R.pos===pos){R.out=o;render();}});}
function badges(){var s=Math.max(S.best,streak()),dn=doneCount();return [
  ['Первый шаг','Пройден первый урок',dn>=1],['Три дня подряд','Пульс держится 3 дня',s>=3],['Неделя без пропусков','7 дней подряд',s>=7],['Две недели','14 дней подряд',s>=14],['Месяц','30 дней подряд',s>=30],
  ['Чистая работа','Урок без единой ошибки',S.perfect>=1],['Пять чистых','5 уроков без ошибок',S.perfect>=5],['Первая смена','Контрольная недели 1',!!S.done.b1],['Практик','Сделана практика в Colab',Object.keys(S.missions).length>=1],
  ['Табличный ум','Пройдена неделя 3',!!S.done.b3],['Первый месяц','Все 28 дней',!!S.done.b4],['Проект 1','Разведочный анализ',!!S.done.b9],['Проект 2','Модель прогноза',!!S.done.b15],['Свой путь','Выбран трек',!!S.track],['Финал','Курс пройден целиком',!!S.done.w36_b],['Повторение — мать учения','10 повторений',S.reviews>=10]];}
function vProg(){var lv=level(),dn=doneCount(),h=header()+'<section><div class="eyebrow">Прогресс</div><h1>'+esc(S.name||'Твой прогресс')+': уровень '+(lv.i+1)+'</h1><p class="small muted" style="margin:6px 0 0">'+lv.name+'</p></section>';
  h+='<div class="stats"><div class="stat"><b class="num">'+dn+' / '+TOTAL+'</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">'+S.xp+'</b><span class="small muted">XP</span></div><div class="stat"><b class="num">'+Math.max(S.best,streak())+'</b><span class="small muted">рекорд дней подряд</span></div></div>';
  h+='<div class="bar acc"><i style="width:'+Math.round(dn/Math.max(TOTAL,1)*100)+'%"></i></div>';
  var cells='',t=new Date(),start=addDays(t,-(((t.getDay()+6)%7)+28));
  for(var i=0;i<35;i++){var d=addDays(start,i),k=ds(d);cells+='<i class="'+(S.days[k]!==undefined?'a':S.frozen[k]?'f':'')+(k===today()?' t':'')+'" title="'+k+'"></i>';}
  h+='<section class="card"><h3>Последние 5 недель</h3><p class="small muted" style="margin:4px 0 10px">Пн–Вс. Зелёный: занималась. Жёлтый: сработала заморозка.</p><div class="heat">'+cells+'</div></section>';
  h+='<section><h3 style="margin-bottom:8px">Награды</h3><div class="badges">'+badges().map(function(b){return '<div class="badge'+(b[2]?'':' off')+'"><b>'+(b[2]?'✓ ':'')+b[0]+'</b><span class="small muted">'+b[1]+'</span></div>';}).join('')+'</div></section>';
  h+='<section class="card"><h3>Как это работает</h3><p class="small" style="margin:6px 0 0;max-width:62ch">Один урок в день держит пульс. В день можно пройти не больше двух новых уроков, повторять можно сколько угодно. За каждые 7 дней подряд ты получаешь заморозку: она спасает серию, если один день пропущен. Ошибки в заданиях не страшны: задание вернётся в конце урока.</p></section>';
  h+='<section class="card"><h3>Настройки</h3><div class="row" style="margin-top:10px"><label for="nm" class="small">Имя</label><input class="txt" id="nm" value="'+esc(S.name)+'" maxlength="30"><button class="btn small" data-a="name">Сохранить</button></div><p class="small muted" style="margin:10px 0 0">'+({cloud:'Синхронизация включена: прогресс хранится на защищённом сервере и виден на всех твоих устройствах.',connecting:'Подключаю синхронизацию…',owner:'Ты наблюдатель: твой прогресс хранится только в этом браузере, прогресс учеников — во вкладке «Наблюдение».',error:'Нет связи с сервером. Прогресс сохраняется в этом браузере и отправится, когда связь появится.'}[syncState]||'Прогресс сохраняется автоматически в этом браузере на этом устройстве.')+'</p>'+(hasTracks()&&S.track?'<h3 style="margin-top:18px">Трек</h3><p class="small" style="margin:6px 0 10px">Сейчас: <b>'+esc(trackName(S.track))+'</b>. Пройденные уроки обоих треков сохраняются.</p><div class="row"><button class="btn small ghost" data-a="track" data-v="'+(S.track==='ds'?'dh':'ds')+'">Перейти на '+esc(trackName(S.track==='ds'?'dh':'ds'))+'</button></div>':'')+'<h3 style="margin-top:18px">Резервная копия</h3><p class="small" style="margin:6px 0 10px;max-width:62ch">Код прогресса хранит всё: пройденные дни, XP и серию. Скопируй его и сохрани, например отправь себе в мессенджер. Чтобы продолжить на другом устройстве или после очистки браузера, вставь код ниже и нажми «Восстановить».</p><div class="row"><button class="btn small" data-a="exp">Скопировать код прогресса</button></div><label class="eyebrow" for="code" style="display:block;margin-top:12px">Код</label><textarea id="code" class="txt" style="max-width:100%;min-height:70px;font-family:var(--f-mono);font-size:12px" spellcheck="false" autocomplete="off" placeholder="Вставь сюда сохранённый код"></textarea><div class="row" style="margin-top:8px"><button class="btn small ghost" data-a="imp">Восстановить из кода</button></div>'+(ME?'<p class="small muted" style="margin:6px 0 0">Вход: '+esc(EMAIL)+'</p><div style="margin-top:10px"><button class="btn small ghost" data-a="logout">Выйти из аккаунта</button></div>':'')+'<div style="margin-top:10px"><button class="btn small ghost" data-a="reset" id="rst">Сбросить весь прогресс</button></div></section>';
  return h;}


/* ---------- наблюдение (только владелец) ---------- */
var W={docs:null,at:0,err:'',ch:null,poll:null,busy:false};
function ago(t){if(!t)return 'нет данных';var m=Math.round((Date.now()-t)/60000);if(m<1)return 'только что';if(m<60)return m+' мин назад';var hh=Math.round(m/60);if(hh<24)return hh+' ч назад';var d=Math.round(hh/24);return d+' '+plural(d,'день','дня','дней')+' назад';}
function loadWatch(){if(!SB||!OWNER||W.busy)return;W.busy=true;
  SB.from('progress').select('user_id,state,updated_at').then(function(r){W.busy=false;
    if(r.error){W.err=r.error.message||'error';}else{W.err='';W.at=Date.now();
      W.docs=(r.data||[]).filter(function(x){return x.user_id!==ME&&x.state;}).map(function(x){var o=Object.assign(def(),x.state);o._id=x.user_id;return o;});}
    if(view==='watch')render();},function(){W.busy=false;W.err='нет связи';if(view==='watch')render();});}
function startWatch(){if(!SB||!OWNER)return;if(!W.docs&&!W.busy)loadWatch();
  if(!W.ch&&SB.channel){try{W.ch=SB.channel('progress-watch').on('postgres_changes',{event:'*',schema:'public',table:'progress'},function(){loadWatch();}).subscribe();}catch(e){W.ch=null;}}
  if(!W.poll)W.poll=setInterval(function(){if(view==='watch'&&!document.hidden)loadWatch();},60000);}
function learnerCard(st){var name=st.name||st.email||'Ученица',s=streak(st),lv=level(st),dn=doneCount(st),nl=nextLesson(st),ni=nextIdx(st),td=st.days[today()]!==undefined;
  var wk=0,t=new Date();for(var i=0;i<7;i++)if(st.days[ds(addDays(t,-i))]!==undefined)wk++;
  var weak={},bylesson={};Object.keys(st.missed||{}).forEach(function(k){var L=LBY[k.split(':')[0]];if(!L)return;weak[L.tag]=(weak[L.tag]||0)+st.missed[k];bylesson[L.id]=(bylesson[L.id]||0)+st.missed[k];});
  var topL=Object.keys(bylesson).sort(function(a,b){return bylesson[b]-bylesson[a];}).slice(0,3);
  var cells='',start=addDays(t,-(((t.getDay()+6)%7)+28));for(var j=0;j<35;j++){var d=addDays(start,j),k=ds(d);cells+='<i class="'+(st.days[k]!==undefined?'a':st.frozen&&st.frozen[k]?'f':'')+(k===today()?' t':'')+'" title="'+k+'"></i>';}
  var h='<section class="card hero"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">Ученица</div><h1>'+esc(name)+'</h1></div><span class="chip" style="'+(td?'border-color:var(--ok);color:var(--ok)':'border-color:var(--pulse);color:var(--pulse)')+'">'+(td?'Сегодня занималась':'Сегодня ещё нет')+'</span></div>'+
    '<p class="small muted" style="margin:0">Последняя активность: '+ago(st.t)+'</p>'+stripSvg(st)+
    '<div class="stats"><div class="stat"><b class="num" style="color:var(--pulse)">'+s+'</b><span class="small muted">'+plural(s,'день подряд','дня подряд','дней подряд')+'</span></div><div class="stat"><b class="num">'+dn+' / '+TOTAL+'</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">'+wk+' / 7</b><span class="small muted">за неделю</span></div></div>'+
    '<div><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+st.xp+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+(lv.to?Math.round((st.xp-lv.from)/(lv.to-lv.from)*100):100)+'%"></i></div></div>'+
    '<p class="small" style="margin:0">'+(nl?'Сейчас на дне '+(ni+1)+': '+esc(nl.title)+'.':needTrack(st)?'Общая часть пройдена, ждёт выбора трека.':'Курс пройден полностью.')+(st.track?' Трек: '+esc(trackName(st.track))+'.':'')+' Рекорд серии: '+Math.max(st.best||0,s)+'. Заморозок: '+(st.freezes||0)+'. Уроков без ошибок: '+(st.perfect||0)+'.</p></section>';
  h+='<section class="card"><h3>Недели</h3><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">'+weeksFor(st).map(function(w,wi){var d=w.days.filter(function(l){return st.done[l.id];}).length;return '<div><div class="row small" style="justify-content:space-between"><span>'+(wi+1)+'. '+esc(w.title)+'</span><span class="muted num">'+d+' / '+w.days.length+'</span></div><div class="bar acc" style="margin-top:4px"><i style="width:'+Math.round(d/w.days.length*100)+'%"></i></div></div>';}).join('')+'</div></section>';
  h+='<section class="card"><h3>Где были ошибки</h3>'+(topL.length?'<p class="small muted" style="margin:4px 0 8px">Задания, которые ещё не исправлены в повторении.</p><div class="row">'+Object.keys(weak).map(function(g){return '<span class="tag">'+TAGS[g]+': '+weak[g]+'</span>';}).join('')+'</div><ul class="small" style="margin:10px 0 0;padding-left:18px">'+topL.map(function(id){return '<li>'+esc(LBY[id].title)+' — '+bylesson[id]+'</li>';}).join('')+'</ul>':'<p class="small muted" style="margin:4px 0 0">Неисправленных ошибок нет.</p>')+'</section>';
  h+='<section class="card"><h3>Последние 5 недель</h3><div class="heat" style="margin-top:10px">'+cells+'</div></section>';
  return h;}
function vWatch(){if(!OWNER)return header()+'<div class="card">Эта вкладка доступна только владельцу курса.</div>';startWatch();
  var h=header()+'<section><div class="eyebrow">Наблюдение · обновляется вживую</div><h1>Прогресс учеников</h1><p class="small muted" style="margin:6px 0 0">'+(W.at?'Данные получены '+ago(W.at)+'.':'')+'</p></section>';
  if(W.err)return h+'<div class="card">Не удалось получить данные ('+esc(W.err)+'). Проверь интернет и обнови страницу.</div>';
  if(!W.docs)return h+'<div class="card">Загружаю…</div>';
  if(!W.docs.length)return h+'<div class="card">Пока никто не синхронизировал прогресс. Он появится здесь после первого урока, пройденного под её аккаунтом.</div>';
  return h+W.docs.sort(function(a,b){return (b.t||0)-(a.t||0);}).map(learnerCard).join('');}

/* ---------- урок ---------- */
function weekTasks(wi){var a=[];WK[wi].days.forEach(function(l){(l.tasks||[]).forEach(function(t){a.push(t);});});return a;}
function openLesson(i){var L=ALL[i],isNew=!S.done[L.id];
  if(isNew&&i!==nextIdx())return toast('Сначала пройди предыдущий день.');
  if(isNew&&newToday()>=2)return toast('Два новых урока в день — максимум. Этот откроется завтра.');
  var tasks=L.boss?shuffle(weekTasks(L.week)).slice(0,8):L.tasks;
  var q=L.cards.map(function(c){return {k:'card',c:c};}).concat(tasks.map(function(t){return {k:'task',t:t,first:true};}));
  if(L.mission)q.push({k:'mission',m:L.mission});
  R={L:L,q:q,pos:0,total:q.length,ok:0,fixed:0,isNew:isNew,review:false,mission:false};T=null;view='run';render();window.scrollTo(0,0);}
function openReview(){var pool=[];ALL.forEach(function(l){if(S.done[l.id])(l.tasks||[]).forEach(function(t){pool.push(t);});});
  if(!pool.length)return toast('Повторять пока нечего. Пройди первый урок.');
  var miss=shuffle(pool.filter(function(t){return S.missed[t._k];})),rest=shuffle(pool.filter(function(t){return !S.missed[t._k];})),tasks=miss.concat(rest).slice(0,6);
  R={L:{id:'review',title:'Повторение',tag:'stat'},q:shuffle(tasks).map(function(t){return {k:'task',t:t,first:true};}),pos:0,total:tasks.length,ok:0,fixed:0,isNew:false,review:true};T=null;view='run';render();window.scrollTo(0,0);}
function initTask(t){T={done:false,right:false,tutor:''};
  if(t.t==='mc'){T.opts=shuffle(t.o.map(function(_,i){return i;}));T.sel=-1;}
  if(t.t==='order'){T.pool=shuffle(t.lines.map(function(_,i){return i;}));if(T.pool.every(function(v,i){return v===i;}))T.pool.reverse();T.ans=[];}
  if(t.t==='match'){T.right_=shuffle(t.pairs.map(function(_,i){return i;}));T.l=-1;T.ok={};T.err=0;T.bad=null;}
  if(t.t==='fill'){T.val='';}}
function codeBlock(c,run){return '<pre class="code">'+esc(c)+'</pre>'+(run?'<div><button class="btn small ghost" data-a="runhere"'+(pyLoading?' disabled':'')+'>'+(pyLoading?'Выполняю…':'Запустить код')+'</button></div>'+(R&&R.out?'<pre class="out" aria-live="polite">'+esc(R.out)+'</pre>':''):'');}
function vRun(){var st=R.q[R.pos],pct=Math.round(R.pos/R.q.length*100);
  var h='<div class="runhead"><button class="x" data-a="quit" aria-label="Выйти из урока">✕ Выйти</button><div class="bar acc grow"><i style="width:'+pct+'%"></i></div></div><section class="lesson">';
  if(st.k==='card'){var c=st.c,isPy=c.code&&R.L.tag==='py';
    h+='<div class="eyebrow">'+esc(R.L.title)+'</div><h1>'+c.h+'</h1><p>'+c.t+'</p>'+(c.code?codeBlock(c.code,isPy):'')+'<div class="foot"><button class="btn" data-a="next">Дальше</button></div>';}
  else if(st.k==='mission'){var m=st.m;
    h+='<div class="eyebrow">Практика недели</div><h1>'+m.h+'</h1><p>Настоящий код вне уроков. Это 15–20 минут, можно сделать сегодня или в выходной.</p><ol class="steps">'+m.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol><div><a href="'+m.url+'" target="_blank" rel="noopener">Открыть Google Colab</a></div><div class="foot"><button class="btn" data-a="mission" data-v="1">Сделала, +30 XP</button><button class="btn ghost" data-a="mission" data-v="0">Сделаю позже</button></div>';}
  else{var t=st.t;if(!T)initTask(t);
    h+='<div class="eyebrow">'+(st.first?'Задание':'Ещё раз')+'</div><h2>'+t.q+'</h2>';
    if(t.t==='mc'){if(t.code)h+=codeBlock(t.code);
      h+='<div class="opts">'+T.opts.map(function(j){var cl=T.done?(j===t.a?' good':j===T.sel?' wrong':''):(j===T.sel?' sel':'');return '<button class="opt'+cl+'" data-a="sel" data-j="'+j+'"'+(T.done?' disabled':'')+'>'+t.o[j]+'</button>';}).join('')+'</div>';}
    if(t.t==='fill'){h+='<pre class="code">'+esc(t.code).replace('___','<input id="fillin" aria-label="Пропуск в коде" autocomplete="off" autocapitalize="off" spellcheck="false" value="'+esc(T.val)+'"'+(T.done?' disabled':'')+'>')+'</pre>';if(T.done&&!T.right)h+='<p class="small">Правильно: <code>'+esc(t.a[0])+'</code></p>';}
    if(t.t==='order'){h+='<div class="lines" aria-label="Твоя программа">'+(T.ans.length?T.ans.map(function(j){return '<button class="ln" data-a="unpick" data-j="'+j+'"'+(T.done?' disabled':'')+'>'+esc(t.lines[j])+'</button>';}).join(''):'<span class="small muted">Нажимай строки ниже в нужном порядке</span>')+'</div><div class="pool">'+T.pool.filter(function(j){return T.ans.indexOf(j)<0;}).map(function(j){return '<button class="ln" data-a="pick" data-j="'+j+'">'+esc(t.lines[j])+'</button>';}).join('')+'</div>';if(T.done&&!T.right)h+='<p class="small">Правильный порядок:</p>'+codeBlock(t.lines.join('\n'));}
    if(t.t==='match'){h+='<div class="match">';for(var i=0;i<t.pairs.length;i++){var r=T.right_[i];
        h+='<button class="'+(T.ok[i]?'good':T.l===i?'sel':'')+'" data-a="ml" data-j="'+i+'"'+(T.ok[i]?' disabled':'')+'>'+esc(t.pairs[i][0])+'</button><button class="'+(T.ok[r]?'good':T.bad===r?'wrong':'')+'" data-a="mr" data-j="'+r+'"'+(T.ok[r]?' disabled':'')+'>'+esc(t.pairs[r][1])+'</button>';}
      h+='</div><p class="small muted">Нажми слева, потом пару справа.</p>';}
    if(T.done){h+='<div class="fb '+(T.right?'ok':'bad')+'" role="status"><b>'+(T.right?'Верно':'Пока нет')+'</b><span>'+t.e+'</span>'+(T.right?'':'<span class="small">Задание вернётся в конце.</span>')+(T.tutor?'<div class="tutor">'+esc(T.tutor)+'</div>':'')+'</div>';
      h+='<div class="foot"><button class="btn" data-a="next">Дальше</button>'+(tutorOn&&!T.tutor?'<button class="btn ghost" data-a="tutor">Объясни подробнее</button>':'')+'</div>';}
    else if(t.t!=='match'){var ready=t.t==='mc'?T.sel>=0:t.t==='order'?T.ans.length===t.lines.length:true;h+='<div class="foot"><button class="btn" data-a="check"'+(ready?'':' disabled')+'>Проверить</button></div>';}
  }
  return h+'</section>';}
function norm(s){return String(s).trim().toLowerCase().replace(/['\u2018\u2019\u201a\u201c\u201d\u201e\u00ab\u00bb`]/g,'"').replace(/\s+/g,'');}
function settle(right){var st=R.q[R.pos],t=st.t;T.done=true;T.right=right;
  if(right){if(st.first)R.ok++;else R.fixed++;if(R.review&&S.missed[t._k])delete S.missed[t._k];}
  else{S.missed[t._k]=(S.missed[t._k]||0)+1;R.q.push({k:'task',t:t,first:false});}
  render();}
function check(){var t=R.q[R.pos].t,ok=false;
  if(t.t==='mc')ok=T.sel===t.a;
  if(t.t==='fill'){T.val=$('#fillin').value;var v=norm(T.val);if(!v)return toast('Впиши ответ в пропуск.');ok=t.a.some(function(a){return norm(a)===v;});}
  if(t.t==='order')ok=T.ans.every(function(j,i){return t.lines[j]===t.lines[i];});
  settle(ok);}
function next(){T=null;R.out='';R.pos++;if(R.pos>=R.q.length)finish();else{render();window.scrollTo(0,0);}}
function finish(){var L=R.L,td=today(),first=S.days[td]===undefined,gain,tasks=R.ok+R.fixed,perfect=R.fixed===0&&tasks>0;
  if(R.review){gain=tasks*3;S.reviews++;}else if(!R.isNew)gain=5;else gain=R.ok*10+R.fixed*5+(L.boss?50:20);
  if(R.mission){gain+=30;S.missions[L.id]=1;}
  S.xp+=gain;S.days[td]=(S.days[td]||0)+gain;
  if(R.isNew&&!R.review){S.done[L.id]={d:td,p:perfect?1:0};if(perfect)S.perfect++;if(S.newDay!==td){S.newDay=td;S.newN=0;}S.newN++;}
  var s=streak(),fz=false;if(s>S.best)S.best=s;if(first&&s>0&&s%7===0&&S.freezes<2){S.freezes++;fz=true;}
  save();RES={gain:gain,ok:R.ok,tasks:tasks,streak:s,first:first,fz:fz,title:L.title,review:R.review,isNew:R.isNew,perfect:perfect,terms:(R.isNew&&L.terms)?L.terms.length:0};R=null;view='result';render();window.scrollTo(0,0);}
function vResult(){var r=RES,lv=level(),ni=nextIdx(),more=ni>=0&&newToday()<2;
  var head=r.review?'Повторение сделано':r.isNew?'День закрыт':'Повторено';
  var line=r.first?'Сегодняшний удар пульса записан. Серия: '+r.streak+' '+plural(r.streak,'день','дня','дней')+'.':'Серия: '+r.streak+' '+plural(r.streak,'день','дня','дней')+'.';
  return '<section class="result"><svg class="ecg" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 H90 Q100 42 110 55 H128 L138 64 L152 8 L166 78 L176 55 H196 Q214 34 232 55 H400"/></svg><div><div class="eyebrow">'+esc(r.title)+'</div><h1>'+head+'</h1><p style="margin:8px 0 0">'+line+(r.fz?' За 7 дней подряд ты получила заморозку.':'')+'</p></div>'+
  '<div class="stats"><div class="stat"><b class="num">+'+r.gain+'</b><span class="small muted">XP</span></div><div class="stat"><b class="num">'+r.ok+' / '+r.tasks+'</b><span class="small muted">с первой попытки</span></div><div class="stat"><b class="num">'+r.streak+'</b><span class="small muted">'+plural(r.streak,'день подряд','дня подряд','дней подряд')+'</span></div></div>'+
  '<div class="card"><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+S.xp+(lv.to?' / '+lv.to:'')+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+(lv.to?Math.round((S.xp-lv.from)/(lv.to-lv.from)*100):100)+'%"></i></div>'+(r.terms?'<p class="small" style="margin:10px 0 0">В словаре открыто новых терминов: '+r.terms+'.</p>':'')+(r.perfect&&!r.review?'<p class="small" style="margin:6px 0 0">Ни одной ошибки.</p>':'')+'</div>'+
  '<div class="foot"><button class="btn" data-a="home">На главную</button>'+(more&&!r.review?'<button class="btn ghost" data-a="open" data-i="'+ni+'">Ещё один урок</button>':'')+'</div><p class="small muted" style="margin:0">Завтра ждёт '+(ni>=0?'день '+(ni+1)+': '+esc(ALL[ni].title):needTrack()?'выбор трека на главной':'повторение')+'.</p></section>';}

/* ---------- наставник ---------- */
var tutorOn=false, sampleFn=null;
function initTutor(){if(!window.claude||!window.claude.use)return;window.claude.use('sample').then(function(s){if(s){sampleFn=s;tutorOn=true;}}).catch(function(){});}
function askTutor(){var st=R&&R.q[R.pos];if(!st||!sampleFn||!T)return;var t=st.t,mine=T;mine.tutor='Думаю…';render();
  var body='Вопрос: '+t.q.replace(/<[^>]+>/g,'')+(t.code?'\nКод:\n'+t.code:'')+(t.o?'\nПравильный ответ: '+t.o[t.a].replace(/<[^>]+>/g,''):'')+(t.lines?'\nПравильный порядок:\n'+t.lines.join('\n'):'')+(t.a&&t.t==='fill'?'\nПравильный ответ: '+t.a[0]:'')+'\nКраткое пояснение из урока: '+t.e.replace(/<[^>]+>/g,'');
  sampleFn('Ты терпеливый наставник. Ученица — медицинский техник из немецкой клиники, начинает учить medical data science с нуля. Объясни по-русски, просто, в 3–5 предложениях, почему правильный ответ именно такой. Приведи один пример из больничной практики. Без приветствий, без разметки.\n\n'+body,{modelTier:'quick',onText:function(o){if(T===mine){mine.tutor=o.text;var el=$('.tutor');if(el)el.textContent=o.text;}}})
  .then(function(r){if(T===mine){mine.tutor=r.text||mine.tutor;render();}},function(e){if(e&&e.code==='not_granted')tutorOn=false;if(T===mine){mine.tutor='Наставник сейчас недоступен. Попробуй позже.';render();}});}

/* ---------- отрисовка и события ---------- */
function render(){rebuild();var a=$('#app'),tabs=$('#tabs'),inRun=view==='run'||view==='result'||view==='login'||view==='boot'||view==='nocourse';tabs.hidden=inRun;tabs.style.display=inRun?'none':'';
  a.innerHTML=view==='nocourse'?vNoCourse():view==='login'?vLogin():view==='boot'?vBoot():view==='run'?vRun():view==='result'?vResult():view==='glossary'?vGloss():view==='sandbox'?vSand():view==='progress'?vProg():view==='watch'?vWatch():vPath();
  var wt=$('#watchtab');if(wt)wt.hidden=!OWNER;
  if(!inRun)tabs.querySelectorAll('button').forEach(function(b){if(b.dataset.v===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  var f=$('#fillin');if(f&&!f.disabled)f.focus();}
var resetArmed=false, impArmed=false;
var A={
  tab:function(el){view=el.dataset.v;try{location.hash=view;}catch(e){}render();window.scrollTo(0,0);},
  open:function(el){if(el.getAttribute('aria-disabled'))return toast('Этот день откроется после предыдущего.');openLesson(+el.dataset.i);},
  review:openReview, next:next, check:check,
  home:function(){view='path';render();window.scrollTo(0,0);},
  quit:function(){R=null;T=null;view='path';render();toast('Урок не засчитан. Его можно начать заново.');},
  sel:function(el){if(T.done)return;T.sel=+el.dataset.j;render();},
  pick:function(el){if(T.done)return;T.ans.push(+el.dataset.j);render();},
  unpick:function(el){if(T.done)return;T.ans=T.ans.filter(function(j){return j!==+el.dataset.j;});render();},
  ml:function(el){T.l=+el.dataset.j;T.bad=null;render();},
  mr:function(el){if(T.l<0)return toast('Сначала выбери слева.');var j=+el.dataset.j,t=R.q[R.pos].t;
    if(j===T.l){T.ok[j]=1;T.l=-1;T.bad=null;if(Object.keys(T.ok).length===t.pairs.length){var clean=T.err===0;T.done=true;T.right=true;if(clean&&R.q[R.pos].first)R.ok++;else R.fixed++;if(!clean)S.missed[t._k]=(S.missed[t._k]||0)+1;else if(R.review)delete S.missed[t._k];}}
    else{T.err++;T.bad=j;}render();},
  mission:function(el){R.mission=el.dataset.v==='1';next();},
  logout:function(){if(!SB)return;try{localStorage.removeItem(CKEY);}catch(e){}setCourse({weeks:[],roadmap:[]});SB.auth.signOut().then(function(){},function(){});onSession(null);},
  retry:function(){view='boot';render();SB.auth.getSession().then(function(r){ME=null;onSession(r&&r.data&&r.data.session);});},
  track:function(el){var v=el.dataset.v;if(v!=='ds'&&v!=='dh')return;S.track=v;save();rebuild();view='path';render();window.scrollTo(0,0);toast('Трек: '+trackName(v)+'. Следующий урок уже ждёт.');},
  runhere:runHere, run:runPy, tutor:askTutor,
  exp:function(){var code=btoa(unescape(encodeURIComponent(JSON.stringify(S)))),ta=$('#code');ta.value=code;ta.select();
    try{navigator.clipboard.writeText(code).then(function(){toast('Код скопирован. Сохрани его в надёжном месте.');},function(){toast('Код в поле ниже. Выдели его и скопируй вручную.');});}catch(e){toast('Код в поле ниже. Выдели его и скопируй вручную.');}},
  imp:function(){var v=$('#code').value.replace(/\s+/g,''),o=null;if(!v)return toast('Сначала вставь код в поле.');
    try{o=JSON.parse(decodeURIComponent(escape(atob(v))));}catch(e){}
    if(!o||typeof o.xp!=='number'||typeof o.done!=='object'||typeof o.days!=='object')return toast('Код не читается. Проверь, что он вставлен целиком.');
    if(o.xp<S.xp&&!impArmed){impArmed=true;setTimeout(function(){impArmed=false;},6000);return toast('В коде меньше XP, чем сейчас ('+o.xp+' против '+S.xp+'). Нажми ещё раз, чтобы заменить.');}
    impArmed=false;S=Object.assign(def(),o);save();render();toast('Прогресс восстановлен: '+S.xp+' XP.');},
  name:function(){S.name=$('#nm').value.trim().slice(0,30);save();render();toast('Сохранено.');},
  reset:function(el){if(!resetArmed){resetArmed=true;el.textContent='Нажми ещё раз, чтобы стереть всё';setTimeout(function(){resetArmed=false;},5000);return;}resetArmed=false;var n=S.name;S=def();S.name=n;save();render();toast('Прогресс сброшен.');}
};
document.addEventListener('click',function(e){var el=e.target.closest('[data-a]');if(!el||el.disabled)return;var f=A[el.dataset.a];if(f)f(el);});
document.addEventListener('submit',function(e){if(e.target.id==='lf'){e.preventDefault();doLogin();}});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='fillin'){e.preventDefault();check();}});
document.addEventListener('input',function(e){if(e.target.id==='src')sandSrc=e.target.value;if(e.target.id==='fillin'&&T)T.val=e.target.value;});

applyFreezes();view=cfgOk()?'boot':(ALL.length?fromHash():'nocourse');render();initCloud();initTutor();
})();
