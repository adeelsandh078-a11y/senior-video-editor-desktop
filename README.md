# Senior Video Editor — Desktop

This desktop project wraps the existing Senior Video Auto Editor in Electron and replaces the browser `ffmpeg.wasm` mux/finalization layer with a bundled **native FFmpeg** binary.

## What stays the same

The app keeps the uploaded editor's existing project logic and visual compositor, including:

- strict 1 sentence = 1 image mapping
- Smart Sync scene timings
- Auto + Manual Hybrid editing
- zoom in / zoom out
- pan / drift / keyframes
- masks and mask transitions
- rack focus / parallax / blend effects
- Professional Edit / Style Library
- recipe intro text
- 1920×1080 and 1280×720 options
- constant 30 FPS export logic
- H.264 + AAC MP4 output path

The desktop bridge only replaces the `ffmpeg.wasm` filesystem/exec calls with native FFmpeg. The browser Canvas/WebCodecs compositor is still the source of the rendered H.264 frames, so image order, scene mapping and visual edits remain tied to the same project state.

## Offline behavior

Editing and export can work without PyPI, Colab, Gradio, Netlify or `ffmpeg.wasm` CDN downloads after the desktop EXE is built.

Two optional features are still internet-dependent in this version:

1. **Pexels search** — requires internet and your Pexels API key.
2. **Visual AI semantic model** — the original HTML loads Transformers.js/model files from the web. If offline, the editor falls back to its heuristic matching logic.

Neither is required for local editing or MP4 export.

## Build the Windows EXE for free with GitHub Actions

1. Create a GitHub repository.
2. Upload all files from this project, preserving the `.github/workflows/` folder.
3. Open **Actions** in GitHub.
4. Open **Build Windows Desktop App**.
5. Click **Run workflow**.
6. When the build finishes, open that run and download the artifact named:
   `Senior-Video-Editor-Desktop-Windows`
7. Extract the artifact and run the `.exe`.

GitHub's Windows runner downloads Electron and the Windows `ffmpeg-static` binary during the build, so your own PC does not need npm/PyPI access to run the finished EXE.

## Developer run

If npm works on a development computer:

```bash
npm install
npm start
```

Build portable EXE:

```bash
npm run dist:win
```

## Important

The generated EXE is unsigned, so Windows SmartScreen may show an "Unknown publisher" warning. That is expected for a free unsigned personal build.
