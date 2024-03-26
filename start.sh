#!/bin/bash

set_title srv

. "$HOME/.nvm/nvm.sh"

nvm use --lts
npm run dev
