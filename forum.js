// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

Forum = (function() {
  var construct;

  construct = function(options) {
    this.default_options = options;
    this.restore_and_restart();
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

  construct.prototype.restore_and_restart = function() {
    this.options = {};
    this.set_options(this.default_options);
    this.restart();
  };

  construct.prototype.restart = function() {
    var id,
        i,
        j,
        seed_thread,
        seed_single,
        init_array = [];

    this.actors = [];
    this.actors_id_counter = 0; // only goes up, only for id's
    this.posts_id_counter = 0; // also for counting
    this.run_count = 0;
    this.users_count = 0;
    this.users_per_topic_count = [];

    this.daily_arrivals_remainder = 0;
    this.threads_count = 0;
    this.reset_daily_counts();

    if (this.options.with_thresholds) {
      this.critical_mass_days = -1;
      this.locked = false;
    }

    this.plot_users = [];
    this.plot_daily_unique_posters = [];
    this.plot_daily_arrivals = [];
    this.plot_daily_leavers = [];
    this.plot_posts = [];
    this.plot_threads = [];
    this.plot_topics = [];
    for (i = 0; i < 4; i++) {
      this.plot_topics[i] = [];
    }

    this.positions_hash = {};
    this.threads = [];
    seed_thread = [
          {indent: 0},
          {indent: 1},
          {indent: 2},
          {indent: 2},
          {indent: 2},
          {indent: 3},
          {indent: 3},
          {indent: 3},
          {indent: 1},
          {indent: 2},
          {indent: 2},
          {indent: 2},
          {indent: 3},
          {indent: 3},
          {indent: 3}
        ];
    seed_single = [seed_thread[0]];
    if (this.options.initial_threads < 1) {
      init_array.push(seed_single);
    } else {
      for (i = 0; i < this.options.initial_threads; i++) {
        init_array.push(seed_thread);
      }
    }
    if (this.options.mode == ABF.MODES.random) {
      new_array = [];
      for (i = 0; i < init_array.length; i++) {
        for (j = 0; j < init_array[i].length; j++) {
          init_array[i][j].indent = 0;
          new_array.push([init_array[i][j]]);
        }
      }
      init_array = new_array;
    } else if (this.options.mode == ABF.MODES.threaded) {
      for (i = 0; i < init_array.length; i++) {
        for (j = 0; j < init_array[i].length; j++) {
          if (init_array[i][j].indent !== 0) {
            init_array[i][j].indent = j;
          }
        }
      }
    }
    this.append_threads(init_array);
    this.reset_daily_counts();
    
    for (i = 0; i < this.options.initial_actors; i++) {
      this.actors.push(new Actor({}, this));
    }
    this.prune_actors_and_add_to_posts();
    if (this.canvas) {
      this.draw();
      this.replot();
    }
  };

  construct.prototype.run = function() {
    var new_visitors,
        changed_positions = false,
        i;
    if (!this.options.with_thresholds || !this.locked) {
      for (i = 0; i < this.actors.length; i++) {
        this.actors[i].run();
        if (this.actors[i].left_forum) {
          this.actors.splice(i, 1);
          this.daily_leavers_count++;
          i--;
        }
      }
      if (this.options.mode != ABF.MODES.random) {
        this.prune_threads();
        changed_positions = true;
      }
      if (this.options.mode == ABF.MODES.ordered) {
        this.reorder_threads();
        changed_positions = true;
      }
      if (changed_positions) {
        this.redo_positions_hash();
      }
      if (this.run_count % 240 === 0) {
        this.add_actors();
      }
      this.prune_actors_and_add_to_posts();
    }
    this.run_plot_data(); // Resets daily_unique_posters_count
    if (this.canvas) {
      this.draw();
      this.draw_plot();
    }
    this.run_count += 1;
  };

  construct.prototype.set_mode = function(selector) {
    var key = selector.selectedIndex,
        previous_mode = this.options.mode;
    this.options.mode = key;
    if (previous_mode != this.options.mode && (previous_mode == ABF.MODES.random || this.options.mode == ABF.MODES.random)) {
      this.toggleOrder();
    }
    this.restart();
  };

  construct.prototype.set_plot = function(selector) {
    var key = selector.selectedIndex;
    this.plot = key;
    this.replot();
  };

  construct.prototype.toggleOrder = function() {
    if (this.options.direction == ABF.DIRECTIONS.oldnew) {
      this.options.direction = ABF.DIRECTIONS.newold;
    } else {
      this.options.direction = ABF.DIRECTIONS.oldnew;
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
    var i;
    if (this.options.with_thresholds) {
      for (i = 0; i < this.options.daily_arrivals; i++) {
        this.actors.push(new Actor({}, this));
      } // Pruned again if uniques is under their threshold
      if (this.critical_mass_days == -1 && this.daily_unique_posters_count > this.options.threshold_average) {
        this.critical_mass_days = (this.run_count * 1.0) / 240;
        this.locked = true;
      }
    } else if (this.run_count > 1) {
      this.daily_arrivals_remainder = this.daily_arrivals_remainder + 
          this.daily_unique_posters_count * this.options.daily_arrivals_fraction;
      for (i = 0; i < this.daily_arrivals_remainder; i++) {
        this.actors.push(new Actor({}, this));
        this.daily_arrivals_count++;
      }
      this.daily_arrivals_remainder = this.daily_arrivals_remainder - this.daily_arrivals_count;
    }
  };

  construct.prototype.prune_threads = function() {
    var nr_to_remove,
        i,
        property;
    if (this.threads.length > this.options.max_threads) {
      nr_to_remove = this.threads.length - this.options.max_threads;
      for (i = 0; i < nr_to_remove; i++) {
        this.threads[i].delete_posts();
      }
      this.threads.splice(0, nr_to_remove);
      // runs redo_positions_hash later
    }
  };

  construct.prototype.reorder_threads = function() {
    for (i = 0; i < this.threads.length; i++) {
      this.threads[i].reweight_thread_and_posts(this.run_count);
      this.threads[i].reorder_posts();
    }
    this.threads.sort(ABF.sort_by_first_posts_weight);
    // runs redo_positions_hash later
  };

  construct.prototype.redo_positions_hash = function() {
    var position_hash,
        i,
        j;
    for (i = 0; i < this.threads.length; i++) {
      for (j = 0; j < this.threads[i].posts.length; j++) {
        position_hash = this.positions_hash[this.threads[i].posts[j].id];
        position_hash.thread = i;
        position_hash.post = j;
      }
    }
  };

  construct.prototype.prune_actors_and_add_to_posts = function() {
    var position_hash,
        i;
    if (this.options.with_thresholds) {
      for (i = 0; i < this.actors.length; i++) {
        if (this.actors[i].threshold > this.daily_unique_posters_count) {
          this.actors[i].leave_forum();
        }
      }
    }
    for (i = 0; i < this.actors.length; i++) {
      if (this.actors[i].position !== false) {
        position_hash = this.positions_hash[this.actors[i].position];
        if (position_hash !== undefined) {
          this.threads[position_hash.thread].posts[position_hash.post].actor = this.actors[i];
        } else {
          this.actors[i].drop_off_page(); // thread is gone
        }
      }
    }
  };

  construct.prototype.draw = function() {
    this.canvas.width = this.canvas.width;
    if (this.options.direction == ABF.DIRECTIONS.oldnew) {
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
    var plot_options = {
        series: { shadowSize: 0 }, // drawing is faster without shadows
        xaxis: { show: false }
    };
    this.plotter = $.plot(this.plot_space, [], plot_options);
    this.run_plot_data();
    this.draw_plot();
  };

  construct.prototype.run_plot_data = function() {
    this.plot_posts.push([this.run_count, this.posts_id_counter]);
    this.plot_users.push([this.run_count, this.users_count]);
    this.plot_threads.push([this.run_count, this.threads_count]);
    for (i = 0; i < 4; i++) {
      this.plot_topics[i].push([this.run_count, this.users_per_topic_count[i]]);
    }

    if (this.run_count % 240 === 0) {
      this.plot_daily_unique_posters.push([this.run_count, this.daily_unique_posters_count]);
      this.plot_daily_arrivals.push([this.run_count, this.daily_arrivals_count]);
      this.plot_daily_leavers.push([this.run_count, this.daily_leavers_count]);
      this.reset_daily_counts();
    }
  };

  construct.prototype.draw_plot = function() {
    if (this.plot == ABF.PLOTS.unique_posters) {
      this.plotter.setData([this.plot_daily_unique_posters]);
    } else if (this.plot == ABF.PLOTS.users) {
      this.plotter.setData([this.plot_users]);
    } else if (this.plot == ABF.PLOTS.arrivals_leavers) {
      this.plotter.setData([this.plot_daily_arrivals, this.plot_daily_leavers]);
    } else if (this.plot == ABF.PLOTS.posts) {
      this.plotter.setData([this.plot_posts]);
    } else if (this.plot == ABF.PLOTS.threads) {
      this.plotter.setData([this.plot_threads]);
    } else if (this.plot == ABF.PLOTS.topics) {
      this.plotter.setData(this.plot_topics);
    }

    this.plotter.setupGrid();
    this.plotter.draw();
  };

  construct.prototype.data = function() {
    return {
        config: this.options, 
        data: {
          unique_posters: [this.plot_daily_unique_posters],
          users: [this.plot_users],
          arrivals_leavers: [this.plot_daily_arrivals, this.plot_daily_leavers],
          posts: [this.plot_posts],
          threads: [this.plot_threads],
          topics: this.plot_topics,
          critical_mass_days: this.critical_mass_days
        }};
  };

  construct.prototype.reset_daily_counts = function() {
    if (!this.options.with_thresholds || !this.locked) {
      this.daily_unique_posters_count = 0;
      this.daily_unique_posters_hash = {};
      this.daily_arrivals_count = 0;
      this.daily_leavers_count = 0;
    }
  };

  construct.prototype.set_options = function(options) {
    var property;
    for (property in options) {
      if (options.hasOwnProperty(property)) {
        this.options[property] = options[property];
      }
    }
    this.restart();
  };

  return construct;
}());
