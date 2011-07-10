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
    structure.total = actions[actions.length - 1].total * 1.0; // to float
    if (actions[actions.length - 1].action) {
      actions[actions.length - 1].chance = structure.total;
    } else {
      actions[actions.length - 1].action = ABF.skip;
    }
  } else {
    structure.total = 0.0;
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
  var roll,
      boosts_fraction = 0,
      i;
  if (options && options.boosts) {
    roll = Math.random() * (1.0 + options.boosts[0]);
    if (roll >= 1) {
      if (options.boosts[2] && roll - 1 < options.boosts[1]) {
        actions.actions[options.boosts[i].action_i].action();
      } else {
        
      }
    }
    

    for (i = 0; i < options.boosts.length; i++) {
      if (options.boosts[i].chance !== undefined) {
        options.boosts[i].fraction = options.boosts[i].chance / actions.total;
      }
      options.boosts[i].cutoff = boosts_fraction + options.boosts[i].fraction;
      boosts_fraction += options.boosts[i].fraction;
    }
    roll = Math.random() * (1.0 + boosts_fraction);
    if (roll >= 1) {
      for (i = 0; i < options.boosts.length; i++) {
        if (roll < options.boosts[i].cutoff) {
          actions.actions[options.boosts[i].action_i].action();
        }
      }
    }
  } else {
    roll = Math.random();
  }
  for (i = 0; i < actions.actions.length; i++) {
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

ABF.fifty_fifty_flipper = true;

ABF.fifty_fifty = function() {
  if (ABF.fifty_fifty_flipper) {
    return (ABF.fifty_fifty_flipper = false);
  } else {
    return (ABF.fifty_fifty_flipper = true);
  }
};

ABF.topic_actions = function(topics) {
  actions = [];
  for (var i = topics - 1; i >= 0; i--) {
    actions.push({
      chance: Math.pow(ABF.DEFAULT_OPTIONS.topic_power, i),
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

ABF.sort_by_first_posts_weight = function(a, b) {
  return a.posts[0].weight - b.posts[0].weight;
};

ABF.sort_by_first_element = function(a, b) {
  return b[0] - a[0];
};

ABF.hn_weight = function(rating, time) {
  return (rating - 1) / Math.pow((time / 10.0 + 2), 1.8);
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
    } while (rds === 0 || rds > 1);

    // This magic is the Box-Muller Transform
    c = Math.sqrt(-2*Math.log(rds)/rds);

    // It always creates a pair of numbers. I'll return them in an array.
    // This function is quite efficient so don't be afraid to throw one away if you don't need both.
    return [x*c, y*c];
}

function rnd_snd() {
  return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
}
