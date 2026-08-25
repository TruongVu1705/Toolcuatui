const https = require('https');

https.get('https://raw.githubusercontent.com/imputnet/cobalt/current/docs/instances.json', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        try {
            const list = JSON.parse(d);
            const apis = list.map(i => i.api);
            console.log(apis);
        } catch(e) {
            console.log('Error parsing', e.message);
        }
    });
});
