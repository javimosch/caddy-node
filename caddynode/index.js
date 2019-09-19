require('dotenv').config({ silent: true })
const express = require('express')
const server = express()
const bodyParser = require('body-parser')
const sequential = require('promise-sequential')

const caddy = require('./caddy')
server.use(
    bodyParser.json({
        limit: '50mb'
    })
)

// server.get('/', (req, res) => res.send('OK'))
server.use(
    '/',
    express.static(require('path').join(process.cwd(), 'public_html'))
)

const funql = require('funql-api')
funql.middleware(server, {
    api: {
        async getSites() {
            return await caddy.getSites()
        },
        async saveSites(sites) {
            await sequential(
                sites.map(site => {
                    return () =>
                        caddy.addSite({
                            domain: site.domain,
                            https: site.https,
                            root: site.root,
                            identifier: site.identifier
                        })
                })
            )
            await caddy.writeCaddyfile()
            return true
        }
    }
})

server.listen(3000, async() => {
    console.log('Ready at 3000')

    await caddy.addSite({
        identifier: 'montech',
        https: false,
        domain: 'montech.com',
        root: `montpesites/apps/montech/public_html`
    })
    await caddy.addSite({
        identifier: 'arancibiajav',
        https: false,
        domain: 'arancibiajav.misitioba.com',
        root: `montpesites/apps/arancibiajav/public_html`
    })
    setTimeout(async() => {
        // await caddy.writeCaddyfile()
    }, 10000)
})