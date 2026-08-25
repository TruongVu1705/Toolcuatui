async function testCobaltPublic() {
    const instances = [
        "https://cobalt.q-n-d.de/api/json",
        "https://cobalt-api.kwiatektv.com/api/json",
        "https://api.cobalt.tools"
    ];
    for (const url of instances) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin': 'https://cobalt.tools',
                    'Referer': 'https://cobalt.tools/'
                },
                body: JSON.stringify({
                    url: "https://www.youtube.com/watch?v=iFNTUO6-Pbw",
                    vQuality: "1080"
                })
            });
            const text = await response.text();
            console.log(`[${url}] Status:`, response.status, text.substring(0, 100));
        } catch (e) {
            console.log(`[${url}] Error:`, e.message);
        }
    }
}
testCobaltPublic();
