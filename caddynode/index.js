require('dotenv').config({ silent: true })
const sequential = require('promise-sequential')
const caddy = require('./caddy')
const express = require('express')
const app = express()
app.get('/foo', (req, res) => res.send('FOO!'))
require('montpesites/server')
    .start(app, {})
    .then(({ server }) => {
        app.funql.extends({
            api: {
                async getSites() {
                    return await caddy.getSites()
                },
                getDockerGateway() {
                    return process.env.CADDY_DOCKER_GATEWAY
                },
                isLocalhost() {
                    return process.env.CADDY_FILE.indexOf('Local') !== -1
                },
                async getCaddyNodeConfig() {
                    return await caddy.getLocalConfig()
                },
                async getCaddyLastLogs() {
                    return await caddy.getLastLogs()
                },
                async saveSites(sites) {
                    await caddy.clearSites()
                    await sequential(
                        sites.map(site => {
                            return () => caddy.addSite(site)
                        })
                    )
                    await caddy.writeCaddyfile()
                    return true
                }
            }
        })
    })