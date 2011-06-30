// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Actor = (function() {
  var construct;

  construct = function(options, forum) {
    // The global forum
    this.forum = forum;
    this.id = this.forum.actors_id_counter++;
    this.forum.users_count++;
    /// Agent attributes
    // Will be removed if true
    this.left_forum = false;
    // The position, false if offline
    this.position = (options.position ? options.position : false);
    this.next_desire = 0;
    this.current_desire = 2 + Math.floor(Math.random() * (25 + 1));
    this.reply_desire = 0;
    this.topic = ABF.random_action(ABF.TOPIC_ACTIONS);
    this.actions = [];
    this.actions.push({
        chance: 30,
        action: this.to_reply
      }, {
        chance: 2,
        action: this.to_new_thread
      }, {
        total: 1000,
        action: this.to_next_post
      });
    this.actions = ABF.prepare_actions(this.actions, {bind: this});
    this.reading = true;
    return this;
    ///
  };

  /// Agent rate and objective functions
  construct.prototype.run = function() {
    if (this.position === false) { // is offline, rate function
      if (this.current_desire < 2) {
        this.leave_forum();
      } else {
        var roll = Math.floor(Math.random()*1001);
        if (this.current_desire > roll) { // if desire greater than roll
          this.go_online();
          this.read_post();
        }
      }
    } else { // is visiting forum, objective function
      // this.own_post_bonus() could be added;
      if (this.current_desire < 0) { // no desire left, leave
        this.go_offline();
      } else {
        //ABF.random_action(this.actions, {boost: [0, this.current_desire + this.reply_desire]});
        ABF.random_action(this.actions, {boost: [0, this.reply_desire]});
        if (this.position !== false) {
          this.read_post();
        }
      }
      if (this.reply_desire >= 30) {
        this.reply_desire -= 30;
      } else {
        this.reply_desire = 0;
      }
    }
  };
  ///
  
  construct.prototype.read_post = function() {
    var post = this.post();
    if (post.indent === 0 || post.seen[this.id]) { // a thread or a seen post
      this.current_desire = this.current_desire - 0.2; // lose desire / satisfy need to read
      this.next_desire = this.next_desire + 0.1;
      this.reading = false;
    } else {
      this.current_desire--; // lose desire / satisfy need to read
      if (post.topic == this.topic) {
//        this.next_desire = this.next_desire + 1.5;
        this.next_desire = this.next_desire + 2.5;
      } else {
        this.next_desire = this.next_desire + 0.7;
      }
      post.seen[this.id] = true;
      this.reading = true;
    }
    if (this.parent_post().author == this) {
      this.reply_desire += 150;
      this.current_desire += 10;
    }
  };

  construct.prototype.to_next_post = function() {
    var old_post = this.post();
    do {
      // Passes by comments to uninteresting posts (for free)
      if (old_post.topic == this.topic) {
        post = old_post.next();
      } else {
        post = old_post.next(old_post.indent);
      }
      old_post = post;
      // Passes posts that have been seen (for free), 
      // unless commented below
    } while (post && post.seen[this.id] && !post.posted_in[this.id]);
    if (post) {
      this.position = post.id;
    } else {
      this.to_next_thread();
    }
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().thread.next();
    // Free pass for threads that are uninteresting, or have been seen
    while (thread && thread.posts[0].topic != this.topic) {
//    while (thread && ((thread.posts[0].topic != this.topic) ||
//        (thread.posts[0].seen[this.id] && !thread.posted_in[this.id]))) {
      thread = thread.next();
    }
    if (thread) {
      this.position = thread.posts[0].id;
    } else {
      this.go_offline();
    }
  };

  construct.prototype.to_reply = function() {
    var old_post = this.post();
    var post = old_post.reply(this, ABF.random_action(ABF.TOPIC_ACTIONS, {swap: old_post.topic}));
    this.position = post.id;
    this.current_desire -= 5;
  };

  construct.prototype.to_new_thread = function() {
    var thread = this.post().thread.new_thread(this, ABF.random_action(ABF.TOPIC_ACTIONS, {swap: this.topic}));
    this.position = thread.posts[0].id;
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  construct.prototype.parent_post = function() {
    var post = this.post();
    return post.previous(post.indent - 1);
  };

  construct.prototype.go_offline = function() {
    this.current_desire = this.next_desire; // Desire carries over
    this.next_desire = 0;
    this.position = false;
  };

  construct.prototype.leave_forum = function() {
    this.left_forum = true;
    this.forum.users_count--;
  };

  construct.prototype.go_online = function() {
    if (this.forum.direction == ABF.DIRECTIONS.oldnew) {
      this.position = this.forum.threads[0].posts[0].id;
    } else {
      this.position = this.forum.threads[this.forum.threads.length - 1].posts[0].id;
    }
  };

  construct.prototype.draw = function(x, y) {
    var context = this.forum.context;
    context.strokeStyle = "#F00";
    context.lineWidth = ABF.SCL;
    if (this.reading) {
    // head
    context.beginPath();
//      context.rect(x - ABF.SCL * 4, y - ABF.SCL * 4, ABF.SCL * 8, ABF.SCL * 8, false);
      context.arc(x, y, ABF.SCL * 4, 0, Math.PI * 2, false);
    context.stroke();
    context.closePath();
    }
    // body
    context.beginPath();
    context.moveTo(x + ABF.SCL * 1, y + ABF.SCL * 6);
    context.lineTo(x + ABF.SCL * 4, y + ABF.SCL * 5);
    context.moveTo(x - ABF.SCL * 1, y + ABF.SCL * 6);
    context.lineTo(x - ABF.SCL * 4, y + ABF.SCL * 9);
    context.moveTo(x, y + ABF.SCL * 4);
    context.lineTo(x, y + ABF.SCL * 9);
    context.lineTo(x + ABF.SCL * 3, y + ABF.SCL * 14);
    context.moveTo(x, y + ABF.SCL * 9);
    context.lineTo(x - ABF.SCL * 3, y + ABF.SCL * 14);
    context.stroke();
    context.closePath();
  };

  return construct;
}());
