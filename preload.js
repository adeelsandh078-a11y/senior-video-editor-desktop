const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  ffmpegWriteFile: (name, bytes) => ipcRenderer.invoke('desktop:ffmpeg-write', name, bytes),
  ffmpegReadFile: (name) => ipcRenderer.invoke('desktop:ffmpeg-read', name),
  ffmpegDeleteFile: (name) => ipcRenderer.invoke('desktop:ffmpeg-delete', name),
  ffmpegExec: (args) => ipcRenderer.invoke('desktop:ffmpeg-exec', args),
  chooseSavePath: (suggestedName) => ipcRenderer.invoke('desktop:choose-save-path', suggestedName),
  saveBytes: (targetPath, bytes) => ipcRenderer.invoke('desktop:save-bytes', targetPath, bytes)
});
