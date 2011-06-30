// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

var Forum = (function() {
  var construct;

  construct = function(options) {
    this.set_options = options;
    this.initial_actors = options.initial_actors;
    this.direction = options.direction;
    this.mode = options.mode;
    this.max_threads = options.max_threads;
    this.topics = options.topics;
    this.daily_arrivals_fraction = options.daily_arrivals_fraction;
    this.reset();
  };

  construct.prototype.initialize_display = function(space, plot_space) {
    this.canvas = $(space).get(0);
    this.context = this.canvas.getContext("2d");
    this.plot_space = $(plot_space);
    this.spacing = ABF.SPACING;
    this.plot = ABF.SELECTED_PLOT;
    this.replot();
    this.draw();
  };

  construct.prototype.reset = function() {
    this.restart();
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        position_hash,
        init_array,
        initial_offline_actors;

    this.actors_id_counter = 0; // only goes up, only for id's
    this.posts_id_counter = 0; // also for counting
    this.run_count = 0;
    this.users_count = 0;
    this.daily_arrivals_remainder = 0;
    this.daily_arrivals_count = 0;
    this.daily_leavers_count = 0;
    this.threads_count = 0;

    this.plot_users = [];
    this.plot_daily_arrivals = [];
    this.plot_daily_leavers = [];
    this.plot_posts = [];
    this.plot_threads = [];

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
    initial_offline_actors = this.initial_actors - this.actors.length;
    for (i = 0; i < initial_offline_actors; i++) {
      this.actors.push(new Actor({}, this));
    }
    this.set_post_actors();
    if (this.canvas) {
      this.draw();
      this.replot();
    }
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
    this.run_plot_data();
    if (this.canvas) {
      this.draw();
      this.draw_plot();
    }
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
    this.daily_arrivals_remainder = this.daily_arrivals_remainder + this.actors.length * this.daily_arrivals_fraction;
    this.daily_arrivals_count = 0;
    for (i = 0; i < this.daily_arrivals_remainder; i++) {
      this.actors.push(new Actor({}, this));
      this.daily_arrivals_count++;
    }
    this.daily_arrivals_remainder = this.daily_arrivals_remainder - this.daily_arrivals_count;
  };

  construct.prototype.prune_threads = function() {
    var nr_to_remove,
        i,
        property;
    if (this.threads.length > this.max_threads) {
      nr_to_remove = this.threads.length - this.max_threads;
      for (i = 0; i < nr_to_remove; i++) {
        this.threads[i].delete_posts();
      }
      this.threads.splice(0, nr_to_remove);
      for (property in this.positions_hash) {
        if (this.positions_hash.hasOwnProperty(property)) {
          this.positions_hash[property].thread = this.positions_hash[property].thread - nr_to_remove;
        }
      }
    }
  };

  construct.prototype.set_post_actors = function() {
    var positions_hash;
    for (var i = 0; i < this.actors.length; i++) {
      if (this.actors[i].position !== false) {
        position_hash = this.positions_hash[this.actors[i].position];
        if (position_hash !== undefined) {
          this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
        } else {
          this.actors[i].go_offline(); // thread is gone
        }
      }
    }
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

  construct.prototype.replot = function() {
    var options = {
        series: { shadowSize: 0 }, // drawing is faster without shadows
        xaxis: { show: false }
    };
    this.plotter = $.plot(this.plot_space, [], options);
    this.run_plot_data();
    this.draw_plot();
  };

  construct.prototype.run_plot_data = function() {
    this.plot_posts.push([this.run_count, this.posts_id_counter]);
    this.plot_users.push([this.run_count, this.users_count]);
    this.plot_threads.push([this.run_count, this.threads_count]);

    if (this.run_count % 240 === 0) {
      this.plot_daily_arrivals.push([this.run_count, this.daily_arrivals_count]);
      this.plot_daily_leavers.push([this.run_count, this.daily_leavers_count]);
      this.daily_leavers_count = 0;
    }
  };

  construct.prototype.draw_plot = function() {
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

  construct.prototype.plot_data = function() {
    return {
        config: this.set_options, 
        data: {
            posts: [this.plot_posts],
            users: [this.plot_users],
            threads: [this.plot_threads],
            arrivals_leavers: [this.plot_daily_arrivals, this.plot_daily_leavers]
        }};
  };

  return construct;
}());
