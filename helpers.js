// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html
//
// See Actors construct.prototype.run (halfway down) for the core logic

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
      actions[i].action = actions[i].action.bind(options.bind);
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
        if (i == 1) {
          i = options.swap;
        } else if (i == options.swap) {
          i = 1;
        }
      }
      return actions.actions[i].action();
    }
  }
};

// Functions for use in chances

ABF.arg_returning_function = function(arg) {
  return function () {
    return arg;
  };
};

ABF.skip = function() {};
