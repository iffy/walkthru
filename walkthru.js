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
walkthru.doSequence = function(options) {
  var settings = $.extend({
    "units": 1000,
    "delayBefore": 0,
    "delayAfter": 0,
    "actions": []
  }, options);

  var current_time = 0;
  settings.actions.forEach(function(action) {
    var delayBefore = action.delayBefore || settings.delayBefore;
    var delayAfter = action.delayAfter || settings.delayAfter;
    var delay = current_time + delayBefore;
    setTimeout(action.action, delay * settings.units);
    current_time = delay + delayAfter;
  })
  return current_time;
}

var remaining_steps = [];
walkthru.walkthru = function(options) {
  this._remaining_steps = [];
  this._current_step = null;

  this.next = function() {
    var delay = 0;
    if (this._current_step && this._current_step.cleanup) {
      delay = this._current_step.cleanup();
    }
    if (delay === null || delay === undefined) {
      delay = 0;
    }

    this._current_step = this._remaining_steps.shift();
    if (this._current_step) {
      setTimeout(this._current_step.action, delay);
    }    
  }.bind(this);

  this.addSteps = function(steps) {
    this._remaining_steps = steps;
  }.bind(this);

  this.start = function() {
    this.next();
  }.bind(this);

  return this;
}

window.walkthru = walkthru;

}(jQuery, window));

