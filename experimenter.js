$ = {};
$.include = load;
$.include('agent_based_forum.js');

if (typeof(FULL_DATA) === undefined) {
  var FULL_DATA = false;
}

//reruns = 100; // To average it out
reruns = 20; // To average it out
//reruns = 5; // To average it out
//reruns = 2; // To average it out
//reruns = 1;

//generations = 87600; // 365 days
generations = 9600; // 40 days
//generations = 3600; // 15 days
//generations = 6;
//generations = 1;

//initial_actor_or_arrivals_settings = [10, 20, 30, 40, 50];
//initial_actor_or_arrivals_settings = [2, 3, 4, 5, 10, 20];
//initial_actor_or_arrivals_settings = [5, 10, 15, 20, 25, 35];
initial_actor_or_arrivals_settings = [50, 100, 200];
//initial_actor_or_arrivals_settings = [500, 1500, 5000];
//initial_actor_or_arrivals_settings = [50];

note = "Reciprocity slightly down, on-topic 1.8";

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

prepare_tests = function(tests, initial_actor_or_arrivals_settings, note) {
  var new_tests = [],
      i,
      j,
      k,
      property,
      n = 0;
  for (i = 0; i < tests.length; i++) {
    for (j = 0; j < initial_actor_or_arrivals_settings.length; j++) {
      new_tests[n] = {};
      for (property in tests[i]) {
        if (tests[i].hasOwnProperty(property)) {
          new_tests[n][property] = tests[i][property];
        }
      }
      if (ABF.DEFAULT_OPTIONS.with_thresholds) {
        new_tests[n].daily_arrivals = initial_actor_or_arrivals_settings[j];
      } else {
        new_tests[n].initial_actors = initial_actor_or_arrivals_settings[j];
      }
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
      averaged_hash = {data: {critical_mass_days_all: []}},
      hash,
      critical_mass_reached_times = 0,
      property,
      r,
      s,
      i;
  for (r = 0; r < reruns; r++) {
    forum = new Forum(options);
    for (i = 0; i < generations; i++) {
      forum.run();
    }
    hash = forum.data();
    if (FULL_DATA) {
      print(JSON.stringify(hash));
      if (r < reruns - 1) {
        print(",");
      }
    } else {
      if (!averaged_hash.config) {
        averaged_hash.config = hash.config;
      }
      averaged_hash.data.critical_mass_days_all.push(hash.data.critical_mass_days);
      for (property in hash.data) {
        if (hash.data.hasOwnProperty(property)) {
          if (property == "critical_mass_days") {
            if (!averaged_hash.data[property]) {
              averaged_hash.data[property] = 0;
            }
            if (hash.data[property] >= 0) {
              averaged_hash.data[property] += (hash.data[property] * 1.0);
              critical_mass_reached_times++;
            }
          } else {
            if (!averaged_hash.data[property]) {
              averaged_hash.data[property] = [];
            }
            for (s = 0; s < hash.data[property].length; s++) {
              if (!averaged_hash.data[property][s]) {
                averaged_hash.data[property][s] = [];
              }
              for (i = 0; i < hash.data[property][s].length; i++) {
                if (!averaged_hash.data[property][s][i]) {
                  averaged_hash.data[property][s][i] = [hash.data[property][s][i][0], 0];
                }
                averaged_hash.data[property][s][i][1] += ((hash.data[property][s][i][1] * 1.0) / reruns);
              }
            }
          }
        }
      }
    }
  }
  if (!FULL_DATA) {
    for (property in averaged_hash.data) {
      if (hash.data.hasOwnProperty(property)) {
        if (property != "critical_mass_days" && property != "critical_mass_days_all") {
          for (s = 0; s < hash.data[property].length; s++) {
            for (i = 0; i < hash.data[property][s].length; i++) {
              averaged_hash.data[property][s][i][1] = Math.round(averaged_hash.data[property][s][i][1] * 100) / 100;
            }
          }
        }
      }
    }
    if (averaged_hash.data.critical_mass_days) {
      averaged_hash.data.critical_mass_days = (averaged_hash.data.critical_mass_days * 1.0) / 
          critical_mass_reached_times;
      averaged_hash.data.critical_mass_reached_fraction = (critical_mass_reached_times * 1.0) /
          reruns;
    }
    print(JSON.stringify(averaged_hash));
  }
};

tests = prepare_tests(tests, initial_actor_or_arrivals_settings, note);

print("[");
for (var c_i = 0; c_i < tests.length; c_i++) {
  if (FULL_DATA) {
    print("[");
  }
  experimenter(tests[c_i]);
  if (FULL_DATA) {
    print("]");
  }
  if (c_i < tests.length - 1) {
    print(",");
  }
}
print("]");
