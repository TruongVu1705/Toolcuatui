fetch('https://vkrdownloader.vercel.app/server?vkr=https://www.instagram.com/reel/Db_MVAcThN9/')
    .then(r=>r.json())
    .then(d=>console.log(JSON.stringify(d, null, 2)))
    .catch(e=>console.log('Error', e.message));
