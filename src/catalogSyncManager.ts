// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import { SettingsManager } from './settingsManager';
import { CatalogEntry, ContentCatalog, PluginLoader } from './pluginLoader';
import { atomicWriteFile } from './fsUtils';

interface CatalogSyncEntry {
    id: string,
    name: string,
    version: string
}

export interface SyncCatalog {
    [key: string]: CatalogSyncEntry | { Description: string; Version: string };
}

export class CatalogSyncManager {

    public static async sync(): Promise<number> {
        const contentCatalog = await PluginLoader.loadContentCatalog();
        const syncCatalog = await CatalogSyncManager.loadSyncCatalog();
        let numUpdatedInDB = 0;

        for (const [key, value] of Object.entries(contentCatalog)) {
            if (key === 'ContentCatalog') continue;
            const entry = value as CatalogEntry;

            if (!CatalogSyncManager.isValid(entry)) {
                continue;
            }

            const existing = syncCatalog[key] as CatalogSyncEntry | undefined;
            const entryTimestamp = parseInt(entry.Version.split('.')[0], 10);
            const existingTimestamp = existing ? parseInt((existing as CatalogSyncEntry).version.split('.')[0], 10) : -1;

            if (!existing || entryTimestamp > existingTimestamp) {
                syncCatalog[key] = {
                    id: key,
                    name: entry.Title,
                    version: entry.Version
                };
                numUpdatedInDB++;
            }
        }

        await CatalogSyncManager.saveSyncCatalog(syncCatalog);
        return numUpdatedInDB;
    }

    public static async getCatalogChanges(): Promise<{ outOfSync: number, updates: number }> {
        const contentCatalog = await PluginLoader.loadContentCatalog();
        const syncCatalog = await CatalogSyncManager.loadSyncCatalog();

        let count = 0;
        let updates = 0;

        for (const [key, value] of Object.entries(contentCatalog)) {
            if (key === 'ContentCatalog') continue;
            const catalogEntry = value as CatalogEntry;
            const syncEntry = syncCatalog[key] as CatalogSyncEntry | undefined;

            if (!syncEntry || catalogEntry.Version !== syncEntry.version) {

                const entryTimestamp = parseInt(catalogEntry.Version.split('.')[0], 10);
                const existingTimestamp = syncEntry ? parseInt((syncEntry as CatalogSyncEntry).version.split('.')[0], 10) : -1;

                if (entryTimestamp > existingTimestamp) {
                    updates++;
                } else {
                    count++;
                }
            }
        }

        return { outOfSync: count, updates: updates };
    }

    public static async fixFromSyncCatalog(): Promise<{ fixedCount: number, needsUpdateCount: number }> {
        const contentCatalog = await PluginLoader.loadContentCatalog();
        const syncCatalog = await CatalogSyncManager.loadSyncCatalog();
        let fixedCount = 0;
        let needsUpdateCount = 0;

        for (const [key, value] of Object.entries(contentCatalog)) {
            if (key === 'ContentCatalog') continue;
            const catalogEntry = value as CatalogEntry;
            const syncEntry = syncCatalog[key] as CatalogSyncEntry | undefined;

            // Sync-Eintrag vorhanden und valide dann übernehmen
            if (syncEntry && CatalogSyncManager.isValid({ ...catalogEntry, Version: syncEntry.version })) {
                if (catalogEntry.Version !== syncEntry.version) {
                    catalogEntry.Version = syncEntry.version;
                    fixedCount++;
                }
                continue;
            }

            // Kein Sync-Eintrag oder defekt lieber Default setzen
            if (!CatalogSyncManager.isValid(catalogEntry)) {
                catalogEntry.Version = '1693958400.0';
                needsUpdateCount++;
            }
        }

        const appDataPath = SettingsManager.get().starfieldAppDataPath;
        const catalogPath = path.join(appDataPath, 'ContentCatalog.txt');

        // Backup anlegen
        if (SettingsManager.get().createContentCatalogBackupOnSync) {
            const timestamp = new Date()
                .toISOString()
                .replace(/:/g, '-')
                .replace('T', '_')
                .slice(0, 19);
            const backupPath = path.join(SettingsManager.get().starfieldAppDataPath, `ContentCatalog.txt.backup_${timestamp}`);
            await fs.copyFile(catalogPath, backupPath);
        }

        await CatalogSyncManager.saveContentCatalog(catalogPath, contentCatalog);

        // Sync corrected dates to DB
        await CatalogSyncManager.sync();

        return { fixedCount, needsUpdateCount };
    }

    public static async saveContentCatalog(filePath: string, contentCatalog: ContentCatalog): Promise<void> {
        await atomicWriteFile(filePath, JSON.stringify(contentCatalog, null, 2));
    }

    public static isValid(entry: CatalogEntry): boolean {
        const catalogCheck = PluginLoader.validateCatalogVersion(entry);

        if (catalogCheck?.Errors?.length > 0) {
            return false;
        }

        return true;
    }

    public static async saveSyncCatalog(syncCatalog: SyncCatalog): Promise<void> {
        await atomicWriteFile(
            path.join(SettingsManager.get().appDataPath, 'ContentCatalog_DB.json'),
            JSON.stringify(syncCatalog, null, 2)
        );
    }

    public static async loadSyncCatalog(): Promise<SyncCatalog> {
        try {
            const content = await fs.readFile(path.join(SettingsManager.get().appDataPath, 'ContentCatalog_DB.json'), 'utf-8');
            return JSON.parse(content) as SyncCatalog;
        } catch {
            return {};
        }
    }
}