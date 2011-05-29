// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html
//
// See Actors construct.prototype.run (halfway down) for the core logic

var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    this.initCanvas(canvasId);
    this.reset();
  };

  construct.prototype.reset = function() {
    this.direction = ABF.INITIAL_DIRECTION;
    this.restart();
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        position_hash;

    this.post_id_counter = 0;
    this.thread_index_counter = 0;
    this.positions_hash = {};
    this.threads = [
      new ForumThread([
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 4},
        {indent: 3},
        {indent: 3},
        {indent: 2},
        {indent: 1},
        {indent: 1}
      ], this),
      new ForumThread([
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 4},
        {indent: 3},
        {indent: 3},
        {indent: 2},
        {indent: 1},
        {indent: 1}
      ], this),
      new ForumThread([
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2}
      ], this),
      new ForumThread([ 
        {indent: 0},
        {indent: 1}
      ], this)
        ];
    
    this.actors = [
        new Actor({position: 1}, this),
        new Actor({position: 8}, this),
        new Actor({position: 40}, this),
        new Actor({position: 44}, this),
        new Actor({position: 37}, this),
        new Actor({position: 23}, this),
        new Actor({position: 11}, this)
      ];
    for (i = 0; i < 21; i++) {
      this.actors.push(new Actor({}, this));
    }
    this.draw();
  };

  construct.prototype.run = function() {
    for (i = 0; i < this.actors.length; i++) {
      this.actors[i].run();
    }
    this.draw();
  };

  construct.prototype.draw = function() {
    this.canvas.width = this.canvas.width;
    for (i = 0; i < this.actors.length; i++) {
      if (this.actors[i].position) {
        position_hash = this.positions_hash[this.actors[i].position];
        this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
      }
    }
    if (this.direction == ABF.DIRECTIONS.oldnew) {
      for (i = 0; i < this.threads.length; i++) {
        this.threads[i].draw(i);
      }
    } else {
      for (i = this.threads.length - 1; i >= 0; i--) {
        this.threads[i].draw(this.threads.length - 1 - i);
      }
    }
  };

  construct.prototype.initCanvas = function(canvasId) {
    this.canvas = $(canvasId).get(0);
    this.context = this.canvas.getContext("2d");
  };

  construct.prototype.toggleOrder = function() {
    if (this.direction == ABF.DIRECTIONS.oldnew) {
      this.direction = ABF.DIRECTIONS.newold;
    } else {
      this.direction = ABF.DIRECTIONS.oldnew;
    }
    this.restart();
  };

  construct.prototype.toggleRun = function() {
    if (!this.running) {
      this.running = true;
      this.timeout = setInterval("forum.run()", 10);
    } else {
      this.running = false;
      clearInterval(this.timeout);
    }
  };

  return construct;
}());
