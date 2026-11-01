import { acts, palette, letter, alternatives } from '../love.poem.js';
import { smooth, clamp } from '../effects/motion.js';
import { SANS, MONO, wrapText } from '../effects/TextLayout.js';
import { PoetryAnimation } from '../effects/PoetryAnimation.js';

export class Renderer {
  constructor(canvas, particles, poetry = new PoetryAnimation()) {
    this.canvas = canvas;
    this.particles = particles;
    this.poetry = poetry;
    this.alternative = -1;
  }
  text(ctx, text, x, y, size = 16, color = palette.paper, align = 'left', font = SANS, maxWidth) {
    const available = maxWidth ?? (align === 'center' ? Math.min(x,1600-x)*2-80 : align === 'right' ? x-60 : 1540-x);
    ctx.font = `${size}px ${font}`;
    while (ctx.measureText(text).width > available && size > 12) { size -= .5; ctx.font = `${size}px ${font}`; }
    const lines = wrapText(ctx,text,available);
    ctx.fillStyle=color;ctx.textAlign=align;
    lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.4));
  }
  line(ctx,x,y,w,color='#a6b8e34a') {
    ctx.strokeStyle=color;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();
  }
  spaced(ctx,text,x,y,size,color,spacing=3) {
    ctx.font=`${size}px ${SANS}`;ctx.fillStyle=color;ctx.textAlign='left';
    const width=ctx.measureText(text).width+Math.max(0,text.length-1)*spacing;
    if(width>1540-x)spacing=Math.max(0,spacing-(width-(1540-x))/Math.max(1,text.length-1));
    for(const ch of text){ctx.fillText(ch,x,y);x+=ctx.measureText(ch).width+spacing;}
  }
  tokens(ctx,line,x,y,size,comment=false) {
    ctx.font=`${size}px ${MONO}`;ctx.textAlign='left';
    const parts=line.match(/\/\/.*$|"[^"]*"|'[^']*'|\b(?:const|let|return|function|while|if|break|new)\b|\b(?:Infinity|undefined|YOU)\b|[a-zA-Z_$][\w$]*(?=\()|[^a-zA-Z_$"']+|[a-zA-Z_$][\w$]*/g)||[];
    for(const token of parts){
      ctx.fillStyle=comment||token.startsWith('//')?'#acbdd4':/^['"]/.test(token)?'#ffdbb0':/^(const|let|return|function|while|if|break|new)$/.test(token)?'#dcc4ff':/^(Infinity|undefined|YOU)$/.test(token)?'#ffc1db':/^[a-zA-Z_$]+$/.test(token)&&line.includes(token+'(')?'#b9e6f4':'#e2e8f5';
      ctx.fillText(token,x,y);x+=ctx.measureText(token).width;
    }
  }
  terminal(ctx,code,{x=290,y=220,w=1080,h=410,local=20,reveal=1,opacity=1,title='romance.js',dissolve=0,size=21,lineHeight=31,glass=true}={}) {
    if(opacity<=0)return;
    ctx.save();ctx.globalAlpha*=opacity;
    const lines=code.split('\n');
    // 横向与纵向都测量；代码长行按实际字宽折行，行号保留原始行号。
    ctx.font=`${size}px ${MONO}`;
    while(Math.max(...lines.map(line=>ctx.measureText(line).width))>w-100&&size>19){size-=.5;ctx.font=`${size}px ${MONO}`;}
    const rows=lines.flatMap((line,index)=>wrapText(ctx,line,w-100).map((value,part)=>({value,index,part})));
    lineHeight=Math.min(lineHeight,(h-(glass?94:25))/Math.max(1,rows.length-1));
    if(glass){
      const glassFill=ctx.createLinearGradient(x,y,x+w,y+h);
      glassFill.addColorStop(0,'#192540c9');glassFill.addColorStop(.55,'#0d1426be');glassFill.addColorStop(1,'#111429ad');
      ctx.fillStyle=glassFill;ctx.fillRect(x,y,w,h);ctx.strokeStyle='#bacaf44a';ctx.lineWidth=.8;ctx.strokeRect(x,y,w,h);
      this.line(ctx,x,y+47,w,'#a6bbec37');this.line(ctx,x+1,y+1,w-2,'#d1dfff3d');
      for(let i=0;i<3;i++){ctx.fillStyle=['#e7a8bf','#e6c493','#9bbdbb'][i];ctx.beginPath();ctx.arc(x+24+i*17,y+24,3.5,0,7);ctx.fill();}
      this.text(ctx,title,x+93,y+29,15,'#c5d2ed','left',MONO);
      this.text(ctx,'UTF-8 / JAVASCRIPT',x+w-25,y+29,14,'#a5b6d5','right',MONO);
    }
    let remaining=Math.floor(code.length*reveal);
    const visibleLines=lines.map(line=>{const value=line.slice(0,Math.max(0,remaining));remaining-=line.length+1;return value;});
    rows.forEach((row,i)=>{
      const rowAlpha=smooth((local-row.index*.22)/.6)*(1-smooth((dissolve-row.index*.025)*1.45));
      ctx.globalAlpha=opacity*rowAlpha;
      const baseline=y+(glass?80:20)+i*lineHeight;
      if(row.part===0)this.text(ctx,String(row.index+1).padStart(2,'0'),x+20,baseline,14,'#9badcc','left',MONO);
      const full=lines[row.index],visible=visibleLines[row.index];
      const before=rows.filter((r,j)=>j<i&&r.index===row.index).reduce((sum,r)=>sum+r.value.length,0);
      const shown=visible.slice(before,before+row.value.length);
      const spotlight=Math.exp(-(((local*.8-i)%22)**2)/2)*.07;
      ctx.fillStyle=`rgba(199,194,255,${spotlight})`;ctx.fillRect(x+56,baseline-size-2,w-76,lineHeight);
      this.tokens(ctx,shown,x+67,baseline,size,full.trim().startsWith('*')||full.trim().startsWith('/*'));
      if(reveal<1&&shown.length<row.value.length&&visible.length>=before){
        ctx.font=`${size}px ${MONO}`;ctx.globalAlpha*=.45+.55*Math.abs(Math.sin(local*3));
        this.text(ctx,'▍',x+67+ctx.measureText(shown).width,baseline,size,'#e3eaff','left',MONO);
      }
    });
    if(glass&&reveal<1){const scan=y+52+(local*37)%(h-58);this.line(ctx,x+1,scan,w-2,'#bacbff13');}
    ctx.restore();
  }
  poem(ctx,lines,options={}) {
    this.poetry.draw(ctx,lines,{...options,still:options.still??this.currentState?.capture,count:this.currentState?.count,pointer:this.currentState?.pointer});
  }
  render(ctx,width,height,state) {
    const {index,local,cover,capture}=state;this.currentState=state;
    ctx.save();ctx.setTransform(width/1600,0,0,height/900,0,0);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowBlur=0;
    ctx.beginPath();
    ctx.fillStyle=palette.night;ctx.fillRect(0,0,1600,900);
    const atmosphere=ctx.createRadialGradient(1050,390,40,900,420,850);
    atmosphere.addColorStop(0,'#151a366a');atmosphere.addColorStop(.5,'#10142932');atmosphere.addColorStop(1,'#05071100');
    ctx.fillStyle=atmosphere;ctx.fillRect(0,0,1600,900);
    this.particles.draw(ctx,state);
    if(cover){
      this.text(ctx,'∞',1120,714,24,'#c5a9c9','center',MONO);
      this.text(ctx,'AN EVER-RUNNING PROCESS',1120,738,15,'#b0bbd3','center',MONO,580);
      if(capture)this.drawCover(ctx);
    }else{
      const act=acts[index];
      ctx.save();ctx.globalAlpha=smooth(local/.8);
      this.text(ctx,`0${index+1} / 06`,100,151,15,'#e4b5cd','left',MONO);
      this.spaced(ctx,act.name,100,195,36,'#f1e5ef',5);
      this.text(ctx,act.en,100,225,14,'#a9b9d7','left',MONO,520);
      this.line(ctx,100,244,52,'#d9aac68c');ctx.restore();
      if(index===0){
        this.terminal(ctx,act.code,{local,reveal:clamp(local/8),y:270,h:350,size:22,lineHeight:31});
        const progress=clamp(local/16);
        this.line(ctx,355,649,945,'#9eb6ff45');this.line(ctx,355,649,945*progress,'#a7beffca');
        this.text(ctx,local>13?'SEARCHING FOR MEANING…':local>7?'LOADING MEMORIES…':'INITIALIZING EMOTIONS…',355,680,16,'#c2d3fa','left',MONO);
        this.text(ctx,`${Math.floor(progress*100)}%`,1300,680,15,'#c2d3fa','right',MONO);
        this.poem(ctx,act.poems,{type:'decode',source:'const forever = undefined;',seconds:local-10,duration:8,y:741,size:32,exit:false});
      }
      if(index===1){
        this.terminal(ctx,act.code,{local,reveal:clamp(local/5),y:269,h:385,size:20,lineHeight:26,opacity:1-smooth((local-8)/6)*.86,dissolve:smooth((local-9)/10)*.75});
        if(local<10)this.poem(ctx,[act.poems[0]],{type:'decode',source:'heartbeat = Infinity;',seconds:local-1,duration:9,y:736,size:35});
        else this.poem(ctx,[act.poems[1]],{type:'particles',seconds:local-10,duration:12,y:744,size:39});
        if(local>8)this.text(ctx,'UNEXPECTED EMOTION / POSSIBLE CAUSE: YOU',800,665,16,'#e5bed8','center',MONO);
      }
      if(index===2){
        const dissolve=smooth((local-5)/17);
        this.terminal(ctx,act.code,{local,reveal:clamp(local/4),y:265,h:375,size:21,lineHeight:30,dissolve,opacity:1-dissolve*.82});
        const status=local<6?'Parsing memories…':local<13?'Resolving heartbeat…':local<22?'Finding the meaning of YOU…':'SUCCESS. / EMOTIONS COMPILED';
        this.text(ctx,status,800,670,16,'#d4bbdf','center',MONO);
        this.line(ctx,580,689,440,'#ffb5d34d');this.line(ctx,580,689,440*clamp(local/25),'#ffc0d9b8');
        const second=local>=17;
        this.poem(ctx,act.poems.slice(second?2:0,second?4:2),{type:'particles',seconds:local-(second?17:5),duration:second?11:12,y:738,size:34});
      }
      if(index===3){
        if(local<10)this.poem(ctx,act.poems.slice(0,2),{type:'spatial',seconds:local-1,duration:9,y:710,size:34});
        if(local>=23)this.poem(ctx,act.poems.slice(2),{type:'light',seconds:local-23,duration:11,y:707,size:40,exit:false});
        const label=local<9?'GATHERING EVERY POSSIBILITY…':local<12?'HOLDING OUR BREATH…':local<18?'BLOOM / EVERY FRAGMENT REMEMBERS':local<23?'REUNITING ACROSS THE UNIVERSE':act.status;
        this.text(ctx,label,800,639,16,'#d9c4d9','center',MONO);
        if(!capture&&local>24)this.text(ctx,'轻触心脏，让此刻多一次回响',800,812,14,'#c4b8ce','center');
      }
      if(index===4){
        const hide=smooth((local-18)/2);
        this.terminal(ctx,letter,{x:150,y:277,w:735,h:510,glass:false,size:20,lineHeight:27,local,reveal:1,opacity:1-hide});
        if(local<20)this.text(ctx,'everyTomorrow() → choose(you)',1160,682,16,'#e1c0d5','center',MONO,530);
        if(local>=20){const second=local>=27;this.poem(ctx,act.poems.slice(second?2:0,second?4:2),{type:'spatial',seconds:local-(second?27:20),duration:7,y:707,size:35});}
      }
      if(index===5){
        const confession=this.particles.heart.frame(index,local,state.time,false,state.touch).confession;
        if(confession.clear>0){
          const atlas=this.poetry.atlas.get(act.poems,{size:42,minSize:38,maxWidth:1200});
          this.poetry.clearType(ctx,atlas,800,347,confession.clear);
        }
        if(local>=27){
          this.poem(ctx,act.poems,{type:'spatial',seconds:local-27,duration:9,y:639,size:34,exit:false});
          this.text(ctx,'LOVE IS NOT A BUG. IT IS THE MOST BEAUTIFUL FEATURE.',800,164,16,'#dcc8e6','center',MONO,1100);
        }
        if(local>27){
          ctx.save();ctx.globalAlpha=smooth((local-27)/2);
          this.text(ctx,'BUILD SUCCESSFUL',130,700,17,'#b8ead5','left',MONO,420);
          this.text(ctx,'0 errors. 0 warnings.',130,729,15,'#bdcbe3','left',MONO,420);
          this.text(ctx,'Running since the day we met.',130,758,15,'#e5c7da','left',MONO,420);ctx.restore();
        }else this.text(ctx,local<10?'FROM A HEART, INTO A POEM.':local<19?'EVERY WORD WAS ONCE A HEARTBEAT.':'EVERY FRAGMENT FINDS ITS WAY HOME.',800,665,15,'#d5bfd7','center',MONO);
      }
      if(this.alternative>=0){
        ctx.fillStyle='#050711f5';ctx.fillRect(120,690,1360,121);
        this.poem(ctx,[alternatives[this.alternative%alternatives.length]],{type:'spatial',seconds:5,duration:10,y:741,size:32,exit:false});
      }
    }
    if(capture&&!cover){
      this.text(ctx,'如果浪漫可以被编译',70,61,22,'#f1e7ef');
      this.text(ctx,'IF LOVE COULD BE COMPILED / V2.0',1530,61,15,'#bfcae1','right',MONO);
      this.line(ctx,70,86,1460);this.line(ctx,70,835,1460);
      this.text(ctx,'一封以粒子、时间与代码写成的可执行情诗',70,864,15,'#b5c2dc');
      this.text(ctx,`0${index+1} / ${acts[index].en}`,1530,864,14,'#d1b6cf','right',MONO);
    }
    ctx.restore();
  }
  drawCover(ctx){
    this.text(ctx,'{ ♥ }   ROMANCE / EXECUTABLE',70,62,17,'#f3d9e6','left',MONO);
    this.text(ctx,'代码情诗 · 交互生成艺术 / V2.0',1530,62,16,'#bdcbe4','right');
    this.text(ctx,'A POEM WRITTEN IN LIGHT',195,213,16,'#c5d4ef','left',MONO,650);
    this.spaced(ctx,'如果浪漫',195,325,70,'#f3f5ff',6);
    this.spaced(ctx,'可以被编译。',195,425,70,'#ffc6df',6);
    this.text(ctx,'If Love Could Be Compiled',195,482,30,'#cad3e7','left','Georgia,serif',650);
    this.line(ctx,195,532,44,'#e0acc8');
    this.text(ctx,'在理性的尽头，',195,582,22,'#c0cce2');
    this.text(ctx,'让一行代码，长成一整个宇宙。',195,622,22,'#c0cce2');
    this.text(ctx,'用代码，写下无法量化的心动。',70,857,15,'#b6c3df');
    this.text(ctx,'CANVAS / MATHEMATICS / POETRY',1530,857,15,'#b6c3df','right',MONO);
  }
}
