// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html
//
// See Actors construct.prototype.run (halfway down) for the core logic

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
        spacing = ABF.SCL * 80,
        height_step = ABF.SCL * 20,
        width_step = ABF.SCL * 12,
        x_start = nr * (spacing + ABF.SCL * 10) + width_step,
        x = 0,
        y = 0,
        context = this.forum.context;
    if ((nr > 0) && (!ABF.NO_BARS)) {
      context.beginPath();
      context.strokeStyle = this.path_color(this.posts[0]);
      context.lineWidth = ABF.SCL;
      context.moveTo(x_start - (spacing + ABF.SCL * 3), height_step);
      context.lineTo(x_start - ABF.SCL * 2, height_step);
      context.stroke();
      context.closePath();
    }

    this.posts[0].draw(x_start, height_step);
    if (this.posts[0].actor) {
      this.posts[0].actor.draw(x_start, height_step);
    }

    squeeze_branch_i = -1;
    for (var i = 1; i < this.posts.length; i++) {
      indent = this.posts[i].indent;
      previous_indent = this.posts[i - 1].indent;
      x = x_start + (indent - 1) * width_step;
      if (this.squeeze) {
        if (this.posts[i].indent == 1) {
          squeeze_branch_i++;
        }
        y = (squeeze_branch_i + this.posts[i].indent) * height_step;
      } else {
        y = i * height_step;
      }
      if (this.posts[i].actor) {
        this.posts[i].actor.draw(x + width_step, y + height_step);
      }
      context.beginPath();
      context.strokeStyle = this.path_color(this.posts[i]);
      context.lineWidth = ABF.SCL;
      if (indent > previous_indent) {
        context.moveTo(x + ABF.SCL * 1, y + ABF.SCL * 2);
        context.lineTo(x + ABF.SCL * 6, y + ABF.SCL * 12);
      } else if (indent < previous_indent) {
        context.moveTo(x + ABF.SCL * 6, indent_stack[indent]);
        context.lineTo(x + ABF.SCL * 6, y);
      } else {
        context.moveTo(x + ABF.SCL * 6, y);
      }
      context.lineTo(x + ABF.SCL * 6, y + height_step);
      context.stroke();
      context.closePath();
      this.posts[i].draw(x + width_step, y + height_step);
      indent_stack[indent] = y + height_step;
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
