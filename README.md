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

### Requirements

- **CLOUDFLARE**: SSL Certificates are autogenerated using cloudflare as DNS provider.

- Be sure to fill the cloudflare credentials.

    ```md
    CLOUDFLARE_EMAIL=
    CLOUDFLARE_API_KEY=
    ```

- **SET THE PRODUCTION CADDYFILE** Be sure the to set the production Caddyfile

    ```md
    CADDY_FILE=./caddyfiles/Caddyfile
    ```

- **CONFIGURE THE GUI DOMAIN** Be sure to configure the production template for Caddyfile:

    ```js
    //caddyfiles/CaddyfileTemplate
    (wildcard_cert) {
        tls {
            dns cloudflare
            wildcard
        }
    }

    https://caddynode.mydomain.com {
    proxy  / caddynode:3000
    basicauth / root {%CADDY_NODE_ROOT_PWD%}
    }
    ```

- **SET A BASE PATH FOR THE ROOT DIRECTIVE** If you plan to have websites in a physical directory, complete the follow variable:

    ```md
    CADDY_DOCKER_ROOT=/my-sites
    ```

- **SHOW DOCKER HOST IP IN THE GUI** If you plan to proxy to the docker host, you can set the gateway variable so the IP is listed in the GUI.

    ```js
    docker networks inspect docker-proxy
    //search for the gateway ip
    ```

    And set the ip here

    ```md
    CADDY_DOCKER_GATEWAY=
    ```
- **PROXY TO A RUNNIG DOCKER CONTAINER IN THE SAME HOST**

    You need to expose the targeted container so its accesible in the host ip. Then, you can proxy to it indicating the gateway ip or the host public ip.


- **DISABLE the testing certificate authority's ACME server directory** In localhost we use a test server for certificates but in production caddy process should hit the real server. Edit .env as follow:

    ````md
    CADDY_DOCKER_EXTRA=-root=/apps
    ````

### VARIABLES

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
    If your site is located at /sites/mysite/public_html
    This variable can be set to /sites
    And the root directive for your site will be just: mysite/public_html
    
    - caddynode will render something like:
    root /apps/mysite
    - caddy docker container will mount /sites into /apps

#### CADDY_NODE_SSH_HOST

All SSH variables are required to restart caddy in the host machine from inside a container.

#### CADDY_DOCKER_EXTRA

You can supply one extra argument to caddy.
For example, check the example variable "CADDY_DOCKER_EXTRA_EXAMPLE_ONE", who sets a testing url for tsl to avoid Let's Encrypt during development.

## Known Issues

- If caddy fails to start and you are using the GUI though caddynode.local (localhost mode), domain will be down and you need to access via localhost:3000 (default por for the GUI).
- The GUI doesn't provide feedback after changes are saved.

## Roadmap

- redir directive
- has www flag

## Credits

misitioba.com
