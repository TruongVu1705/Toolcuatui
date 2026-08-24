/* ==========================================================================
   Module 6: AI Background Remover
   ========================================================================== */

function initBgRemoverModule() {
    const input = document.getElementById('input-bg');
    const dropzone = document.getElementById('dropzone-bg');
    const preview = document.getElementById('preview-bg');
    const thumb = document.getElementById('bg-thumb-preview');
    const filename = document.getElementById('filename-bg');
    const filesize = document.getElementById('filesize-bg');
    const removeBtn = document.getElementById('remove-bg');
    const processBtn = document.getElementById('btn-process-bg');
    const resultBox = document.getElementById('result-bg-box');
    const resultImg = document.getElementById('bg-result-img');
    const downloadBtn = document.getElementById('download-bg-img');

    let selectedFile = null;

    const bgProgressContainer = document.getElementById('bg-progress-container');
    const bgProgressText = document.getElementById('bg-progress-text');
    const bgProgressPercent = document.getElementById('bg-progress-percent');
    const bgProgressFill = document.getElementById('bg-progress-fill');

    let fakeBgProgressInterval = null;

    function startBgProgress(targetPercent, text, speedMs = 100) {
        if (bgProgressContainer) bgProgressContainer.classList.remove('hidden');
        if (bgProgressText) bgProgressText.textContent = text;
        clearInterval(fakeBgProgressInterval);
        
        let current = parseInt(bgProgressFill.style.width) || 0;
        if (current >= targetPercent) current = 0;
        
        fakeBgProgressInterval = setInterval(() => {
            if (current < targetPercent) {
                current += (Math.random() * 3 + 1); 
                if (current > targetPercent) current = targetPercent;
                if (bgProgressFill) bgProgressFill.style.width = `${current}%`;
                if (bgProgressPercent) bgProgressPercent.textContent = `${Math.floor(current)}%`;
            }
        }, speedMs);
    }
    
    function hideBgProgress() {
        clearInterval(fakeBgProgressInterval);
        if (bgProgressFill) bgProgressFill.style.width = '100%';
        if (bgProgressPercent) bgProgressPercent.textContent = '100%';
        if (bgProgressText) bgProgressText.textContent = 'Hoàn tất!';
        if (bgProgressContainer) {
            setTimeout(() => {
                bgProgressContainer.classList.add('hidden');
                if (bgProgressFill) bgProgressFill.style.width = '0%';
                if (bgProgressPercent) bgProgressPercent.textContent = '0%';
            }, 1500);
        }
    }

    if (!input) return;

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleBgSelected(e.target.files[0]);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                handleBgSelected(file);
            }
        }
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        input.value = '';
        preview.classList.add('hidden');
        processBtn.disabled = true;
        resultBox.classList.add('hidden');
    });

    function handleBgSelected(file) {
        selectedFile = file;
        filename.textContent = file.name;
        filesize.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (evt) => {
            thumb.src = evt.target.result;
        };
        reader.readAsDataURL(file);

        preview.classList.remove('hidden');
        processBtn.disabled = false;
        resultBox.classList.add('hidden');
    }

    processBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        processBtn.disabled = true;
        processBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> AI đang phân tích & xóa nền...`;
        if (window.lucide) lucide.createIcons();

        try {
            startBgProgress(30, 'Đang chuẩn bị và thu nhỏ kích thước ảnh...', 60);

            // Nén ảnh xuống kích thước vừa đủ bằng Canvas trước khi gửi để AI phân tích siêu tốc (Giảm 80% thời gian chờ)
            const base64Img = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1600;
                    if (width > height && width > MAX_SIZE) {
                        height = Math.round(height * MAX_SIZE / width);
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width = Math.round(width * MAX_SIZE / height);
                        height = MAX_SIZE;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = URL.createObjectURL(selectedFile);
            });

            startBgProgress(90, 'AI đang tách nền...', 150);

            const response = await fetch('/api/v1/image/remove-bg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Img })
            }).catch(() => null);

            hideBgProgress();

            if (response && response.ok) {
                const blob = await response.blob();
                const transparentUrl = URL.createObjectURL(blob);
                resultImg.src = transparentUrl;
                downloadBtn.href = transparentUrl;
                
                resultBox.classList.remove('hidden');
                triggerSuccessConfetti();
                showToast('Đã xóa nền siêu mượt bằng AI U2Net!', 'success');
            } else {
                // Fallback Smart Client Edge & Background Removal Algorithm
                const transparentBlob = await removeBackgroundClientCanvas(selectedFile);
                const transparentUrl = URL.createObjectURL(transparentBlob);
                resultImg.src = transparentUrl;
                downloadBtn.href = transparentUrl;
                
                resultBox.classList.remove('hidden');
                showToast('AI đang khởi động! Tạm thời dùng thuật toán thường (vui lòng thử lại sau 1 phút).', 'warning');
            }

        } catch (err) {
            showToast('Lỗi trong quá trình xóa nền ảnh.', 'error');
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = `<i data-lucide="wand-2"></i> <span>Xóa Nền Ảnh Bằng AI Ngay</span>`;
            if (window.lucide) lucide.createIcons();
        }
    });
}

/**
 * Intelligent Client Canvas Edge Mask & Chroma Key Background Removal
 */
function removeBackgroundClientCanvas(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Sample corner pixels to detect background color
            const corners = [
                0, // Top-Left
                (canvas.width - 1) * 4, // Top-Right
                ((canvas.height - 1) * canvas.width) * 4, // Bottom-Left
                ((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4 // Bottom-Right
            ];

            let bgR = 0, bgG = 0, bgB = 0;
            corners.forEach(idx => {
                bgR += data[idx];
                bgG += data[idx + 1];
                bgB += data[idx + 2];
            });
            bgR = Math.round(bgR / 4);
            bgG = Math.round(bgG / 4);
            bgB = Math.round(bgB / 4);

            const tolerance = 45;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const diff = Math.sqrt(
                    Math.pow(r - bgR, 2) +
                    Math.pow(g - bgG, 2) +
                    Math.pow(b - bgB, 2)
                );

                if (diff < tolerance) {
                    data[i + 3] = 0; // Set Alpha to Transparent
                } else if (diff < tolerance + 20) {
                    // Smooth Edge Alpha blending
                    data[i + 3] = Math.round(((diff - tolerance) / 20) * 255);
                }
            }

            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        };
    });
}
