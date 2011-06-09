// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

/// Settings
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.DEFAULT_DIRECTION = ABF.DIRECTIONS.newold; // New threads shown first
ABF.MODES = {random: 0, threaded: 1, subthreaded: 2};
ABF.DEFAULT_MODE = ABF.MODES.subthreaded;
ABF.PLOTS = {users: 0, arrivals_leavers: 1, posts: 2, threads: 3};
ABF.DEFAULT_PLOT = ABF.PLOTS.users;
ABF.MAX_WIDTH = 1240; // threads dropped after this

// Layout
ABF.NO_BARS = false;
ABF.SCL = 1; // Scale, 1 is normal

// Number of topics (8, 16 or 24)
ABF.TOPICS = 8;
///

/// Topic actions
ABF.TOPIC_ACTIONS = [];
for (var i = 0; i < ABF.TOPICS; i++) {
  ABF.TOPIC_ACTIONS.push({
  chance: Math.pow(2, i),                                           
  action: ABF.arg_returning_function(ABF.TOPICS - i - 1) });
}
ABF.TOPIC_ACTIONS = ABF.prepare_actions(ABF.TOPIC_ACTIONS);
///

// Topic colors, all generated
if (ABF.TOPICS) {
  ABF.TOPIC_MULTIPLIER = ABF.TOPICS / 8.0;
  ABF.WHEEL_PART_PART = [];
  for (var i = 1; i <= ABF.TOPIC_MULTIPLIER; i++) {
    ABF.WHEEL_PART_PART.push(Math.ceil(255 / ABF.TOPIC_MULTIPLIER) * i);
  }
  for (var i = 1; i <= (2 * ABF.TOPIC_MULTIPLIER); i++) {
    ABF.WHEEL_PART_PART.push(255);
  }
  for (var i = 1; i <= ABF.TOPIC_MULTIPLIER; i++) {
    ABF.WHEEL_PART_PART.push(255 - Math.ceil(255 / ABF.TOPIC_MULTIPLIER) * i);
  }
  for (var i = 1; i <= (2 * ABF.TOPIC_MULTIPLIER); i++) {
    ABF.WHEEL_PART_PART.push(0);
  }
  ABF.WHEEL_PART = ABF.WHEEL_PART_PART.concat(ABF.WHEEL_PART_PART);
  ABF.TOPIC_COLORS = [];
  for (var i = 2 * ABF.TOPIC_MULTIPLIER; i < 8 * ABF.TOPIC_MULTIPLIER; i++) {
    ABF.TOPIC_COLORS.push('rgb(' + ABF.WHEEL_PART[i + 2 * ABF.TOPIC_MULTIPLIER] + 
        ', ' + ABF.WHEEL_PART[i] + 
        ', ' + ABF.WHEEL_PART[i - 2 * ABF.TOPIC_MULTIPLIER] + ')');
  }
}
