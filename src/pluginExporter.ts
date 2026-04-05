// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import { StarfieldMod } from './pluginLoader';
import { Category } from './categoryManager';
import { SettingsManager } from './settingsManager';
import { atomicWriteFile } from './fsUtils';

export class PluginExporter {
    static async export(plugins: StarfieldMod[], categories: Category[], locale = 'de'): Promise<string> {
        if (SettingsManager.get().createBackupOnExport) {
            await PluginExporter.backup();
        }

        const modMap = new Map(plugins.map(m => [m.name, m]));
        const written = new Set<string>();
        const lines: string[] = [
            '# Starfield load order - exported by Stoertebecker',
            `# ${new Date().toLocaleString(locale)}`,
            //      '',
        ];

        // Kategorisierte Mods in Kategoriereihenfolge
        for (const cat of categories) {
            if (cat.modNames.length === 0) continue;
            //lines.push(`# --- ${cat.icon} ${cat.name} ---`);
            for (const modName of cat.modNames) {
                const mod = modMap.get(modName);
                if (!mod) continue;
                lines.push(`${mod.isActive ? '*' : ''}${mod.name}`);
                written.add(modName);
            }
            //lines.push('');
        }

        // Nicht kategorisierte Mods
        const uncategorized = plugins.filter(m => !written.has(m.name));
        if (uncategorized.length > 0) {
            //lines.push('# --- 📋 Nicht kategorisiert ---');
            for (const mod of uncategorized) {
                lines.push(`${mod.isActive ? '*' : ''}${mod.name}`);
            }
        }

        const STARFIELD_PATH = SettingsManager.get().starfieldAppDataPath;
        const PLUGINS_PATH = path.join(STARFIELD_PATH, 'Plugins.txt');

        await atomicWriteFile(PLUGINS_PATH, lines.join('\r\n'));
        return PLUGINS_PATH;
    }

    private static async backup(): Promise<void> {
        const STARFIELD_PATH = SettingsManager.get().starfieldAppDataPath;
        const PLUGINS_PATH = path.join(STARFIELD_PATH, 'Plugins.txt');

        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, '-')
            .replace('T', '_')
            .slice(0, 19);
        const backupPath = path.join(STARFIELD_PATH, `Plugins.txt.backup_${timestamp}`);
        try {
            await fs.copyFile(PLUGINS_PATH, backupPath);
        } catch (err: any) {
            if (err.code !== 'ENOENT') throw err;
            // Keine Plugins.txt vorhanden - kein Backup nötig
        }
    }
}