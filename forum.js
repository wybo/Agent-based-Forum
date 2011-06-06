// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    this.direction = ABF.DEFAULT_DIRECTION;
    this.mode = ABF.DEFAULT_MODE;
    this.max_threads = ABF.MAX_THREADS;
    this.initCanvas(canvasId);
    this.reset();
  };

  construct.prototype.reset = function() {
    if (this.mode == ABF.MODES.subthreaded) {
      this.spacing = 80;
    } else {
      this.spacing = 30;
    }
    this.restart();
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        position_hash,
        init_array;

    this.run_count = 0;
    this.posts_count = 0;
    this.posts_plot = [];

    this.post_id_counter = 0;
    this.thread_index_counter = 0;
    this.positions_hash = {};
    this.threads = [];
    init_array = [
      [
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], [ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ], [ 
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
      ], [
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], [ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 3},
        {indent: 3}
      ], [ 
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
      ], [
        {indent: 0},
        {indent: 1},
        {indent: 2},
        {indent: 2},
        {indent: 1}
      ], [ 
        {indent: 0},
        {indent: 1},
        {indent: 1},
        {indent: 2}
      ], [ 
        {indent: 0},
        {indent: 1}
      ]];
    if (this.mode == ABF.MODES.random) {
      new_array = [[]];
      for (i = 0; i < init_array.length; i++) {
        for (j = 0; j < init_array[i].length; j++) {
          if (init_array[i][j].indent !== 0) {
            init_array[i][j].indent = null;
            new_array[0].push(init_array[i][j]);
          }
        }
      }
      init_array = new_array;
    } else if (this.mode == ABF.MODES.threaded) {
      for (i = 0; i < init_array.length; i++) {
        for (j = 0; j < init_array[i].length; j++) {
          if (init_array[i][j].indent !== 0) {
            init_array[i][j].indent = 1;
          }
        }
      }
    }
    this.append_threads(init_array);
    
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
    this.set_post_actors();
    this.draw();
  };

  construct.prototype.run = function() {
    for (i = 0; i < this.actors.length; i++) {
      this.actors[i].run();
    }
    this.set_post_actors();
    this.draw();
    this.plot();
    this.run_count += 1;
  };

  construct.prototype.set_mode = function(selector) {
    var key = selector.selectedIndex;
    this.mode = key;
    this.reset();
  }

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
      this.timeout = setInterval("forum.run()", 50);
    } else {
      this.running = false;
      clearInterval(this.timeout);
    }
  };

  construct.prototype.append_threads = function(thread_arrays) {
    for (var i = 0; i < thread_arrays.length; i++) {
      this.append_thread(thread_arrays[i]);
    }
  }

  construct.prototype.append_thread = function(thread_array) {
    var insert_position;
    if (this.threads.length >= this.max_threads) {
      this.threads[0].delete_posts();
      for (var i = 1; i < this.threads.length; i++) {
        this.threads[i - 1] = this.threads[i];
      }
      for (i in this.positions_hash) {
        if (this.positions_hash.hasOwnProperty(i)) {
          this.positions_hash[i].thread--;
        }
      }
      insert_position = this.threads.length - 1;
    } else {
      insert_position = this.threads.length;
    }
    if (!thread_array) {
      thread_array = [{indent: 0, inserted: true}];
    }
    this.threads[insert_position] = 
        new ForumThread(thread_array, insert_position, this);
    return this.threads[insert_position];
  };

  construct.prototype.set_post_actors = function() {
    for (var i = 0; i < this.actors.length; i++) {
      if (this.actors[i].position) {
        position_hash = this.positions_hash[this.actors[i].position];
        if (position_hash !== undefined) {
          this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
        } else {
          this.actors[i].go_offline(); // thread is gone
        }
      }
    }
  };

  construct.prototype.initCanvas = function(canvasId) {
    this.canvas = $(canvasId).get(0);
    this.context = this.canvas.getContext("2d");
  };

  construct.prototype.draw = function() {
    var position_hash;
    this.canvas.width = this.canvas.width;
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

  construct.prototype.plot = function() {
    this.posts_plot.push([this.run_count, this.posts_count]);
    this.plotter.setData([this.posts_plot]);
    this.plotter.setupGrid();
    this.plotter.draw();
  }

  construct.prototype.set_plot = function(placeholder) {
    var options = {
        series: { shadowSize: 0 }, // drawing is faster without shadows
        xaxis: { show: false }
    };
    this.plotter = $.plot($(placeholder), [this.posts_plot], options);
  };
  return construct;
}());
