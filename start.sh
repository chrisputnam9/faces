#!/bin/bash

echo -ne \\ek"srv"\\e\\\\

. "$HOME/.nvm/nvm.sh"
nvm use --lts

# Test static build
if [ "$1" != "--static" ]; then
	echo "Running in dev mode..."
	npm run dev
	exit 0
fi

echo "Building..."
npm run build

echo "Testing static build..."
npx http-server build
