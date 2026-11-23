(function(){
'use strict';
var C={weeks:[],roadmap:[]}, WK=[], ALL=[], LBY={}, TOTAL=0, KEY='puls-daten-v1', CKEY='puls-course-v1', TKEY='puls-theme', courseErr='';
/* Несколько курсов. Курс 'main' хранится под прежними ключами, поэтому старый прогресс и кэш подхватываются как были. */
var CUR='main', CAT=[], OLDDB=false, CURKEY='puls-cur', CATKEY='puls-catalog';
function kS(id){return id==='main'?'puls-daten-v1':'puls-daten-v1:'+id;}
function kC(id){return id==='main'?'puls-course-v1':'puls-course-v1:'+id;}
function setKeys(){KEY=kS(CUR);CKEY=kC(CUR);}
try{CUR=localStorage.getItem(CURKEY)||'main';CAT=JSON.parse(localStorage.getItem(CATKEY)||'[]')||[];}catch(e){}
if(!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(CUR))CUR='main';setKeys();
/* Неделя с полем track входит в курс, только если ученица выбрала этот трек. До выбора курс заканчивается перед первой неделей трека. */
function weeksFor(st){st=st||{};var out=[],stop=false;(C.weeks||[]).forEach(function(w){if(stop)return;if(w.track){if(st.track===w.track)out.push(w);else if(!st.track)stop=true;}else out.push(w);});return out;}
function daysFor(st){var a=[];weeksFor(st).forEach(function(w){a=a.concat(w.days);});return a;}
function rebuild(){WK=weeksFor(S);ALL=[];WK.forEach(function(w,wi){w.days.forEach(function(d){d.week=wi;d.idx=ALL.length;ALL.push(d);});});}
function setCourse(c){if(!c||!c.weeks)return false;C=c;applyMeta(c);LBY={};TOTAL=0;var tr=null;
  C.weeks.forEach(function(w){if(w.track&&!tr)tr=w.track;if(!w.track||w.track===tr)TOTAL+=w.days.length;w.days.forEach(function(d){LBY[d.id]=d;(d.tasks||[]).forEach(function(t,i){t._k=d.id+':'+i;t._tag=d.tag;});});});
  rebuild();return true;}
function hasTracks(){return (C.weeks||[]).some(function(w){return !!w.track;});}
function trackList(){var o=[];(C.weeks||[]).forEach(function(w){if(w.track&&o.indexOf(w.track)<0)o.push(w.track);});return o;}
function trackName(t){var m=C.tracks||{},d=M.tracks||{};return (m[t]&&m[t].name)||(d[t]&&d[t].name)||t;}
/* Оформление курса. Курс без поля meta получает оформление первого курса («Пульс данных»),
   чтобы уже загруженные курсы выглядели как раньше. Курс с meta начинает с нейтральных значений и переопределяет любое из них. */
var LEGACY={brand:'Пульс данных',avatar:'🩺',sandbox:'python',
  levels:[[0,'Новичок в отделении'],[120,'Сборщик данных'],[300,'Младший аналитик'],[550,'Детектив данных'],[900,'Клинический аналитик'],[1400,'Знаток Python'],[2000,'Хранитель таблиц'],[3000,'Статистик у постели'],[4500,'Строитель моделей'],[6500,'Переводчик стандартов'],[9000,'Знаток регуляторики'],[12000,'Исследователь сигналов'],[15000,'Специалист своего трека'],[18000,'Готова к новой профессии']],
  tags:{py:'Python',dom:'Медицина и ИТ',stat:'Статистика',sql:'SQL',ml:'Машинное обучение',reg:'Регуляторика',sig:'Сигналы',car:'Карьера',boss:'Контрольная'},
  tagIcons:{py:'py',dom:'🏥',stat:'x̄ σ',sql:'SQL',ml:'ML',reg:'§',sig:'∿',car:'CV',boss:'★'},
  noteCats:[['py','Python'],['data','Данные'],['stat','Статистика и ML'],['med','Медицина и право'],['job','Карьера']],
  tracks:{ds:{name:'Medical Data Science'},dh:{name:'Digital Health'}},
  trackPrompt:'Выбери трек на следующие пять недель: Medical Data Science — модели и исследования, Digital Health — продукт, стандарты и качество. Сменить можно в профиле.',
  roadmapTitle:'Маршрут до смены профессии',
  notesSub:'Короткие справки: синтаксис, таблицы, формулы, стандарты. Открывай, когда пишешь код в Colab или читаешь вакансию.',
  notesHint:'Поиск: groupby, JOIN, p-value, FHIR…', termsHint:'Поиск: Datenschutz, cohort, выборка…', codeHint:'Поиск: список, цикл, JOIN…',
  missionLabel:'Открыть Google Colab',
  milestones:[['Первая смена','Контрольная недели 1','b1'],['Практик','Сделана практика в Colab','@mission'],['Табличный ум','Пройдена неделя 3','b3'],['Первый месяц','Все 28 дней','b4'],['Проект 1','Разведочный анализ','b9'],['Проект 2','Модель прогноза','b15'],['Свой путь','Выбран трек','@track'],['Финал','Курс пройден целиком','w36_b']],
  tutor:'Ты терпеливый наставник. Ученица — медицинский техник из немецкой клиники, начинает учить medical data science с нуля. Объясни по-русски, просто, в 3–5 предложениях, почему правильный ответ именно такой. Приведи один пример из больничной практики. Без приветствий, без разметки.',
  invite:'Пульс данных — ежедневный курс Medical Data Science', tour:'legacy',
  termsTitle:'Термины на трёх языках', termsSub:'Немецкий термин, английский и пояснение — так они стоят в вакансиях. Новые открываются после каждого урока.', missionDone:'Сделала, +30 XP'};
var NEUTRAL={brand:'Pulse',avatar:'📘',sandbox:null,
  levels:[[0,'Новичок'],[120,'Ученик'],[300,'Практик'],[550,'Уверенный'],[900,'Продвинутый'],[1400,'Знаток'],[2000,'Эксперт'],[3000,'Мастер'],[4500,'Наставник'],[6500,'Легенда']],
  tags:{boss:'Контрольная'}, tagIcons:{boss:'★'}, noteCats:[], tracks:{},
  trackPrompt:'Общая часть пройдена. Выбери, как продолжить курс. Сменить можно в профиле.',
  roadmapTitle:'Дальше по плану',
  notesSub:'Короткие справки по темам курса: синтаксис, таблицы, примеры.',
  notesHint:'Поиск по шпаргалкам…', termsHint:'Поиск по терминам…', codeHint:'Поиск по карточкам…',
  missionLabel:'Открыть задание',
  milestones:[['Практик','Сделано практическое задание','@mission'],['Свой путь','Выбран трек','@track'],['Финал','Курс пройден целиком','@final']],
  tutor:'Ты терпеливый наставник. Объясни по-русски, просто, в 3–5 предложениях, почему правильный ответ именно такой. Приведи один короткий практический пример. Без приветствий, без разметки.',
  invite:'', tour:'neutral',
  termsTitle:'Термины', termsSub:'Термин, его второе название и пояснение. Новые открываются после каждого урока.', missionDone:'Готово, +30 XP'};
var M=LEGACY, LEVELS=M.levels, TAGS=M.tags, TAG_ICO=M.tagIcons, NCATS=M.noteCats;
function applyMeta(c){var m=c&&c.meta&&typeof c.meta==='object'?c.meta:null,base=m?NEUTRAL:LEGACY;M=Object.assign({},base,m||{});
  M.tags=Object.assign({},base.tags,m&&m.tags||{});M.tagIcons=Object.assign({},base.tagIcons,m&&m.tagIcons||{});
  if(!Array.isArray(M.levels)||!M.levels.length)M.levels=base.levels;
  LEVELS=M.levels;TAGS=M.tags;TAG_ICO=M.tagIcons;NCATS=M.noteCats||[];
  try{document.title=M.brand;}catch(e){}}
function sandOn(){return M.sandbox==='python';}
if(window.COURSE)setCourse(window.COURSE);
var $=function(s){return document.querySelector(s);};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ds(d){var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x;}
function today(){return ds(new Date());}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function def(){return {name:'',xp:0,done:{},days:{},frozen:{},freezes:0,missed:{},missions:{},seen:{},prac:{},nt:{},cx:{},newDay:'',newN:0,best:0,perfect:0,reviews:0,t:0};}
/* Приводит любое сохранённое состояние к текущему формату. Ничего не удаляет: старый прогресс остаётся как был. */
function fix(o){var r=Object.assign(def(),o&&typeof o==='object'?JSON.parse(JSON.stringify(o)):{});
  ['done','days','frozen','missed','missions','seen','prac','nt','cx'].forEach(function(k){if(!r[k]||typeof r[k]!=='object'||Array.isArray(r[k]))r[k]={};});
  ['xp','freezes','best','perfect','reviews','newN','t'].forEach(function(k){r[k]=+r[k]||0;});return r;}

/* ---------- темы и аватары ---------- */
var THEMES=[['auto','Как в системе'],['ekg','ЭКГ-бумага',['#f2f5f4','#0a7a74','#d43f55','#b9820a']],['op','Операционная',['#eef6f1','#0f7a55','#d6455d','#a87600']],['lab','Лаборатория',['#f3f3fa','#4b48c8','#d9406a','#9a7400']],
  ['night','Ночная смена',['#0c181d','#3ccdbd','#ff6f82','#e9b949']],['monitor','Монитор',['#070d0a','#3ee07f','#ff5f6d','#ffd34d']],['plum','Сумерки',['#120f1a','#b69cff','#ff6f91','#ffcf66']]];
var AVATARS=['🩺','🫀','🧠','🧬','🔬','🧪','💊','📊','📈','🐍','💡','📚','☕','🎧','🌿','🌸','🌻','🦋','🦉','🦊','🐱','🐼','⭐','🚀'];
function applyTheme(th){var r=document.documentElement;if(!th||th==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',th);try{localStorage.setItem(TKEY,th||'auto');}catch(e){}
  try{var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',getComputedStyle(r).getPropertyValue('--paper').trim()||'#0c181d');}catch(e){}}

/* ---------- состояние ---------- */
var S=def(), SB=null, ME=null, EMAIL='', OWNER=false, syncState='local', pushT=null, pushing=false, again=false, loginErr='', loginBusy=false, loginEm='';
try{var raw=localStorage.getItem(KEY);if(raw)S=fix(JSON.parse(raw));}catch(e){}
(function(){var th=S.theme;try{th=th||localStorage.getItem(TKEY);}catch(e){}applyTheme(th||'auto');})();
function cfgOk(){var c=window.PULS_CONFIG||{};return !!(c.url&&c.anonKey&&c.url.indexOf('ВСТАВЬ')<0&&window.supabase&&window.supabase.createClient);}
function save(){S.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}schedulePush();}
function adopt(c){S=fix(c);if(S.theme)applyTheme(S.theme);try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function schedulePush(){if(!SB||!ME||OWNER)return;clearTimeout(pushT);pushT=setTimeout(push,600);}
/* Сессию отозвали или она истекла: выходим только на этом устройстве и просим войти заново. Локальный прогресс остаётся. */
function authErr(r){var e=r&&r.error;return !!r&&(r.status===401||(!!e&&/jwt|PGRST30[0-3]/i.test(String(e.message||'')+' '+String(e.code||''))));}
var lostShown=false;
function sessionLost(){if(!SB)return;loginEm=EMAIL||S.email||loginEm;presStop();SB.auth.signOut({scope:'local'}).then(function(){},function(){});onSession(null);if(!lostShown){lostShown=true;setTimeout(function(){lostShown=false;},5000);toast('Сессия устарела. Войди ещё раз — прогресс на месте.');}}
function push(){if(!SB||!ME||OWNER)return;if(pushing){again=true;return;}pushing=true;again=false;
  var row={user_id:ME,state:JSON.parse(JSON.stringify(S)),updated_at:new Date().toISOString()};if(!OLDDB)row.course_id=CUR;
  SB.from('progress').upsert(row,OLDDB?undefined:{onConflict:'user_id,course_id'})
  .then(function(r){if(authErr(r)){pushing=false;sessionLost();return;}syncState=r.error?'error':'cloud';},function(){syncState='error';})
  .then(function(){pushing=false;if(again)push();if(view==='progress')render();});}
/* своя строка прогресса в текущем курсе */
function myRow(){var q=SB.from('progress').select('state').eq('user_id',ME);if(!OLDDB)q=q.eq('course_id',CUR);return q.maybeSingle();}
function pull(){if(!SB||!ME||OWNER)return;var cid=CUR;
  myRow().then(function(r){if(cid!==CUR)return;
    if(authErr(r)){sessionLost();return;}
    if(r.error){syncState='error';if(view==='progress')render();return;}
    var c=r.data&&r.data.state;
    if(c&&(c.t||0)>(S.t||0)){adopt(c);syncState='cloud';if(view!=='run'&&view!=='result')render();}
    else if(S.t&&(!c||(c.t||0)<S.t))push();
    else{syncState='cloud';if(view==='progress')render();}
  },function(){syncState='error';});}

/* присутствие: кто сейчас держит приложение открытым (Supabase Realtime, без таблицы) */
var PCH=null, ONLINE={}, BEAT=null;
function presStart(){if(!SB||!ME||PCH||!SB.channel)return;try{
  PCH=SB.channel('puls-online',{config:{presence:{key:ME}}});
  PCH.on('presence',{event:'sync'},function(){var st=PCH.presenceState()||{},o={};Object.keys(st).forEach(function(k){o[k]=1;});ONLINE=o;presPaint();});
  PCH.subscribe(function(status){if(status==='SUBSCRIBED'&&!document.hidden)PCH.track({at:Date.now()});});}catch(e){PCH=null;}}
function presStop(){if(PCH){try{SB.removeChannel(PCH);}catch(e){}PCH=null;ONLINE={};}clearInterval(BEAT);BEAT=null;}
/* раз в 5 минут, пока приложение открыто: отметка «была в сети» для наблюдателя */
function beat(){if(!SB||!ME||OWNER||document.hidden)return;
  var cid=CUR;myRow().then(function(r){if(cid!==CUR)return;if(authErr(r)){sessionLost();return;}if(r.error)return;var c=r.data&&r.data.state;
    if(c&&(c.t||0)>(S.t||0)){adopt(c);if(view!=='run'&&view!=='result')render();}S.lastOn=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}push();},function(){});}
function beatStart(){clearInterval(BEAT);setTimeout(beat,1500);BEAT=setInterval(beat,5*60000);}
function presPaint(){document.querySelectorAll('[data-uid]').forEach(function(el){var on=!!ONLINE[el.dataset.uid];el.classList.toggle('on',on);el.title=on?'в сети':'';});
  document.querySelectorAll('[data-seen]').forEach(function(el){var on=!!ONLINE[el.dataset.seen];el.textContent=on?'в сети сейчас':'была '+ago(+el.dataset.ts);el.classList.toggle('onl',on);});}
document.addEventListener('visibilitychange',function(){if(!PCH)return;try{if(document.hidden)PCH.untrack();else PCH.track({at:Date.now()});}catch(e){}});

function onSession(sess){var id=sess&&sess.user?sess.user.id:null;
  if(!id){presStop();ME=null;EMAIL='';OWNER=false;syncState='local';R=null;T=null;view='login';render();return;}
  if(id===ME&&view!=='boot'&&view!=='login')return;
  ME=id;EMAIL=sess.user.email||'';setTimeout(presStart,0);
  if(S.uid&&S.uid!==ME){S=def();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
  S.uid=ME;S.email=EMAIL;if(!S.name&&sess.user.user_metadata&&sess.user.user_metadata.name)S.name=String(sess.user.user_metadata.name).slice(0,30);
  SB.from('observers').select('user_id').eq('user_id',ME).maybeSingle().then(function(r){OWNER=!!(r&&r.data);},function(){OWNER=false;})
  .then(loadCatalog).then(pickCourse).then(loadCourse)
  .then(function(ok){if(!ok){view='nocourse';render();return;}
    if(OWNER)syncState='owner';else{syncState='connecting';pull();beatStart();setTimeout(pushSync,3000);}
    if(view==='login'){view='path';try{history.replaceState(null,'','#path');}catch(e){}}else if(view==='boot'||view==='nocourse')view=fromHash();render();});}
function loadCourse(){
  var cid=CUR;
  return SB.from('course_content').select('data').eq('id',cid).maybeSingle().then(function(r){
    if(cid!==CUR)return true;
    if(!r.error&&r.data&&setCourse(r.data.data)){courseErr='';try{localStorage.setItem(CKEY,JSON.stringify(r.data.data));}catch(e){}return true;}
    courseErr=r.error?'Сервер не отдал уроки: '+(r.error.message||'ошибка доступа')+'.':'В базе нет уроков. Выполни content.sql в Supabase.';
    return fromCache();
  },function(){courseErr='Нет связи с сервером.';return fromCache();});}
/* ---------- курсы ---------- */
function courseTitle(id){var c=CAT.filter(function(x){return x.id===id;})[0];return (c&&c.title)||(id===CUR?M.brand:id);}
function loadCatalog(){if(!SB)return Promise.resolve();
  return SB.from('course_content').select('id,title,open').order('id').then(function(r){
    if(r.error){if(/title|open|42703|column/i.test(String(r.error.message)+' '+String(r.error.code))){OLDDB=true;CAT=[{id:'main',title:'',open:true}];}return;}
    OLDDB=false;CAT=(r.data||[]).map(function(x){return {id:x.id,title:x.title||'',open:!!x.open};});
    try{localStorage.setItem(CATKEY,JSON.stringify(CAT));}catch(e){}},function(){});}
/* курс, который открыть: последний выбранный на этом устройстве, иначе main, иначе первый доступный */
function pickCourse(){var ids=CAT.map(function(x){return x.id;});if(!ids.length||ids.indexOf(CUR)>=0)return;useCourse(ids.indexOf('main')>=0?'main':ids[0]);}
/* профиль (имя, аватар, тема, напоминания, пройденное обучение) общий для всех курсов */
function carry(o){var n=def();['name','avatar','theme','remind','remindAsk','tour','tourDone','uid','email'].forEach(function(k){if(o&&o[k]!==undefined)n[k]=o[k];});return n;}
function useCourse(id){if(id===CUR)return;var prev=S;CUR=id;setKeys();try{localStorage.setItem(CURKEY,CUR);}catch(e){}
  var st=null;try{var raw=localStorage.getItem(KEY);if(raw)st=fix(JSON.parse(raw));}catch(e){}
  if(!st||(ME&&st.uid&&st.uid!==ME))st=carry(prev);
  S=st;R=null;T=null;NOTE=null;NCAT='all';NQ='';GQ='';
  var c=null;try{c=JSON.parse(localStorage.getItem(CKEY)||'null');}catch(e){}
  if(!c||!setCourse(c)){C={weeks:[],roadmap:[]};setCourse(C);}}
function switchCourse(id){if(id===CUR||!CAT.some(function(x){return x.id===id;}))return;
  var keep=view==='watch'?'watch':'path';clearTimeout(pushT);if(SB&&ME&&!OWNER&&S.t)push();
  useCourse(id);view='boot';render();
  (SB&&ME?loadCourse():Promise.resolve(fromCache())).then(function(ok){if(!ok){view='nocourse';render();return;}
    if(SB&&ME&&!OWNER){syncState='connecting';pull();}
    view=keep;try{history.replaceState(null,'','#'+keep);}catch(e){}render();window.scrollTo(0,0);toast('Курс: '+courseTitle(id)+'.');});}
function courseLine(){return CAT.length>1?'<div class="row small crsline" style="gap:6px"><span class="muted">Курс:</span><b>'+esc(courseTitle(CUR))+'</b><button class="linkbtn" data-a="courses">сменить</button></div>':'';}
function courseBlock(){if(CAT.length<2)return '';return '<div id="courses"><div class="small" style="margin-bottom:6px"><b>Курсы</b></div><p class="small muted" style="margin:0 0 8px">У каждого курса свой прогресс, серия и XP. Имя, аватар, тема и напоминания общие.</p><div class="row" style="gap:8px">'+
  CAT.map(function(c){var on=c.id===CUR;return '<button class="btn small'+(on?'':' ghost')+'" data-a="course" data-v="'+esc(c.id)+'"'+(on?' aria-pressed="true"':'')+'>'+(on?'✓ ':'')+esc(c.title||c.id)+'</button>';}).join('')+'</div></div>';}
function fromCache(){try{var c=JSON.parse(localStorage.getItem(CKEY)||'null');if(c&&setCourse(c)){toast('Нет связи: уроки открыты из сохранённой копии.');return true;}}catch(e){}return false;}
function brandH(){return '<div class="brand"><svg viewBox="0 0 28 16"><path d="M0 9h7l2-3 3 9 3-14 3 8h10"/></svg>'+esc(M.brand)+'</div>';}
function vNoCourse(){var noCfg=!cfgOk();
  return '<div class="top">'+brandH()+'</div><section class="card hero"><h1>'+(noCfg?'Курс не настроен':'Уроки не загрузились')+'</h1><p class="small" style="margin:0">'+
  (noCfg?'Заполни адрес базы и ключ в config.js. Подробности в README.':esc(courseErr))+'</p>'+(noCfg?'':'<div class="foot"><button class="btn" data-a="retry">Попробовать снова</button>'+(ME?'<button class="btn ghost" data-a="logout">Выйти</button>':'')+'</div>')+'</section>';}
function initCloud(){if(!cfgOk())return;var c=window.PULS_CONFIG;
  SB=window.supabase.createClient(c.url,c.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  view='boot';render();
  SB.auth.getSession().then(function(r){onSession(r&&r.data&&r.data.session);},function(){onSession(null);});
  SB.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'&&ME)onSession(null);});
  document.addEventListener('visibilitychange',function(){if(document.hidden)return;pull();if(ME&&!OWNER)beat();if(OWNER&&view==='watch')loadWatch();});
  window.addEventListener('online',function(){pull();});}
function doLogin(){var em=$('#em').value.trim(),pw=$('#pw').value;loginEm=em;if(!em||!pw){loginErr='Введи email и пароль.';render();return;}
  loginBusy=true;loginErr='';render();
  SB.auth.signInWithPassword({email:em,password:pw}).then(function(r){loginBusy=false;
    if(r.error){loginErr=/invalid/i.test(r.error.message)?'Неверный email или пароль.':'Не получилось войти: '+r.error.message;render();return;}
    onSession(r.data.session);},function(){loginBusy=false;loginErr='Нет связи с сервером. Проверь интернет.';render();});}
function vLogin(){return '<div class="top">'+brandH()+'</div>'+
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
function lvPct(st){var lv=level(st);st=st||S;return lv.to?Math.round((st.xp-lv.from)/(lv.to-lv.from)*100):100;}
function listFor(st){return (!st||st===S)?ALL:daysFor(st);}
function nextIdx(st){var list=listFor(st);st=st||S;for(var i=0;i<list.length;i++)if(!st.done[list[i].id])return i;return -1;}
function nextLesson(st){var i=nextIdx(st);return i<0?null:listFor(st)[i];}
function needTrack(st){st=st||S;return hasTracks()&&!st.track&&listFor(st).length>0&&nextIdx(st)<0;}
function newToday(){return S.newDay===today()?S.newN:0;}
function doneCount(st){st=st||S;var n=0;Object.keys(st.done||{}).forEach(function(id){if(LBY[id])n++;});return n;}
function plural(n,a,b,c){var m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c;}

/* ---------- маршрут ---------- */
var VIEWS=['path','practice','notes','glossary','sandbox','progress','watch'], view='path', R=null, T=null, RES=null, toastT=null, BACK='path';
function fromHash(){var h=(location.hash||'').slice(1);return VIEWS.indexOf(h)>=0?h:'path';}
window.addEventListener('hashchange',function(){if(view==='run'||view==='result'||view==='note')return;view=fromHash();render();});
function toast(m){var o=$('.toast');if(o)o.remove();var t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);clearTimeout(toastT);toastT=setTimeout(function(){t.remove();},3600);}

/* ---------- лента ЭКГ ---------- */
function stripSvg(st){st=st||S;var n=14,w=560/n,y=46,p='M0 '+y,lab='',t=new Date();
  for(var i=0;i<n;i++){var d=addDays(t,i-(n-1)),k=ds(d),x=i*w;
    if(st.days[k]!==undefined){var h=Math.min(36,16+(st.days[k]||0)/5);p+=' L'+(x+w*.2)+' '+y+' Q'+(x+w*.28)+' '+(y-6)+' '+(x+w*.36)+' '+y+' L'+(x+w*.44)+' '+(y+5)+' L'+(x+w*.52)+' '+(y-h)+' L'+(x+w*.6)+' '+(y+9)+' L'+(x+w*.66)+' '+y+' Q'+(x+w*.78)+' '+(y-9)+' '+(x+w*.9)+' '+y+' L'+(x+w)+' '+y;}
    else if(st.frozen&&st.frozen[k]){p+=' L'+(x+w*.4)+' '+y+' Q'+(x+w*.5)+' '+(y-5)+' '+(x+w*.6)+' '+y+' L'+(x+w)+' '+y;}
    else p+=' L'+(x+w)+' '+y;
    lab+='<text x="'+(x+w/2)+'" y="70" text-anchor="middle">'+d.getDate()+'</text>';}
  return '<svg class="strip" viewBox="0 0 560 76" preserveAspectRatio="none" role="img" aria-label="Активность за 14 дней"><line class="today" x1="'+(560-w)+'" y1="4" x2="'+(560-w)+'" y2="60"/><path d="'+p+'"/>'+lab+'</svg>';}
function heat(st){st=st||S;var cells='',t=new Date(),start=addDays(t,-(((t.getDay()+6)%7)+28));
  for(var i=0;i<35;i++){var d=addDays(start,i),k=ds(d);cells+='<i class="'+(st.days[k]!==undefined?'a':st.frozen&&st.frozen[k]?'f':'')+(k===today()?' t':'')+'" title="'+k+'"></i>';}
  return '<div class="heat">'+cells+'</div>';}

/* ---------- шапка ---------- */
function header(){var nm=(S.name||'').trim().split(/\s+/)[0]||'Профиль',on=view==='progress';
  return '<div class="top hdr"><div class="hl">'+brandH()+''+(OWNER?'<div class="small muted">Режим наблюдателя</div>':'<div class="chips"><span class="chip num" title="Дней подряд"><b>♥</b> '+streak()+'</span><span class="chip xp num" title="Очки опыта"><b>XP</b> '+S.xp+'</span></div>')+'</div>'+
  '<button class="mebtn'+(on?' on':'')+'" data-a="tab" data-v="progress" aria-label="Профиль и прогресс"'+(on?' aria-current="page"':'')+'><span class="meav" aria-hidden="true">'+esc(S.avatar||M.avatar)+'</span><span class="mename">'+esc(nm)+'</span></button></div>';}

/* ---------- сегодня ---------- */
function dayRow(L){var done=!!S.done[L.id],nx=nextIdx()===L.idx,cls=done?'done':nx?'next':'lock';
  var st=done?(S.done[L.id].p?'Без ошибок':'Пройдено')+' · можно повторить':nx?(L.boss?'Контрольная и практика · 20 мин':'Урок · 15 мин'):'Откроется после предыдущего дня';
  return '<button class="day '+cls+'" data-a="open" data-i="'+L.idx+'"'+(cls==='lock'?' aria-disabled="true"':'')+'><span class="n">'+(done?'✓':L.idx+1)+'</span><span class="grow"><span class="tt">'+esc(L.title)+'</span><br><span class="st">'+st+'</span></span><span class="tag">'+(TAGS[L.tag]||'')+'</span></button>';}
function vPath(){var s=streak(),ni=nextIdx(),did=S.days[today()]!==undefined,cap=newToday()>=2,h=header(),dc=doneCount(),lv=level(),body;
  if(S.tour&&!S.tourDone&&TOUR<0)h+='<button class="tourcard" data-a="tour"><span class="tci" aria-hidden="true">🎓</span><span class="grow"><b>Что нового — за 30 секунд</b><br><span class="small">Практика, шпаргалки, словарь, напоминания</span></span><span class="tcb" aria-hidden="true">▶</span></button>';
  h+=remCard()+courseLine();
  var rev=dc?'<button class="linkbtn" data-a="review">Повторение пройденного</button>':'';
  if(needTrack()){body='<div class="eyebrow">Развилка</div><h2 class="daytitle">Общая часть пройдена</h2><p class="small" style="margin:0">'+esc(M.trackPrompt)+'</p><div class="foot">'+trackList().map(function(t,i){return '<button class="btn'+(i?' ghost':'')+'" data-a="track" data-v="'+esc(t)+'">'+esc(trackName(t))+'</button>';}).join('')+'</div>';}
  else if(ni<0){body='<div class="eyebrow">🏁 Финиш</div><h2 class="daytitle">Весь курс пройден</h2><p class="small" style="margin:0">Повторение и практика держат знания свежими, а профиль хранит весь путь.</p><div class="foot"><button class="btn" data-a="review">Повторение</button><button class="btn ghost" data-a="tab" data-v="practice">Практика</button></div>';}
  else if(!did){var L=ALL[ni];
    body='<div class="eyebrow">Сегодня · день '+(ni+1)+'</div><h2 class="daytitle">'+esc(L.title)+'</h2><p class="small muted" style="margin:0">'+(TAGS[L.tag]||'')+' · '+(L.boss?'контрольная и практика, ≈ 20 минут':'≈ 15 минут')+'</p>'+
      '<p class="small" style="margin:0">'+(s>0?'Пульс '+s+' '+plural(s,'день','дня','дней')+' подряд — не прерывай серию.':'Один урок в день, и пульс пошёл.')+'</p>'+
      '<div class="foot"><button class="btn big-cta" data-a="open" data-i="'+ni+'">Начать день '+(ni+1)+' →</button></div>'+rev;}
  else{body='<div class="eyebrow">✅</div><h2 class="daytitle">День '+Math.max(1,ni)+' сделан!</h2><p class="small" style="margin:0">'+(cap?'Два новых урока за день — максимум. День '+(ni+1)+' откроется завтра.':'Сегодняшний пульс записан. Можно остановиться, пройти ещё урок или потренироваться.')+'</p>'+
      '<div class="foot">'+(cap?'':'<button class="btn ghost" data-a="open" data-i="'+ni+'">Ещё урок: день '+(ni+1)+'</button>')+'<button class="btn ghost" data-a="tab" data-v="practice">Практика</button></div>'+rev;}
  h+='<section class="card hero todayc'+(did&&ni>=0&&!needTrack()?' done':'')+'"><div class="todaygo">'+body+'</div><div class="lvline"><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+S.xp+(lv.to?' / '+lv.to:'')+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+lvPct()+'%"></i></div></div></section>';
  WK.forEach(function(w,wi){var d=w.days.filter(function(l){return S.done[l.id];}).length;
    h+='<section class="week"><div><div class="eyebrow">Неделя '+(wi+1)+(w.track?' · трек '+esc(trackName(w.track)):'')+' · <span class="num">'+d+' из '+w.days.length+'</span></div><h2>'+esc(w.title)+'</h2><p class="small muted" style="margin:4px 0 0">'+esc(w.sub)+'</p></div><div class="days">'+w.days.map(dayRow).join('')+'</div></section>';});
  if(C.roadmap&&C.roadmap.length)h+='<section class="card"><div class="eyebrow">Дальше по плану</div><h2 style="margin:4px 0 12px">'+esc(M.roadmapTitle)+'</h2><div class="road">'+C.roadmap.map(function(r){return '<div><span class="small muted">'+r.w+'</span><br><b>'+r.t+'</b><br><span class="small">'+r.d+'</span></div>';}).join('')+'</div></section>';
  return h;}

/* ---------- практика ---------- */
function doneTasks(tag){var a=[];ALL.forEach(function(l){if(S.done[l.id]&&(!tag||l.tag===tag))(l.tasks||[]).forEach(function(t){a.push(t);});});return a;}
function tagStats(tag){var a=doneTasks(tag),seen=0,miss=0;a.forEach(function(x){if(S.seen[x._k])seen++;if(S.missed[x._k])miss++;});return {n:a.length,seen:seen,miss:miss};}
function practiceTags(){var o=[];ALL.forEach(function(l){if(l.tag!=='boss'&&o.indexOf(l.tag)<0&&(l.tasks||[]).length)o.push(l.tag);});return o;}
function vPractice(){var h=header()+'<section><div class="eyebrow">Практика</div><h1>Свободная тренировка</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Задания из пройденных уроков по выбранной теме. Сначала те, где были ошибки, потом давно не виденные. Новые уроки здесь не открываются, зато XP идут.</p></section>';
  var allMiss=doneTasks().filter(function(x){return S.missed[x._k];}).length;
  h+='<div class="secs">';
  if(allMiss)h+='<button class="sec hot" data-a="prac" data-v="miss"><span class="ico" aria-hidden="true">✗→✓</span><span class="grow"><span class="tt">Работа над ошибками</span><br><span class="st">Все задания, где ошибка ещё не исправлена</span></span><span class="num small" style="color:var(--bad)">'+allMiss+'</span></button>';
  practiceTags().forEach(function(tag){var st=tagStats(tag),lock=!st.n;
    h+='<button class="sec'+(lock?' off':'')+'" data-a="prac" data-v="'+tag+'"'+(lock?' aria-disabled="true"':'')+'><span class="ico" aria-hidden="true">'+esc(TAG_ICO[tag]||tag)+'</span><span class="grow"><span class="tt">'+esc(TAGS[tag]||tag)+'</span><br><span class="st">'+(lock?'Откроется после первого урока по теме':st.n+' '+plural(st.n,'задание','задания','заданий')+' из пройденных уроков')+'</span></span><span class="num small muted" style="text-align:right">'+(lock?'🔒':st.seen+'/'+st.n+(st.miss?'<br><span style="color:var(--bad)">ошибок: '+st.miss+'</span>':''))+'</span></button>';});
  h+='</div>';
  if(doneCount())h+='<section class="card"><h3>Повторение</h3><p class="small" style="margin:6px 0 10px">Смесь из всех пройденных тем, 6 заданий. Хорошо в конце дня.</p><button class="btn small" data-a="review">Начать повторение</button></section>';
  return h;}
function pickFrom(pool,n){var miss=shuffle(pool.filter(function(x){return S.missed[x._k];})),fresh=shuffle(pool.filter(function(x){return !S.missed[x._k]&&!S.seen[x._k];})),old=pool.filter(function(x){return !S.missed[x._k]&&S.seen[x._k];}).sort(function(a,b){return String(S.seen[a._k]).localeCompare(String(S.seen[b._k]));});
  var all=miss.slice(0,Math.ceil(n/2)).concat(fresh,old,miss.slice(Math.ceil(n/2))),out=[];
  all.forEach(function(x){if(out.length<n&&out.indexOf(x)<0)out.push(x);});return out;}
function openPractice(tag){var pool=tag==='miss'?doneTasks().filter(function(x){return S.missed[x._k];}):doneTasks(tag);
  if(!pool.length)return toast('Здесь пока пусто: пройди урок по этой теме.');
  var tasks=shuffle(pickFrom(pool,8));
  startRun({id:'prac-'+tag,title:tag==='miss'?'Работа над ошибками':'Практика: '+(TAGS[tag]||tag),tag:tag==='miss'?'stat':tag},'practice',tasks.map(function(t){return {k:'task',t:t,first:true};}),false,tag);}

/* ---------- шпаргалки ---------- */
var NCAT='all', NQ='', NOTE=null;
function notes(){return (C.notes||[]).filter(function(n){return n&&n.id;});}
function md(x){return esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');}
function nHay(n){var b=(n.b||[]).map(function(x){return (x.h||'')+' '+(x.head||[]).join(' ')+' '+(x.r||[]).map(function(r){return r.join(' ');}).join(' ')+' '+(x.l||[]).join(' ')+' '+(x.code||'');}).join(' ');
  return (n.h+' '+n.tip+' '+b).replace(/\*\*/g,'').toLowerCase();}
function nHide(n){return (NCAT!=='all'&&n.cat!==NCAT)||(NQ&&nHay(n).indexOf(NQ.toLowerCase())<0);}
function vNotes(){var ns=notes(),h=header()+'<section><div class="eyebrow">Шпаргалки</div><h1>Всё под рукой</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">'+esc(M.notesSub)+'</p></section>';
  if(!ns.length)return h+'<section class="card"><p class="small" style="margin:0">Шпаргалки ещё не загружены в курс. Владелец курса может обновить его во вкладке «Наблюдение».</p></section>';
  h+='<input class="txt nsearch" id="nq" type="search" autocomplete="off" placeholder="'+esc(M.notesHint)+'" value="'+esc(NQ)+'">';
  if(NCATS.length)h+='<div class="ncats" role="tablist">'+[['all','Все']].concat(NCATS).map(function(c){return '<button class="chip'+(NCAT===c[0]?' on':'')+'" role="tab" aria-selected="'+(NCAT===c[0])+'" data-a="ncat" data-v="'+c[0]+'">'+esc(c[1])+'</button>';}).join('')+'</div>';h+='<div class="secs nlist">';
  ns.forEach(function(n){h+='<button class="sec nrow" data-a="note" data-v="'+esc(n.id)+'" data-cat="'+esc(n.cat)+'" data-q="'+esc(nHay(n))+'"'+(nHide(n)?' hidden':'')+'><span class="ico nico" aria-hidden="true">'+esc(n.ico||'📒')+'</span><span class="grow"><span class="tt">'+esc(n.h)+'</span><span class="st">'+esc(n.tip)+'</span></span><span aria-hidden="true" class="muted chev">›</span></button>';});
  h+='</div><p class="small muted nempty"'+(ns.some(function(n){return !nHide(n);})?' hidden':'')+'>Ничего не нашлось. Попробуй другое слово.</p>';return h;}
/* ячейка с кодом: есть скобки, точки, кавычки или =, и нет кириллицы */
function isCode(c){return /[()\[\]="._|]/.test(c)&&!/[а-яё]/i.test(c);}
function nFilter(){document.querySelectorAll('.nrow').forEach(function(b){b.hidden=(NCAT!=='all'&&b.dataset.cat!==NCAT)||(NQ&&b.dataset.q.indexOf(NQ.toLowerCase())<0);});var e=$('.nempty');if(e)e.hidden=notes().some(function(n){return !nHide(n);});}
function vNote(){var n=notes().filter(function(x){return x.id===NOTE;})[0];if(!n)return vNotes();
  var cat=NCATS.filter(function(c){return c[0]===n.cat;})[0];
  var h=header()+'<button class="btn small ghost nback" data-a="nback">← Все шпаргалки</button><section class="card note"><div class="eyebrow">'+esc(n.ico||'')+' '+esc(cat?cat[1]:'')+'</div><h1>'+esc(n.h)+'</h1><p class="ntip">'+esc(n.tip)+'</p></section>';
  (n.b||[]).forEach(function(b){h+='<section class="card nblock">'+(b.h?'<h3>'+md(b.h)+'</h3>':'');
    if(b.t==='tab'){h+='<div class="ntab'+((b.head||[]).length>=3?' nw':'')+'"><table><thead><tr>'+(b.head||[]).map(function(c){return '<th>'+md(c)+'</th>';}).join('')+'</tr></thead><tbody>'+(b.r||[]).map(function(r){return '<tr>'+r.map(function(c,i){return i===0?'<th scope="row">'+md(c)+'</th>':'<td'+(isCode(c)?' class="m"':'')+'>'+md(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';}
    else if(b.t==='code'){h+='<pre class="code">'+esc(b.code)+'</pre>'+(runnable(b.code)?'<div style="margin-top:8px"><button class="btn small ghost" data-a="tosand" data-src="'+esc(b.code)+'">Открыть в песочнице</button></div>':'');}
    else h+='<ul class="nlst">'+(b.l||[]).map(function(x){return '<li>'+md(x)+'</li>';}).join('')+'</ul>';
    h+='</section>';});
  return h;}
function openNote(id){S.nt[id]=(S.nt[id]||0)+1;save();if(view!=='note'){BACK=view;try{history.pushState({pulsNote:1},'');}catch(e){}}NOTE=id;view='note';render();window.scrollTo(0,0);}
function closeNote(){NOTE=null;view='notes';render();window.scrollTo(0,0);}
/* код для песочницы: Python, без SQL, git, HTTP и установки пакетов */
function runnable(c){return sandOn()&&!!c&&!/^\s*(SELECT|WITH|GET|git |!pip|\{)/i.test(c)&&!/(X_tr|\bX\b|pipe\.|plt\.|requests|read_csv|tabelle|\(a, b|\(x, y)/.test(c);}

/* ---------- словарь ---------- */
var GT='terms', GQ='';
function allTerms(){var out=[];ALL.forEach(function(l){(l.terms||[]).forEach(function(t){out.push({t:t,open:!!S.done[l.id],day:l.idx+1});});});return out;}
function concepts(){return (C.concepts||[]).map(function(k){var L=LBY[k.after];return {k:k,open:!!S.done[k.after],day:L&&L.idx!=null&&ALL[L.idx]===L?L.idx+1:null,lt:L?L.title:''};});}
function strip(x){return String(x).replace(/<[^>]+>/g,'');}
function gHay(x){return x.k?(x.k.h+' '+x.k.en+' '+x.k.de+' '+x.k.s+' '+strip(x.k.t)+' '+x.k.code).toLowerCase():(x.t.join(' ')).toLowerCase();}
function vGloss(){var ts=allTerms(),op=ts.filter(function(x){return x.open;}),ks=concepts(),kop=ks.filter(function(x){return x.open;});
  var h=header()+'<section><div class="eyebrow">Словарь</div><h1>'+(GT==='terms'?esc(M.termsTitle):'Программирование')+'</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">'+(GT==='terms'?esc(M.termsSub):'Главные понятия кода: что это, пример, что он выведет и типичная ошибка. Нажми на карточку, чтобы раскрыть.')+'</p></section>';
  h+='<div class="seg" role="tablist"><button role="tab" data-a="gtab" data-v="terms" aria-selected="'+(GT==='terms')+'">Термины <span class="num muted">'+op.length+'</span></button><button role="tab" data-a="gtab" data-v="code" aria-selected="'+(GT==='code')+'">Программирование <span class="num muted">'+kop.length+'</span></button></div>';
  h+='<input class="txt nsearch" id="gq" type="search" autocomplete="off" placeholder="'+esc(GT==='terms'?M.termsHint:M.codeHint)+'" value="'+esc(GQ)+'">';
  if(GT==='terms'){
    if(!op.length)h+='<div class="card">Пройди первый урок, и здесь появятся первые термины.</div>';
    h+='<div class="terms">'+op.map(function(x){return '<div class="term gitem" data-q="'+esc(gHay(x))+'"><b lang="de">'+esc(x.t[0])+'</b><span lang="en">'+esc(x.t[1])+'</span><em>'+esc(x.t[2])+'</em><span class="tday">день '+x.day+'</span></div>';}).join('')+'</div>';
    if(op.length<ts.length)h+='<p class="small muted">Ещё закрыто: '+(ts.length-op.length)+'.</p>';}
  else{
    if(!ks.length)h+='<div class="card">Карточки ещё не загружены в курс. Владелец курса может обновить его во вкладке «Наблюдение».</div>';
    else if(!kop.length)h+='<div class="card">Первая карточка — «'+esc(ks[0].k.h)+'» — откроется после урока «'+esc(ks[0].lt)+'».</div>';
    h+='<div class="cxs">'+kop.map(function(x){var k=x.k;return '<details class="cx gitem" data-q="'+esc(gHay(x))+'" data-id="'+esc(k.id)+'"><summary><span class="grow"><b>'+esc(k.h)+'</b><span class="cxl"><span lang="en">'+esc(k.en)+'</span> · <span lang="de">'+esc(k.de)+'</span></span><span class="cxs1">'+esc(k.s)+'</span></span><span class="chev" aria-hidden="true">›</span></summary>'+
      '<div class="cxb"><p>'+k.t+'</p><div class="eyebrow">Пример</div><pre class="code">'+esc(k.code)+'</pre>'+(k.out?'<div class="eyebrow">Результат</div><pre class="out">'+esc(k.out)+'</pre>':'')+
      (k.tip?'<p class="cxtip"><b>Частая ошибка.</b> '+k.tip+'</p>':'')+'<div class="row">'+(runnable(k.code)?'<button class="btn small ghost" data-a="tosand" data-src="'+esc(k.code)+'">Попробовать в песочнице</button>':'')+(x.day?'<span class="small muted">Урок: день '+x.day+' · '+esc(x.lt)+'</span>':'')+'</div></div></details>';}).join('')+'</div>';
    var nx=ks.filter(function(x){return !x.open;});
    if(nx.length)h+='<p class="small muted">Ещё закрыто: '+nx.length+'.'+(nx[0].day?' Следующая — «'+esc(nx[0].k.h)+'», после дня '+nx[0].day+'.':'')+'</p>';}
  h+='<p class="small muted gempty" hidden>Ничего не нашлось.</p>';
  return h;}
function gFilter(){var q=GQ.toLowerCase(),any=false;document.querySelectorAll('.gitem').forEach(function(el){var hid=!!q&&el.dataset.q.indexOf(q)<0;el.hidden=hid;if(!hid)any=true;});var e=$('.gempty');if(e)e.hidden=any||!q;}

/* ---------- песочница ---------- */
var sandSrc='werte = [72, 80, 95, 110]\nfor w in werte:\n    if w > 100:\n        print(w, "Tachykardie")\n    else:\n        print(w, "ok")', sandOut='', py=null, pyLoading=false;
function vSand(){return header()+'<section><div class="eyebrow">Код</div><h1>Python прямо здесь</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Пиши код и запускай. Первый запуск загружает Python, это до минуты. Примеры из уроков, словаря и шпаргалок открываются здесь одной кнопкой.</p></section>'+
  '<label class="eyebrow" for="src">Код</label><textarea id="src" spellcheck="false" autocapitalize="off" autocomplete="off">'+esc(sandSrc)+'</textarea><div class="foot"><button class="btn" data-a="run" id="runbtn"'+(pyLoading?' disabled':'')+'>'+(pyLoading?'Выполняю…':'Запустить')+'</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="https://colab.research.google.com" target="_blank" rel="noopener">Открыть Google Colab</a></div><div class="eyebrow">Результат</div><pre class="out" id="out" aria-live="polite">'+esc(sandOut||'Здесь появится вывод программы.')+'</pre>';}
function loadPy(){if(py)return Promise.resolve(py);return new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';s.onload=res;s.onerror=function(){rej(new Error('load'));};document.head.appendChild(s);}).then(function(){return window.loadPyodide();}).then(function(p){py=p;return p;});}
function execPy(code,show){if(pyLoading)return;pyLoading=true;show('Загружаю Python. Первый раз это до минуты…');var buf=[],out;
  var timer=setTimeout(function(){if(pyLoading)show('Python всё ещё загружается. Если это длится дольше двух минут, открой Google Colab.',true);},25000);
  loadPy().then(function(p){p.setStdout({batched:function(s){buf.push(s);}});p.setStderr({batched:function(s){buf.push(s);}});return p.loadPackagesFromImports(code).then(function(){return p.runPythonAsync(code);});})
  .then(function(){out=buf.join('\n')||'Программа выполнилась, но ничего не напечатала. Добавь print().';},function(e){var m=String(e&&e.message||e);if(!py)out='Не получилось загрузить Python в этом окне. Открой Google Colab и вставь код туда.';else{var ls=m.trim().split('\n');out=(buf.length?buf.join('\n')+'\n\n':'')+'Ошибка: '+ls[ls.length-1];}})
  .then(function(){clearTimeout(timer);pyLoading=false;show(out);});}
function runPy(){var ta=$('#src');if(ta)sandSrc=ta.value;execPy(sandSrc,function(o){sandOut=o;if(view==='sandbox')render();});}
function runHere(){var run=R,pos=R.pos,c=R.q[pos].c;execPy(c.code,function(o){if(R===run&&R.pos===pos){R.out=o;render();}});}

/* ---------- профиль ---------- */
function badges(){var s=Math.max(S.best,streak()),dn=doneCount(),pr=Object.keys(S.prac).reduce(function(a,k){return a+S.prac[k];},0);
  var hasMission=ALL.some(function(l){return !!l.mission;}),out=[
  ['Первый шаг','Пройден первый урок',dn>=1],['Три дня подряд','Пульс держится 3 дня',s>=3],['Неделя без пропусков','7 дней подряд',s>=7],['Две недели','14 дней подряд',s>=14],['Месяц','30 дней подряд',s>=30],
  ['Чистая работа','Урок без единой ошибки',S.perfect>=1],['Пять чистых','5 уроков без ошибок',S.perfect>=5]];
  /* вехи курса: id урока или особое условие (@mission, @track, @final) */
  (M.milestones||[]).forEach(function(b){var k=b[2];
    if(k==='@mission'){if(hasMission||M.tour==='legacy')out.push([b[0],b[1],Object.keys(S.missions).length>=1]);}
    else if(k==='@track'){if(hasTracks()||M.tour==='legacy')out.push([b[0],b[1],!!S.track]);}
    else if(k==='@final')out.push([b[0],b[1],dn>0&&nextIdx()<0&&!needTrack()]);
    else out.push([b[0],b[1],!!S.done[k]]);});
  out.push(['Повторение — мать учения','10 повторений',S.reviews>=10],['Тренировка','5 свободных тренировок',pr>=5]);
  if(notes().length||M.tour==='legacy')out.push(['Справочник','Открыто 5 шпаргалок',Object.keys(S.nt).length>=5]);
  return out;}
function syncLine(){return ({cloud:'Синхронизация включена: прогресс хранится на защищённом сервере и виден на всех твоих устройствах.',connecting:'Подключаю синхронизацию…',owner:'Ты наблюдатель: твой прогресс хранится только в этом браузере, прогресс учеников — во вкладке «Наблюдение».',error:'Нет связи с сервером. Прогресс сохраняется в этом браузере и отправится, когда связь появится.'})[syncState]||'Прогресс сохраняется автоматически в этом браузере на этом устройстве.';}
function vProg(){var lv=level(),dn=doneCount(),s=streak();
  var h=header()+'<section class="card hero"><div class="row" style="gap:14px;flex-wrap:nowrap"><div class="me-av" aria-hidden="true">'+esc(S.avatar||M.avatar)+'</div><div class="grow"><div class="eyebrow">Профиль</div><h1 style="margin:2px 0">'+esc(S.name||'Твой прогресс')+'</h1><div class="small"><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+' · <span class="num muted">'+S.xp+' XP</span></div></div></div><div class="bar"><i style="width:'+lvPct()+'%"></i></div></section>';
  h+='<div class="stats"><div class="stat"><b class="num">'+dn+' / '+TOTAL+'</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">'+S.xp+'</b><span class="small muted">XP</span></div><div class="stat"><b class="num">'+Math.max(S.best,s)+'</b><span class="small muted">рекорд дней подряд</span></div></div>';
  h+='<section class="card"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><h3>Пульс за 14 дней</h3><div class="row" style="align-items:baseline;gap:8px;margin-top:4px"><span class="big num">'+s+'</span><span class="muted">'+plural(s,'день подряд','дня подряд','дней подряд')+'</span></div></div><div class="small muted" style="text-align:right">Заморозки: <b class="num">'+S.freezes+'</b></div></div><div style="margin-top:10px">'+stripSvg()+'</div></section>';
  h+='<section class="card"><h3>Последние 5 недель</h3><p class="small muted" style="margin:4px 0 10px">Пн–Вс. Зелёный: занималась. Жёлтый: сработала заморозка.</p>'+heat()+'</section>';
  var byTag={};ALL.forEach(function(l){if(l.tag==='boss')return;var b=byTag[l.tag]=byTag[l.tag]||[0,0];b[1]++;if(S.done[l.id])b[0]++;});
  h+='<section class="card" style="display:flex;flex-direction:column;gap:10px"><h3>По темам</h3>'+Object.keys(byTag).map(function(k){var b=byTag[k];return '<div><div class="row small" style="justify-content:space-between"><span>'+esc(TAGS[k]||k)+'</span><span class="num muted">'+b[0]+' / '+b[1]+'</span></div><div class="bar acc" style="margin-top:4px"><i style="width:'+Math.round(b[0]/b[1]*100)+'%"></i></div></div>';}).join('')+'</section>';
  h+='<section><h3 style="margin-bottom:8px">Награды</h3><div class="badges">'+badges().map(function(b){return '<div class="badge'+(b[2]?'':' off')+'"><b>'+(b[2]?'✓ ':'')+b[0]+'</b><span class="small muted">'+b[1]+'</span></div>';}).join('')+'</div></section>';
  h+='<section class="card"><h3>Как это работает</h3><p class="small" style="margin:6px 0 0;max-width:62ch">Один урок в день держит пульс. В день можно пройти не больше двух новых уроков, повторять и тренироваться можно сколько угодно. За каждые 7 дней подряд ты получаешь заморозку: она спасает серию, если один день пропущен. Ошибки не страшны: задание вернётся в конце урока, а потом в «Работе над ошибками».</p></section>';
  h+='<section class="card" style="display:flex;flex-direction:column;gap:14px"><h3>Настройки</h3>'+
    '<div><div class="small" style="margin-bottom:6px"><b>Тема</b></div><div class="themes">'+THEMES.map(function(x){var cur=(S.theme||'auto')===x[0];return '<button class="th" data-a="theme" data-v="'+x[0]+'" aria-pressed="'+cur+'"><span class="sw">'+(x[2]?x[2].map(function(c){return '<i style="background:'+c+'"></i>';}).join(''):'<i style="background:#f2f5f4"></i><i style="background:#0c181d"></i>')+'</span>'+esc(x[1])+'</button>';}).join('')+'</div></div>'+
    '<div><div class="small" style="margin-bottom:6px"><b>Аватар</b></div><div class="avs">'+AVATARS.map(function(a){return '<button class="av" data-a="avatar" data-v="'+a+'" aria-pressed="'+(S.avatar===a)+'">'+a+'</button>';}).join('')+'</div></div>'+
    remBlock()+courseBlock()+
    '<div class="row"><label for="nm" class="small">Имя</label><input class="txt" id="nm" value="'+esc(S.name)+'" maxlength="30"><button class="btn small" data-a="name">Сохранить</button></div>'+
    (hasTracks()&&S.track?'<div><div class="small"><b>Трек:</b> '+esc(trackName(S.track))+'. Пройденные уроки всех треков сохраняются.</div><div class="row" style="margin-top:8px">'+trackList().filter(function(t){return t!==S.track;}).map(function(t){return '<button class="btn small ghost" data-a="track" data-v="'+esc(t)+'">Перейти на '+esc(trackName(t))+'</button>';}).join('')+'</div></div>':'')+
    '<p class="small muted" style="margin:0">'+syncLine()+(EMAIL?' Вход: '+esc(EMAIL)+'.':'')+'</p>'+
    '<details><summary class="small">Резервная копия прогресса</summary><p class="small" style="margin:8px 0 10px;max-width:62ch">Код прогресса хранит всё: пройденные дни, XP и серию. Скопируй его и сохрани, например отправь себе в мессенджер. Чтобы восстановить, вставь код и нажми «Восстановить».</p><div class="row"><button class="btn small" data-a="exp">Скопировать код прогресса</button></div><label class="eyebrow" for="code" style="display:block;margin-top:12px">Код</label><textarea id="code" class="txt" style="max-width:100%;min-height:70px;font-family:var(--f-mono);font-size:12px" spellcheck="false" autocomplete="off" placeholder="Вставь сюда сохранённый код"></textarea><div class="row" style="margin-top:8px"><button class="btn small ghost" data-a="imp">Восстановить из кода</button></div></details>'+
    (SB&&ME?'<details><summary class="small">Сменить пароль</summary><form id="pwf" style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><input type="email" autocomplete="username" value="'+esc(EMAIL)+'" hidden><input class="txt" style="max-width:none" id="pw1" type="password" autocomplete="new-password" placeholder="Новый пароль (от 8 символов)"><input class="txt" style="max-width:none" id="pw2" type="password" autocomplete="new-password" placeholder="Повтори пароль"><button class="btn small" type="submit">Сохранить пароль</button></form></details>':'')+
    '<div class="row"><button class="btn small ghost" data-a="tour">Как пользоваться</button>'+(SB&&ME?'<button class="btn small ghost" data-a="logout">Выйти на этом устройстве</button>':'')+'<button class="btn small ghost" data-a="reset" id="rst" style="color:var(--bad)">Сбросить весь прогресс</button></div></section>';
  return h;}
function doPw(){var a=$('#pw1').value,b=$('#pw2').value;if(a.length<8)return toast('Пароль слишком короткий: нужно минимум 8 символов.');if(a!==b)return toast('Пароли не совпадают.');
  SB.auth.updateUser({password:a}).then(function(r){if(authErr(r))return sessionLost();if(r.error){toast('Не получилось: '+r.error.message);return;}$('#pw1').value='';$('#pw2').value='';toast('Пароль изменён.');},function(e){toast('Не получилось: '+String(e&&e.message||e));});}

/* ---------- приложение и напоминания (Web Push) ---------- */
var INSTALL_EVT=null, PUSHBUSY=false;
var IOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function standalone(){return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;}
function pushOk(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!(window.PULS_CONFIG||{}).vapidPublic;}
function needHome(){return IOS&&!standalone();}
function remH(){return S.remind&&S.remind.h!=null?S.remind.h:19;}
function hh(h){return (h<10?'0':'')+h+':00';}
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();INSTALL_EVT=e;if(view==='progress')render();});
window.addEventListener('appinstalled',function(){INSTALL_EVT=null;render();});
function b64u(x){var p='='.repeat((4-x.length%4)%4),b=atob((x+p).replace(/-/g,'+').replace(/_/g,'/')),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
function subRow(sub,h){var j=sub.toJSON();var tz='Europe/Berlin';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz;}catch(e){}
  return {endpoint:j.endpoint,user_id:ME,p256dh:j.keys.p256dh,auth:j.keys.auth,hour:h,tz:tz,updated_at:new Date().toISOString()};}
function pushOn(h){if(PUSHBUSY)return;if(!pushOk()){toast(needHome()?'На iPhone: «Поделиться» → «На экран Домой», потом открой приложение с иконки.':'Этот браузер не поддерживает уведомления. Открой сайт в Chrome или установи приложение.');return;}if(!SB||!ME){toast('Сначала войди в аккаунт.');return;}
  PUSHBUSY=true;render();
  Notification.requestPermission().then(function(perm){if(perm!=='granted')throw new Error('denied');return navigator.serviceWorker.ready;})
  .then(function(reg){return reg.pushManager.getSubscription().then(function(old){return old||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(window.PULS_CONFIG.vapidPublic)});});})
  .then(function(sub){return SB.from('push_subs').upsert(subRow(sub,h),{onConflict:'endpoint'}).then(function(r){if(r.error)throw r.error;});})
  .then(function(){S.remind={on:1,h:h};S.remindAsk=1;save();PUSHBUSY=false;render();toast('Напоминания включены: каждый день в '+hh(h)+'.');})
  .catch(function(e){PUSHBUSY=false;render();toast(String(e&&e.message)==='denied'?'Уведомления запрещены в браузере. Разреши их в настройках сайта (значок замка у адреса).':'Не получилось включить напоминания. Попробуй ещё раз.');});}
function pushOff(){if(PUSHBUSY)return;PUSHBUSY=true;
  var done=function(){S.remind={on:0,h:remH()};save();PUSHBUSY=false;render();};
  if(!pushOk()){done();return;}
  navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription();}).then(function(sub){if(!sub)return;var ep=sub.endpoint;
    return sub.unsubscribe().then(function(){if(SB&&ME)return SB.from('push_subs').delete().eq('endpoint',ep);});}).then(done,done);}
function pushHour(h){if(!(S.remind&&S.remind.on)){S.remind={on:0,h:h};save();render();return;}
  if(!pushOk()||!SB||!ME)return;
  navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription();}).then(function(sub){if(!sub){pushOn(h);return;}
    return SB.from('push_subs').upsert(subRow(sub,h),{onConflict:'endpoint'}).then(function(r){if(r.error)throw r.error;S.remind={on:1,h:h};save();render();toast('Напоминания: каждый день в '+hh(h)+'.');});}).catch(function(){toast('Не получилось сменить время. Попробуй ещё раз.');});}
/* держит серверную копию подписки этого устройства свежей (новые ключи, другой аккаунт на том же телефоне) */
function pushSync(){if(!pushOk()||!SB||!ME||OWNER||!(S.remind&&S.remind.on)||Notification.permission!=='granted')return;
  navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription();}).then(function(sub){if(sub)SB.from('push_subs').upsert(subRow(sub,remH()),{onConflict:'endpoint'}).then(function(){},function(){});}).catch(function(){});}
function remCard(){if(OWNER||S.remindAsk||(S.remind&&S.remind.on)||!S.tourDone||TOUR>=0)return '';
  if(!pushOk()&&!needHome())return '';if(window.Notification&&Notification.permission==='denied')return '';
  return '<section class="card remcard"><div class="row" style="gap:12px;align-items:flex-start;flex-wrap:nowrap"><span class="rci" aria-hidden="true">🔔</span><div class="grow"><b>Напоминать о занятии в '+hh(remH())+'?</b><p class="small muted" style="margin:4px 0 0">'+(needHome()?'На iPhone сначала: «Поделиться» → «На экран Домой», потом открой приложение с иконки.':'Одно уведомление в день и только если сегодня ещё не было урока. Время можно поменять в профиле.')+'</p></div></div>'+
    '<div class="foot">'+(needHome()?'':'<button class="btn small" data-a="remon">Включить</button>')+'<button class="linkbtn" data-a="remlater">Не сейчас</button></div></section>';}
function remBlock(){if(OWNER)return '';var on=S.remind&&S.remind.on,h=remH(),opts='';for(var i=6;i<=22;i++)opts+='<option value="'+i+'"'+(i===h?' selected':'')+'>'+hh(i)+'</option>';
  var st=!pushOk()?(needHome()?'На iPhone: «Поделиться» → «На экран Домой», потом открой приложение с иконки — там можно включить напоминания.':'Этот браузер не поддерживает уведомления. Открой сайт в Chrome или установи приложение.'):(window.Notification&&Notification.permission==='denied'?'Уведомления запрещены в браузере. Разреши их в настройках сайта (значок замка у адреса).':'Одно уведомление в день в выбранное время — только если сегодня ещё не было урока.');
  var inst=INSTALL_EVT?'<div style="margin-top:10px"><button class="btn small ghost" data-a="install">📲 Установить приложение</button><p class="small muted" style="margin:6px 0 0">Иконка на главном экране, открывается без адресной строки.</p></div>':'';
  return '<div class="remblk"><div class="small" style="margin-bottom:6px"><b>🔔 Напоминания</b></div><p class="small muted" style="margin:0 0 8px">'+st+'</p>'+
    (pushOk()?'<div class="row" style="gap:8px"><label class="small" for="remh">Время</label><select id="remh" class="txt sel" data-ch="remh">'+opts+'</select>'+
      (on?'<button class="btn small ghost" data-a="remoff"'+(PUSHBUSY?' disabled':'')+'>Выключить</button><span class="small" style="color:var(--ok)">✓ включены</span>':'<button class="btn small" data-a="remon"'+(PUSHBUSY?' disabled':'')+'>Включить</button>')+'</div>':'')+inst+'</div>';}

/* ---------- наблюдение (только владелец) ---------- */
var W={docs:null,acc:[],at:0,err:'',ch:null,poll:null,busy:false,sort:'recent',open:{}};
function ago(t){if(!t)return 'нет данных';var m=Math.round((Date.now()-t)/60000);if(m<1)return 'только что';if(m<60)return m+' мин назад';var hh=Math.round(m/60);if(hh<24)return hh+' ч назад';var d=Math.round(hh/24);return d+' '+plural(d,'день','дня','дней')+' назад';}
function loadWatch(){if(!SB||!OWNER||W.busy)return;W.busy=true;
  var acc=OLDDB?Promise.resolve(null):SB.from('course_access').select('user_id,course_id').then(function(r){return r.error?null:r.data;},function(){return null;});
  SB.from('progress').select('user_id,state,updated_at'+(OLDDB?'':',course_id')).then(function(r){
    return acc.then(function(a){W.busy=false;W.acc=a||[];
    if(authErr(r))return sessionLost();
    if(r.error){W.err=r.error.message||'error';}else{W.err='';W.at=Date.now();
      W.docs=(r.data||[]).filter(function(x){return x.user_id!==ME&&x.state;}).map(function(x){var o=fix(x.state);o._id=x.user_id;o._c=x.course_id||'main';return o;});}
    if(view==='watch')renderKeep();});},function(){W.busy=false;W.err='нет связи';if(view==='watch')render();});}
/* ученики текущего курса; W.open хранится по ученику, поэтому ключ строки — id ученика */
function wDocs(){return (W.docs||[]).filter(function(x){return OLDDB||x._c===CUR;});}
function whoName(uid){var d=(W.docs||[]).filter(function(x){return x._id===uid&&(x.name||x.email);})[0];return d?(d.name||d.email):uid.slice(0,8)+'…';}
/* перерисовка без потери того, что наблюдатель печатает: открытые details, значения полей, фокус */
function renderKeep(){var app=$('#app');if(!app){render();return;}
  var det=[].map.call(app.querySelectorAll('details'),function(d){return d.open;});
  var vals={};app.querySelectorAll('input,select,textarea').forEach(function(f,i){var k=f.id||f.name||('#'+i);vals[k]=f.type==='checkbox'||f.type==='radio'?{c:f.checked}:{v:f.value};});
  var ae=document.activeElement,fk=ae&&app.contains(ae)?(ae.id||ae.name):null,sel=null;try{if(fk&&ae.selectionStart!=null)sel=[ae.selectionStart,ae.selectionEnd];}catch(e){}
  var y=window.scrollY;render();
  [].forEach.call(app.querySelectorAll('details'),function(d,i){if(det[i]!=null)d.open=det[i];});
  app.querySelectorAll('input,select,textarea').forEach(function(f,i){var k=f.id||f.name||('#'+i),o=vals[k];if(!o)return;if('c' in o)f.checked=o.c;else if(f.type!=='file')f.value=o.v;});
  if(fk){var n=document.getElementById(fk);if(n){try{n.focus({preventScroll:true});if(sel)n.setSelectionRange(sel[0],sel[1]);}catch(e){}}}
  window.scrollTo(0,y);}
function startWatch(){if(!SB||!OWNER)return;if(!W.docs&&!W.busy)loadWatch();
  if(!W.ch&&SB.channel){try{W.ch=SB.channel('progress-watch').on('postgres_changes',{event:'*',schema:'public',table:'progress'},function(){clearTimeout(W.deb);W.deb=setTimeout(loadWatch,3000);}).subscribe();}catch(e){W.ch=null;}}
  if(!W.poll)W.poll=setInterval(function(){if(view==='watch'&&!document.hidden)loadWatch();},60000);}
function wTags(label,items){return '<div class="small wtags"><b>'+esc(label)+':</b> '+(items.length?items.map(function(x){return '<span class="tag">'+esc(x[0])+' · '+x[1]+'</span>';}).join(' '):'<span class="muted">пока нет</span>')+'</div>';}
function learnerDetail(st){var s=streak(st),lv=level(st),dn=doneCount(st),nl=nextLesson(st),ni=nextIdx(st),t=new Date(),wk=0;for(var i=0;i<7;i++)if(st.days[ds(addDays(t,-i))]!==undefined)wk++;
  var weak={},bylesson={};Object.keys(st.missed||{}).forEach(function(k){var L=LBY[k.split(':')[0]];if(!L)return;weak[L.tag]=(weak[L.tag]||0)+st.missed[k];bylesson[L.id]=(bylesson[L.id]||0)+st.missed[k];});
  var topL=Object.keys(bylesson).sort(function(a,b){return bylesson[b]-bylesson[a];}).slice(0,3);
  var ns=notes(),ks=C.concepts||[];
  var h='<div class="wdetail"><p class="small" style="margin:0">'+(nl?'Сейчас на дне '+(ni+1)+': <b>'+esc(nl.title)+'</b>.':needTrack(st)?'Общая часть пройдена, ждёт выбора трека.':'Курс пройден полностью.')+(st.track?' Трек: '+esc(trackName(st.track))+'.':'')+'</p>'+
    '<p class="small muted" style="margin:0">Последний урок или действие: '+ago(st.t)+' · '+(st.tourDone?'обучение пройдено':'обучение не пройдено')+' · напоминания '+(st.remind&&st.remind.on?'в '+hh(st.remind.h):'выключены')+'</p>'+stripSvg(st)+
    '<div class="stats"><div class="stat"><b class="num" style="color:var(--pulse)">'+s+'</b><span class="small muted">'+plural(s,'день подряд','дня подряд','дней подряд')+'</span></div><div class="stat"><b class="num">'+dn+' / '+TOTAL+'</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">'+wk+' / 7</b><span class="small muted">за неделю</span></div></div>'+
    '<div><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+st.xp+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+lvPct(st)+'%"></i></div></div>'+
    '<p class="small" style="margin:0">Рекорд серии: '+Math.max(st.best||0,s)+'. Заморозок: '+(st.freezes||0)+'. Уроков без ошибок: '+(st.perfect||0)+'. Повторений: '+(st.reviews||0)+'.</p>'+
    wTags('Практика',Object.keys(st.prac).sort(function(a,b){return st.prac[b]-st.prac[a];}).map(function(k){return [k==='miss'?'Работа над ошибками':(TAGS[k]||k),st.prac[k]];}))+
    wTags('Шпаргалки',Object.keys(st.nt).sort(function(a,b){return st.nt[b]-st.nt[a];}).map(function(k){var n=ns.filter(function(x){return x.id===k;})[0];return [n?n.h:k,st.nt[k]];}))+
    wTags('Карточки кода',Object.keys(st.cx).map(function(k){var x=ks.filter(function(c){return c.id===k;})[0];return [x?x.h:k,st.cx[k]];}))+
    '<div><h3>Где были ошибки</h3>'+(topL.length?'<div class="row" style="margin-top:6px">'+Object.keys(weak).map(function(g){return '<span class="tag">'+esc(TAGS[g]||g)+': '+weak[g]+'</span>';}).join('')+'</div><ul class="small" style="margin:8px 0 0;padding-left:18px">'+topL.map(function(id){return '<li>'+esc(LBY[id].title)+' — '+bylesson[id]+'</li>';}).join('')+'</ul>':'<p class="small muted" style="margin:4px 0 0">Неисправленных ошибок нет.</p>')+'</div>'+
    '<details><summary class="small">Недели и календарь</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">'+weeksFor(st).map(function(w,wi){var d=w.days.filter(function(l){return st.done[l.id];}).length;return '<div><div class="row small" style="justify-content:space-between"><span>'+(wi+1)+'. '+esc(w.title)+'</span><span class="muted num">'+d+' / '+w.days.length+'</span></div><div class="bar acc" style="margin-top:4px"><i style="width:'+Math.round(d/w.days.length*100)+'%"></i></div></div>';}).join('')+'</div><div style="margin-top:12px">'+heat(st)+'</div></details></div>';
  return h;}
function learnerLine(st){var id=st._id,open=!!W.open[id],name=st.name||st.email||'Ученица',s=streak(st),dn=doneCount(st),td=st.days[today()]!==undefined,seenTs=Math.max(st.lastOn||0,st.t||0),dots='',t=new Date();
  for(var i=6;i>=0;i--)dots+='<i class="'+(st.days[ds(addDays(t,-i))]!==undefined?'a':'')+'"></i>';
  var row='<button class="wline'+(open?' open':'')+'" data-a="wopen" data-v="'+esc(id)+'" aria-expanded="'+open+'"><span class="wst'+(ONLINE[id]?' on':'')+'" data-uid="'+esc(id)+'"></span><span class="wav">'+esc(st.avatar||'🙂')+'</span><span class="grow wnm"><b>'+esc(name)+'</b>'+(td?'<span class="wtd">урок сегодня ✓</span>':'')+'<span class="small muted wseen'+(ONLINE[id]?' onl':'')+'" data-seen="'+esc(id)+'" data-ts="'+seenTs+'">'+(ONLINE[id]?'в сети сейчас':'была '+ago(seenTs))+'</span></span><span class="wdots" aria-label="Дни за неделю">'+dots+'</span><span class="wnum num wxp" title="XP">'+(st.xp||0)+'</span><span class="wnum num" title="Дней подряд" style="color:var(--pulse)">♥'+s+'</span><span class="wnum num" title="Дней курса">'+dn+'/'+TOTAL+'</span></button>';
  return '<div class="wrow">'+row+(open?learnerDetail(st):'')+'</div>';}
function vWatch(){if(!OWNER)return header()+'<div class="card">Эта вкладка доступна только владельцу курса.</div>';startWatch();
  var h=header()+'<section><div class="eyebrow">Наблюдение · обновляется вживую</div><h1>Прогресс учеников</h1><p class="small muted wleg" style="margin:6px 0 0">'+(W.at?'Данные получены '+ago(W.at)+'. ':'')+'<span class="wst on"></span> приложение открыто сейчас</p></section>';
  if(CAT.length>1)h+='<div class="row small" style="gap:6px"><span class="muted">Курс:</span>'+CAT.map(function(c){return '<button class="chipbtn'+(c.id===CUR?' on':'')+'" data-a="course" data-v="'+esc(c.id)+'">'+esc(c.title||c.id)+'</button>';}).join('')+'</div>';
  var D=wDocs();
  if(W.err)h+='<div class="card">Не удалось получить данные ('+esc(W.err)+'). Проверь интернет и обнови страницу.</div>';
  else if(!W.docs)h+='<div class="card">Загружаю…</div>';
  else if(!D.length)h+='<div class="card">'+(CAT.length>1?'В этом курсе пока никто не синхронизировал прогресс.':'Пока никто не синхронизировал прогресс.')+' Он появится здесь после первого входа ученика.</div>';
  else{var td=today(),act=D.filter(function(x){return x.days[td]!==undefined;}).length,sort=W.sort;
    var keyf={recent:function(x){return Math.max(x.t||0,x.lastOn||0);},streak:function(x){return streak(x);},days:function(x){return doneCount(x)*1e6+(x.xp||0);}}[sort];
    var docs=D.slice().sort(sort==='name'?function(a,b){return String(a.name||a.email||'').localeCompare(String(b.name||b.email||''));}:function(a,b){return keyf(b)-keyf(a);});
    if(D.length===1)W.open[D[0]._id]=W.open[D[0]._id]!==false;
    h+='<div class="wsum"><b class="num">'+act+' / '+D.length+'</b><span class="small">занимались сегодня</span></div>';
    if(D.length>1)h+='<div class="row small" style="gap:6px"><span class="muted">Сортировка:</span>'+[['recent','Активность'],['streak','Серия'],['days','Прогресс'],['name','Имя']].map(function(k){return '<button class="chipbtn'+(sort===k[0]?' on':'')+'" data-a="wsort" data-v="'+k[0]+'">'+k[1]+'</button>';}).join('')+'</div>';
    h+='<div class="wlist">'+docs.map(learnerLine).join('')+'</div>';}
  return h+vAccess()+vAdd()+vUpload();}
/* кто видит текущий курс */
function vAccess(){if(OLDDB)return '';var c=CAT.filter(function(x){return x.id===CUR;})[0];if(!c)return '';
  var who=(W.acc||[]).filter(function(a){return a.course_id===CUR;});
  return '<details class="card"><summary>Доступ к курсу «'+esc(c.title||c.id)+'»</summary>'+
    '<p class="small" style="margin:8px 0">'+(c.open?'Курс <b>открыт</b>: его видят все, кто вошёл.':'Курс <b>закрыт</b>: его видят только ученики из списка ниже.')+'</p>'+
    '<div class="row"><button class="btn small ghost" data-a="copen">'+(c.open?'Закрыть курс':'Открыть всем вошедшим')+'</button></div>'+
    (who.length?'<ul class="small" style="margin:12px 0 0;padding-left:18px">'+who.map(function(a){return '<li>'+esc(whoName(a.user_id))+' <button class="linkbtn" data-a="revoke" data-v="'+esc(a.user_id)+'">забрать доступ</button></li>';}).join('')+'</ul>':'<p class="small muted" style="margin:12px 0 0">Отдельный доступ ещё никому не выдан.</p>')+
    '<p class="small muted" style="margin:10px 0 0">Выдать доступ: «Добавить ученика» ниже с этим курсом. Если аккаунт с таким email уже есть, ему просто откроется курс.</p></details>';}

/* новый аккаунт ученика: Edge Function create-learner, секретный ключ остаётся в Supabase */
var ADD={busy:false,res:null,err:''};
function vAdd(){var h='<details class="card"'+(ADD.res||ADD.err?' open':'')+'><summary>Добавить ученика</summary><p class="small muted">Аккаунт создаётся сразу, письмо не нужно. Пароль можно не вводить — придумаю сам. Потом отправь данные ученице.</p>'+
  '<form id="af" style="display:flex;flex-direction:column;gap:8px"><input class="txt" style="max-width:none" id="ae" type="email" placeholder="Email ученика" autocomplete="off" required>'+
  '<input class="txt" style="max-width:none" id="an" placeholder="Имя (необязательно)" maxlength="30" autocomplete="off">'+
  '<input class="txt" style="max-width:none" id="ap" placeholder="Пароль (от 8 символов, необязательно)" autocomplete="new-password">'+
  (!OLDDB&&CAT.length?'<label class="small" for="ac">Курс</label><select class="txt sel" style="max-width:none" id="ac">'+CAT.map(function(c){return '<option value="'+esc(c.id)+'"'+(c.id===CUR?' selected':'')+'>'+esc(c.title||c.id)+'</option>';}).join('')+'</select>':'')+
  '<button class="btn" type="submit"'+(ADD.busy?' disabled':'')+'>'+(ADD.busy?'Создаю…':'Создать аккаунт')+'</button></form>';
  if(ADD.err)h+='<p class="small" role="alert" style="color:var(--bad)">'+esc(ADD.err)+'</p>';
  if(ADD.res)h+='<p class="small"><b>Готово! Отправь эти данные:</b></p><textarea class="txt" id="amsg" style="max-width:none;min-height:120px" readonly>'+esc(addMsg(ADD.res))+'</textarea><div class="row" style="margin-top:8px"><button class="btn small" data-a="addcopy">Скопировать сообщение</button></div>';
  return h+'</details>';}
function addMsg(r){var cid=r.course_id||CUR,head=cid===CUR&&M.invite?M.invite:courseTitle(cid)+' — ежедневный курс',url=location.origin+location.pathname;
  if(r.granted)return head+'\n'+url+'\nТебе открыт этот курс. Вход прежний: '+r.email+'.\n\nЕсли курсов несколько, переключиться можно в профиле: кнопка с аватаром вверху справа.';
  return head+'\n'+url+'\nEmail: '+r.email+'\nПароль: '+r.password+'\n\nПароль можно сменить в профиле: кнопка с аватаром вверху справа.';}
function doAdd(){var em=$('#ae').value.trim(),nm=$('#an').value.trim(),pw=$('#ap').value.trim(),ac=$('#ac'),cid=ac?ac.value:'';if(!em)return;
  if(!SB||!SB.functions)return;ADD={busy:true,res:null,err:''};render();
  SB.auth.getUser().then(function(u){if(u&&u.error){ADD={busy:false,res:null,err:''};sessionLost();return null;}
  var body={email:em,name:nm,password:pw};if(cid)body.course_id=cid;
  return SB.functions.invoke('create-learner',{body:body}).then(function(r){
    var d=r.data,e=r.error;
    if(e){var ctx=e.context,p=ctx&&ctx.json?ctx.json():Promise.resolve(null);
      return p.then(function(j){var code=j&&j.error;ADD={busy:false,res:null,err:code==='exists'?'Такой email уже зарегистрирован.':code==='course'?'Такого курса нет в базе.':code==='password'?'Пароль должен быть не короче 8 символов.':code==='email'?'Проверь email.':/not found|404|FunctionsFetchError|Failed to send/i.test(String(e.message)+String(e.name))?'В Supabase не установлена функция create-learner. Инструкция в README.':'Не получилось: '+(code||e.message||'?')+(j&&j.detail?' ('+j.detail+')':'')};render();},function(){ADD={busy:false,res:null,err:'Не получилось: '+(e.message||'?')};render();});}
    ADD={busy:false,res:d,err:''};render();loadWatch();});},function(e){ADD={busy:false,res:null,err:'Не получилось: '+String(e&&e.message||e)};render();});}
/* новая версия курса прямо из приложения (политика RLS «course: observers update») */
function vUpload(){var file='<label class="btn small ghost" style="display:inline-flex;align-items:center;cursor:pointer;align-self:flex-start">Выбрать файл<input type="file" id="upf" accept=".json,application/json" hidden></label>';
  if(OLDDB)return '<details class="card"><summary>Загрузить курс</summary><p class="small muted">Выбери файл course.json. Курс заменится для всех сразу, прогресс учеников не трогается: он привязан к id уроков. Чтобы держать несколько курсов, выполни в Supabase migrations/001_multi_course.sql.</p>'+file+'</details>';
  var c=CAT.filter(function(x){return x.id===CUR;})[0]||{};
  return '<details class="card"><summary>Загрузить курс</summary><p class="small muted">Тот же id — новая версия курса: прогресс учеников не трогается, он привязан к id уроков. Новый id — новый курс со своим прогрессом.</p>'+
    '<div style="display:flex;flex-direction:column;gap:8px"><label class="small" for="ucid">id курса</label><input class="txt" style="max-width:none" id="ucid" list="ucat" value="'+esc(CUR)+'" autocomplete="off" spellcheck="false" placeholder="латиница, цифры, - и _"><datalist id="ucat">'+CAT.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.title||'')+'</option>';}).join('')+'</datalist>'+
    '<label class="small" for="uttl">Название</label><input class="txt" style="max-width:none" id="uttl" maxlength="60" value="'+esc(c.title||'')+'" placeholder="Как курс называется в списке">'+
    '<label class="small"><input type="checkbox" id="uopen"'+(c.open?' checked':'')+'> Открыт всем вошедшим (иначе только тем, кому выдан доступ)</label>'+file+'</div></details>';}
function upFill(){var id=($('#ucid')||{}).value,c=CAT.filter(function(x){return x.id===id;})[0];if(!c)return;var t=$('#uttl'),o=$('#uopen');if(t)t.value=c.title||'';if(o)o.checked=!!c.open;}
function doUpload(file){var id=OLDDB?'main':String(($('#ucid')||{}).value||'').trim().toLowerCase(),ttl=String(($('#uttl')||{}).value||'').trim().slice(0,60),op=!!($('#uopen')||{}).checked;
  if(!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id))return toast('id курса: латиница, цифры, «-» и «_», до 40 символов.');
  var rd=new FileReader();rd.onload=function(){var c=null;try{c=JSON.parse(rd.result);}catch(e){}
  var ok=c&&Array.isArray(c.weeks)&&c.weeks.length&&c.weeks.every(function(w){return w&&Array.isArray(w.days)&&w.days.every(function(d){return d&&d.id&&d.title&&Array.isArray(d.cards);});});
  if(!ok)return toast('Это не файл курса: нет недель или у урока нет id.');
  var row={id:id,data:c,updated_at:new Date().toISOString()};if(!OLDDB){row.title=ttl||(c.meta&&c.meta.brand)||id;row.open=op;}
  SB.from('course_content').upsert(row).then(function(r){
    if(authErr(r))return sessionLost();
    if(r.error)return toast('Не получилось: '+r.error.message);
    var n=0;c.weeks.forEach(function(w){n+=w.days.length;});
    try{localStorage.setItem(kC(id),JSON.stringify(c));}catch(e){}
    if(id===CUR)setCourse(c);
    loadCatalog().then(function(){render();toast((id===CUR?'Курс обновлён: ':'Курс «'+courseTitle(id)+'» загружен: ')+n+' '+plural(n,'урок','урока','уроков')+', шпаргалок '+(c.notes||[]).length+'.');});},function(e){toast('Не получилось: '+String(e&&e.message||e));});};
  rd.readAsText(file);}

/* ---------- урок, практика, повторение ---------- */
function startRun(L,kind,q,isNew,sec){if(view!=='run'&&view!=='result'){BACK=view;try{history.pushState({pulsRun:1},'');}catch(e){}}
  R={L:L,kind:kind,sec:sec||'',q:q,pos:0,total:q.length,ok:0,fixed:0,isNew:!!isNew,review:kind==='review',mission:false};T=null;view='run';render();window.scrollTo(0,0);}
function leaveRun(){var wasRun=view==='run';R=null;T=null;view=VIEWS.indexOf(BACK)>=0?BACK:'path';try{if(location.hash.slice(1)!==view)history.replaceState(history.state,'','#'+view);}catch(e){}render();window.scrollTo(0,0);return wasRun;}
function backOut(){try{if(history.state&&history.state.pulsRun){history.back();return;}}catch(e){}leaveRun();}
window.addEventListener('popstate',function(){if(view==='run'||view==='result'){if(leaveRun())toast('Урок не засчитан. Его можно начать заново.');}else if(view==='note')closeNote();});
function weekTasks(wi){var a=[];WK[wi].days.forEach(function(l){(l.tasks||[]).forEach(function(t){a.push(t);});});return a;}
function openLesson(i){var L=ALL[i],isNew=!S.done[L.id];
  if(isNew&&i!==nextIdx())return toast('Сначала пройди предыдущий день.');
  if(isNew&&newToday()>=2)return toast('Два новых урока в день — максимум. Этот откроется завтра.');
  var tasks=L.boss?shuffle(weekTasks(L.week)).slice(0,8):L.tasks;
  var q=L.cards.map(function(c){return {k:'card',c:c};}).concat(tasks.map(function(t){return {k:'task',t:t,first:true};}));
  if(L.mission)q.push({k:'mission',m:L.mission});
  startRun(L,'lesson',q,isNew);}
function openReview(){var pool=doneTasks();
  if(!pool.length)return toast('Повторять пока нечего. Пройди первый урок.');
  var tasks=pickFrom(pool,6);
  startRun({id:'review',title:'Повторение',tag:'stat'},'review',shuffle(tasks).map(function(t){return {k:'task',t:t,first:true};}),false);}
function initTask(t){T={done:false,right:false,tutor:''};
  if(t.t==='mc'){T.opts=shuffle(t.o.map(function(_,i){return i;}));T.sel=-1;}
  if(t.t==='order'){T.pool=shuffle(t.lines.map(function(_,i){return i;}));if(T.pool.every(function(v,i){return v===i;}))T.pool.reverse();T.ans=[];}
  if(t.t==='match'){T.right_=shuffle(t.pairs.map(function(_,i){return i;}));T.l=-1;T.ok={};T.err=0;T.bad=null;}
  if(t.t==='fill'){T.val='';}}
function codeBlock(c,run){return '<pre class="code">'+esc(c)+'</pre>'+(run?'<div><button class="btn small ghost" data-a="runhere"'+(pyLoading?' disabled':'')+'>'+(pyLoading?'Выполняю…':'Запустить код')+'</button></div>'+(R&&R.out?'<pre class="out" aria-live="polite">'+esc(R.out)+'</pre>':''):'');}
function vRun(){var st=R.q[R.pos],pct=Math.round(R.pos/R.q.length*100);
  var h='<div class="runhead"><button class="x" data-a="quit" aria-label="Выйти из урока">✕ Выйти</button><div class="bar acc grow"><i style="width:'+pct+'%"></i></div></div><section class="lesson">';
  if(st.k==='card'){var c=st.c,isPy=sandOn()&&c.code&&R.L.tag==='py';
    h+='<div class="eyebrow">'+esc(R.L.title)+'</div><h1>'+c.h+'</h1><p>'+c.t+'</p>'+(c.code?codeBlock(c.code,isPy):'')+'<div class="foot"><button class="btn" data-a="next">Дальше</button></div>';}
  else if(st.k==='mission'){var m=st.m;
    h+='<div class="eyebrow">Практика недели</div><h1>'+m.h+'</h1><p>Настоящий код вне уроков. Это 15–20 минут, можно сделать сегодня или в выходной.</p><ol class="steps">'+m.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'+(m.url?'<div><a href="'+esc(m.url)+'" target="_blank" rel="noopener">'+esc(m.label||M.missionLabel)+'</a></div>':'')+'<div class="foot"><button class="btn" data-a="mission" data-v="1">'+esc(M.missionDone)+'</button><button class="btn ghost" data-a="mission" data-v="0">Сделаю позже</button></div>';}
  else{var t=st.t;if(!T)initTask(t);
    h+='<div class="eyebrow">'+(R.kind==='lesson'?'':esc(TAGS[t._tag]||'')+' · ')+(st.first?'Задание':'Ещё раз')+'</div><h2>'+t.q+'</h2>';
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
function norm(s){return String(s).trim().toLowerCase().replace(/['‘’‚“”„«»`]/g,'"').replace(/\s+/g,'');}
/* ошибка снимается в повторении и практике; в самом уроке она остаётся видна наблюдателю */
function settle(right){var st=R.q[R.pos],t=st.t;T.done=true;T.right=right;S.seen[t._k]=today();
  if(right){if(st.first)R.ok++;else R.fixed++;if(R.kind!=='lesson'&&S.missed[t._k])delete S.missed[t._k];}
  else{S.missed[t._k]=(S.missed[t._k]||0)+1;R.q.push({k:'task',t:t,first:false});}
  render();}
function check(){var t=R.q[R.pos].t,ok=false;
  if(t.t==='mc')ok=T.sel===t.a;
  if(t.t==='fill'){T.val=$('#fillin').value;var v=norm(T.val);if(!v)return toast('Впиши ответ в пропуск.');ok=t.a.some(function(a){return norm(a)===v;});}
  if(t.t==='order')ok=T.ans.every(function(j,i){return t.lines[j]===t.lines[i];});
  settle(ok);}
function next(){T=null;R.out='';R.pos++;if(R.pos>=R.q.length)finish();else{render();window.scrollTo(0,0);}}
function finish(){var L=R.L,td=today(),first=S.days[td]===undefined,gain,tasks=R.ok+R.fixed,perfect=R.fixed===0&&tasks>0;
  if(R.kind==='review'){gain=tasks*3;S.reviews++;}
  else if(R.kind==='practice'){gain=R.ok*5+R.fixed*2;S.prac[R.sec]=(S.prac[R.sec]||0)+1;}
  else if(!R.isNew)gain=5;else gain=R.ok*10+R.fixed*5+(L.boss?50:20);
  if(R.mission){gain+=30;S.missions[L.id]=1;}
  S.xp+=gain;S.days[td]=(S.days[td]||0)+gain;
  if(R.isNew&&R.kind==='lesson'){S.done[L.id]={d:td,p:perfect?1:0};if(perfect)S.perfect++;if(S.newDay!==td){S.newDay=td;S.newN=0;}S.newN++;}
  var s=streak(),fz=false;if(s>S.best)S.best=s;if(first&&s>0&&s%7===0&&S.freezes<2){S.freezes++;fz=true;}
  var kx=R.isNew&&R.kind==='lesson'?(C.concepts||[]).filter(function(k){return k.after===L.id;}).length:0;
  save();RES={gain:gain,ok:R.ok,tasks:tasks,streak:s,first:first,fz:fz,title:L.title,kind:R.kind,sec:R.sec,isNew:R.isNew,perfect:perfect,terms:(R.isNew&&R.kind==='lesson'&&L.terms)?L.terms.length:0,kx:kx};R=null;view='result';render();window.scrollTo(0,0);}
function vResult(){var r=RES,lv=level(),ni=nextIdx(),more=ni>=0&&newToday()<2;
  var head=r.kind==='review'?'Повторение сделано':r.kind==='practice'?'Тренировка сделана':r.isNew?'День закрыт':'Повторено';
  var line=r.first?'Сегодняшний удар пульса записан. Серия: '+r.streak+' '+plural(r.streak,'день','дня','дней')+'.':'Серия: '+r.streak+' '+plural(r.streak,'день','дня','дней')+'.';
  var opened=[];if(r.terms)opened.push('терминов: '+r.terms);if(r.kx)opened.push('карточек кода: '+r.kx);
  return '<section class="result"><svg class="ecg" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 H90 Q100 42 110 55 H128 L138 64 L152 8 L166 78 L176 55 H196 Q214 34 232 55 H400"/></svg><div><div class="eyebrow">'+esc(r.title)+'</div><h1>'+head+'</h1><p style="margin:8px 0 0">'+line+(r.fz?' За 7 дней подряд ты получила заморозку.':'')+'</p></div>'+
  '<div class="stats"><div class="stat"><b class="num">+'+r.gain+'</b><span class="small muted">XP</span></div><div class="stat"><b class="num">'+r.ok+' / '+r.tasks+'</b><span class="small muted">с первой попытки</span></div><div class="stat"><b class="num">'+r.streak+'</b><span class="small muted">'+plural(r.streak,'день подряд','дня подряд','дней подряд')+'</span></div></div>'+
  '<div class="card"><div class="row small" style="justify-content:space-between"><span><b>Уровень '+(lv.i+1)+'.</b> '+lv.name+'</span><span class="muted num">'+S.xp+(lv.to?' / '+lv.to:'')+' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:'+lvPct()+'%"></i></div>'+(opened.length?'<p class="small" style="margin:10px 0 0">В словаре открыто: '+opened.join(', ')+'.</p>':'')+(r.perfect&&r.kind==='lesson'?'<p class="small" style="margin:6px 0 0">Ни одной ошибки.</p>':'')+'</div>'+
  '<div class="foot"><button class="btn" data-a="home">'+(BACK==='path'?'На главную':'Назад')+'</button>'+(r.kind==='practice'?'<button class="btn ghost" data-a="prac" data-v="'+esc(r.sec)+'">Ещё тренировка</button>':(more&&r.kind==='lesson'?'<button class="btn ghost" data-a="open" data-i="'+ni+'">Ещё один урок</button>':''))+'</div><p class="small muted" style="margin:0">Завтра ждёт '+(ni>=0?'день '+(ni+1)+': '+esc(ALL[ni].title):needTrack()?'выбор трека на главной':'повторение')+'.</p></section>';}

/* ---------- наставник ---------- */
var tutorOn=false, sampleFn=null;
function initTutor(){if(!window.claude||!window.claude.use)return;window.claude.use('sample').then(function(s){if(s){sampleFn=s;tutorOn=true;}}).catch(function(){});}
function askTutor(){var st=R&&R.q[R.pos];if(!st||!sampleFn||!T)return;var t=st.t,mine=T;mine.tutor='Думаю…';render();
  var body='Вопрос: '+t.q.replace(/<[^>]+>/g,'')+(t.code?'\nКод:\n'+t.code:'')+(t.o?'\nПравильный ответ: '+t.o[t.a].replace(/<[^>]+>/g,''):'')+(t.lines?'\nПравильный порядок:\n'+t.lines.join('\n'):'')+(t.a&&t.t==='fill'?'\nПравильный ответ: '+t.a[0]:'')+'\nКраткое пояснение из урока: '+t.e.replace(/<[^>]+>/g,'');
  sampleFn(M.tutor+'\n\n'+body,{modelTier:'quick',onText:function(o){if(T===mine){mine.tutor=o.text;var el=$('.tutor');if(el)el.textContent=o.text;}}})
  .then(function(r){if(T===mine){mine.tutor=r.text||mine.tutor;render();}},function(e){if(e&&e.code==='not_granted')tutorOn=false;if(T===mine){mine.tutor='Наставник сейчас недоступен. Попробуй позже.';render();}});}

/* ---------- обучение при первом запуске ---------- */
var TOURQ=false, TOUR=-1;
var TOURS_L=[
  [null,'👋','Пульс данных обновился','Курс тот же, весь прогресс на месте. Покажу, что нового, — это 30 секунд.'],
  ['.todayc','📅','Сегодня — один шаг','На главной только сегодняшний урок. Нажала, прошла — пульс записан. Список всех недель ниже.'],
  ['#tabs [data-v="practice"]','🏋️','Практика','Свободная тренировка по темам пройденных уроков. Сначала задания, где были ошибки.'],
  ['#tabs [data-v="notes"]','📒','Шпаргалки','Python, pandas, SQL, графики, тесты, метрики, FHIR, MDR — короткие справки, когда пишешь код или читаешь вакансию.'],
  ['#tabs [data-v="glossary"]','📖','Словарь из двух частей','«Термины» на трёх языках и «Программирование»: раскрывающиеся карточки — переменные, списки, функции — с примером и типичной ошибкой.'],
  ['#tabs [data-v="sandbox"]','🐍','Код','Python прямо в браузере. Примеры из словаря и шпаргалок открываются здесь одной кнопкой.'],
  ['#app .hdr .mebtn','👤','Профиль','Нажми на аватар: прогресс, награды, пульс за 14 дней, тема, аватар, напоминания и смена пароля.'],
  [null,'💡','Главный совет','15 минут каждый день лучше, чем два часа раз в неделю. Включи напоминание — и приложение само позовёт.']];
function tours(){if(M.tour==='legacy')return TOURS_L;var t=[[null,'👋',M.brand,'Покажу, как здесь всё устроено, — это 30 секунд.'],TOURS_L[1],TOURS_L[2]];
  if(notes().length)t.push(['#tabs [data-v="notes"]','📒','Шпаргалки','Короткие справки по темам курса: открывай, когда нужно быстро вспомнить.']);
  t.push(['#tabs [data-v="glossary"]','📖','Словарь','Термины и карточки понятий открываются по мере прохождения уроков.']);
  if(sandOn())t.push(TOURS_L[5]);
  return t.concat([TOURS_L[6],TOURS_L[7]]);}
function vTour(){if(TOUR<0)return '';var x=tours()[TOUR],last=TOUR===tours().length-1,spot=x[0]&&document.querySelector(x[0]);
  return '<div class="tour'+(spot?' spot':'')+'" role="dialog" aria-modal="true" aria-labelledby="tourh">'+(spot?'<div class="hole"></div>':'')+'<div class="tourbox">'+(spot?'<span class="tarr"></span>':'')+'<div class="tourico" aria-hidden="true">'+x[1]+'</div><h2 id="tourh">'+esc(x[2])+'</h2><p>'+esc(x[3])+'</p>'+
    '<div class="tourdots">'+tours().map(function(_,i){return '<i class="'+(i===TOUR?'on':'')+'"></i>';}).join('')+'</div>'+
    (TOURQ?'<div class="tourq"><p>Точно пропустить? Это всего 30 секунд.</p><div class="foot"><button class="btn" data-a="tourcont">Продолжить</button><button class="linkbtn" data-a="tourskip">Всё равно пропустить</button></div></div>':
    '<div class="foot">'+(last?'':'<button class="linkbtn" data-a="tourask">Пропустить</button>')+'<button class="btn" data-a="tournext">'+(last?'Начать':'Дальше')+'</button></div>')+'</div></div>';}
function placeTour(){var box=$('.tour.spot');if(!box)return;var el=document.querySelector(tours()[TOUR][0]);if(!el)return;
  var r=el.getBoundingClientRect(),vh=window.innerHeight,vw=document.documentElement.clientWidth||window.innerWidth,pad=6,hole=box.querySelector('.hole'),tip=box.querySelector('.tourbox'),arr=box.querySelector('.tarr');
  hole.style.left=(r.left-pad)+'px';hole.style.top=(r.top-pad)+'px';hole.style.width=(r.width+pad*2)+'px';hole.style.height=(r.height+pad*2)+'px';
  var w=Math.min(360,vw-24);tip.style.width=w+'px';var cx=r.left+r.width/2,left=Math.max(12,Math.min(vw-w-12,cx-w/2));tip.style.left=left+'px';
  arr.style.left=Math.max(16,Math.min(w-28,cx-left-8))+'px';
  var above=r.top-pad-26,below=vh-r.bottom-pad-26;
  if(above>below){tip.style.top='auto';tip.style.bottom=(vh-r.top+pad+14)+'px';tip.style.maxHeight=above+'px';arr.className='tarr down';}
  else{tip.style.bottom='auto';tip.style.top=(r.bottom+pad+14)+'px';tip.style.maxHeight=below+'px';arr.className='tarr up';}
  tip.style.overflow='';if(tip.scrollHeight>tip.clientHeight+2){tip.style.overflow='auto';arr.style.display='none';}else arr.style.display='';}
window.addEventListener('resize',placeTour);window.addEventListener('scroll',placeTour,{passive:true});
function maybeTour(){if(!S.tour&&TOUR<0&&!OWNER&&ALL.length&&VIEWS.indexOf(view)>=0&&view!=='watch'){if(view!=='path'){view='path';try{history.replaceState(null,'','#path');}catch(e){}}TOUR=0;}}

/* ---------- отрисовка и события ---------- */
function render(){rebuild();if(view==='sandbox'&&!sandOn())view='path';maybeTour();var a=$('#app'),tabs=$('#tabs'),inRun=view==='run'||view==='result'||view==='login'||view==='boot'||view==='nocourse';tabs.hidden=inRun;tabs.style.display=inRun?'none':'';
  a.innerHTML=view==='nocourse'?vNoCourse():view==='login'?vLogin():view==='boot'?vBoot():view==='run'?vRun():view==='result'?vResult():view==='practice'?vPractice():view==='notes'?vNotes():view==='note'?vNote():view==='glossary'?vGloss():view==='sandbox'?vSand():view==='progress'?vProg():view==='watch'?vWatch():vPath();
  var wt=$('#watchtab');if(wt)wt.hidden=!OWNER;var sbt=$('#sandtab');if(sbt)sbt.hidden=!sandOn();
  if(!inRun)tabs.querySelectorAll('button').forEach(function(b){if(b.dataset.v===view||(view==='note'&&b.dataset.v==='notes'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(view==='glossary'&&GQ)gFilter();
  var old=$('.tour');if(old)old.remove();
  if(TOUR>=0){var tg=tours()[TOUR][0]&&document.querySelector(tours()[TOUR][0]);if(tg&&tg.closest('#app'))window.scrollBy(0,tg.getBoundingClientRect().top-80);document.body.insertAdjacentHTML('beforeend',vTour());placeTour();}
  var f=$('#fillin');if(f&&!f.disabled)f.focus({preventScroll:true});}
var resetArmed=false, impArmed=false;
var A={
  tab:function(el){view=el.dataset.v;try{location.hash=view;}catch(e){}render();window.scrollTo(0,0);},
  open:function(el){if(el.getAttribute('aria-disabled'))return toast('Этот день откроется после предыдущего.');openLesson(+el.dataset.i);},
  prac:function(el){if(el.getAttribute('aria-disabled'))return toast('Тема откроется после первого урока по ней.');openPractice(el.dataset.v);},
  review:openReview, next:next, check:check,
  home:backOut,
  quit:function(){backOut();toast('Урок не засчитан. Его можно начать заново.');},
  sel:function(el){if(T.done)return;T.sel=+el.dataset.j;render();},
  pick:function(el){if(T.done)return;T.ans.push(+el.dataset.j);render();},
  unpick:function(el){if(T.done)return;T.ans=T.ans.filter(function(j){return j!==+el.dataset.j;});render();},
  ml:function(el){T.l=+el.dataset.j;T.bad=null;render();},
  mr:function(el){if(T.l<0)return toast('Сначала выбери слева.');var j=+el.dataset.j,st=R.q[R.pos],t=st.t;
    if(j===T.l){T.ok[j]=1;T.l=-1;T.bad=null;if(Object.keys(T.ok).length===t.pairs.length){var clean=T.err===0;T.done=true;T.right=true;S.seen[t._k]=today();if(clean&&st.first)R.ok++;else R.fixed++;if(!clean)S.missed[t._k]=(S.missed[t._k]||0)+1;else if(R.kind!=='lesson')delete S.missed[t._k];}}
    else{T.err++;T.bad=j;}render();},
  mission:function(el){R.mission=el.dataset.v==='1';next();},
  logout:function(){if(!SB)return;try{history.replaceState(null,'','#path');}catch(e){}try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('puls-course-v1')===0)localStorage.removeItem(k);});localStorage.removeItem(CATKEY);}catch(e){}CAT=[];setCourse({weeks:[],roadmap:[]});presStop();SB.auth.signOut({scope:'local'}).then(function(){},function(){});onSession(null);},
  retry:function(){view='boot';render();SB.auth.getSession().then(function(r){ME=null;onSession(r&&r.data&&r.data.session);});},
  track:function(el){var v=el.dataset.v;if(trackList().indexOf(v)<0)return;S.track=v;save();rebuild();view='path';try{location.hash='path';}catch(e){}render();window.scrollTo(0,0);toast('Трек: '+trackName(v)+'. Следующий урок уже ждёт.');},
  runhere:runHere, run:runPy, tutor:askTutor,
  course:function(el){switchCourse(el.dataset.v);},
  courses:function(){view='progress';try{location.hash='progress';}catch(e){}render();var c=document.getElementById('courses');if(c)c.scrollIntoView({block:'center'});},
  copen:function(){var c=CAT.filter(function(x){return x.id===CUR;})[0];if(!c||!SB)return;var v=!c.open;
    SB.from('course_content').update({open:v}).eq('id',CUR).then(function(r){if(authErr(r))return sessionLost();if(r.error)return toast('Не получилось: '+r.error.message);c.open=v;loadCatalog().then(function(){render();});toast(v?'Курс открыт всем вошедшим.':'Курс закрыт: его видят только ученики из списка.');});},
  revoke:function(el){var u=el.dataset.v;if(!SB)return;SB.from('course_access').delete().eq('user_id',u).eq('course_id',CUR).then(function(r){if(authErr(r))return sessionLost();if(r.error)return toast('Не получилось: '+r.error.message);toast('Доступ закрыт.');loadWatch();});},
  tosand:function(el){sandSrc=el.dataset.src;sandOut='';view='sandbox';try{location.hash='sandbox';}catch(e){}render();window.scrollTo(0,0);},
  note:function(el){openNote(el.dataset.v);},
  nback:function(){try{if(history.state&&history.state.pulsNote){history.back();return;}}catch(e){}closeNote();},
  ncat:function(el){NCAT=el.dataset.v;document.querySelectorAll('.ncats .chip').forEach(function(c){var on=c.dataset.v===NCAT;c.classList.toggle('on',on);c.setAttribute('aria-selected',on);});nFilter();},
  gtab:function(el){GT=el.dataset.v;GQ='';render();},
  theme:function(el){S.theme=el.dataset.v;applyTheme(S.theme);save();render();},
  avatar:function(el){S.avatar=el.dataset.v;save();render();},
  tour:function(){TOURQ=false;TOUR=0;view='path';try{location.hash='path';}catch(e){}render();},
  tournext:function(){TOURQ=false;if(TOUR<tours().length-1){TOUR++;render();}else{TOUR=-1;S.tour=1;S.tourDone=1;save();render();toast('Готово! Хорошей учёбы.');}},
  tourask:function(){TOURQ=true;render();},
  tourcont:function(){TOURQ=false;render();},
  tourskip:function(){TOURQ=false;TOUR=-1;S.tour=1;save();render();},
  remon:function(){var el=$('#remh');pushOn(el?+el.value:remH());},
  remoff:function(){pushOff();},
  remlater:function(){S.remindAsk=1;save();render();},
  install:function(){if(!INSTALL_EVT)return;var e=INSTALL_EVT;e.prompt();(e.userChoice||Promise.resolve()).then(function(){INSTALL_EVT=null;render();});},
  wsort:function(el){W.sort=el.dataset.v;render();},
  wopen:function(el){var id=el.dataset.v;W.open[id]=!W.open[id];render();},
  addcopy:function(){var ta=$('#amsg');ta.select();try{navigator.clipboard.writeText(ta.value).then(function(){toast('Скопировано.');},function(){toast('Выдели текст и скопируй вручную.');});}catch(e){toast('Выдели текст и скопируй вручную.');}},
  exp:function(){var code=btoa(unescape(encodeURIComponent(JSON.stringify(S)))),ta=$('#code');ta.value=code;ta.select();
    try{navigator.clipboard.writeText(code).then(function(){toast('Код скопирован. Сохрани его в надёжном месте.');},function(){toast('Код в поле ниже. Выдели его и скопируй вручную.');});}catch(e){toast('Код в поле ниже. Выдели его и скопируй вручную.');}},
  imp:function(){var v=$('#code').value.replace(/\s+/g,''),o=null;if(!v)return toast('Сначала вставь код в поле.');
    try{o=JSON.parse(decodeURIComponent(escape(atob(v))));}catch(e){}
    if(!o||typeof o.xp!=='number'||typeof o.done!=='object'||typeof o.days!=='object')return toast('Код не читается. Проверь, что он вставлен целиком.');
    if(o.xp<S.xp&&!impArmed){impArmed=true;setTimeout(function(){impArmed=false;},6000);return toast('В коде меньше XP, чем сейчас ('+o.xp+' против '+S.xp+'). Нажми ещё раз, чтобы заменить.');}
    impArmed=false;var uid=S.uid,em=S.email;S=fix(o);if(uid){S.uid=uid;S.email=em;}save();render();toast('Прогресс восстановлен: '+S.xp+' XP.');},
  name:function(){S.name=$('#nm').value.trim().slice(0,30);save();render();toast('Сохранено.');},
  reset:function(el){if(!resetArmed){resetArmed=true;el.textContent='Нажми ещё раз, чтобы стереть всё';setTimeout(function(){resetArmed=false;},5000);return;}resetArmed=false;var n=S.name,av=S.avatar,th=S.theme,uid=S.uid,em=S.email;S=def();S.name=n;S.avatar=av;S.theme=th;S.tour=1;S.tourDone=1;if(uid){S.uid=uid;S.email=em;}save();render();toast('Прогресс сброшен.');}
};
document.addEventListener('click',function(e){var el=e.target.closest('[data-a]');if(!el||el.disabled)return;var f=A[el.dataset.a];if(f)f(el);});
document.addEventListener('change',function(e){if(e.target.id==='upf'&&e.target.files&&e.target.files[0]){doUpload(e.target.files[0]);e.target.value='';return;}if(e.target.dataset&&e.target.dataset.ch==='remh')pushHour(+e.target.value);});
document.addEventListener('submit',function(e){if(e.target.id==='lf'){e.preventDefault();doLogin();}if(e.target.id==='af'){e.preventDefault();doAdd();}if(e.target.id==='pwf'){e.preventDefault();doPw();}});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='fillin'){e.preventDefault();check();}});
document.addEventListener('input',function(e){var id=e.target.id;if(id==='ucid')upFill();else if(id==='src')sandSrc=e.target.value;else if(id==='fillin'&&T)T.val=e.target.value;else if(id==='nq'){NQ=e.target.value.trim();nFilter();}else if(id==='gq'){GQ=e.target.value.trim();gFilter();}});
/* открытая карточка кода: учитываем для наблюдателя */
document.addEventListener('toggle',function(e){var d=e.target;if(d&&d.classList&&d.classList.contains('cx')&&d.open&&d.dataset.id){S.cx[d.dataset.id]=(S.cx[d.dataset.id]||0)+1;save();}},true);

window.PULS_APP={state:function(){return S;},view:function(){return view;}};
applyFreezes();view=cfgOk()?'boot':(ALL.length?fromHash():'nocourse');render();initCloud();initTutor();
})();
