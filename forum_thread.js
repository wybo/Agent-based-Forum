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

  construct.prototype.reweight_thread_and_posts = function(current_time) {
    var i,
        post;
    for (i = 0; i < this.posts.length; i++) {
      post = this.posts[i];
      post.weight = ABF.hn_weight(post.rating, current_time - post.time);
    }
  };

  construct.prototype.reorder_posts = function(start, end, new_posts) {
    var nested_arrays,
        sorted_posts,
        i;
    nested_arrays = this.add_to_nested_sorted_arrays(0, 0, this.posts);
    sorted_posts = this.peel_from_nested_arrays(nested_arrays);
    this.posts = sorted_posts;
    for (i = 0; i < this.posts.length; i++) {
      this.forum.positions_hash[this.posts[i].id].post = i;
    }
  };

  construct.prototype.add_to_nested_sorted_arrays = function(previous_indent, index, posts) {
    var nested_arrays = [],
        i = index,
        post;
    while (i < posts.length) {
      post = posts[i];
      next_post = posts[i + 1];
      if (next_post && next_post.indent > previous_indent) {
        nested_arrays.push(this.pack_nested_array([[post.rating, 1, post], this.add_to_nested_sorted_arrays(next_post.indent, i + 1, posts)]));
      } else if (post.indent === previous_indent) {
        nested_arrays.push([post.weight, 1, post]);
      } else {
        nested_arrays.sort(ABF.sort_by_first_element);
        return this.pack_nested_array(nested_arrays);
      }
      i += nested_arrays[nested_arrays.length - 1][1];
    }
    nested_arrays.sort(ABF.sort_by_first_element);
    return this.pack_nested_array(nested_arrays);
  };

  construct.prototype.pack_nested_array = function(nested_arrays) {
    var i_counter = 0,
        j;
    if (nested_arrays.length > 0) {
      for (j = 0; j < nested_arrays.length; j++) {
        i_counter += nested_arrays[j][1];
      }
      nested_arrays = [nested_arrays[0][0], i_counter].concat(nested_arrays);
    }
    return nested_arrays;
  };

  construct.prototype.peel_from_nested_arrays = function(sorted_arrays) {
    var sorted_list = [],
        i;
    for (i = 0; i < sorted_arrays.length; i++) {
      if (sorted_arrays[i] instanceof Array) {
        sorted_list = sorted_list.concat(this.peel_from_nested_arrays(sorted_arrays[i]));
      } else if (sorted_arrays[i] instanceof Object) {
        sorted_list.push(sorted_arrays[i]);
      } // drop if int = rating / other sorter
    }
    return sorted_list;
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
      x = 10 * ABF.SCL + nr % 2 * width_step * 2 * 2;
      y = height_step + Math.floor(nr / 2) * height_step * 2;
      this.posts[0].draw(x, y);
      if (this.posts[0].actor) {
//        this.posts[0].actor.draw(x, y);
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
//        this.posts[0].actor.draw(x_start, height_step);
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
//          this.posts[i].actor.draw(x + width_step, y + height_step);
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
