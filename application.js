experiment = [];

MODE_STRINGS = ["Random (no threads)", "Threads (flat threads)", "Subthreads (indented)",
    "Ratings and subthreads (ordered)"];
PLOT_STRINGS = ["Daily unique posters", "Users over time", "Daily arrivals and leavers", "Posts over time",
    "Threads over time", "Users for each topic"];
CONFIGURABLES = ["initial_actors", "initial_threads", "reply_chance", "new_thread_chance",
    "daily_arrivals_fraction", "c_d_read", "c_d_create", "c_d_page_load", "c_d_received_reply",
    "n_d_on_topic", "n_d_off_topic", "r_d_received_reply"];

setup_forum_gui = function(forum, space, plot_space, start) {
  forum.initialize_display(space, plot_space);
  var start_value = 'Start simulation';
  var pause_value = 'Pause simulation';
  $(start).val(start_value);
  $(start).click(function() {
    if ($(this).val() == start_value) {
      $(this).val(pause_value);
    } else {
      $(this).val(start_value);
    }
    forum.toggleRun();
  });
};

_display_note = function(div, config) {
  div2 = $('<div>').css({'float' : 'left', 'clear' : 'left'}).attr('id', 'note_space');
  $(div).append(div2);
  div2.html('Plots in order: ' + PLOT_STRINGS.join(', ') + '<br /><br />' + 
      'Note with experiment: ' + config.note);
};

_display_costs_benefits = function(div, config) {
  div2 = $('<div>').css({'float' : 'left', 'clear' : 'left'}).attr('id', 'costs_benefits_space');
  $(div).append(div2);
  div2.html('<p>' +  
    '<br /><i>Configuration</i><br /><br />' +
    'Current<br />' +
    'c_d_max_starting = ' + config.c_d_max_starting + '<br />' +
    'c_d_read = ' + config.c_d_read + '<br />' +
    'c_d_create = ' + config.c_d_create + '<br />' +
    'c_d_page_load = ' + config.c_d_page_load + '<br />' +
    'c_d_received_reply = ' + config.c_d_received_reply + '<br />' +
    'c_d_leave_cutoff = ' + config.c_d_leave_cutoff + '<br />' +
    'c_d_nothing_left_fraction = ' + config.c_d_nothing_left_fraction + '<br />' +
    'Next<br />' +
    'n_d_on_topic = ' + config.n_d_on_topic + '<br />' +
    'n_d_off_topic = ' + config.n_d_off_topic + '<br />' +
    'Reply<br />' +
    'r_d_received_reply = ' + config.r_d_received_reply + '<br />' +
    'r_d_drop_off = ' + config.r_d_drop_off + '<br />' +
    '<br /><i>Switches</i><br /><br />' +
    'with_thresholds = ' + config.with_thresholds + '<br />' +
    'threshold_average = ' + config.threshold_average + '<br />' +
    'threshold_standard_deviation = ' + config.threshold_standard_deviation + '<br />' +
    'threshold_daily_arrivals = ' + config.daily_arrivals + '<br />' +
    'disable_reply_bonus = ' + config.disable_reply_bonus + '<br />' +
    'disable_reciprocity = ' + config.disable_reciprocity + '<br />' +
    '<br /><i>Old</i><br /><br />' +
    'c_d_skim = ' + config.c_d_skim + '<br />' +
    'c_d_nothing_left = ' + config.c_d_nothing_left + '<br />' +
    'c_d_offline_cutoff = ' + config.c_d_offline_cutoff + '<br />' +
    'n_d_skim_compensation = ' + config.n_d_skim_compensation + '<br />' +
    'n_d_received_reply = ' + config.n_d_received_reply + '<br />' +
        '</p>');
};

_display_config = function(div, config) {
  div.html('<p>Mode: ' + MODE_STRINGS[config.mode] + ', Initial: ' + config.initial_actors +
      ', -threads: ' + config.initial_threads + ', Max threads: ' + config.max_threads + 
      ', Daily arrivals: ' + (config.with_thresholds ? config.daily_arrivals : config.daily_arrivals_fraction) + 
      ', Chance-reply: ' + config.reply_chance + ', -new-thread: ' + config.new_thread_chance + '</p>');
};

set_experiment = function(selector) {
  var key = selector.selectedIndex;
  fetch_and_plot_experiment(key);
};

// rather than $.getScript, to circumvent Chrome local origin issue
fetch_and_plot_experiment = function(key) {
  var old,
      head,
      script;
  old = document.getElementById('uploadScript');  
  if (old !== null) {  
    old.parentNode.removeChild(old);  
  } 
  head = document.getElementsByTagName("head")[0]; 
  script = document.createElement('script');
  script.id = 'uploadScript';
  script.type = 'text/javascript';
  script.onload = plot_experiment; 
  script.src = 'runs/' + experiments[key];
  head.appendChild(script);  
};

plot_experiment = function() {
  var i;
  div = $("#content");
  div.html('');
  _display_note(div, experiment[0].config);
  for(i = 0; i < experiment.length; i++) {
    plot_test(experiment[i], i);
  }
  _display_costs_benefits(div, experiment[0].config);
};

plot_test = function(test, index) {
  var keys = ["unique_posters", "users", "arrivals_leavers", "posts", "threads", "topics"],
      k,
      div,
      space,
      options = {
          series: { shadowSize: 0 }, // drawing is faster without shadows
          xaxis: { show: false }
      };
  div = $("#content");
  div2 = $('<div>').css({'float' : 'left', 'clear' : 'left'});
  div.append(div2);
  _display_config(div2, test.config);
  if (test.config.with_thresholds) {
    div2.append('<p>Time until critical mass: ' + test.data.critical_mass_days +
        ', achieved in fraction of cases: ' + test.data.critical_mass_reached_fraction + '</p>');
  }
  div2 = $('<div>').css({'float' : 'left', 'clear' : 'left'});
  div.append(div2);
  for (i = 0; i < keys.length; i++) {
    if (test.data[keys[i]]) {
      space = $('<div>').css({'width' : '300px', 'height' : '160px', 'float' : 'left', 'margin-right' : '0.7em',
          'margin-bottom' : '1em'});
      div2.append(space);
      $.plot(space, test.data[keys[i]], options);
    }
  }
};

setup_dropdown = function(option_select, options, default_option) {
  for (var i = 0; i < options.length; i++) {
    $(option_select).append(
        '<option value="' + i + '"' + (default_option == i ? ' selected="selected"' : '') + '>' + 
        options[i] + '</option>');
  }
};

draw_config_fields = function(space, forum, settings) {
  var div,
      pass_to,
      i;
  div = $(space);
  div.html('');
  for (i = 0; i < settings.length; i++) {
    div.append(
        '<input value="' + forum.options[settings[i]] + '" name="' + settings[i] + '"' +
        ' type="text" style="width: 3em;"/> ' + settings[i] + '<br />');
  }
  pass_to = '\'' + space + '\', forum, [\'' + settings.join('\',\'') + '\']';
  div.append('<p>' +
      '<input type="button" id="set_config" value="Apply configuration" onclick="apply_config_fields(' +
      pass_to + ');"/>' +
      '<input type="button" value="Restore" onclick="forum.restore_and_restart(); draw_config_fields(\'' + 
      pass_to + ');" />' +
      '</p>');

};

apply_config_fields = function(space, forum, settings) {
  var options,
      value_string,
      i;
  options = {};
  for (i = 0; i < settings.length; i++) {
    value_string = $(space + ' ' + 'input[name=' + settings[i] + ']').val();
    if (value_string.match(/\./i)) {
      options[settings[i]] = parseFloat(value_string);
    } else {
      options[settings[i]] = parseInt(value_string, 10);
    }
  }
  forum.set_options(options);
  draw_config_fields(space, forum, settings);
};
