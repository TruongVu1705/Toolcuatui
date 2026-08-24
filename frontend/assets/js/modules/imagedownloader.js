// Image Downloader Module
window.initImageDownloaderModule = function () {
    const fetchImageBtn = document.getElementById('btn-fetch-image');
    const imageUrlInput = document.getElementById('image-url-input');
    const imageResultCard = document.getElementById('image-result-card');
    const imageTitle = document.getElementById('image-title');
    const imageUploader = document.getElementById('image-uploader');
    const imageGridContainer = document.getElementById('image-grid-container');
    
    // Progress Bar
    const imageProgressContainer = document.getElementById('image-progress-container');
    const imageProgressText = document.getElementById('image-progress-text');
    const imageProgressPercent = document.getElementById('image-progress-percent');
    const imageProgressFill = document.getElementById('image-progress-fill');

    let fakeImageProgressInterval = null;

    function startImageProgress(targetPercent, text, speedMs = 100) {
        if (imageProgressContainer) imageProgressContainer.classList.remove('hidden');
        if (imageProgressText) imageProgressText.textContent = text;
        clearInterval(fakeImageProgressInterval);
        
        let current = parseInt(imageProgressFill.style.width) || 0;
        if (current >= targetPercent) current = 0;
        
        fakeImageProgressInterval = setInterval(() => {
            if (current < targetPercent) {
                current += (Math.random() * 3 + 1); 
                if (current > targetPercent) current = targetPercent;
                if (imageProgressFill) imageProgressFill.style.width = `${current}%`;
                if (imageProgressPercent) imageProgressPercent.textContent = `${Math.floor(current)}%`;
            }
        }, speedMs);
    }
    
    function hideImageProgress() {
        clearInterval(fakeImageProgressInterval);
        if (imageProgressFill) imageProgressFill.style.width = '100%';
        if (imageProgressPercent) imageProgressPercent.textContent = '100%';
        if (imageProgressText) imageProgressText.textContent = 'Hoàn tất!';
        if (imageProgressContainer) {
            setTimeout(() => {
                imageProgressContainer.classList.add('hidden');
                if (imageProgressFill) imageProgressFill.style.width = '0%';
                if (imageProgressPercent) imageProgressPercent.textContent = '0%';
            }, 1500);
        }
    }

    if (!fetchImageBtn) return;

    fetchImageBtn.addEventListener('click', async () => {
        const url = imageUrlInput.value.trim();
        if (!url) {
            showToast('Vui lòng nhập link bài viết!', 'error');
            return;
        }

        fetchImageBtn.disabled = true;
        const originalBtnHTML = fetchImageBtn.innerHTML;
        fetchImageBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang phân tích...`;
        if (window.lucide) lucide.createIcons();
        
        imageResultCard.classList.add('hidden');
        imageGridContainer.innerHTML = '';
        startImageProgress(90, 'Đang trích xuất hình ảnh gốc...', 60);

        try {
            const response = await fetch('/api/v1/media/image-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMsg = 'Không thể tải ảnh. Bài viết có thể bị giới hạn riêng tư hoặc link sai.';
                if (errorData.error && errorData.error.includes('Sign in to confirm')) {
                    errorMsg = 'Rất tiếc, bài viết này bị giới hạn riêng tư hoặc yêu cầu đăng nhập. Công cụ chỉ hỗ trợ tải ảnh từ bài viết công khai!';
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            if (!data.images || data.images.length === 0) {
                throw new Error('Không tìm thấy hình ảnh nào trong bài viết này.');
            }

            hideImageProgress();

            imageTitle.textContent = data.title || 'Hình ảnh mxh';
            imageUploader.textContent = data.uploader || 'Unknown';
            
            data.images.forEach((imgUrl, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.style.display = 'flex';
                itemDiv.style.flexDirection = 'column';
                itemDiv.style.background = 'rgba(0,0,0,0.3)';
                itemDiv.style.borderRadius = '8px';
                itemDiv.style.overflow = 'hidden';
                itemDiv.style.border = '1px solid rgba(255,255,255,0.1)';
                
                const img = document.createElement('img');
                img.src = imgUrl;
                img.style.width = '100%';
                img.style.height = '150px';
                img.style.objectFit = 'cover';
                
                const btn = document.createElement('a');
                btn.href = `/api/v1/media/download-proxy?url=${encodeURIComponent(imgUrl)}`;
                btn.download = `image_${index + 1}.jpg`;
                btn.style.padding = '0.5rem';
                btn.style.textAlign = 'center';
                btn.style.background = 'var(--primary-color)';
                btn.style.color = 'white';
                btn.style.textDecoration = 'none';
                btn.style.fontSize = '0.85rem';
                btn.innerHTML = '<i data-lucide="download" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i>Tải Ảnh Này';
                
                itemDiv.appendChild(img);
                itemDiv.appendChild(btn);
                imageGridContainer.appendChild(itemDiv);
            });
            
            if (window.lucide) lucide.createIcons();
            imageResultCard.classList.remove('hidden');
            showToast(`Trích xuất thành công ${data.images.length} hình ảnh!`, 'success');

        } catch (error) {
            hideImageProgress();
            showToast(error.message || 'Lỗi hệ thống', 'error');
        } finally {
            fetchImageBtn.disabled = false;
            fetchImageBtn.innerHTML = originalBtnHTML;
            if (window.lucide) lucide.createIcons();
        }
    });
};
