#!/bin/bash

apache_was_running=false

function main {
	echo -ne \\ek"srv"\\e\\\\

	stop_apache_if_running

	start_caddy

	# Set up NVM
	# shellcheck disable=SC1091
	source "$HOME/.nvm/nvm.sh"
	nvm use --lts

	clear
	# Test static build or run in dev mode?
	if [ "$1" != "--static" ]; then
		echo "Running NPM in dev mode..."
		npm run dev
		exit 0
	else
		echo "Building static app..."
		npm run build
		echo "Running server for static build..."
		npx http-server build --port 5173
	fi

	stop_caddy

	start_apache_if_was_running

	clear
	echo "Teardown complete"
}

function stop_apache_if_running {

	# Do we have systemctl? Eg. linux env
	if [ -n "$(command -v systemctl)" ]; then
		# See if Apache service exists
		apache_service="$(systemctl status apache2 | grep Active)"
		if [ -n "$apache_service" ]; then
			# See if Apache service is running
			if [[ "$apache_service" != *"inactive"* ]]; then
				apache_was_running=true
			fi
		fi
	fi

	if $apache_was_running; then
		clear
		echo "Stopping Apache for you..."
		if [ -n "$(command -v sudo)" ]; then
			sudo systemctl stop apache2
		else
			systemctl stop apache2
		fi
	else
		echo "$apache_service"
	fi
}

function start_apache_if_was_running {
	if $apache_was_running; then
		clear
		echo "Starting Apache back up for you..."
		if [ -n "$(command -v sudo)" ]; then
			sudo systemctl start apache2
		else
			systemctl start apache2
		fi
	fi
}

function start_caddy {
	clear
	echo "Starting Caddy..."

	# Check if already running, stop if so in case of different project
	sudo caddy stop 2>/dev/null || true # Ignore if there's an error - might not be running

	sudo caddy start
}

function stop_caddy {
	# Stop Caddy
	clear
	echo "Stopping Caddy..."
	sudo caddy stop 2>/dev/null || true # Ignore if there's an error
}

main "$@"
