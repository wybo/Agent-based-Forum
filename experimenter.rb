#!/usr/bin/ruby
require 'config.rb'

if ARGV[0] == "data"
  full_data = true
else
  full_data = false
end

if full_data
  runner = "experimenter_data.js"
else
  runner = "experimenter.js"
end

experiment = `#{JS_SHELL} #{runner} #{JS_SHELL_OPTIONS}`

experiment.gsub!("\n","")

if !full_data
  list = Dir.glob("runs/*")
  list.reject! {|f| f =~ /experiments/}
  list.each {|f| f.gsub!(/runs\//, "")}
  list.sort!

  new_experiment_file = "experiment." + Time.now.to_i.to_s + ".nr-" + (list.size + 1).to_s + ".js"

  open("runs/" + new_experiment_file, "w") { |file|
        file.write("experiment = eval('(" + experiment + ")');")
      }

  list.push(new_experiment_file)
  open("runs/experiments.js", "w") { |file|
        file.write("experiments = eval('([\"" + list.join('", "') + "\"])');")
      }
else
  new_experiment_file = "experiment." + Time.now.to_i.to_s + ".json"

  open("data/json/" + new_experiment_file, "w") { |file|
        file.write(experiment);
      }
end
