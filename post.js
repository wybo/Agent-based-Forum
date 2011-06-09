// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Post = (function() {
  var construct;
  
  construct = function(options, thread) {
    this.indent = options.indent;
    if (ABF.TOPICS) {
      if (options.topic) {
        this.topic = options.topic;
      } else {
        this.topic = ABF.random_action(ABF.TOPIC_ACTIONS);
      }
    }
    if (options.color) {
      this.color = options.color;
    } else if (this.topic !== undefined) {
      this.color = ABF.TOPIC_COLORS[this.topic];
    } else {
      this.color = "#000";
    }
    this.thread = thread;
    this.id = this.thread.forum.post_id_counter++;
    this.thread.forum.positions_hash[this.id] = 
        {thread: options.thread_index, post: options.index};
    this.thread.forum.posts_count++;
    return this;
  };

  construct.prototype.next = function() {
    if (this.thread.forum.mode == ABF.MODES.random) {
      var roll = Math.floor(Math.random() * (this.thread.posts.length));
      return this.thread.posts[roll];
    } else {
      var position_hash = this.thread.forum.positions_hash[this.id];
      if (position_hash.post + 1 < this.thread.posts.length) {
        return this.thread.posts[position_hash.post + 1];
      } else {
        return false;
      }
    }
  };

  construct.prototype.reply = function(topic) {
    var position_hash,
        insert_position = false,
        insert_indent,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    post = this.thread.posts[position_hash.post];
    // Find insert position
    if (this.thread.forum.mode != ABF.MODES.random) {
      for (i = position_hash.post + 1; i < this.thread.posts.length; i++) {
        if (insert_position === false) {
          if (this.thread.posts[i].indent <= post.indent) {
            insert_position = i;
          }
        }
      }
    }
    if (insert_position === false) { // Random or found none
      insert_position = this.thread.posts.length;
    }
    // Insert reply at the given position
    if (this.thread.forum.mode == ABF.MODES.threaded) {
      insert_indent = 1;
    } else if (this.thread.forum.mode == ABF.MODES.subthreaded) {
      insert_indent = post.indent + 1;
    } else {
      insert_indent = null;
    }
    this.thread.posts.splice(insert_position, 0,
        new Post({indent: insert_indent, index: insert_position, 
            topic: topic,
            thread_index: position_hash.thread}, 
            post.thread));
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
    this.inserted = false;
  };

  return construct;
}());
