/* ==========================================================================
   Module 5: Image Format Converter (Instant Canvas + Backend API)
   ========================================================================== */

function initImageModule() {
    const input = document.getElementById('input-image');
    const dropzone = document.getElementById('dropzone-image');
    const preview = document.getElementById('preview-image');
    const thumb = document.getElementById('img-thumb-preview');
    const filename = document.getElementById('filename-image');
    const filesize = document.getElementById('filesize-image');
    const removeBtn = document.getElementById('remove-image');
    const convertBtn = document.getElementById('btn-convert-image');
    const resultBox = document.getElementById('result-image');
    const downloadBtn = document.getElementById('download-image');
    const optSaving = document.getElementById('image-opt-saving');

    let selectedFile = null;

    if (!input) return;

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageSelected(e.target.files[0]);
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
                handleImageSelected(file);
            } else {
                showToast('Chỉ chấp nhận file định dạng hình ảnh!', 'error');
            }
        }
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        input.value = '';
        preview.classList.add('hidden');
        convertBtn.disabled = true;
        resultBox.classList.add('hidden');
    });

    function handleImageSelected(file) {
        selectedFile = file;
        filename.textContent = file.name;
        filesize.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (evt) => {
            thumb.src = evt.target.result;
        };
        reader.readAsDataURL(file);

        preview.classList.remove('hidden');
        convertBtn.disabled = false;
        resultBox.classList.add('hidden');
    }

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const targetFormat = document.querySelector('input[name="target-format"]:checked')?.value || 'webp';
        
        convertBtn.disabled = true;
        convertBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang xử lý...`;
        if (window.lucide) lucide.createIcons();

        try {
            // Client-side Canvas Converter Execution for sub-second performance
            const img = new Image();
            img.src = URL.createObjectURL(selectedFile);
            
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let mimeType = `image/${targetFormat}`;
            if (targetFormat === 'jpg') mimeType = 'image/jpeg';

            canvas.toBlob((blob) => {
                if (!blob) throw new Error('Conversion failed');

                const convertedUrl = URL.createObjectURL(blob);
                downloadBtn.href = convertedUrl;
                downloadBtn.download = selectedFile.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;

                const sizeSaving = Math.round((1 - (blob.size / selectedFile.size)) * 100);
                optSaving.textContent = sizeSaving > 0 
                    ? `Dung lượng giảm ${sizeSaving}% (Từ ${formatBytes(selectedFile.size)} ➜ ${formatBytes(blob.size)})`
                    : `File đã chuyển đổi sang ${targetFormat.toUpperCase()} (${formatBytes(blob.size)})`;

                resultBox.classList.remove('hidden');
                triggerSuccessConfetti();
                showToast(`Đã chuyển đổi sang định dạng ${targetFormat.toUpperCase()}!`, 'success');

                convertBtn.disabled = false;
                convertBtn.innerHTML = `<i data-lucide="refresh-cw"></i> <span>Chuyển Đổi Định Dạng Ảnh</span>`;
                if (window.lucide) lucide.createIcons();
            }, mimeType, 0.92);

        } catch (err) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = `<i data-lucide="refresh-cw"></i> <span>Chuyển Đổi Định Dạng Ảnh</span>`;
            if (window.lucide) lucide.createIcons();
            showToast('Lỗi trong quá trình chuyển đổi ảnh!', 'error');
        }
    });
}
