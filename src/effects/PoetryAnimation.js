import { TextAtlas, SANS, MONO, layoutText } from './TextLayout.js';
import { clamp, smooth, mix, hash, decodeFrame } from './motion.js';

export class PoetryAnimation {
  constructor(atlas = new TextAtlas()) { this.atlas = atlas; }
  clear() { this.atlas.clear(); }
  draw(ctx, lines, { type = 'spatial', seconds = 5, duration = 8, x = 800, y = 720, size = 34, maxWidth = 1180, count = 3800, source = 'const answer = undefined;', pointer = { x:0, y:0 }, still = false, exit = true } = {}) {
    if (seconds < 0) return;
    const atlas = this.atlas.get(lines, { size, minSize: Math.min(size,30), maxWidth });
    const entering = smooth(seconds / 2.6);
    const leaving = exit ? smooth((seconds - duration + 1.2) / 1.2) : 0;
    ctx.save();
    if (still) {
      // 截图使用效果的稳定落点：完整可读，同时保留笔画周围的光粒与余辉。
      if(type==='particles')this.particles(ctx,atlas,{entering:1,leaving:0,x,y,seconds:4,count});
      else if(type==='light'){
        const loops=this.atlas.contours(atlas);ctx.strokeStyle='#ffd6a066';ctx.lineWidth=.7;
        for(const loop of loops){ctx.beginPath();ctx.moveTo(x+loop[0].x,y+loop[0].y);for(let i=1;i<loop.length;i+=2)ctx.lineTo(x+loop[i].x,y+loop[i].y);ctx.stroke();}
      }
      this.clearType(ctx, atlas, x, y, 1); ctx.restore(); return;
    }
    if (type === 'decode') this.decode(ctx, lines, atlas, { seconds, x, y, source, leaving, maxWidth });
    if (type === 'particles') this.particles(ctx, atlas, { entering, leaving, x, y, seconds, count });
    if (type === 'light') this.light(ctx, atlas, { seconds, leaving, x, y, count });
    if (type === 'spatial') this.spatial(ctx, atlas, { entering, leaving, x, y, seconds, pointer, count });
    ctx.restore();
  }
  clearType(ctx, atlas, x, y, alpha) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    ctx.font = `${atlas.layout.size}px ${SANS}`; ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd7e53b'; ctx.shadowBlur = 3;
    atlas.layout.lines.forEach((line,i) => {
      const baseline = y + i * atlas.layout.lineHeight;
      ctx.strokeStyle = '#050711b0'; ctx.lineWidth = 4; ctx.strokeText(line,x,baseline);
      ctx.fillStyle = i % 2 ? '#ffe5ee' : '#fff3f1'; ctx.fillText(line,x,baseline);
    }); ctx.restore();
  }
  decode(ctx, lines, atlas, { seconds, x, y, source, leaving, maxWidth }) {
    if (seconds > 4.2) { this.clearType(ctx,atlas,x,y,1-leaving); return; }
    const target = lines.join('');
    const text = decodeFrame(target, source, seconds, 3.6);
    const layout = layoutText(ctx,[text],{size:atlas.layout.size,minSize:28,maxWidth,font:seconds<1?MONO:SANS});
    ctx.globalAlpha *= 1-leaving;ctx.textAlign='center';ctx.font=`${layout.size}px ${seconds<1?MONO:SANS}`;
    ctx.fillStyle=seconds<1?'#b9cfff':'#ffe4ed';
    layout.lines.forEach((line,i)=>ctx.fillText(line,x,y+i*layout.lineHeight));
    const progress=clamp(seconds/3.6),sx=x-maxWidth*.42+maxWidth*.84*progress;
    ctx.strokeStyle='#ffd6a0aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,y-layout.size);ctx.lineTo(sx,y+12);ctx.stroke();
    const glow=ctx.createRadialGradient(sx,y-8,0,sx,y-8,25);glow.addColorStop(0,'#ffd6a035');glow.addColorStop(1,'#ffd6a000');ctx.fillStyle=glow;ctx.fillRect(sx-25,y-33,50,50);
  }
  particles(ctx, atlas, { entering, leaving, x, y, seconds, count }) {
    const budget=Math.min(atlas.points.length,Math.round(count*.48));
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<budget;i++){
      const p=atlas.points[Math.floor(i/budget*atlas.points.length)];
      const delay=hash(i+1)*.65;
      const gather=smooth((seconds-delay)/2.5),breakup=leaving;
      const angle=hash(i+9)*Math.PI*2,radius=70+hash(i+31)*160;
      const drift=(1-gather)+breakup;
      const px=x+p.x+Math.cos(angle+breakup)*radius*drift;
      const py=y+p.y+Math.sin(angle+breakup)*radius*.45*drift;
      ctx.globalAlpha=(.3+hash(i+12)*.6)*(1-breakup)*(.3+.7*gather)*(1-smooth((seconds-2.8)/1.2)*.75);
      ctx.fillStyle=i%9===0?'#ffd6a0':i%3===0?'#ffb8d2':'#c6d8ff';
      ctx.fillRect(px,py,1.25,1.25);
    }ctx.restore();
    this.clearType(ctx,atlas,x,y,smooth((seconds-2.2)/1.4)*(1-leaving));
  }
  light(ctx, atlas, { seconds, leaving, x, y, count }) {
    if(seconds>=4.3){this.clearType(ctx,atlas,x,y,1-leaving);return;}
    const loops=this.atlas.contours(atlas);
    const total=loops.reduce((sum,loop)=>sum+loop.length,0);
    const progress=clamp(seconds/4.1),head=Math.floor(total*progress);
    let visited=0,tip=null;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha*=1-leaving;
    ctx.strokeStyle='#f6cba7';ctx.lineWidth=.8;ctx.lineJoin='round';
    for(const loop of loops){
      if(visited>=head)break;
      const end=Math.min(loop.length,head-visited);
      ctx.beginPath();ctx.moveTo(loop[0].x,loop[0].y);
      for(let i=1;i<end;i+=2)ctx.lineTo(loop[i].x,loop[i].y);
      ctx.globalAlpha=(1-leaving)*(.3+.4*(1-progress));ctx.stroke();
      if(end>0)tip=loop[end-1];visited+=loop.length;
    }
    if(tip&&progress<1){
      ctx.globalAlpha=1-leaving;ctx.shadowBlur=10;ctx.shadowColor='#ffd6a0';ctx.fillStyle='#fff0cb';ctx.beginPath();ctx.arc(tip.x,tip.y,2.2,0,Math.PI*2);ctx.fill();
      // 沿已走过的真实轮廓留下短尾迹，不使用横向遮罩。
      let cursor=0;
      for(const loop of loops){
        if(cursor+loop.length>head&&cursor<head){const stop=head-cursor;for(let j=Math.max(0,stop-38);j<stop;j+=3){const p=loop[j];ctx.globalAlpha=(1-(stop-j)/40)*.65;ctx.fillRect(p.x,p.y,1.5,1.5);}break;}cursor+=loop.length;
      }
    }ctx.restore();
    this.clearType(ctx,atlas,x,y,smooth((seconds-2.8)/1.5)*(1-leaving));
  }
  spatial(ctx, atlas, { entering, leaving, x, y, seconds, pointer, count }) {
    const scale=mix(.72,1,entering)*(1-leaving*.12);
    const reading=entering>.995&&leaving===0;
    ctx.save();ctx.translate(x+(reading?0:pointer.x*4*(1-entering)),y+(1-entering)*25-leaving*25);ctx.scale(scale,scale);
    if(entering<.8){ctx.filter=`blur(${(1-entering)*2}px)`;}
    this.clearType(ctx,atlas,0,0,entering*(1-leaving));ctx.restore();
    if(leaving>0){ctx.save();ctx.fillStyle='#ffd6a0';ctx.globalAlpha=(1-leaving)*.55;for(let i=0;i<Math.min(60,count/80);i++){const p=atlas.points[Math.floor(hash(i+90)*atlas.points.length)];if(p)ctx.fillRect(x+p.x+leaving*(40+hash(i)*70),y+p.y-leaving*35,1,1);}ctx.restore();}
  }
}
