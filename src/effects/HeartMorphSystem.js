import { heartbeatAt, emotionalScore } from '../love.poem.js';
import { smooth, mix, clamp } from './motion.js';

// 不积累速度状态：绽放、回归与静默均为可重放的时间函数。
export function bloomAt(seconds) {
  const { gather, silence, burst, vortex, returnAt, reborn } = emotionalScore.bloom;
  const charge=smooth((seconds-gather)/(silence-gather));
  const released=smooth((seconds-burst)/(vortex-burst));
  const restored=smooth((seconds-returnAt)/(reborn-returnAt));
  return {
    charge:charge*(1-released),
    silence:seconds>=silence&&seconds<burst,
    spread:released*(1-restored),
    spin:smooth((seconds-vortex)/(returnAt-vortex))*(1-restored),
    restored,
  };
}

export function confessionAt(seconds) {
  const score=emotionalScore.confession;
  return {
    toPoem:smooth((seconds-score.dissolve)/(score.read-score.dissolve)),
    toHeart:smooth((seconds-score.release)/(score.rest-score.release)),
    clear:smooth((seconds-score.read+.8)/1.2)*(1-smooth((seconds-score.release)/1.4)),
  };
}

export class HeartMorphSystem {
  constructor() { this.displacement={x:0,y:0,compression:1}; }
  frame(index,local,time,cover=false,touch=0) {
    const bloom=index===3?bloomAt(local):{charge:0,silence:false,spread:0,spin:0,restored:0};
    const eternal=cover||index>=4;
    const awakening=index===1;
    const heat=index===3?smooth(local/8):eternal?1:0;
    const clock=bloom.silence?time-local+emotionalScore.bloom.silence:time;
    const raw=heartbeatAt(clock*(eternal?.72:awakening?.62:1.04));
    const pulse=1+(raw-1)*(awakening?.45:eternal?.7:1.8)+touch*.075;
    return { bloom, heat, eternal, awakening, pulse,
      density:awakening?.32:1,
      brightness:(awakening?.55:eternal?1:1.15)+bloom.charge*.65+touch*.5,
      energy:clamp((pulse-1)*11),
      motionTime:clock,
      interactive:!(index===3&&local>=10&&local<22)&&!(index===5&&local>=3&&local<27),
      confession:index===5?confessionAt(local):null,
    };
  }
  offset(point,frame) {
    const b=frame.bloom;
    const angle=point.phase+b.spin*3.8;
    const radius=(110+point.v*210)*b.spread;
    const out=this.displacement;
    out.x=Math.cos(angle)*radius+Math.sin(angle*3)*radius*.12;
    out.y=Math.sin(angle)*radius*.62+Math.cos(angle*5)*radius*.07;
    out.compression=1-b.charge*.16;
    return out;
  }
}
