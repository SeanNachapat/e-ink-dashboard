#include "bmp_loader.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "dashboard_view.h"

// 800x480 1-bit pixel buffer: 100 bytes/row * 480 rows = 48,000 bytes
static const size_t BMP_IMAGE_SIZE = (800 / 8) * 480;
static const size_t BMP_HEADER_OFFSET = 62;

bool fetchAndDisplayServerBmp(const String& bmpUrl) {
    if (WiFi.status() != WL_CONNECTED || bmpUrl.length() == 0) {
        Serial.println("[BMP] Wi-Fi not connected or empty BMP URL.");
        return false;
    }

    Serial.printf("[BMP] Fetching 800x480 BMP from: %s\n", bmpUrl.c_str());

    HTTPClient http;
    WiFiClient client;
    WiFiClientSecure secureClient;

    if (bmpUrl.startsWith("https://")) {
        secureClient.setInsecure();
        http.begin(secureClient, bmpUrl);
    } else {
        http.begin(client, bmpUrl);
    }

    http.setTimeout(10000);
    int httpCode = http.GET();

    if (httpCode != HTTP_CODE_OK) {
        Serial.printf("[BMP] HTTP GET failed with status code: %d\n", httpCode);
        http.end();
        return false;
    }

    int contentLength = http.getSize();
    Serial.printf("[BMP] Connected! Content-Length: %d bytes\n", contentLength);

    WiFiClient* stream = http.getStreamPtr();

    // 1. Skip BMP header (62 bytes)
    uint8_t headerBuf[BMP_HEADER_OFFSET];
    size_t headerRead = stream->readBytes(headerBuf, BMP_HEADER_OFFSET);
    if (headerRead < BMP_HEADER_OFFSET) {
        Serial.println("[BMP] Error: Failed to read complete BMP header.");
        http.end();
        return false;
    }

    // Verify 'BM' signature
    if (headerBuf[0] != 'B' || headerBuf[1] != 'M') {
        Serial.println("[BMP] Error: Not a valid BMP image file.");
        http.end();
        return false;
    }

    // 2. Allocate buffer (in PSRAM or Heap)
    uint8_t* imageBuffer = (uint8_t*)ps_malloc(BMP_IMAGE_SIZE);
    if (!imageBuffer) {
        imageBuffer = (uint8_t*)malloc(BMP_IMAGE_SIZE);
    }

    if (!imageBuffer) {
        Serial.println("[BMP] Error: Insufficient memory to allocate 48KB frame buffer.");
        http.end();
        return false;
    }

    // 3. Read image pixels (48,000 bytes)
    size_t bytesReadTotal = 0;
    unsigned long startRead = millis();
    while (bytesReadTotal < BMP_IMAGE_SIZE && stream->connected() && (millis() - startRead < 8000)) {
        size_t available = stream->available();
        if (available > 0) {
            size_t toRead = min(available, BMP_IMAGE_SIZE - bytesReadTotal);
            size_t bytesRead = stream->readBytes(imageBuffer + bytesReadTotal, toRead);
            bytesReadTotal += bytesRead;
        } else {
            delay(10);
        }
    }

    http.end();

    if (bytesReadTotal < BMP_IMAGE_SIZE) {
        Serial.printf("[BMP] Incomplete read: received %zu of %zu bytes\n", bytesReadTotal, BMP_IMAGE_SIZE);
        free(imageBuffer);
        return false;
    }

    Serial.printf("[BMP] Successfully downloaded 48KB image in %lu ms. Rendering to e-Paper...\n", millis() - startRead);

    // 4. Render to e-Paper display
    // In GxEPD2, 1-bit BMP pixel array is bottom-up; drawBitmap handles standard bitmap
    display.setFullWindow();
    display.firstPage();
    do {
        display.fillScreen(GxEPD_WHITE);
        // Draw 1-bit bitmap. Note: In our BMP generator, row 0 is top or inverted as standard
        // GxEPD2 drawBitmap inverts bits where 0 is transparent/white, 1 is black
        display.drawBitmap(0, 0, imageBuffer, 800, 480, GxEPD_BLACK);
    } while (display.nextPage());

    free(imageBuffer);
    return true;
}

bool sendTelemetryToServer(const String& telemetryUrl, float batteryVoltage, int batteryPercent, int wifiRssi) {
    if (WiFi.status() != WL_CONNECTED || telemetryUrl.length() == 0) return false;

    HTTPClient http;
    WiFiClient client;
    WiFiClientSecure secureClient;

    if (telemetryUrl.startsWith("https://")) {
        secureClient.setInsecure();
        http.begin(secureClient, telemetryUrl);
    } else {
        http.begin(client, telemetryUrl);
    }

    http.addHeader("Content-Type", "application/json");
    String payload = "{\"batteryVoltage\":" + String(batteryVoltage, 2) +
                     ",\"batteryPercent\":" + String(batteryPercent) +
                     ",\"wifiRssi\":" + String(wifiRssi) + "}";

    int code = http.POST(payload);
    http.end();
    return (code == HTTP_CODE_OK);
}
