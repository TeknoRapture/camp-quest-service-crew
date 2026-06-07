import './style.css';
import { AssetLoader, type AssetId } from './assets';
import { drawSprite } from './sprites';

type Rect = { x: number; y: number; w: number; h: number };
type Thing = Rect & { id: string; label: string; color?: string; done?: boolean };
type NPC = Thing & { lines: string[] };
type Hazard = Thing & { kind: 'mud' | 'mosquitoes' | 'wet' };

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const assets = new AssetLoader();
assets.loadAll();
const ui = {
  objective: document.querySelector('#objective')!, energy: document.querySelector<HTMLElement>('#energy-bar')!,
  points: document.querySelector('#points')!, best: document.querySelector('#best')!, tasks: document.querySelector('#tasks')!,
  dialogue: document.querySelector('#dialogue')!, speaker: document.querySelector('#speaker')!, text: document.querySelector('#dialogue-text')!,
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
const npcs: NPC[] = [
  { id:'coop',label:'Coop',x:290,y:570,w:28,h:34,lines:['Morning bell rang! Service Crew is ready. Unfortunately, the supplies are not.','Find the missing mop, broom, gloves, and trash bags. Service Crew Rule #1: the thing you need is never where it belongs.'] },
  { id:'ethan',label:'Ethan',x:585,y:415,w:28,h:34,lines:['Program borrowed a supply crate for a skit. We returned... a different crate?','Bring a crate from the Supply Shed to the Dining Hall when you find one.'] },
  { id:'greggerwy',label:'Greggerwy',x:470,y:300,w:28,h:34,lines:['Camp readiness report: cheerful, promising, and currently missing one mop.','Finish the checklist and report to the Rally Circle!'] },
  { id:'crazyjoe',label:'Crazy Joe',x:1130,y:325,w:28,h:34,lines:['The Back 40 is not ready for Service Crew... yet. Nature Skills training starts another day!','Until then, respect the wildlife and never challenge a vulture to a staring contest.'] },
  { id:'cliff',label:'Cliff?',x:1370,y:250,w:28,h:34,lines:['...','A shadow slips deeper into the Back 40.'] },
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
const supplySprites: Record<string, AssetId> = { mop:'mop', broom:'broom', gloves:'gloves', bags:'bags', crate:'crate' };
const hazardSprites: Record<Hazard['kind'], AssetId> = { mud:'mud', wet:'wet', mosquitoes:'mosquitoes' };
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
function showDialogue(speaker:string, text:string) { dialogueOpen=true; ui.speaker.textContent=speaker; ui.text.textContent=text; ui.dialogue.classList.remove('hidden'); }
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
  if(npc&&dist(player,npc)<80){ if(npc.id==='coop'&&!state.talked){state.talked=true;award(25);} showDialogue(npc.label,npc.lines[state.talked?1:0]);return; }
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
function drawTree(x:number,y:number){
  ctx.fillStyle='#1d4528';ctx.beginPath();ctx.ellipse(x+2,y+17,19,8,0,0,7);ctx.fill();
  ctx.fillStyle='#634421';ctx.fillRect(x-4,y+7,8,24);ctx.fillStyle='#24592f';ctx.beginPath();ctx.arc(x,y,19,0,7);ctx.fill();
  ctx.fillStyle='#397642';ctx.beginPath();ctx.arc(x-8,y-8,12,0,7);ctx.fill();ctx.fillStyle='#70a850';ctx.fillRect(x-10,y-13,5,4);
}
function drawTerrain(){
  ctx.fillStyle='#78a956';ctx.fillRect(0,0,WORLD.w,WORLD.h);
  ctx.fillStyle='#82b45e';for(let x=18;x<WORLD.w;x+=48)for(let y=18;y<WORLD.h;y+=48)if((x+y)%3)ctx.fillRect(x,y,3,8);
  ctx.fillStyle='#5d9348';for(let x=35;x<WORLD.w;x+=72)for(let y=42;y<WORLD.h;y+=68)if((x*y)%5)ctx.fillRect(x,y,5,3);
  ctx.fillStyle='#5b9eb1';ctx.beginPath();ctx.ellipse(1390,760,190,120,-.2,0,7);ctx.fill();ctx.strokeStyle='#a8d4c2';ctx.lineWidth=8;ctx.stroke();text('MILNER LAKE',1380,760,13,'#e8f5d5');
  ctx.strokeStyle='#b69761';ctx.lineWidth=50;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(200,730);ctx.lineTo(430,650);ctx.lineTo(720,555);ctx.lineTo(1000,470);ctx.lineTo(1230,410);ctx.moveTo(450,650);ctx.lineTo(470,260);ctx.moveTo(720,555);ctx.lineTo(800,800);ctx.stroke();
  ctx.strokeStyle='#d6bd80';ctx.lineWidth=35;ctx.stroke();ctx.setLineDash([4,16]);ctx.strokeStyle='#ead39b';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);
}
function drawBuilding(b:Thing){
  ctx.fillStyle='#315b35';ctx.fillRect(b.x+8,b.y+10,b.w,b.h);
  ctx.fillStyle=b.color!;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#603b25';ctx.lineWidth=4;ctx.strokeRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle='#533121';ctx.beginPath();ctx.moveTo(b.x-10,b.y);ctx.lineTo(b.x+b.w/2,b.y-40);ctx.lineTo(b.x+b.w+10,b.y);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#7b4d2b';ctx.lineWidth=3;for(let y=b.y+12;y<b.y+b.h-15;y+=20){ctx.beginPath();ctx.moveTo(b.x+5,y);ctx.lineTo(b.x+b.w-5,y);ctx.stroke();}
  ctx.fillStyle='#e9c578';ctx.fillRect(b.x+b.w/2-16,b.y+b.h-42,32,42);ctx.fillStyle='#4b3524';ctx.fillRect(b.x+b.w/2+8,b.y+b.h-22,3,3);
  ctx.fillStyle='#9fd3d1';ctx.fillRect(b.x+18,b.y+28,28,24);ctx.fillRect(b.x+b.w-46,b.y+28,28,24);ctx.strokeStyle='#f1dfad';ctx.lineWidth=3;ctx.strokeRect(b.x+18,b.y+28,28,24);ctx.strokeRect(b.x+b.w-46,b.y+28,28,24);
  text(b.label,b.x+b.w/2,b.y+b.h+19,12,'#fff6cf');
}
function drawLandmarks(){
  ctx.strokeStyle='#704929';ctx.lineWidth=6;ctx.beginPath();ctx.arc(465,205,62,0,7);ctx.stroke();ctx.fillStyle='#b77b3d';for(let a=0;a<7;a++){const x=465+Math.cos(a*.9)*53,y=205+Math.sin(a*.9)*53;ctx.fillRect(x-7,y-4,14,8);}
  ctx.fillStyle='#345847';ctx.fillRect(1005,615,110,70);ctx.fillStyle='#203e34';ctx.fillRect(998,606,124,15);ctx.strokeStyle='#b8c6af';ctx.lineWidth=3;ctx.strokeRect(1005,615,110,70);
  ctx.fillStyle='#6c482b';ctx.fillRect(1240,370,70,100);ctx.fillStyle='#d45b39';for(let i=0;i<4;i++)ctx.fillRect(1245+i*18,375,9,90);text('BRIDGE CLOSED · DAY 1',1275,490,12,'#ffd76d');
}
function drawHazard(h:Hazard){
  if(drawSprite(ctx,assets,hazardSprites[h.kind],h))return;
  ctx.globalAlpha=.75;ctx.fillStyle=h.kind==='mud'?'#69553c':h.kind==='wet'?'#68a9c7':'#738044';ctx.beginPath();ctx.ellipse(h.x+h.w/2,h.y+h.h/2,h.w/2,h.h/2,0,0,7);ctx.fill();ctx.globalAlpha=1;text(h.kind==='mosquitoes'?'•  •  •':h.label,h.x+h.w/2,h.y+h.h/2,10,'#e9dcaf');
}
function drawSupply(s:Thing){
  const sprite=supplySprites[s.id];if(sprite&&drawSprite(ctx,assets,sprite,s,{width:s.id==='crate'?38:34,height:s.id==='crate'?36:44,offsetY:-5})){text(s.label,s.x+s.w/2,s.y-9,10,'#fff3ae');return;}
  ctx.fillStyle=s.id==='crate'?'#c58a45':'#ffe16b';ctx.fillRect(s.x,s.y,s.w,s.h);text(s.label,s.x+s.w/2,s.y-6,10,'#fff3ae');
}
function drawNpc(n:NPC){
  ctx.fillStyle='#254d30';ctx.beginPath();ctx.ellipse(n.x+n.w/2,n.y+n.h+2,17,5,0,0,7);ctx.fill();ctx.fillStyle=n.id==='cliff'?'#342c43':n.id==='crazyjoe'?'#cf6f38':'#386d95';ctx.beginPath();ctx.arc(n.x+n.w/2,n.y+10,10,0,7);ctx.fill();ctx.fillRect(n.x,n.y+18,n.w,n.h-18);ctx.fillStyle='#f4d28b';ctx.fillRect(n.x+6,n.y+20,n.w-12,5);text(n.label,n.x+n.w/2,n.y-7,11,n.id==='cliff'?'#d2bfda':'#fff');
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);drawTerrain();
  for(let x=40;x<1450;x+=95)for(let y=55;y<950;y+=130)if(!obstacles.some(o=>intersects({x:x-20,y:y-25,w:40,h:55},o))&&((x+y)%4!==0))drawTree(x,y);
  hazards.forEach(drawHazard);buildings.forEach(drawBuilding);drawLandmarks();
  if(!drawSprite(ctx,assets,'cliffSign',cliffSign)){ctx.fillStyle='#fff';ctx.fillRect(1175,300,74,92);ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.strokeRect(1175,300,74,92);text('BEWARE',1212,321,10,'#e33');text('of',1212,338,9,'#e33');text('CLIFF!',1212,357,11,'#e33');}
  supplies.filter(s=>!s.done).forEach(drawSupply);npcs.forEach(drawNpc);
  ctx.fillStyle='#17351f66';ctx.beginPath();ctx.ellipse(player.x+12,player.y+39,14,4,0,0,7);ctx.fill();
  if(!drawSprite(ctx,assets,'player',player,{width:32,height:46,offsetY:8})){ctx.fillStyle='#edb13d';ctx.beginPath();ctx.arc(player.x+12,player.y+9,10,0,7);ctx.fill();ctx.fillStyle='#d95637';ctx.fillRect(player.x,player.y+18,24,12);ctx.fillStyle='#254c76';ctx.fillRect(player.x+3,player.y+29,7,9);ctx.fillRect(player.x+14,player.y+29,7,9);}text('YOU',player.x+12,player.y-8,10,'#fff');ctx.restore();
}
let last=performance.now();function loop(now:number){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);if(toastTimer>0&&(toastTimer-=dt)<=0)ui.toast.classList.add('hidden');draw();requestAnimationFrame(loop);}
const keyMap:Record<string,string>={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
addEventListener('keydown',e=>{if(keyMap[e.key]){keys.add(keyMap[e.key]);e.preventDefault();}if([' ','e','E'].includes(e.key)){actionQueued=true;e.preventDefault();}if(e.key==='Escape'){closeDialogue();closeInspection();}});addEventListener('keyup',e=>{if(keyMap[e.key])keys.delete(keyMap[e.key]);});
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>{const dir=b.dataset.dir!;const on=(e:Event)=>{e.preventDefault();keys.add(dir);b.classList.add('pressed')},off=()=>{keys.delete(dir);b.classList.remove('pressed')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
document.querySelector('#close-inspection')!.addEventListener('click',closeInspection);ui.inspection.addEventListener('click',e=>{if(e.target===ui.inspection)closeInspection();});
document.querySelector('#action-button')!.addEventListener('pointerdown',e=>{e.preventDefault();actionQueued=true});document.querySelector('#checklist-button')!.addEventListener('click',()=>ui.checklist.classList.toggle('open'));document.querySelector('#close-checklist')!.addEventListener('click',()=>ui.checklist.classList.remove('open'));
showDialogue('Coop', 'Morning bell! Find me by the Welcome Center. The supplies have apparently begun their annual migration.');refreshUI();requestAnimationFrame(loop);
