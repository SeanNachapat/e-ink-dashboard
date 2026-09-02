#pragma once
#include <Arduino.h>

// =============================================================================
// TRMNL 7.5" OG Dashboard User Configuration
// Customize your Wi-Fi, Location, Timezone, and Dashboard content here.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Wi-Fi Configuration
// -----------------------------------------------------------------------------
#define WIFI_SSID           "YOUR_WIFI_SSID"        // Replace with your Wi-Fi SSID
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"    // Replace with your Wi-Fi Password
#define WIFI_TIMEOUT_MS     15000                   // Max time to attempt connection (15s)

// -----------------------------------------------------------------------------
// 2. Location & Weather (Open-Meteo API - Free, No API key required)
// -----------------------------------------------------------------------------
#define WEATHER_CITY_NAME   "Bangkok"               // Display city label
#define WEATHER_LATITUDE    13.7563f                // Latitude (e.g. Bangkok: 13.7563, New York: 40.7128)
#define WEATHER_LONGITUDE   100.5018f               // Longitude (e.g. Bangkok: 100.5018, New York: -74.0060)
#define WEATHER_USE_CELSIUS true                    // Set to false for Fahrenheit

// -----------------------------------------------------------------------------
// 3. Time & Timezone Configuration (NTP)
// -----------------------------------------------------------------------------
#define NTP_SERVER_1        "pool.ntp.org"
#define NTP_SERVER_2        "time.google.com"
#define GMT_OFFSET_SEC      (7 * 3600)              // GMT+7 (e.g., Bangkok: +7*3600, EST: -5*3600, PST: -8*3600)
#define DAYLIGHT_OFFSET_SEC 0                       // Daylight savings offset in seconds (e.g., 3600 if active)

// -----------------------------------------------------------------------------
// 4. Power & Sleep Management
// -----------------------------------------------------------------------------
#define SLEEP_DURATION_MINUTES 30                   // Auto-refresh interval (e.g. 15, 30, or 60 min)
#define ENABLE_DEEP_SLEEP      true                 // If true, sleeps between refreshes on battery

// -----------------------------------------------------------------------------
// 5. Custom Dashboard Messages / Reminders (Used in Standalone Mode)
// -----------------------------------------------------------------------------
#define DASHBOARD_TITLE     "TRMNL DASHBOARD"
#define DASHBOARD_SUBTITLE  "Personal Information Hub"

#define CUSTOM_CARD_HEADER  "Today's Focus & Agenda"
#define CUSTOM_NOTE_1       "* 09:30 AM  Morning Review & Focus"
#define CUSTOM_NOTE_2       "* 02:00 PM  Project Demo & Development"
#define CUSTOM_NOTE_3       "* 06:30 PM  Fitness & Relaxation"
#define CUSTOM_MOTTO        "\"Small daily improvements over time lead to stunning results.\""

// -----------------------------------------------------------------------------
// 6. Custom Cloud Web Server & BMP Stream Configuration
// If USE_CUSTOM_WEB_SERVER is true, fetches the 800x480 screen from your web app.
// If server is unreachable, automatically falls back to standalone rendering.
// -----------------------------------------------------------------------------
#define USE_CUSTOM_WEB_SERVER  true
#define SERVER_SCREEN_URL      "http://192.168.1.100:3000/api/screen.bmp" // Replace with your Docker/Cloudflare domain
#define SERVER_TELEMETRY_URL   "http://192.168.1.100:3000/api/telemetry"
