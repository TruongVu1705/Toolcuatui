async function testCobaltV11() {
    try {
        const response = await fetch("https://api.cobalt.tools/", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: "https://www.youtube.com/watch?v=iFNTUO6-Pbw",
                vQuality: "1080"
            })
        });
        const text = await response.text();
        console.log("Cobalt V11 Response:", response.status, text);
    } catch (e) {
        console.error("Error:", e);
    }
}
testCobaltV11();
