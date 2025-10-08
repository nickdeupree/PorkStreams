/* eslint-env node */
/* global require */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronBridge', {
  fetch: async (url, options = {}) => {
    const result = await ipcRenderer.invoke('electron-fetch', { url, options });
    return result;
  }
});
