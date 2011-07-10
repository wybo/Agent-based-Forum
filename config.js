// Copyright: (c) 2011 Wybo Wiersma <mail@wybowiersma.net>
//
// Available under the Affero GPL v3, http://www.gnu.org/licenses/agpl.html

/// Settings
ABF.DIRECTIONS = {oldnew: 0, newold: 1};
ABF.MODES = {random: 0, threaded: 1, subthreaded: 2, ordered: 3};
ABF.PLOTS = {unique_posters: 0, users: 1, arrivals_leavers: 2, posts: 3, threads: 4};

ABF.DEFAULT_OPTIONS = {};

// Initialization
ABF.DEFAULT_OPTIONS.initial_actors = 100;
ABF.DEFAULT_OPTIONS.initial_threads = 40; // Seed threads
ABF.DEFAULT_OPTIONS.max_threads = 40; // threads dropped after this
ABF.DEFAULT_OPTIONS.mode = ABF.MODES.ordered;

// Chances
ABF.DEFAULT_OPTIONS.reply_chance = 25; // out of a thousand, per tick, 1 / 40.0 space * 1000
ABF.DEFAULT_OPTIONS.next_thread_chance = 20; // out of a thousand, per tick, 1 / 50.0 * 1000
ABF.DEFAULT_OPTIONS.new_thread_chance = 1.25; // out of a thousand, per tick, 1 / 20.0 / 40.0 * 1000
ABF.DEFAULT_OPTIONS.daily_arrivals_fraction = 0.05; // Fraction of current arriving every day

// Costs and rewards
// current desire
ABF.DEFAULT_OPTIONS.c_d_read = -1;
ABF.DEFAULT_OPTIONS.c_d_create = -2;
ABF.DEFAULT_OPTIONS.c_d_page_load = -0.2;
ABF.DEFAULT_OPTIONS.c_d_skim = -0.1;
ABF.DEFAULT_OPTIONS.c_d_received_reply_bonus = 10; // Also see received_reply_reply_desire
ABF.DEFAULT_OPTIONS.c_d_current_carry_over = 25; // Max current desire carried over to next when offline
ABF.DEFAULT_OPTIONS.c_d_leave_cutoff = 2;
ABF.DEFAULT_OPTIONS.c_d_offline_cutoff = 0;
// next
ABF.DEFAULT_OPTIONS.n_d_on_topic = 2.0;
ABF.DEFAULT_OPTIONS.n_d_off_topic = 0.5;
ABF.DEFAULT_OPTIONS.n_d_skim_compensation = 0.2;
// reply
ABF.DEFAULT_OPTIONS.r_d_received_reply = 50;
ABF.DEFAULT_OPTIONS.r_d_drop_off = 5;

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
