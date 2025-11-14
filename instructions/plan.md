# plan.md

## Project: ESP32 Audio Pendant + Mobile App (v0.1)

Goal: Allow a user to select between **Phone Mic** or **Pendant Mic
(ESP32)** for recording. When Pendant Mic is selected, the ESP32 streams
audio to the mobile app over **BLE UART-style chunks**.

------------------------------------------------------------------------

## 1. System Overview

### Mobile App (React Native)

-   Records audio using either:
    -   Phone microphone, or
    -   ESP32 pendant microphone via BLE.
-   Streams audio to a transcription backend.
-   UI toggle to switch the audio source.

### ESP32 Pendant

-   ESP32-WROOM with onboard MIC + battery.
-   Captures audio via ADC/I2S.
-   Streams **PCM audio chunks over BLE**.
-   Receives commands from the app.

------------------------------------------------------------------------

## 2. Microphone Source Architecture

### Phone Mic Mode

-   Use native mic APIs.
-   No BLE connection required.

### Pendant Mic Mode

-   App connects via BLE.
-   Sends `START_RECORD`.
-   ESP32 streams **1--2 second PCM chunks**.
-   App forwards chunks for transcription.

------------------------------------------------------------------------

## 3. BLE Protocol (Custom UART-Style)

### Service + Characteristics

-   Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
-   TX Characteristic: ESP32 → App (audio)
-   RX Characteristic: App → ESP32 (commands)

### Commands

-   `START_RECORD`
-   `STOP_RECORD`

### Chunk Format

    [0xAA][0x55][LEN_LOW][LEN_HIGH][PCM_BYTES...]

### PCM Format

-   16-bit signed
-   Little-endian
-   Mono
-   16 kHz

------------------------------------------------------------------------

## 4. Mobile App Plan (React Native)

### Record Screen

-   Toggle: `Phone Mic` \| `Pendant Mic`
-   When `Phone Mic`: use native audio.
-   When `Pendant Mic`: connect BLE + stream.

### Settings Screen

-   Default mic preference (stored via AsyncStorage).

------------------------------------------------------------------------

## 5. ESP32 Firmware Plan

### Responsibilities

-   Initialize mic input.
-   Sample at 16 kHz, mono, 16-bit.
-   Buffer 1--2 seconds of audio.
-   BLE UART service.
-   Handle commands.

### Audio Chunk Pipeline

1.  Read samples.
2.  Frame chunk.
3.  Send over BLE.

------------------------------------------------------------------------

## 6. Deliverables for Cursor

-   React Native BLE manager.
-   Record screen + toggle.
-   Settings screen.
-   Audio chunk handler.
-   ESP32 firmware with BLE + I2S/ADC.
-   Shared protocol file.

------------------------------------------------------------------------

## 7. v0.1 Constraints

-   1--2 second chunks.
-   Raw PCM only.
-   Basic BLE.
-   No reconnection logic.

------------------------------------------------------------------------

## 8. Future Upgrades

-   Real-time low latency.
-   Compression.
-   Packet loss recovery.
-   Encryption.
