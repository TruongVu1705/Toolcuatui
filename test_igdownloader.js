async function test() {
    const fd = new FormData();
    fd.append('q', 'https://www.instagram.com/reel/Db_MVAcThN9/');
    fd.append('t', 'media');
    fd.append('lang', 'en');

    try {
        const res = await fetch('https://v3.igdownloader.app/api/ajaxSearch', {
            method: 'POST',
            body: fd
        });
        const d = await res.json();
        console.log(JSON.stringify(d, null, 2));
    } catch(e) { console.log(e.message) }
}
test();
