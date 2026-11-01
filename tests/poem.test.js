import test from 'node:test';
import assert from 'node:assert/strict';
import { acts, stills, heartPoint, heartbeatAt } from '../src/love.poem.js';
import { SceneManager } from '../src/core/SceneManager.js';

test('六幕自然播完只停在终章，重播回到唯一时间轴起点',()=>{
  const timeline=new SceneManager(acts);timeline.start();
  const visited=new Set();
  for(let frame=0;frame<Math.ceil(timeline.duration*60)+1;frame++){timeline.tick(1/60);visited.add(timeline.state.index);}
  assert.equal(visited.size,6);assert.equal(timeline.time,172);
  assert.equal(timeline.state.index,5);assert.equal(timeline.playing,false);
  timeline.toggle();assert.equal(timeline.time,0);assert.equal(timeline.playing,true);
});
test('暂停、跨幕与预设均保持有效的局部时间',()=>{
  const timeline=new SceneManager(acts);timeline.start();timeline.tick(5);timeline.toggle();timeline.tick(10);assert.equal(timeline.time,5);
  for(const preset of stills.filter(s=>s.act>=0)){timeline.seek(preset.act,preset.seconds);assert.equal(timeline.state.index,preset.act);assert.ok(Math.abs(timeline.state.local-preset.seconds)<1e-9);}
  timeline.seek(-5);assert.equal(timeline.state.index,0);
  timeline.seek(100,1000);assert.equal(timeline.state.index,5);assert.ok(timeline.state.local<acts[5].duration);
});
test('心脏坐标闭合、左右对称，心跳没有无穷值或异常缩放',()=>{
  const start=heartPoint(0),end=heartPoint(Math.PI*2);assert.ok(Math.abs(start.x-end.x)<1e-10);assert.ok(Math.abs(start.y-end.y)<1e-10);
  for(let i=0;i<1000;i++){
    const a=i/1000*Math.PI*2,p=heartPoint(a,.2),q=heartPoint(-a,.2);
    assert.ok(Math.abs(p.x+q.x)<1e-10);assert.ok(Math.abs(p.y-q.y)<1e-10);
    const beat=heartbeatAt(i/60);assert.ok(Number.isFinite(beat)&&beat>=1&&beat<1.08);
  }
});
