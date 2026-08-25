const targetUrl = "https://www.youtube.com/watch?v=PXUZ6xcdx_g";

async function testCobalt() {
    try {
        const response = await fetch("https://api.cobalt.tools/api/json", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                url: targetUrl,
                vQuality: "1080",
                isAudioOnly: false,
                isNoTTWatermark: true,
            })
        });
        const text = await response.text();
        console.log("Cobalt Response:", response.status, text);
    } catch (e) {
        console.error("Error:", e);
    }
}

testCobalt();
