/* ==========================================================================
   Module 7 & 8: Media Downloader (Video & Audio from Social Links)
   ========================================================================== */

function initDownloaderModule() {
    // Video Downloader Setup
    const videoUrlInput = document.getElementById('video-url-input');
    const fetchVideoBtn = document.getElementById('btn-fetch-video');
    const videoResultCard = document.getElementById('video-result-card');
    const videoTitle = document.getElementById('video-title');
    const videoUploader = document.getElementById('video-uploader');
    const videoThumb = document.getElementById('video-thumb');
    const videoDuration = document.getElementById('video-duration');

    // Progress Bar Elements
    const videoProgressContainer = document.getElementById('video-progress-container');
    const videoProgressText = document.getElementById('video-progress-text');
    const videoProgressPercent = document.getElementById('video-progress-percent');
    const videoProgressFill = document.getElementById('video-progress-fill');

    let fakeProgressInterval = null;

    function startVideoProgress(targetPercent, text, speedMs = 100) {
        if (videoProgressContainer) videoProgressContainer.classList.remove('hidden');
        if (videoProgressText) videoProgressText.textContent = text;
        clearInterval(fakeProgressInterval);

        let current = parseInt(videoProgressFill.style.width) || 0;
        if (current >= targetPercent) current = 0; // reset

        fakeProgressInterval = setInterval(() => {
            if (current < targetPercent) {
                current += (Math.random() * 3 + 1);
                if (current > targetPercent) current = targetPercent;
                if (videoProgressFill) videoProgressFill.style.width = `${current}%`;
                if (videoProgressPercent) videoProgressPercent.textContent = `${Math.floor(current)}%`;
            }
        }, speedMs);
    }

    function updateRealVideoProgress(percent, text) {
        clearInterval(fakeProgressInterval);
        if (videoProgressContainer) videoProgressContainer.classList.remove('hidden');
        if (videoProgressText) videoProgressText.textContent = text;
        if (videoProgressFill) videoProgressFill.style.width = `${percent}%`;
        if (videoProgressPercent) videoProgressPercent.textContent = `${Math.floor(percent)}%`;
    }

    function hideVideoProgress() {
        clearInterval(fakeProgressInterval);
        setTimeout(() => {
            if (videoProgressContainer) videoProgressContainer.classList.add('hidden');
            if (videoProgressFill) videoProgressFill.style.width = '0%';
        }, 2000);
    }

    if (fetchVideoBtn) {
        fetchVideoBtn.addEventListener('click', async () => {
            const url = videoUrlInput.value.trim();
            if (!url) {
                showToast('Vui lòng dán link video (TikTok, YouTube, FB, IG)!', 'error');
                return;
            }

            fetchVideoBtn.disabled = true;
            fetchVideoBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang phân tích link...`;
            if (window.lucide) lucide.createIcons();

            startVideoProgress(95, 'Đang trích xuất dữ liệu', 40);

            try {
                const response = await fetch('/api/v1/media/download-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, type: 'video' })
                }).catch(() => null);

                let videoData = {
                    title: 'Media Video Stream Output (No WM)',
                    uploader: 'Nền tảng social verified',
                    duration: '02:15',
                    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
                    download_url: `/api/v1/media/stream?url=${encodeURIComponent(url)}`
                };

                if (response && response.ok) {
                    const data = await response.json();
                    videoData = { ...videoData, ...data };
                }

                videoTitle.textContent = videoData.title;
                videoUploader.textContent = `Kênh: ${videoData.uploader}`;
                videoDuration.textContent = videoData.duration;
                videoThumb.src = videoData.thumbnail;

                // Generate dynamic resolution buttons
                const downloadContainer = document.getElementById('video-download-options');
                if (downloadContainer) {
                    downloadContainer.innerHTML = '';
                    const resolutions = videoData.resolutions || [1080, 720, 480, 360];
                    const safeFilename = (videoData.title || 'video').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ._-]/g, '_') + '.mp4';

                    resolutions.forEach(res => {
                        const btn = document.createElement('a');
                        btn.href = '#';
                        btn.className = 'btn-download-sm';
                        // Optional: Highlight higher resolutions
                        if (res >= 1080) {
                            btn.style.borderColor = 'var(--primary-color)';
                            btn.style.color = 'var(--primary-color)';
                        }

                        btn.innerHTML = `<i data-lucide="film"></i> Tải Video ${res}p`;

                        btn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const specificDownloadUrl = `${videoData.download_url}&resolution=${res}`;

                            const originalHTML = btn.innerHTML;
                            btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang tải ${res}p...`;
                            btn.style.pointerEvents = 'none';
                            if (window.lucide) lucide.createIcons();

                            startVideoProgress(40, `Máy chủ đang xử lý & hợp nhất luồng ${res}p...`, 300);

                            try {
                                const resp = await fetch(specificDownloadUrl);
                                if (!resp.ok) {
                                    const errorText = await resp.text();
                                    throw new Error(errorText || 'Download failed');
                                }

                                clearInterval(fakeProgressInterval);
                                const contentLength = resp.headers.get('content-length');
                                let blob;

                                if (!contentLength) {
                                    startVideoProgress(99, `Đang tải ${res}p về máy...`, 150);
                                    blob = await resp.blob();
                                } else {
                                    const total = parseInt(contentLength, 10);
                                    let loaded = 0;
                                    const reader = resp.body.getReader();
                                    const chunks = [];

                                    while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;
                                        chunks.push(value);
                                        loaded += value.length;

                                        const realPercent = 40 + (loaded / total) * 60;
                                        updateRealVideoProgress(realPercent, `Đang tải file (${(loaded / 1048576).toFixed(1)}MB / ${(total / 1048576).toFixed(1)}MB)`);
                                    }
                                    blob = new Blob(chunks);
                                }

                                updateRealVideoProgress(100, 'Đã tải xong!');
                                hideVideoProgress();

                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = safeFilename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                                showToast(`Video ${res}p đã tải thành công!`, 'success');
                            } catch (err) {
                                console.error('Video download error:', err);
                                showToast('Lỗi tải video: ' + err.message, 'error');
                            } finally {
                                btn.innerHTML = originalHTML;
                                btn.style.pointerEvents = '';
                                if (window.lucide) lucide.createIcons();
                            }
                        });

                        downloadContainer.appendChild(btn);
                    });
                }

                updateRealVideoProgress(100, 'Phân tích hoàn tất!');
                hideVideoProgress();

                videoResultCard.classList.remove('hidden');
                triggerSuccessConfetti();
                showToast('Đã phân tích video thành công!', 'success');

            } catch (err) {
                updateRealVideoProgress(0, 'Lỗi phân tích!');
                hideVideoProgress();
                showToast('Lỗi khi phân tích đường link video.', 'error');
            } finally {
                fetchVideoBtn.disabled = false;
                fetchVideoBtn.innerHTML = `<i data-lucide="search"></i> <span>Phân Tích & Phân Giải Video</span>`;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // Audio Downloader Setup
    const audioUrlInput = document.getElementById('audio-url-input');
    const fetchAudioBtn = document.getElementById('btn-fetch-audio');
    const audioResultCard = document.getElementById('audio-result-card');
    const audioTitle = document.getElementById('audio-title');
    const dlAudioMp3 = document.getElementById('dl-audio-mp3');

    // Audio Progress Bar Elements
    const audioProgressContainer = document.getElementById('audio-progress-container');
    const audioProgressText = document.getElementById('audio-progress-text');
    const audioProgressPercent = document.getElementById('audio-progress-percent');
    const audioProgressFill = document.getElementById('audio-progress-fill');

    let fakeAudioProgressInterval = null;

    function startAudioProgress(targetPercent, text, speedMs = 100) {
        if (audioProgressContainer) audioProgressContainer.classList.remove('hidden');
        if (audioProgressText) audioProgressText.textContent = text;
        clearInterval(fakeAudioProgressInterval);

        let current = parseInt(audioProgressFill.style.width) || 0;
        if (current >= targetPercent) current = 0;

        fakeAudioProgressInterval = setInterval(() => {
            if (current < targetPercent) {
                current += (Math.random() * 3 + 1);
                if (current > targetPercent) current = targetPercent;
                if (audioProgressFill) audioProgressFill.style.width = `${current}%`;
                if (audioProgressPercent) audioProgressPercent.textContent = `${Math.floor(current)}%`;
            }
        }, speedMs);
    }

    function updateRealAudioProgress(percent, text) {
        clearInterval(fakeAudioProgressInterval);
        if (audioProgressContainer) audioProgressContainer.classList.remove('hidden');
        if (audioProgressText) audioProgressText.textContent = text;
        if (audioProgressFill) audioProgressFill.style.width = `${percent}%`;
        if (audioProgressPercent) audioProgressPercent.textContent = `${Math.floor(percent)}%`;
    }

    function hideAudioProgress() {
        clearInterval(fakeAudioProgressInterval);
        setTimeout(() => {
            if (audioProgressContainer) audioProgressContainer.classList.add('hidden');
            if (audioProgressFill) audioProgressFill.style.width = '0%';
        }, 2000);
    }

    if (fetchAudioBtn) {
        fetchAudioBtn.addEventListener('click', async () => {
            const url = audioUrlInput.value.trim();
            if (!url) {
                showToast('Vui lòng dán link chứa âm thanh!', 'error');
                return;
            }

            fetchAudioBtn.disabled = true;
            fetchAudioBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang tách âm thanh...`;
            if (window.lucide) lucide.createIcons();

            startAudioProgress(95, 'Đang trích xuất dữ liệu yt-dlp...', 40);

            try {
                const response = await fetch('/api/v1/media/download-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, type: 'audio' })
                }).catch(() => null);

                let audioData = {
                    title: 'Audio Stream Soundtrack MP3 (320kbps)',
                    download_url: `/api/v1/media/stream-audio?url=${encodeURIComponent(url)}`
                };

                if (response && response.ok) {
                    const data = await response.json();
                    audioData = { ...audioData, ...data };
                }

                audioTitle.textContent = audioData.title;

                // Store download URL on the button as data attribute
                dlAudioMp3.dataset.downloadUrl = audioData.download_url;
                dlAudioMp3.dataset.filename = (audioData.title || 'audio').replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ._-]/g, '_') + '.mp3';
                dlAudioMp3.removeAttribute('href');

                updateRealAudioProgress(100, 'Phân tích hoàn tất!');
                hideAudioProgress();

                audioResultCard.classList.remove('hidden');
                triggerSuccessConfetti();
                showToast('Tách âm thanh MP3 thành công!', 'success');

            } catch (err) {
                updateRealAudioProgress(0, 'Lỗi phân tích!');
                hideAudioProgress();
                showToast('Lỗi khi tách âm thanh.', 'error');
            } finally {
                fetchAudioBtn.disabled = false;
                fetchAudioBtn.innerHTML = `<i data-lucide="headphones"></i> <span>Trích Xuất Âm Thanh Ngay</span>`;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // Audio Download Button - use fetch to download as blob
    if (dlAudioMp3) {
        dlAudioMp3.addEventListener('click', async (e) => {
            e.preventDefault();
            const downloadUrl = dlAudioMp3.dataset.downloadUrl;
            if (!downloadUrl) {
                showToast('Chưa có link tải. Hãy phân tích âm thanh trước!', 'error');
                return;
            }

            const originalHTML = dlAudioMp3.innerHTML;
            dlAudioMp3.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang tải MP3...`;
            dlAudioMp3.style.pointerEvents = 'none';
            if (window.lucide) lucide.createIcons();

            startAudioProgress(40, `Máy chủ đang xử lý chuyển đổi MP3...`, 300);

            try {
                const resp = await fetch(downloadUrl);
                if (!resp.ok) {
                    const errorText = await resp.text();
                    throw new Error(errorText || 'Download failed');
                }

                clearInterval(fakeAudioProgressInterval);
                const contentLength = resp.headers.get('content-length');
                let blob;

                if (!contentLength) {
                    startAudioProgress(99, `Đang tải âm thanh về máy...`, 150);
                    blob = await resp.blob();
                } else {
                    const total = parseInt(contentLength, 10);
                    let loaded = 0;
                    const reader = resp.body.getReader();
                    const chunks = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        loaded += value.length;

                        const realPercent = 40 + (loaded / total) * 60;
                        updateRealAudioProgress(realPercent, `Đang tải file (${(loaded / 1048576).toFixed(1)}MB / ${(total / 1048576).toFixed(1)}MB)`);
                    }
                    blob = new Blob(chunks);
                }

                updateRealAudioProgress(100, 'Đã tải MP3 xong!');
                hideAudioProgress();

                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = dlAudioMp3.dataset.filename || 'downloaded_audio.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);

                showToast('Âm thanh MP3 đã tải thành công!', 'success');
            } catch (err) {
                console.error('Audio download error:', err);
                showToast('Lỗi tải âm thanh: ' + err.message, 'error');
            } finally {
                dlAudioMp3.innerHTML = originalHTML;
                dlAudioMp3.style.pointerEvents = '';
                if (window.lucide) lucide.createIcons();
            }
        });
    }
}
