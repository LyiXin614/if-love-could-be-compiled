import { acts, stills, emotionalScore } from './love.poem.js';
import { SceneManager } from './core/SceneManager.js';
import { PerformanceManager } from './core/PerformanceManager.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { Renderer } from './core/Renderer.js';
import { Sound } from './core/Sound.js';
import { TextAtlas } from './effects/TextLayout.js';
import { PoetryAnimation } from './effects/PoetryAnimation.js';

const $=id=>document.getElementById(id);
const canvas=$('art'),ctx=canvas.getContext('2d',{alpha:false});
const timeline=new SceneManager(acts),performanceManager=new PerformanceManager();
const atlas=new TextAtlas();
const particles=new ParticleSystem(5600,atlas),renderer=new Renderer(canvas,particles,new PoetryAnimation(atlas)),sound=new Sound();
const pointer={x:0,y:0,active:false};
let visualTime=0,last=0,touchAt=-100,capture=false,coverStill=false,resume=false,toastTimer,lastIndex=-1;
let width=innerWidth,height=innerHeight;
const clock=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
function resize(){width=innerWidth;height=innerHeight;canvas.width=Math.round(width*performanceManager.dpr);canvas.height=Math.round(height*performanceManager.dpr);}
window.addEventListener('resize',resize);resize();
function notify(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function seek(index,seconds=0){timeline.seek(index,seconds);visualTime=timeline.time;touchAt=-100;pointer.x=pointer.y=0;pointer.active=false;coverStill=false;renderer.alternative=-1;sync();}
function sync(){
  document.body.classList.toggle('started',timeline.started&&!coverStill);
  document.body.classList.toggle('capturing',capture);
  $('capture-panel').hidden=!capture;
  $('play').textContent=timeline.playing?'暂停':'播放';
  const {index,local,act}=timeline.state;
  $('clock').textContent=`${clock(timeline.time)} / ${clock(timeline.duration)}`;
  $('progress').firstElementChild.style.width=`${timeline.time/timeline.duration*100}%`;
  [...$('chapters').children].forEach((b,i)=>{b.classList.toggle('active',index===i);b.setAttribute('aria-current',index===i?'step':'false');});
  $('final-actions').hidden=!timeline.started||index!==5||local<29||capture;
  if(index!==lastIndex){$('reading').textContent=`第${index+1}幕：${act.name}。${act.poems.join('')}`;lastIndex=index;}
}
acts.forEach((act,index)=>{const b=document.createElement('button');b.textContent=`0${index+1} ${act.name}`;b.title=`跳至第${index+1}幕：${act.name}`;b.onclick=()=>{seek(index);timeline.playing=true;sync();};$('chapters').appendChild(b);});
function start(){timeline.start();visualTime=0;touchAt=-100;pointer.x=pointer.y=0;pointer.active=false;coverStill=false;renderer.alternative=-1;sync();}
$('start').onclick=start;$('replay-end').onclick=start;
$('play').onclick=()=>{timeline.toggle();coverStill=false;sync();};
$('prev').onclick=()=>seek(timeline.state.index-1);
$('next').onclick=()=>seek(timeline.state.index+1);
function setCapture(enabled){
  if(enabled===capture)return;
  capture=enabled;
  if(capture){resume=timeline.playing;timeline.playing=false;coverStill=!timeline.started;}
  else{timeline.playing=resume;coverStill=false;}
  sync();
}
$('capture').onclick=() =>setCapture(true);$('capture-end').onclick=()=>setCapture(true);$('exit-capture').onclick=()=>setCapture(false);
stills.forEach((still,index)=>{const button=document.createElement('button');button.dataset.preset=index;button.textContent=index===3?'C · 诗行':still.name;$('presets').appendChild(button);button.onclick=()=>{
  renderer.alternative=-1;
  if(still.act<0)coverStill=true;else{seek(still.act,still.seconds);coverStill=false;}
  visualTime=still.act<0?8:timeline.time;touchAt=-100;sync();
};});
function changePoem(){renderer.alternative=(renderer.alternative+1)%4;notify('已切换诗句 · 切换幕次可恢复原诗');}
$('poem').onclick=changePoem;
$('quality').onchange=event=>{performanceManager.mode=event.target.value;performanceManager.samples=[];resize();notify(`粒子质量：${{high:'高',medium:'中',low:'低'}[performanceManager.quality]}`);};
$('sound').onclick=async()=>{try{const on=await sound.toggle();$('sound').textContent=`声音 ${on?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(on));}catch{notify('浏览器未能启用声音，视觉演出仍可继续。');}};
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('当前浏览器不支持全屏，可使用 F11。');}}
$('fullscreen').onclick=fullscreen;
async function showSource(){
  try{const response=await fetch('./src/love.poem.js');if(!response.ok)throw Error();$('source-code').textContent=await response.text();$('source-dialog').showModal();}
  catch{notify('请通过本地服务器启动，以阅读源代码。');}
}
$('source-end').onclick=showSource;$('close-source').onclick=()=>$('source-dialog').close();
function state(){const {index,local}=timeline.state;return {index,local,time:visualTime,cover:coverStill||!timeline.started,capture,pointer:capture?{x:0,y:0,active:false}:pointer,touch:capture?0:Math.exp(-(visualTime-touchAt)*3),count:capture?5600:performanceManager.count};}
async function exportPNG(){
  const button=$('export');button.disabled=true;button.textContent='正在生成…';
  try{
    await document.fonts.ready;
    const output=document.createElement('canvas');output.width=3840;output.height=2160;
    renderer.render(output.getContext('2d',{alpha:false}),3840,2160,{...state(),capture:true,count:5600,pointer:{x:0,y:0,active:false}});
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob)throw Error('empty PNG');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`如果浪漫可以被编译-${state().cover?'封面':acts[timeline.state.index].name}-4K.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    notify('4K PNG 已生成，请查看浏览器下载。');
  }catch(error){console.error(error);notify('导出未成功；可在定格模式下按 F11，再使用 Win + Shift + S 截图。');}
  finally{button.disabled=false;button.textContent='保存 4K PNG ↓';}
}
$('export').onclick=exportPNG;
canvas.addEventListener('pointermove',event=>{if(capture||(timeline.started&&!timeline.playing&&timeline.time<timeline.duration))return;pointer.x=event.clientX/width*2-1;pointer.y=event.clientY/height*2-1;pointer.active=true;});
canvas.addEventListener('pointerleave',()=>{if(capture||(timeline.started&&!timeline.playing&&timeline.time<timeline.duration))return;pointer.active=false;pointer.x=pointer.y=0;});
canvas.addEventListener('click',event=>{
  const x=event.clientX/width*1600,y=event.clientY/height*900;
  const {index,local}=timeline.state;
  const morph=particles.heart.frame(index,local,visualTime,!timeline.started);
  const cx=index===4&&local<19?1160:timeline.started?800:1120;
  const heartVisible=!timeline.started||index>=3||(index===1&&local>8);
  if(heartVisible&&!capture&&morph.interactive&&visualTime-touchAt>=emotionalScore.interactionCooldown&&(!timeline.started||timeline.playing||timeline.time>=timeline.duration)&&Math.hypot(x-cx,y-407)<280){touchAt=visualTime;sound.note(160,.35,.025);}
});
window.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)||$('source-dialog').open)return;
  const key=event.key.toLowerCase();
  if(key===' '&&document.activeElement.tagName==='BUTTON')return;
  if([' ','arrowleft','arrowright','s','f','p','r'].includes(key))event.preventDefault();
  if(key==='s')setCapture(!capture);
  if(capture)return;
  if(key===' '){timeline.toggle();sync();}
  if(key==='arrowleft')seek(timeline.state.index-1);
  if(key==='arrowright')seek(timeline.state.index+1);
  if(key==='r')start();if(key==='p')changePoem();if(key==='f')fullscreen();
});
document.addEventListener('visibilitychange',()=>{last=0;});
let lastUI=0,lastPaint='';
function frame(now){
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;
  if(!document.hidden){
    timeline.tick(dt);
    if(!capture&&(!timeline.started||timeline.playing||timeline.time>=timeline.duration))visualTime+=dt;
    if(!capture&&timeline.playing&&performanceManager.sample(dt))resize();
    const picture=state();
    const paintKey=[visualTime,timeline.time,capture,coverStill,timeline.started,canvas.width,canvas.height,performanceManager.count,renderer.alternative,pointer.x,pointer.y,pointer.active,touchAt].join('|');
    if(paintKey!==lastPaint){renderer.render(ctx,canvas.width,canvas.height,picture);lastPaint=paintKey;}
    sound.update(timeline.state.index,timeline.state.local,timeline.playing&&!capture);
    if(now-lastUI>100){sync();lastUI=now;}
  }
  requestAnimationFrame(frame);
}
document.fonts.ready.then(()=>{atlas.clear();lastPaint='';});
sync();requestAnimationFrame(frame);
