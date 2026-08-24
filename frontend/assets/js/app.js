/* ==========================================================================
   OmniTool Hub - Main Application Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Tab Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const toolPanes = document.querySelectorAll('.tool-pane');
    const pageTitle = document.getElementById('page-title');
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobile-toggle');

    const tabTitles = {
        'tab-pdf-word': 'PDF sang Word (.docx)',
        'tab-pdf-pptx': 'PDF sang PowerPoint (.pptx)',
        'tab-qr-code': 'Tạo Mã QR Code Tùy Chỉnh',
        'tab-url-shortener': 'Rút Gọn Đường Link (URL Shortener)',
        'tab-image-convert': 'Đổi Định Dạng Hình Ảnh',
        'tab-bg-remove': 'Xóa Nền Ảnh Bằng AI',
        'tab-video-download': 'Tải Video Từ Link Social',
        'tab-audio-download': 'Tải Âm Thanh MP3 Từ Link Social',
        'tab-image-download': 'Tải Lưới Hình Ảnh FB/IG'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTabId = item.getAttribute('data-tab');
            if (!targetTabId) return;

            const currentPane = document.querySelector('.tool-pane.active');
            const targetPane = document.getElementById(targetTabId);

            if (currentPane === targetPane) return;

            // Update active state in nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Header Title
            if (pageTitle && tabTitles[targetTabId]) {
                pageTitle.textContent = tabTitles[targetTabId];
            }

            // Animate transition using GSAP helper
            if (typeof animateTabSwitch === 'function') {
                animateTabSwitch(currentPane, targetPane);
            } else {
                if (currentPane) currentPane.classList.remove('active');
                if (targetPane) targetPane.classList.add('active');
            }

            // Close sidebar on mobile after tab click
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Mobile Sidebar Toggle
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Initialize all tool modules
    if (typeof initPdfModule === 'function') initPdfModule();
    if (typeof initQrModule === 'function') initQrModule();
    if (typeof initShortenerModule === 'function') initShortenerModule();
    if (typeof initImageModule === 'function') initImageModule();
    if (typeof initBgRemoverModule === 'function') initBgRemoverModule();
    if (typeof initDownloaderModule === 'function') initDownloaderModule();
    if (typeof initImageDownloaderModule === 'function') initImageDownloaderModule();
    // Check Backend Server Status
    checkBackendHealth();
});

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Helper: Format File Sizes in Bytes
 */
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Ping Golang Backend Server Health Endpoint
 */
async function checkBackendHealth() {
    try {
        const res = await fetch('/api/v1/health').catch(() => null);
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');

        if (res && res.ok) {
            if (statusText) statusText.textContent = 'Backend Golang: Online';
            if (statusDot) statusDot.className = 'status-dot online';
        } else {
            if (statusText) statusText.textContent = 'Mode: Hybrid Client & Server';
            if (statusDot) statusDot.className = 'status-dot online';
        }
    } catch (e) {
        // Silently handle
    }
}
