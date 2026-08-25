const urls = [
    "https://api.cobalt.tools",
    "https://co.wuk.sh/api/json",
    "https://cobalt.pkxd.xyz/api/json",
    "https://cobalt.api.zluo.cc/api/json"
];
async function test() {
    for (let u of urls) {
        try {
            const r = await fetch(u, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': 'https://cobalt.tools',
                    'Referer': 'https://cobalt.tools/'
                },
                body: JSON.stringify({url: 'https://www.instagram.com/reel/Db_MVAcThN9/'})
            });
            console.log(u, r.status, await r.text().then(t => t.substring(0, 100)));
        } catch(e) { console.log(u, 'FAILED'); }
    }
}
test();
