/* Cozy Life OS – app chính (giao diện, Chibi, check-in, giấc ngủ, sao lưu) */
(async()=>{
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=iso=>{const d=new Date(iso);return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+hm(d)};
const daysSince=iso=>Math.floor((Date.now()-new Date(iso))/864e5);

const MOODS=[['happy','🥰','Yêu đời'],['calm','🙂','Bình thường'],['sleepy','😪','Buồn ngủ'],['stress','😵‍💫','Căng thẳng'],['sad','🥺','Buồn']];
const WEATHER=[['sun','☀️','Nắng'],['rain','🌧️','Mưa'],['cold','🧣','Lạnh'],['humid','🌫️','Nồm ẩm'],['hot','🥵','Nóng']];
const BODY=[['ok','💪','Khỏe'],['tired','🫠','Mệt'],['sick','🤒','Ốm'],['sore','🦵','Đau nhức cơ']];
const PROMPTS=['Điều gì làm bạn cười hôm nay?','Hôm nay bạn tự hào về việc gì?','Một điều nhỏ bạn biết ơn?','Nếu được làm lại, bạn muốn đổi gì?','Hôm nay ai làm bạn thấy ấm lòng?'];
const PRAISE=['Hôm nay {n} giỏi lắm đó!','{n} ơi, uống ngụm nước đi nè 💧','Mình luôn ở đây cổ vũ {n}!','Từng bước nhỏ thôi, {n} làm được mà ✨','{n} cười lên xinh lắm!'];
const HAIRC=['#2B2223','#4A3530','#6B4A3A','#C98B6B','#F4A7B9'];

const LOOKDEF0={face:'auto',blush:'soft',lip:'#E8848D',lash:'natural',freckles:false,eyewear:'none',head:'none',ear:'stud',watch:true,bag:true};
const DEF=()=>({name:'bạn',hair:'straight',hairColor:'#2B2223',fav:'pink',autoSwap:true,look:Object.assign({},LOOKDEF0),nightWear:'pj',roam:true,bedTarget:'23:00',days:{},sleeps:[],pendingBed:null,sample:false,v2:true,seasonWear:true,theme:'auto',lastBackup:null,hideInstall:false,createdAt:new Date().toISOString()});

/* ---------- Đọc dữ liệu từ máy ---------- */
let S=DEF();
function normalize(){
  if(!S.look){S.look=Object.assign({},LOOKDEF0);if(S.acc){S.look.ear=S.acc.ear===false?'none':'stud';S.look.watch=S.acc.watch!==false;S.look.bag=S.acc.bag!==false}}
  S.look=Object.assign({},LOOKDEF0,S.look);
  if(!S.nightWear)S.nightWear='pj';
  if(S.seasonWear===undefined)S.seasonWear=true;
  if(!S.theme)S.theme='auto';
  if(!S.days||typeof S.days!=='object')S.days={};
  if(!Array.isArray(S.sleeps))S.sleeps=[];
  if(!S.v2){const d=DEF();Object.assign(S,{hair:d.hair,hairColor:d.hairColor,fav:d.fav,autoSwap:true,v2:true})}
}
const loaded=await CozyDB.loadState();
if(loaded)S=Object.assign(S,loaded);
normalize();
let persistState='unknown';
CozyDB.persist().then(r=>{persistState=r;if(tab==='set')render()});
/* Bản chụp tự động: mỗi ngày giữ lại một bản của dữ liệu (7 ngày gần nhất) */
const hasData=st=>Object.keys(st.days||{}).length||(st.sleeps||[]).length;
if(loaded&&hasData(S)){CozyDB.listSnapshots().then(l=>{const k='auto-'+dk(new Date());if(!l.some(s=>s.key===k))CozyDB.putSnapshot(k,S,'Tự động')}).catch(()=>{})}

let saveT;
const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>CozyDB.saveState(S),250)};
const flush=()=>{clearTimeout(saveT);return CozyDB.saveState(S)};
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
addEventListener('pagehide',flush);

let tab='today',demoNight=false;
const today=()=>{const k=dk(new Date());return S.days[k]||(S.days[k]={top3:[{t:'',d:false},{t:'',d:false},{t:'',d:false}],water:0,candies:[],checkin:null,evening:null})};

function isXmas(){if(S.theme==='xmas')return true;if(S.theme==='none')return false;const n=new Date(),m=n.getMonth()+1,d=n.getDate();return (m===11&&d>=15)||m===12||(m===1&&d<=6)}
function daysToXmas(){const n=new Date();n.setHours(0,0,0,0);let x=new Date(n.getFullYear(),11,25);if(n>x)x=new Date(n.getFullYear()+1,11,25);return Math.round((x-n)/864e5)}
function xmasLabel(){const d=daysToXmas(),n=new Date();if(n.getMonth()===11&&n.getDate()===25)return '🎄 Giáng sinh an lành!';if(n.getMonth()===11&&n.getDate()>25||n.getMonth()===0)return '🎆 Chúc mừng năm mới!';return '🎄 Còn '+d+' ngày đến Giáng sinh'}
function isNight(){if(demoNight)return true;const n=new Date(),[h,m]=S.bedTarget.split(':').map(Number);const mins=n.getHours()*60+n.getMinutes(),t=h*60+m;return mins>=t-30||mins<240}
function state(){const d=today(),c=d.checkin||{};let mood=c.mood||'calm';if(c.body==='sick')mood='sick';
  let outfit=S.autoSwap&&(isNight()||c.body==='sick')?S.nightWear:S.autoSwap&&c.body==='sore'?'gym':S.fav;
  return {mood,outfit}}

const OUTFITS={
 pink:{n:'Váy hồng bí',d:'Cổ yếm, chân váy phồng',c:'#F4B3A3',k:'#E3988A',shoe:'#FFFFFF'},
 beige:{n:'Cúp ngực nhún be',d:'Thân nhún bèo, tông nude',c:'#E9D5BC',k:'#D2B996',shoe:'#E9D5BC'},
 lace:{n:'Hai dây ren trắng',d:'Áo ren, chân váy tối màu',c:'#F7F2EB',k:'#DCCFBF',shoe:'#3B3740'},
 fluffy:{n:'Len lông đen',d:'Cổ yếm cao, lông xù',c:'#2B2729',k:'#45403F',shoe:'#2B2729'},
 brocade:{n:'Gấm hoa',d:'Cúp ngực thêu hoa nhí',c:'#ECE1CC',k:'#D8C7A8',shoe:'#F2E6D4'},
 dino:{n:'Khủng long',d:'Đồ bộ liền mũ có gai',c:'#A8DDB0',k:'#7CC48A',b:'#FFF3C4',kig:1},
 bear:{n:'Gấu bắc cực',d:'Đồ bộ lông trắng tai tròn',c:'#F7F9FC',k:'#D5DDE8',b:'#FFFFFF',kig:1},
 bunny:{n:'Thỏ hồng',d:'Đồ bộ tai dài',c:'#FFD9E3',k:'#F5B3C5',b:'#FFF4F7',kig:1},
 cat:{n:'Mèo cam',d:'Đồ bộ tai nhọn, có vằn',c:'#FFD8A8',k:'#F0B572',b:'#FFF4E3',kig:1},
 noel:{n:'Váy Noel',d:'Nhung đỏ viền lông trắng',c:'#D94A4F',k:'#B8353B',shoe:'#3E3233'},
 sweater:{n:'Áo len Giáng sinh',d:'Len xanh họa tiết, chân váy đỏ',c:'#6FAF8A',k:'#4F8E6B',shoe:'#B73C47'},
 reindeer:{n:'Tuần lộc',d:'Đồ bộ có gạc và mũi đỏ',c:'#C99D72',k:'#A67B52',b:'#F3E1C8',kig:1},
 pj:{n:'Pijama chấm bi',d:'Đồ ngủ cơ bản',c:'#CDBEF5',k:'#B9A6EE',shoe:'#B9A6EE'},
 gym:{n:'Đồ tập',d:'Tự mặc khi đau nhức cơ',c:'#8FD9B6',k:'#6FC59F',shoe:'#FFFFFF',auto:1}};
const DAY=['pink','beige','lace','fluffy','brocade','noel','sweater'],KIG=['dino','bear','bunny','cat'],XMAS=['noel','sweater','reindeer'],NIGHT=['pj','dino','bear','bunny','cat','reindeer'];
const LIPS=[['#E8848D','Hồng nhạt'],['#F08A6E','Cam đào'],['#D9534F','Đỏ cam'],['#B8323F','Đỏ ruby'],['#C9897A','Nude']];
const FACES=[['auto','🎭','Theo tâm trạng'],['smile','🙂','Mỉm cười'],['happy','😆','Cười tươi'],['wink','😉','Nháy mắt'],['pout','😗','Phồng má'],['cool','😌','Sang chảnh']];
const LOOKDEF=LOOKDEF0;
let GID=0;
function shade(h,p){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=p<0?0:255,a=Math.abs(p);r=Math.round(r+(t-r)*a);g=Math.round(g+(t-g)*a);b=Math.round(b+(t-b)*a);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function outfitSvg(k,cf){const o=OUTFITS[k]||OUTFITS.pink,c=cf||o.c,dk=o.k;
  const bod=`<path d="M70 154Q100 147 130 154L128 188Q100 194 72 188Z" fill="${c}"/>`;
  const aline=f=>`<path d="M72 186L128 186L138 209Q100 217 62 209Z" fill="${f}"/>`;
  if(o.kig)return `<path d="M68 146Q100 136 132 146L140 205Q100 215 60 205Z" fill="${c}" stroke="${dk}" stroke-width="1.5"/><ellipse cx="100" cy="180" rx="21" ry="23" fill="${o.b}"/>`+(k==='dino'?`<path d="M84 172H116M82 182H118M86 192H114" stroke="${dk}" stroke-width="2" opacity=".5"/>`:k==='cat'?`<path d="M70 160l10 3M70 172l9 2M130 160l-10 3M130 172l-9 2" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`:'');
  if(k==='noel')return bod+aline(c)+`<rect x="67" y="149" width="66" height="10" rx="5" fill="#fff"/><path d="M60 206Q100 215 140 206L142 213Q100 223 58 213Z" fill="#fff"/><rect x="71" y="183" width="58" height="5" fill="#3E3233"/><rect x="95.5" y="181" width="9" height="9" rx="1.5" fill="none" stroke="#E0B04A" stroke-width="2"/>`;
  if(k==='sweater')return `<path d="M68 146Q100 136 132 146L134 190Q100 196 66 190Z" fill="${c}"/><path d="M68 168l6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5" stroke="#fff" stroke-width="2.5" fill="none"/>`+[[78,178],[94,180],[110,178],[124,180],[86,156],[114,156]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${i%2?'#fff':'#E5484D'}"/>`).join('')+`<path d="M80 145Q100 153 120 145" stroke="${dk}" stroke-width="5" fill="none" stroke-linecap="round"/>`+aline('#B73C47');
  if(k==='pink')return bod+`<path d="M72 186Q100 194 128 186Q150 196 141 211Q100 223 59 211Q50 196 72 186Z" fill="${c}"/><path d="M81 193L79 208M93 195L92 213M107 195L108 213M119 193L121 208" stroke="${dk}" stroke-width="2" stroke-linecap="round"/><path d="M72 188Q100 194 128 188" fill="none" stroke="${dk}" stroke-width="2"/>`;
  if(k==='beige')return bod+[160,168,176,184].map(y=>`<path d="M72 ${y}q7-5 14 0t14 0t14 0t14 0" fill="none" stroke="${dk}" stroke-width="2"/>`).join('')+aline('#EFE3D1');
  if(k==='lace')return `<path d="M70 156Q100 150 130 156L128 186Q100 190 72 186Z" fill="${c}"/>`+[74,82,90,98,106,114,122].map(x=>`<circle cx="${x+2}" cy="156" r="4" fill="${c}" stroke="${dk}" stroke-width="1.2"/>`).join('')+[[82,168],[96,174],[110,166],[120,178],[88,180],[104,182]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="${dk}" stroke-width="1.2"/>`).join('')+aline('#3B3740');
  if(k==='fluffy')return `<path d="M72 150Q100 140 128 150L129 188Q100 194 71 188Z" fill="${c}"/>`+[[78,158],[92,152],[108,156],[122,160],[84,172],[100,168],[116,174],[90,184],[110,184],[76,180],[124,180]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.5" fill="${dk}" opacity=".8"/>`).join('')+aline('#3E393C');
  if(k==='brocade')return bod+[[80,162,'#F2A7B5'],[96,170,'#9CC7A0'],[112,160,'#F2A7B5'],[122,176,'#9CC7A0'],[86,180,'#9CC7A0'],[104,182,'#F2A7B5']].map(([x,y,f])=>`<circle cx="${x}" cy="${y}" r="3.2" fill="${f}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('')+aline('#F7F0E4');
  if(k==='gym')return `<path d="M72 152Q100 146 128 152L134 188L66 188Z" fill="${c}"/><rect x="66" y="184" width="68" height="22" rx="8" fill="#7C6BA8"/>`;
  return `<path d="M70 142Q100 134 130 142L146 204Q100 214 54 204Z" fill="${c}"/><circle cx="86" cy="168" r="4" fill="#fff" opacity=".8"/><circle cx="112" cy="182" r="4" fill="#fff" opacity=".8"/><circle cx="98" cy="196" r="4" fill="#fff" opacity=".8"/><circle cx="120" cy="158" r="4" fill="#fff" opacity=".8"/>`}
function hoodBack(k,cf){const o=OUTFITS[k],c=cf||o.c,dk=o.k;let e='';
  if(k==='bear')e=`<circle cx="52" cy="42" r="17" fill="${c}" stroke="${dk}" stroke-width="2"/><circle cx="148" cy="42" r="17" fill="${c}" stroke="${dk}" stroke-width="2"/><circle cx="52" cy="42" r="8" fill="#FFD3DC"/><circle cx="148" cy="42" r="8" fill="#FFD3DC"/>`;
  if(k==='bunny')e=`<ellipse cx="74" cy="16" rx="12" ry="32" fill="${c}" transform="rotate(-12 74 16)"/><ellipse cx="126" cy="16" rx="12" ry="32" fill="${c}" transform="rotate(12 126 16)"/><ellipse cx="74" cy="18" rx="6" ry="22" fill="#FFF4F7" transform="rotate(-12 74 18)"/><ellipse cx="126" cy="18" rx="6" ry="22" fill="#FFF4F7" transform="rotate(12 126 18)"/>`;
  if(k==='cat')e=`<path d="M44 52L50 14L80 34Z M156 52L150 14L120 34Z" fill="${c}"/><path d="M52 40L54 24L68 34Z M148 40L146 24L132 34Z" fill="#FFC2C2"/>`;
  if(k==='reindeer')e=`<path d="M66 44L56 12M60 28L46 22M62 36L50 38M134 44L144 12M140 28L154 22M138 36L150 38" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="38" cy="74" rx="8" ry="15" fill="${c}" transform="rotate(-50 38 74)"/><ellipse cx="162" cy="74" rx="8" ry="15" fill="${c}" transform="rotate(50 162 74)"/>`;
  if(k==='dino')e=[[48,52],[60,34],[78,24],[100,20],[122,24],[140,34],[152,52]].map(([x,y],i)=>`<path d="M${x-9} ${y+8}L${x} ${y-10}L${x+9} ${y+8}Z" fill="${dk}" transform="rotate(${(i-3)*16} ${x} ${y})"/>`).join('');
  return e+`<circle cx="100" cy="92" r="67" fill="${c}" stroke="${dk}" stroke-width="2"/>`+(k==='dino'?`<circle cx="82" cy="33" r="5" fill="#fff"/><circle cx="118" cy="33" r="5" fill="#fff"/><circle cx="83" cy="34" r="2.6" fill="#3E3233"/><circle cx="119" cy="34" r="2.6" fill="#3E3233"/>`:k==='reindeer'?`<circle cx="84" cy="34" r="4.5" fill="#fff"/><circle cx="116" cy="34" r="4.5" fill="#fff"/><circle cx="85" cy="35" r="2.4" fill="#3E3233"/><circle cx="117" cy="35" r="2.4" fill="#3E3233"/><circle cx="100" cy="40" r="6" fill="#E5484D"/><circle cx="98" cy="38" r="1.8" fill="#fff" opacity=".7"/>`:k==='cat'?`<path d="M90 28l2 10M100 26v11M110 28l-2 10" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`:'')}
function tail(k){const o=OUTFITS[k];if(k==='dino')return `<path d="M128 192Q160 196 176 212Q150 214 126 206Z" fill="${o.c}" stroke="${o.k}" stroke-width="1.5"/><path d="M146 194l5-7 3 9M160 200l6-6 2 9" fill="${o.k}"/>`;
  if(k==='cat')return `<path d="M132 198Q166 200 160 176Q156 166 164 160" fill="none" stroke="${o.c}" stroke-width="9" stroke-linecap="round"/>`;
  if(k==='bunny'||k==='bear'||k==='reindeer')return `<circle cx="140" cy="200" r="9" fill="${o.k==='#F5B3C5'?'#FFF4F7':'#fff'}" stroke="${o.k}" stroke-width="1.5"/>`;return ''}
function eye(x,t,L,ef){const d=x<100?-1:1,ink='#3E3233',fi=ef||ink,hl2=ef?`<circle cx="${x-2.6}" cy="108.6" r="1.3" fill="#fff" opacity=".85"/>`:'';
  const lash=(y)=>`<path d="M${x-7.5} ${y}Q${x} ${y-5.5} ${x+7.5} ${y-.5}M${x+d*7.5} ${y-(d>0?.5:0)}l${d*3.5} -2.5" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`+(L.lash==='long'?`<path d="M${x+d*4.5} ${y-3.6}l${d*2.2} -3.4M${x+d*.5} ${y-5}l${d*.8} -3.6" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`:'');
  if(t==='open')return `<ellipse cx="${x}" cy="105" rx="6.5" ry="8" fill="${fi}"/><circle cx="${x+2.5}" cy="102" r="2.4" fill="#fff"/>${hl2}`+lash(101);
  if(t==='look')return `<ellipse cx="${x}" cy="108" rx="6" ry="6" fill="${fi}"/><circle cx="${x+2}" cy="106.5" r="1.8" fill="#fff"/>`+lash(103.5);
  if(t==='arc')return `<path d="M${x-9} 106Q${x} 96 ${x+9} 106" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
  if(t==='down')return `<path d="M${x-8} 106Q${x} 110 ${x+8} 106" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  if(t==='cool')return `<ellipse cx="${x}" cy="107" rx="6.5" ry="5.5" fill="${fi}"/><circle cx="${x+2.5}" cy="106" r="1.8" fill="#fff"/><path d="M${x-8} 102.5H${x+8}M${x+d*8} 102.5l${d*3} -2" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`;return ''}
const POSE={cocoa:'mouth',gift:'hold',drink:'mouth',boba:'mouth',yawn:'mouth',tissue:'mouth',read:'hold',phone:'hold',laptop:'hold',teddy:'hold',stretch:'up',dance:'up',wave:'wave'};
const ACTFACE={cocoa:'happy',gift:'happy',snowman:'happy',drink:'happy',boba:'smile',read:'look',phone:'look',laptop:'look',yawn:'yawn',nap:'sleepy',tissue:'squeeze',shiver:'sick',teddy:'sad',dance:'happy',wave:'happy',stretch:'squeeze',breathe:'calmclosed'};
function armsSvg(pose,AF,SK){const arm=(cx,cy,r)=>`<ellipse cx="${cx}" cy="${cy}" rx="9" ry="19" fill="${AF}" transform="rotate(${r} ${cx} ${cy})"/>`,hand=(x,y)=>`<circle cx="${x}" cy="${y}" r="8.5" fill="${SK}"/>`;
  const L=arm(62,168,14)+hand(57,186),Rt=arm(138,168,-14)+hand(144,184);
  if(pose==='hold')return arm(72,166,-38)+arm(128,166,38)+hand(85,178)+hand(115,178);
  if(pose==='mouth')return L+arm(123,143,-49)+hand(111,132);
  if(pose==='up')return arm(58,135,-25)+arm(142,135,25)+hand(50,117)+hand(150,117);
  if(pose==='wave')return L+`<g class="waveArm">${arm(142,135,25)+hand(150,117)}</g>`;
  return L+Rt}
function actItem(a){switch(a){
  case 'drink':return `<g class="sip"><g transform="rotate(-35 113 128)"><rect x="104" y="116" width="17" height="24" rx="4" fill="#E8F7FF" stroke="#9AD2F0" stroke-width="2"/><rect x="106" y="124" width="13" height="14" rx="3" fill="#8FD0F2"/><path d="M107 120h11" stroke="#fff" stroke-width="2" opacity=".8"/></g></g>`;
  case 'boba':return `<g transform="rotate(-12 116 142)"><rect x="106" y="130" width="20" height="26" rx="5" fill="#F5D7B5"/><circle cx="111" cy="150" r="2.4" fill="#5B3A29"/><circle cx="118" cy="152" r="2.4" fill="#5B3A29"/><circle cx="122" cy="147" r="2.4" fill="#5B3A29"/><rect x="105" y="128" width="22" height="4" rx="2" fill="#fff"/></g><path d="M113 130L103 126" stroke="#FF9E9E" stroke-width="3" stroke-linecap="round"/>`;
  case 'tissue':return `<path d="M98 120q8-12 20-2q6 10-5 15q-11 3-15-5z" fill="#fff" stroke="#E3E3EE" stroke-width="1.5"/>`;
  case 'read':return `<path d="M100 162L78 157V183L100 188Z" fill="#FFB3C1"/><path d="M100 162L122 157V183L100 188Z" fill="#FFC9D3"/><path d="M83 163l13 3M83 169l13 3M104 166l13-3M104 172l13-3" stroke="#fff" stroke-width="1.6"/><path d="M100 162V188" stroke="#E58FA2" stroke-width="1.5"/>`;
  case 'phone':return `<rect x="91" y="158" width="18" height="28" rx="4" fill="#3E3233"/><rect x="93" y="161" width="14" height="21" rx="2" fill="#CDEBFF"/><path d="M97 168c0-2 3-2 3 0c0-2 3-2 3 0c0 2-3 4-3 4s-3-2-3-4z" fill="#FF9EB5"/>`;
  case 'laptop':return `<rect x="76" y="160" width="48" height="27" rx="3" fill="#ECE7F2" stroke="#CFC8D8" stroke-width="1.5"/><path d="M97 172c0-2 3-2 3 0c0-2 3-2 3 0c0 2-3 4-3 4s-3-2-3-4z" fill="#FFB3C7"/><path d="M70 187H130L136 197H64Z" fill="#D6CFE0"/>`;
  case 'teddy':return `<circle cx="88" cy="158" r="4.5" fill="#B88C66"/><circle cx="112" cy="158" r="4.5" fill="#B88C66"/><circle cx="100" cy="166" r="11" fill="#C9A27E"/><ellipse cx="100" cy="184" rx="13" ry="11" fill="#C9A27E"/><ellipse cx="100" cy="169" rx="4.5" ry="3.2" fill="#EAD3B8"/><circle cx="96" cy="164" r="1.4" fill="#3E3233"/><circle cx="104" cy="164" r="1.4" fill="#3E3233"/>`;
  case 'shiver':return `<path d="M54 150Q100 132 146 150L152 207Q100 217 48 207Z" fill="#DED2F9" opacity=".96"/><path d="M54 150Q100 132 146 150" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`;
  case 'cocoa':return `<g transform="rotate(-20 114 134)"><rect x="103" y="124" width="21" height="21" rx="4" fill="#E5484D"/><path d="M105 130h17M105 137h17" stroke="#fff" stroke-width="2" opacity=".85"/><path d="M124 128q8 0 8 6.5t-8 6.5" fill="none" stroke="#E5484D" stroke-width="3"/><ellipse cx="113.5" cy="125" rx="9" ry="2.5" fill="#8B5A3C"/></g><g class="steam"><path d="M110 114q-4-5 0-10t0-10M118 116q-4-5 0-10t0-10" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/></g>`;
  case 'gift':return `<rect x="83" y="160" width="34" height="27" rx="3" fill="#E5484D"/><rect x="97" y="160" width="6" height="27" fill="#7FB89A"/><rect x="83" y="169" width="34" height="6" fill="#7FB89A"/><path d="M100 160q-12-12-14-2q2 5 14 2q12-12 14-2q-2 5-14 2" fill="#7FB89A"/>`;
  case 'snowman':return `<circle cx="24" cy="212" r="15" fill="#fff" stroke="#DCE6F2" stroke-width="1.5"/><circle cx="24" cy="187" r="11" fill="#fff" stroke="#DCE6F2" stroke-width="1.5"/><circle cx="20" cy="185" r="1.6" fill="#3E3233"/><circle cx="28" cy="185" r="1.6" fill="#3E3233"/><path d="M24 189l9 2-9 2z" fill="#F29A4A"/><rect x="15" y="174" width="18" height="4" rx="1" fill="#3E3233"/><rect x="18.5" y="163" width="11" height="12" rx="1" fill="#3E3233"/><path d="M14 197q10 5 20 0" stroke="#E5484D" stroke-width="4" fill="none"/><circle cx="24" cy="207" r="1.6" fill="#3E3233"/><circle cx="24" cy="214" r="1.6" fill="#3E3233"/>`;
  case 'nap':return `<ellipse cx="100" cy="214" rx="40" ry="9" fill="#FFE2EA"/>`;
  default:return ''}}
function chibi(o){const hc=o.hairColor||S.hairColor,hair=o.hair||S.hair,L=Object.assign({},LOOKDEF,S.look,o.look||{},{seasonWear:S.seasonWear}),sk='#FFE6D8';
  const k=o.outfit,of=OUTFITS[k]||OUTFITS.pink,kig=!!of.kig,pj=k==='pj';
  const d25=true,u='c'+(++GID);
  const HR=d25?`url(#hr${u})`:hc,SK=d25?`url(#sk${u})`:sk,CL=d25?`url(#cl${u})`:of.c,EF=d25?`url(#ey${u})`:'';
  const defs=d25?`<defs><radialGradient id="sk${u}" cx="45%" cy="36%" r="72%"><stop offset="0" stop-color="#FFF4EC"/><stop offset=".62" stop-color="#FFE4D5"/><stop offset="1" stop-color="#F5C9B6"/></radialGradient><linearGradient id="hr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hc,.16)}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc,-.3)}"/></linearGradient><linearGradient id="cl${u}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(of.c,.2)}"/><stop offset=".55" stop-color="${of.c}"/><stop offset="1" stop-color="${shade(of.c,-.14)}"/></linearGradient><linearGradient id="ey${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C1415"/><stop offset=".55" stop-color="#3B2A29"/><stop offset="1" stop-color="#94675A"/></linearGradient><radialGradient id="bl${u}"><stop offset="0" stop-color="#FF97A6" stop-opacity=".8"/><stop offset="1" stop-color="#FF97A6" stop-opacity="0"/></radialGradient><radialGradient id="gs${u}"><stop offset="0" stop-color="#4A3E3D" stop-opacity=".24"/><stop offset="1" stop-color="#4A3E3D" stop-opacity="0"/></radialGradient></defs>`:'';
  let m=o.act&&ACTFACE[o.act]?ACTFACE[o.act]:o.sleep?'sleep':o.mood==='sick'?'sick':(o.face||L.face)!=='auto'?(o.face||L.face):o.mood==='calm'?'smile':o.mood;
  let back=kig?'':hair==='wavy'?`<path d="M42 92Q40 34 100 34Q160 34 158 92Q167 118 156 140Q169 164 156 186Q163 201 146 205L138 150L62 150L54 205Q37 201 44 186Q31 164 44 140Q33 118 42 92Z" fill="${HR}"/>`
    :hair==='bob'?`<rect x="38" y="36" width="124" height="118" rx="56" fill="${HR}"/>`
    :hair==='buns'?`<circle cx="52" cy="46" r="22" fill="${HR}"/><circle cx="148" cy="46" r="22" fill="${HR}"/><rect x="42" y="40" width="116" height="96" rx="52" fill="${HR}"/>`
    :`<path d="M42 92Q40 34 100 34Q160 34 158 92L161 197Q150 207 138 199L136 150L64 150L62 199Q50 207 39 197Z" fill="${HR}"/>`;
  const front=(hair==='bob'||hair==='buns')?`<path d="M44 94Q44 36 100 36Q156 36 156 94Q142 72 122 68Q110 80 100 74Q90 80 78 68Q58 72 44 94Z" fill="${HR}"/>`
    :`<path d="M44.9 112A58 58 0 1 1 155.1 112Q152 90 136 80Q118 71 100 66Q82 71 64 80Q48 90 44.9 112Z" fill="${HR}"/><path d="M100 38Q98 52 100 66" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>`+(kig?'':`<g class="${d25?'sway':''}"><path d="M45 96Q38 132 50 164Q58 152 59 128Q59 108 53 96Z" fill="${HR}"/><path d="M155 96Q162 132 150 164Q142 152 141 128Q141 108 147 96Z" fill="${HR}"/></g>`);
  const lip=L.lip;let eyes,mouth=`<path d="M94 125Q100 128 106 125Q100 132 94 125Z" fill="${lip}"/>`,extra='',puff=false;
  if(m==='happy'){eyes=eye(80,'arc',L)+eye(120,'arc',L);mouth=`<path d="M92 122Q100 133 108 122Z" fill="${lip}"/>`;extra=`<text x="150" y="70" font-size="18">✨</text>`}
  else if(m==='wink'){eyes=`<g class="blink">${eye(80,'open',L,EF)}</g>`+eye(120,'arc',L);extra=`<text x="140" y="92" font-size="13" fill="#FF9EB5">✦</text>`}
  else if(m==='pout'){eyes=`<g class="blink">${eye(80,'open',L,EF)+eye(120,'open',L,EF)}</g>`;mouth=`<ellipse cx="100" cy="127" rx="3.6" ry="3.2" fill="${lip}"/>`;puff=true}
  else if(m==='cool'){eyes=eye(80,'cool',L,EF)+eye(120,'cool',L,EF);mouth=`<path d="M94 126Q101 129 107 123" fill="none" stroke="${lip}" stroke-width="3" stroke-linecap="round"/>`}
  else if(m==='look'){eyes=eye(80,'look',L,EF)+eye(120,'look',L,EF);if(o.act==='laptop')extra=`<path d="M150 90q6 10 0 14q-6-4 0-14z" fill="#8CCBFF"/>`}
  else if(m==='yawn'){eyes=eye(80,'arc',L)+eye(120,'arc',L);mouth=`<ellipse cx="100" cy="127" rx="6" ry="7.5" fill="#B5545F"/>`;extra=`<path d="M136 96q4 6 0 9q-4-3 0-9z" fill="#8CCBFF"/>`}
  else if(m==='squeeze'){eyes=`<path d="M72 102L86 106L72 110M128 102L114 106L128 110" fill="none" stroke="#3E3233" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;mouth=`<ellipse cx="100" cy="127" rx="3.6" ry="3.4" fill="${lip}"/>`}
  else if(m==='calmclosed'){eyes=eye(80,'down',L)+eye(120,'down',L)}
  else if(m==='sleepy'||m==='sleep'){eyes=eye(80,'down',L)+eye(120,'down',L);mouth=`<ellipse cx="100" cy="126" rx="3.5" ry="3" fill="${lip}"/>`;extra=`<g class="zz"><text x="146" y="60" font-size="22" fill="#9F8FE0" font-weight="700">z</text><text x="160" y="42" font-size="16" fill="#9F8FE0" font-weight="700">z</text></g>`}
  else{eyes=`<g class="blink">${eye(80,'open',L,EF)+eye(120,'open',L,EF)}</g>`;
    if(m==='stress'){extra=`<rect x="46" y="62" width="108" height="12" rx="6" fill="#FF7B7B"/><text x="100" y="72" font-size="9" text-anchor="middle" fill="#fff" font-weight="700">CỐ LÊN!</text><path d="M150 92q6 10 0 14q-6-4 0-14z" fill="#8CCBFF"/>`;mouth=`<path d="M93 127Q100 122 107 127" fill="none" stroke="#C9707A" stroke-width="3" stroke-linecap="round"/>`}
    if(m==='sad'){extra=`<path d="M124 115q4 8 0 11q-4-3 0-11z" fill="#8CCBFF"/>`;mouth=`<path d="M94 128Q100 123 106 128" fill="none" stroke="#C9707A" stroke-width="3" stroke-linecap="round"/>`}
    if(m==='sick'){extra=`<rect x="84" y="62" width="32" height="14" rx="4" fill="#fff" stroke="#BDE3F7" stroke-width="2"/><rect x="104" y="122" width="26" height="5" rx="2.5" fill="#fff" stroke="#ccc"/><circle cx="130" cy="124.5" r="3" fill="#FF7B7B"/>`;mouth=''}}
  const brows=`<path d="M72 89Q80 85 87 87M128 89Q120 85 113 87" fill="none" stroke="#6B5552" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
  const hp=(x,y)=>`<path d="M${x} ${y+5}C${x-9} ${y-1} ${x-5} ${y-8} ${x} ${y-3}C${x+5} ${y-8} ${x+9} ${y-1} ${x} ${y+5}Z" fill="#FF9AA8" opacity=".9"/>`;
  let blush=d25&&m!=='sick'&&(L.blush==='soft'||L.blush==='strong'||puff)?`<ellipse cx="67" cy="119" rx="${L.blush==='strong'||puff?16:13}" ry="${L.blush==='strong'||puff?10:8}" fill="url(#bl${u})" opacity="${L.blush==='strong'?1:.8}"/><ellipse cx="133" cy="119" rx="${L.blush==='strong'||puff?16:13}" ry="${L.blush==='strong'||puff?10:8}" fill="url(#bl${u})" opacity="${L.blush==='strong'?1:.8}"/>`:m==='sick'?`<ellipse cx="67" cy="118" rx="11" ry="6" fill="#FF8A8A" opacity=".8"/><ellipse cx="133" cy="118" rx="11" ry="6" fill="#FF8A8A" opacity=".8"/>`
    :L.blush==='heart'?hp(67,118)+hp(133,118):L.blush==='none'&&!puff?'':`<ellipse cx="67" cy="118" rx="${puff||L.blush==='strong'?12:9}" ry="${puff||L.blush==='strong'?7:5}" fill="${L.blush==='strong'||puff?'#FF9AA8':'#FFB1B8'}" opacity="${L.blush==='strong'?.85:.65}"/><ellipse cx="133" cy="118" rx="${puff||L.blush==='strong'?12:9}" ry="${puff||L.blush==='strong'?7:5}" fill="${L.blush==='strong'||puff?'#FF9AA8':'#FFB1B8'}" opacity="${L.blush==='strong'?.85:.65}"/>`;
  const frk=L.freckles?[[61,113],[65,118],[70,113],[130,113],[135,118],[139,113],[97,117],[103,117]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2" fill="#C98F7A"/>`).join(''):'';
  const glass=o.sleep?'':L.eyewear==='round'?`<g fill="rgba(255,255,255,.18)" stroke="#6B5552" stroke-width="2.2"><circle cx="80" cy="105" r="12.5"/><circle cx="120" cy="105" r="12.5"/></g><path d="M92.5 104Q100 100 107.5 104" fill="none" stroke="#6B5552" stroke-width="2.2"/>`
    :L.eyewear==='sun'?`<rect x="65" y="96" width="30" height="19" rx="8" fill="#2B2223"/><rect x="105" y="96" width="30" height="19" rx="8" fill="#2B2223"/><path d="M95 102Q100 99 105 102" fill="none" stroke="#2B2223" stroke-width="3"/><path d="M70 101l7-3M110 101l7-3" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`
    :L.eyewear==='heart'?`<path d="M80 117C64 108 66 94 80 101C94 94 96 108 80 117Z M120 117C104 108 106 94 120 101C134 94 136 108 120 117Z" fill="#FF7FA0" opacity=".9"/><path d="M93 103Q100 100 107 103" stroke="#FF7FA0" stroke-width="3" fill="none"/>`:'';
  const headAcc=kig||o.sleep?'':L.head==='bow'?`<path d="M136 58L121 47V69Z M136 58L151 47V69Z" fill="#FF9EB5"/><circle cx="136" cy="58" r="4.5" fill="#FF7FA0"/>`
    :L.head==='band'?`<path d="M47 84Q100 20 153 84" fill="none" stroke="#FFB3C7" stroke-width="7" stroke-linecap="round"/>`+[60,76,92,108,124,140].map((x,i)=>`<circle cx="${x}" cy="${[64,50,43,43,50,64][i]}" r="2.6" fill="#fff"/>`).join('')
    :L.head==='beanie'?`<path d="M42 86Q42 24 100 24Q158 24 158 86Z" fill="#F7C9C9"/><rect x="40" y="76" width="120" height="16" rx="8" fill="#F0ABAB"/><path d="M60 80v8M76 80v8M92 80v8M108 80v8M124 80v8M140 80v8" stroke="#E79595" stroke-width="2"/><circle cx="100" cy="22" r="10" fill="#fff"/>`
    :L.head==='pearl'?[[126,62],[134,66],[142,72]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#FFFDF8" stroke="#E6DED2" stroke-width="1"/>`).join('')
    :L.head==='flower'?[0,72,144,216,288].map(a=>`<circle cx="${62+6*Math.cos(a*Math.PI/180)}" cy="${68+6*Math.sin(a*Math.PI/180)}" r="4.5" fill="#FFE08A"/>`).join('')+`<circle cx="62" cy="68" r="3.5" fill="#FF9E9E"/>`:'';
  const ear=o.sleep||kig?'':L.ear==='stud'?`<circle cx="53" cy="121" r="2.6" fill="#fff" stroke="#E6E1EA"/><circle cx="147" cy="121" r="2.6" fill="#fff" stroke="#E6E1EA"/>`
    :L.ear==='pearl'?`<path d="M53 119v7M147 119v7" stroke="#D9B65C" stroke-width="1.4"/><circle cx="53" cy="129" r="3.6" fill="#FFFDF8" stroke="#E6DED2"/><circle cx="147" cy="129" r="3.6" fill="#FFFDF8" stroke="#E6DED2"/>`
    :L.ear==='hoop'?`<circle cx="53" cy="126" r="5.5" fill="none" stroke="#E0B04A" stroke-width="2"/><circle cx="147" cy="126" r="5.5" fill="none" stroke="#E0B04A" stroke-width="2"/>`:'';
  const dressy=DAY.includes(k)&&!o.sleep;
  const bag=dressy&&L.bag&&o.act!=='shiver'&&o.act!=='snowman'?`<path d="M58 190Q50 192 50 198" stroke="#D9B65C" stroke-width="1.6" fill="none"/><rect x="36" y="196" width="26" height="19" rx="5" fill="#FCFAF6" stroke="#E2D8CA" stroke-width="1.5"/><path d="M40 200L58 212M48 198L60 206M36 206L46 214M58 200L40 212M48 214L60 204" stroke="#EDE4D7" stroke-width="1"/><path d="M36 203Q49 209 62 203" fill="none" stroke="#E2D8CA" stroke-width="1.5"/><circle cx="49" cy="206" r="1.6" fill="#D9B65C"/>`:'';
  const watch=dressy&&L.watch?`<rect x="51" y="176" width="13" height="5" rx="2.5" fill="#E0B04A"/>`:'';
  const blanket=o.sleep?`<path d="M30 168Q100 140 170 168L176 232H24Z" fill="#DED2F9"/><path d="M30 168Q100 140 170 168" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>`:'';
  const legC=kig?CL:SK,shoe=kig?of.k:of.shoe;const pose=POSE[o.act]||'side',AF=pj||kig||k==='sweater'?CL:SK;
  const xw=(o.xw!==undefined?o.xw:isXmas()&&S.seasonWear!==false)&&!kig&&!o.sleep;
  const scarf=xw&&!pj?`<path d="M70 147Q100 161 130 147L132 158Q100 173 68 158Z" fill="#E5484D"/><path d="M76 153Q100 164 124 153" stroke="#fff" stroke-width="2.4" fill="none" opacity=".9"/><rect x="113" y="154" width="12" height="30" rx="4" fill="#E5484D" transform="rotate(8 119 154)"/><path d="M114 168h11M114 175h11" stroke="#fff" stroke-width="2.4" transform="rotate(8 119 154)"/>`:'';
  const santa=xw?`<path d="M46 80Q50 32 98 27Q138 25 156 48L174 64Q162 58 151 61Q155 71 155 80Z" fill="#E5484D"/><path d="M60 50Q90 30 130 36" stroke="#fff" stroke-width="3" opacity=".25" fill="none"/><rect x="40" y="71" width="120" height="17" rx="8.5" fill="#fff"/><circle cx="174" cy="66" r="9" fill="#fff"/>`:'';
  const shine=d25&&!kig&&hair!=='buns'?`<path d="M66 64Q78 54 92 50M108 50Q122 54 134 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".16"/><path d="M74 60Q82 55 88 53M126 60Q118 55 112 53" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".4"/>`:'';
  const neck=d25&&!kig&&!pj?`<ellipse cx="100" cy="151" rx="24" ry="7" fill="#E2AC98" opacity=".55"/>`:'';
  const fold=d25&&!pj?`<path d="M119 158Q131 174 127 192" fill="none" stroke="#000" stroke-width="9" stroke-linecap="round" opacity=".06"/><path d="M78 160Q74 174 77 188" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`:'';
  const rim=d25?`<circle cx="100" cy="94" r="56" fill="none" stroke="#EBB6A3" stroke-width="1.2" opacity=".6"/><ellipse cx="80" cy="76" rx="16" ry="7" fill="#fff" opacity=".18"/>`:'';
  return `<svg viewBox="0 0 200 240" aria-hidden="true">${defs}${d25?`<ellipse cx="100" cy="230" rx="62" ry="10" fill="url(#gs${u})"/>`:'<ellipse cx="100" cy="230" rx="54" ry="8" fill="rgba(74,62,61,.12)"/>'}
  ${o.act==='nap'||o.act==='snowman'?actItem(o.act):''}<g class="${o.sleep||o.still?'':'bob'}">${back}${kig?tail(k):''}
  <g class="legL"><rect x="83" y="200" width="12" height="23" rx="6" fill="${legC}"/><ellipse cx="88" cy="225" rx="9.5" ry="5.5" fill="${shoe}" stroke="rgba(0,0,0,.08)"/></g><g class="legR"><rect x="105" y="200" width="12" height="23" rx="6" fill="${legC}"/><ellipse cx="112" cy="225" rx="9.5" ry="5.5" fill="${shoe}" stroke="rgba(0,0,0,.08)"/></g>
  <g class="${d25&&!o.sleep?'breath':''}">${pj||kig||k==='sweater'?'':`<path d="M68 148Q100 138 132 148L134 166L66 166Z" fill="${SK}"/>`}${neck}${outfitSvg(k,CL)}${fold}${scarf}
  ${pose==='side'?armsSvg('side',AF,SK)+watch+bag+(o.act==='shiver'?actItem('shiver'):''):''}</g>
  ${kig?hoodBack(k,CL):''}<circle cx="100" cy="94" r="56" fill="${SK}"/>${rim}
  ${brows}${eyes}${blush}${frk}${mouth}${glass}
  ${front}${shine}${ear}${santa||headAcc}${pose!=='side'?actItem(o.act)+armsSvg(pose,AF,SK):''}${extra}${blanket}</g></svg>`}

let bubT,bubRAF=0;function bubTrack(){const b=$('#bubble');if(!b.classList.contains('on')){bubRAF=0;return}const r=pet.getBoundingClientRect(),w=b.offsetWidth,c=r.left+r.width/2;b.classList.toggle('l',c-w/2<6);b.classList.toggle('r',c+w/2>innerWidth-6&&!(c-w/2<6));b.classList.toggle('below',r.top<b.offsetHeight+70);bubRAF=requestAnimationFrame(bubTrack)}
function say(t,ms){const b=$('#bubble');b.textContent=t;b.classList.add('on');if(!bubRAF)bubRAF=requestAnimationFrame(bubTrack);clearTimeout(bubT);bubT=setTimeout(()=>b.classList.remove('on'),ms||4500)}
function drawChibi(){const hr=new Date().getHours();pet.classList.toggle('low',low());document.documentElement.classList.toggle('xmas',isXmas());document.documentElement.classList.toggle('night',isNight());document.documentElement.classList.toggle('dusk',hr>=18||hr<6);$('#petSvg').innerHTML=chibi(Object.assign(state(),{act:P.act}))}

function suggestions(){const d=today(),c=d.checkin,out=[];if(!c)return out;
  const last=S.sleeps[S.sleeps.length-1],hrs=last&&!last.sample?(new Date(last.wake)-new Date(last.bed))/36e5:null;
  if(c.body==='sick'||c.energy<=2)out.push('🛋️ Hôm nay năng lượng thấp. Mình ẩn bớt việc không gấp và nghỉ ngơi nhẹ nhàng nha (Ngày Lười Biếng).');
  if(hrs!==null&&hrs<6)out.push('😴 Đêm qua bạn ngủ khoảng '+hrs.toFixed(1)+' tiếng. Nếu tập thì chọn buổi nhẹ thôi.');
  if(c.weather==='cold'||c.weather==='humid')out.push('🧣 Trời '+(c.weather==='cold'?'lạnh':'nồm')+': giữ ấm cổ, rửa mũi nước muối nhé.');
  if(c.weather==='hot')out.push('💧 Trời nóng: nhớ uống thêm nước, tránh nắng gắt buổi trưa.');
  if(c.weather==='rain')out.push('☂️ Trời mưa: nhớ mang ô hoặc áo mưa.');
  if(c.mood==='stress')out.push('🍅 Hơi căng thẳng? Thử một phiên tập trung 25 phút rồi hít thở sâu 5 lần.');
  if(c.mood==='sad')out.push('🍬 Mở Lọ Kẹo đọc lại vài niềm vui cũ nhé, mình ở đây với bạn.');
  if(c.body==='sore')out.push('🦵 Đang đau nhức cơ: hôm nay ưu tiên giãn cơ, tránh tập nhóm cơ đang đau.');
  if(!out.length)out.push('🌷 Mọi thứ ổn áp! Chọn 3 việc quan trọng nhất và bắt đầu thôi.');return out}

const label=(arr,v)=>{const x=arr.find(a=>a[0]===v);return x?x[1]:'–'};
function cupSvg(f){return `<svg viewBox="0 0 30 44"><path d="M5 6H25L22 40H8Z" fill="${f?'#BFE6FF':'none'}" stroke="#8CC8EA" stroke-width="2.5" stroke-linejoin="round"/>${f?'<path d="M8 16H22" stroke="#fff" stroke-width="2" opacity=".7"/>':''}</svg>`}
function jarSvg(n){let c='';const cols=['#FF9E9E','#A8E6CF','#DED2F9','#FFE9A8','#FFC8A8'];for(let i=0;i<Math.min(n,24);i++){c+=`<circle cx="${26+(i%4)*15}" cy="${112-Math.floor(i/4)*14}" r="7" fill="${cols[i%5]}"/>`}
  return `<svg viewBox="0 0 96 130" aria-hidden="true"><rect x="22" y="4" width="52" height="14" rx="5" fill="#E9C9A8"/><path d="M18 20H78Q86 20 86 30V118Q86 126 78 126H18Q10 126 10 118V30Q10 20 18 20Z" fill="rgba(255,255,255,.55)" stroke="#E6D3C0" stroke-width="3"/>${c}</svg>`}

/* ---------- Cài lên màn hình chính & nhắc sao lưu ---------- */
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let installEvt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(tab==='today'||tab==='set')render()});
function installHow(){return installEvt?`<button class="btn" data-a="install">📲 Cài app</button>`:isIOS?`<p class="muted" style="margin:0">Trong <b>Safari</b>: bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên) → <b>Thêm vào MH chính</b> → <b>Thêm</b>.</p>`:`<p class="muted" style="margin:0">Mở menu trình duyệt → <b>Cài đặt ứng dụng</b> / <b>Thêm vào màn hình chính</b>.</p>`}
function backupDue(){const n=Object.keys(S.days).length+S.sleeps.filter(x=>!x.sample).length;if(!n)return 0;if(!S.lastBackup)return n>=3?-1:0;const d=daysSince(S.lastBackup);return d>=7?d:0}

function viewToday(){const d=today(),c=d.checkin;let h='';
  if(!standalone()&&!S.hideInstall)h+=`<div class="card"><h2>📲 Cài Cozy Life lên điện thoại <small><button class="chip" data-a="hideInstall" style="min-height:36px;padding:4px 12px" aria-label="Ẩn">✕</button></small></h2><p class="muted" style="margin:0 0 10px">Cài lên màn hình chính để mở như app thật, dùng được khi không có mạng${isIOS?' và để iPhone không tự xóa dữ liệu khi lâu không mở':''}.</p>${installHow()}</div>`;
  const due=backupDue();if(due)h+=`<div class="card"><h2>💾 ${due<0?'Chưa sao lưu lần nào':'Đã '+due+' ngày chưa sao lưu'}</h2><p class="muted" style="margin:0 0 10px">Lưu một bản ra file (iCloud Drive, Google Drive…) để lỡ mất máy hay xóa app vẫn còn.</p><button class="btn full" data-a="export">📤 Sao lưu ngay</button></div>`;
  if(!c){h+=`<div class="card"><h2>Check-in ${new Date().getHours()<12?'buổi sáng':'hôm nay'}</h2><p class="muted" style="margin:0 0 12px">10 giây để Chibi biết hôm nay bạn thế nào.</p><button class="btn full" data-a="checkin">🌤️ Bắt đầu Check-in</button></div>`}
  else{h+=`<div class="card"><h2>Hôm nay của bạn <small><button class="chip" data-a="checkin" style="min-height:36px;padding:4px 12px">Sửa</button></small></h2>
    <div class="sum"><div><b>${label(MOODS,c.mood)}</b>Tâm trạng</div><div><b>${label(WEATHER,c.weather)}</b>Thời tiết</div><div><b>🔋${c.energy}</b>Năng lượng</div><div><b>${label(BODY,c.body)}</b>Cơ thể</div></div>
    ${suggestions().map(t=>`<div class="tip">${t}</div>`).join('')}</div>`}
  if(isNight()){h+=`<div class="card night-card"><h2>🌙 Giờ đi ngủ</h2>${d.evening?`<p class="muted" style="margin:0">Bạn đã chúc ngủ ngon lúc ${hm(new Date(S.pendingBed||Date.now()))}. Ngủ ngon nha!</p>`:`<p class="muted" style="margin:0 0 12px">Khép lại ngày hôm nay trong 30 giây rồi đi ngủ thôi.</p><button class="btn full" data-a="evening">😴 Bắt đầu</button>`}</div>`}
  h+=`<div class="card"><h2>3 việc quan trọng nhất <small>${d.top3.filter(x=>x.d&&x.t).length}/3</small></h2>${d.top3.map((x,i)=>`<div class="task ${x.d?'done':''}"><input type="checkbox" data-t="${i}" ${x.d?'checked':''} aria-label="Xong việc ${i+1}"><input type="text" data-tt="${i}" value="${esc(x.t)}" placeholder="Việc số ${i+1}…"></div>`).join('')}</div>`;
  h+=`<div class="card"><h2>Uống nước <small>${d.water}/8 ly</small></h2><div class="cups">${Array.from({length:8},(_,i)=>`<button class="cup" data-w="${i}" aria-label="Ly ${i+1}">${cupSvg(i<d.water)}</button>`).join('')}</div></div>`;
  const nC=Object.values(S.days).reduce((a,x)=>a+((x&&x.candies)||[]).length,0);
  h+=`<div class="card"><h2>Lọ Kẹo Niềm Vui <small>${nC} viên</small></h2><div class="jar">${jarSvg(nC)}<div class="jarside">
    <form id="candyF"><input class="inp" id="candy" placeholder="Một niềm vui nhỏ hôm nay…" maxlength="120"><button class="btn" style="margin-top:8px">+ Thả kẹo</button></form>
    ${d.candies.length?`<p class="muted" style="margin:8px 0 0">Hôm nay: ${d.candies.map(esc).join(' · ')}</p>`:''}</div></div></div>`;
  return h}

function viewHealth(){const L=S.sleeps.slice(-7);
  if(!L.length)return `<div class="card"><h2>😴 Giấc ngủ</h2><p class="muted">Chưa có dữ liệu. Tối nay bấm "Đi ngủ" ở tab Hôm nay nhé!</p></div>`;
  const dur=x=>(new Date(x.wake)-new Date(x.bed))/36e5;const off=d=>{let h=d.getHours()+d.getMinutes()/60-20;if(h<0)h+=24;return h};
  const avg=L.reduce((a,x)=>a+dur(x),0)/L.length;const bo=L.map(x=>off(new Date(x.bed)));const ab=bo.reduce((a,b)=>a+b,0)/bo.length;
  const spread=Math.sqrt(bo.reduce((a,b)=>a+(b-ab)**2,0)/bo.length)*60;const toClock=o=>{let t=(o+20)%24;return pad(Math.floor(t))+':'+pad(Math.round((t%1)*60)%60)};
  const [gh,gm]=S.bedTarget.split(':').map(Number);let g=gh+gm/60-20;if(g<0)g+=24;
  const rows=L.map(x=>{const b=new Date(x.bed),s=off(b),e=Math.min(16,s+dur(x));const nd=new Date(b.getTime()-12*36e5);const dd=pad(nd.getDate())+'/'+pad(nd.getMonth()+1);
    return `<div class="sleep-row"><span>${dd}</span><div class="track"><div class="goal" style="left:${g/16*100}%"></div><div class="bar" style="left:${s/16*100}%;width:${(e-s)/16*100}%"></div></div><span style="text-align:right;white-space:nowrap">${dur(x).toFixed(1)}h</span></div>`}).join('');
  return `<div class="card"><h2>😴 Giấc ngủ ${L.length} đêm gần nhất</h2>
    <div class="stat3"><div><b>${avg.toFixed(1)}h</b>TB mỗi đêm</div><div><b>${toClock(ab)}</b>Giờ ngủ TB</div><div><b>±${Math.round(spread)}′</b>Độ đều đặn</div></div>
    ${rows}<div class="axis"><span></span><span><i>20h</i><i>0h</i><i>4h</i><i>8h</i><i>12h</i></span><span></span></div>
    <p class="muted" style="margin:10px 0 0">Vạch đứt màu đào là giờ đi ngủ mục tiêu (${S.bedTarget}).${L.some(x=>x.sample)?' Một số đêm là dữ liệu mẫu, có thể xóa trong Cài đặt.':''}</p></div>
    <div class="card"><h2>Sắp có ở bước sau</h2><p class="muted" style="margin:0">Hồ sơ sức khỏe, tủ thuốc, Gym & bản đồ nhóm cơ.</p></div>`}

function viewSoon(t){return `<div class="card"><h2>${t}</h2><p class="muted" style="margin:0">Phần này sẽ có ở bước tiếp theo.</p></div>`}

let wtab='outfit',snaps=null;
function dataCard(){
  const pst=CozyDB.fallback?['⚠️','Trình duyệt này không cho lưu kiểu bền vững (có thể đang ở chế độ ẩn danh). Hãy mở bằng trình duyệt thường.']
    :persistState==='yes'?['✅','Đã được bảo vệ: trình duyệt sẽ không tự dọn dữ liệu khi máy đầy bộ nhớ.']
    :['💡',(isIOS&&!standalone()?'Safari có thể xóa dữ liệu nếu 7 ngày không mở. Cài app lên màn hình chính để tránh việc này. ':'Trình duyệt có thể tự dọn khi máy rất đầy bộ nhớ. ')+'Sao lưu định kỳ cho chắc nhé.'];
  const sum=CozyBackup.summary(S);
  if(snaps===null){snaps=[];CozyDB.listSnapshots().then(l=>{snaps=l;if(tab==='set')render()}).catch(()=>{})}
  return `<div class="card" id="datacard"><h2>💾 Dữ liệu & sao lưu</h2>
  <p class="muted" style="margin:0 0 10px">Mọi thứ nằm ngay trên máy này, không gửi lên mạng. Hiện có ${sum.days} ngày nhật ký, ${sum.sleeps} đêm ngủ, ${sum.candies} viên kẹo.</p>
  <div class="okline ${persistState==='yes'?'':'warn'}"><span>${pst[0]}</span><span>${pst[1]}</span></div>
  <div class="okline ${backupDue()?'warn':''}"><span>📤</span><span>Lần sao lưu cuối: <b>${S.lastBackup?fmtDate(S.lastBackup)+' ('+(daysSince(S.lastBackup)?daysSince(S.lastBackup)+' ngày trước':'hôm nay')+')':'chưa có'}</b></span></div>
  <div class="q" style="margin-top:4px"><h3>Mật khẩu cho file sao lưu <span class="muted">(không bắt buộc)</span></h3><input class="inp" type="password" id="bkpw" autocomplete="new-password" placeholder="Để trống nếu không cần"><p class="muted" style="margin:6px 0 0">Đặt mật khẩu thì người khác mở file cũng không đọc được nhật ký. Nhưng <b>quên mật khẩu là không khôi phục được</b>, nên hãy ghi lại ở nơi an toàn.</p></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="export">📤 Sao lưu ra file</button><button class="btn ghost" data-a="import">📥 Khôi phục từ file</button></div>
  <details class="more" style="margin-top:14px"><summary>🕰️ Bản chụp tự động (${snaps.length})</summary><p class="muted" style="margin:4px 0 8px">App tự chụp lại dữ liệu mỗi ngày (giữ 7 ngày) và trước mỗi lần khôi phục hoặc xóa. Dùng khi lỡ tay làm mất gì đó.</p>
  ${snaps.length?snaps.map(s=>`<div class="snap"><span>${s.key.startsWith('auto-')?'📅':'🛟'} ${fmtDate(s.createdAt)}<br><span class="muted">${esc(s.label||'')} · ${s.days} ngày, ${s.sleeps} đêm</span></span><button class="chip" data-snap="${esc(s.key)}">Quay lại</button></div>`).join(''):'<p class="muted">Chưa có bản chụp nào.</p>'}</details>
  <details class="more" style="margin-top:6px"><summary>🧹 Xóa dữ liệu</summary><div class="row" style="margin-top:8px">${S.sleeps.some(x=>x.sample)?'<button class="btn ghost" data-a="clearSample">Xóa dữ liệu mẫu</button>':''}<button class="btn ghost" data-a="reset">Xóa hết, làm lại</button></div><p class="muted hide" id="resetQ">Bấm "Xóa hết" lần nữa để xác nhận. (App sẽ chụp lại trước khi xóa.)</p></details></div>`}

function viewSettings(){const st=state(),L=S.look;
  const card=(k,attr,cur)=>{const o=OUTFITS[k];return `<button class="wd" data-${attr}="${k}" aria-pressed="${cur===k}">${chibi({mood:'calm',outfit:k,still:1,face:'smile'})}<b>${o.n}</b><span>${o.d}</span></button>`};
  const grp=(title,key,opts)=>`<div class="q"><h3>${title}</h3><div class="row">${opts.map(([v,t])=>`<button class="chip" data-look="${key}" data-lv="${v}" aria-pressed="${String(key==='seasonWear'?S.seasonWear:L[key])===String(v)}">${t}</button>`).join('')}</div></div>`;
  const pv=wtab==='night'?S.nightWear:wtab==='outfit'||wtab==='face'||wtab==='makeup'||wtab==='acc'||wtab==='hair'?S.fav:st.outfit;
  let body='';
  if(wtab==='outfit')body=`<h3 class="wh">Váy áo hằng ngày</h3><div class="wgrid">${DAY.filter(k=>!XMAS.includes(k)).map(k=>card(k,'fav',S.fav)).join('')}</div><h3 class="wh">🎄 Giáng sinh</h3><div class="wgrid">${XMAS.map(k=>card(k,'fav',S.fav)).join('')}</div><h3 class="wh">Đồ bộ cute</h3><div class="wgrid">${KIG.map(k=>card(k,'fav',S.fav)).join('')}</div>`;
  if(wtab==='night')body=`<p class="muted" style="margin:0 0 10px">Bộ Chibi tự mặc vào buổi tối và khi bạn ốm.</p><div class="wgrid">${NIGHT.map(k=>card(k,'nw',S.nightWear)).join('')}</div><div class="row" style="margin-top:12px"><button class="chip" data-swap="1" aria-pressed="${S.autoSwap}">Tự thay đồ ngủ buổi tối, khi ốm và đồ tập khi đau cơ</button></div>`;
  if(wtab==='acc')body=grp('Kính','eyewear',[['none','Không'],['round','👓 Gọng tròn'],['sun','🕶️ Kính râm'],['heart','💗 Kính tim']])+grp('Trên tóc','head',[['none','Không'],['bow','🎀 Nơ'],['band','Bờm ngọc'],['pearl','Kẹp ngọc trai'],['flower','🌼 Kẹp hoa'],['beanie','🧶 Mũ len']])+grp('🎅 Mùa Giáng sinh','seasonWear',[[true,'Đội mũ Noel + quàng khăn'],[false,'Không']])+grp('Bông tai','ear',[['none','Không'],['stud','Nụ'],['pearl','Ngọc trai rủ'],['hoop','Khoen vàng']])+grp('Đồng hồ vàng','watch',[[true,'Đeo'],[false,'Không']])+grp('Túi xách trắng','bag',[[true,'Cầm túi'],[false,'Không']])+`<p class="muted">Đồng hồ và túi chỉ hiện với váy áo đi chơi; phụ kiện trên tóc ẩn khi mặc đồ bộ có mũ.</p>`;
  if(wtab==='makeup')body=`<div class="q" style="margin-top:0"><h3>Màu son</h3><div class="row">${LIPS.map(([c,t])=>`<button class="sw" data-look="lip" data-lv="${c}" style="background:${c}" aria-label="${t}" aria-pressed="${L.lip===c}"></button>`).join('')}</div><p class="muted" style="margin:6px 0 0">${(LIPS.find(x=>x[0]===L.lip)||['', ''])[1]}</p></div>`+grp('Má hồng','blush',[['soft','Tự nhiên'],['strong','Ửng đậm'],['heart','💗 Trái tim'],['none','Không']])+grp('Mi mắt','lash',[['natural','Tự nhiên'],['long','Cong dài']])+grp('Tàn nhang','freckles',[[false,'Không'],[true,'Có']]);
  if(wtab==='face')body=`<p class="muted" style="margin:0 0 10px">"Theo tâm trạng" thì nét mặt đổi theo Check-in. Khi ốm hoặc buồn ngủ, Chibi vẫn tự đổi để nhắc bạn.</p><div class="row">${FACES.map(([v,i,t])=>`<button class="chip" data-look="face" data-lv="${v}" aria-pressed="${L.face===v}">${i} ${t}</button>`).join('')}</div>`;
  if(wtab==='hair')body=`<div class="q" style="margin-top:0"><h3>Kiểu tóc</h3><div class="row">${[['straight','Dài thẳng rẽ ngôi'],['wavy','Dài xoăn sóng'],['bob','Ngắn mái ngố'],['buns','Búi hai bên']].map(([k,t])=>`<button class="chip" data-hair="${k}" aria-pressed="${S.hair===k}">${t}</button>`).join('')}</div></div><div class="q"><h3>Màu tóc</h3><div class="row">${HAIRC.map(c=>`<button class="sw" data-hc="${c}" style="background:${c}" aria-label="Màu ${c}" aria-pressed="${S.hairColor===c}"></button>`).join('')}</div></div>`;
  const WT=[['outfit','👗 Trang phục'],['night','🌙 Đồ ngủ'],['acc','🎀 Phụ kiện'],['makeup','💄 Trang điểm'],['face','😊 Nét mặt'],['hair','💇‍♀️ Tóc']];
  return `<div class="card"><h2>👗 Phòng thay đồ</h2>
  <div class="mirror">${chibi({mood:'calm',outfit:pv,face:L.face==='auto'?'smile':L.face})}</div>  <div class="wtabs scroll">${WT.map(([k,t])=>`<button data-wt="${k}" aria-pressed="${wtab===k}">${t}</button>`).join('')}</div>
  ${body}</div>
  <div class="card"><h2>🎨 Giao diện theo mùa</h2><div class="row">${[['auto','Tự động (15/11 – 6/1)'],['xmas','🎄 Luôn bật Giáng sinh'],['none','Tắt']].map(([k,t])=>`<button class="chip" data-theme="${k}" aria-pressed="${(S.theme||'auto')===k}">${t}</button>`).join('')}</div>
  <p class="muted" style="margin:8px 0 0">Mùa Giáng sinh: tuyết rơi, màu Noel, Chibi đội mũ Noel quàng khăn len, thêm hoạt động ca cao nóng, mở quà, nặn người tuyết.</p></div>
  <div class="card"><h2>Chibi & bạn</h2>
  <div class="q" style="margin-top:0"><h3>Tên Chibi gọi bạn</h3><input class="inp" id="nm" value="${esc(S.name)}" maxlength="20"></div>
  <div class="q"><h3>Chibi di chuyển</h3><div class="row"><button class="chip" data-roam="1" aria-pressed="${S.roam!==false}">🏃 Chạy lung tung</button><button class="chip" data-roam="0" aria-pressed="${S.roam===false}">🪑 Ngồi yên một góc</button></div><p class="muted" style="margin:6px 0 0">Mẹo: kéo Chibi để bế bé sang chỗ khác.</p></div>
  <div class="q"><h3>Âm thanh Chibi</h3><div class="row"><button class="chip" data-snd="1" aria-pressed="${S.sound!==false}">🔊 Bật (tiếng ực ực khi uống nước)</button><button class="chip" data-snd="0" aria-pressed="${S.sound===false}">🔇 Tắt</button></div></div>
  <div class="q"><h3>Giờ đi ngủ mục tiêu</h3><input class="inp" type="time" id="bt" value="${S.bedTarget}"></div></div>
  ${dataCard()}
  ${standalone()?'':`<div class="card"><h2>📲 Cài lên màn hình chính</h2>${installHow()}</div>`}
  <div class="card demo"><h2>Xem thử trạng thái</h2><p class="muted" style="margin:0 0 10px">Xem trước các trạng thái mà không cần đợi đến giờ.</p><div class="row"><button class="btn ghost" data-a="demoNight">${demoNight?'☀️ Về ban ngày':'🌙 Thử Giờ đi ngủ'}</button></div>
  <h3 style="font-size:15px;margin:14px 0 8px">Hoạt động của Chibi</h3><p class="muted" style="margin:0 0 8px">Bình thường bé tự chọn theo tâm trạng và thể trạng hôm nay. Bấm để xem trước:</p><div class="row">${Object.keys(ACTNAME).map(k=>`<button class="chip" data-act="${k}">${ACTNAME[k]}</button>`).join('')}</div></div>
  <p class="muted" style="text-align:center;margin:18px 0 0">Cozy Life OS · phiên bản <span id="ver">${APPVER}</span></p>`}

const APPVER='2026.11.17-1';
const TABS=[['today','☀️','Hôm nay'],['tasks','📋','Việc'],['people','💌','Người thương'],['health','💪','Sức khỏe'],['set','⚙️','Cài đặt']];
function render(){const n=new Date(),h=n.getHours();
  const keepPw=$('#bkpw')?$('#bkpw').value:'';
  const openD=[...document.querySelectorAll('details.more')].map(d=>d.open);
  $('#hello').textContent=(isNight()?'Chúc buổi tối':h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối')+', '+S.name;
  $('#xpill').textContent=isXmas()?xmasLabel():'';
  $('#date').textContent=n.toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long'});
  $('#tabs').innerHTML=TABS.map(([k,i,t])=>`<button data-tab="${k}" aria-current="${tab===k}"><span>${i}</span>${t}</button>`).join('');
  $('#view').innerHTML=tab==='today'?viewToday():tab==='health'?viewHealth():tab==='set'?viewSettings():viewSoon(tab==='tasks'?'📋 Việc & Ước mơ':'💌 Người thương');
  if($('#bkpw'))$('#bkpw').value=keepPw;
  document.querySelectorAll('details.more').forEach((d,i)=>{if(openD[i])d.open=true});
  drawChibi();save()}

/* ---------- Sheets ---------- */
let F={};
function openSheet(html){$('#sheet').innerHTML=html;$('#sheetbg').classList.add('on')}
function closeSheet(){$('#sheetbg').classList.remove('on')}
const chips=(name,arr,v)=>`<div class="row">${arr.map(([k,i,t])=>`<button class="chip" data-f="${name}" data-v="${k}" aria-pressed="${v===k}">${i} ${t}</button>`).join('')}</div>`;
function checkinSheet(){const c=today().checkin||{};F={mood:c.mood,weather:c.weather,energy:c.energy||3,body:c.body||'ok',q:c.q||4};
  const pb=S.pendingBed?new Date(S.pendingBed):null;
  openSheet(`<h2>🌤️ Check-in buổi sáng</h2><p class="muted" style="margin:0">Chọn nhanh thôi, không cần nghĩ nhiều.</p>
  <div class="q"><h3>Tâm trạng</h3>${chips('mood',MOODS,F.mood)}</div>
  <div class="q"><h3>Thời tiết</h3>${chips('weather',WEATHER,F.weather)}</div>
  <div class="q"><h3>Năng lượng</h3>${chips('energy',[1,2,3,4,5].map(n=>[n,'🔋',n]),F.energy)}</div>
  <div class="q"><h3>Cơ thể</h3>${chips('body',BODY,F.body)}</div>
  <div class="q"><h3>Giấc ngủ đêm qua</h3>${pb?`<p class="muted" style="margin:0 0 8px">Bạn đi ngủ lúc <b>${hm(pb)}</b>. Bạn dậy lúc mấy giờ?</p>`:`<p class="muted" style="margin:0 0 8px">Tối qua chưa bấm "Đi ngủ". Nhập bù nếu nhớ:</p><input class="inp" type="time" id="bedIn" style="margin-bottom:8px" aria-label="Giờ đi ngủ">`}
   <input class="inp" type="time" id="wakeIn" value="${hm(new Date())}" aria-label="Giờ dậy">
   <div class="stars row" style="margin-top:6px" aria-label="Chất lượng giấc ngủ">${[1,2,3,4,5].map(n=>`<button data-star="${n}" class="${n<=F.q?'on':''}" aria-label="${n} sao">⭐</button>`).join('')}</div></div>
  <button class="btn full" style="margin-top:20px" data-a="saveCheckin">Xong ✨</button>`)}
function eveningSheet(){F={emood:null};const p=PROMPTS[new Date().getDate()%PROMPTS.length];
  openSheet(`<h2>🌙 Khép lại ngày hôm nay</h2>
  <div class="q"><h3>Tâm trạng cuối ngày</h3>${chips('emood',MOODS,null)}</div>
  <div class="q"><h3>Hôm nay thế nào?</h3><p class="muted" style="margin:0 0 8px">Gợi ý: ${p}</p><textarea class="inp" id="line" rows="3" maxlength="500" placeholder="Một dòng thôi cũng được…"></textarea></div>
  <button class="btn full" style="margin-top:20px" data-a="goSleep">😴 Đi ngủ</button>`)}

function saveCheckin(){const d=today();const w=$('#wakeIn').value;
  d.checkin={mood:F.mood||'calm',weather:F.weather||'sun',energy:+F.energy,body:F.body,q:F.q};
  let bed=S.pendingBed?new Date(S.pendingBed):null;const bi=$('#bedIn');
  if(!bed&&bi&&bi.value){bed=new Date();const[h,m]=bi.value.split(':').map(Number);bed.setHours(h,m,0,0);if(h>=12)bed.setDate(bed.getDate()-1)}
  if(bed&&w){const wk=new Date();const[h,m]=w.split(':').map(Number);wk.setHours(h,m,0,0);if(wk<=bed)wk.setDate(wk.getDate()+1);
    if((wk-bed)/36e5<16){S.sleeps.push({bed:bed.toISOString(),wake:wk.toISOString(),q:F.q})}}
  S.pendingBed=null;closeSheet();tab='today';render();
  const c=d.checkin;say(c.body==='sick'?'Thương '+S.name+' quá, hôm nay nghỉ ngơi nhiều nha 🤒':c.mood==='happy'?'Yayy, một ngày tuyệt vời đang chờ '+S.name+'!':c.mood==='stress'?'Không sao, mình cùng làm từng chút một nhé 🔥':'Cảm ơn '+S.name+' đã check-in 💛')}
function goSleep(){const d=today();d.evening={mood:F.emood,line:($('#line').value||'').trim()};S.pendingBed=new Date().toISOString();closeSheet();flush();
  clearTimeout(P.t);$('#chibiSleep').innerHTML=chibi({mood:'sleep',outfit:'pj',sleep:true});$('#gn').textContent='Chúc '+S.name+' ngủ ngon 🌙';$('#gnTime').textContent='Đã ghi giờ đi ngủ: '+hm(new Date());$('#sleepcover').classList.add('on')}

/* ---------- Sao lưu & khôi phục ---------- */
async function doExport(btn){
  const pw=($('#bkpw')&&$('#bkpw').value)||'';
  if(btn)btn.disabled=true;
  try{
    await flush();
    const obj=await CozyBackup.build(S,pw);
    const name='cozy-life-os-'+dk(new Date())+(pw?'-khoa':'')+'.json';
    const blob=new Blob([JSON.stringify(obj,null,pw?0:1)],{type:'application/json'});
    let done=false;
    if(isIOS&&navigator.canShare){const file=new File([blob],name,{type:'application/json'});
      if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Sao lưu Cozy Life'});done=true}catch(e){if(e.name==='AbortError'){if(btn)btn.disabled=false;return}}}}
    if(!done){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
    S.lastBackup=new Date().toISOString();render();
    say(pw?'Đã sao lưu có khóa 🔐 Nhớ giữ kỹ mật khẩu nha!':'Đã sao lưu xong 💾 Cất file ở iCloud/Drive cho chắc nhé!',5000);
  }catch(e){console.error(e);say('Ui, sao lưu chưa được 😣 Thử lại nhé',4000)}
  finally{if(btn)btn.disabled=false}}

let pendingImport=null;
async function readImport(text,pw){
  try{const r=await CozyBackup.parse(text,pw);pendingImport=r;confirmImportSheet(r)}
  catch(e){
    if(e.code==='needpw'||e.code==='badpw'){pendingImport={text};pwSheet(e.code==='badpw')}
    else openSheet(`<h2>😣 Không đọc được file</h2><p class="muted">${e.code==='newer'?'File này được tạo bởi phiên bản Cozy Life mới hơn. Hãy cập nhật app rồi thử lại.':'File này không phải file sao lưu của Cozy Life, hoặc đã bị hỏng.'}</p><button class="btn full" data-a="closeSheet">Đóng</button>`)}}
function pwSheet(bad){openSheet(`<h2>🔐 File có mật khẩu</h2><p class="muted" style="margin:0 0 10px">Nhập mật khẩu bạn đã đặt khi sao lưu.</p><input class="inp" type="password" id="impw" autocomplete="current-password">${bad?'<p class="err">Mật khẩu chưa đúng, thử lại nhé.</p>':''}<div class="row" style="margin-top:16px"><button class="btn" data-a="impw">Mở file</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`);setTimeout(()=>$('#impw')&&$('#impw').focus(),50)}
function confirmImportSheet(r){const a=CozyBackup.summary(r.state),b=CozyBackup.summary(S);
  openSheet(`<h2>📥 Khôi phục dữ liệu?</h2>
  <div class="okline"><span>📄</span><span>File sao lưu${r.exportedAt?' ngày <b>'+fmtDate(r.exportedAt)+'</b>':''}: ${a.days} ngày, ${a.sleeps} đêm ngủ, ${a.candies} viên kẹo.</span></div>
  <div class="okline warn"><span>📱</span><span>Dữ liệu đang có trên máy: ${b.days} ngày, ${b.sleeps} đêm ngủ, ${b.candies} viên kẹo. Sẽ được <b>thay hết</b> bằng file.</span></div>
  <p class="muted">Yên tâm: app chụp lại dữ liệu hiện tại trước, nếu cần có thể "Quay lại" trong mục Bản chụp tự động.</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="doImport">Khôi phục</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`)}
async function replaceState(ns,label){
  await flush();
  if(hasData(S))await CozyDB.putSnapshot('safe-'+Date.now(),S,label).catch(()=>{});
  const keepLast=S.lastBackup;
  S=Object.assign(DEF(),ns);normalize();
  if(!S.lastBackup)S.lastBackup=keepLast;
  await CozyDB.replaceAll(S);
  snaps=null;demoNight=false;
}

/* ---------- Events ---------- */
document.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;
  if(t.id==='toast')return;
  if(t.dataset.tab){tab=t.dataset.tab;render();scrollTo({top:0,behavior:'smooth'});return}
  if(t.dataset.f){e.preventDefault();F[t.dataset.f]=isNaN(t.dataset.v)?t.dataset.v:+t.dataset.v;t.parentNode.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b===t));return}
  if(t.dataset.star){F.q=+t.dataset.star;t.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.star<=F.q));return}
  if(t.dataset.w!==undefined){const d=today(),i=+t.dataset.w;d.water=d.water===i+1?i:i+1;render();say(d.water>=8?'Đủ 8 ly rồi! '+S.name+' giỏi quá 🎉':'Thêm 1 ly nữa nè 💧 ('+d.water+'/8)');return}
  if(t.dataset.hair){S.hair=t.dataset.hair;render();return}
  if(t.dataset.hc){S.hairColor=t.dataset.hc;render();return}
  if(t.dataset.fav){S.fav=t.dataset.fav;render();say('Bộ "'+OUTFITS[S.fav].n+'" xinh quá đi! 💕');return}
  if(t.dataset.nw){S.nightWear=t.dataset.nw;render();say('Tối nay mặc '+OUTFITS[S.nightWear].n+' nha 🌙');return}
  if(t.dataset.wt){wtab=t.dataset.wt;render();return}
  if(t.dataset.look){const k=t.dataset.look;let v=t.dataset.lv;if(v==='true')v=true;else if(v==='false')v=false;if(k==='seasonWear')S.seasonWear=v;else S.look[k]=v;render();return}
  if(t.dataset.swap){S.autoSwap=!S.autoSwap;render();return}
  if(t.dataset.theme){S.theme=t.dataset.theme;render();if(isXmas())say('Giáng sinh tới rồi! 🎄 Mình đội mũ Noel nè');return}
  if(t.dataset.snd){S.sound=t.dataset.snd==='1';render();if(S.sound)gulp();return}
  if(t.dataset.act){startAct(t.dataset.act);return}
  if(t.dataset.roam){S.roam=t.dataset.roam==='1';render();wander();return}
  if(t.dataset.snap){const key=t.dataset.snap;const sn=await CozyDB.getSnapshot(key);if(!sn)return;
    openSheet(`<h2>🕰️ Quay lại bản chụp?</h2><p class="muted">Dữ liệu sẽ trở về như lúc <b>${fmtDate(sn.createdAt)}</b> (${Object.keys(sn.state.days||{}).length} ngày, ${(sn.state.sleeps||[]).length} đêm ngủ). Dữ liệu hiện tại được chụp lại trước.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="doSnap" data-k="${esc(key)}">Quay lại</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`);return}
  const a=t.dataset.a;if(!a)return;
  if(a==='checkin')checkinSheet();
  else if(a==='saveCheckin')saveCheckin();
  else if(a==='evening')eveningSheet();
  else if(a==='goSleep')goSleep();
  else if(a==='closeSheet'){closeSheet();pendingImport=null}
  else if(a==='export')doExport(t);
  else if(a==='import'){$('#impf').value='';$('#impf').click()}
  else if(a==='impw'){const pw=$('#impw').value;if(!pw||!pendingImport||!pendingImport.text)return;t.disabled=true;await readImport(pendingImport.text,pw)}
  else if(a==='doImport'){if(!pendingImport||!pendingImport.state)return;t.disabled=true;await replaceState(pendingImport.state,'Trước khi khôi phục từ file');pendingImport=null;closeSheet();tab='today';render();wander();say('Khôi phục xong rồi! Chào mừng '+S.name+' trở lại 💛',5000)}
  else if(a==='doSnap'){t.disabled=true;const sn=await CozyDB.getSnapshot(t.dataset.k);if(sn){await replaceState(sn.state,'Trước khi quay lại bản chụp');closeSheet();render();say('Đã quay lại bản chụp 🕰️')}}
  else if(a==='install'){if(installEvt){installEvt.prompt();const r=await installEvt.userChoice;installEvt=null;render();if(r.outcome==='accepted')say('Yay, Cozy Life đã ở trên màn hình chính! 📲')}}
  else if(a==='hideInstall'){S.hideInstall=true;render()}
  else if(a==='demoNight'){demoNight=!demoNight;render();wander();say(demoNight?'Gần đến giờ ngủ rồi, mình thay pijama nè 🌙':'Chào buổi sáng lại nè ☀️')}
  else if(a==='clearSample'){S.sleeps=S.sleeps.filter(x=>!x.sample);S.sample=false;render()}
  else if(a==='reset'){const q=$('#resetQ');if(q.classList.contains('hide')){q.classList.remove('hide');return}
    await replaceState(DEF(),'Trước khi xóa hết');tab='today';render();say('Làm lại từ đầu nha!')}
});
$('#impf').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;if(f.size>50*1024*1024){say('File lớn quá, không giống file sao lưu 🤔');return}readImport(await f.text())});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.t!==undefined){const d=today(),x=d.top3[+t.dataset.t];x.d=t.checked;render();const n=d.top3.filter(x=>x.d&&x.t).length;say(n===3?'Xong cả 3 việc! Ăn mừng thôi 🎆':t.checked?'Tuyệt vời! Xong một việc rồi ✅':'Không sao, làm lại sau nhé');return}
  if(t.dataset.tt!==undefined){today().top3[+t.dataset.tt].t=t.value.trim();save();return}
  if(t.id==='nm'){S.name=t.value.trim()||'bạn';render();return}
  if(t.id==='bt'&&t.value){S.bedTarget=t.value;render()}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='impw'){e.preventDefault();const b=document.querySelector('[data-a=impw]');b&&b.click()}});
document.addEventListener('submit',e=>{if(e.target.id!=='candyF')return;e.preventDefault();const v=$('#candy').value.trim();if(!v)return;today().candies.push(v);render();say('Thêm một viên kẹo ngọt ngào vào lọ rồi 🍬')});
$('#sheetbg').addEventListener('click',e=>{if(e.target.id==='sheetbg'){closeSheet();pendingImport=null}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
/* ---------- Chibi chạy lung tung ---------- */
const pet=$('#pet'),PW=84,PH=101,P={x:0,y:0,t:0,drag:false,down:null};
const rnd=(a,b)=>a+Math.random()*(b-a);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function bounds(){const nav=document.querySelector('nav').offsetHeight;return{minX:6,maxX:Math.max(6,innerWidth-PW-6),minY:70,maxY:Math.max(70,innerHeight-nav-PH-2)}}
function place(x,y,ms){pet.style.transition=ms?`transform ${ms}ms linear`:'none';pet.style.transform=`translate(${x}px,${y}px)`;P.x=x;P.y=y}
const IDLE=['Lalala~ 🎶','{n} uống nước chưa đó?','Hôm nay mình đi dạo nè!','Hihi 🤭','Có cần mình giúp gì không?','Nhớ vươn vai một chút nha 🙆'];
function low(){const c=today().checkin||{};return isNight()||c.mood==='sleepy'||c.body==='sick'||c.body==='tired'||(c.energy&&c.energy<=2)}
function wander(){clearTimeout(P.t);if(P.drag)return;if(P.act)endAct();const b=bounds();if(reduce||S.roam===false){pet.classList.remove('walking');place(b.maxX-6,b.maxY,600);return}let tx,ty;
  const lw=low();if(lw){ty=Math.random()<.85?b.maxY:rnd(b.maxY-160,b.maxY);tx=Math.min(b.maxX,Math.max(b.minX,P.x+rnd(-110,110)))}else if(Math.random()<.55){ty=b.maxY;tx=rnd(b.minX,b.maxX)}else{tx=rnd(b.minX,b.maxX);ty=rnd(b.minY,b.maxY)}
  const ms=Math.max(400,Math.hypot(tx-P.x,ty-P.y)/(lw?22:75)*1000);
  pet.classList.toggle('left',tx<P.x);pet.classList.remove('sitting');pet.classList.add('walking');place(tx,ty,ms);
  P.t=setTimeout(()=>{pet.classList.remove('walking');
    if(Math.random()<(lw?.4:.75))startAct();else{if(!lw&&Math.random()<.4)say(IDLE[Math.floor(Math.random()*IDLE.length)].replace('{n}',S.name),3200);if(lw)pet.classList.add('sitting');P.t=setTimeout(wander,lw?rnd(6000,14000):rnd(1500,3500))}},ms)}
const ACTS={drink:['Ực ực~ 💧 Mát ghê! {n} uống nước chưa? ({w}/8 ly) — chạm mình để cụng ly nha','Ực… ực… {n} cũng làm một ngụm đi 💧 ({w}/8 ly)'],
  boba:['Trà sữa trân châu ngon quá 🧋'],read:['Đọc sách xíu nè 📖','Chương này hay ghê!'],phone:['Lướt lướt xem có gì vui 📱'],laptop:['Gõ gõ… deadline dí quá 😵‍💫','Cố lên, sắp xong rồi!'],
  yawn:['Oáppp~ buồn ngủ ghê 🥱'],nap:['Chợp mắt xíu thôi… 💤'],tissue:['Hắt xììì! 🤧 {n} giữ ấm nha'],shiver:['Lạnh run luôn… 🥶 Nhớ mặc ấm nha'],
  teddy:['Ôm gấu một chút cho đỡ buồn 🧸','Không sao đâu, mình ở đây mà'],dance:['Lalala~ nhảy thôi 💃','Hôm nay vui quá đi!'],wave:['Hi {n}! 👋'],
  cocoa:['Ca cao nóng ấm bụng ghê ☕','Mùa đông mà có ly ca cao là nhất!'],gift:['Quà Giáng sinh nè 🎁 Không biết bên trong có gì ta?','Còn {x} ngày nữa là Giáng sinh rồi 🎄'],snowman:['Nặn người tuyết nè ⛄','Bạn người tuyết này tên gì ta?'],
  stretch:['Vươn vaiiii~ {n} cũng duỗi người chút nha 🙆'],breathe:['Hít vào… thở ra… 🌬️']};
const ACTNAME={drink:'💧 Uống nước',cocoa:'☕ Ca cao nóng',gift:'🎁 Mở quà',snowman:'⛄ Nặn người tuyết',boba:'🧋 Trà sữa',read:'📖 Đọc sách',phone:'📱 Lướt điện thoại',laptop:'💻 Chạy deadline',yawn:'🥱 Ngáp',nap:'💤 Chợp mắt',tissue:'🤧 Hắt xì',shiver:'🥶 Run lạnh',teddy:'🧸 Ôm gấu',dance:'💃 Nhảy',wave:'👋 Vẫy tay',stretch:'🙆 Vươn vai',breathe:'🌬️ Hít thở'};
let lastDrink=0;
function pickAct(){const d=today(),c=d.checkin||{},w={};const add=(k,n)=>w[k]=(w[k]||0)+n;
  add('wave',1);add('read',1);add('phone',1);
  if(isNight()){add('yawn',3);add('nap',2);add('read',2)}
  ({happy:()=>{add('dance',3);add('boba',2);add('wave',2)},calm:()=>{add('read',2);add('phone',2);add('stretch',1);add('boba',1)},sleepy:()=>{add('yawn',3);add('nap',3);add('stretch',1)},
    stress:()=>{add('laptop',3);add('breathe',3);add('stretch',1)},sad:()=>{add('teddy',4);add('breathe',1)}}[c.mood]||(()=>{add('read',1);add('stretch',1)}))();
  if(c.body==='sick'){Object.keys(w).forEach(k=>w[k]=k==='read'?1:0);add('tissue',3);add('shiver',3);add('nap',2)}
  if(c.body==='tired'){add('nap',2);add('yawn',2)}if(c.body==='sore')add('stretch',4);
  if(c.weather==='cold'&&c.body!=='sick')add('shiver',1);
  if(isXmas()){add('cocoa',2);if(c.body!=='sick'){add('gift',1);add('snowman',1)}}
  if(low()){['dance','laptop','wave','phone','gift','snowman'].forEach(k=>{if(w[k])w[k]=k==='wave'||k==='phone'?.4:0});add('nap',2);add('yawn',1);add('read',1)}
  if(d.water<8&&!isNight()&&Date.now()-lastDrink>40000&&Math.random()<.35)return 'drink';
  const tot=Object.values(w).reduce((a,b)=>a+b,0);let r=Math.random()*tot;for(const k in w){r-=w[k];if(r<=0)return k}return 'wave'}
let AC=null;document.addEventListener('pointerdown',()=>{try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();else if(AC.state==='suspended')AC.resume()}catch(e){}},true);
function gulp(){if(S.sound===false||!AC)return;try{const t0=AC.currentTime;[0,.32,.64].forEach(off=>{const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;o.type='sine';o.frequency.setValueAtTime(520,t0+off);o.frequency.exponentialRampToValueAtTime(130,t0+off+.13);g.gain.setValueAtTime(0,t0+off);g.gain.linearRampToValueAtTime(.32,t0+off+.02);g.gain.exponentialRampToValueAtTime(.001,t0+off+.17);o.connect(f);f.connect(g);g.connect(AC.destination);o.start(t0+off);o.stop(t0+off+.2)})}catch(e){}}
function floatTxt(t,cls,n){for(let i=0;i<n;i++){const h=document.createElement('span');h.className='heart '+cls;h.textContent=t;h.style.left=(cls==='gulp'?48+i*10:14+i*22)+'px';h.style.top=(cls==='gulp'?34:6)+'px';h.style.animationDelay=(i*(cls==='gulp'?.32:.25))+'s';pet.appendChild(h);setTimeout(()=>h.remove(),2400)}}
function endAct(){P.act=null;pet.className=pet.className.replace(/\bact-\S+/g,'').replace('sitting','').trim();drawChibi()}
function startAct(a){clearTimeout(P.t);if(P.act)endAct();a=a||pickAct();P.act=a;pet.classList.remove('walking');pet.classList.add('act-'+a);if(a==='nap')pet.classList.add('sitting');drawChibi();
  const lines=ACTS[a]||[''];say(lines[Math.floor(Math.random()*lines.length)].replace('{n}',S.name).replace('{w}',today().water).replace('{x}',daysToXmas()),a==='drink'?5200:4200);
  if(a==='drink'){lastDrink=Date.now();gulp();floatTxt('ực','gulp',3)}if(a==='dance')floatTxt('♪','note',3);if(a==='tissue')floatTxt('💨','note',1);
  if(a==='breathe')setTimeout(()=>{if(P.act==='breathe')say('…thở ra thật chậm 🍃',2600)},2200);
  const lw=low();P.t=setTimeout(()=>{endAct();P.t=setTimeout(wander,lw?rnd(3000,7000):rnd(800,2200))},a==='drink'?4200:a==='nap'?(lw?11000:6500):lw?rnd(6000,9000):rnd(4000,5600))}
function poke(){clearTimeout(P.t);pet.classList.remove('walking','sitting');const cur=getComputedStyle(pet).transform;if(cur&&cur!=='none'){const m=new DOMMatrix(cur);place(m.m41,m.m42,0)}
  const svg=pet.querySelector('svg');if(svg){svg.classList.remove('jump');void svg.offsetWidth;svg.classList.add('jump')}
  if(P.act==='drink'){const d=today();if(d.water<8)d.water++;save();if(tab==='today')render();say(d.water>=8?'Cụng ly! Đủ 8 ly rồi, '+S.name+' giỏi quá 🎉':'Cụng ly! 🥂 +1 ly ('+d.water+'/8)');endAct()}
  else{if(P.act)endAct();say(PRAISE[Math.floor(Math.random()*PRAISE.length)].replace('{n}',S.name))}
  for(let i=0;i<3;i++){const h=document.createElement('span');h.className='heart';h.textContent=['💖','💗','✨'][i];h.style.left=(18+i*18)+'px';h.style.animationDelay=i*.12+'s';pet.appendChild(h);setTimeout(()=>h.remove(),1800)}
  P.t=setTimeout(wander,2600)}
pet.addEventListener('pointerdown',e=>{P.down={x:e.clientX,y:e.clientY,ox:e.clientX-P.x,oy:e.clientY-P.y};pet.setPointerCapture(e.pointerId)});
pet.addEventListener('pointermove',e=>{if(!P.down)return;if(!P.drag&&Math.hypot(e.clientX-P.down.x,e.clientY-P.down.y)>8){P.drag=true;clearTimeout(P.t);pet.classList.remove('walking','sitting');pet.classList.add('held');say('Úi, bay lên rồi! 🙈',2000)}
  if(P.drag){const b=bounds();place(Math.min(b.maxX,Math.max(b.minX,e.clientX-P.down.ox)),Math.min(b.maxY,Math.max(0,e.clientY-P.down.oy)),0)}});
pet.addEventListener('pointerup',()=>{const was=P.drag;P.down=null;P.drag=false;pet.classList.remove('held');if(was){say('Hihi, chỗ này cũng được nè!',2500);P.t=setTimeout(wander,2500)}else poke()});
pet.addEventListener('pointercancel',()=>{P.down=null;P.drag=false;pet.classList.remove('held');P.t=setTimeout(wander,1500)});
pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();poke()}});
addEventListener('resize',()=>{const b=bounds();place(Math.min(P.x,b.maxX),Math.min(P.y,b.maxY),0)});
{const b=bounds();place(b.maxX-10,b.maxY,0)}
$('#wake').addEventListener('click',()=>{$('#sleepcover').classList.remove('on');demoNight=false;render();wander();checkinSheet();say('Chào buổi sáng '+S.name+'! Đêm qua ngủ ngon không?')});

{const sn=$('#snow');for(let i=0;i<30;i++){const f=document.createElement('i');const z=3+Math.random()*6;f.style.cssText=`left:${Math.random()*100}%;width:${z}px;height:${z}px;animation-duration:${8+Math.random()*10}s;animation-delay:${-Math.random()*18}s;opacity:${.5+Math.random()*.5}`;sn.appendChild(f)}}
render();
P.t=setTimeout(wander,1200);
/* Nếu tối qua đã bấm "Đi ngủ" mà chưa bấm "Mình dậy rồi" thì hiện lại màn hình ngủ */
if(S.pendingBed&&(Date.now()-new Date(S.pendingBed))<16*36e5&&isNight()){$('#chibiSleep').innerHTML=chibi({mood:'sleep',outfit:'pj',sleep:true});$('#gn').textContent='Chúc '+S.name+' ngủ ngon 🌙';$('#gnTime').textContent='Đã ghi giờ đi ngủ: '+hm(new Date(S.pendingBed));$('#sleepcover').classList.add('on')}
else if(S.pendingBed&&!today().checkin)say('Chào buổi sáng '+S.name+'! Làm Check-in để ghi giờ dậy nhé ☀️');
else if(!today().checkin&&!isNight())say('Chào '+S.name+'! Mình làm Check-in '+(new Date().getHours()<12?'buổi sáng':'hôm nay')+' nhé?');
else if(isNight())say('Sắp đến giờ ngủ rồi, '+S.name+' ơi 🌙');
setInterval(()=>{if(!$('#sheetbg').classList.contains('on'))drawChibi()},60000);

/* ---------- Offline & cập nhật bản mới ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  const toast=$('#toast');let reloading=false;
  const showUpdate=w=>{toast.textContent='✨ Có bản Cozy Life mới. Chạm để cập nhật';toast.classList.remove('hide');toast.onclick=async()=>{toast.textContent='Đang cập nhật…';await flush();w.postMessage('skipWaiting')}};
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
  navigator.serviceWorker.register('sw.js').then(reg=>{
    if(reg.waiting&&navigator.serviceWorker.controller)showUpdate(reg.waiting);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)showUpdate(w)})});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
  }).catch(e=>console.warn('SW',e));
}
})();
