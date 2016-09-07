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

/*
let Audio = function () {
   this.context = new window.AudioContext();
   this.create = null;
   this.audioNode = null
   this.vol = createVol(this.context);
   this.status = "open";

   let update = () => {
      this.status = this.context.state;
   }
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

   this.close = () => {
      if (this.context.state != "closed") {
         this.context.close();
      }
   };

}
*/

//Flattened intial declaration
AudioObj = (() => {

const context = new window.AudioContext();
let status = "open";
let audioCount = 0;

const update = (i = 0) => {
   audioCount += i;
   if (audioCount === 0) {
      context.suspend();
   } else {
      context.resume();
   }
}

update();

let audio = class {
   constructor() {
      this.audioNode = null;
      this.vol = createVol(context);
      this.status = "open";
      this.closed = false;
   }

   start () {
      if (this.closed) {
         throw("Attempted to use closed Audio object");
      }

      if (this.audioNode !== null) {
         this.stop();
      }
      update(1);
      this.vol.gain.value = volume;
      this.audioNode = createOsc(this.vol, context);
      this.audioNode.start();
      this.status = "running";
   }

   stop () {
      if (this.closed) {
         throw("Attempted to use closed Audio object");
      }

      if (this.audioNode !== null) {
         this.audioNode.stop();
         this.audioNode = null;
         this.context = "open";
         update(-1);
      }
   }

   changeVol (vol) {
      if (this.closed) {
         throw("Attempted to use closed Audio object");
      }

      this.vol.gain.value = vol;
   }

   close () {
      this.closed = true;
      this.state = "closed";
      this.audioNode = null;
   }
}

return audio;
})();

createVol.name = "createVol";
createOsc.name = "createOsc";
