"use strict";

let stopHeart = false;

var settings = {
  particles: {
    length: 6000, // maximum amount of particles
    duration: 4, // particle duration in sec
    velocity: 150, // particle velocity in pixels/sec
    effect1: -1.2, // play with this for a nice effect
    effect2: -0.6, // play with this for a nice effect
    effect3: -0.35, // play with this for a nice effect
    size: 13, // particle size in pixels
  },
};
/*
*/
(function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());
/*
* Point class
*/
var Point = (function() {
  function Point(x, y) {
    this.x = (typeof x !== 'undefined') ? x : 0;
    this.y = (typeof y !== 'undefined') ? y : 0;
  }
  Point.prototype.clone = function() {
    return new Point(this.x, this.y);
  };
  Point.prototype.length = function(length) {
    if (typeof length == 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  };
  Point.prototype.normalize = function() {
    var length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  };
  return Point;
})();
/*
* Particle class
*/
var Particle = (function() {
  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }
  Particle.prototype.initialize = function(x, y, dx, dy, effect) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * effect;
    this.acceleration.y = dy * effect;
    this.age = 0;
  };
  Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };
  Particle.prototype.draw = function(context, image) {
    function ease(t) {
      return (--t) * t * t + 1;
    }
    const size = image.width * ease(this.age / settings.particles.duration);
    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(
      image,
      this.position.x - size / 2,
      this.position.y - size / 2,
      (this.position.x - size / 2 < window.innerWidth / 2 - 3 && this.position.x - size / 2 > window.innerWidth / 2 - 7) ? 0 : size,
      size,
);
  };
  return Particle;
})();
/*
* ParticlePool class
*/
const ParticlePool = (function() {
  const duration = settings.particles.duration;
  let firstFree = 0, firstActive = 0;
  let particles;


  function ParticlePool(length) {
    // create and populate particle pool
    particles = new Array(length);
    for (let i = 0; i < particles.length; i++)
      particles[i] = new Particle();
  }
  ParticlePool.prototype.add = function(x, y, dx, dy, effect) {
    particles[firstFree].initialize(x, y, dx, dy, effect);
  
    // handle circular queue
    firstFree++;
    if (firstFree   == particles.length) firstFree   = 0;
    if (firstActive == firstFree) firstActive++;
    if (firstActive == particles.length) firstActive = 0;
  };
  ParticlePool.prototype.update = function(deltaTime) {
    var i;
  
    // update active particles
    if (firstActive < firstFree) {
      for (let i = firstActive; i < firstFree; i++) {
        particles[i].update(deltaTime);
        if (stopHeart) break;
      }
    }
    if (firstFree < firstActive) {
      for (let i = firstActive; i < particles.length; i++) {
        particles[i].update(deltaTime);
        if (stopHeart) break;
      }
      for (let i = 0; i < firstFree; i++) {
        particles[i].update(deltaTime);
        if (stopHeart) break;
      }
    }
  
    // remove inactive particles
    while (particles[firstActive].age >= duration && firstActive != firstFree) {
      firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    }
  
  
  };
  ParticlePool.prototype.draw = function(context, image) {
    // draw active particles
    if (firstActive < firstFree) {
      for (let i = firstActive; i < firstFree; i++) {
        particles[i].draw(context, image);
        if (stopHeart) break;
      }
    }
    if (firstFree < firstActive) {
      for (let i = firstActive; i < particles.length; i++) {
        particles[i].draw(context, image);
        if (stopHeart) break;
      }
      for (let i = 0; i < firstFree; i++) {
        particles[i].draw(context, image);
        if (stopHeart) break;
      }
    }
  };
  return ParticlePool;
})();
/*
* Putting it all together
*/
(function(canvas) {
  const contextInner = canvas.getContext('2d'),
      contextOuter = canvas.getContext('2d'),
      particlesInner = new ParticlePool(settings.particles.length),
      particlesOuter = new ParticlePool(settings.particles.length),
      particleRate = settings.particles.length / settings.particles.duration;
  let time;

  // get point on heart with -PI <= t <= PI
  function pointOnHeart(t) {
    return new Point(
      160 * Math.pow(Math.sin(t), 3),
      130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t)
    );
  }

  // creating the particle image using a dummy canvas
  const image = () => {
    const canvasVirtual  = document.createElement('canvas'),
        contextVirtual = canvasVirtual.getContext('2d');
    canvasVirtual.width = settings.particles.size;
    canvasVirtual.height = settings.particles.size;
    // helper function to create the path
    function to(t) {
      let point = pointOnHeart(t);
      point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
      point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
      return point;
    }
    // create the path
    contextVirtual.beginPath();
    let t = -Math.PI;
    let point = to(t);
    contextVirtual.moveTo(point.x, point.y);
    while (t < Math.PI) {
      t += 0.01; // baby steps!
      point = to(t);
      contextVirtual.lineTo(point.x, point.y);
    }
    contextVirtual.closePath();
    // create the fill
    contextVirtual.fillStyle = 'rgba(238, 125, 155, 0.8)';
    contextVirtual.fill();
    contextVirtual.fillStyle = 'white';
    contextVirtual.font = '16px Arial';
    contextVirtual.textAlign = 'center';
    contextVirtual.fillText('<3', point.x, point.y - 30);
    // create the image
    const newImage = new Image();
    newImage.src = canvasVirtual.toDataURL();
    canvasVirtual.remove();
    return newImage;
  };

  // render that thing!
  function render() {
    // next animation frame
    requestAnimationFrame(render);
  
    // update time
    var newTime   = new Date().getTime() / 1000,
        deltaTime = newTime - (time || newTime);
    time = newTime;
  
    // clear canvas
    contextInner.clearRect(0, 0, canvas.width, canvas.height);
  
    // create new particles
    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone().length(settings.particles.velocity);
      particlesInner.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y, settings.particles.effect1);
    }
  
    // update and draw particles
    particlesInner.update(deltaTime);
    particlesInner.draw(contextInner, image());
  }

  function render1() {
    // next animation frame
    requestAnimationFrame(render1);
  
    // update time
    var newTime   = new Date().getTime() / 1000,
        deltaTime = newTime - (time || newTime);
    time = newTime;
  
    // clear canvas
    contextOuter.clearRect(0, 0, canvas.width, canvas.height);
  
    // create new particles
    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone().length(settings.particles.velocity);
      particlesOuter.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y, settings.particles.effect2);
    }
  
    // update and draw particles
    particlesOuter.update(deltaTime);
    particlesOuter.draw(contextOuter, image());
  }

  function render2() {
    // next animation frame
    requestAnimationFrame(render2);
  
    // update time
    var newTime   = new Date().getTime() / 1000,
        deltaTime = newTime - (time || newTime);
    time = newTime;
  
    // clear canvas
    contextOuter.clearRect(0, 0, canvas.width, canvas.height);
  
    // create new particles
    var amount = particleRate * deltaTime;
    for (let i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone().length(settings.particles.velocity);
      particlesOuter.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y, settings.particles.effect3);
    }
  
    if (!stopHeart) {
      // update and draw particles
      particlesOuter.update(deltaTime);
      particlesOuter.draw(contextOuter, image());
    }
  }

  // handle (re-)sizing of the canvas
  function onResize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.onresize = onResize;

  // delay rendering bootstrap
  setTimeout(function() {
    onResize();
    render();
    render1();
    render2();
  }, 100);
  setTimeout(() => {
    stopHeart = true;
  }, 12000);
  setTimeout(function() {
    const board = document.getElementById('pinkboard');
    board.style.opacity = '0';
  }, 12000);
})(document.getElementById('pinkboard'));