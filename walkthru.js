(function($, window) {

var circles = [];

$.fn.walkthru = function(action, options) {

  //---------------------------------------------------------------------------
  // highlight
  //---------------------------------------------------------------------------
  if (action === 'highlight') {
    var settings = $.extend({
      "replace": true,
      "class": null,
      "padding": 1.1
    }, options);

    var offset = this.offset();
    var width = this.outerWidth();
    var height = this.outerHeight();
    var cx = offset.left + width / 2;
    var cy = offset.top + height / 2;
    var d = Math.sqrt(width * width + height * height);

    var padding = settings.padding;
    var border = 5;
    var padded = d * padding;
    var r = padded / 2;
    var circle_offset = {
      top: cy - r - border / 2,
      left: cx - r - border / 2
    };

    // replace old highlights
    var circle;

    if (settings.replace) {
      if (circles.length) {
        circle = circles.shift();
      }
      circles.forEach(function(elem) {
        $(elem).remove();
      })
      circles.length = 0;
    }

    // make a new highlight circle
    if (!circle) {
      var circle = $('<div></div>')
        .addClass('walkthru-circle');
      $(document.body).append(circle);
    }

    // custom settings
    if (settings['class']) {
      circle.addClass(settings['class']);
    }
    circles.push(circle);

    // adjust the circle dimensions/position
    circle
      .offset(circle_offset)
      .width(padded)
      .height(padded);

  //---------------------------------------------------------------------------
  // clear-highlights
  //---------------------------------------------------------------------------
  } else if (action === 'clear-highlight') {
    circles.forEach(function(elem) {
      $(elem).remove();
    })
    circles.length = 0;
  }
  return this;
};

var walkthru = window.walkthru || {};


walkthru.wait = function(ms) {
  return function() {
    var x = $.Deferred();
    setTimeout(function() {
      x.resolve(ms);
    }, ms);
    return x.promise();
  }
}


function methodize(obj, func) {
  // because I don't know what I'm doing :)
  return function() {
    return func.apply(obj, arguments);
  };
};



var WalkThru = function() {
  this._remaining_steps = [];
  this._current_step = null;
  this._reaction = new Reaction();

  this.addStep = methodize(this, function(func) {
    var step = new Step(null, func);
    this._reaction.add(function() {
      return step.run();
    });
  });

  this.start = methodize(this, function() {
    return this._reaction.start();
  });
};



var Step = function(walkthru, func) {
  this._walkthru = walkthru;
  this._func = func;

  this._d = new $.Deferred();
  
  this.setup = new Reaction();
  this.postSuccess = new Reaction();
  this.teardown = new Reaction();
  this.postTeardown = new Reaction();

  this.run = methodize(this, function() {
    this._func(this);
    this.setup.start();
    return this._d.promise();
  });

  this.succeed = methodize(this, function() {
    this.setup.stop();
    this.postSuccess.start()
      .then(this._doTeardown);
  });

  this._doTeardown = methodize(this, function() {
    return this.teardown.start()
      .then(this.postTeardown.start)
      .then(function() {
        this._d.resolve(null);
      }.bind(this));
  });

  // Bind an event listener only during this step (remove it on finish).
  this.bind = methodize(this, function(elem, what, handler) {
    $(elem).bind(what, handler);
    this.teardown.add(function() {
      $(elem).unbind(what, handler);
    });
  });

};


var Reaction = function() {
  this._running = false;
  this._queue = [];

  this.start = methodize(this, function() {
    this._running = true;
    return $.when(this._next());
  });

  this.stop = methodize(this, function() {
    this._running = false;
  });

  this._next = methodize(this, function() {
    if (!this._running) {
      return;
    }
    if (this._queue.length) {
      var func = this._queue.shift();
      return $.when(func()).then(this._next.bind(this));
    }
  });

  this.add = methodize(this, function(func) {
    this._queue.push(func);
    if (this._running && this._queue.length == 1) {
      this._next();
    }
    return this;
  });
}


walkthru.WalkThru = WalkThru;


window.walkthru = walkthru;

}(jQuery, window));

