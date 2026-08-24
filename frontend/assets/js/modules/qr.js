/* ==========================================================================
   Module 3: QR Code Generator (Client Canvas + Backend API)
   ========================================================================== */

function initQrModule() {
    const input = document.getElementById('qr-content-input');
    const fgColor = document.getElementById('qr-fg-color');
    const bgColor = document.getElementById('qr-bg-color');
    const sizeSelect = document.getElementById('qr-size');
    const generateBtn = document.getElementById('btn-generate-qr');
    const outputDiv = document.getElementById('qr-output');
    const downloadBtn = document.getElementById('btn-download-qr-png');

    if (!generateBtn || !outputDiv) return;

    let qrCodeInstance = null;

    function renderQrCode() {
        const text = input.value.trim();
        if (!text) {
            showToast('Vui lòng nhập nội dung hoặc link để tạo QR!', 'error');
            return;
        }

        outputDiv.innerHTML = '';

        const size = parseInt(sizeSelect.value, 10) || 300;

        if (window.QRCode) {
            qrCodeInstance = new QRCode(outputDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: fgColor.value,
                colorLight: bgColor.value,
                correctLevel: QRCode.CorrectLevel.H
            });
            showToast('Đã tạo mã QR thành công!', 'success');
        } else {
            // Fallback API call to Backend Golang QR Endpoint
            const backendUrl = `/api/v1/qr/generate?text=${encodeURIComponent(text)}&size=${size}&fg=${encodeURI(fgColor.value)}&bg=${encodeURI(bgColor.value)}`;
            outputDiv.innerHTML = `<img src="${backendUrl}" alt="QR Code" style="width:${size}px; height:${size}px;">`;
        }
    }

    generateBtn.addEventListener('click', renderQrCode);

    // Live update on input changes
    [fgColor, bgColor, sizeSelect].forEach(el => {
        el.addEventListener('change', () => {
            if (outputDiv.children.length > 0) {
                renderQrCode();
            }
        });
    });

    downloadBtn.addEventListener('click', () => {
        const img = outputDiv.querySelector('img') || outputDiv.querySelector('canvas');
        if (!img) {
            showToast('Chưa có mã QR nào được tạo!', 'error');
            return;
        }

        let dataUrl = '';
        if (img.tagName === 'CANVAS') {
            dataUrl = img.toDataURL('image/png');
        } else if (img.tagName === 'IMG') {
            dataUrl = img.src;
        }

        const link = document.createElement('a');
        link.download = 'omni-qrcode.png';
        link.href = dataUrl;
        link.click();
        showToast('Đã tải file QR Code PNG!', 'success');
    });

    // Render initial QR
    setTimeout(renderQrCode, 500);
}
