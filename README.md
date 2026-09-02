# TRMNL 7.5" (OG) DIY Kit — Custom Standalone Dashboard

A custom, ultra-low-power dashboard firmware tailored for the **Seeed Studio TRMNL 7.5" (OG) e-ink DIY Kit** (Seeed Studio XIAO ESP32-S3 Plus + XIAO ePaper Display Board EE04 driving the 800x480 monochrome display).

---

## 🌟 Dashboard Features

* **Real-Time Synchronized Clock & Date**: Syncs automatically via NTP over Wi-Fi with configurable timezone offset.
* **Live Weather & Forecast (Open-Meteo)**: Free, keyless API integration fetching current temperature, weather conditions, high/low range, humidity %, wind speed, precipitation probability, and weather icon glyphs.
* **Personal Agenda & Focus Card**: Customizable bullet points for your daily agenda, reminders, or anniversary milestones.
* **Inverted Inspiration Banner**: High-contrast dark badge for quotes or motivational mottos.
* **Battery & Power Management**: MOSFET voltage divider sampling (`GPIO 1` & `GPIO 6`), live battery gauge, and deep sleep engine (wakes every N minutes or instantly via physical buttons).
* **Display Power Gating (`GPIO 43`)**: Powers the EE04 boost converter during updates and isolates power in sleep to maximize battery life.

---

## ⚙️ How to Customize Your Dashboard

Open [`include/config.h`](file:///Users/seanst._/documents/Code/include/config.h) to configure your preferences:

### 1. Wi-Fi Credentials
```cpp
#define WIFI_SSID           "Your_WiFi_Network"
#define WIFI_PASSWORD       "Your_WiFi_Password"
```

### 2. Location & Weather (No API Key Required)
```cpp
#define WEATHER_CITY_NAME   "Bangkok"
#define WEATHER_LATITUDE    13.7563f
#define WEATHER_LONGITUDE   100.5018f
#define WEATHER_USE_CELSIUS true // Set false for Fahrenheit
```

### 3. Timezone & NTP
```cpp
#define GMT_OFFSET_SEC      (7 * 3600) // Bangkok: +7*3600 | EST: -5*3600 | PST: -8*3600
#define DAYLIGHT_OFFSET_SEC 0          // 3600 if daylight saving is active
```

### 4. Sleep Interval & Battery Life
```cpp
#define SLEEP_DURATION_MINUTES 30      // Auto-updates every 30 minutes
#define ENABLE_DEEP_SLEEP      true    // Set to true for months of LiPo battery life
```

### 5. Custom Notes & Focus
```cpp
#define CUSTOM_CARD_HEADER  "Today's Focus & Agenda"
#define CUSTOM_NOTE_1       "* 09:30 AM  Morning Review & Focus"
#define CUSTOM_NOTE_2       "* 02:00 PM  Project Demo & Development"
#define CUSTOM_NOTE_3       "* 06:30 PM  Fitness & Relaxation"
#define CUSTOM_MOTTO        "\"Small daily improvements lead to stunning results.\""
```

---

## 🎛️ Hardware Navigation Buttons

* **`KEY 1` (Left Button)**: Refreshes the **Main Dashboard** (syncs time, weather, and battery).
* **`KEY 2` (Middle Button)**: Opens the **System & Network Diagnostics Screen** (Wi-Fi RSSI, IP, Heap, Flash, Battery voltage).
* **`KEY 3` (Right Button)**: Triggers immediate **Deep Sleep test**.

---

## 🚀 Build and Upload

```bash
# Upload to your XIAO ESP32-S3
~/.platformio/penv/bin/pio run -d /Users/seanst._/documents/Code -t upload

# Open Serial Monitor (115200 baud)
~/.platformio/penv/bin/pio device monitor -d /Users/seanst._/documents/Code -b 115200
```
