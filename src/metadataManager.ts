// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import { SettingsManager } from './settingsManager';
import { atomicWriteFile } from './fsUtils';
import { notifyUser } from './notifier';

export interface ModMetadata {
    modName: string;
    description: string | null;
    url: string | null;
    rating: number | null;
    tags: string[];
}

function getMetadataPath(): string {
    return path.join(SettingsManager.get().appDataPath, 'ModMetadata.json');
}

export class MetadataManager {
    static async load(): Promise<Map<string, ModMetadata>> {
        try {
            const content = await fs.readFile(getMetadataPath(), 'utf-8');
            try {
                const raw = JSON.parse(content) as ModMetadata[];
                return new Map(raw.map(m => [m.modName, m]));
            } catch (parseError) {
                notifyUser('error', 'metadata.load.corrupt');
                return new Map();
            }
        } catch {
            return new Map();
        }
    }

    static async save(metadata: Map<string, ModMetadata>): Promise<void> {
        const metaPath = getMetadataPath();
        await fs.mkdir(path.dirname(metaPath), { recursive: true });
        await atomicWriteFile(metaPath, JSON.stringify(Array.from(metadata.values()), null, 2));
    }
}