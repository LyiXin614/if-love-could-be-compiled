export class SceneManager {
  constructor(acts) {
    this.acts = acts;
    this.starts = acts.map((_,i)=>acts.slice(0,i).reduce((sum,a)=>sum+a.duration,0));
    this.duration = acts.reduce((sum,a)=>sum+a.duration,0);
    this.time = 0; this.playing = false; this.started = false;
  }
  get state() {
    let index = this.starts.findLastIndex(start=>this.time >= start);
    index = Math.max(0,index);
    return { index, local: this.time - this.starts[index], act: this.acts[index] };
  }
  tick(delta) {
    if (!this.playing) return;
    this.time = Math.min(this.duration,this.time+delta);
    if(this.time === this.duration) this.playing = false;
  }
  seek(index,seconds=0) {
    index = Math.max(0,Math.min(this.acts.length-1,index));
    this.time = this.starts[index]+Math.max(0,Math.min(this.acts[index].duration-.001,seconds));
    this.started = true;
  }
  start() { this.time=0; this.started=true; this.playing=true; }
  toggle() { if(!this.started) this.start(); else if(this.time>=this.duration) this.start(); else this.playing=!this.playing; }
}
