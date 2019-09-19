# caddy-node

Manage your caddy sites using a simple GUI

## Usage

- Configure .env based on env-example
- Create bridge.

      docker network create -d bridge caddy-proxy

- Inspect the bridge to retrieve the gateway ip.

      docker network inspect caddy-proxy
- Complete the variable CADDY_DOCKER_GATEWAY wit the gateway ip.
- Run docker-compose up.

### Compose Headless mode

    docker-compose up -d

## How it works

There are two docker compose services, one for caddy and one for the gui, which is a nodejs application. When you manage your sites and save the changes, the nodejs app writes a config file (that can be exported/imported), writes the Caddyfile, and also ssh into the host machine to restart the caddy container.

## Documentation

### Variables

#### CADDY_FILE

Very important. Possible values are:

- ./caddyfiles/CaddyfileLocal (development, localhost)
- ./caddyfiles/Caddyfile (production)

Note: If CaddyfileLocal is specified domains will be rendered as .local. You can optionally edit your /etc/hosts for redirection.

#### CLOUDFLARE_EMAIL

Required for https domains. Domain renewal and expiration notifications will arrive there.

#### CLOUDFLARE_API_KEY

Required for https domains

#### CADDY_DOCKER_ROOT

Prefix for caddy root directive. It will be mounted as volume. Should be a full path in the host machine.

    Example:
    If your site is at /sites/mysite
    This variable can be set to /sites
    And the root directive for your site will be just: mysite.
    caddynode will render something like:
    root /apps/mysite

#### CADDY_NODE_SSH_HOST

All SSH variables are required to restart caddy in the host machine from inside a container.

#### CADDY_DOCKER_EXTRA

You can supply one extra argument to caddy.
For example, check the example variable "CADDY_DOCKER_EXTRA_EXAMPLE_ONE", who sets a testing url for tsl to avoid Let's Encrypt during development.

## Known Issues

- If caddy fails to start and you are using the GUI though caddynode.local (localhost mode), domain will be down and you need to access via localhost:3000 (default por for the GUI).

## Credits

arancibiajav.misitioba.com
