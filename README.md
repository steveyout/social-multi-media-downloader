# 🚀 YOUPLEX 
### The Ultimate High-Performance Media Downloader

**YOUPLEX** is a lightning-fast, sleek, and private web application designed to fetch your favorite content from across the web in the highest quality possible. Built with **Next.js 15** and powered by the legendary **yt-dlp** engine.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Key Features

* **⚡ Turbo Streaming:** Don't wait for the server to finish processing. YOUPLEX streams data directly to your browser as it fetches, showing real-time progress.
* **💎 Best-in-Class Quality:** Automatically sources the highest resolution video (4K/1080p) and highest bitrate audio (320kbps).
* **🎨 Designer Interface:** A dark-mode optimized, minimalist UI featuring glassmorphism and smooth animations.
* **📱 Universal Compatibility:** Works seamlessly on mobile, tablet, and desktop.
* **🛡️ Privacy First:** No tracking, no logs, and no invasive ads. Just you and your media.
* **📜 History Tracking:** Keep track of your recent downloads with local-storage powered history.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Next.js 15 (App Router), Tailwind CSS |
| **Icons** | Lucide React |
| **Backend** | Next.js Serverless Functions (Node.js) |
| **Engine** | yt-dlp via `ytdlp-nodejs` |
| **Streaming** | Node.js `PassThrough` & Web `ReadableStream` |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/youplex.git](https://github.com/yourusername/youplex.git)
cd youplex
```

### Install dependencies

```bash
npm install
```
### Setup yt-dlp
Ensure you have yt-dlp installed on your machine or use the provided installation script for deployment:

### Run Development Server
```bash
npm run dev
Open http://localhost:3000 to see the magic.
```
### 📦 Deployment
Vercel / Railway / Render
YOUPLEX is optimized for modern cloud platforms. For the best experience (including video merging), we recommend Railway or Docker-based hosting.

Current Environment Targets:

Node.js: 20.x or higher

FFmpeg: Required for 1080p+ merging.

### 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

### ⚖️ License & Disclaimer
Distributed under the MIT License.

Disclaimer: YOUPLEX is intended for personal use and for downloading content that is either in the public domain or for which you have explicit permission from the creator. Please respect the terms of service of the platforms you use.

<p align="center">
Built with ❤️ by the YOUPLEX Team
</p>
