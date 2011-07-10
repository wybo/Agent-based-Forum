// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

Actor = (function() {
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
    if (this.forum.options.mode != ABF.MODES.random) {
      this.actions.push({
          chance: this.forum.options.reply_chance,
          action: this.to_reply
        }, {
          chance: this.forum.options.next_thread_chance,
          action: this.to_next_thread
        }, {
          chance: this.forum.options.new_thread_chance,
          action: this.to_new_thread
        }, {
          total: 1000,
          action: this.to_next_post
        });
    } else {
      this.actions.push({
          chance: this.forum.options.reply_chance + this.forum.options.new_thread_chance,
          action: this.to_new_thread
        }, {
          total: 1000,
          action: this.to_next_thread
        });
    }
    this.actions = ABF.prepare_actions(this.actions, {bind: this});
    this.reading = true;
    this.seen_boring_posts = 0;
    return this;
    ///
  };

  /// Agent rate and objective functions
  construct.prototype.run = function() {
    if (this.position === false) { // is offline, rate function
      if (this.current_desire < this.forum.options.c_d_leave_cutoff) {
        this.leave_forum();
      } else {
        var roll = Math.floor(Math.random()*1001);
        if (this.current_desire > roll) { // if desire greater than roll
          this.go_online();
          this.read_current_post();
        }
      }
    } else { // is visiting forum, objective function
      // this.own_post_bonus() could be added;
      if (this.current_desire < this.forum.options.c_d_offline_cutoff) { // no desire left, leave
        this.go_offline();
      } else {
        //ABF.random_action(this.actions, {boost: [0, this.current_desire + this.reply_desire]});
        ABF.random_action(this.actions, [[0, (this.reply_desire + this.seen_boring_posts) / actions.total], [1, this.seen_boring_posts / actions.total]]);
        if (this.position !== false) {
          this.read_current_post();
        }
      }
      // reduce reply desire with time
      if (this.reply_desire >= this.forum.options.r_d_drop_off) { // maybe TODO 5
        this.reply_desire -= this.forum.options.r_d_drop_off;
      } else {
        this.reply_desire = 0;
      }
    }
  };
  ///
  
  construct.prototype.read_current_post = function() {
    var post = this.post(),
        parent_post = post.previous(post.indent - 1);
    if (post.seen[this.id]) {
      this.skim_post(post); 
    } else {
      if (this.forum.options.mode != ABF.MODES.random && post.indent === 0) { // a thread or a seen post
        this.skim_post(post);
        this.upvote_post(post);
      } else {
        this.current_desire += this.forum.options.c_d_read; // lose desire / satisfy need to read
        if (post.topic == this.topic) {
          this.next_desire += this.forum.options.n_d_on_topic;
          this.upvote_post(post);
        } else {
          this.next_desire += this.forum.options.n_d_off_topic;
          this.seen_boring_posts++;
        }
        this.reading = true;
      }
      if (parent_post && parent_post.author == this) {
        this.current_desire += this.forum.options.c_d_received_reply;
        this.reply_desire += this.forum.options.r_d_received_reply;
      }
      post.seen[this.id] = true;
    }
  };

  construct.prototype.skim_post = function(post) {
    this.current_desire += this.forum.options.c_d_skim; // lose desire
    this.next_desire += this.forum.options.n_d_skim_compensation; // regain for next
    this.reading = false;
  };

  construct.prototype.upvote_post = function(post) {
    if (this.forum.options.mode == ABF.MODES.ordered) {
      post.rating += 1;
    }
  };

  construct.prototype.to_next_post = function() {
    var old_post = this.post(),
        post;
//    do {
      // Passes by comments to uninteresting posts (for free)
//      if (old_post.topic == this.topic || ABF.fifty_fifty()) {
      if (old_post.topic == this.topic || this.forum.options.mode == ABF.MODES.threaded) {
        post = old_post.next();
      } else {
        post = old_post.next(old_post.indent);
      }
      old_post = post;
      // Passes posts that have been seen (for free), 
      // unless commented below
//    } while (post && post.seen[this.id] && !post.posted_in[this.id]);
    if (post) {
      this.position = post.id;
    } else {
      this.to_next_thread();
    }
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().thread,
        pass;
    this.seen_boring_posts = 0;
    do {
      pass = false;
      thread = thread.next();
      if (thread && thread.posts[0].topic != this.topic) {
        if (this.forum.options.mode != ABF.MODES.random) {
          pass = true;
        } else {
          pass = false;
        }
        // Free pass for threads that are uninteresting and have been seen
//        if (thread.posts[0].seen[this.id]) {
//          pass = true;
//        } else {
//          pass = ABF.fifty_fifty();
//        }
      }
    } while (pass);
    if (thread) {
      this.position = thread.posts[0].id;
      this.current_desire += this.forum.options.c_d_page_load; // Cognitive load / loading time
    } else {
      this.go_offline();
    }
  };

  construct.prototype.to_reply = function() {
    var old_post = this.post();
    var post = old_post.reply(this, ABF.random_action(ABF.TOPIC_ACTIONS, [[old_post.thread.posts[0].topic, 0.5]], old_post.topic));
//    var post = old_post.reply(this, ABF.random_action(ABF.TOPIC_ACTIONS, {swap: old_post.topic}));
    this.position = post.id;
    this.current_desire += this.forum.options.c_d_create;
  };

  construct.prototype.to_new_thread = function() {
    var thread = this.post().thread.new_thread(this, ABF.random_action(ABF.TOPIC_ACTIONS, false, this.topic));
    this.position = thread.posts[0].id;
    this.current_desire += this.forum.options.c_d_create;
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  construct.prototype.go_offline = function() {
    this.current_desire = this.next_desire + Math.min(this.current_desire, this.forum.options.c_d_current_carry_over);
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
