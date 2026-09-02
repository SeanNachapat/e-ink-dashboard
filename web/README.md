# TRMNL 7.5" OG E-Ink Web Control Center & BMP Renderer

A full-stack React + Node.js + TypeScript + Tailwind web application designed to manage, customize, and stream real-time 800x480 pixel-perfect monochrome images to your **Seeed Studio TRMNL 7.5" OG DIY Kit** (XIAO ESP32-S3).

---

## 🚀 Quick Start (Local)

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser to access the web management console.

---

## 🐳 Docker Deployment

You can run the entire server using Docker with one command:

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Or direct docker build
docker build -t trmnl-dashboard .
docker run -d -p 3000:3000 --name trmnl-dashboard trmnl-dashboard
```

---

## ☁️ Cloudflare Deployment

To deploy to Cloudflare:

```bash
# Login to Cloudflare
npx wrangler login

# Deploy to Cloudflare
npx wrangler deploy
```

---

## 📡 Device API Endpoints

The web server exposes simple endpoints for the ESP32-S3 firmware:

| Endpoint | Method | Content-Type | Description |
| :--- | :--- | :--- | :--- |
| `/api/screen.bmp` | `GET` | `image/bmp` | Returns real-time **800x480 1-bit monochrome uncompressed BMP** (48 KB) formatted directly for e-paper. |
| `/api/data` | `GET` | `application/json` | Returns JSON weather, agendas, and device settings. |
| `/api/config` | `POST` | `application/json` | Updates dashboard settings from the Web UI. |
| `/api/telemetry` | `POST` | `application/json` | Receives battery voltage, %, and RSSI from the board upon waking up. |

---

## 🔄 Firmware Connection

In your ESP32-S3 firmware ([`include/config.h`](file:///Users/seanst._/documents/Code/include/config.h)), set your web server URL:

```cpp
#define SERVER_SCREEN_URL  "http://YOUR_SERVER_IP:3000/api/screen.bmp"
#define SERVER_TELEMETRY_URL "http://YOUR_SERVER_IP:3000/api/telemetry"
```
