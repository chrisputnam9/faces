# Faces App

Faces (faces.onl) helps you manage your contacts and learn their names.

[Read More Here](https://faces.dev/about)

[Or, Jump Right In](https://faces.onl/)

# Development

## Full Local Development Setup
 1. Install [Node](https://nodejs.org/en/)
 1. Install [Caddy](https://caddyserver.com/)
 1. Install [mkcert](https://github.com/FiloSottile/mkcert)
 1. Add line to hosts file
    `127.0.0.1 faces.dev`
 1. Run `mkcert -install` to set up local CA
 1. Go to dev/ssl - eg. `cd dev/ssl`
 1. Run `mkcert -cert-file faces.dev.pem -key-file faces.dev-key.pem faces.dev localhost`
 1. Copy .env.sample to .env.local and fill in details as needed
    - Go to [Google Dev Console](https://console.cloud.google.com/apis/credentials)
    - Create a new Google Drive API project for yourself - "Faces DEV" to use in development - keep the API key secret, fill in details in .env.local file
 1. Run `npm install`
 1. Follow the Development Workflow steps below

### Optional
 1. Set up your text editor. [Steps for vim](https://codechips.me/vim-setup-for-svelte-development/)

## Development Workflow
Note: alternatively, use start.sh

 1. `npm run dev` in one terminal tab or screen buffer
 1. `caddy run` in another terminal tab or screen buffer
 1. Visit https://faces.dev in browser
