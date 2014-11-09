function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype = {
  negated: function() {
    return new Vector(-this.x, -this.y);
  },
  add: function(v) {
    if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y);
    else return new Vector(this.x + v, this.y + v);
  },
  subtract: function(v) {
    if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y);
    else return new Vector(this.x - v, this.y - v);
  },
  multiply: function(v) {
    if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y);
    else return new Vector(this.x * v, this.y * v);
  },
  divide: function(v) {
    if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y);
    else return new Vector(this.x / v, this.y / v);
  },
  equals: function(v) {
    return this.x == v.x && this.y == v.y;
  },
  dot: function(v) {
    return this.x * v.x + this.y * v.y
  },
  length: function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },
  lengthSquared: function() {
    return this.x * this.x + this.y * this.y;
  },
  normalized: function() {
    return this.divide(this.length());
  },
  min: function() {
    return Math.min(this.x, this.y);
  },
  max: function() {
    return Math.max(this.x, this.y);
  },
  angleTo: function(a) {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  },
  angleTo360: function(a) {
    var n1 = this.clone(),
        n2 = a.clone();
    Vector.normalize(n1);
    Vector.normalize(n2);
    var cos = n1.dot(n2);
    var sin = ((n2.x + n2.y) - (n1.x + n1.y) * cos) / (n1.x - n1.y);
    var angle = Math.acos(cos);
    
    if (sin <= 0)
        angle = -angle;
        
    angle += Math.PI / 2
    return angle;
  },
  toArray: function() {
    return [this.x, this.y];
  },
  clone: function() {
    return new Vector(this.x, this.y);
  },
  set: function(x, y) {
    if(y === undefined) {
      this.x = x.x;
      this.y = x.y;
      return this;
    }
    this.x = x; this.y = y;
    return this;
  }
};


Vector.negate = function(a, b) {
  b.x = -a.x; b.y = -a.y;
  return b;
};
Vector.add = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x + b.x; c.y = a.y + b.y;}
  else { c.x = a.x + b; c.y = a.y + b; }
  return c;
};
Vector.subtract = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x - b.x; c.y = a.y - b.y; }
  else { c.x = a.x - b; c.y = a.y - b; }
  return c;
};
Vector.multiply = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x * b.x; c.y = a.y * b.y; }
  else { c.x = a.x * b; c.y = a.y * b; }
  return c;
};
Vector.divide = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x / b.x; c.y = a.y / b.y; }
  else { c.x = a.x / b; c.y = a.y / b; }
  return c;
};
Vector.unit = function(a, b) {
  var length = a.length();
  b.x = a.x / length;
  b.y = a.y / length;
  return b;
};
Vector.normalize = function(a) {
  var length = a.length();
  a.x /= length;
  a.y /= length;
  return a;
};
Vector.fromAngles = function(phi) {
  return new Vector(Math.cos(phi), Math.sin(phi));
};
Vector.randomDirection = function() {
  return Vector.fromAngles(Math.random() * Math.PI * 2);
};
Vector.min = function(a, b) {
  return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y));
};
Vector.max = function(a, b) {
  return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y));
};
Vector.lerp = function(a, b, alpha) {
  return b.subtract(a).multiply(alpha).add(a);
};
Vector.fromArray = function(a) {
  return new Vector(a[0], a[1]);
};
Vector.angleBetween = function(a, b) {
  return a.angleTo(b);
};

Vector.right = new Vector(1, 0);
Vector.up = new Vector(0, 1);

var physics = (function (physics) {
    EulerIntegrator = function () { }
    EulerIntegrator.prototype.integrate = function (states, dt, friction) {
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            if (!state.frictionless)
                Vector.multiply(state.acceleration, friction, state.acceleration);
            Vector.add(state.velocity, state.acceleration.multiply(dt), state.velocity);
            Vector.add(state.position, state.velocity.multiply(dt), state.position);
        }
    }
    physics.EulerIntegrator = EulerIntegrator;
    return physics;
})(physics || {});


if(typeof module != "undefined" && module.exports) {
    module.exports.Vector = Vector;
    module.exports.physics = physics;
}