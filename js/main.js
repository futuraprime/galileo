var AudioContext = window.AudioContext || window.webkitAudioContext;
// var requestAnimationFrame = window.requestAnimationFrame;

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

var audioFiles = [
  'audio/1st_String_E_64kb.mp3',
  'audio/2nd_String_B_64kb.mp3',
  'audio/3rd_String_G_64kb.mp3',
  'audio/4th_String_D_64kb.mp3',
  'audio/5th_String_A_64kb.mp3',
  'audio/6th_String_E_64kb.mp3'
];
var audios = [];

for(var i=0,l=audioFiles.length; i<l; ++i) (function(i) {
  getSound(audioFiles[i]).then(function(buffer) {
    audios[i] = buffer;
  });
})(i);

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
    y : this.y + this.h * Math.min(percent, 1)
  };
};
// ball is a Ball; position is a percent of the way down the ramp
Ramp.prototype.placeBall = function(ball, position) {
  ball.loopBreak = true;
  this._placeBall.apply(this, arguments);
};
Ramp.prototype._placeBall = function(ball, position) {
  ball.percent = position;
  position = this.getPositionByPercent(position || 0);
  position.y -= ball.r;
  ball.ramp = this;
  ball.move(position);
};
Ramp.prototype.release = function(ball, factor) {
  var self = this;
  var initialPosition = ball.percent;
  factor = factor || 1;
  if(ball.ramp != this) { return; }
  // insert gravity!
  // ok, to do this I'm going to need some calculus.
  // we know things fall at t^2 speed... so if it's at 
  // p=0 at t=0, at t=1 it'll be at p=32 and at t=2 it'll be at
  // p=96
  ball.start = null;
  ball.loopBreak = false;
  ball.stepFn = function(timestamp) {
    if(!ball.start) { ball.start = timestamp; }
    if(ball.loopBreak) {
      ball.loopBreak = false;
      return;
    }
    var runningTime = timestamp - ball.start;

    var distance = Math.pow((runningTime/1000), 2) * factor + initialPosition;
    self._placeBall(ball, distance);
    if(distance < 120) {
      requestAnimationFrame(ball.stepFn);
    }
  };
  requestAnimationFrame(ball.stepFn);

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

function Pinger(paper, position) {
  this.x = 0;
  this.y = 0;
  this.representation = paper.rect(this.x, this.y, 10, height);
}
new Pinger(s, 10);

var ramp = new Ramp(s);
ramp.draw(0, 0, width, height, 20);
// var ball = new Ball(s);
// ramp.placeBall(ball, 1);
// ramp.release(ball, 4);

var RampFsm = machina.Fsm.extend({
  // maybe properly segment all this later?
  initialize : function(paper) {
    this.ramp = ramp;
    this.ball = new Ball(paper);
    this.ramp.placeBall(this.ball, 1);
  },
  states : {
    'active' : {
      _onEnter : function() {

      },
      _onExit : function() {

      },
      reset : function() {
        this.ramp.placeBall(this.ball, 1);
      },
      start : function() {
        this.ramp.release(this.ball, 4);
      }
    }
  },
  initialState : 'active'
});
var rampFsm = new RampFsm(s);
