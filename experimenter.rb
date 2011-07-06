#!/usr/bin/ruby
require 'config.rb'

experiment = `#{JS_SHELL} experimenter.js #{JS_SHELL_OPTIONS}`

experiment.gsub!("\n","")

list = Dir.glob("runs/*")
list.reject! {|f| f =~ /experiments/}
list.each {|f| f.gsub!(/runs\//, "")}

new_experiment_file = "experiment." + Time.now.to_i.to_s + ".nr-" + (list.size + 1).to_s + ".js"
open("runs/" + new_experiment_file, "w") { |file|
      file.write("experiment = eval('(" + experiment + ")');")
    }

list.push(new_experiment_file)
open("runs/experiments.js", "w") { |file|
      file.write("experiments = eval('([\"" + list.join('", "') + "\"])');")
    }
