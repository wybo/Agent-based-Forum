// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html
//
// See Actors construct.prototype.run (halfway down) for the core logic

var Post = (function() {
  var construct,
      TOPIC_ACTIONS = [];
  
  if (ABF.TOPICS) {
    for (var i = 0; i < ABF.TOPICS; i++) {
      TOPIC_ACTIONS.push({
          chance: Math.pow(2, i),                                           
          action: ABF.arg_returning_function(ABF.TOPICS - i - 1) });
    }
    TOPIC_ACTIONS = ABF.prepare_actions(TOPIC_ACTIONS);
  }

  construct = function(options, thread) {
    this.indent = options.indent;
    if (ABF.TOPICS) {
      if (options.interest) {
        this.topic = ABF.random_action(TOPIC_ACTIONS, {swap: options.interest});
      } else {
        this.topic = ABF.random_action(TOPIC_ACTIONS);
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
        new Post({indent: post.indent + 1, index: position_hash.post + 1, 
            interest: post.topic,
            thread_index: position_hash.thread}, 
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
