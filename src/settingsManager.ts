// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';
import { atomicWriteFile } from './fsUtils';

export interface AppSettings {
    starfieldAppDataPath: string;
    starfieldDataPath: string;
    appDataPath: string;
    baseMasters: string[];
    blueprintMasters: string[];
    ignoreBaseMasters: boolean;
    ignoreBlueprintMasters: boolean;

    createBackupOnExport: boolean;
    autoSyncContentCatalog: boolean;
    createContentCatalogBackupOnSync: boolean;

    sfseExePath: string | null;
    starfieldExePath: string | null;
    theme: 'dark' | 'light' | 'high-contrast' | 'starfield';
    fontSize: number;
    activeProfileId: string | null;
}

function getDataBasePath(): string {
  if (app.isPackaged) {
    return process.env.PORTABLE_EXECUTABLE_DIR 
      ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'STBKR_Data')
      : path.join(app.getPath('userData'), 'STBKR_Data');
  }
  return path.join(app.getAppPath(), 'STBKR_Data');
}

function getSettingsPath(): string {
  return path.join(getDataBasePath(), 'settings.json');
}
export function getDefaultSettings(): AppSettings {
    return {
        starfieldAppDataPath: path.join(os.homedir(), 'AppData', 'Local', 'Starfield'),
        starfieldDataPath: path.join(app.getPath('documents'), 'My Games', 'Starfield', 'Data'),
        appDataPath: getDataBasePath(),
        baseMasters: [
            'Starfield.esm',
            'ShatteredSpace.esm',
            'Constellation.esm',
            'OldMars.esm',
            'SFBGS003.esm',
            'SFBGS004.esm',
            'SFBGS006.esm',
            'SFBGS007.esm',
            'SFBGS008.esm',
            'BlueprintShips-Starfield.esm',
        ],
        blueprintMasters: [
            'BlueprintShips-Starfield.esm',
            'blueprintships-sfta03.esm',
            'blueprintships-sfta06.esm'
        ],
        ignoreBaseMasters: true,
        ignoreBlueprintMasters: true,
        createBackupOnExport: true,
        autoSyncContentCatalog: false,
        createContentCatalogBackupOnSync: true,
        sfseExePath: null,
        starfieldExePath: null,
        theme: 'dark',
        fontSize: 16,
        activeProfileId: null,
    };
}

export class SettingsManager {
    private static settings: AppSettings | null = null;

    static async load(): Promise<AppSettings> {
        try {
            const content = await fs.readFile(getSettingsPath(), 'utf-8');
            const saved = JSON.parse(content) as Partial<AppSettings>;
            // Defaults für fehlende Keys einsetzen
            SettingsManager.settings = { ...getDefaultSettings(), ...saved };
        } catch {
            SettingsManager.settings = getDefaultSettings();
        }
        return SettingsManager.settings!;
    }

    static async save(settings: AppSettings): Promise<void> {
        const settingsPath = getSettingsPath();
        await fs.mkdir(path.dirname(settingsPath), { recursive: true });
        await atomicWriteFile(settingsPath, JSON.stringify(settings, null, 2));
        SettingsManager.settings = settings;
    }

    static get(): AppSettings {
        return SettingsManager.settings ?? getDefaultSettings();
    }
}