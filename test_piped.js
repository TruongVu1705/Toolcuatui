async function testPiped() {
    try {
        const response = await fetch("https://pipedapi.kavin.rocks/streams/iFNTUO6-Pbw");
        const data = await response.json();
        console.log("Title:", data.title);
        console.log("Duration:", data.duration);
        console.log("Has Video Streams:", data.videoStreams.length > 0);
        console.log("Stream 0 URL:", data.videoStreams[0].url.substring(0, 50) + "...");
    } catch (e) {
        console.error("Error:", e);
    }
}
testPiped();
