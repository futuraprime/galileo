var AudioContext = window.AudioContext || window.webkitAudioContext;

if(!AudioContext) {
  alert('sorry, you\'ll need a different browser');
}

var context = new AudioContext();

// returns a promise for the buffer
function getSound(url) {
  var dfd = $.Deferred();
  var request = window.request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      dfd.resolve(buffer);
    }, function() {
      dfd.reject();
    });
  };

  request.send();
  return dfd.promise();
}

function playSound(buffer) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);

  source.start(0);
}

// getSound('audio/1st_String_E_64kb.mp3').then(function(buffer) { playSound(buffer); });
// getSound('audio/2nd_String_B_64kb.mp3').then(function(buffer) { playSound(buffer); });
// getSound('audio/3rd_String_G_64kb.mp3').then(function(buffer) { playSound(buffer); });
// getSound('audio/4th_String_D_64kb.mp3').then(function(buffer) { playSound(buffer); });
// getSound('audio/5th_String_A_64kb.mp3').then(function(buffer) { playSound(buffer); });
// getSound('audio/6th_String_E_64kb.mp3').then(function(buffer) { playSound(buffer); });

var s = Snap("#interactive");
var ramp = s.polygon();

function drawRamp(x, y, w, h) {
  ramp.attr({points: [x,y,x,y+h,x+w,y+h]});
}
drawRamp(20, 20, 600, 100);
