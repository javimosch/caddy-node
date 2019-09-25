export default {
    async funql(name, args = {}, transform = null, extraOptions = {}) {
        let payload = {
            name,
            args,

            ...extraOptions
        }
        if (transform) {
            payload.transform = transform.toString()
        }
        console.log('SEND', name, payload)
        let r = await fetch('/funql-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        r = await r.json()
        console.log('RES', name, r)
        return r
    }
}