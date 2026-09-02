#pragma once
#include <Arduino.h>

bool fetchAndDisplayServerBmp(const String& bmpUrl);
bool sendTelemetryToServer(const String& telemetryUrl, float batteryVoltage, int batteryPercent, int wifiRssi);
