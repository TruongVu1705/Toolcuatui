const instagramGetUrl = require('instagram-url-direct');

instagramGetUrl('https://www.instagram.com/reel/Db_MVAcThN9/').then(res => {
    console.log(JSON.stringify(res, null, 2));
}).catch(e => console.log('Error', e.message));
