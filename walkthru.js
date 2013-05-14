(function($) {

var circles = [];

$.fn.walkthru = function(action, options) {
  if (action === 'highlight') {
    var settings = $.extend({
      "replace": true,
      "class": null
    }, options);

    var offset = this.offset();
    var width = this.width();
    var height = this.height();
    var cx = offset.left + width / 2;
    var cy = offset.top + height / 2;
    var d = Math.sqrt(width * width + height * height);

    var padding = 1.4;
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
  } else if (action === 'clear-highlights') {
    circles.forEach(function(elem) {
      $(elem).remove();
    })
    circles.length = 0;
  }
  return this;
};

}(jQuery));