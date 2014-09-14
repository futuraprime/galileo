/* use strict */

// =================
// Audio code
//
// This is handles setting up all the audio stuff we'll be using.
// =================
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

/*jshint loopfunc: true */
for(var i=0,l=audioFiles.length; i<l; ++i) (function(i) {
  getSound(audioFiles[i]).then(function(buffer) {
    audios[i] = buffer;
  });
})(i);


// ==============
// Interactive!
// ==============
var s = Snap("#interactive");

var $svg = $('#interactive');
var width = $svg.width();
var height = $svg.height();

// =======
// Ramp
//
// Ramp is... you know, the ramp.
// Balls and Pingers get attached to the ramp, so it sort of runs the show.
// =======
function Ramp(paper) {
  this.paper = paper;
  this.representation = paper.polygon();
  this.pingers = [];
}
Ramp.prototype.draw = function(x, y, w, h, padding) {
  padding = this.padding = padding || 0;
  x = this.x = x + padding;
  y = this.y = y + padding + 20; //space for the pingers
  w = this.w = w - padding * 2;
  h = this.h = h - padding * 2 - 20;
  this.representation.attr({points: [x,y,x,y+h,x+w,y+h]});
};
Ramp.prototype.getPositionByPercent = function(percent) {
  percent = percent / 100;
  return {
    x : this.x + this.w * percent,
    y : this.y + this.h * Math.min(percent, 1)
  };
};
Ramp.prototype.getPercentByXPosition = function(position) {
  return 100 * (position - this.x) / this.w;
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

  // cool beans bro
  // now we gotta make some noise
  var pingerLocations = _.pluck(this.pingers, 'x');
  var nextPinger = this.pingers[0];
  var pingerIndex = 0;
  // ok, so we can actually calculate the pingers right away here...
  function placeFromTime(runningTime) {
    return Math.pow((runningTime/1000), 2) * factor + initialPosition;
  }
  function timeFromPlace(place) {
    // return initialPosition - 
  }
  for(var i=0,l=this.pingers.length;i<l;++i) {

  }

  ball.stepFn = function(timestamp) {
    if(!ball.start) { ball.start = timestamp; }
    if(ball.loopBreak) {
      ball.loopBreak = false;
      return;
    }
    var runningTime = timestamp - ball.start;

    var distance = placeFromTime(runningTime);
    self._placeBall(ball, distance);
    if(nextPinger && ball.x > nextPinger.x) {
      nextPinger.ping();
      nextPinger = self.pingers[++pingerIndex];
    }
    if(distance < 120) {
      requestAnimationFrame(ball.stepFn);
    }
  };
  requestAnimationFrame(ball.stepFn);
};
Ramp.prototype.attachPinger = function(pinger) {
  this.pingers.push(pinger);
  pinger.ramp = this;
  this.updatePingerBounds();
};
Ramp.prototype.createPinger = function(percent, audio) {
  var pos = this.getPositionByPercent(percent);
  this.attachPinger(
    new Pinger(this.paper, audio, this.getPositionByPercent(percent).x)
  );
};
Ramp.prototype.createPingerSet = function(pingerSet) {
  // a pingerSet is an array of tuples of percent and sound:
  // [[15,0], [30,1], [45,2]], e.g.
  for(var i=0,l=pingerSet.length;i<l;++i) {
    this.createPinger.apply(this, pingerSet[i]);
  }
};
Ramp.prototype.updatePingerPositions = function(positions) {
  for(var i=0,l=this.pingers.length;i<l;++i) {
    if(typeof positions[i] != 'number') { break; }
    this.pingers[i].moveTo(this.getPositionByPercent(positions[i]).x, true);
  }
};
Ramp.prototype.reportPingerSet = function() {
  var pingerSet = [];
  for(var i=0,l=this.pingers.length;i<l;++i) {
    pingerSet.push([
      this.getPercentByXPosition(this.pingers[i].x),
      this.pingers[i].audioID
    ]);
  }
  return pingerSet;
};
Ramp.prototype.updatePingerBounds = function() {
  this.pingers = _.sortBy(this.pingers, function(item) { return item.x; });
  for(var i=0,l=this.pingers.length;i<l;++i) {
    if(i < l - 1 && this.pingers[i].x === this.pingers[i+1].x) {
      // just to make sure we don't have directly overlapping pingers
      this.pingers[i+1].x += 10;
      this.pingers[i+1].moveTo(this.pingers[i+1].x);
    }
    if(i === 0) {
      // first pinger
      this.pingers[i].lo = this.x;
    } else {
      this.pingers[i].lo = this.pingers[i-1].x;
    }
    if(i === l - 1) {
      // last pinger
      this.pingers[i].hi = this.x + this.w;
    } else {
      this.pingers[i].hi = this.pingers[i + 1].x;
    }
  }
};


// ========
// Ball
// ========
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

// ============
// Pinger
//
// Pingers are the little things you drag around & make noise.
// ============
/* jshint multistr:true */
function Pinger(paper, audioID, position) {
  this.audioID = audioID;
  this.x = position;
  this.group = paper.group();
  this.line = paper.line(0, 0, 0, height - 20);
  this.representation = paper.path('M10.7,18.6L0,25l-10.7-6.4c-1.1-0.7-1.8-1.9-1.8-3.2V3.8\
  c0-2.1,1.7-3.8,3.8-3.8H8.8c2.1,0,3.8,1.7,3.8,3.8v11.6C12.5,16.7,11.8,17.9,10.7,18.6z');
  // TODO: incorporate padding?
  this.group.add(this.line, this.representation);
  this.group.attr('transform', 'translate3d('+this.x+'px,0,0)');
  this.group.addClass('pinger');
  this.group.drag(
    this.onMove, this.onStart, this.onEnd,
    this, this, this
  );
}
Pinger.prototype.ping = function() {
  playSound(audios[this.audioID]);
};
Pinger.prototype.moveTo = function(position, animate) {
  console.log('moving to', position);
  var self = this;
  if(animate) {
    Snap.animate(this.x, position, function(val) {
      self.group.attr('transform', 'translate3d('+position+'px,0,0)');
    }, 250);
  } else {
    this.group.attr('transform', 'translate3d('+position+'px,0,0)');
  }
  this.x = position;
};
Pinger.prototype.addBounds = function(a, b) {
  this.lo = a > b ? b : a;
  this.hi = a > b ? a : b;
};
Pinger.prototype.onStart = function() {
  this.moveStartX = this.x;
  this.ping();
};
Pinger.prototype.onMove = function(dx, dy) {
  // we're just keeping the pinger in bounds here
  this.x = Math.max(Math.min(this.moveStartX + dx, this.hi), this.lo);
  this.group.attr('transform', 'translate3d('+this.x+'px,0,0)');
};
Pinger.prototype.onEnd = function() {
  this.moveStart = undefined;
  if(this.ramp) { this.ramp.updatePingerBounds(); }
};


// ========
// Graph
//
// this plots the positions of the pingers
// ========


var RampFsm = machina.Fsm.extend({
  initialize : function(paper) {
    this.paper = paper;
  },
  solve : function() {
    // not the solution!!!!!
    this.ramp.updatePingerPositions([3,6,12,24,48,96]);
  },
  states : {
    'ramp_setup' : {
      _onEnter : function() {
        var self = this;
        var ramp = this.ramp = new Ramp(this.paper);
        this.ramp.draw(0, 0, width, height, 20);
        this.ball = new Ball(this.paper);
        this.ramp.placeBall(this.ball, 1);
        this.ramp.createPingerSet([[15,0],[30,1],[45,2],[60,3],[75,4],[90,5]]);

        this.$interact = $('#interact').click(function() {
          self.handle('swap');
        });
        this.$solve = $('#solve').click(function() {
          self.handle('solve');
        });

        this.transition('ready');
      }
    },
    'ready' : {
      _onEnter : function() {
        this.ramp.placeBall(this.ball, 1);
        this.$interact.text('Release');
      },
      solve : function() { return this.solve.apply(this, arguments); },
      swap : function() {
        this.transition('rolling');
      }
    },
    'rolling' : {
      _onEnter : function() {
        this.ramp.release(this.ball, 7);
        this.$interact.text('Reset');
      },
      solve : function() { return this.solve.apply(this, arguments); },
      swap : function() {
        this.transition('ready');
      }
    }
  },
  initialState : 'ramp_setup'
});
var rampFsm = new RampFsm(s);
