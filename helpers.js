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

ABF.prepare_choice = function(actions, options) {
  var choice = {},
      i;
  if (actions[actions.length - 1].total) {
    choice.total = actions[actions.length - 1].total * 1.0; // to float
    if (actions[actions.length - 1].action) {
      // will lead to an over 1 cutoff but no problem
      actions[actions.length - 1].chance = choice.total;
    } else {
      actions[actions.length - 1].action = ABF.skip;
    }
  } else {
    choice.total = 0.0;
    for (i = 0; i < actions.length; i++) {
      choice.total += actions[i].chance;
    }
  }
  if (options && options.bind) {
    for (i = 0; i < actions.length; i++) {
      actions[i].action = ABF.bind(options.bind, actions[i].action);
    }
  }
  choice.actions = actions;
  choice = ABF.calculate_choice_cutoffs(choice);
  return choice;
};

ABF.calculate_choice_cutoffs = function(choice) {
  var fraction,
      cutoff = 0.0,
      i;
  for (i = 0; i < choice.actions.length; i++) {
    fraction = choice.actions[i].chance / choice.total;
    cutoff += fraction;
    choice.actions[i].cutoff = cutoff;
  }
  return choice;
};

ABF.choose_random_action = function(choice, boost, swap) {
  var roll;
  if (boost) {
    roll = Math.random() * (1.0 + boost[1]);
    if (roll >= 1) {
      return choice.actions[boost[0]].action();
    }
  } else {
    roll = Math.random();
  }
  for (var i = 0; i < choice.actions.length; i++) {
    if (roll < choice.actions[i].cutoff) {
      if (swap) {
        if (i === 0) { // If 0, and swap 0, still 0
          i = swap;
        } else if (i == swap) {
          i = 0;
        }
      }
      return choice.actions[i].action();
    }
  }
};

//ABF.fifty_fifty_flipper = true;

ABF.fifty_fifty = function() {
  if (Math.random() > 0.66) {
    return true;
  } else {
    return false;
  }
//  if (ABF.fifty_fifty_flipper) {
//    return (ABF.fifty_fifty_flipper = false);
//  } else {
//    return (ABF.fifty_fifty_flipper = true);
//  }
};

ABF.topic_choice = function(topics) {
  var actions = [],
      i;
  for (i = 0; i < topics; i++) {
    actions.push({
      chance: 1.0 / (i + 1),
//      chance: 1.0 / Math.pow((i + 1), 1.25),
      action: ABF.arg_returning_function(i) });
  }
  return ABF.prepare_choice(actions);
};

ABF.topic_colors = function(topics) {
  var topic_colors = [],
      topic_multiplier,
      wheel_part_part = [],
      wheel_part = null,
      i;
  if (topics < 8) {
    topic_multiplier = 1.0;
  } else {
    topic_multiplier = topics / 8.0;
  }
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

function normal_rand() { // standard normal distribution numbers using Box-Muller transformation
  var x = 0, y = 0, rds, c;

  // Get two random numbers from -1 to 1
  // If the radius is zero or greater than 1, throw them out and pick two new ones
  // Throws away about 20% of the pairs
  do {
    x = Math.random()*2-1;
    y = Math.random()*2-1;
    rds = x*x + y*y;
  } while (rds === 0 || rds > 1);

  // This is the Box-Muller Transform
  c = Math.sqrt(-2*Math.log(rds)/rds);

  // It always creates a pair of numbers
  return [x*c, y*c];
}
