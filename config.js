// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

/// Settings
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.MODES = {random: 0, threaded: 1, subthreaded: 2};
ABF.PLOTS = {users: 0, arrivals_leavers: 1, posts: 2, threads: 3};

ABF.DEFAULT_OPTIONS = {};
ABF.DEFAULT_OPTIONS.initial_actors = 100;
ABF.DEFAULT_OPTIONS.initial_threads = 10; // Seed threads
ABF.DEFAULT_OPTIONS.direction = ABF.DIRECTIONS.newold; // new threads shown first
ABF.DEFAULT_OPTIONS.mode = ABF.MODES.subthreaded;
ABF.DEFAULT_OPTIONS.max_threads = 40; // threads dropped after this
ABF.DEFAULT_OPTIONS.topics = 8; // Number of topics (8, 16 or 24)
ABF.DEFAULT_OPTIONS.daily_arrivals_fraction = 0.15; // Fraction of current arriving every day

// Layout
ABF.SELECTED_PLOT = ABF.PLOTS.users;
ABF.SPACING = 70;
ABF.NO_BARS = false;
ABF.SCL = 1; // Scale, 1 is normal
ABF.TOPIC_ACTIONS = ABF.topic_actions(ABF.DEFAULT_OPTIONS.topics);
ABF.TOPIC_COLORS = ABF.topic_colors(ABF.DEFAULT_OPTIONS.topics);
///
