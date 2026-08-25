FROM node:20-bookworm-slim

# Cài đặt Python, FFmpeg, git và các thư viện cần thiết cho Puppeteer / Rembg
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    ffmpeg \
    wget \
    git \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    tesseract-ocr \
    tesseract-ocr-vie \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt yt-dlp (Nightly Build) + PO Token Plugin + Rembg + PDF tools
RUN pip3 install --no-cache-dir -U --break-system-packages \
    https://github.com/yt-dlp/yt-dlp/archive/master.tar.gz \
    bgutil-ytdlp-pot-provider \
    rembg onnxruntime pymupdf pdf2docx pytesseract Pillow python-docx Spire.Pdf

# Clone và build PO Token Server (BotGuard bypass)
RUN git clone --single-branch https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil && \
    cd /opt/bgutil/server && npm ci && npx tsc

# Cài đặt Chrome cho Puppeteer
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy thư mục vào Container
COPY package.json ./
RUN npm install

# Fix lỗi puppeteer khi chạy trong Docker root
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose Port 8080 cho Render
EXPOSE 8080

# Khởi động PO Token Server trước, sau đó khởi động ứng dụng chính
CMD ["bash", "start.sh"]
