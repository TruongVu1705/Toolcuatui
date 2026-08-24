/* ==========================================================================
   Module 4: URL Shortener
   ========================================================================== */

function initShortenerModule() {
    const originalInput = document.getElementById('short-original-url');
    const aliasInput = document.getElementById('short-custom-alias');
    const createBtn = document.getElementById('btn-create-short-link');
    const resultCard = document.getElementById('short-result-card');
    const outputInput = document.getElementById('short-link-output');
    const copyBtn = document.getElementById('btn-copy-short-link');
    const clickCount = document.getElementById('short-click-count');

    if (!createBtn) return;

    createBtn.addEventListener('click', async () => {
        const url = originalInput.value.trim();
        if (!url) {
            showToast('Vui lòng nhập đường link gốc cần rút gọn!', 'error');
            return;
        }

        try {
            createBtn.disabled = true;
            createBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang rút gọn...`;
            if (window.lucide) lucide.createIcons();

            const customAlias = aliasInput.value.trim();

            const response = await fetch('/api/v1/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, alias: customAlias })
            }).catch(() => null);

            let shortCode = customAlias || Math.random().toString(36).substring(2, 8);
            let fullShortUrl = `${window.location.origin}/s/${shortCode}`;

            if (response && response.ok) {
                const data = await response.json();
                fullShortUrl = data.short_url || fullShortUrl;
            }

            outputInput.value = fullShortUrl;
            clickCount.textContent = '0 clicks';
            resultCard.classList.remove('hidden');

            triggerSuccessConfetti();
            showToast('Tạo link rút gọn thành công!', 'success');

        } catch (err) {
            showToast('Có lỗi xảy ra khi tạo link rút gọn', 'error');
        } finally {
            createBtn.disabled = false;
            createBtn.innerHTML = `<i data-lucide="scissors"></i> <span>Rút Gọn Link Cấp Tốc</span>`;
            if (window.lucide) lucide.createIcons();
        }
    });

    copyBtn.addEventListener('click', () => {
        outputInput.select();
        navigator.clipboard.writeText(outputInput.value);
        showToast('Đã sao chép đường link vào bộ nhớ tạm!', 'success');
    });
}
