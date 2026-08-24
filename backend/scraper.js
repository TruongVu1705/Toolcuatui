const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const url = process.argv[2];

if (!url) {
    console.error(JSON.stringify({ error: "Missing URL" }));
    process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1280, height: 1000 });
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        let title = "Social Media Post";
        let uploader = "Unknown";

        try { title = await page.$eval('title', el => el.textContent); } catch (e) {}

        // --- BƯỚC 0: TƯƠNG TÁC LẬT TRANG (CAROUSEL) ĐỂ DOM RENDER HẾT TẤT CẢ ID ---
        let hasNext = true;
        let maxClicks = 15; // Tối đa lật 15 ảnh
        const postImgIds = new Set();
        
        const extractId = (src) => {
            if (!src) return null;
            const match = src.match(/\/([0-9_]+_n\.(jpg|png))/);
            if (match) return match[1];
            return null;
        };

        // Thu thập ID liên tục trong quá trình lật
        const collectDOMIds = async () => {
            const domIds = await page.evaluate(() => {
                const ids = [];
                const ext = (src) => {
                    if (!src) return null;
                    const match = src.match(/\/([0-9_]+_n\.(jpg|png))/);
                    if (match) return match[1];
                    return null;
                };
                
                const ogMeta = document.querySelector('meta[property="og:image"]');
                if (ogMeta && ogMeta.content) {
                    const id = ext(ogMeta.content);
                    if (id) ids.push(id);
                }

                if (window.location.href.includes('instagram.com')) {
                    document.querySelectorAll('article img').forEach(img => {
                        const id = ext(img.src);
                        if (id) ids.push(id);
                    });
                } else if (window.location.href.includes('facebook.com')) {
                    document.querySelectorAll('img').forEach(img => {
                        let src = img.dataset.src || img.src;
                        if (img.width > 200 || img.height > 200 || (src && src.includes('nc_cat'))) {
                            const id = ext(src);
                            if (id) ids.push(id);
                        }
                    });
                }
                return ids;
            });
            domIds.forEach(id => postImgIds.add(id));
        };

        await collectDOMIds();

        while (hasNext && maxClicks > 0) {
            try {
                const clicked = await page.evaluate(() => {
                    const nextIcon = document.querySelector('[aria-label="Next"], [aria-label="Next photo"], [aria-label="Ảnh tiếp theo"]');
                    if (nextIcon) {
                        // Click vào node có aria-label Next
                        let target = nextIcon;
                        if (target.tagName === 'svg') target = target.parentElement;
                        target.click();
                        return true;
                    }
                    
                    // Dự phòng cho IG: Click vào mép phải của bài viết
                    const article = document.querySelector('article');
                    if (article) {
                        const imgs = article.querySelectorAll('img');
                        if (imgs.length > 0) {
                            const lastImg = imgs[imgs.length - 1];
                            const rect = lastImg.getBoundingClientRect();
                            const clickEvent = new MouseEvent('click', {
                                view: window, bubbles: true, cancelable: true,
                                clientX: rect.right - 20,
                                clientY: rect.top + (rect.height / 2)
                            });
                            lastImg.dispatchEvent(clickEvent);
                            return true;
                        }
                    }
                    return false;
                });
                
                if (!clicked) {
                    hasNext = false;
                } else {
                    await sleep(1200); // Chờ ảnh render 
                    await collectDOMIds();
                }
            } catch (e) {
                hasNext = false; 
            }
            maxClicks--;
        }

        const html = await page.content();
        
        // --- BƯỚC 1: XUYÊN THẤU HTML JSON ĐỂ MÓC TOÀN BỘ BIẾN THỂ ẢNH ---
        const rawLinks = html.match(/https:\\\/\\\/[^\"]+(scontent|fbcdn)[^\"]+/g) || [];
        
        let allUrls = [...rawLinks.map(l => l.replace(/\\\//g, '/'))];
        
        const domLinks = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('img').forEach(img => {
                if(img.src) results.push(img.src);
                if(img.dataset.src) results.push(img.dataset.src);
            });
            return results;
        });
        
        allUrls = [...allUrls, ...domLinks];
        allUrls = [...new Set(allUrls.map(i => i.replace(/&amp;/g, '&')))]
                    .filter(i => i && i.startsWith('http') && !i.includes('emoji') && !i.includes('/rsrc.php/'));

        // --- BƯỚC 2: KẾT HỢP VÀ LỌC CẢI TIẾN CHẤT LƯỢNG ẢNH ---
        const idMap = new Map();
        allUrls.forEach(u => {
            const imgId = extractId(u);
            if (imgId) {
                // CHỈ CHẤP NHẬN CÁC ẢNH CÓ ID THUỘC VỀ BÀI ĐĂNG (NẾU ĐÃ TÌM THẤY ID POST)
                if (postImgIds.size === 0 || postImgIds.has(imgId)) {
                    if (!idMap.has(imgId)) idMap.set(imgId, []);
                    idMap.get(imgId).push(u);
                }
            }
        });

        const highResImages = [];
        
        idMap.forEach((urls, imgId) => {
            let noCropUrls = urls.filter(u => !u.match(/stp=c[0-9.]+[a-z_]/) && !u.match(/ctp=[a-z0-9]+/));
            let pool = noCropUrls.length > 0 ? noCropUrls : urls;
            
            pool.sort((a, b) => {
                const getRes = (u) => {
                    const m = u.match(/[sp]([0-9]+)x([0-9]+)/);
                    if (m) return parseInt(m[1]) * parseInt(m[2]);
                    return 0; 
                };
                const resA = getRes(a);
                const resB = getRes(b);
                
                if (resA === 0 && resB !== 0) return -1; 
                if (resB === 0 && resA !== 0) return 1;
                return resB - resA;
            });
            
            highResImages.push(pool[0]);
        });

        if (highResImages.length === 0) {
            allUrls.forEach(u => {
                if (u.includes('scontent') || u.includes('fbcdn')) {
                    if (!u.match(/stp=c[0-9.]+[a-z_]/) && !u.match(/ctp=[a-z0-9]+/)) {
                        highResImages.push(u);
                    }
                }
            });
        }

        const finalImages = [...new Set(highResImages)].slice(0, 15).map(u => u.replace(/\\u00253D/g, '%3D').replace(/\\u002526/g, '%26'));

        if (finalImages.length === 0) {
            console.error(JSON.stringify({ error: "Không tìm thấy ảnh gốc hoặc bài đăng yêu cầu quyền riêng tư." }));
            process.exit(1);
        }

        console.log(JSON.stringify({ title, uploader, images: finalImages }));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
    } finally {
        if (browser) await browser.close();
    }
})();
