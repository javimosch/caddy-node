# caddy-node

Manage your caddy sites using a simple GUI

## Usage

- configure .env based on env-example
- docker-compose up

## How it works

There are two docker compose services, one for caddy and one for the gui, which is a nodejs application. When you manage your sites and save the changes, the nodejs app writes a config file (that can be exported/imported), writes the Caddyfile, and also ssh into the host machine to restart the caddy container.

## Credits

arancibiajav.misitioba.com

