## Command to publish to your server
# (and rename file to publish_config.rb)
#
# For example the following rsync command
PUBLISH_COMMAND = "rsync -a --delete --exclude '.git' . username@your-sever.com:/var/www/pub/agent-based-forum"

## Javascript shell for browser-less runs (faster)
#
# Such as Chrome's V8, http://code.google.com/p/v8/
JS_SHELL = "/home/username/v8/shell"
