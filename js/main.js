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

var $svg = $('#interactive');
var width = $svg.width();
var height = $svg.height();

function Ramp(paper) {
  this.representation = paper.polygon();
}
Ramp.prototype.draw = function(x, y, w, h, padding) {
  padding = this.padding = padding || 0;
  x = this.x = x + padding;
  y = this.y = y + padding;
  w = this.w = w - padding * 2;
  h = this.h = h - padding * 2;
  this.representation.attr({points: [x,y,x,y+h,x+w,y+h]});
};
Ramp.prototype.getPositionByPercent = function(percent) {
  percent = percent / 100;
  return {
    x : this.x + this.w * percent,
    y : this.y + this.h * percent
  };
};
// ball is a Ball; position is a percent of the way down the ramp
Ramp.prototype.placeBall = function(ball, position) {
  position = this.getPositionByPercent(position || 0);
  position.y -= ball.r;
  ball.ramp = this;
  ball.move(position);
};
Ramp.prototype.release = function(ball, duration) {
  if(ball.ramp != this) { return; }
  // insert gravity!
};

function Ball(paper, radius) {
  this.x = 0;
  this.y = 0;
  this.r = radius || 10;
  this.speed = 0;
  this.representation = paper.circle(this.x, this.y, this.r);
}
Ball.prototype.move = function(x,y) {
  // object overload
  if(_.isObject(x)) { y = x.y; x = x.x; }

  this.x = x;
  this.y = y;
  this.representation.attr({
    cx : x,
    cy : y
  });
};

var ramp = new Ramp(s);
ramp.draw(0, 0, width, height, 20);
var ball = new Ball(s);
ramp.placeBall(ball, 1);
ramp.release(ball, 5000);
