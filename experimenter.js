$ = {};
$.include = load;
$.include('agent_based_forum.js');

//reruns = 20; // To average it out
reruns = 2; // To average it out

//generations = 9600;
generations = 6;

tests = [
      {
        initial_actors: 50,
        mode: ABF.MODES.threaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 100,
        mode: ABF.MODES.threaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 200,
        mode: ABF.MODES.threaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 300,
        mode: ABF.MODES.threaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 50,
        mode: ABF.MODES.subthreaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 100,
        mode: ABF.MODES.subthreaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 200,
        mode: ABF.MODES.subthreaded,
        daily_arrivals_fraction: 0.15
      },
      {
        initial_actors: 300,
        mode: ABF.MODES.subthreaded,
        daily_arrivals_fraction: 0.15
      }
    ];

cycle_output = [];

prepare_tests = function(tests) {
  for (var c_i = 0; c_i < tests.length; c_i++) {
    for (var property in ABF.DEFAULT_OPTIONS) {
      if (ABF.DEFAULT_OPTIONS.hasOwnProperty(property) && !tests[c_i].hasOwnProperty(property)) {
        tests[c_i][property] = ABF.DEFAULT_OPTIONS[property];
      }
    }
  }
  return tests;
}

experimenter = function(options) {
  var forum,
      averaged_plot_hash = {data: {}},
      plot_hash,
      r,
      s,
      i;
  for (r = 0; r < reruns; r++) {
    forum = new Forum(options);
    for (i = 0; i < generations; i++) {
      forum.run();
    }
    plot_hash = forum.plot_data();
    if (!averaged_plot_hash.config) {
      averaged_plot_hash.config = plot_hash.config;
    }
    for (var property in plot_hash.data) {
      if (plot_hash.data.hasOwnProperty(property)) {
        if (!averaged_plot_hash.data[property]) {
          averaged_plot_hash.data[property] = [];
        }
        for (s = 0; s < plot_hash.data[property].length; s++) {
          if (!averaged_plot_hash.data[property][s]) {
            averaged_plot_hash.data[property][s] = [];
          }
          for (i = 0; i < plot_hash.data[property][s].length; i++) {
            if (!averaged_plot_hash.data[property][s][i]) {
              averaged_plot_hash.data[property][s][i] = [plot_hash.data[property][s][i][0], 0];
            }
            averaged_plot_hash.data[property][s][i][1] += ((plot_hash.data[property][s][i][1] * 1.0) / reruns);
          }
        }
      }
    }
  }
  cycle_output.push(averaged_plot_hash);
};

tests = prepare_tests(tests);

for (var c_i = 0; c_i < tests.length; c_i++) {
  experimenter(tests[c_i]);
}

print(JSON.stringify(cycle_output));
