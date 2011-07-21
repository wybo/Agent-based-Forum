// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

/// Settings
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.MODES = {random: 0, threaded: 1, subthreaded: 2, ordered: 3};
ABF.PLOTS = {unique_posters: 0, users: 1, arrivals_leavers: 2, posts: 3, threads: 4, topics: 5};

ABF.DEFAULT_OPTIONS = {};

// Initialization
//ABF.DEFAULT_OPTIONS.initial_actors = 3;
ABF.DEFAULT_OPTIONS.initial_actors = 100;
//ABF.DEFAULT_OPTIONS.initial_threads = 20; // Seed threads
ABF.DEFAULT_OPTIONS.initial_threads = 20; // Seed threads
ABF.DEFAULT_OPTIONS.max_threads = 20; // threads dropped after this
ABF.DEFAULT_OPTIONS.mode = ABF.MODES.ordered;

// Chances 
ABF.DEFAULT_OPTIONS.reply_chance = 25; // out of a thousand, per tick, 1 / 40.0 space * 1000
ABF.DEFAULT_OPTIONS.next_thread_chance = 20; // out of a thousand, per tick, 1 / 100.0 * 1000
ABF.DEFAULT_OPTIONS.new_thread_chance = 1.25; // out of a thousand, per tick, 1 / 20.0 / 40.0 * 1000
ABF.DEFAULT_OPTIONS.daily_arrivals_fraction = 0.075; // 0.05 // Fraction of current arriving every day
ABF.DEFAULT_OPTIONS.desire_for_online_divider = 4.0; // > roll, current_desire divided by this, 15 / (1 / 240.0 * 1000) = 3.6
// 240 ticks is a day, so slightly less often than once a day with avg starting desire

// Costs and rewards
// current desire
ABF.DEFAULT_OPTIONS.c_d_max_starting = 30; // Actors receive this + c_d_leave_cutoff
// also is max carry over of current (not counting next desire (see below))
ABF.DEFAULT_OPTIONS.c_d_leave_cutoff = 5;
ABF.DEFAULT_OPTIONS.c_d_read = -1;
ABF.DEFAULT_OPTIONS.c_d_create = -2.5; // -2
ABF.DEFAULT_OPTIONS.c_d_page_load = -0.2;
ABF.DEFAULT_OPTIONS.c_d_nothing_left = -10; // Substracted from any remaining that is carried over
// next
ABF.DEFAULT_OPTIONS.n_d_on_topic = 1.6; // 2.3
ABF.DEFAULT_OPTIONS.n_d_off_topic = 0.5; // -0.5
ABF.DEFAULT_OPTIONS.n_d_received_reply = 17.5; // Also see r_d_received_reply
// reply
ABF.DEFAULT_OPTIONS.r_d_received_reply = 17.5; 
ABF.DEFAULT_OPTIONS.r_d_drop_off = -0.58; // Based on data, maybe make multiplier

// Thresholds
ABF.DEFAULT_OPTIONS.with_thresholds = true;
ABF.DEFAULT_OPTIONS.threshold_average = 25;
ABF.DEFAULT_OPTIONS.threshold_standard_deviation = 15;
ABF.DEFAULT_OPTIONS.daily_arrivals = 10;
if (ABF.DEFAULT_OPTIONS.with_thresholds) { // No initial actors in thresholds mode
  ABF.DEFAULT_OPTIONS.initial_actors = 0;
  ABF.DEFAULT_OPTIONS.daily_arrivals_fraction = 0;
}

// Normally not changed
ABF.DEFAULT_OPTIONS.direction = ABF.DIRECTIONS.newold; // new threads shown first
ABF.DEFAULT_OPTIONS.topics = 8; // Number of topics (8, 16 or 24)
ABF.DEFAULT_OPTIONS.topic_power = 2; // x ** i, for each power

// Layout
ABF.SELECTED_PLOT = ABF.PLOTS.users;
ABF.SPACING = 70;
ABF.NO_BARS = false;
ABF.SCL = 1; // Scale, 1 is normal
ABF.TOPIC_ACTIONS = ABF.topic_actions(ABF.DEFAULT_OPTIONS.topics);
ABF.TOPIC_COLORS = ABF.topic_colors(ABF.DEFAULT_OPTIONS.topics);
ABF.DEBUG = true; // True if debugging
///
