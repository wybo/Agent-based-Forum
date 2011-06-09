setup_forum = function(forum, plot_space, start, order) {
  forum.initialize_plot(plot_space);
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

setup_dropdown = function(option_select, options, default_option) {
  for (var i = 0; i < options.length; i++) {
    $(option_select).append(
      '<option value="' + i + (default_option == i ? " selected=\"selected\"" : "") + '">' + options[i] + '</option>');
  }
};
