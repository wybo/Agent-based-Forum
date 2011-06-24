#!/usr/bin/ruby
require 'config.rb'

experiment = `#{JS_SHELL} experimenter.js`

experiment.chomp!

#open("runs/experiment." + Time.now.to_i.to_s + ".js", "w") { |file|
open("runs/experiment.js", "w") { |file|
      file.write("var runs = eval('(" + experiment + ")');")
    }
