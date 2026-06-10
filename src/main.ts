import './style.css';
import { AssetLoader, type AssetId } from './assets';
import { drawSprite } from './sprites';
import { dialogue } from './content/dialogue';
import { creatures, hazards } from './content/hazards';
import { interactables } from './content/interactables';
import { items as supplies } from './content/items';
import { blockedBridge, locations as buildings, mapBoundaries, worldSize } from './content/locations';
import { genericNpcPortrait, npcs } from './content/npcs';
import { tasks } from './content/tasks';
import type { DialogueSpeaker, Rect } from './content/types';

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
const WORLD = worldSize;
const player = { x: 335, y: 700, w: 24, h: 30, speed: 185, energy: 100, points: 0 };
const camera = { x: 0, y: 0 };
const keys = new Set<string>();
let actionQueued = false, dialogueOpen = true, inspectionOpen = false, toastTimer = 0, hazardTick = 0;

const obstacles: Rect[] = [...buildings, ...mapBoundaries];
const cliffSign = interactables.find(({ id }) => id === 'cliffSign')!;
const diningDelivery = interactables.find(({ id }) => id === 'diningDelivery')!;
const state = { talked:false, inventory: [] as string[], delivered:false };
function isDone(id:string) { return id === 'talked' || id === 'delivered' ? state[id] : id === 'bridge' ? false : supplies.find(s=>s.id===id)?.done; }
function objective() { const task = tasks.find(({id})=>!isDone(id)); return task?.label ?? 'Report to the Rally Circle'; }
function refreshUI() {
  ui.energy.style.width = `${player.energy}%`; ui.points.textContent = `${player.points} SP`;
  const best = Number(localStorage.getItem('campQuestBest') || 0); ui.best.textContent = `BEST ${Math.max(best, player.points)}`;
  ui.objective.textContent = objective(); ui.tasks.innerHTML = tasks.map(({id,label})=>`<li class="${isDone(id)?'done':''}">${label}</li>`).join('');
}
function showDialogue(speaker:DialogueSpeaker, text:string) {
  const displayName=speaker.displayName ?? speaker.label ?? 'Camp Staff';
  dialogueOpen=true; ui.speaker.textContent=displayName; ui.text.textContent=text;
  ui.dialogue.style.setProperty('--dialogue-accent', speaker.accent ?? '#a43f28');
  ui.dialogue.classList.remove('portrait-missing'); ui.portraitPanel.classList.remove('hidden'); ui.portrait.alt=`Portrait of ${displayName}`;
  ui.portrait.onerror=()=>{ui.dialogue.classList.add('portrait-missing');ui.portraitPanel.classList.add('hidden');ui.portrait.removeAttribute('src');};
  ui.portrait.src=speaker.portraits?.default ?? genericNpcPortrait; ui.dialogue.classList.remove('hidden');
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
  if(dist(player,cliffSign)<100){inspectImage(cliffSign.title!, cliffSign.assetId!, cliffSign.caption!);return;}
  const npc=npcs.filter(n=>n.id!=='cliff').sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(npc&&dist(player,npc)<80){ if(npc.id==='coop'&&!state.talked){state.talked=true;award(25);} showDialogue(npc,dialogue[npc.dialogueId][state.talked?1:0]);return; }
  const item=supplies.filter(s=>!s.done).sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(item&&dist(player,item)<70){item.done=true;state.inventory.push(item.id);award(50);toast(`${item.label} recovered! +50 SP`);refreshUI();return;}
  if(intersects(player,diningDelivery)&&state.inventory.includes('crate')&&!state.delivered){state.delivered=true;state.inventory=state.inventory.filter(i=>i!=='crate');award(100);toast('Crate delivered! +100 SP');refreshUI();return;}
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
  hazards.forEach(h=>{if(h.assetId&&drawSprite(ctx,assets,h.assetId,h))return;ctx.globalAlpha=.7;ctx.fillStyle=h.kind==='mud'?'#69553c':h.kind==='wet'?'#68a9c7':'#738044';ctx.beginPath();ctx.ellipse(h.x+h.w/2,h.y+h.h/2,h.w/2,h.h/2,0,0,7);ctx.fill();ctx.globalAlpha=1;text(h.kind==='mosquitoes'?'•  •  •':h.label,h.x+h.w/2,h.y+h.h/2,10,'#e9dcaf')});
  creatures.forEach(creature=>{if(!drawSprite(ctx,assets,creature.assetId,creature)){ctx.fillStyle='#52634d';ctx.fillRect(creature.x,creature.y,creature.w,creature.h);}text(creature.label,creature.x+creature.w/2,creature.y-5,10,'#fff3ae')});
  buildings.forEach(b=>{ctx.fillStyle=b.color!;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#4d2e20';ctx.beginPath();ctx.moveTo(b.x-10,b.y);ctx.lineTo(b.x+b.w/2,b.y-38);ctx.lineTo(b.x+b.w+10,b.y);ctx.fill();ctx.fillStyle='#e8c47b';ctx.fillRect(b.x+b.w/2-15,b.y+b.h-40,30,40);text(b.label,b.x+b.w/2,b.y+b.h+18,12)});
  ctx.fillStyle='#6d4b2f';ctx.fillRect(blockedBridge.x,blockedBridge.y,blockedBridge.w,blockedBridge.h);ctx.fillStyle='#d65b38';for(let i=0;i<4;i++)ctx.fillRect(blockedBridge.x+5+i*18,blockedBridge.y+5,9,90);text(blockedBridge.label,blockedBridge.x+blockedBridge.w/2,blockedBridge.y+blockedBridge.h+20,12,'#ffd76d');
  if(!drawSprite(ctx,assets,'cliffSign',cliffSign)){ctx.fillStyle='#fff';ctx.fillRect(cliffSign.x,cliffSign.y,cliffSign.w,92);ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.strokeRect(cliffSign.x,cliffSign.y,cliffSign.w,92);text('BEWARE',cliffSign.x+37,cliffSign.y+21,10,'#e33');text('of',cliffSign.x+37,cliffSign.y+38,9,'#e33');text('CLIFF!',cliffSign.x+37,cliffSign.y+57,11,'#e33');ctx.strokeStyle='#e33';ctx.strokeRect(cliffSign.x+17,cliffSign.y+65,40,20);ctx.beginPath();ctx.arc(cliffSign.x+37,cliffSign.y+75,8,0,7);ctx.stroke();}
  supplies.filter(s=>!s.done).forEach(s=>{if(!(s.assetId&&drawSprite(ctx,assets,s.assetId,s,s.sprite))){ctx.fillStyle=s.id==='crate'?'#c58a45':'#ffe16b';ctx.fillRect(s.x,s.y,s.w,s.h);}text(s.label,s.x+s.w/2,s.y-6,10,'#fff3ae')});
  npcs.forEach(n=>{ctx.fillStyle=n.id==='cliff'?'#342c43':n.id==='crazyjoe'?'#cf6f38':'#386d95';ctx.beginPath();ctx.arc(n.x+n.w/2,n.y+10,10,0,7);ctx.fill();ctx.fillRect(n.x,n.y+18,n.w,n.h-18);text(n.label,n.x+n.w/2,n.y-7,11,n.id==='cliff'?'#b8a5c7':'#fff')});
  if(!drawSprite(ctx,assets,'player',player,{width:24,height:38,offsetY:4})){ctx.fillStyle='#edb13d';ctx.beginPath();ctx.arc(player.x+12,player.y+9,10,0,7);ctx.fill();ctx.fillStyle='#d95637';ctx.fillRect(player.x,player.y+18,24,12);ctx.fillStyle='#254c76';ctx.fillRect(player.x+3,player.y+29,7,9);ctx.fillRect(player.x+14,player.y+29,7,9);}text('YOU',player.x+12,player.y-6,10,'#fff');ctx.restore();
}
let last=performance.now();function loop(now:number){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);if(toastTimer>0&&(toastTimer-=dt)<=0)ui.toast.classList.add('hidden');draw();requestAnimationFrame(loop);}
const keyMap:Record<string,string>={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
addEventListener('keydown',e=>{if(keyMap[e.key]){keys.add(keyMap[e.key]);e.preventDefault();}if([' ','e','E'].includes(e.key)){actionQueued=true;e.preventDefault();}if(e.key==='Escape'){closeDialogue();closeInspection();}});addEventListener('keyup',e=>{if(keyMap[e.key])keys.delete(keyMap[e.key]);});
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>{const dir=b.dataset.dir!;const on=(e:Event)=>{e.preventDefault();keys.add(dir);b.classList.add('pressed')},off=()=>{keys.delete(dir);b.classList.remove('pressed')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
document.querySelector('#close-inspection')!.addEventListener('click',closeInspection);ui.inspection.addEventListener('click',e=>{if(e.target===ui.inspection)closeInspection();});
document.querySelector('#action-button')!.addEventListener('pointerdown',e=>{e.preventDefault();actionQueued=true});document.querySelector('#checklist-button')!.addEventListener('click',()=>ui.checklist.classList.toggle('open'));document.querySelector('#close-checklist')!.addEventListener('click',()=>ui.checklist.classList.remove('open'));
showDialogue(npcs[0], dialogue.opening[0]);refreshUI();requestAnimationFrame(loop);
