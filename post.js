// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Post = (function() {
  var construct;
  
  construct = function(options, thread) {
    this.indent = options.indent;
    /// Post topic attributes
    if (ABF.TOPICS) {
      this.topic_actions = [];
      for (var i = 0; i < ABF.TOPICS; i++) {
        this.topic_actions.push({
            chance: Math.pow(2, i),                                           
            action: ABF.arg_returning_function(ABF.TOPICS - i - 1) });
      }
      this.topic_actions = ABF.prepare_actions(this.topic_actions);

      if (options.interest) {
        this.topic = ABF.random_action(this.topic_actions, {swap: options.interest});
      } else {
        this.topic = ABF.random_action(this.topic_actions);
      }
    }
    ///
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
        insert_position = false,
        i;
    position_hash = this.thread.forum.positions_hash[this.id];
    post = this.thread.posts[position_hash.post];
    // Find insert position
    for (i = position_hash.post + 1; i < this.thread.posts.length; i++) {
      if (insert_position === false) {
        if (this.thread.posts[i].indent <= post.indent) {
          insert_position = i;
        }
      }
    }
    if (insert_position === false) {
      insert_position = this.thread.posts.length;
    }
    // Insert reply at the given position
    this.thread.posts.splice(insert_position, 0,
        new Post({indent: post.indent + 1, index: insert_position, 
            interest: post.topic,
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
