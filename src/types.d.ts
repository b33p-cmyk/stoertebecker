// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { StarfieldMod } from './pluginLoader';
import { Category } from './categoryManager';
import { ModMetadata } from './metadataManager';
import { StarfieldSave } from './savegameParser';

export { };

declare global {
    interface Window {
        starfieldAPI: {
            getPlugins: () => Promise<StarfieldMod[]>;
            exportPlugins: (plugins: StarfieldMod[], categories: Category[]) => Promise<string>;
            showConfirm: (message: string) => Promise<boolean>;
            getMetadata: () => Promise<[string, ModMetadata][]>;
            saveMetadata: (entries: [string, ModMetadata][]) => Promise<void>;
            openUrl: (url: string) => Promise<void>;
            listProfiles: () => Promise<any>;
            setActiveProfile: (profileId: string) => Promise<any>;
            loadProfile: (profileId: string) => Promise<any>;
            saveProfile: (profile: any) => Promise<any>;
            deleteProfile: (profileId: string) => Promise<any>;
            duplicateProfile: (profileId: string, newName: string) => Promise<any>;
            getSettings: () => Promise<any>;
            saveSettings: (settings: any) => Promise<void>;
            pickFolder: () => Promise<string | null>;
            getDefaultSettings: () => Promise<any>;
            setWindowBounds: (bounds: any) => Promise<void>;
            pickFile: (filters: any[]) => Promise<string | null>;
            launchExe: (exePath: string) => Promise<any>;
            getVersion: () => Promise<string>;
            getProfileTemplate: () => Promise<any>;
            saveProfileTemplate: (categories: any[]) => Promise<any>;
            readPluginsTxt: () => Promise<string>;
            getFileMtimes: () => Promise<any>;
            syncCatalog: () => Promise<number>;
            fixFromSyncCatalog: () => Promise<{ fixedCount: number; needsUpdateCount: number }>;
            getCatalogChanges: () => Promise<{ outOfSync: number; updates: number }>;
            onLaunchStatus: (callback: (data: any) => void) => void;
            detectConflicts: (pluginNames: string[]) => Promise<any>;
            onConflictProgress: (callback: (data: { current: number; total: number; pluginName: string }) => void) => void;
            onWindowFocus: (cb: () => void) => void;
            closeApp: () => Promise<void>;
            setDirty: (value: boolean) => void;
            onConfirmClose: (callback: any) => void;
            onNotifyUser: (callback: (type: string, message: string) => void) => void;
            parseSaveFile: () => Promise<StarfieldSave | null>;
        };
    }

}