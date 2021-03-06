// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

Post = (function() {
  var construct;
  
  construct = function(options, thread) {
    this.thread = thread;
    this.id = this.thread.forum.posts_id_counter++;
    this.indent = options.indent;
    if (options.topic !== undefined) {
      this.topic = options.topic;
    } else {
      this.topic = ABF.choose_random_action(ABF.TOPIC_CHOICE);
    }
    if (options.color) {
      this.color = options.color;
    } else if (this.topic !== undefined) {
      this.color = ABF.TOPIC_COLORS[this.topic];
    } else {
      this.color = "#000";
    }
    this.seen = {};
    if (options.author) {
      this.author_id = options.author.id;
      this.seen[this.author_id] = true;
      if (!this.thread.forum.daily_unique_posters_hash[this.author_id]) {
        this.thread.forum.daily_unique_posters_hash[this.author_id] = true;
        this.thread.forum.daily_unique_posters_count++;
      }
    }
    this.thread.forum.positions_hash[this.id] = 
        {thread: options.thread_index, post: options.index};
    if (this.thread.forum.options.mode == ABF.MODES.ordered) {
      if (this.indent === 0) {
        this.rating = 3; // Bonus to get new threads going
      } else {
        this.rating = 0;
      }
      this.time = this.thread.forum.run_count;
    }
    return this;
  };

  construct.prototype.next = function(indent) {
    var roll,
        positions_hash,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    if (indent === undefined) {
      indent = this.indent + 1;
    }
    for (i = position_hash.post + 1; i < this.thread.posts.length; i++) {
      if (this.thread.posts[i].indent <= indent) {
        return this.thread.posts[i];
      }
    }
    return false;
  };

  construct.prototype.previous = function(indent) {
    var positions_hash,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    if (indent === undefined) {
      indent = this.indent;
    }
    for (i = position_hash.post - 1; i > 0; i--) {
      if (this.thread.posts[i].indent <= indent) {
        return this.thread.posts[i];
      }
    }
    return false;
  };

  construct.prototype.reply = function(author, topic) {
    var position_hash,
        insert_position = false,
        insert_indent,
        indent_pointer,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    // Find insert position
    if (this.thread.forum.options.mode != ABF.MODES.threaded) {
      for (i = position_hash.post + 1; i < this.thread.posts.length; i++) {
        if (insert_position === false) {
          if (this.thread.posts[i].indent <= this.indent) {
            insert_position = i;
          }
        }
      }
    }
    if (insert_position === false) { // Threaded (flat) or found none
      insert_position = this.thread.posts.length;
    }
    // Insert reply at the given position
    if (this.thread.forum.options.mode == ABF.MODES.threaded) {
      insert_indent = this.thread.posts.length;
    } else if (this.thread.forum.options.mode == ABF.MODES.subthreaded || this.thread.forum.options.mode == ABF.MODES.ordered) {
      insert_indent = this.indent + 1;
    } else {
      insert_indent = null;
    }
    this.thread.posts.splice(insert_position, 0,
        new Post({indent: insert_indent, index: insert_position, 
            author: author,
            topic: topic,
            thread_index: position_hash.thread}, 
            this.thread));
    // Raise post_index for posts below
    for (i = insert_position + 1; i < this.thread.posts.length; i++) {
      this.thread.forum.positions_hash[this.thread.posts[i].id].post++;
    }
    return this.thread.posts[insert_position];
  };

  construct.prototype.draw = function(x, y) {
    var context = this.thread.forum.context;
    context.strokeStyle = this.color;
    context.lineWidth = ABF.SCL;
    context.beginPath();
    context.arc(x, y, ABF.SCL * 2, 0, Math.PI * 2, false);
    context.closePath();
    context.stroke();
    context.fillStyle = this.color;
    context.fill();
    if (ABF.DEBUG) {
      if (this.thread.forum.options.mode == ABF.MODES.ordered) {
        context.font = (0.6 * ABF.SCL) + "em sans-serif";
        context.fillText(this.rating, x + 2 * ABF.SCL, y - 2 * ABF.SCL);
      }
    }
    this.inserted = false;
  };

  return construct;
}());
