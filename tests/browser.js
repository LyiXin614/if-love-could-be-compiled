import { acts, stills } from '../src/love.poem.js';
import { Renderer } from '../src/core/Renderer.js';
import { ParticleSystem } from '../src/effects/ParticleSystem.js';
import { PoetryAnimation } from '../src/effects/PoetryAnimation.js';
import { TextAtlas, layoutText } from '../src/effects/TextLayout.js';
let canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
await document.fonts.ready;
const atlas=new TextAtlas(),particles=new ParticleSystem(5600,atlas),renderer=new Renderer(canvas,particles,new PoetryAnimation(atlas));
const report=document.querySelector('#report');
const start=index=>acts.slice(0,index).reduce((sum,act)=>sum+act.duration,0);
const state=(index,local,capture=false,count=3800)=>({index,local,time:start(index)+local,cover:index<0,capture,count,pointer:{x:0,y:0,active:false},touch:0});
const hashPixels=()=>{
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;
  for(let i=0;i<pixels.length;i+=16)hash=Math.imul(hash^pixels[i],16777619);
  return hash>>>0;
};
const draw=frame=>renderer.render(ctx,canvas.width,canvas.height,frame);
const assert=(condition,message)=>{if(!condition)throw Error(message);};
document.querySelector('#verify').onclick=async()=>{
  const lines=[];report.textContent='测试中…';
  try{
    canvas.width=1600;canvas.height=900;
    // 像素回读可能触发浏览器后端切换，先完成两帧绘制与回读预热。
    for(let warmup=0;warmup<2;warmup++){draw(state(0,16));hashPixels();}
    const frames=[[0,16],[1,3],[1,12],[2,6.8],[2,12],[3,11],[3,12.3],[3,16],[3,21],[3,25.1],[3,31],[4,15],[4,21.3],[5,2],[5,7],[5,15],[5,23],[5,32]];
    for(const [index,local] of frames){
      draw(state(index,local));const before=hashPixels();
      draw(state(index,local));const after=hashPixels();
      assert(before===after,`同一时间重绘不一致：${index}/${local}`);
    }
    lines.push(`PASS: ${frames.length} 个动态中间帧重复绘制像素哈希完全一致。`);
    for(const preset of stills){
      draw(state(preset.act,preset.seconds,true,5600));const before=hashPixels();
      draw(state(2,8));draw(state(preset.act,preset.seconds,true,5600));
      assert(before===hashPixels(),`预设受切换历史污染：${preset.name}`);
    }
    lines.push(`PASS: ${stills.length} 个预设离开再返回后像素完全一致。`);
    const mask=atlas.get(acts[5].poems,{size:42,minSize:38,maxWidth:1200});
    assert(mask.points.length>500,'中文掩码为空');
    assert(atlas.contours(mask).length>20,'中文轮廓缺失');
    assert(mask.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'字形坐标无效');
    lines.push(`PASS: 中文掩码 ${mask.points.length} 点，闭合轮廓 ${mask.contours.length} 条。`);
    for(const act of acts){const layout=layoutText(ctx,act.poems,{size:38,minSize:30,maxWidth:1180});assert(layout.widths.every(width=>width<=1180),'文字越界');}
    lines.push('PASS: 六幕诗句使用真实字体测量，所有行均在 1180 逻辑像素内。');
    for(let i=0;i<60;i++)atlas.get([`回归测试 ${i}`],{size:32,maxWidth:400});
    assert(atlas.cache.size<=24,'字形缓存超出上限');lines.push('PASS: 60 条不同文字后 LRU 缓存仍 ≤ 24 条。');
    canvas.width=3840;canvas.height=2160;draw(state(5,15,true,5600));
    const pixels=ctx.getImageData(0,0,3840,2160).data;
    let opaque=true,bright=0;
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]!==255)opaque=false;if(pixels[i]>180)bright++;}
    assert(opaque&&bright>1000,'4K 画布透明或文字缺失');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));assert(blob&&blob.size>100000,'4K 编码失败');
    lines.push(`PASS: 3840×2160 全不透明，${bright} 个明亮像素，PNG ${blob.size} bytes。`);
    report.textContent=lines.join('\n')+'\nALL BROWSER CHECKS PASSED';
  }catch(error){report.textContent=lines.join('\n')+'\nFAIL: '+error.message;console.error(error);}
};
document.querySelector('#benchmark').onclick=async()=>{
  // 字形/像素回读的上下文可能走软件路径；性能测试新建与作品相同的默认上下文。
  const fresh=document.createElement('canvas');fresh.id='test-canvas';canvas.replaceWith(fresh);canvas=fresh;ctx=canvas.getContext('2d',{alpha:false});
  canvas.width=1920;canvas.height=1080;
  report.textContent='测量中：低、中、高各 120 帧；含 30 帧预热，不包含整页 DOM。';
  const results=[];
  for(const [quality,count] of [['low',2200],['medium',3800],['high',5600]]){
    const costs=[],cadence=[];let previous=0;
    for(let i=0;i<150;i++){
      const timestamp=await new Promise(requestAnimationFrame);
      const before=performance.now();draw(state(3,25+i/60,false,count));const cost=performance.now()-before;
      if(i>=30){costs.push(cost);if(previous)cadence.push(timestamp-previous);}previous=timestamp;
    }
    costs.sort((a,b)=>a-b);
    results.push({quality,frames:costs.length,meanRenderMs:+(costs.reduce((a,b)=>a+b,0)/costs.length).toFixed(2),p95RenderMs:+costs[Math.floor(costs.length*.95)].toFixed(2),observedCadenceFPS:+(1000/(cadence.reduce((a,b)=>a+b,0)/cadence.length)).toFixed(1)});
    report.textContent=JSON.stringify(results,null,2)+'\n这是一台机器的独立画布测量，不代表所有设备或整页稳定帧率。';
  }
  report.textContent+='\nBENCHMARK COMPLETE';
};
document.querySelector('#phase').onchange=event=>{
  canvas.width=1600;canvas.height=900;
  const phases={decode:[1,3],particles:[2,6.8],light:[3,25.1],spatial:[4,21.3],burst:[3,16],'to-poem':[5,7],'to-heart':[5,23]};
  const [index,local]=phases[event.target.value];draw(state(index,local));
  report.textContent=`确定性中间帧：第 ${index+1} 幕 ${local} 秒。`;
};
draw(state(1,3));
