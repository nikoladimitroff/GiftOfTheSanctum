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
  rotate: function(angle) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle);
    return new Vector(this.x * cos - this.y * sin,
                      this.x * sin + this.y * cos);
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
  },
  toString: function() {
    return "(" + this.x + ", " + this.y + ")";
  },
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
Vector.rotate = function(a, b, angle) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle);
    var x = a.x,
        y = a.y;
    b.set(x * cos - y * sin, x * sin + y * cos);
    return b;
},
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

Vector.zero = new Vector(0, 0);
Vector.right = new Vector(1, 0);
Vector.up = new Vector(0, 1);
Vector.left = new Vector(-1, 0);
Vector.down = new Vector(0, -1);

Matrix = function (m11, m12, m13, m21, m22, m23, m31, m32, m33) {  
    this.m11 = m11 || 0;
    this.m12 = m12 || 0;
    this.m13 = m13 || 0;
    this.m21 = m21 || 0;
    this.m22 = m22 || 0;
    this.m23 = m23 || 0;
};

Matrix.prototype = {
    multiply: function  (m) {
        if (m instanceof Matrix) 
            return new Matrix(this.m11 * m.m11 + this.m12 * m.m21,
                              this.m11 * m.m12 + this.m12 * m.m22,
                              this.m11 * m.m13 + this.m12 * m.m23 + this.m13,
                              this.m21 * m.m11 + this.m22 * m.m21,
                              this.m21 * m.m12 + this.m22 * m.m22,
                              this.m21 * m.m13 + this.m22 * m.m23 + this.m23);  
        else
            throw new Error("Scalar multiplication not implemented!");
                              
    },
    transform: function (v) {
        return new Vector(this.m11 * v.x + this.m12 * v.y + this.m13,
                          this.m21 * v.x + this.m22 * v.y + this.m23);
    },
    invert: function () {
        var inverseDet = 1 / (this.m11 * this.m22 - this.m12 * this.m21);

        return new Matrix(this.m22 * inverseDet, 
                          -this.m12 * inverseDet,
                          (this.m12 * this.m23 - this.m13 * this.m22) * inverseDet,
                          -this.m21 * inverseDet,
                          this.m11 * inverseDet,
                          -(this.m11 * this.m23 - this.m13 * this.m21) * inverseDet);
    }
};

Matrix.fromRotation = function (angle) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle);

    return new Matrix(cos, -sin, 0,
                      sin, cos, 0);
};


Matrix.fromTranslation = function (translation) {
    return new Matrix(1, 0, translation.x,
                      0, 1, translation.y);
};

var physics = {};
physics.EulerIntegrator = function () {};
physics.EulerIntegrator.prototype.integrate = function (states, dt, friction) {
    for (var i = 0; i < states.length; i++) {
        var state = states[i];

        var friction = new Vector();
        if (!state.frictionless && state.velocity.length() != 0) /* disabled */ {
            var frictionCoefficient = 0.0003; // wood

            friction = state.acceleration.multiply(-1 * frictionCoefficient * state.mass);
            Vector.add(state.acceleration, friction, state.acceleration);
        }
        Vector.add(state.velocity, state.acceleration.multiply(dt), state.velocity);
        var movementVelocity = physics.Steering[state.movementFunction](state);
        var totalVelocity = state.velocity.add(movementVelocity).multiply(dt);
        state.totalVelocity = totalVelocity;
        Vector.add(state.position, totalVelocity, state.position);


        var epsilon = 10;
        if (state.velocity.lengthSquared() <= epsilon * epsilon)
            state.velocity.set(0, 0);
        if (state.acceleration.lengthSquared() <= epsilon * epsilon)
            state.acceleration.set(0, 0);
    }
}


physics.Steering = {};
function tryStopMovement(obj) {
    var dist = obj.getCenter().subtract(obj.target).lengthSquared();
    var radius = obj.collisionRadius * 0.5;  /* magic */
    if (dist < radius * radius) {
        obj.target = null;
        return true;
    }
    return false;
}

physics.Steering.linear = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) return Vector.zero;

        var velocity = obj.target.subtract(obj.size.divide(2)).subtract(obj.position);
        Vector.normalize(velocity);
        Vector.multiply(velocity, obj.speed, velocity);
        return velocity;
    }
    return Vector.zero;
};

physics.Steering.arrive = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) return Vector.zero;

        var toTarget = obj.target.subtract(obj.size.divide(2)).subtract(obj.position);
        var dist = toTarget.length();

        var decelerationTweaker = 1.5; // magic
        var speed = dist / decelerationTweaker;
        speed = Math.min(speed, obj.speed);
        Vector.multiply(toTarget, speed / dist, toTarget);
        return toTarget;
    }
    return Vector.zero;
};


Math.sign = Math.sign || function(x) {
    return x / Math.abs(x) || 0;   
};

physics.Steering.quadratic = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) {
            delete obj.coeffiecients;
            return Vector.zero;
        }
        if (!obj.coefficients) {
            var center = obj.getCenter();
            var toCenter = center.subtract(obj.target);
            var angle = Math.PI - Math.atan2(toCenter.y, toCenter.x);
            
            var rotation = Matrix.fromRotation(angle);
            var translation = Vector.lerp(rotation.transform(center), rotation.transform(obj.target), 0.5)
            var totalTransform = rotation;
            totalTransform.m13 = -translation.x;
            totalTransform.m23 = -translation.y;
            
            var transformedCenter = totalTransform.transform(center),
                transformedTarget = totalTransform.transform(obj.target);

            var x1 = Math.min(transformedCenter.x, transformedTarget.x),
                y1 = 0,
                x2 = Math.max(transformedCenter.x, transformedTarget.x),
                y2 = 0;
            
            var a = 2 * ((angle >= 0 && angle < Math.PI / 2) || (angle >= Math.PI && angle < 3 * Math.PI / 2)) - 1,
                b = (-x1 - x2) / a,
                c = x1 * x2 / a,
                scale = 1 / (x2 - x1),
                halfPlaneX = -Math.sign(transformedCenter.x - transformedTarget.x);
                

            obj.coefficients = {
                a: a,
                b: b,
                c: c,
                transform: totalTransform,
                scale: scale,
                halfPlaneX: halfPlaneX          
            }
        }
        
        var a = obj.coefficients.a,
            b = obj.coefficients.b,
            c = obj.coefficients.c,
            scale = obj.coefficients.scale,
            matrix = obj.coefficients.transform,
            halfPlaneX = obj.coefficients.halfPlaneX;
        
        var center = obj.getCenter();
        var transformedCenter= matrix.transform(center);
        var epsilon = 1;
        var x = transformedCenter.x + epsilon * halfPlaneX;
        var y = (a * x * x + b * x + c) * scale;
        var p = new Vector(x, y);
        var dir = matrix.invert().transform(p).subtract(center).normalized();

        return dir.multiply(obj.speed);
    }
    return Vector.zero;
};


if(typeof module != "undefined" && module.exports) {
    module.exports.Vector = Vector;
    module.exports.physics = physics;
}