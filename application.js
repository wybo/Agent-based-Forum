experiment = [];

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

display_config = function(config_space, config) {
  _display_config($(config_space), config);
}

_display_config = function(div, config) {
  div.html('<p>Mode: ' + config.mode + ', Initial actors: ' + config.initial_actors +
      ', -threads: ' + config.initial_threads + ', Max threads: ' + config.max_threads + 
      ', Daily arrivals fraction: ' + config.daily_arrivals_fraction + '</p>');
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
  $("#content").html('');
  for(i = 0; i < experiment.length; i++) {
    plot_test(experiment[i], i);
  }
};

plot_test = function(test, index) {
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
  _display_config(div, test.config);
  for (k in test.data) {
    if (test.data.hasOwnProperty(k)) {
      keys.push(k);
    }
  }
  keys = keys.sort().reverse();
  for (i = 0; i < keys.length; i++) {
    space = $('<div>').css({'width' : '300px', 'height' : '160px', 'float' : 'left', 'margin-right' : '0.7em', 'margin-bottom' : '1em'});
    div.append(space);
    $.plot(space, test.data[keys[i]], options);
  }
};

setup_dropdown = function(option_select, options, default_option) {
  for (var i = 0; i < options.length; i++) {
    $(option_select).append(
      '<option value="' + i + '"' + (default_option == i ? ' selected="selected"' : '') + '>' + options[i] + '</option>');
  }
};
