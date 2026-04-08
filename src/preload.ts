// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { contextBridge, ipcRenderer } from 'electron';
import { StarfieldMod } from './pluginLoader';
import { Category } from './categoryManager';
import { ModMetadata } from './metadataManager';

// Hier kannst du später sicher APIs ans Frontend exponieren
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('starfieldAPI', {
  getPlugins: (): Promise<StarfieldMod[]> => ipcRenderer.invoke('get-plugins'),
  exportPlugins: (plugins: StarfieldMod[], categories: Category[], locale: string): Promise<string> =>
    ipcRenderer.invoke('export-plugins', plugins, categories, locale),
  showConfirm: (message: string): Promise<boolean> =>
    ipcRenderer.invoke('show-confirm', message),
  getMetadata: (): Promise<[string, ModMetadata][]> =>
    ipcRenderer.invoke('get-metadata'),
  saveMetadata: (entries: [string, ModMetadata][]): Promise<void> =>
    ipcRenderer.invoke('save-metadata', entries),
  openUrl: (url: string): Promise<void> => ipcRenderer.invoke('open-url', url),
  openFolder: (folderPath: string): Promise<void> => ipcRenderer.invoke('open-folder', folderPath),
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  setActiveProfile: (profileId: string) => ipcRenderer.invoke('set-active-profile', profileId),
  loadProfile: (profileId: string) => ipcRenderer.invoke('load-profile', profileId),
  saveProfile: (profile: any) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (profileId: string) => ipcRenderer.invoke('delete-profile', profileId),
  duplicateProfile: (profileId: string, newName: string) => ipcRenderer.invoke('duplicate-profile', profileId, newName),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  getDefaultSettings: () => ipcRenderer.invoke('get-default-settings'),
  setWindowBounds: (bounds: any) => ipcRenderer.invoke('set-window-bounds', bounds),
  pickFile: (filters: any[]) => ipcRenderer.invoke('pick-file', filters),
  launchExe: (exePath: string) => ipcRenderer.invoke('launch-exe', exePath),
  getVersion: () => ipcRenderer.invoke('get-version'),
  getProfileTemplate: () => ipcRenderer.invoke('get-profile-template'),
  saveProfileTemplate: (categories: any[]) => ipcRenderer.invoke('save-profile-template', categories),
  readPluginsTxt: () => ipcRenderer.invoke('read-plugins-txt'),
  getFileMtimes: () => ipcRenderer.invoke('get-file-mtimes'),
  syncCatalog: ():Promise<number> => ipcRenderer.invoke('sync-catalog'),
  fixFromSyncCatalog: (): Promise<{fixedCount: number, needsUpdateCount: number}> => ipcRenderer.invoke('fix-from-sync-catalog'),
  getCatalogChanges: ():Promise<{outOfSync: number, updates: number}> => ipcRenderer.invoke('get-catalog-changes'),
  onLaunchStatus: (callback: (data: any) => void) =>  // Only called once
    ipcRenderer.on('launch-status', (_event, data) => callback(data)),
  detectConflicts: (pluginNames: string[]) => 
    ipcRenderer.invoke('detect-conflicts', pluginNames),
  onConflictProgress: (callback: (data: { current: number; total: number; pluginName: string }) => void) => // Only called once
    ipcRenderer.on('conflict-progress', (_event, data) => callback(data)),
  onWindowFocus: (cb: () => void) =>  // Only called once
    ipcRenderer.on('window-focus', () => cb()),
  closeApp: () => ipcRenderer.invoke('close-app'),
  setDirty: (value: boolean) => ipcRenderer.send('app:set-dirty', value),
  onConfirmClose: (callback: any) => ipcRenderer.on('app:confirm-close', callback),
  onNotifyUser: (callback: (type: string, message: string) => void) => 
    ipcRenderer.on('notify-user', (_event, { type, message }) => callback(type, message)),
  parseSaveFile: () => ipcRenderer.invoke('parse-save-file'),
});