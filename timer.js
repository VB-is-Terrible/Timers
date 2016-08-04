const alarmTime = 10000;

function setAlarm(date, duration = alarmTime) {
   let now = new Date;
   let diff = date.getTime() - now.getTime();
   let audio = new Audio;
   const activate = (e) => {
      audio.start();
      if (duration != 0) {
         window.setTimeout(deactivate, duration);
      }
   };
   const deactivate = (e) => {
      audio.stop();
   };
   let timeOutID = window.setTimeout(activate, diff);
   return [audio, timeOutID];
}

function getTime(timeInput) {
   const totalMinutes = (hour, minute) => {
      return hour * 60 + minute;
   };
   let hour = parseInt(timeInput.slice(0,2));
   let minute = parseInt(timeInput.slice(3,5));
   let now = new Date;
   let then = totalMinutes(hour, minute);
   let nowMin = totalMinutes(now.getHours(), now.getMinutes());
   let result = new Date;
   if (then < nowMin) {
      // Time is on the next day
      then += 24 * 60;
   }
   let diff = then - nowMin;
   result.setTime(result.getTime() + diff * 60 * 1000);
   return result;
}

function setAudioTimeout(time, duration = alarmTime) {
   let audio = new Audio;
   const activate = (e) => {
      audio.start();
      if (duration != 0) {
         window.setTimeout(deactivate, duration);
      }
   };
   const deactivate = (e) => {
      audio.stop();
   };
   let timeOutID = window.setTimeout(activate, diff);
   return [audio, timeOutID];
}
