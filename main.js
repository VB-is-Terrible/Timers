'use strict'

// Implements x-timerCard, x-timerInputCard
// via XTimerCardProto, x-timerInputCard

// For timerObjs, if type === 'timer',
// time is Date object at the time the timer ends
// if type === 'alarm',
// time is the number of seconds from midnight that the alarm should activate on

// When adding a timer/alarm to the x-timerCards,
// They will return a id number
// The same id number will be given via event.id when a timer/alarm is removed
// And the id is passed to x-timerCard.remove

// x-timerCard.tick updates the timers. Use this to synchronize UI updates,
// Calling it with longer than 1 (one) secomd intervals allows for decresed UI
// update speed

const MaxID = Math.pow(2,32) //2**32 // That ES7 expontent operator

//x-timerCard implemenation


let XTimerCardProto = Object.create(HTMLElement.prototype);

XTimerCardProto.createdCallback = function () {

   let shadow = this.createShadowRoot();
   let card = document.importNode(
      document.querySelector('#templateTimerCard'),
      true);
   let title = card.content.querySelector('#title');
   this.hidable = true;
   title.innerText = 'Hello World';
   this.setAttributeNode(document.createAttribute('title'));
   this.setAttributeNode(document.createAttribute('timers'));
   this.setAttributeNode(document.createAttribute('hidable'));
   //Set readonly properties
   //Bad things happen when these properties are tinkered with
   Object.defineProperty(this, 'timers', {
       value: [],
       writable: false,
       enumerable: true,
       configurable: false
   });
   this.previous = 0;
   shadow.appendChild(card.content);

};

XTimerCardProto.attributeChangedCallback = function (
   attrName, oldValue, newValue) {
   //console.log('ChangeAttr', attrName, oldValue, newValue);
   switch (attrName) {
      case 'title':
         this.shadowRoot.querySelector('#title').innerText = newValue;
         break;
      case 'hidable':
         console.warn('hidable: NotImplementedError');
      default:
         //this.
   }
};


XTimerCardProto.add = function (timerInputObj) {
   let clone = document.importNode(
      document.querySelector('#templateTimer'),
      true);

   let input = clone.content.querySelector('.time');
   let button = clone.content.querySelector('button.action');
   if (timerInputObj.type == 'alarm') {
      button.innerText = 'Remove';
   } else if (timerInputObj.type == 'timer') {
      button.innerText = 'Stop';
   } else {
      button.innerText = timerInputObj.type;
   }
   let [idObj, onclick] = this._createId(timerInputObj);

   if (timerInputObj.type === 'alarm') {
      input.innerText = this._timerToString(idObj.assoc, idObj.type);
   } else if (timerInputObj.type === 'timer') {
      input.innerText = this._timerToString(
         idObj.assoc,
         idObj.type);
   }
   clone.content.querySelector('button.action').addEventListener('click', onclick);
   this.shadowRoot.querySelector('#card').appendChild(clone.content);
   let active = this.shadowRoot.querySelector('#card');
   idObj.div = active.children[active.children.length - 1];
   this._update();
   return idObj.id;

};

XTimerCardProto._createId = function (timerInputObj) {
   // Reduces variables kept in closure
   let newObj = {
      id : randint(0, MaxID),
      div: null,
      assoc: timerInputObj.time,
      type: timerInputObj.type
   };
   this.timers.push(newObj);
   let onclick = (e) => {
      this.remove(newObj.id);
   };
   return [newObj, onclick];
};

XTimerCardProto.remove = function (id) {
   let containerObj = null;
   let location = -1;
   for (let i = 0;i < this.timers.length;i++) {
      if (this.timers[i].id == id) {
         containerObj = this.timers[i];
         location = i;
      }
   }
   if (containerObj === null) {
      console.error('Invalid id: %s', id);
   } else {
      this.shadowRoot.querySelector('#card').removeChild(containerObj.div);
      let removeEvent = new CustomEvent('remove');
      removeEvent.id = id;
      this.dispatchEvent(removeEvent);
      this.timers.splice(location, 1);
      this._update();
   }
};

XTimerCardProto._update = function () {
   this.previous = this.timers.length;
};

XTimerCardProto._timerToString = (time, type = 'timer') => {

   let str = '';
   if (type === 'alarm') {
      let hr = Math.floor(time / 3600);
      let min = Math.floor(time / 60) % 60;
      let sec = time % 60;

      str = strPad(hr.toString(), 2, '0') + ':' +
            strPad(min.toString(), 2, '0');
   } else if (type === 'timer') {
      let diff = Math.floor((time - Date.now())/1000);
      let hr = Math.floor(diff / 3600);
      let min = Math.floor(diff / 60) % 60;
      let sec = diff % 60;

      str = strPad(hr.toString(), 2, '0') + ':' +
            strPad(min.toString(), 2, '0') + ':' +
            strPad(sec.toString(), 2, '0');
   }
   return str;
};

XTimerCardProto.tick = function () {
   let now = new Date;
   let input = null;
   for (let i = 0;i < this.timers.length; i++) {
      if (this.timers[i].type === 'timer') {
         input = this.timers[i].div.querySelector('.time');
         input.innerText = this._timerToString(this.timers[i].assoc , this.timers[i].type);
      }
   }
};


let XTimerCard = document.registerElement('x-TimerCard', {
    prototype: XTimerCardProto
});


//x-timerInputCard

let XTimerInputCardProto = Object.create(HTMLElement.prototype);

XTimerInputCardProto.createdCallback = function () {

   let shadow = this.createShadowRoot();
   let card = document.importNode(
      document.querySelector('#templateTimerInput'),
      true);
   let l = card.content.querySelector('#timerInput').querySelectorAll('input.numInput');
   for (let i = 0;i < l.length;i++) {
      l[i].placeholder = '00';
      l[i].min = '0';
   }
   let selector = card.content.querySelector('#typeSelector');
   let timeInput = card.content.querySelector('#timerInput');
   let alarmInput = card.content.querySelector('#alarmInput');
   selector.value = 0;
   alarmInput.hidden = true;
   let onselect = (e) => {
      switch (selector.value) {
         case '0':
            timeInput.hidden = false;
            alarmInput.hidden = true;
            break;
         case '1':
            timeInput.hidden = true;
            alarmInput.hidden = false;
            break;
         default:
            console.log('Something has gone horribly wrong');
      }
   };
   timeInput.querySelector('#confirmTime').addEventListener(
      'click',
      (e) => {this._time(e);});
   alarmInput.querySelector('#confirmAlarm').addEventListener(
      'click',
      (e) => {this._alarm(e);});
   selector.addEventListener('change', onselect);
   shadow.appendChild(card.content);
   //this.setAttributeNode(document.createAttribute('oncreate'));
   //this.oncreate = (obj) => {};
};

XTimerInputCardProto._time = function (e) {
   let hrObj = this.shadowRoot.querySelector('#In1');
   let minObj = this.shadowRoot.querySelector('#In2');
   let secObj = this.shadowRoot.querySelector('#In3');
   let now = new Date;

   let hr = parseInt(hrObj.value);
   let min = parseInt(minObj.value);
   let sec = parseInt(secObj.value);
   // Blank input sanitation
   if (Number.isNaN(hr)) {
      hr  = 0;
   }
   if (Number.isNaN(min)) {
      min = 0;
   }
   if (Number.isNaN(sec)) {
      sec = 0;
   }

   let returnObj = {
      time: new Date((sec + min * 60 + hr * 3600) * 1000 + Date.now()),
      // Keeps obj type consistent with alarms
      type: 'timer',
      invalid: false
   };
   if ((hr + min + sec) === 0) {
      returnObj.invalid = true;
   }
   hrObj.value = '';
   minObj.value = '';
   secObj.value = '';
   let event = new CustomEvent('timer', returnObj);
   event.time = returnObj.time;
   event.invalid = returnObj.invalid;
   event.start = returnObj.start;
   this.dispatchEvent(event);
};

XTimerInputCardProto._alarm = function (e) {
   let re = new RegExp(
      '^\\d\\d:\\d\\d' + // Base hh:mm
      '(?=:\\d\\d)?' // Seconds :ss
   );
   let invalid = false;
   let valueStr = this.shadowRoot.querySelector('#alarmInput').querySelector('input.time').value;
   if (!re.test(valueStr)) {
      console.warn('Invalid input: ' + valueStr);
      valueStr = '00:00:00';
      invalid = true;
   }
   let hr = parseInt(valueStr.slice(0,2));
   let min = parseInt(valueStr.slice(3,5));
   let sec = 0;
   if (valueStr.length >= 8) {
      sec = parseInt(valueStr.slice(6,8));
   }
   let returnObj = {
      time: sec + min * 60 + hr * 3600,
      type: 'alarm',
      invalid: false
   };
   if (invalid) {
      returnObj.invalid = true;;
   }
   this.shadowRoot.querySelector('#alarmInput').
      querySelector('input.time').value = '';
   let event = new CustomEvent('alarm', returnObj);
   event.time = returnObj.time;
   event.invalid = returnObj.invalid;
   this.dispatchEvent(event);
};


let XTimerInputCard = document.registerElement('x-TimerInputCard', {
   prototype: XTimerInputCardProto
});

// X-timerNotifcationCard

let XTimerNotifcationCardProto = Object.create(HTMLElement.prototype);

XTimerNotifcationCardProto.createdCallback = function () {
   let shadow = this.createShadowRoot();
   let card = document.importNode(
      document.querySelector('#templateTimerNotificationCard'),
      true);
   let title = card.content.querySelector('#title');
   title.innerText = 'Hello World';
   this.hidable = true;
   card.content.querySelector('#Dismiss').addEventListener('click',
                                                      this._dismissAll);
   this.setAttributeNode(document.createAttribute('title'));
   this.setAttributeNode(document.createAttribute('hidable'));
   this.setAttributeNode(document.createAttribute('timers'));
   //Set readonly properties
   //Bad things happen when these properties are tinkered with
   Object.defineProperty(this, 'timers', {
       value: [],
       writable: false,
       enumerable: true,
       configurable: false
   });
   this.previous = 0;
   shadow.appendChild(card.content);
}

XTimerNotifcationCardProto.attributeChangedCallback = function (
   attrName, oldValue, newValue) {
   //console.log('ChangeAttr', attrName, oldValue, newValue);
   switch (attrName) {
      case 'title':
         this.shadowRoot.querySelector('#title').innerText = newValue;
         break;
      case 'hidable':
         console.warn('hidable: NotImplementedError');
      default:
         //this.
   }
};

XTimerNotifcationCardProto.add = function (timerInputObj) {
   let clone = document.importNode(
      document.querySelector('#templateTimerNotificationSpan'),
      true);
   let newObj = {
      type: timerInputObj.type,
      time: timerInputObj.time,
      div: null,
      id: randint(0, MaxID)
   };

   let input = clone.content.querySelector('span.time');
   let dismiss = clone.content.querySelector('button.remove');
   let repeat = clone.content.querySelector('button.repeat');

   if (timerInputObj.type == 'alarm') {
      dismiss.innerText = 'Dismiss';
      repeat.innerText = 'Remove';
      input.innerText = this._timerToString(timerInputObj.time, timerInputObj.type);

   } else if (timerInputObj.type == 'timer') {
      dismiss.innerText = 'Dismiss';
      repeat.innerText = 'Repeat';
      input.innerText = "0";
   }
   dismiss.addEventListener('click', this._makeEventClosure('_dismiss', newObj));
   repeat.addEventListener('click', this._makeEventClosure('_repeat', newObj));

   this.timers.push(newObj);
   let card = this.shadowRoot.querySelector('#card')
   card.appendChild(clone.content);
   newObj.div = card.children[card.children.length - 1];
   return newObj.id;
};

XTimerNotifcationCardProto.remove = function (id) {
   let index = this.timers.findIndex((element, index, array) => {
      if (element.id === id) {
         return true;
      }
   });

   let timer = this.timers[index];
   this.shadowRoot.querySelector('#card').removeChild(timer.div);
   this.timers.splice(index, 1);

};

XTimerNotifcationCardProto._makeEventClosure = function (fStr, idObj) {
   let returnFunc = (e) => {
      this[fStr](idObj, e);
   };
   return returnFunc;
};

XTimerNotifcationCardProto._dismiss = function (idObj, e) {
   let dismissEvent = new CustomEvent('remove');
   dismissEvent.id = idObj.id;
   dismissEvent.originType = idObj.type;
   dismissEvent.time = idObj.time;
   this.dispatchEvent(dismissEvent);
   this.remove(idObj.id);
};

XTimerNotifcationCardProto._repeat = function (idObj, e) {
   let repeatEvent = new CustomEvent('remove');
   repeatEvent.id = idObj.id;
   repeatEvent.originType = idObj.type;
   repeatEvent.time = idObj.time;
   this.dispatchEvent(repeatEvent);
   this.remove(idObj.id);
};

XTimerNotifcationCardProto._dismissAll = function () {
   let e = new Event('click') //Use click
   for (let timer in this.timers) {
      if (this.timers.hasOwnProperty(timer)) {
         this._dismiss(timer.id);

      }
   }

}
XTimerNotifcationCardProto._timerToString = (time, type = 'timer') => {

   let str = '';
   if (type === 'alarm') {
      let hr = Math.floor(time / 3600);
      let min = Math.floor(time / 60) % 60;
      let sec = time % 60;

      str = strPad(hr.toString(), 2, '0') + ':' +
            strPad(min.toString(), 2, '0');
   } else if (type === 'timer') {
      let diff = Math.floor((time - Date.now())/1000);
      let hr = Math.floor(diff / 3600);
      let min = Math.floor(diff / 60) % 60;
      let sec = diff % 60;

      str = strPad(hr.toString(), 2, '0') + ':' +
            strPad(min.toString(), 2, '0') + ':' +
            strPad(sec.toString(), 2, '0');
   }
   return str;
};

let XTimerNotifcationCard = document.registerElement('X-timerNotifcationCard', {
   prototype: XTimerNotifcationCardProto
});
// Start up code

const randint = (lower, upper) => {
   return Math.floor(Math.random() * (upper - lower) + lower);
};

const strPad = (str, length, fill = ' ', direction = true) => {
   // direction: true = left, false = right
   let padLen = Math.max(Math.ceil((length - str.length) / fill.length), 0);
   let fillStr = fill.repeat(padLen);
   let returnStr = '';
   if (direction === true) {
      returnStr = fillStr + str;
   } else {
      returnStr = str + fillStr;
   }
   return returnStr;
};

const init = () => {
   let cards = [null, null, null, null];
   cards[0] = document.createElement('x-TimerInputCard');
   cards[1] = document.createElement('x-TimerCard');
   cards[2] = document.createElement('x-TimerCard');
   cards[3] = document.createElement('X-timerNotifcationCard');
   cards[1].title = 'Alarms';
   cards[2].title = 'Timers';
   cards[3].title = 'Notifications';
   for (let i = 0;i < cards.length;i++) {
      window.pseudoBody.appendChild(cards[i]);
   }
   //cards[0].oncreate = (obj) => {console.log(obj);}

   return cards;
}

const [broker, check, onLoad] = (() => {
   let cards;
   let timers = [];
   let interval = 0;
   let saveString = 'x-timer-save';
   let volume = 1;
   let notifications = [];
   let check = () => {
      return [timers, onLeave];
   };
   let onLeave = (e) => {
      let resultString = '';
      for (let i = 0; i < timers.length; i++) {
         resultString += timers[i].toSaveString();
         resultString += ';';
      }
      window.localStorage.setItem(saveString, resultString);
   };

   let onLoad = () => {
      let timerString = window.localStorage.getItem(saveString);
      if (timerString  == null) {
         timerString = '';
      }
      let timerObjArray = timerString.split(';');
      //Remove last element, which is an empty string
      timerObjArray.splice(-1, 1);
//
      const spaceRegex = / /g;
      const voidFunc = () => {return '';};
      const timerObjRegex = /\{type:(\w*?),time:(\d*)\}/;

      for (let i = 0; i < timerObjArray.length; i++) {
         let s = timerObjArray[i].replace(spaceRegex, voidFunc);
         let regexArray = s.match(timerObjRegex);
         let resultObj = {
            type: '',
            time: null
         };
         resultObj.type = regexArray[1];

         if (resultObj.type === 'timer') {
            let then = new Date(parseInt(regexArray[2]));

            if (then < Date.now()) {
               // TODO: Send to Notification area
            } else {
               resultObj.time = then;
               onTimer(resultObj);
            }
         } else {
            resultObj.time = parseInt(regexArray[2]);
            onAlarm(resultObj);
         }
      }
   };

   let makeSound = (e, activeTimerObj) => {
      console.log('Firing: ', e);
      console.log('That: ', activeTimerObj);
      // FIXME: Alarms are somehow duplicated on firing

      // TODO: Entering standby defers all timeouts
      //       Make sure that the current time is close to the trigger time
      // Play sound
      let audio = new Audio;
      // 1 minute of leeway.
      // Timers are prevented from firing will sleeping,
      // and have their resoultion reduced in low power mode
      // Because of this, when waking from a sleep, all the timers that should
      // have fired during the sleep all fire at once.
      // To prevent this, we only make an audio cue on timers that fire in
      // 60 secs from their supposed time
      if (Math.abs(Date.now() - activeTimerObj.time) < 60000) {
         audio.changeVol(volume);
         audio.start();
         let deactivate = () => {
            audio.stop();
         }
         window.setTimeout(deactivate, soundDuration * 1000);
      }


      let index = timers.findIndex((element, index, array) => {
         if (element.id === activeTimerObj.id) {
            return true;
         }
      });

      let timer = timers[index];

      cards[3].add(timer);
      if (timer.type === 'timer') {
         activeTimerObj.timerCard.remove(activeTimerObj.id);
         // Remove timer
         timer.timerID = 0;
         timers.splice(index, 1);

      } else if (timer.type === 'alarm') {
         activeTimerObj.reset();
      }

      onLeave();
   };
   let timerObj = function (e, timerCard) {
      this.type = e.type;
      this.time = e.time;
      this.timerID = 0;
      this.timerCard = timerCard;
      if (this.type === 'timer') {
         let diff = e.time - Date.now();
         this.timerID = window.setTimeout(makeSound, diff, e, this);
         console.log(diff);
         this.id = timerCard.add(e);
      } else if (this.type === 'alarm') {
         let now = new Date;
         let nowNum = now.getHours() * 3600 +
                      now.getMinutes() * 60 +
                      now.getSeconds();
         const fullDay = 86400; // Seconds in a day
         let diff = this.time - nowNum;
         if (diff <= 10) {
             diff += 86400;
         }
         diff *= 1000;
         this.timerID = window.setTimeout(makeSound, diff, e, this);
         this.id = timerCard.add(e);
      } else {
         console.warn('err');
      }

   };
   timerObj.prototype.toString = function () {
      let result = '{';
      const endLine = ',\n';
      const lastLine = '\n';

      result += 'type: ' + this.type + endLine;

      if (this.type === 'alarm') {
         result += 'time: ' + this.time.toString() + endLine;
      } else if (this.type === 'timer') {
         result += 'time: ' + this.time.getTime().toString() + endLine;
      } else {
         result += 'time: ' + this.time.toString() + endLine;
      }

      result += 'id: ' + this.id.toString() + endLine;
      result += 'timerID: ' + this.timerID.toString() + lastLine;
      result += '}'
      return result;
   };
   timerObj.prototype.toSaveString = function () {
      let result = '{';
      const endLine = ', '
      result += 'type: ' + this.type + endLine;
      if (this.type === 'alarm') {
         result += 'time: ' + this.time.toString();
      } else if (this.type === 'timer') {
         result += 'time: ' + this.time.getTime().toString();
      } else {
         result += 'time: ' + this.time.toString();
      }

      result += '}'
      return result;
   };
   timerObj.prototype.reset = function () {
      // Currently only works on alarms
      window.clearTimeout(this.timerID);

      if (this.type === 'alarm') {
         let now = new Date;
         let nowNum = now.getHours() * 3600 +
                      now.getMinutes() * 60 +
                      now.getSeconds();
         const fullDay = 86400; // Seconds in a day
         let diff = this.time - nowNum;
         if (diff <= 10) {
             diff += 86400;
         }
         diff *= 1000;
         this.timerID = window.setTimeout(makeSound, diff, e, this);
         this.id = cards[1].add(e);
      } else if (this.type === 'timer') {
         console.warn('Cannot reset timers');
      } else {
         console.error('Invalid type of timerObj: ', this);
      }
   };

   let onAlarm = (e) => {
      console.log(e);
      if (!e.invalid) {
         let timer = new timerObj(e, cards[1]);
         timers.push(timer);
         onLeave();
      }
   };
   let onTimer = (e) => {
      console.log(e);
      if (!e.invalid) {
         let timer = new timerObj(e, cards[2]);
      let duration = 0;
         timers.push(timer);
         onLeave();
      }
   };
   let onRemove = (e) => {
      let index = timers.findIndex((element, index, array) => {
         if (element.id === e.id) {
            return true;
         }
      });
      let timer = timers[index];
      window.clearTimeout(timer.timerID);
      timers.splice(index, 1);
      onLeave();
   };

      let duration = 0;
   let broker = () => {
      cards = init();
      cards[0].addEventListener('alarm', onAlarm);
      cards[0].addEventListener('timer', onTimer);
      cards[1].addEventListener('remove', onRemove);
      cards[2].addEventListener('remove', onRemove);
      document.body.addEventListener('unload', onLeave);
      interval = setInterval(() => {
         //cards[1].tick();
         cards[2].tick();
      }, 1000);
      onLoad();
   };
   return [broker, check, onLoad];
})();

broker();

document.body.querySelector('x-timernotifcationcard').addEventListener(
   'dismiss', (e) => {console.log(e)}
)
document.body.querySelector('x-timernotifcationcard').addEventListener(
   'repeat', (e) => {console.log(e)}
)
let soundDuration = 30;
// const [activate, deactivate] = (() => {
//    let audio = null
//    let timeOut = null
//    const activate = (e) => {
//       if (audio != null) {
//          window.clearTimeout(timeOut);
//       }
//       [audio, timeout] = setAlarm(getTime(window.mainInput.value));
//    };
//    const deactivate = (e) => {
//       if (audio != null) {
//          audio.stop();
//       }
//    };
//    return [activate, deactivate];
// })();
//
// window.Confirm.addEventListener('click', activate);
// window.Stop.addEventListener('click', deactivate);


/*! getEmPixels  | Author: Tyson Matanich (http://matanich.com), 2013 | License: MIT */
// Modified to use take advantage of ES6 and to improve readability
// https://github.com/tysonmatanich/getEmPixels
const getEmPixels = (element) => {

   const style = 'position:absolute !important;'
              + 'visibility:hidden !important;'
              + 'width:1em !important;'
              + 'font-size:1em !important;'
              + 'padding:0 !important; ';

   /* Since we use Custom Elements and ES6, which requires Chrome >= 45,
      We don't need IE6-7 compatibility
   */
   if (element === undefined) {
      element = document.documentElement;
   }

   // Create and style a test element
   let testElement = document.createElement('i');
   testElement.style.cssText = style;
   element.appendChild(testElement);

   // Get the client width of the test element
   let value = testElement.clientWidth;

   // Remove the test element
   element.removeChild(testElement);

   // Return the em value in pixels
   return value;
};

const standardEm = getEmPixels();
