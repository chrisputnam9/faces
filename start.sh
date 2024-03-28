#!/bin/bash

echo -ne \\ek"srv"\\e\\\\

. "$HOME/.nvm/nvm.sh"

nvm use --lts
npm run dev
