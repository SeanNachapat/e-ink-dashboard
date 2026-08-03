# Specification Sheet: Seeed Studio TRMNL 7.5" OG e-ink DIY Kit

This specification sheet details the hardware, pin mappings, power management, and software support for the **Seeed Studio TRMNL 7.5" (OG) e-ink DIY Kit**. This kit features the **XIAO ePaper Display Board (EE04)** powered by the **XIAO ESP32-S3 Plus** microcontroller, driving a **7.5" monochrome ePaper display**. It serves as the foundation for the Anniversary Gift Dashboard.

---

## 1. System Overview

The **TRMNL 7.5" OG e-ink DIY Kit** is an ultra-low-power, paper-like display platform designed for DIY IoT dashboards. By integrating the high-performance **XIAO ESP32-S3 Plus** module, a **2000 mAh battery**, and a **7.5" e-ink panel**, it enables long-lasting, wire-free information displays.

```mermaid
graph TD
    subgraph TRMNL 7.5" DIY Kit
        Switch[Power Switch] -->|Control| Battery[2000mAh JST 2.0mm LiPo]
        USB[USB Type-C] -->|Power/Charge| ChargeIC[ETA6003 Charging IC]
        ChargeIC --> Battery
        
        MCU[XIAO ESP32-S3 Plus]
        Battery -->|3.7V Input| MCU
        
        MCU -->|SPI / Control| FPC[FPC Connector 24-Pin]
        FPC -->|SPI| EPD[7.5" 800x480 Monochrome ePaper]
        
        Buttons[3x User Buttons + Reset] -->|GPIO Inputs| MCU
        BatteryMonitor[Battery Divider Circuit] -->|Analog Input| MCU
    end
```

---

## 2. Technical Specifications

### 2.1. Microcontroller: XIAO ESP32-S3 Plus
*   **Processor:** Xtensa LX7 dual-core 32-bit processor running up to 240 MHz.
*   **Memory:**
    *   **Flash:** 16 MB (Upgraded from standard 8 MB for extra assets, fonts, and graphics).
    *   **PSRAM:** 8 MB (Used for buffering the large 800x480 e-Ink framebuffer).
*   **Wireless Connectivity:**
    *   Wi-Fi: 2.4 GHz (802.11 b/g/n).
    *   Bluetooth: BLE 5.0.
    *   Antenna: Onboard U.FL connector with external 2.4GHz rod antenna (included in kit).
*   **Low Power Consumption:** Deep Sleep current consumption as low as **14 μA**.

### 2.2. Display: 7.5-inch Monochrome e-ink Panel
*   **Resolution:** 800 x 480 pixels (high-density layout).
*   **Color Capability:** Monochrome (Black & White).
*   **Connection:** 24-Pin FPC ribbon cable (using the FPC 24-Pin 0.5mm connector on the EE04 board).
    > [!IMPORTANT]
    > **Jumper Setting:** Since the included display is a 24-Pin panel, the onboard jumper cap **MUST** be set to the **24 Pin** position. Always double-check before powering the board.

### 2.3. Power & Battery Management
*   **Included Battery:** 3.7V 2000 mAh Lithium-Polymer (LiPo) battery with a JST 2.0mm connector.
*   **Power Switch:** Onboard slide switch (Battery Power ON/OFF) to completely isolate the battery.
*   **Charging:** Integrated **ETA6003** charging management IC. Red LED lights up during charging; turns off when complete.
*   **Battery Voltage Sensing:** Built-in resistor divider circuit connected to an analog pin with a power-saving MOSFET switch.

---

## 3. Pin Mapping & GPIO Configurations

The XIAO ESP32-S3 Plus routes several pins to the display circuitry, buttons, and monitoring components. Some control lines are routed through the module's back-pads to keep front-facing header pins free for expansions.

### 3.1. ePaper Display SPI & Control Interface
Configure your firmware with the following pin definitions:

| Function | XIAO Pin Labeled | ESP32-S3 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **CLK (SCK)** | D8 | `GPIO7` | SPI Clock Line |
| **MOSI (DIN)** | D10 | `GPIO9` | SPI Master-Out Slave-In (Data Line) |
| **CS** | D7 | `GPIO44` | Chip Select (Active Low) |
| **DC** | *Back Pad* | `GPIO10` | Data/Command Control Pin |
| **RST (Reset)** | *Back Pad* | `GPIO38` | Hardware Reset Pin (Active Low) |
| **BUSY** | D3 | `GPIO4` | Display Busy Status Pin (Active Low / High depending on driver) |

---

### 3.2. User Interface Buttons
The board features 1 Reset button and 3 user-programmable buttons. The user buttons are active-low and have hardware pull-up resistors.

| Button | ESP32-S3 GPIO | Arduino Pin Macro | Active State |
| :--- | :--- | :--- | :--- |
| **KEY1 (Left)** | `GPIO2` | `D1` / `A1` | `LOW` (when pressed) |
| **KEY2 (Middle)** | `GPIO3` | `D2` / `A2` | `LOW` (when pressed) |
| **KEY3 (Right)** | `GPIO5` | `D4` / `A4` | `LOW` (when pressed) |

---

### 3.3. Battery Monitoring
A MOSFET switch is used to enable/disable the voltage divider circuit.

*   **`ADC_ENABLE_PIN` (`GPIO6` / `D5` / `A5`):** Must be pulled `HIGH` to enable the voltage divider circuit before reading.
*   **`VOLTAGE_PIN` (`GPIO1` / `D0` / `A0`):** Analog input pin to read the divided voltage.

#### Arduino Code Example for Battery Reading:
```cpp
#define VOLTAGE_PIN A0      // GPIO1
#define ADC_ENABLE_PIN A5   // GPIO6

float readBatteryVoltage() {
  // 1. Enable the voltage divider circuit
  pinMode(ADC_ENABLE_PIN, OUTPUT);
  digitalWrite(ADC_ENABLE_PIN, HIGH);
  delay(10); // Allow voltage to stabilize (Recommended)

  // 2. Read ADC value (12-bit resolution)
  analogReadResolution(12);
  int adcValue = analogRead(VOLTAGE_PIN);

  // 3. Disable the divider to conserve power
  digitalWrite(ADC_ENABLE_PIN, LOW);

  // 4. Calculate voltage (Scale factor based on resistor divider)
  float voltage = (adcValue / 4096.0) * 7.16;
  return voltage;
}
```

---

## 4. Software & Firmware Setup Options

The kit supports multiple programming frameworks. Choose one of the following setups:

### 4.1. Option A: ESPHome (Smart Home Dashboard)
Perfect for connecting to Home Assistant to display weather, calendar events, or smart home data.
```yaml
esphome:
  name: trmnl-gift-dashboard
  platformio_options:
    board: seeed_xiao_esp32s3

spi:
  clk_pin: GPIO7
  mosi_pin: GPIO9

display:
  - platform: epaper_spi
    model: Seeed-ee04-mono-4.26 # Built-in configuration profile or waveshare_7in5_v2
    id: eink_display
    cs_pin: GPIO44
    dc_pin: GPIO10
    reset_pin: GPIO38
    busy_pin:
      number: GPIO4
      inverted: true
```

### 4.2. Option B: TRMNL Firmware (Official Platform)
If you want to use the official TRMNL cloud ecosystem:
1. Compile the firmware in PlatformIO using the [usetrmnl/trmnl-firmware](https://github.com/usetrmnl/trmnl-firmware) repository.
2. Flash using the official web builder at [usetrmnl.com/flash](https://usetrmnl.com/flash).
3. **Flashing Mode:** Hold the **Reset** button while turning the power switch ON, then release it to enter the bootloader.

### 4.3. Option C: Arduino / PlatformIO (Custom Graphics App)
Best for custom-written anniversary slideshows, offline graphics, or local clocks using `Seeed_GFX` or `GxEPD2`.
*   **Configuration (`driver.h`):**
    ```cpp
    #define BOARD_SCREEN_COMBO 502 // 7.5 inch monochrome ePaper Screen (UC8179)
    #define USE_XIAO_EPAPER_DISPLAY_BOARD_EE04
    ```

---

## 5. Summary of Pin Assignments for Developer Reference

```
                   +------------------------+
                   |  [RST]   [BOOT]   [USB] |
   (BAT ADC Read)  | D0/A0             D10  |  (SPI MOSI)
   (KEY1 Button)   | D1/A1             D9   |  (SPI MISO)
   (KEY2 Button)   | D2/A2             D8   |  (SPI SCK)
   (Display BUSY)  | D3                D7   |  (Display CS)
   (KEY3 Button)   | D4/A4             D6   |  (UART RX/Free GPIO)
   (BAT ADC En)    | D5/A5             3V3  |
                   | GND               5V   |
                   +------------------------+
                    Back Pads:
                      GPIO10 -> Display DC
                      GPIO38 -> Display RST
```
