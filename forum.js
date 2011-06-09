// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Forum = (function() {
  var construct;

  construct = function(canvasId) {
    this.direction = ABF.DEFAULT_DIRECTION;
    this.mode = ABF.DEFAULT_MODE;
    this.plot = ABF.DEFAULT_PLOT;
    this.initCanvas(canvasId);
    this.reset();
  };

  construct.prototype.reset = function() {
    if (this.mode == ABF.MODES.subthreaded) {
      this.spacing = 80;
    } else {
      this.spacing = 30;
    }
    this.max_threads = Math.floor(ABF.MAX_WIDTH / this.spacing);
    this.restart();
    if (this.plot_space) {
      this.replot();
    }
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        position_hash,
        init_array;

    this.run_count = 0;
    this.users_count = 0;
    this.daily_arrivals_count = 0;
    this.daily_leavers_count = 0;
    this.posts_count = 0;
    this.threads_count = 0;

    this.plot_users = [];
    this.plot_daily_arrivals = [];
    this.plot_daily_leavers = [];
    this.plot_posts = [];
    this.plot_threads = [];

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
    for (i = 0; i < 243; i++) {
      this.actors.push(new Actor({}, this));
    }
    this.set_post_actors();
    this.draw();
  };

  construct.prototype.run = function() {
    var new_visitors,
        i;
    if (this.run_count > 1 && this.run_count % 240 === 0) {
      this.add_actors();
    }
    for (i = 0; i < this.actors.length; i++) {
      this.actors[i].run();
      if (this.actors[i].left_forum) {
        this.actors.splice(i, 1);
        this.daily_leavers_count++;
        i--;
      }
    }
    this.prune_threads();
    this.set_post_actors();
    this.draw();
    this.draw_plot();
    this.run_count += 1;
  };

  construct.prototype.set_mode = function(selector) {
    var key = selector.selectedIndex;
    this.mode = key;
    this.reset();
  };

  construct.prototype.set_plot = function(selector) {
    var key = selector.selectedIndex;
    this.plot = key;
    this.replot();
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
      this.timeout = setInterval("forum.run()", 5);
    } else {
      this.running = false;
      clearInterval(this.timeout);
    }
  };

  construct.prototype.append_threads = function(thread_arrays) {
    for (var i = 0; i < thread_arrays.length; i++) {
      this.append_thread(thread_arrays[i]);
    }
  };

  construct.prototype.append_thread = function(thread_array) {
    var insert_position = this.threads.length;
    this.threads[insert_position] = 
        new ForumThread(thread_array, insert_position, this);
    return this.threads[insert_position];
  };

  construct.prototype.add_actors = function() {
    this.daily_arrivals_count = Math.floor(this.actors.length * 0.05);
    for (i = 0; i < this.daily_arrivals_count; i++) {
      this.actors.push(new Actor({}, this));
    }
  };

  construct.prototype.prune_threads = function() {
    var nr_to_remove,
        i;
    if (this.threads.length > this.max_threads) {
      nr_to_remove = this.threads.length - this.max_threads;
      for (i = 0; i < nr_to_remove; i++) {
        this.threads[i].delete_posts();
      }
      this.threads.splice(0, nr_to_remove);
      for (i in this.positions_hash) {
        if (this.positions_hash.hasOwnProperty(i)) {
          this.positions_hash[i].thread = this.positions_hash[i].thread - nr_to_remove;
        }
      }
    }
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

  construct.prototype.initialize_plot = function(plot_space) {
    this.plot_space = $(plot_space);
    this.replot();
  };

  construct.prototype.replot = function() {
    var options = {
        series: { shadowSize: 0 }, // drawing is faster without shadows
        xaxis: { show: false }
    };
    if (this.plot == ABF.PLOTS.users) {
      this.plotter = $.plot(this.plot_space, [], options);
    } else if (this.plot == ABF.PLOTS.posts) {
      this.plotter = $.plot(this.plot_space, [], options);
    } else if (this.plot == ABF.PLOTS.threads) {
      this.plotter = $.plot(this.plot_space, [], options);
    }
    this.draw_plot();
  };

  construct.prototype.draw_plot = function() {
    this.plot_users.push([this.run_count, this.users_count]);
    this.plot_posts.push([this.run_count, this.posts_count]);
    this.plot_threads.push([this.run_count, this.threads_count]);

    if (this.run_count % 240 === 0) {
      this.plot_daily_arrivals.push([this.run_count, this.daily_arrivals_count]);
      this.plot_daily_leavers.push([this.run_count, this.daily_leavers_count]);
      this.daily_leavers_count = 0;
    }

    if (this.plot == ABF.PLOTS.users) {
      this.plotter.setData([this.plot_users]);
    } else if (this.plot == ABF.PLOTS.arrivals_leavers) {
      this.plotter.setData([this.plot_daily_arrivals, this.plot_daily_leavers]);
    } else if (this.plot == ABF.PLOTS.posts) {
      this.plotter.setData([this.plot_posts]);
    } else if (this.plot == ABF.PLOTS.threads) {
      this.plotter.setData([this.plot_threads]);
    }
    this.plotter.setupGrid();
    this.plotter.draw();
  };

  return construct;
}());
