const puppeteer = require('puppeteer');

async function scrapeSnapInsta(igUrl) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://snapinsta.app/', { waitUntil: 'networkidle2' });
        
        await page.type('#url', igUrl);
        await page.click('#btn-submit');
        
        // Wait for download button to appear
        await page.waitForSelector('.download-bottom a', { timeout: 15000 });
        
        const downloadUrl = await page.$eval('.download-bottom a', el => el.href);
        console.log('Result:', downloadUrl);
    } catch(e) {
        console.log('Error:', e.message);
    } finally {
        await browser.close();
    }
}

scrapeSnapInsta('https://www.instagram.com/reel/Db_MVAcThN9/');
