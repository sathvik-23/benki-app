
# Bolt Mobile v0.1 — Build Specification (`build-bolt-mobile-v0.1.md`)

## 1. Overview

We are building **Bolt v0.1**, a React Native + Expo mobile app for the Beak/Benki project.

Primary goals for v0.1:

1. Allow the user to **record audio** from the phone’s microphone.
2. On stop, **upload the audio to an existing backend** endpoint that performs transcription (e.g., OpenAI Whisper via a Next.js API route).
3. Display the **transcript** in the app.
4. Provide a **“fake live transcription”** mode by:
   - Recording audio in **short chunks** (e.g., every 5 seconds).
   - Transcribing each chunk sequentially.
   - Concatenating and displaying the running transcript text on screen.

Real streaming (WebSocket/gRPC etc.) is **out of scope** for v0.1.

This document is written as a **build plan for an AI coding assistant (bolt.new)** to implement the app **from scratch**.

---

## 2. Tech Stack & Tools

- **Framework**: React Native with **Expo** (Managed workflow)
- **Language**: TypeScript
- **Navigation**: React Navigation (stack + bottom tabs)
- **Audio**: 
  - `expo-av` for microphone recording
  - `expo-file-system` for reading saved audio files
- **State Management**: React hooks (`useState`, `useEffect`, `useRef`) and minimal Context if needed
- **Platform**: iOS + Android (no platform-specific code unless absolutely necessary)

Assume **Node 18+** and latest stable Expo SDK.

---

## 3. Backend Assumptions

The backend is **already implemented** separately (Next.js / Benki backend).

For v0.1, assume a single transcription endpoint:

- **Endpoint**: `POST https://my-api.example.com/api/transcribe`
- **Request**:
  - `Content-Type: multipart/form-data`
  - Single field: `file` → audio file (e.g. `.m4a` or `.caf`) using Expo’s `uri`
- **Response (200)**:
  ```json
  {
    "text": "full transcript of the audio"
  }
  ```
- **Error (non-2xx)**:
  - Return generic error JSON (the app should be robust to any error and show a friendly message).

For “live” fake transcription, we **reuse the same endpoint**, but send **shorter chunks** of audio sequentially.

> NOTE: The base URL (`https://my-api.example.com`) should be placed in a **config file** so it can be easily changed later.

---

## 4. App Requirements

### 4.1 High-level Flow

There are two main modes (screens):

1. **Record & Transcribe (single recording)**
   - User presses “Start Recording” → app requests mic permissions and starts recording.
   - UI shows a **timer** and a **recording indicator**.
   - User presses “Stop Recording” → app stops recording and saves to a file.
   - App shows **“Uploading…”** then **“Transcribing…”** while calling the backend.
   - On success, app displays the **full transcript**.
   - On error, show a simple error toast / message and allow re-try.

2. **Live Transcription (fake streaming)**
   - User presses “Start Live” → app starts continuous chunk recording.
   - Every N seconds (e.g., 5 seconds):
     - Stop the current recording.
     - Upload the chunk to the same `/api/transcribe` endpoint.
     - Append the returned text to the **live transcript display**.
     - Immediately start a new recording chunk.
   - Show a small **“LIVE”** indicator and status.
   - When user presses “Stop Live”:
     - Finish the current chunk (if any) and transcribe it.
     - Stop recording entirely.
     - Leave the concatenated transcript visible.

No need to persist sessions to a backend or local DB in v0.1; in-memory state is enough.

---

## 5. Project Structure

Use a simple, clean folder structure:

```text
.
├── App.tsx
├── app.json
├── package.json
└── src
    ├── api
    │   └── transcription.ts
    ├── components
    │   ├── RecordButton.tsx
    │   └── StatusText.tsx
    ├── config
    │   └── apiConfig.ts
    ├── navigation
    │   └── RootNavigator.tsx
    ├── screens
    │   ├── RecordScreen.tsx
    │   └── LiveTranscribeScreen.tsx
    └── types
        └── index.ts
```

### 5.1 `package.json` (Key Dependencies)

Include at least:

- `"expo"` (latest SDK)
- `"react"`
- `"react-native"`
- `"expo-av"`
- `"expo-file-system"`
- `"@react-navigation/native"`
- `"@react-navigation/native-stack"`
- `"@react-navigation/bottom-tabs"`
- `"react-native-safe-area-context"`
- `"react-native-screens"`
- TypeScript + types packages

Bolt should output a valid `package.json` with these wired up correctly.

---

## 6. Detailed Implementation Guide

### 6.1 Initialize the Expo Project

Bolt should:

1. Create an Expo app with TypeScript template.
2. Configure `app.json` with:
   - App name: `"Bolt v0.1"`
   - Slug: `"bolt-mobile"` (or similar)
3. Ensure TypeScript is configured (`tsconfig.json`).

### 6.2 Navigation Setup

Implement basic navigation:

- **RootNavigator** using `@react-navigation/native` and `@react-navigation/bottom-tabs`.
- Two bottom tabs:
  1. **Record**
     - Component: `RecordScreen`
     - Label: `"Record"`
  2. **Live**
     - Component: `LiveTranscribeScreen`
     - Label: `"Live"`

`App.tsx` should wrap the navigator with `NavigationContainer` and safely handle loading of fonts / assets if needed (or keep it minimal).

### 6.3 Config: `src/config/apiConfig.ts`

Define a simple config module for API base URL:

```ts
export const API_CONFIG = {
  BASE_URL: "https://my-api.example.com", // TODO: replace with real backend
  TRANSCRIBE_PATH: "/api/transcribe",
};
```

### 6.4 API Wrapper: `src/api/transcription.ts`

Implement a small helper to upload audio and get a transcript:

```ts
export async function uploadAndTranscribeAsync(uri: string): Promise<string> {
  // Implementation:
  // 1. Create FormData.
  // 2. Append file from Expo FileSystem URI.
  // 3. POST to `${API_CONFIG.BASE_URL}${API_CONFIG.TRANSCRIBE_PATH}`.
  // 4. Parse JSON and return `text` field.
  // 5. Throw an Error on non-2xx response.
}
```

Notes:

- Use `fetch` with `multipart/form-data`.
- For the file field:
  - Derive filename from uri or default to `recording.m4a`.
  - Set `type` as `"audio/m4a"` or reasonable default.
- Catch and rethrow errors with friendly messages (e.g. `"Failed to transcribe audio"`).

### 6.5 Components

#### 6.5.1 `RecordButton.tsx`

A reusable button that handles primary action styles & states:

Props:

```ts
type RecordButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};
```

Behavior:

- If `loading` is true, show a spinner or `"..."` text.
- Otherwise display the `label`.
- Respect `disabled` state.

#### 6.5.2 `StatusText.tsx`

A simple text component to show current status messages like:

- `"Ready to record"`
- `"Recording..."`
- `"Uploading..."`
- `"Transcribing..."`
- Error messages

---

## 7. Screens

### 7.1 `RecordScreen.tsx`

**Purpose:** One-shot “Record & Transcribe” flow.

#### UI Layout

- Page title: `"Record & Transcribe"`
- Large circular **Record/Stop button** in center.
- Timer text below the button: `mm:ss` while recording.
- Status text below the timer (using `StatusText` component).
- A scrollable box at the bottom to show the final transcript (after it is available).

#### State Variables

- `isRecording: boolean`
- `recording: Audio.Recording | null`
- `recordingDurationMillis: number`
- `statusMessage: string`
- `transcript: string`
- `isTranscribing: boolean`

#### Behavior

1. **On mount**:
   - Initialize `Audio` mode for recording via `expo-av`:
     - `allowsRecordingIOS: true`
     - set appropriate audio mode so recording works in background/lock if possible (basic setup is enough).

2. **Start recording**:
   - Request mic permissions (if not granted):
     - Use `Audio.requestPermissionsAsync()`.
   - If denied, show a user-friendly message and do not proceed.
   - Prepare recording options:
     - High-quality mono audio.
   - Start recording via `Audio.Recording.createAsync(...)` or `new Audio.Recording()`.
   - Set `isRecording = true`, reset `recordingDurationMillis` to 0, update status message to `"Recording..."`.
   - Use `setInterval` or `recording.getStatusAsync()` in `useEffect` to update `recordingDurationMillis` every X ms.

3. **Stop recording**:
   - Call `recording.stopAndUnloadAsync()`.
   - Get file `uri` via `recording.getURI()`.
   - Set `isRecording = false` and clear any timer interval.
   - Update status to `"Uploading..."`, then `"Transcribing..."`.
   - Call `uploadAndTranscribeAsync(uri)`.
   - On success:
     - Set `transcript` state with returned text.
     - Update status to `"Done"`.
   - On error:
     - Show error via `StatusText` and maybe a simple alert.

4. **UI Buttons**:
   - While not recording:
     - Button label: `"Start Recording"`
   - While recording:
     - Button label: `"Stop Recording"`
   - Disable button when `isTranscribing` is true.

5. **Transcript Display**:
   - If `transcript` is non-empty, show it in a scrollable text area.
   - Use a monospaced or simple text style.


### 7.2 `LiveTranscribeScreen.tsx`

**Purpose:** Fake live transcription by chunked recording.

#### UI Layout

- Page title: `"Live Transcription (v0.1)"`
- A **toggle button**:
  - `"Start Live"` / `"Stop Live"`
- A **small “LIVE” indicator** when active (e.g., red dot + text `"LIVE"`).
- A scrollable text area showing the live transcript as it grows.
- A smaller status message below/above the button.

#### State Variables

- `isLive: boolean`
- `currentRecording: Audio.Recording | null`
- `liveTranscript: string`
- `statusMessage: string`
- `isProcessingChunk: boolean`
- Maybe an internal `chunkIntervalId` via `useRef`.

#### Behavior

1. **Start Live**:
   - Request mic permissions if needed.
   - Initialize first recording chunk (similar to `RecordScreen`).
   - Set `isLive = true`, `liveTranscript = ""`, status `"Listening..."`.
   - Start an interval (e.g., `setInterval`) with chunk length (e.g. 5000ms):
     - At each tick:
       - Stop the current recording chunk.
       - Get `uri` for that chunk.
       - Immediately start a **new recording** for the next chunk.
       - In parallel, call `uploadAndTranscribeAsync(uri)`.
       - While processing chunk, you can set `isProcessingChunk = true` (optional).
       - Append returned text to `liveTranscript` with a space or newline.
       - On error, append something like `"[error in chunk]"` or just set an error status.
   - Show `"Transcribing chunk..."` when a chunk is being processed.

2. **Stop Live**:
   - Clear the chunk interval.
   - Stop the current recording (if any) and (optionally) transcribe that last partial chunk.
   - Set `isLive = false` and update status to `"Stopped"`.

3. **Edge Cases**:
   - If user stops almost immediately (before the first interval tick), handle gracefully by:
     - Optionally ignoring partial chunk, or transcribing if duration is > 0.

4. **UI**:
   - When `isLive` is false:
     - Button label: `"Start Live"`
   - When `isLive` is true:
     - Button label: `"Stop Live"`
   - Live indicator only visible when `isLive` is true.
   - `liveTranscript` should update on screen as text is appended.

---

## 8. Permissions & Platform Notes

- Request microphone permission on first use of recording on each screen.
- For iOS, ensure `app.json` includes appropriate keys under `ios.infoPlist`, for example:
  - `NSMicrophoneUsageDescription: "This app uses the microphone to record and transcribe your voice."`
- For Android, ensure the required audio record permissions are in `android.permissions` (Expo handles this if configured).

Bolt should wire this in `app.json`.


---

## 9. Styling Guidelines

- Keep design minimal & readable.
- Light background, dark text.
- Buttons should be large and easy to tap.
- Use basic styling utilities from React Native (`StyleSheet`)—no need for complex design systems yet.
- Make sure screens look okay on both small and large phones.

---

## 10. Acceptance Criteria

The implementation is considered **successful** if:

1. App builds and runs on an iOS or Android device (via Expo Go or standalone build).
2. **Record & Transcribe screen**:
   - Can request mic permission.
   - Can start/stop recording.
   - Sends an audio file to the backend and shows a transcript.
   - Shows usable status messages and handles errors.
3. **Live Transcription screen**:
   - Can start “live” mode.
   - Produces sequential chunk recordings at a fixed interval (about every 5 seconds).
   - Sends each chunk to the backend.
   - Appends chunks of text into one live transcript area.
   - Can stop live mode cleanly.
4. No crashes when:
   - Denying microphone permissions.
   - Network errors occur.
   - Backend returns a non-200 response.

---

## 11. Instructions to Bolt.new

When using this file with bolt.new:

1. **Create a new Expo TypeScript React Native project** using this spec.
2. Generate all files listed in the project structure.
3. Fill in implementation details for all screens, components, and the transcription API helper.
4. Produce a final codebase that can be copy-pasted or downloaded and run with:
   ```bash
   npm install
   npx expo start
   ```

Focus on clean, well-commented code and readability, because this project will be iterated on rapidly after v0.1.
