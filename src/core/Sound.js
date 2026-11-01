export class Sound {
  constructor(){this.enabled=false;this.context=null;this.last=-1;}
  async toggle(){
    if(!this.context)this.context=new (window.AudioContext||window.webkitAudioContext)();
    await this.context.resume();this.enabled=!this.enabled;
    if(this.enabled)this.note(520,.08,.025);
    return this.enabled;
  }
  note(frequency,duration=.06,volume=.012){
    if(!this.enabled||!this.context)return;
    const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,c.currentTime);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration);
  }
  update(index,local,playing){
    if(!playing)return;
    const tick=Math.floor(local*7),key=index*10000+tick;
    if(key===this.last)return;this.last=key;
    if(index<3&&local<8)this.note(380+(tick%5)*40,.035,.006);
    if(index===3&&local<.3){this.note(523,.9,.025);this.note(784,1.3,.012);}
  }
}
