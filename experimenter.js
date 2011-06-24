$ = {};
$.include = load;
$.include('agent_based_forum.js');

generations = 2000;

configurations = [
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

for (var i = 0; i < configurations.length; i++) {
  for (var property in ABF.DEFAULT_OPTIONS) {
    if (ABF.DEFAULT_OPTIONS.hasOwnProperty(property) && !configurations[i].hasOwnProperty(property)) {
      configurations[i][property] = ABF.DEFAULT_OPTIONS[property];
    }
  }
}

runner = function(options) {
  var forum = new Forum(options),
      i;
  for (i = 0; i < generations; i++) {
    forum.run();
  }
  cycle_output.push(forum.plot_data());
};

for (var i = 0; i < configurations.length; i++) {
  runner(configurations[i]);
}

print(JSON.stringify(cycle_output));
