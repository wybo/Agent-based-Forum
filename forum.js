var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    var id,
        i,
        j;
    this.context = null;
    this.initCanvas(canvasId);

    this.threads_arr = [[
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ],
      [ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ],
      [ 
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
        {indent: 1}
      ]];

    this.actors_arr = [
        {loc: 0},    
        {loc: 8},
        {loc: 10},
        {loc: 11}
      ];

    id = 0;
    this.threads_hash = {};
    for (i = 0; i < this.threads_arr.length; i++) {
      for (j = 0; j < this.threads_arr[i].length; j++) {
        this.threads_arr[i][j].id = id;
        this.threads_hash[id] = {thread: i, post: j};
        id++;
      }
    }
    this.run();
  };

  construct.prototype.run = function() {
    for (i = 0; i < this.actors_arr.length; i++) {
      loc_thread = this.threads_hash[this.actors_arr[i].loc];
      this.threads_arr[loc_thread.thread][loc_thread.post].actor = true;
    }
    this.draw();
  };

  construct.prototype.draw = function() {
    for (i = 0; i < this.threads_arr.length; i++) {
      this.drawThread(this.threads_arr[i], i);
    }
  };

  construct.prototype.drawThread = function(thread_arr, nr) {
    var indent = 0,
        previous_indent = 0,
        indent_stack = [0],
        x_start = nr * 150 + 12,
        x = 0,
        y = 0;
    if (nr > 0) {
      this.context.beginPath();
      this.context.strokeStyle = "#999";
      this.context.moveTo(x_start - 143, 20);
      this.context.lineTo(x_start - 2, 20);
      this.context.stroke();
      this.context.closePath();
    }
    this.drawPost(x_start, 20);
    if (thread_arr[0].actor) {
      this.drawActor(x_start, 20);
    }
    for (var i = 1; i < thread_arr.length; i++) {
      indent = thread_arr[i].indent;
      previous_indent = thread_arr[i - 1].indent;
      x = x_start + (indent - 1) * 12;
      y = i * 20;
      this.drawPost(x + 12, y + 20);
      if (thread_arr[i].actor) {
        this.drawActor(x + 12, y + 20);
      }
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

  construct.prototype.drawActor = function(x, y) {
    // head
    this.context.strokeStyle = "#F00";
    this.context.beginPath();
    this.context.arc(x, y, 4, 0, Math.PI * 2, false);
    this.context.closePath();
    this.context.stroke();
    // body
    this.context.beginPath();
    this.context.moveTo(x + 1, y + 6);
    this.context.lineTo(x + 4, y + 5);
    this.context.moveTo(x - 1, y + 6);
    this.context.lineTo(x - 4, y + 9);
    this.context.moveTo(x, y + 4);
    this.context.lineTo(x, y + 9);
    this.context.lineTo(x + 3, y + 14);
    this.context.moveTo(x, y + 9);
    this.context.lineTo(x - 3, y + 14);
    this.context.stroke();
    this.context.closePath();
  };

  construct.prototype.initCanvas = function(canvasId) {
    var my_canvas = $(canvasId).get(0);
    this.context = my_canvas.getContext("2d");
  };

  construct.prototype.toggleRun = function() {
  };

  return construct;
}());
