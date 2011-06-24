setup_forum_gui = function(forum, space, plot_space, start, order) {
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
  var o_start_value = 'Old threads first';
  var o_stop_value = 'New threads first';
  $(order).val(o_start_value);
  $(order).click(function() {
    if ($(this).val() == o_start_value) {
      $(this).val(o_stop_value);
    } else {
      $(this).val(o_start_value);
    }
    forum.toggleOrder();
  });
};

plot_runs = function(runs) {
  var i;
  for(i = 0; i < runs.length; i++) {
    plot_run(runs[i], i);
  }
}

plot_run = function(run, index) {
  var keys = [],
      k,
      div,
      space,
      options = {
          series: { shadowSize: 0 }, // drawing is faster without shadows
          xaxis: { show: false }
      };
  div = $('<div>').css({'float' : 'left', 'clear' : 'left'});
  $("#content").append(div);
  div.append('<p>Run: ' + index + ', Mode: ' + run.config.mode + 
      ', Initial actors: ' + run.config.initial_actors + ', Max threads: ' + run.config.max_threads + '</p>');
  for (k in run.data) {
    if (run.data.hasOwnProperty(k)) {
      keys.push(k);
    }
  }
  keys = keys.sort().reverse();
  for (i = 0; i < keys.length; i++) {
    space = $('<div>').css({'width' : '300px', 'height' : '160px', 'float' : 'left', 'margin-right' : '0.7em', 'margin-bottom' : '1em'});
    div.append(space);
    $.plot(space, run.data[keys[i]], options);
  }
};

setup_dropdown = function(option_select, options, default_option) {
  for (var i = 0; i < options.length; i++) {
    $(option_select).append(
      '<option value="' + i + (default_option == i ? " selected=\"selected\"" : "") + '">' + options[i] + '</option>');
  }
};
