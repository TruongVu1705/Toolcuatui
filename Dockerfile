FROM node:20-bookworm-slim

# Cài đặt Python, FFmpeg và các thư viện cần thiết cho Puppeteer / Rembg
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    ffmpeg \
    wget \
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

# Cài đặt Rembg (Xóa nền ảnh), yt-dlp (Trình tải video) và Thư viện chuyển đổi PDF
# Dùng -U (upgrade) để đảm bảo luôn tải yt-dlp phiên bản mới nhất nhằm đối phó với update của Youtube
RUN pip3 install -U --break-system-packages rembg onnxruntime yt-dlp pymupdf pdf2docx pytesseract Pillow python-docx Spire.Pdf

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

# Expose Port 8080 cho Render
EXPOSE 8080

CMD ["node", "server.js"]
