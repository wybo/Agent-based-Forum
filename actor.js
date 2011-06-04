// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Actor = (function() {
  var construct;

  construct = function(options, forum) {
    // The global forum
    this.forum = forum;
    // The position, offline if false
    this.position = (options.position ? options.position : false);
    /// Agent attributes
    this.interest = Math.floor(Math.random() * (20 + 1));
    this.actions = [];
    this.actions.push({
        chance: 20,
        action: this.to_reply
      }, {
        chance: 2,
        action: this.to_new_thread
      }, {
        total: 1000,
        action: this.to_next_post
      });
    this.actions = ABF.prepare_actions(this.actions, {bind: this});
    ///
  };

  /// Agent rate and objective functions
  construct.prototype.run = function() {
    if (this.position === false) { // is offline, rate function
      var roll = Math.floor(Math.random()*1001);
      if (this.interest > roll) { // if interest greater than roll
        this.go_online();
      } else {
        this.interest = this.interest + 1; // regenerate interest
      }
    } else { // is visiting forum, objective function
      // this.own_post_bonus() could be added;
      if (this.interest < 0) { // no interest left, leave
        this.go_offline();
      } else {
        ABF.random_action(this.actions, {boost: [0, this.interest]});
      }
    }
  };
  ///

  construct.prototype.to_next_post = function() {
    var post = this.post().next();
    if (post) {
      this.position = post.id;
    } else {
      this.to_next_thread();
    }
    this.interest--; // lose interest / satisfy need to read
  };

  construct.prototype.to_next_thread = function() {
    var thread = this.post().thread.next();
    if (thread) {
      this.position = thread.posts[0].id;
    } else {
      this.go_offline();
    }
  };

  construct.prototype.to_reply = function() {
    var post = this.post().reply();
    this.position = post.id;
  };

  construct.prototype.to_new_thread = function() {
    var thread = this.post().thread.new_thread();
    this.position = thread.posts[0].id;
  };

  construct.prototype.post = function() {
    var position_hash = this.forum.positions_hash[this.position];
    return this.forum.threads[position_hash.thread].posts[position_hash.post];
  };

  construct.prototype.go_offline = function() {
    this.position = false;
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
    // head
    context.strokeStyle = "#F00";
    context.lineWidth = ABF.SCL;
    context.beginPath();
    context.arc(x, y, ABF.SCL * 4, 0, Math.PI * 2, false);
    context.closePath();
    context.stroke();
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
