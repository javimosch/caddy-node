let sander = require('sander')
let path = require('path')
let configPath = path.join(process.cwd(), '.caddynode', 'config.json')
let caddyfileBasePath = path.join(process.cwd(), 'caddyfiles')

let ssh = getSSH()
let connected = false

module.exports = {
    async getLocalConfig() {
        let config = JSON.parse(
            (await sander.readFile(configPath)).toString('utf-8')
        )
        return config
    },
    async clearSites() {
        await sander.writeFile(configPath, JSON.stringify({}, null, 4))
    },
    async getLastLogs() {
        if (!connected) {
            await ssh.connect()
            connected = true
        }
        try {
            let logs = await ssh.exec(`docker logs caddy --tail 50`)
            return {
                result: logs
            }
        } catch (err) {
            return {
                result: err.toString()
            }
        }
    },
    async getSites() {
        await ensureConfigFile(configPath)
        let config = JSON.parse(
            (await sander.readFile(configPath)).toString('utf-8')
        )
        let sites = Object.keys(config).map(identifier => {
            return Object.assign({}, config[identifier], {
                identifier
            })
        })
        return sites
    },
    async addSite(options = {}) {
        await ensureConfigFile(configPath)
        let config = JSON.parse(
            (await sander.readFile(configPath)).toString('utf-8')
        )

        if (!options.identifier) {
            return
        }

        config[options.identifier] = config[options.identifier] || {}
        let site = config[options.identifier]

        if (options.https !== undefined) {
            site.https = options.https
        } else {
            site.https = true
        }

        Object.keys(options).forEach(key => {
            site[key] = options[key]
        })

        await sander.writeFile(configPath, JSON.stringify(config, null, 4))
    },
    async writeCaddyfile() {
        await ensureConfigFile(configPath)

        let currentCaddyfile = process.env.CADDY_FILE

        let isLocal = currentCaddyfile.indexOf('Local') !== -1

        let caddyfileTemplate = (await sander.readFile(
            path.join(caddyfileBasePath, `Caddyfile${isLocal ? 'Local' : ''}Template`)
        )).toString('utf-8')

        let config = JSON.parse(
            (await sander.readFile(configPath)).toString('utf-8')
        )

        let caddyfileRaw = `
    `
        Object.keys(config).forEach(siteName => {
            let site = config[siteName]
            if (!site.domain) return
            if (!site.root && !site.proxy) return
            if (site.domain.indexOf('.') === -1) return
            let domain = isLocal ?
                site.domain.substring(0, site.domain.lastIndexOf('.')) + '.local' :
                site.domain

            let proxyOrRoot = site.root ?
                `root ${path.join('/apps/', site.root)}` :
                `proxy / ${site.proxy}`
            if (isLocal) {
                site.wildcard_cert = false
            }
            let wildcard_cert = site.wildcard_cert ?
                `
    import wildcard_cert` :
                ''
            let tls =
                site.https && isLocal ?
                `
    tls self_signed` :
                ''
            let basic_auth = site.basic_auth ?
                `
    basicauth / root {%CADDY_NODE_ROOT_PWD%}` :
                ''
            caddyfileRaw += `
${site.https ? 'https' : 'http'}://${domain} {${wildcard_cert}
    ${proxyOrRoot}${tls}${basic_auth}
}
`
        })

        caddyfileRaw = caddyfileTemplate + caddyfileRaw

        // console.log('CAN WRITE', caddyfileRaw)
        await sander.writeFile(
            path.join(caddyfileBasePath, `Caddyfile${isLocal ? 'Local' : ''}`),
            caddyfileRaw
        )

        // console.log('DOCKER?', process.env.IS_DOCKER)
        // return
        let ssh = getSSH()
        await ssh.connect()
        console.log(await ssh.exec(`docker restart caddy`))
        await ssh.close()
    }
}

async function ensureConfigFile(configPath) {
    if (!(await sander.exists(path.join(process.cwd(), '.caddynode')))) {
        await sander.writeFile(configPath, JSON.stringify({}, null, 4))
    }
}

function getSSH() {
    var SSH2Promise = require('ssh2-promise')
    var sshconfig = {
        host: process.env.IS_DOCKER ?
            process.env.CADDY_DOCKER_GATEWAY :
            process.env.CADDY_NODE_SSH_HOST,
        username: process.env.CADDY_NODE_SSH_USER,
        identity: require('path').join(
            process.cwd(),
            process.env.CADDY_NODE_SSH_KEY
        )
    }
    var ssh = new SSH2Promise(sshconfig)
    return ssh
}