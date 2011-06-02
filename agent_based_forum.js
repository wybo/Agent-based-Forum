// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

// Includes
$.include('helpers.js');
$.include('post.js');
$.include('forum_thread.js');
$.include('actor.js');
$.include('forum.js');

/// Important parts (excerpts)
// Settings

var ABF = {};
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.DEFAULT_DIRECTION = ABF.DIRECTIONS.newold; // New threads shown first
ABF.MODES = {flat: 0, threaded: 1};
ABF.DEFAULT_MODE = ABF.MODES.flat;

// Layout
ABF.NO_BARS = false;
ABF.SCL = 1; // Scale, 1 is normal

// Number of topics (8, 16 or 24)
ABF.TOPICS = 8;

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


