// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

Actor = (function() {
  var construct;

  construct = function(options, forum) {
    // The global forum
    this.forum = forum;
    this.id = this.forum.actors_id_counter++;
    /// Agent attributes
    if (this.forum.options.with_thresholds) {
      this.threshold = this.forum.options.threshold_average +
          normal_rand()[0] * this.forum.options.threshold_standard_deviation;
    }
    // Will be removed if true
    this.left_forum = false;
    // The position, false if offline
    this.position = (options.position ? options.position : false);
    this.next_desire = 0;
    this.current_desire = this.forum.options.c_d_leave_cutoff + 
        Math.floor(Math.random() * (this.forum.options.c_d_max_starting));
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
    this.seen_thread_in_session = {};
    this.seen_reply_from_in_session = {};
    this.seen_uninteresting_in_thread = 0;
    this.forum.users_count++;
    if (!this.forum.users_per_topic_count[this.topic]) {
      this.forum.users_per_topic_count[this.topic] = 0;
    }
    this.forum.users_per_topic_count[this.topic]++;
    return this;
    ///
  };

  //### Runs

  /// Agent rate and objective functions
  construct.prototype.run = function() {
    var reply_boost;
    if (this.position === false) { // is offline, rate function
      if (this.current_desire < this.forum.options.c_d_leave_cutoff) {
        this.leave_forum();
      } else {
        var roll = Math.floor(Math.random()*1001);
        if (this.current_desire / this.forum.options.desire_for_online_divider > roll) { // if desire greater than roll
          this.go_online();
          this.read_post(this.post());
        }
      }
    } else { // is visiting forum, objective function
      // this.own_post_bonus() could be added;
      if (this.current_desire < 0) { // no desire left, leave
        this.go_offline();
      } else {
        post = this.post();
        if (this.seen_reply_from_in_session[post.author_id]) {
          reply_boost = this.current_desire * 3.0;
        } else {
          reply_boost = this.current_desire * 1.0;
        }
        if (this.current_desire > 100) {
          alert(reply_boost + ' ' + this.seen_uninteresting_in_thread);
        }
        //ABF.random_action(this.actions, {boost: [0, this.current_desire + this.reply_desire]});
        ABF.random_action(this.actions, // both reply_ and seen_uninteresting here for boost implementation reasons
            [[0, (reply_boost + this.seen_uninteresting_in_thread) / this.actions.total],
             [2, (reply_boost / 20) / this.actions.total]]);
        if (this.position !== false) {
          this.read_post(post);
        }
      }
      // reduce reply desire with time
      if (this.reply_desire >= this.forum.options.r_d_drop_off) {
        this.reply_desire += this.forum.options.r_d_drop_off;
      } else {
        this.reply_desire = 0;
      }
    }
  };
  ///
  
  construct.prototype.read_post = function(post) {
    var parent_post = post.previous(post.indent - 1);
    if (post.seen[this.id] || post.author_id == this.id) {
      this.skim_post(post); 
    } else {
      if (post.indent === 0 && this.forum.options.mode != ABF.MODES.random) { // a thread
        this.skim_post(post);
      } else {
        this.current_desire += this.forum.options.c_d_read; // lose desire / satisfy need to read
        if (post.topic == this.topic) {
          this.next_desire += this.forum.options.n_d_on_topic;
        } else {
          this.next_desire += this.forum.options.n_d_off_topic;
        }
        this.reading = true;
      }
      if (post.topic == this.topic) {
        this.upvote_post(post);
      } else {
        this.seen_uninteresting_in_thread++;
      }
      if (parent_post && parent_post.author_id == this.id) {
        this.current_desire += this.forum.options.n_d_received_reply;
        this.reply_desire += this.forum.options.r_d_received_reply;
      }
      post.seen[this.id] = true;
    }
    if (parent_post && parent_post.author_id == this.id) {
      this.seen_reply_from_in_session[post.author_id] = true;
    }
    if (post.indent === 0 && !this.seen_thread_in_session[post.id] &&
        this.forum.options.mode != ABF.MODES.random) { // a thread
      this.seen_thread_in_session[post.id] = true;
      this.seen_new_thread_since_top = true;
    }
  };

  construct.prototype.skim_post = function(post) {
    this.reading = false;
  };

  construct.prototype.upvote_post = function(post) {
    if (this.forum.options.mode == ABF.MODES.ordered) {
      post.rating += 1;
    }
  };

  //### Actions

  construct.prototype.to_next_post = function() {
    var old_post = this.post(),
        post;
    // Passes by comments to uninteresting posts (for free)
    if (old_post.topic == this.topic || this.forum.options.mode == ABF.MODES.threaded || ABF.fifty_fifty()) {
      post = old_post.next();
    } else {
      post = old_post.next(old_post.indent);
    }
    old_post = post;
    if (post) {
      this.position = post.id;
    } else {
      this.to_next_thread();
    }
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().thread,
        pass;
    do {
      thread = thread.next();
      pass = false;
      if (thread) {
        // Free pass for threads that are uninteresting and have been seen
        if (this.seen_thread_in_session[thread.posts[0].id]) {
          pass = true;
        } else if (thread.posts[0].topic != this.topic && this.forum.options.mode != ABF.MODES.random) {
          if (ABF.fifty_fifty()) {
            pass = false;
          } else {
            pass = true;
          }
        }
      }
    } while (pass);
    if (thread) {
      this.set_thread(thread);
    } else {
      this.drop_off_page(thread);
    }
  };

  construct.prototype.to_reply = function() {
    var old_post = this.post();
    var post = old_post.reply(this, ABF.random_action(ABF.TOPIC_ACTIONS, [[old_post.thread.posts[0].topic, 0.5]], old_post.topic));
    this.position = post.id;
    this.current_desire += this.forum.options.c_d_create;
  };

  construct.prototype.to_new_thread = function() {
    var thread = this.post().thread.new_thread(this, ABF.random_action(ABF.TOPIC_ACTIONS, false, this.topic));
    this.set_thread(thread);
    this.current_desire += this.forum.options.c_d_create;
  };

  //### Movement

  construct.prototype.go_online = function() {
    this.to_top_of_page();
  };

  construct.prototype.to_top_of_page = function() {
    if (this.forum.direction == ABF.DIRECTIONS.oldnew) {
      this.position = this.forum.threads[0].posts[0].id;
    } else {
      this.position = this.forum.threads[this.forum.threads.length - 1].posts[0].id;
    }
    this.seen_new_thread_since_top = false;
  };

  construct.prototype.drop_off_page = function() {
    if (this.seen_new_thread_since_top) {
      this.to_top_of_page();
    } else {
      this.go_offline();
    }
  };

  construct.prototype.go_offline = function() {
    this.current_desire = this.next_desire;
//    this.current_desire += this.forum.options.c_d_nothing_left; // Empty forum, frustration
//    this.current_desire = this.next_desire + Math.max(0, this.current_desire); // If any is left
    this.next_desire = 0;
    this.seen_thread_in_session = {};
    this.seen_reply_from_in_session = {};
    this.position = false;
  };

  construct.prototype.leave_forum = function() {
    this.left_forum = true;
    this.forum.users_count--;
    this.forum.users_per_topic_count[this.topic]--;
  };

  //### Getters and setters

  construct.prototype.set_thread = function(thread) {
    this.seen_uninteresting_in_thread = 0;
    this.position = thread.posts[0].id;
    this.current_desire += this.forum.options.c_d_page_load; // Cognitive load / loading time
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  //### Display

  construct.prototype.draw = function(x, y) {
    var context = this.forum.context;
    context.strokeStyle = "#F00";
    context.lineWidth = ABF.SCL;
    // head
    if (this.reading) {
      context.beginPath();
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
