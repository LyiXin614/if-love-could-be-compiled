export class PerformanceManager {
  constructor() {
    this.mode='auto';
    this.detected=(navigator.hardwareConcurrency||4)>=8 && (navigator.deviceMemory||8)>=4 ? 'high':'medium';
    this.samples=[];
  }
  get quality(){return this.mode==='auto'?this.detected:this.mode;}
  get count(){return {low:2200,medium:3800,high:5600}[this.quality];}
  get dpr(){return Math.min(devicePixelRatio||1,this.quality==='low'?1:1.75);}
  sample(dt){
    if(this.mode!=='auto' || document.hidden || dt<=0) return false;
    this.samples.push(dt);
    if(this.samples.length<180) return false;
    const average=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;
    this.samples=[];
    if(average>.028 && this.detected!=='low') {this.detected=this.detected==='high'?'medium':'low';return true;}
    return false;
  }
}
