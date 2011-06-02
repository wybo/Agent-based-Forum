#!/usr/bin/ruby
require 'open-uri'

if File.file?("publish_config.rb")
  require 'publish_config.rb'
else
  system "rm *.js.html"
end
PUBLISH_COMMAND ||= nil

system "git commit -a"
system "git push"

system "tar -czf trunk.tgz *"
files = Dir.glob("*.js")
files.delete("jquery.js")
files.delete("include.js")
files.push(files.delete("agent_based_forum.js")) # last
important_parts = []
files.each do |file_name|
  system "vim #{file_name} -c 'runtime! syntax/2html.vim | wq | q'"
  lines = open("#{file_name}.html").readlines
  open_div = false
  open_for = 0
  line_number = 0
  lines.each do |line|
    line.gsub!("#ffff00", "#bbbb00")
    line.gsub!("#00ffff", "#00bbbb")
    line.gsub!(/include\(([^']*)'([^']*)'/, "include(\\1'<a href=\"\\2.html\">\\2</a>'")
    if line =~ /\/\/\//
      if !open_div
        if file_name == "agent_based_forum.js"
          line.gsub!(/^(.*?)\/\/\/(.*)\n/, "\\1//\\2\n<br />#{important_parts.join()}")
        else
          important_parts << line.gsub(/^(.*?)\/\/\/(.*)<br>\n/, "<div style=\"background-color: #DDDDFF;\">" + 
              "<br />\n\\1&nbsp;&nbsp;//\\2" + 
              "<div style=\"padding-right: 2em; float: right;\"><font color=\"#DDDDFF\">//</font>" +
              "<a href=\"#{file_name}.html#anchor#{line_number}\">#{file_name}, line #{line_number}</a></div><br />\n")
          line.gsub!(/^(.*?)\/\/\//, "<div style=\"background-color: #DDDDFF;\"><a name=\"anchor#{line_number}\"></a><br />\n\\1//")
          open_div = true
          open_for = 0
        end
      else
        line.gsub!("///", "</div>")
        important_parts << line
        open_div = false
      end
    end
    if open_div
      if open_for > 0
        important_parts << "<font color=\"#8080ff\">//</font>" + line
      end
      open_for += 1
    end
    line_number += 1
  end
  open("#{file_name}.html", "w") { |file| file.write(lines.join()) }
end
if PUBLISH_COMMAND
  system PUBLISH_COMMAND
  system "rm *.js.html"
end
system "rm *.tgz"
