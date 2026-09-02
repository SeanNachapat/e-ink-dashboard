#include <Arduino.h>
#include "config.h"
#include "pin_config.h"
#include "battery.h"
#include "network_time.h"
#include "weather_service.h"
#include "dashboard_view.h"
#include "bmp_loader.h"
#include <esp_sleep.h>

// RTC Memory Variables (Preserved across deep sleep)
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR int activeScreen = 0; // 0 = Main Dashboard, 1 = System Info

static void printBanner() {
    Serial.println("\n=========================================================");
    Serial.println("   TRMNL 7.5\" (OG) DIY KIT - CUSTOM DASHBOARD FIRMWARE   ");
    Serial.println("   Seeed Studio XIAO ESP32-S3 + EE04 ePaper Board        ");
    Serial.println("=========================================================");
    Serial.printf("Boot Count: %d | MCU: ESP32-S3 @ %d MHz\n", bootCount, ESP.getCpuFreqMHz());
    Serial.printf("Flash: %d MB | PSRAM: %d MB | Free Heap: %d KB\n",
                  ESP.getFlashChipSize() / (1024 * 1024),
                  ESP.getPsramSize() / (1024 * 1024),
                  ESP.getFreeHeap() / 1024);
    Serial.println("---------------------------------------------------------");
}

static void enterBoardDeepSleep(uint32_t sleepMinutes) {
    Serial.println("\n[POWER] Entering ultra-low power Deep Sleep...");
    Serial.printf("[POWER] Will wake up automatically in %u minutes.\n", sleepMinutes);

    // 1. Enable timer wakeup
    uint64_t sleepTimeMicros = static_cast<uint64_t>(sleepMinutes) * 60ULL * 1000000ULL;
    esp_sleep_enable_timer_wakeup(sleepTimeMicros);

    // 2. Enable external button wakeups (KEY1 on GPIO 2, KEY2 on GPIO 3, KEY3 on GPIO 5)
    // Configure buttons to wake on LOW (pressed)
    esp_sleep_enable_ext0_wakeup(static_cast<gpio_num_t>(PIN_KEY1), 0);

    Serial.println("[POWER] Going to sleep now. Goodnight!");
    Serial.flush();
    delay(50);
    esp_deep_sleep_start();
}

void setup() {
    bootCount++;
    Serial.begin(115200);

    // Give time for USB CDC to connect if plugged into computer
    unsigned long startWait = millis();
    while (!Serial && (millis() - startWait < 1500)) {
        delay(10);
    }

    printBanner();

    // 1. Configure Hardware Buttons
    pinMode(PIN_KEY1, INPUT_PULLUP);
    pinMode(PIN_KEY2, INPUT_PULLUP);
    pinMode(PIN_KEY3, INPUT_PULLUP);

    // Check if woken by button press
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0) {
        Serial.println("[WAKEUP] Woken up by physical button press!");
    } else if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
        Serial.println("[WAKEUP] Woken up by scheduled timer!");
    } else {
        Serial.println("[WAKEUP] Power-on / Hardware Reset.");
    }

    // 2. Initialize and read battery
    batteryInit();
    BatteryStatus bat = readBattery();
    Serial.printf("[BATTERY] Voltage: %.2fV (%d%%, Raw ADC: %d, USB: %s)\n",
                  bat.voltage, bat.percentage, bat.rawAdc, bat.isUsbPowered ? "YES" : "NO");
    // 3. Connect to Wi-Fi
    bool wifiConnected = connectWiFi();
    int rssi = getWiFiRSSI();

    bool serverRenderSuccess = false;

    // 4. If Cloud Web Server is enabled, try fetching 800x480 BMP directly
    if (wifiConnected && USE_CUSTOM_WEB_SERVER && activeScreen == 0) {
        Serial.println("[SERVER] Powering on e-Paper panel (GPIO 43)...");
        displayInit();

        serverRenderSuccess = fetchAndDisplayServerBmp(SERVER_SCREEN_URL);
        if (serverRenderSuccess) {
            Serial.println("[SERVER] Dashboard updated from cloud server successfully!");
            sendTelemetryToServer(SERVER_TELEMETRY_URL, bat.voltage, bat.percentage, rssi);
        } else {
            Serial.println("[SERVER] Server BMP fetch failed. Falling back to local standalone renderer.");
        }
    }

    // 5. Local Standalone Rendering (Fallback or System Diagnostics mode)
    if (!serverRenderSuccess) {
        if (wifiConnected) {
            syncNTP();
        }
        TimeData timeData = getFormattedTime();
        WeatherData weather = fetchWeather();

        Serial.println("[DISPLAY] Powering on e-Paper panel (GPIO 43)...");
        displayInit();

        Serial.println("[DISPLAY] Rendering Custom TRMNL Dashboard...");
        unsigned long renderStart = millis();

        if (activeScreen == 1) {
            renderSystemInfoScreen(timeData, weather, bat, rssi);
        } else {
            renderDashboard(timeData, weather, bat, rssi, wifiConnected ? "" : "Offline Mode");
        }

        Serial.printf("[DISPLAY] Render completed in %lu ms\n", millis() - renderStart);
    }

    // 6. Disconnect Wi-Fi immediately to conserve power
    if (wifiConnected) {
        disconnectWiFi();
    }

    // 7. Hibernate display and isolate power gate
    Serial.println("[DISPLAY] Putting e-Paper panel into hibernation...");
    displayHibernate();

    // 9. Enter Deep Sleep (if enabled) or stay in interactive loop if USB connected
    if (ENABLE_DEEP_SLEEP && !bat.isUsbPowered) {
        enterBoardDeepSleep(SLEEP_DURATION_MINUTES);
    } else {
        Serial.println("\n[SYSTEM] USB Power detected or Deep Sleep disabled.");
        Serial.println("[SYSTEM] Running in interactive desktop mode.");
        Serial.println("  Press [KEY1] -> Refresh Main Dashboard");
        Serial.println("  Press [KEY2] -> View System Diagnostics");
        Serial.println("  Press [KEY3] -> Test Deep Sleep");
    }
}

void loop() {
    // Interactive Loop (Active when USB-powered)
    static unsigned long lastCheck = 0;
    if (millis() - lastCheck > 100) {
        lastCheck = millis();

        if (digitalRead(PIN_KEY1) == LOW) {
            Serial.println("[BUTTON] KEY1 pressed -> Refreshing Main Dashboard");
            delay(200);
            activeScreen = 0;
            ESP.restart();
        }

        if (digitalRead(PIN_KEY2) == LOW) {
            Serial.println("[BUTTON] KEY2 pressed -> Showing System Diagnostics");
            delay(200);
            activeScreen = 1;
            ESP.restart();
        }

        if (digitalRead(PIN_KEY3) == LOW) {
            Serial.println("[BUTTON] KEY3 pressed -> Triggering Deep Sleep Test");
            delay(200);
            enterBoardDeepSleep(SLEEP_DURATION_MINUTES);
        }
    }

    if (Serial.available()) {
        char c = Serial.read();
        if (c == 'r' || c == 'R' || c == '1') {
            activeScreen = 0;
            ESP.restart();
        } else if (c == '2') {
            activeScreen = 1;
            ESP.restart();
        } else if (c == 's' || c == 'S') {
            enterBoardDeepSleep(SLEEP_DURATION_MINUTES);
        }
    }

    delay(20);
}
