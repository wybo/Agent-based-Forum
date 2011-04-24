// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html
//
// See Actors construct.prototype.run (halfway down) for the core logic

var ABF = {};
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.INITIAL_DIRECTION = ABF.DIRECTIONS.newold; // New threads shown first

// Chances out of a thousand
ABF.NEW_THREAD_CHANCE = 2;
ABF.NEW_POST_CHANGE = 20; // Interest is added
ABF.INITIAL_INTEREST = 20; // Starts out at random from zero to given value

var Post = (function() {
  var construct;

  construct = function(options, thread) {
    this.indent = options.indent;
    this.inserted = options.inserted;
    this.color = options.color;
    this.thread = thread;
    this.id = this.thread.forum.post_id_counter++;
    this.thread.forum.positions_hash[this.id] = 
        {thread: options.thread_index, post: options.index};
  };

  construct.prototype.next = function() {
    var position_hash = this.thread.forum.positions_hash[this.id];
    if (position_hash.post + 1 < this.thread.posts.length) {
      return this.thread.posts[position_hash.post + 1];
    } else {
      return false;
    }
  };

  construct.prototype.reply = function() {
    var position_hash,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    post = this.thread.posts[position_hash.post];
    this.thread.posts.splice(position_hash.post + 1, 0,
        new Post({indent: post.indent + 1, inserted: true, 
            index: position_hash.post + 1, thread_index: position_hash.thread}, 
            post.thread));
    // Raise post_index for posts below
    for (i = position_hash.post + 2; i < this.thread.posts.length; i++) {
      this.thread.forum.positions_hash[this.thread.posts[i].id].post++;
    }
    return this.thread.posts[position_hash.post + 1];
  };

  construct.prototype.erase_actor = function() {
    this.actor = null;
    return this;
  };

  construct.prototype.draw = function(x, y) {
    var color;
    if (this.inserted) {
      color = "#080";
    } else if (this.color) {
      color = this.color;
    } else {
      color = "#000";
    }

    var context = this.thread.forum.context;
    context.strokeStyle = color;
    context.beginPath();
    context.arc(x, y, 2, 0, Math.PI * 2, false);
    context.closePath();
    context.stroke();
    context.fillStyle = color;
    context.fill();
    this.inserted = false;
  };

  return construct;
}());

var ForumThread = (function() {
  var construct;

  construct = function(post_hashes, forum, options) {
    var post_hash,
        thread_index;
    this.forum = forum;
    this.posts = [];
    thread_index = this.forum.thread_index_counter++;
    for (var i = 0; i < post_hashes.length; i++) {
      post_hash = post_hashes[i];
      post_hash.index = i;
      post_hash.thread_index = thread_index;
      this.posts.push(new Post(post_hash, this));
    }
    if (options) {
      this.squeeze = options.squeeze;
    } else {
      this.squeeze = false;
    }
  };

  construct.prototype.next = function() {
    var position_hash = this.forum.positions_hash[this.posts[0].id];
    if (this.forum.direction == ABF.DIRECTIONS.oldnew) {
      if (position_hash.thread + 1 < this.forum.threads.length) {
        return this.forum.threads[position_hash.thread + 1];
      } else {
        return false;
      }
    } else {
      if (position_hash.thread > 1) {
        return this.forum.threads[position_hash.thread - 1];
      } else {
        return false;
      }
    }
  };

  construct.prototype.new_thread = function() {
    this.forum.threads.push(
        new ForumThread([{indent: 0, inserted: true}], this.forum));
    return this.forum.threads[this.forum.threads.length - 1];
  };

  construct.prototype.draw = function(nr) {
    var indent = 0,
        previous_indent = 0,
        indent_stack = [0],
        spacing = 150,
        x_start = nr * (spacing + 10) + 12,
        x = 0,
        y = 0,
        context = this.forum.context;
    if (nr > 0) {
      context.beginPath();
      context.strokeStyle = this.path_color(this.posts[0]);
      context.moveTo(x_start - (spacing + 3), 20);
      context.lineTo(x_start - 2, 20);
      context.stroke();
      context.closePath();
    }

    this.posts[0].draw(x_start, 20);
    if (this.posts[0].actor) {
      this.posts[0].actor.draw(x_start, 20);
    }

    squeeze_branch_i = -1;
    for (var i = 1; i < this.posts.length; i++) {
      indent = this.posts[i].indent;
      previous_indent = this.posts[i - 1].indent;
      x = x_start + (indent - 1) * 12;
      if (this.squeeze) {
        if (this.posts[i].indent == 1) {
          squeeze_branch_i++;
        }
        y = (squeeze_branch_i + this.posts[i].indent) * 20;
      } else {
        y = i * 20;
      }
      if (this.posts[i].actor) {
        this.posts[i].actor.draw(x + 12, y + 20);
      }
      context.beginPath();
      context.strokeStyle = this.path_color(this.posts[i]);
      if (indent > previous_indent) {
        context.moveTo(x + 1, y + 2);
        context.lineTo(x + 6, y + 12);
      } else if (indent < previous_indent) {
        context.moveTo(x + 6, indent_stack[indent]);
        context.lineTo(x + 6, y);
      } else {
        context.moveTo(x + 6, y);
      }
      context.lineTo(x + 6, y + 20);
      context.stroke();
      context.closePath();
      this.posts[i].draw(x + 12, y + 20);
      indent_stack[indent] = y + 20;
    }
  };

  construct.prototype.path_color = function(post) {
    if (post.inserted) {
      return "#0B0";
    } else {
      return "#999";
    }
  };

  return construct;
}());

var Actor = (function() {
  var construct;

  construct = function(options, forum) {
    // The global forum
    this.forum = forum;
    // The position, offline if false
    this.position = (options.position ? options.position : false);
    this.new_thread_chance = ABF.NEW_THREAD_CHANCE;
    this.new_post_chance = ABF.NEW_POST_CHANGE;
    // else to next post
    // Variable attributes
    this.interest = Math.floor(Math.random() * (ABF.INITIAL_INTEREST + 1));
  };

  construct.prototype.run = function() {
    var roll = Math.floor(Math.random()*1001);
    if (this.position === false) { // is offline
      if (this.interest > roll) { // if interest greater than roll
        this.go_online();
      } else {
        this.interest = this.interest + 1; // regenerate interest
      }
    } else { // is visiting forum
      // this.own_post_bonus() could be added;
      if (this.interest < 0) { // no interest left, leave
        this.go_offline();
      } else {
        if (roll <= this.new_thread_chance) {
          this.to_new_thread();
        } else if ((roll = roll - this.new_thread_chance) <= this.new_post_chance + this.interest) {
          // post_chance + interest larger than roll, reply
          this.to_reply();
        } else {
          this.to_next_post();
          this.interest--; // lose interest / satisfy need to read
        }
      }
    }
  };

  construct.prototype.to_next_post = function() {
    var post = this.post().erase_actor().next();
    if (post) {
      this.position = post.id;
    } else {
      this.to_next_thread();
    }
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().erase_actor().thread.next();
    if (thread) {
      this.position = thread.posts[0].id;
    } else {
      this.go_offline();
    }
  };

  construct.prototype.to_reply = function() {
    var post = this.post().erase_actor().reply();
    this.position = post.id;
  };

  construct.prototype.to_new_thread = function() {
    var thread = this.post().erase_actor().thread.new_thread();
    this.position = thread.posts[0].id;
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  construct.prototype.go_offline = function() {
    this.post().erase_actor();
    this.position = false;
  };

  construct.prototype.go_online = function() {
    if (this.forum.direction == ABF.DIRECTIONS.oldnew) {
      this.position = this.forum.threads[0].posts[0].id;
    } else {
      this.position = this.forum.threads[this.forum.threads.length - 1].posts[0].id;
    }
  };

  construct.prototype.erase = function(post) {
    post.actor = null;
  };

  construct.prototype.draw = function(x, y) {
    var context = this.forum.context;
    // head
    context.strokeStyle = "#F00";
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2, false);
    context.closePath();
    context.stroke();
    // body
    context.beginPath();
    context.moveTo(x + 1, y + 6);
    context.lineTo(x + 4, y + 5);
    context.moveTo(x - 1, y + 6);
    context.lineTo(x - 4, y + 9);
    context.moveTo(x, y + 4);
    context.lineTo(x, y + 9);
    context.lineTo(x + 3, y + 14);
    context.moveTo(x, y + 9);
    context.lineTo(x - 3, y + 14);
    context.stroke();
    context.closePath();
  };

  return construct;
}());

var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    this.initCanvas(canvasId);
    this.reset();
  };

  construct.prototype.reset = function() {
    this.direction = ABF.INITIAL_DIRECTION;
    this.restart();
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        position_hash;

    this.post_id_counter = 0;
    this.thread_index_counter = 0;
    this.positions_hash = {};
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
      ], this),
      new ForumThread(
        thread_tsort_false_collect_rating.items, this, {squeeze: true}),
      new ForumThread(
        thread_tsort_false_collect_time.items, this, {squeeze: true})];
    
    this.actors = [
        new Actor({position: 1}, this),
        new Actor({position: 8}, this),
        new Actor({position: 10}, this),
        new Actor({position: 11}, this)
      ];
    for (i = 0; i < 21; i++) {
      this.actors.push(new Actor({}, this));
    }
    this.draw();
  };

  construct.prototype.run = function() {
    for (i = 0; i < this.actors.length; i++) {
      this.actors[i].run();
    }
    this.draw();
  };

  construct.prototype.draw = function() {
    this.canvas.width = this.canvas.width;
    for (i = 0; i < this.actors.length; i++) {
      if (this.actors[i].position) {
        position_hash = this.positions_hash[this.actors[i].position];
        this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
      }
    }
    if (this.direction == ABF.DIRECTIONS.oldnew) {
      for (i = 0; i < this.threads.length; i++) {
        this.threads[i].draw(i);
      }
    } else {
      for (i = this.threads.length - 1; i >= 0; i--) {
        this.threads[i].draw(this.threads.length - 1 - i);
      }
    }
  };

  construct.prototype.initCanvas = function(canvasId) {
    this.canvas = $(canvasId).get(0);
    this.context = this.canvas.getContext("2d");
  };

  construct.prototype.toggleOrder = function() {
    if (this.direction == ABF.DIRECTIONS.oldnew) {
      this.direction = ABF.DIRECTIONS.newold;
    } else {
      this.direction = ABF.DIRECTIONS.oldnew;
    }
    this.restart();
  };

  construct.prototype.toggleRun = function() {
    if (!this.running) {
      this.running = true;
      this.timeout = setInterval("forum.run()", 100);
    } else {
      this.running = false;
      clearInterval(this.timeout);
    }
  };

  return construct;
}());
