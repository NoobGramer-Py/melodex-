FROM node:20-slim

# Install system dependencies: ffmpeg, python3, yt-dlp
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp

# Verify installations
RUN ffmpeg -version && yt-dlp --version

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create temp directory for conversions
RUN mkdir -p /tmp/melodex-conversions

EXPOSE 3001

CMD ["node", "src/index.js"]
