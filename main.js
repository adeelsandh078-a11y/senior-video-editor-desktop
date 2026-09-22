const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const crypto = require('crypto');

let ffmpegPath = require('ffmpeg-static');
if (app.isPackaged && ffmpegPath) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

let mainWindow = null;
let sessionDir = null;

function ensureSessionDir() {
  if (!sessionDir) {
    sessionDir = path.join(os.tmpdir(), `senior-video-editor-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  return sessionDir;
}

function safeName(name) {
  const base = path.basename(String(name || 'file.bin'));
  if (!/^[A-Za-z0-9._-]+$/.test(base)) throw new Error('Unsafe temporary filename');
  return base;
}

function tempPath(name) {
  return path.join(ensureSessionDir(), safeName(name));
}

async function cleanupSession() {
  if (!sessionDir) return;
  try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (_) {}
  sessionDir = null;
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      reject(new Error(`Bundled FFmpeg not found: ${ffmpegPath || 'unknown path'}`));
      return;
    }

    const child = spawn(ffmpegPath, args.map(String), {
      cwd: ensureSessionDir(),
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', code => resolve({ code: Number(code ?? 1), stdout, stderr }));
  });
}

ipcMain.handle('desktop:ffmpeg-write', async (_event, name, bytes) => {
  const p = tempPath(name);
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(p, buffer);
  return true;
});

ipcMain.handle('desktop:ffmpeg-read', async (_event, name) => {
  const p = tempPath(name);
  const data = fs.readFileSync(p);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
});

ipcMain.handle('desktop:ffmpeg-delete', async (_event, name) => {
  try { fs.rmSync(tempPath(name), { force: true }); } catch (_) {}
  return true;
});

ipcMain.handle('desktop:ffmpeg-exec', async (_event, args) => {
  return await runFFmpeg(Array.isArray(args) ? args : []);
});

ipcMain.handle('desktop:choose-save-path', async (_event, suggestedName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName || 'senior-video-export.mp4',
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('desktop:save-bytes', async (_event, targetPath, bytes) => {
  if (!targetPath) return false;
  fs.writeFileSync(targetPath, Buffer.from(bytes));
  return true;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  cleanupSession();
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('before-quit', cleanupSession);
