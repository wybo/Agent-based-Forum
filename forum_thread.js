// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

ForumThread = (function() {
  var construct;

  construct = function(post_hashes, insert_position, forum, options) {
    var post_hash;
    this.forum = forum;
    this.forum.threads_count++;
    this.posts = [];
    for (var i = 0; i < post_hashes.length; i++) {
      post_hash = post_hashes[i];
      post_hash.index = i;
      post_hash.thread_index = insert_position;
      this.posts.push(new Post(post_hash, this));
    }
    if (options) {
      this.squeeze = options.squeeze;
    } else {
      this.squeeze = false;
    }
    return this;
  };

  construct.prototype.next = function() {
    var position_hash = this.forum.positions_hash[this.posts[0].id];
    if (this.forum.options.mode == ABF.MODES.random) {
      roll = Math.floor(Math.random() * (this.forum.threads.length));
      return this.forum.threads[roll];
    } else if (this.forum.options.direction == ABF.DIRECTIONS.oldnew) {
      if (position_hash.thread + 1 < this.forum.threads.length) {
        return this.forum.threads[position_hash.thread + 1];
      } else {
        return false;
      }
    } else {
      if (position_hash.thread > 0) {
        return this.forum.threads[position_hash.thread - 1];
      } else {
        return false;
      }
    }
  };

  construct.prototype.new_thread = function(author, topic) {
    return this.forum.append_thread([{indent: 0, inserted: true, author: author, topic: topic}]);
  };

  construct.prototype.delete_posts = function() {
    for (var i = 0; i < this.posts.length; i++) {
      delete this.forum.positions_hash[this.posts[i].id];
    }
  };

  construct.prototype.reorder_posts = function(start, end, new_posts) {
    var new_posts = [],
        indent_pointer = 1,
        done_counter = 1,
        below_counter,
        new_pointer = start,
        sort_list,
        i;
    while (done_counter < this.posts.size) {
      sort_list = [];
      below_counter = 0;
      for (i = this.posts.size - 1; i > 0; i--) {
        if (this.posts[i].indent == indent_pointer) {
          sort_list.push([this.posts[i], below_counter]);
          below_counter = 0;
          done_counter += 1;
        } else {
          below_counter++;
        }
      }
      sort_list.sort(ABF.sort_by_rating);
      for (i = 0; i < sort_list.size; i++) {
        this.reorder_posts(new_pointer, new_pointer + sort_list[i][1], new_posts);
        new_pointer += sort_list[i][0];
      }
    }
  };

  construct.prototype.draw = function(nr) {
    var indent = 0,
        previous_indent = 0,
        indent_stack = [0],
        spacing = ABF.SCL * this.forum.spacing,
        height_step = ABF.SCL * 20,
        width_step = ABF.SCL * 12,
        x_start,
        x = 0,
        y = 0,
        context = this.forum.context,
        i;
    if (this.forum.options.mode == ABF.MODES.random) {
      x = 10 + nr % 70 * width_step * 2;
      y = height_step + Math.floor(nr / 70) * height_step;
      this.posts[0].draw(x, y);
      if (this.posts[0].actor) {
        this.posts[0].actor.draw(x, y);
        this.posts[0].actor = null;
      }
    } else {
      x_start = nr * (spacing + ABF.SCL * 10) + width_step;
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
        this.posts[0].actor = null;
      }

      squeeze_branch_i = -1;
      for (i = 1; i < this.posts.length; i++) {
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
        this.posts[i].draw(x + width_step, y + height_step);
        if (this.posts[i].actor) {
          this.posts[i].actor.draw(x + width_step, y + height_step);
          this.posts[i].actor = null;
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
        indent_stack[indent] = y + height_step;
      }
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
