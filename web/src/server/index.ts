import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { DashboardConfig, renderDashboardImage } from './bmpRenderer';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// In-Memory State / Configuration (Can be backed by SQLite/KV/Postgres)
let dashboardState: DashboardConfig = {
  title: "TRMNL DASHBOARD",
  subtitle: "Personal Information & Metrics Hub",
  city: "Bangkok",
  latitude: 13.7563,
  longitude: 100.5018,
  useCelsius: true,
  temperature: 28,
  tempMax: 33,
  tempMin: 25,
  conditionText: "Partly Cloudy",
  humidity: 62,
  windSpeed: 11.5,
  rainProbability: 15,
  cardHeader: "Today's Focus & Agenda",
  notes: [
    "* 09:30 AM  Morning Standup & Focus",
    "* 02:00 PM  TRMNL E-Ink Development",
    "* 06:30 PM  Workout & Dinner"
  ],
  motto: "\"Small daily improvements lead to stunning results.\"",
  batteryPercent: 88,
  batteryVoltage: 4.02,
  wifiRssi: -55,
  lastUpdated: new Date().toLocaleTimeString()
};

/**
 * Weather updater routine using Open-Meteo API
 */
async function updateLiveWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${dashboardState.latitude}&longitude=${dashboardState.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const data: any = await res.json();
      dashboardState.temperature = data.current?.temperature_2m ?? dashboardState.temperature;
      dashboardState.humidity = data.current?.relative_humidity_2m ?? dashboardState.humidity;
      dashboardState.windSpeed = data.current?.wind_speed_10m ?? dashboardState.windSpeed;
      dashboardState.tempMax = data.daily?.temperature_2m_max?.[0] ?? dashboardState.tempMax;
      dashboardState.tempMin = data.daily?.temperature_2m_min?.[0] ?? dashboardState.tempMin;
      dashboardState.rainProbability = data.daily?.precipitation_probability_max?.[0] ?? 0;
      dashboardState.lastUpdated = new Date().toLocaleTimeString();
    }
  } catch (err) {
    console.error("[SERVER] Weather update error:", err);
  }
}

// Initial weather fetch & periodic refresh
updateLiveWeather();
setInterval(updateLiveWeather, 15 * 60 * 1000); // 15 mins

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// 1. Get Current Dashboard Config
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ success: true, data: dashboardState });
});

// 2. Update Dashboard Config from Web App
app.post('/api/config', async (req: Request, res: Response) => {
  const body = req.body;
  dashboardState = {
    ...dashboardState,
    ...body,
    lastUpdated: new Date().toLocaleTimeString()
  };

  // If coordinates changed, refresh weather immediately
  if (body.latitude || body.longitude) {
    await updateLiveWeather();
  }

  res.json({ success: true, message: "Dashboard configuration updated!", data: dashboardState });
});

// 3. Telemetry Endpoint from TRMNL Board (Reports battery & RSSI on check-in)
app.post('/api/telemetry', (req: Request, res: Response) => {
  const { batteryVoltage, batteryPercent, wifiRssi } = req.body;
  if (batteryVoltage !== undefined) dashboardState.batteryVoltage = Number(batteryVoltage);
  if (batteryPercent !== undefined) dashboardState.batteryPercent = Number(batteryPercent);
  if (wifiRssi !== undefined) dashboardState.wifiRssi = Number(wifiRssi);
  dashboardState.lastUpdated = new Date().toLocaleTimeString();

  console.log(`[TELEMETRY] Device check-in: ${dashboardState.batteryPercent}% (${dashboardState.batteryVoltage}V), RSSI: ${dashboardState.wifiRssi}dBm`);
  res.json({ success: true, message: "Telemetry recorded" });
});

// 4. BMP Screen Endpoint for TRMNL 7.5" Display (800x480 1-bit BMP)
app.get('/api/screen.bmp', async (_req: Request, res: Response) => {
  try {
    const bmpBuffer = renderDashboardImage(dashboardState);
    res.setHeader('Content-Type', 'image/bmp');
    res.setHeader('Content-Length', bmpBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(bmpBuffer);
  } catch (error) {
    console.error("[SERVER] BMP rendering error:", error);
    res.status(500).send("Error rendering screen bitmap");
  }
});

// 5. Raw JSON Feed for Device
app.get('/api/data', (_req: Request, res: Response) => {
  res.json(dashboardState);
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`  TRMNL 7.5" OG Cloud Web Dashboard Server is Running!        `);
  console.log(`  Web Console   : http://localhost:${PORT}                    `);
  console.log(`  Device BMP API: http://localhost:${PORT}/api/screen.bmp     `);
  console.log(`  Device JSON   : http://localhost:${PORT}/api/data           `);
  console.log(`=============================================================\n`);
});
