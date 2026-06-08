import './style.css';
import { AssetLoader, type AssetId } from './assets';
import { drawSprite } from './sprites';

type Rect = { x: number; y: number; w: number; h: number };
type Thing = Rect & { id: string; label: string; color?: string; done?: boolean };
type PortraitSet = { default?: string; happy?: string; serious?: string; surprised?: string };
type DialogueSpeaker = { displayName?: string; label?: string; accent?: string; portraits?: PortraitSet };
type NPC = Thing & DialogueSpeaker & { lines: string[] };
type Hazard = Thing & { kind: 'mud' | 'mosquitoes' | 'wet' };

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const assets = new AssetLoader();
assets.loadAll();
const ui = {
  objective: document.querySelector('#objective')!, energy: document.querySelector<HTMLElement>('#energy-bar')!,
  points: document.querySelector('#points')!, best: document.querySelector('#best')!, tasks: document.querySelector('#tasks')!,
  dialogue: document.querySelector<HTMLElement>('#dialogue')!, speaker: document.querySelector('#speaker')!, text: document.querySelector('#dialogue-text')!,
  portraitPanel: document.querySelector('#portrait-panel')!, portrait: document.querySelector<HTMLImageElement>('#dialogue-portrait')!,
  toast: document.querySelector('#toast')!, checklist: document.querySelector('#checklist')!,
  inspection: document.querySelector('#image-inspection')!, inspectionImage: document.querySelector<HTMLImageElement>('#inspection-image')!,
  inspectionTitle: document.querySelector('#inspection-title')!, inspectionCaption: document.querySelector('#inspection-caption')!,
  inspectionFallback: document.querySelector('#inspection-fallback')!,
};
const WORLD = { w: 1500, h: 1000 };
const player = { x: 335, y: 700, w: 24, h: 30, speed: 185, energy: 100, points: 0 };
const camera = { x: 0, y: 0 };
const keys = new Set<string>();
let actionQueued = false, dialogueOpen = true, inspectionOpen = false, toastTimer = 0, hazardTick = 0;

const buildings: Thing[] = [
  { id:'office', label:'WELCOME CENTER', x:100,y:610,w:210,h:125,color:'#ae6837' },
  { id:'dining', label:'DINING HALL', x:360,y:465,w:225,h:125,color:'#a96532' },
  { id:'shed', label:'SUPPLY SHED', x:165,y:280,w:150,h:105,color:'#7d5532' },
  { id:'shower', label:'SHOWER HOUSE', x:765,y:335,w:165,h:130,color:'#a96e3e' },
  { id:'chapel', label:'RALLY CIRCLE', x:370,y:160,w:190,h:105,color:'#9d6538' },
  { id:'gym', label:'GYM', x:670,y:675,w:180,h:120,color:'#986137' },
  { id:'store', label:'PHILIPPIANS', x:565,y:850,w:190,h:105,color:'#a56636' },
  { id:'dumpster', label:'DUMPSTER', x:1005,y:615,w:110,h:70,color:'#315c4c' },
];
const obstacles: Rect[] = [...buildings, {x:1260,y:0,w:35,h:1000}, {x:1250,y:390,w:250,h:28}];
const cliffSign: Thing = { id:'cliffSign', label:'Beware of Cliff!', x:1175, y:300, w:74, h:110 };
const GENERIC_NPC_PORTRAIT = 'assets/portraits/generic-npc-portrait.png';
const npcs: NPC[] = [
  { id:'coop',label:'Coop',displayName:'Coop',accent:'#a43f28',portraits:{default:'assets/portraits/coop-npc-portrait.png'},x:290,y:570,w:28,h:34,lines:['Morning bell rang! Service Crew is ready. Unfortunately, the supplies are not.','Find the missing mop, broom, gloves, and trash bags. Service Crew Rule #1: the thing you need is never where it belongs.'] },
  { id:'ethan',label:'Ethan',displayName:'Ethan',accent:'#386d95',x:585,y:415,w:28,h:34,lines:['Program borrowed a supply crate for a skit. We returned... a different crate?','Bring a crate from the Supply Shed to the Dining Hall when you find one.'] },
  { id:'gweggowy',label:'Gweggowy',displayName:'Gweggowy',accent:'#80552a',x:470,y:300,w:28,h:34,lines:['Camp readiness report: cheerful, promising, and currently missing one mop.','Finish the checklist and report to the Rally Circle!'] },
  { id:'crazyjoe',label:'Crazy Joe',displayName:'Crazy Joe',accent:'#cf6f38',x:1130,y:325,w:28,h:34,lines:['The Back 40 is not ready for Service Crew... yet. Nature Skills training starts another day!','Until then, respect the wildlife and never challenge a vulture to a staring contest.'] },
  { id:'cliff',label:'Cliff?',displayName:'Cliff?',accent:'#684f78',x:1370,y:250,w:28,h:34,lines:['...','A shadow slips deeper into the Back 40.'] },
];
const supplies: Thing[] = [
  {id:'mop',label:'Mop',x:620,y:570,w:22,h:26},{id:'broom',label:'Broom',x:890,y:790,w:22,h:26},
  {id:'gloves',label:'Gloves',x:330,y:350,w:24,h:20},{id:'bags',label:'Trash Bags',x:1110,y:540,w:25,h:23},
  {id:'crate',label:'Supply Crate',x:110,y:410,w:30,h:28},
];
const hazards: Hazard[] = [
  {id:'mud1',label:'Mud',kind:'mud',x:600,y:300,w:100,h:65},{id:'wet1',label:'Wet Floor',kind:'wet',x:860,y:500,w:85,h:50},
  {id:'bugs1',label:'Mosquitoes',kind:'mosquitoes',x:1020,y:220,w:105,h:80},{id:'bugs2',label:'Mosquitoes',kind:'mosquitoes',x:735,y:580,w:80,h:65},
];
const state = { talked:false, inventory: [] as string[], delivered:false };
const taskDefs = [
  ['talked','Get the checklist from Coop'],['mop','Find the missing mop'],['broom','Find the promoted-to-missing broom'],
  ['gloves','Find the cleaning gloves'],['bags','Find the trash bags'],['delivered','Deliver a supply crate to Dining Hall'],['bridge','Investigate the blocked Back 40 bridge'],
];

function isDone(id:string) { return id === 'talked' || id === 'delivered' ? state[id] : id === 'bridge' ? false : supplies.find(s=>s.id===id)?.done; }
function objective() { const task = taskDefs.find(([id])=>!isDone(id)); return task?.[1] ?? 'Report to the Rally Circle'; }
function refreshUI() {
  ui.energy.style.width = `${player.energy}%`; ui.points.textContent = `${player.points} SP`;
  const best = Number(localStorage.getItem('campQuestBest') || 0); ui.best.textContent = `BEST ${Math.max(best, player.points)}`;
  ui.objective.textContent = objective(); ui.tasks.innerHTML = taskDefs.map(([id,label])=>`<li class="${isDone(id)?'done':''}">${label}</li>`).join('');
}
function showDialogue(speaker:DialogueSpeaker, text:string) {
  const displayName=speaker.displayName ?? speaker.label ?? 'Camp Staff';
  dialogueOpen=true; ui.speaker.textContent=displayName; ui.text.textContent=text;
  ui.dialogue.style.setProperty('--dialogue-accent', speaker.accent ?? '#a43f28');
  ui.dialogue.classList.remove('portrait-missing'); ui.portraitPanel.classList.remove('hidden'); ui.portrait.alt=`Portrait of ${displayName}`;
  ui.portrait.onerror=()=>{ui.dialogue.classList.add('portrait-missing');ui.portraitPanel.classList.add('hidden');ui.portrait.removeAttribute('src');};
  ui.portrait.src=speaker.portraits?.default ?? GENERIC_NPC_PORTRAIT; ui.dialogue.classList.remove('hidden');
}
function closeDialogue(){ dialogueOpen=false; ui.dialogue.classList.add('hidden'); }
function inspectImage(title:string, assetId:AssetId, caption:string){
  inspectionOpen=true; keys.clear(); ui.inspectionTitle.textContent=title; ui.inspectionCaption.textContent=caption;
  ui.inspectionImage.classList.remove('hidden'); ui.inspectionFallback.classList.add('hidden'); ui.inspectionImage.alt=title;
  ui.inspectionFallback.textContent=`${title} image unavailable`;
  ui.inspectionImage.onerror=()=>{ui.inspectionImage.classList.add('hidden');ui.inspectionFallback.classList.remove('hidden');};
  ui.inspectionImage.src=assets.url(assetId); ui.inspection.classList.remove('hidden');
}
function closeInspection(){inspectionOpen=false;ui.inspection.classList.add('hidden');}
function toast(text:string){ ui.toast.textContent=text;ui.toast.classList.remove('hidden');toastTimer=2.2; }
function dist(a:Rect,b:Rect){ return Math.hypot(a.x+a.w/2-b.x-b.w/2,a.y+a.h/2-b.y-b.h/2); }
function intersects(a:Rect,b:Rect){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function award(points:number){player.points+=points;localStorage.setItem('campQuestBest',String(Math.max(player.points,Number(localStorage.getItem('campQuestBest')||0))));}
function interact(){
  if(inspectionOpen){closeInspection();return;}
  if(dialogueOpen){closeDialogue();return;}
  if(dist(player,cliffSign)<100){inspectImage('Beware of Cliff!', 'cliffSignInspection', 'Someone scratched a strange symbol beneath the warning. Beyond it, misplaced crates block the bridge to the Back 40.');return;}
  const npc=npcs.filter(n=>n.id!=='cliff').sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(npc&&dist(player,npc)<80){ if(npc.id==='coop'&&!state.talked){state.talked=true;award(25);} showDialogue(npc,npc.lines[state.talked?1:0]);return; }
  const item=supplies.filter(s=>!s.done).sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(item&&dist(player,item)<70){item.done=true;state.inventory.push(item.id);award(50);toast(`${item.label} recovered! +50 SP`);refreshUI();return;}
  if(intersects(player,{x:350,y:430,w:250,h:180})&&state.inventory.includes('crate')&&!state.delivered){state.delivered=true;state.inventory=state.inventory.filter(i=>i!=='crate');award(100);toast('Crate delivered! +100 SP');refreshUI();return;}
  toast('Nothing useful nearby. Service Crew Rule #2: check the weirdest place first.');
}
function move(dx:number,dy:number){const old={x:player.x,y:player.y};player.x+=dx;if(obstacles.some(o=>intersects(player,o)))player.x=old.x;player.y+=dy;if(obstacles.some(o=>intersects(player,o)))player.y=old.y;player.x=Math.max(5,Math.min(WORLD.w-player.w-5,player.x));player.y=Math.max(5,Math.min(WORLD.h-player.h-5,player.y));}
function update(dt:number){
  if(actionQueued){actionQueued=false;interact();}
  if(dialogueOpen||inspectionOpen)return;
  let x=(keys.has('right')?1:0)-(keys.has('left')?1:0),y=(keys.has('down')?1:0)-(keys.has('up')?1:0);const len=Math.hypot(x,y)||1;
  const hazard=hazards.find(h=>intersects(player,h));let speed=player.speed*(hazard&&hazard.kind!=='mosquitoes'?.55:1);move(x/len*speed*dt,y/len*speed*dt);
  hazardTick-=dt;if(hazard?.kind==='mosquitoes'&&hazardTick<=0){player.energy=Math.max(0,player.energy-4);hazardTick=.5;toast('Mosquito cloud! Energy -4');refreshUI();}
  camera.x=Math.max(0,Math.min(WORLD.w-canvas.width,player.x-canvas.width/2));camera.y=Math.max(0,Math.min(WORLD.h-canvas.height,player.y-canvas.height/2));
}
function text(t:string,x:number,y:number,size=13,color='#fff8df'){ctx.font=`900 ${size}px Nunito`;ctx.textAlign='center';ctx.fillStyle='#19301d';ctx.fillText(t,x+1,y+1);ctx.fillStyle=color;ctx.fillText(t,x,y);}
function drawTree(x:number,y:number){ctx.fillStyle='#543b21';ctx.fillRect(x-4,y+10,8,18);ctx.fillStyle='#285c30';ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fill();ctx.fillStyle='#36733a';ctx.beginPath();ctx.arc(x-7,y-7,11,0,7);ctx.fill();}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.fillStyle='#78a956';ctx.fillRect(0,0,WORLD.w,WORLD.h);
  ctx.strokeStyle='#d0b67a';ctx.lineWidth=42;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(200,730);ctx.lineTo(430,650);ctx.lineTo(720,555);ctx.lineTo(1000,470);ctx.lineTo(1230,410);ctx.moveTo(450,650);ctx.lineTo(470,260);ctx.moveTo(720,555);ctx.lineTo(800,800);ctx.stroke();
  for(let x=40;x<1450;x+=95)for(let y=55;y<950;y+=130)if(!obstacles.some(o=>intersects({x:x-20,y:y-25,w:40,h:55},o))&&((x+y)%4!==0))drawTree(x,y);
  hazards.forEach(h=>{if(h.kind==='mosquitoes'&&drawSprite(ctx,assets,'mosquitoes',h))return;ctx.globalAlpha=.7;ctx.fillStyle=h.kind==='mud'?'#69553c':h.kind==='wet'?'#68a9c7':'#738044';ctx.beginPath();ctx.ellipse(h.x+h.w/2,h.y+h.h/2,h.w/2,h.h/2,0,0,7);ctx.fill();ctx.globalAlpha=1;text(h.kind==='mosquitoes'?'•  •  •':h.label,h.x+h.w/2,h.y+h.h/2,10,'#e9dcaf')});
  buildings.forEach(b=>{ctx.fillStyle=b.color!;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#4d2e20';ctx.beginPath();ctx.moveTo(b.x-10,b.y);ctx.lineTo(b.x+b.w/2,b.y-38);ctx.lineTo(b.x+b.w+10,b.y);ctx.fill();ctx.fillStyle='#e8c47b';ctx.fillRect(b.x+b.w/2-15,b.y+b.h-40,30,40);text(b.label,b.x+b.w/2,b.y+b.h+18,12)});
  ctx.fillStyle='#6d4b2f';ctx.fillRect(1240,370,70,100);ctx.fillStyle='#d65b38';for(let i=0;i<4;i++)ctx.fillRect(1245+i*18,375,9,90);text('BRIDGE CLOSED · DAY 1',1275,490,12,'#ffd76d');
  if(!drawSprite(ctx,assets,'cliffSign',cliffSign)){ctx.fillStyle='#fff';ctx.fillRect(1175,300,74,92);ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.strokeRect(1175,300,74,92);text('BEWARE',1212,321,10,'#e33');text('of',1212,338,9,'#e33');text('CLIFF!',1212,357,11,'#e33');ctx.strokeStyle='#e33';ctx.strokeRect(1192,365,40,20);ctx.beginPath();ctx.arc(1212,375,8,0,7);ctx.stroke();}
  supplies.filter(s=>!s.done).forEach(s=>{if(s.id==='mop'&&drawSprite(ctx,assets,'mop',s,{width:30,height:42,offsetY:-6})){text(s.label,s.x+s.w/2,s.y-6,10,'#fff3ae');return;}ctx.fillStyle=s.id==='crate'?'#c58a45':'#ffe16b';ctx.fillRect(s.x,s.y,s.w,s.h);text(s.label,s.x+s.w/2,s.y-6,10,'#fff3ae')});
  npcs.forEach(n=>{ctx.fillStyle=n.id==='cliff'?'#342c43':n.id==='crazyjoe'?'#cf6f38':'#386d95';ctx.beginPath();ctx.arc(n.x+n.w/2,n.y+10,10,0,7);ctx.fill();ctx.fillRect(n.x,n.y+18,n.w,n.h-18);text(n.label,n.x+n.w/2,n.y-7,11,n.id==='cliff'?'#b8a5c7':'#fff')});
  if(!drawSprite(ctx,assets,'player',player,{width:24,height:38,offsetY:4})){ctx.fillStyle='#edb13d';ctx.beginPath();ctx.arc(player.x+12,player.y+9,10,0,7);ctx.fill();ctx.fillStyle='#d95637';ctx.fillRect(player.x,player.y+18,24,12);ctx.fillStyle='#254c76';ctx.fillRect(player.x+3,player.y+29,7,9);ctx.fillRect(player.x+14,player.y+29,7,9);}text('YOU',player.x+12,player.y-6,10,'#fff');ctx.restore();
}
let last=performance.now();function loop(now:number){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);if(toastTimer>0&&(toastTimer-=dt)<=0)ui.toast.classList.add('hidden');draw();requestAnimationFrame(loop);}
const keyMap:Record<string,string>={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
addEventListener('keydown',e=>{if(keyMap[e.key]){keys.add(keyMap[e.key]);e.preventDefault();}if([' ','e','E'].includes(e.key)){actionQueued=true;e.preventDefault();}if(e.key==='Escape'){closeDialogue();closeInspection();}});addEventListener('keyup',e=>{if(keyMap[e.key])keys.delete(keyMap[e.key]);});
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>{const dir=b.dataset.dir!;const on=(e:Event)=>{e.preventDefault();keys.add(dir);b.classList.add('pressed')},off=()=>{keys.delete(dir);b.classList.remove('pressed')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
document.querySelector('#close-inspection')!.addEventListener('click',closeInspection);ui.inspection.addEventListener('click',e=>{if(e.target===ui.inspection)closeInspection();});
document.querySelector('#action-button')!.addEventListener('pointerdown',e=>{e.preventDefault();actionQueued=true});document.querySelector('#checklist-button')!.addEventListener('click',()=>ui.checklist.classList.toggle('open'));document.querySelector('#close-checklist')!.addEventListener('click',()=>ui.checklist.classList.remove('open'));
showDialogue(npcs[0], 'Morning bell! Find me by the Welcome Center. The supplies have apparently begun their annual migration.');refreshUI();requestAnimationFrame(loop);
