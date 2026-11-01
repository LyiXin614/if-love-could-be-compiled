import test from 'node:test';
import assert from 'node:assert/strict';
import { bloomAt, confessionAt, HeartMorphSystem } from '../src/effects/HeartMorphSystem.js';
import { decodeFrame } from '../src/effects/motion.js';
import { layoutText, TextAtlas } from '../src/effects/TextLayout.js';
import { acts, emotionalScore, stills } from '../src/love.poem.js';

test('心脏先蓄势、静默、扩散、回归，边界无瞬移且运动可重放',()=>{
  const heart=new HeartMorphSystem(),point={phase:1.2,v:.7};
  assert.ok(bloomAt(11).charge>0);
  assert.equal(bloomAt(12.3).silence,true);
  assert.equal(bloomAt(12.3).spread,0);
  assert.ok(bloomAt(16).spread>.8);
  assert.equal(bloomAt(23).spread,0);
  assert.equal(bloomAt(23).restored,1);
  for(let t=0;t<34;t+=.025){
    const a={...heart.offset(point,heart.frame(3,t,68+t))};
    const b={...heart.offset(point,heart.frame(3,t+.001,68+t+.001))};
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<2,'回归曲线连续');
    assert.deepEqual(a,{...heart.offset(point,heart.frame(3,t,68+t))});
  }
});
test('终章只做一次心诗心变形，阅读阶段稳定，最后不重新破碎',()=>{
  assert.equal(confessionAt(0).toPoem,0);
  assert.equal(confessionAt(15).toPoem,1);
  assert.equal(confessionAt(15).toHeart,0);
  assert.equal(confessionAt(15).clear,1);
  for(const time of [27,36,100,1000]){
    const frame=confessionAt(time);assert.equal(frame.toHeart,1);assert.equal(frame.clear,0);
  }
  const heart=new HeartMorphSystem();assert.equal(heart.frame(3,15,83).interactive,false);assert.equal(heart.frame(5,15,151).interactive,false);assert.equal(heart.frame(5,32,168).interactive,true);
  assert.ok(emotionalScore.interactionCooldown>=.5);
});
test('解码起点、中文终点及扰动帧都可复现',()=>{
  const target='直到你成为唯一的例外。',source='heartbeat = Infinity;';
  assert.equal(decodeFrame(target,source,0),source);
  assert.equal(decodeFrame(target,source,5),target);
  assert.equal(decodeFrame(target,source,1.4),decodeFrame(target,source,1.4));
  assert.notEqual(decodeFrame(target,source,1.4),target);
});
test('长诗按 measureText 换行，所有幕诗句与备选预设保留有效范围',()=>{
  const ctx={font:'',measureText(text){const size=Number.parseFloat(this.font)||34;return {width:[...text].length*size};}};
  const layout=layoutText(ctx,['一行很长很长的诗句需要被完整阅读，而不能被悄悄裁切。'],{size:36,maxWidth:300});
  assert.ok(layout.lines.length>1);assert.ok(layout.widths.every(w=>w<=300));
  assert.equal(layout.lines.join(''),'一行很长很长的诗句需要被完整阅读，而不能被悄悄裁切。');
  for(const preset of stills.filter(s=>s.act>=0))assert.ok(preset.seconds>=0&&preset.seconds<acts[preset.act].duration);
});
test('光迹沿闭合字形边界行进，包含内孔而非水平遮罩',()=>{
  const w=12,h=12,data=new Uint8ClampedArray(w*h*4);
  for(let y=2;y<10;y++)for(let x=2;x<10;x++)if(!(x>=4&&x<8&&y>=4&&y<8))data[(y*w+x)*4+3]=255;
  const atlas={image:{data,width:w,height:h},center:6,baseline:6,layout:{size:8,lineHeight:12},contours:null};
  const contours=new TextAtlas().contours(atlas);
  assert.equal(contours.length,2);
  for(const loop of contours)assert.deepEqual(loop[0],loop[loop.length-1]);
});
