// TODO: implement API to close audio nodes
// TODO: resume and suspend audioContexts as required

let volume = .05;

const freq = 500;

function createVol(context) {}
function createOsc(gainNode, context) {}

//const createOsc = (gainNode, context ) => {
createOsc = (gainNode, context) => {
  let osc = context.createOscillator();
  osc.type = 'sine'
  osc.frequency.value = freq;
  osc.connect(gainNode)
  return osc;
};

//const createVol = (audioNode) => {
createVol = (context) => {

   let vol = context.createGain();
   vol.gain.audio = 0;
   vol.connect(context.destination);
   return vol;
};


let Audio = function () {
   this.context = new window.AudioContext();
   this.create = null;
   this.audioNode = null
   this.vol = createVol(this.context);
   this.start = () => {
      if (this.audioNode !== null) {
         this.stop();
      }
      this.audioNode = createOsc(this.vol, this.context);
      this.vol.gain.value = volume;
      this.audioNode.start();
   };
   this.stop = () => {
      if (this.audioNode !== null) {
         this.audioNode.stop();
         this.audioNode = null;
      }
  };
   this.changeVol = (vol) => {
      this.vol.gain.value = vol;
   };
   this.start.name = 'start';
   this.stop.name = 'stop';
   this.changeVol.name = 'changeVol';
}

createVol.name = "createVol";
createOsc.name = "createOsc";
