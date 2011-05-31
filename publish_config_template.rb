# Set command to publish to your server
# (and rename file to publish_config.rb)

# For example the following rsync command
publish_command = "rsync -a --delete --exclude '.git' . username@your-sever.com:/var/www/pub/agent-based-forum"
