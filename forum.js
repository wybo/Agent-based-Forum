var Post = (function() {
  var construct;

  construct = function(options, thread) {
    this.indent = options.indent;
    this.thread = thread;
  };

  construct.prototype.next = function() {
    var position_hash = this.thread.forum.positions_hash[this.id];
    if (this.thread.posts.length > position_hash.post + 1) {
      return this.thread.posts[position_hash.post + 1];
    } else {
      return false;
    }
  };

  construct.prototype.reply = function() {
  };

  construct.prototype.erase_actor = function() {
    this.actor = null;
    return this;
  };

  construct.prototype.draw = function(x, y) {
    this.thread.forum.context.strokeStyle = "#000";
    this.thread.forum.context.beginPath();
    this.thread.forum.context.arc(x, y, 2, 0, Math.PI * 2, false);
    this.thread.forum.context.closePath();
    this.thread.forum.context.stroke();
    this.thread.forum.context.fillStyle = "#000";
    this.thread.forum.context.fill();
  };

  return construct;
}());

var ForumThread = (function() {
  var construct;

  construct = function(posts, forum) {
    this.posts = [];
    for (var i = 0; i < posts.length; i++) {
      this.posts.push(new Post(posts[i], this));
    }
    this.forum = forum;
  };

  construct.prototype.next = function() {
    var position_hash = this.forum.positions_hash[this.posts[0].id];
    if (this.forum.threads.length > position_hash.thread + 1) {
      return this.forum.threads[position_hash.thread + 1];
    } else {
      return false;
    }
  };

  construct.prototype.draw = function(nr) {
    var indent = 0,
        previous_indent = 0,
        indent_stack = [0],
        x_start = nr * 150 + 12,
        x = 0,
        y = 0;
    if (nr > 0) {
      this.forum.context.beginPath();
      this.forum.context.strokeStyle = "#999";
      this.forum.context.moveTo(x_start - 143, 20);
      this.forum.context.lineTo(x_start - 2, 20);
      this.forum.context.stroke();
      this.forum.context.closePath();
    }
    this.posts[0].draw(x_start, 20);
    if (this.posts[0].actor) {
      this.posts[0].actor.draw(x_start, 20);
    }
    for (var i = 1; i < this.posts.length; i++) {
      indent = this.posts[i].indent;
      previous_indent = this.posts[i - 1].indent;
      x = x_start + (indent - 1) * 12;
      y = i * 20;
      this.posts[i].draw(x + 12, y + 20);
      if (this.posts[i].actor) {
        this.posts[i].actor.draw(x + 12, y + 20);
      }
      this.forum.context.beginPath();
      this.forum.context.strokeStyle = "#999";
      if (indent > previous_indent) {
        this.forum.context.moveTo(x + 1, y + 2);
        this.forum.context.lineTo(x + 6, y + 12);
      } else if (indent < previous_indent) {
        this.forum.context.moveTo(x + 6, indent_stack[indent]);
        this.forum.context.lineTo(x + 6, y);
      } else {
        this.forum.context.moveTo(x + 6, y);
      }
      this.forum.context.lineTo(x + 6, y + 20);
      this.forum.context.stroke();
      this.forum.context.closePath();
      indent_stack[indent] = y + 20;
    }
  };

  return construct;
}());

var Actor = (function() {
  var construct;

  construct = function(options, forum) {
    this.position = options.position;
    this.forum = forum;
  };

  construct.prototype.to_next_post = function() {
    var post = this.post().erase_actor().next();
    this.position = post.id;
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().erase_actor().thread.next();
    this.position = thread.posts[0].id;
  };

  construct.prototype.to_reply = function() {
    var post = this.post().erase_actor().reply();
    this.position = post.id;
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  construct.prototype.erase = function(post) {
    post.actor = null;
  };

  construct.prototype.draw = function(x, y) {
    // head
    this.forum.context.strokeStyle = "#F00";
    this.forum.context.beginPath();
    this.forum.context.arc(x, y, 4, 0, Math.PI * 2, false);
    this.forum.context.closePath();
    this.forum.context.stroke();
    // body
    this.forum.context.beginPath();
    this.forum.context.moveTo(x + 1, y + 6);
    this.forum.context.lineTo(x + 4, y + 5);
    this.forum.context.moveTo(x - 1, y + 6);
    this.forum.context.lineTo(x - 4, y + 9);
    this.forum.context.moveTo(x, y + 4);
    this.forum.context.lineTo(x, y + 9);
    this.forum.context.lineTo(x + 3, y + 14);
    this.forum.context.moveTo(x, y + 9);
    this.forum.context.lineTo(x - 3, y + 14);
    this.forum.context.stroke();
    this.forum.context.closePath();
  };

  return construct;
}());

var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    var id,
        i,
        j,
        position_hash;
    this.initCanvas(canvasId);

    this.threads = [
      new ForumThread([
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ], this),
      new ForumThread([ 
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
      ], this)];

    this.actors = [
        new Actor({position: 0}, this),
        new Actor({position: 8}, this),
        new Actor({position: 10}, this),
        new Actor({position: 11}, this)
      ];

    id = 0;
    this.positions_hash = {};
    for (i = 0; i < this.threads.length; i++) {
      for (j = 0; j < this.threads[i].posts.length; j++) {
        this.threads[i].posts[j].id = id;
        this.positions_hash[id] = {thread: i, post: j};
        id++;
      }
    }
    this.run();
  };

  construct.prototype.run = function() {
    this.draw();
    for (i = 0; i < this.actors.length; i++) {
      this.actors[i].to_next_post();
    }
    alert(1);
    this.draw();
    for (i = 0; i < this.actors.length; i++) {
      if (i == 1) {
        this.actors[i].reply();
      }
    }
    alert(1);
    this.draw();
  };

  construct.prototype.draw = function() {
    this.canvas.width = this.canvas.width;
    for (i = 0; i < this.actors.length; i++) {
      position_hash = this.positions_hash[this.actors[i].position];
      this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
    }
    for (i = 0; i < this.threads.length; i++) {
      this.threads[i].draw(i);
    }
  };

  construct.prototype.initCanvas = function(canvasId) {
    this.canvas = $(canvasId).get(0);
    this.context = this.canvas.getContext("2d");
  };

  construct.prototype.toggleRun = function() {
  };

  return construct;
}());
