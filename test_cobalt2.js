async function testCobaltV11() {
    try {
        const response = await fetch("https://api.cobalt.tools/api/json", { // Hoặc https://co.wuk.sh/api/json
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                url: "https://www.youtube.com/watch?v=iFNTUO6-Pbw",
                vQuality: "1080"
            })
        });
        const text = await response.text();
        console.log("Response:", response.status, text);
    } catch (e) {
        console.error("Error:", e);
    }
}

async function testWuk() {
    try {
        const response = await fetch("https://co.wuk.sh/api/json", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: JSON.stringify({
                url: "https://www.youtube.com/watch?v=iFNTUO6-Pbw",
                vQuality: "1080"
            })
        });
        const text = await response.text();
        console.log("Wuk Response:", response.status, text);
    } catch (e) {
        console.error("Error:", e);
    }
}
testWuk();
