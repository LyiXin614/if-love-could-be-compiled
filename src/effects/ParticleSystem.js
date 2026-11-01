import { heartPoint, acts } from '../love.poem.js';
import { HeartMorphSystem } from './HeartMorphSystem.js';
import { TextAtlas, MONO } from './TextLayout.js';
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,t)=>a+(b-a)*t;
function randomGenerator(seed) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};}

export class ParticleSystem {
  constructor(count=5600, atlas=new TextAtlas()) {
    this.atlas=atlas;
    this.heart=new HeartMorphSystem();
    this.batch=new Float32Array(count*4);
    this.buckets=new Uint8Array(count);
    const random=randomGenerator(14022026);
    this.points=Array.from({length:count},(_,i)=>{
      const angle=random()*Math.PI*2;
      const radius=Math.sqrt(random());
      const heart=heartPoint(angle,(random()-.5)*.52, .18+.82*Math.pow(radius,.5));
      return { ...heart, u:random(),v:random(),phase:random()*Math.PI*2,speed:.3+random()*.7,
        size:.4+random()*1.2,alpha:.15+random()*.65, gold:random()>.92,
        glyph:['0','1','<3','∞','{ }',';'][i%6] };
    });
    // 光点的出生地是真正的代码字位；留白不会生成字符碎片。
    const measure=document.createElement('canvas').getContext('2d');measure.font=`21px ${MONO}`;
    this.codeSeeds=acts[2].code.split('\n').flatMap((line,row)=>[...line].flatMap((glyph,column)=>glyph===' '?[]:[{glyph,x:357+measure.measureText(line.slice(0,column)).width,y:345+row*30}]));
    this.stars=Array.from({length:270},()=>({x:random()*1600,y:random()*900,z:random(),p:random()*6}));
    this.sprite=document.createElement('canvas'); this.sprite.width=this.sprite.height=32;
    const s=this.sprite.getContext('2d');const gradient=s.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'#fff');gradient.addColorStop(.12,'#ffe7f1');gradient.addColorStop(.3,'#ff92bdab');gradient.addColorStop(1,'#ff719900');s.fillStyle=gradient;s.fillRect(0,0,32,32);
  }
  draw(ctx,{index,local,time,cover,pointer,touch,count}) {
    const morph=this.heart.frame(index,local,time,cover,touch);
    const t=morph.motionTime;
    ctx.save();
    for(const s of this.stars){
      const x=(s.x+Math.sin(t*.025+s.p)*8+pointer.x*s.z*8+1600)%1600;
      const y=(s.y-t*(.25+s.z*.7)+1800)%900;
      ctx.globalAlpha=(.2+s.z*.42)*(.7+.3*Math.sin(t*.6+s.p))*(1+morph.energy*.12);
      ctx.fillStyle=s.z>.8?'#e5d3e0':'#9baedc';ctx.fillRect(x,y,s.z> .94?1.5:.8,s.z>.94?1.5:.8);
    }
    ctx.globalAlpha=1;
    const flower=index===2;
    const final=index===5;
    let formation=cover?1:index===1?smooth((local-8)/9):index===2?1-smooth(local/3):index<3?0:index===3?smooth(local/8):1;
    const poetry=index===4;
    const centered=poetry?smooth((local-19)/5):0;
    const toLetter=poetry?smooth(local/5):0;
    let cx=cover?1120:poetry?mix(mix(800,1160,toLetter),800,centered):800;
    let cy=cover?405:poetry?mix(mix(407,450,toLetter),390,centered):407;
    let scale=cover?240:index===1?180:index===2?mix(180,220,smooth(local/4)):poetry?mix(mix(220,180,toLetter),175,centered):220;
    if(final) {scale=185;cy=365;}
    const pulse=morph.pulse;
    const turn=Math.sin(t*.14)*(morph.eternal?.34:.23)+pointer.x*.095;
    const cos=Math.cos(turn),sin=Math.sin(turn);
    const dissolve=flower?smooth((local-4)/16):index===1?smooth((local-6)/12):1;
    const confession=morph.confession;
    const word=confession?confession.toPoem*(1-confession.toHeart):0;
    const targetAtlas=final?this.atlas.get(acts[5].poems,{size:42,minSize:38,maxWidth:1200}):null;
    const wordTargets=targetAtlas?.points;
    ctx.globalCompositeOperation='lighter';
    // 大范围薄雾比重复绘制阴影更轻盈，也更节省每帧开销。
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.6);
    glow.addColorStop(0,`rgba(${morph.awakening?'123,156,255':'238,89,145'},${.12*(cover?1:formation)*morph.brightness*(1-word)})`);glow.addColorStop(.55,'rgba(115,65,152,.035)');glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(cx-scale*1.6,cy-scale*1.6,scale*3.2,scale*3.2);
    const colors=morph.awakening?['#b5d2ff','#c3ceff','#f4bfdb']:morph.heat<.5&&!cover?['#a4baff','#d4c0ff','#f5adce']:['#ff94bc','#ffd6b2','#ffe7f1'];
    colors.push('#ffd6a0');
    this.buckets.fill(255);
    for(let i=0;i<Math.min(count,this.points.length);i++) {
      const p=this.points[i];
      if(morph.awakening&&p.u>morph.density&&i%8!==0)continue;
      const seed=this.codeSeeds[i%this.codeSeeds.length];
      const driftX=p.u*1800-100+Math.sin(t*.13*p.speed+p.phase)*55;
      const driftY=p.v*1000-50+Math.cos(t*.12+p.phase)*45;
      let x,y,z=p.z;
      if(cover||formation>0){
        const bloom=this.heart.offset(p,morph);
        const breathing=pulse*(1+Math.sin(t*.5+p.phase)*.007)*bloom.compression;
        const depth=1+z*.32;
        const hx=(p.x*cos+z*1.7*sin)*scale*breathing*depth+bloom.x;
        const hy=p.y*scale*breathing*depth+z*pointer.y*10+bloom.y;
        x=mix(driftX,cx+hx,formation);y=mix(driftY,cy+hy,formation);
        if(i%13===0){const escape=Math.sin(t*.35+p.phase);x+=escape*18;y+=Math.cos(t*.3+p.phase)*18;}
      }else if(flower){
        const originX=seed.x,originY=seed.y;
        const spread=smooth((local-3-p.v*5)/12);
        const a=p.u*Math.PI*2+t*.025;
        const r=(140+390*p.v)*(1+.18*Math.sin(5*a));
        x=mix(originX,800+Math.cos(a)*r*1.65,spread);
        y=mix(originY,410+Math.sin(a)*r*.64,spread);
      }else if(index===1){
        const a=p.u*Math.PI*2;
        const r=80+p.v*200+Math.sin(t*4-p.v*4)*8;
        x=mix(310+(i%65)*7.7,800+Math.cos(a)*r,dissolve);
        y=mix(260+(Math.floor(i/65)%12)*25,400+Math.sin(a)*r*.65,dissolve);
      }else {x=driftX;y=driftY;}
      if(final&&wordTargets.length){
        const target=wordTargets[Math.floor(i/Math.min(count,this.points.length)*wordTargets.length)];
        const a=p.phase+local*.22;
        const release=Math.sin(word*Math.PI)*(75+p.v*160);
        x=mix(x,800+target.x,word)+Math.cos(a)*release;
        y=mix(y,347+target.y,word)+Math.sin(a)*release*.65;
      }
      if(pointer.active && morph.interactive && (index>=3||cover)){
        const dx=x-(800+pointer.x*800),dy=y-(450+pointer.y*450),distance=Math.hypot(dx,dy);
        const force=Math.max(0,1-distance/100)*16;
        if(distance>0){x+=dx/distance*force;y+=dy/distance*force;}
      }
      let alpha=p.alpha*(.78+.22*Math.sin(t*.7+p.phase))*morph.brightness;
      if(index===0&&!cover)alpha*=.12;
      if(index===1)alpha*=dissolve*.65;
      if(flower)alpha*=local<3?1-smooth(local/3):dissolve*.75;
      if(poetry&&centered)alpha*=1-centered*.65;
      if(final)alpha*=1-word*.28;
      const size=p.size*(1+z*.4)*(cover?.95:1);
      const color=p.gold?3:i%3;
      const visibleAlpha=clamp(alpha);
      if(visibleAlpha<.008)continue;
      if((flower && i%24===0)||(final&&word>.01&&word<.9&&i%16===0)||(index===1&&i%40===0)){
        ctx.globalAlpha=visibleAlpha;ctx.fillStyle=colors[color];ctx.font=`${11+p.size*3}px Consolas,monospace`;ctx.fillText(flower&&local<16?seed.glyph:p.glyph,x,y);
      }else {
        const offset=i*4;this.batch[offset]=x;this.batch[offset+1]=y;this.batch[offset+2]=size*.7;this.batch[offset+3]=visibleAlpha;
        this.buckets[i]=color*8+Math.min(7,Math.floor(visibleAlpha*8));
      }
    }
    // 将数千次 fill 合并为至多三十二批，维持八档亮度层次。
    // 顶点与分桶缓冲在构造时分配，画质切换不重新创建粒子。
    const active=Math.min(count,this.points.length);
    for(let bucket=0;bucket<32;bucket++){
      ctx.beginPath();let hasPoint=false;
      for(let i=0;i<active;i++)if(this.buckets[i]===bucket){const o=i*4,x=this.batch[o],y=this.batch[o+1],r=this.batch[o+2];ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);hasPoint=true;}
      if(hasPoint){ctx.globalAlpha=(bucket%8+.5)/8;ctx.fillStyle=colors[Math.floor(bucket/8)];ctx.fill();}
    }
    for(let i=0;i<active;i+=14)if(this.buckets[i]!==255){const o=i*4,r=this.batch[o+2]*5.7;ctx.globalAlpha=this.batch[o+3]*.35;ctx.drawImage(this.sprite,this.batch[o]-r,this.batch[o+1]-r,r*2,r*2);}
    if((morph.eternal||index===3)&&word<.3){
      const strength=(1-word)*(index===3?1-morph.bloom.spread*.7:1);
      for(let orbit=0;orbit<2;orbit++){
        const rx=scale*(1.45+orbit*.25),ry=scale*(.49+orbit*.12),angle=orbit===0?-.24:.32;
        ctx.save();ctx.translate(cx+pointer.x*3,cy+pointer.y*2);ctx.rotate(angle);
        ctx.globalAlpha=strength*.32;ctx.strokeStyle=orbit?'#f1c7a5':'#b3c8ff';ctx.lineWidth=.75;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
        for(let j=0;j<5;j++){const a=t*(orbit?.17:-.13)+j*Math.PI*2/5;const ox=Math.cos(a)*rx,oy=Math.sin(a)*ry;ctx.globalAlpha=strength*.75;ctx.fillStyle=j%2?'#ffe2b8':'#e0d6ff';ctx.beginPath();ctx.arc(ox,oy,1.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=strength*.38;ctx.drawImage(this.sprite,ox-7,oy-7,14,14);}
        ctx.restore();
      }
    }
    if(index===3&&local>8&&word<.1){
      const phase=(t*.78*1.04)%1;
      ctx.globalAlpha=(1-phase)*.16*(1-morph.bloom.spread*.7);ctx.strokeStyle='#ffb4d0';ctx.lineWidth=.9;
      ctx.beginPath();ctx.ellipse(cx,cy,scale*(1+phase*.9),scale*(.7+phase*.65),0,0,Math.PI*2);ctx.stroke();
    }
    if(flower)for(let i=0;i<22;i++){
      const p=this.points[i*17];const x=(p.u*1800+t*(5+p.speed*8))%1800-100,y=(p.v*1100-t*5+1100)%1100-100;
      ctx.save();ctx.translate(x,y);ctx.rotate(p.phase+t*.09);ctx.globalAlpha=.22*dissolve;ctx.fillStyle=i%3===0?'#f6c9a4':'#d5a6e3';ctx.beginPath();ctx.moveTo(-8,0);ctx.bezierCurveTo(-1,-8,11,-5,8,0);ctx.bezierCurveTo(2,6,-2,4,-8,0);ctx.fill();ctx.restore();
    }
    if((index===1||touch>.01)&&!cover){
      const ring=index===1?(t*.6)%1:1-touch;ctx.globalAlpha=(1-ring)*.18;ctx.strokeStyle='#ff86b7';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(cx,cy,80+ring*350,50+ring*210,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}
