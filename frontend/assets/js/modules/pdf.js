/* ==========================================================================
   Module 1 & 2: Real PDF to Word (.docx) & PDF to PPTX (.pptx) Converters
   ========================================================================== */

function initPdfModule() {
    setupPdfConverter({
        inputId: 'input-pdf-word',
        dropzoneId: 'dropzone-pdf-word',
        previewId: 'preview-pdf-word',
        filenameId: 'filename-pdf-word',
        filesizeId: 'filesize-pdf-word',
        removeBtnId: 'remove-pdf-word',
        convertBtnId: 'btn-convert-pdf-word',
        progressBoxId: 'progress-pdf-word',
        statusTextId: 'status-pdf-word',
        percentTextId: 'percent-pdf-word',
        barId: 'bar-pdf-word',
        resultBoxId: 'result-pdf-word',
        downloadBtnId: 'download-pdf-word',
        endpoint: '/api/v1/pdf/convert-word',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        outputExt: 'docx'
    });

    setupPdfConverter({
        inputId: 'input-pdf-pptx',
        dropzoneId: 'dropzone-pdf-pptx',
        previewId: 'preview-pdf-pptx',
        filenameId: 'filename-pdf-pptx',
        filesizeId: 'filesize-pdf-pptx',
        removeBtnId: 'remove-pdf-pptx',
        convertBtnId: 'btn-convert-pdf-pptx',
        progressBoxId: 'progress-pdf-pptx',
        statusTextId: 'status-pdf-pptx',
        percentTextId: 'percent-pdf-pptx',
        barId: 'bar-pdf-pptx',
        resultBoxId: 'result-pdf-pptx',
        downloadBtnId: 'download-pdf-pptx',
        endpoint: '/api/v1/pdf/convert-pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        outputExt: 'pptx'
    });
}

function setupPdfConverter(config) {
    const input = document.getElementById(config.inputId);
    const dropzone = document.getElementById(config.dropzoneId);
    const preview = document.getElementById(config.previewId);
    const filename = document.getElementById(config.filenameId);
    const filesize = document.getElementById(config.filesizeId);
    const removeBtn = document.getElementById(config.removeBtnId);
    const convertBtn = document.getElementById(config.convertBtnId);
    const progressBox = document.getElementById(config.progressBoxId);
    const statusText = document.getElementById(config.statusTextId);
    const percentText = document.getElementById(config.percentTextId);
    const bar = document.getElementById(config.barId);
    const resultBox = document.getElementById(config.resultBoxId);
    const downloadBtn = document.getElementById(config.downloadBtnId);

    let selectedFile = null;

    if (!input) return;

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelected(e.target.files[0]);
        }
    });

    // Drag and Drop
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
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                handleFileSelected(file);
            } else {
                showToast('Chỉ chấp nhận file định dạng PDF!', 'error');
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
        progressBox.classList.add('hidden');
    });

    function handleFileSelected(file) {
        selectedFile = file;
        filename.textContent = file.name;
        filesize.textContent = formatBytes(file.size);
        preview.classList.remove('hidden');
        convertBtn.disabled = false;
        resultBox.classList.add('hidden');
    }

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        convertBtn.disabled = true;
        progressBox.classList.remove('hidden');
        resultBox.classList.add('hidden');

        let currentPercent = 0;
        const interval = setInterval(() => {
            currentPercent += Math.floor(Math.random() * 15) + 5;
            if (currentPercent > 90) currentPercent = 90;
            bar.style.width = currentPercent + '%';
            percentText.textContent = currentPercent + '%';
        }, 180);

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                body: selectedFile,
                headers: {
                    'X-Filename': encodeURIComponent(selectedFile.name)
                }
            });

            clearInterval(interval);
            bar.style.width = '100%';
            percentText.textContent = '100%';
            statusText.textContent = 'Hoàn tất!';

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: config.mimeType });
                const downloadUrl = URL.createObjectURL(blob);
                downloadBtn.href = downloadUrl;
                downloadBtn.download = selectedFile.name.replace(/\.pdf$/i, '.' + config.outputExt);

                setTimeout(() => {
                    progressBox.classList.add('hidden');
                    resultBox.classList.remove('hidden');
                    triggerSuccessConfetti();
                    showToast(`Đã chuyển đổi thành công file ${config.outputExt.toUpperCase()}!`, 'success');
                }, 300);
            } else {
                throw new Error('Conversion error');
            }

        } catch (err) {
            clearInterval(interval);
            progressBox.classList.add('hidden');
            convertBtn.disabled = false;
            showToast('Lỗi trong quá trình chuyển đổi file PDF.', 'error');
        }
    });
}
