#!/usr/bin/ruby
require 'open-uri'

def systemp(command)
  puts command
  system command
end

def highlight_file(file_name, important_parts)
  systemp "vim #{file_name} -c 'set nonumber | runtime! syntax/2html.vim | wq | q'"
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

def run
  if File.file?("config.rb")
    require 'config.rb'
  else
    systemp "rm *.js.html"
    const_set("PUBLISH_COMMAND", nil)
  end

  systemp "git commit -a"
  systemp "git push"

  files = Dir.glob("*.js")
  files.delete("jquery.js")
  files.delete("include.js")
  files.delete("application.js")
  files.delete("experimenter.js")
  files.delete("experimenter_data.js")
  files.delete("agent_based_forum.js")
  files.push(files.delete("forum.js")) # last
  app_files = files.dup
  files.push("agent_based_forum.js") # last
  important_parts = []
  files.each do |file_name|
    highlight_file(file_name, important_parts)
  end

  if PUBLISH_COMMAND
    systemp "mv agent_based_forum.js agent_based_forum.original.js"
    systemp "echo 'ABF = {};\n' > agent_based_forum.js"
    app_files.each do |app_file|
      systemp "cat #{app_file} >> agent_based_forum.js"
    end
    systemp PUBLISH_COMMAND
    systemp "rm *.js.html"
    systemp "mv agent_based_forum.original.js agent_based_forum.js"
  end
end

run()
