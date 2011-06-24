// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

// Functions for use in chances

ABF.arg_returning_function = function(arg) {
  return function () {
    return arg;
  };
};

ABF.skip = function() {};

ABF.bind = function(obj, method) {
  return function() {
    return method.apply(obj, [].slice.call(arguments));
  };
};

// Actions and action-related

ABF.prepare_actions = function(actions, options) {
  var cutoff = 0.0,
      i,
      structure = {};
  if (actions[actions.length - 1].total) {
    structure.total = actions[actions.length - 1].total;
    if (actions[actions.length - 1].action) {
      actions[actions.length - 1].chance = structure.total;
    } else {
      actions[actions.length - 1].action = ABF.skip;
    }
  } else {
    structure.total = 0;
    for (i = 0; i < actions.length; i++) {
      structure.total += actions[i].chance;
    }
  }
  for (i = 0; i < actions.length; i++) {
    var fraction = actions[i].chance / structure.total;
    cutoff += fraction;
    actions[i].cutoff = cutoff;
    if (options && options.bind) {
      actions[i].action = ABF.bind(options.bind, actions[i].action);
    }
  }
  structure.actions = actions;
  return structure;
};

ABF.random_action = function(actions, options) {
  var roll;
  if (options && options.boost) {
    roll = Math.random() * (1 + options.boost[1] / actions.total);
    if (roll > 1) {
      actions.actions[options.boost[0]].action();
    }
  } else {
    roll = Math.random();
  }
  for (var i = 0; i < actions.actions.length; i++) {
    if (roll < actions.actions[i].cutoff) {
      if (options && options.swap) {
        if (i === 0) { // If 0, and swap 0, still 0
          i = options.swap;
        } else if (i == options.swap) {
          i = 0;
        }
      }
      return actions.actions[i].action();
    }
  }
};

ABF.topic_actions = function(topics) {
  actions = [];
  for (var i = topics - 1; i >= 0; i--) {
    actions.push({
      chance: Math.pow(2, i),
      action: ABF.arg_returning_function(topics - i - 1) });
  }
  actions = ABF.prepare_actions(actions);
  return actions;
};

ABF.topic_colors = function(topics) {
  var topic_colors = [],
      topic_multiplier = topics / 8.0,
      wheel_part_part = [],
      wheel_part = null,
      i;
  for (i = 1; i <= topic_multiplier; i++) {
    wheel_part_part.push(Math.ceil(255 / topic_multiplier) * i);
  }
  for (i = 1; i <= (2 * topic_multiplier); i++) {
    wheel_part_part.push(255);
  }
  for (i = 1; i <= topic_multiplier; i++) {
    wheel_part_part.push(255 - Math.ceil(255 / topic_multiplier) * i);
  }
  for (i = 1; i <= (2 * topic_multiplier); i++) {
    wheel_part_part.push(0);
  }
  wheel_part = wheel_part_part.concat(wheel_part_part);
  for (i = 2 * topic_multiplier; i < 8 * topic_multiplier; i++) {
    topic_colors.push('rgb(' + wheel_part[i + 2 * topic_multiplier] +
        ', ' + wheel_part[i] +
        ', ' + wheel_part[i - 2 * topic_multiplier] + ')');
  }
  return topic_colors;
};

// Randomization / normal distributions

function rnd_bmt() {
    var x = 0, y = 0, rds, c;

    // Get two random numbers from -1 to 1.
    // If the radius is zero or greater than 1, throw them out and pick two new ones
    // Rejection sampling throws away about 20% of the pairs.
    do {
    x = Math.random()*2-1;
    y = Math.random()*2-1;
    rds = x*x + y*y;
    }
    while (rds == 0 || rds > 1)

    // This magic is the Box-Muller Transform
    c = Math.sqrt(-2*Math.log(rds)/rds);

    // It always creates a pair of numbers. I'll return them in an array.
    // This function is quite efficient so don't be afraid to throw one away if you don't need both.
    return [x*c, y*c];
}

function rnd_snd() {
  return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
}
