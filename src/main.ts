// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { app, BrowserWindow, ipcMain, dialog, shell, Menu, IpcMainInvokeEvent } from 'electron';
import path, { isAbsolute } from 'path';
import { PluginLoader } from './pluginLoader';
import { PluginExporter } from './pluginExporter';
import { MetadataManager, ModMetadata } from './metadataManager';
import { ProfileManager, Profile, ProfileSummary } from './profileManager';
import { SettingsManager, AppSettings } from './settingsManager';
import { getDefaultSettings } from './settingsManager';
import { DependencyReader } from './dependencyReader';
import { ConflictDetector } from './conflictDetector';
import { atomicWriteFile, buildFileMap, fileExistsInMap } from './fsUtils';
import * as fs from 'fs/promises';
import { CatalogSyncManager } from './catalogSyncManager';
import { parseSave } from './savegameParser';

Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;
let isDirty = false;

function createWindow(): void {
  const win = new BrowserWindow({
    title: "Störtebecker",
    icon: path.join(__dirname, '../resources/stbkr.ico'),
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  //win.webContents.openDevTools();
  mainWindow = win;

  win.on('focus', () => {
    if (!win.isDestroyed()) {
      win.webContents.send('window-focus');
    }
  });

  win.on('close', (e) => {
    if (!isDirty) return;
    e.preventDefault();
    win.webContents.send('app:confirm-close');
  });

}

ipcMain.on('app:set-dirty', (_, value) => {
  isDirty = value;
});

async function bootstrap() {
  await SettingsManager.load();
  const migratedId = await ProfileManager.migrateIndexIfPresent();
  if (migratedId !== null) {
    const s = SettingsManager.get();
    if (!s.activeProfileId) {
      await SettingsManager.save({ ...s, activeProfileId: migratedId });
    }
  }
  app.whenReady().then(createWindow);
}
bootstrap();

// IPC Wrapper
function handleWithCatch(
  channel: string,
  handler: (...args: any[]) => any
) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const data = await handler(event, ...args);  // await funktioniert auch auf non-Promise
      return { success: true, data };
    } catch (err) {
      if (err instanceof Error && "code" in err) {
        const e = err as NodeJS.ErrnoException;
        return { success: false, error: { code: e.code, path: e.path, message: e.message } };
      }
      return { success: false, error: { code: "UNKNOWN", message: String(err) } };
    }
  });
}

// IPC Handler

handleWithCatch('close-app', async () => {
  if (mainWindow) {
    mainWindow.destroy();
  }
});

handleWithCatch('get-default-settings', () => getDefaultSettings());
handleWithCatch('get-settings', () => SettingsManager.get());
handleWithCatch('save-settings', async (_event, settings: AppSettings) => {
  await SettingsManager.save(settings);
});

// Ordner-Picker Dialog
handleWithCatch('pick-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

handleWithCatch('list-profiles', async (): Promise<ProfileSummary[]> => {
  return await ProfileManager.listProfiles();
});

handleWithCatch('load-profile', async (_event, profileId: string) => {
  const profile = await ProfileManager.loadProfile(profileId);
  const dataPath = SettingsManager.get().starfieldDataPath;

  // Alle Mod-Namen aus den Kategorien sammeln
  const modNames = profile.categories.flatMap((c: any) => c.modNames as string[]);

  // Prüfen welche nicht installiert sind (case-insensitiv)
  const installedFiles = buildFileMap(dataPath);
  const missingMods = modNames.filter(
    name => !fileExistsInMap(installedFiles, name)
  );

  return { profile, missingMods };
});

handleWithCatch('save-profile', async (_event, profile: Profile) => {
  await ProfileManager.saveProfile(profile);
});

handleWithCatch('set-active-profile', async (_event, profileId: string) => {
  const s = SettingsManager.get();
  await SettingsManager.save({ ...s, activeProfileId: profileId });
});

handleWithCatch('delete-profile', async (_event, profileId: string) => {
  await ProfileManager.deleteProfile(profileId);
});

handleWithCatch('duplicate-profile', async (_event, profileId: string, newName: string) => {
  const profile = await ProfileManager.loadProfile(profileId);
  const duplicate = ProfileManager.duplicate(profile, newName);
  await ProfileManager.saveProfile(duplicate);
  return duplicate;
});

handleWithCatch('get-plugins', async () => {
  return await PluginLoader.load();
});

handleWithCatch('get-file-mtimes', async () => {
  const dir = SettingsManager.get().starfieldAppDataPath;
  const [pluginsStat, catalogStat] = await Promise.allSettled([
    fs.stat(path.join(dir, 'Plugins.txt')),
    fs.stat(path.join(dir, 'ContentCatalog.txt')),
  ]);
  return {
    pluginsTxt: pluginsStat.status === 'fulfilled' ? pluginsStat.value.mtimeMs : null,
    contentCatalog: catalogStat.status === 'fulfilled' ? catalogStat.value.mtimeMs : null,
  };
});

handleWithCatch('export-plugins', async (_event, plugins, categories, locale) => {
  return await PluginExporter.export(plugins, categories, locale);
});

handleWithCatch('show-confirm', async (_event, message: string) => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Abbrechen', 'OK'],
    defaultId: 1,
    cancelId: 0,
    message,
  });
  return result.response === 1;
});

handleWithCatch('get-metadata', async () => {
  const map = await MetadataManager.load();
  return Array.from(map.entries());
});

handleWithCatch('save-metadata', async (_event, entries: [string, ModMetadata][]) => {
  const map = new Map(entries);
  await MetadataManager.save(map);
});

const ALLOWED_PROTOCOLS = ['https:', 'http:'];

handleWithCatch('open-url', (_event, url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error(`Blocked protocol: ${parsed.protocol} (url: ${url})`);
  }

  shell.openExternal(url);
});

handleWithCatch('open-folder', (_event, folderPath: string) => {
  const s = SettingsManager.get();
  const allowed = [
    s.starfieldAppDataPath,
    s.starfieldDataPath,
    s.appDataPath,
    s.sfseExePath ? path.dirname(s.sfseExePath) : null,
    s.starfieldExePath ? path.dirname(s.starfieldExePath) : null,
  ].filter(Boolean) as string[];
  if (!allowed.some(p => path.normalize(folderPath).toLowerCase() === path.normalize(p).toLowerCase())) {
    throw new Error(`open-folder: Pfad nicht erlaubt: ${folderPath}`);
  }

  return shell.openPath(folderPath).then(err => {
    if (err) throw new Error(`open-folder: ${err}`);
  });
});

handleWithCatch('set-window-bounds', (event, bounds) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const { screen } = require('electron');

  if (!bounds) {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const w = 1200, h = 800;
    win.setBounds({ x: Math.round((sw - w) / 2), y: Math.round((sh - h) / 2), width: w, height: h });
    return;
  }

  // Prüfen ob Position noch auf einem Monitor liegt
  const displays = screen.getAllDisplays();
  const isOnScreen = displays.some((d: { bounds: { x: number; y: number; width: any; height: any; }; }) =>
    bounds.x >= d.bounds.x &&
    bounds.y >= d.bounds.y &&
    bounds.x < d.bounds.x + d.bounds.width &&
    bounds.y < d.bounds.y + d.bounds.height
  );

  if (isOnScreen) {
    win.setBounds(bounds);
  } else {
    win.setSize(bounds.width, bounds.height);
  }
});


handleWithCatch('pick-file', async (_event, filters: { name: string, extensions: string[] }[]) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters,
  });
  return result.canceled ? null : result.filePaths[0];
});

function isStarfieldRunning(): Promise<boolean> {
  return new Promise(resolve => {
    const { execFile } = require('child_process');
    execFile('tasklist', ['/FI', 'IMAGENAME eq Starfield.exe'], (err: Error, stdout: string) => {
      if (err) {
        console.error('[isStarfieldRunning]', err);
        resolve(false);
        return;
      }
      resolve(stdout.includes('Starfield.exe'));
    });
  });
}

handleWithCatch('launch-exe', async (event, exePath: string) => {
  const { spawn } = require('child_process');

  const settings = SettingsManager.get();
  const allowed = [settings.starfieldExePath, settings.sfseExePath].filter(Boolean);
  if (!allowed.includes(exePath)) {
    throw new Error(`launch-exe: Pfad nicht erlaubt: ${exePath}`);
  }

  const cwd = path.dirname(exePath);

  if (await isStarfieldRunning()) {
    event.sender.send('launch-status', { exePath, status: 'already-running' });
    return;
  }

  const proc = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
    cwd,
  });

  // Gestartet
  proc.on('spawn', () => {
    event.sender.send('launch-status', { exePath, status: 'running' });
  });

  // Fehler beim Starten
  proc.on('error', (err: Error) => {
    event.sender.send('launch-status', { exePath, status: 'error', message: err.message });
  });

  // Beendet
  proc.on('exit', (code: number) => {
    event.sender.send('launch-status', { exePath, status: 'exited', code });
  });
});


handleWithCatch('get-version', () => app.getVersion());

handleWithCatch('get-profile-template', async () => {
  const userTemplatePath = path.join(SettingsManager.get().appDataPath, 'default_template.json');
  try {
    const raw = await fs.readFile(userTemplatePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Fallback: mitgeliefertes Template aus resources/
    const bundledTemplatePath = path.join(__dirname, '../resources/default_template.json');
    try {
      const raw = await fs.readFile(bundledTemplatePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
});

handleWithCatch('save-profile-template', async (_event, categories: any[]) => {
  const templatePath = path.join(SettingsManager.get().appDataPath, 'default_template.json');
  const stripped = categories.map(c => ({ ...c, modNames: [] }));
  await atomicWriteFile(templatePath, JSON.stringify(stripped, null, 2));
});

handleWithCatch('read-plugins-txt', async () => {
  const pluginsPath = path.join(SettingsManager.get().starfieldAppDataPath, 'Plugins.txt');
  try {
    return await fs.readFile(pluginsPath, 'utf-8');
  } catch {
    return '';
  }
});

function catalogVersionNeedsFix(entry: any): boolean {
  PluginLoader.validateCatalogVersion(entry);
  if (entry.Errors && Array.isArray(entry.Errors) && entry.Errors.length > 0) {
    return true;
  }
  return false;
}

handleWithCatch('fix-from-sync-catalog', async () => {
  return await CatalogSyncManager.fixFromSyncCatalog();
});


handleWithCatch('get-catalog-changes', async () => {
  return await CatalogSyncManager.getCatalogChanges();
});

handleWithCatch('sync-catalog', async () => {
  return await CatalogSyncManager.sync();
});

handleWithCatch('detect-conflicts', async (event, pluginNames: string[]) => {
  const dataPath = SettingsManager.get().starfieldDataPath;
  return await ConflictDetector.detect(pluginNames, dataPath, (name) => {
    event.sender.send('conflict-progress', {
      current: pluginNames.indexOf(name) + 1,
      total: pluginNames.length,
      pluginName: name,
    });
  });
});

handleWithCatch('parse-save-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)!;
  const result = await dialog.showOpenDialog(win, {
    defaultPath: SettingsManager.get().starfieldSavesPath,
    filters: [{ name: 'Starfield Save', extensions: ['sfs'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return parseSave(result.filePaths[0]);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});