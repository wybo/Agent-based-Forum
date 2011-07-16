$ = {};
$.include = load;
$.include('agent_based_forum.js');

reruns = 20; // To average it out
//reruns = 2; // To average it out

generations = 9600; // 40 days
//generations = 3600; // 15 days
//generations = 6;

//initial_actor_settings = [5, 10, 15, 20, 25, 35];
//initial_actor_settings = [50, 100, 200];
initial_actor_settings = [500, 1500, 5000];

note = "Testing large user-counts";

tests = [
      {
        mode: ABF.MODES.random
      },
      {
        mode: ABF.MODES.threaded
      },
      {
        mode: ABF.MODES.subthreaded
      },
      {
        mode: ABF.MODES.ordered
      }
    ];

cycle_output = [];

prepare_tests = function(tests, initial_actor_settings, note) {
  var new_tests = [],
      i,
      j,
      property,
      n = 0;
  for (i = 0; i < tests.length; i++) {
    for (j = 0; j < initial_actor_settings.length; j++) {
      new_tests[n] = {};
      for (property in tests[i]) {
        if (tests[i].hasOwnProperty(property)) {
          new_tests[n][property] = tests[i][property];
        }
      }
      new_tests[n].initial_actors = initial_actor_settings[j];
      new_tests[n].note = note;
      n++;
    }
  }
  for (i = 0; i < new_tests.length; i++) {
    for (property in ABF.DEFAULT_OPTIONS) {
      if (ABF.DEFAULT_OPTIONS.hasOwnProperty(property) && !new_tests[i].hasOwnProperty(property)) {
        new_tests[i][property] = ABF.DEFAULT_OPTIONS[property];
      }
    }
  }
  return new_tests;
};

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
  print(JSON.stringify(averaged_plot_hash));
};

tests = prepare_tests(tests, initial_actor_settings, note);

print("[");
for (var c_i = 0; c_i < tests.length; c_i++) {
  experimenter(tests[c_i]);
  if (c_i < tests.length - 1) {
    print(",");
  }
}
print("]");
