var Forum = (function() {
  var construct,

  construct = function(canvasId) {
    this.context = null;
    this.initCanvas(canvasId);

    arr_hash = [
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 4},
        {indent: 3},
        {indent: 3},
        {indent: 2},
        {indent: 1},
        {indent: 1},
      ];
    this.drawThread(arr_hash);
  };

  construct.prototype.drawThread = function(thread_hash) {
    var indent = 0,
        previous_indent = 0,
        indent_stack = [0],
        x = 0,
        y = 0;
    this.drawPost(12, 20);
    for (i = 1; i < thread_hash.length; i++) {
      indent = thread_hash[i].indent;
      previous_indent = thread_hash[i - 1].indent;
      x = indent * 12;
      y = i * 20;
      this.drawPost(x + 12, y + 20);
      this.context.beginPath();
      this.context.strokeStyle = "#999";
      if (indent > previous_indent) {
        this.context.moveTo(x + 1, y + 2);
        this.context.lineTo(x + 6, y + 12);
      } else if (indent < previous_indent) {
        this.context.moveTo(x + 6, indent_stack[indent]);
        this.context.lineTo(x + 6, y);
      } else {
        this.context.moveTo(x + 6, y);
      }
      this.context.lineTo(x + 6, y + 20);
      this.context.stroke();
      this.context.closePath();
      indent_stack[indent] = y + 20;
    }
  };

  construct.prototype.drawPost = function(x, y) {
    this.context.strokeStyle = "#000";
    this.context.beginPath();
    this.context.arc(x, y, 2, 0, Math.PI * 2, false);
    this.context.closePath();
    this.context.stroke();
    this.context.fillStyle = "#000";
    this.context.fill();
  };

  construct.prototype.initCanvas = function(canvasId) {
    var my_canvas = $(canvasId).get(0);
    this.context = my_canvas.getContext("2d");
  };

  return construct;
}());
