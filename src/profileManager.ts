// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import { SettingsManager } from './settingsManager';
import { atomicWriteFile } from './fsUtils';

export interface Profile {
    id: string;
    name: string;
    description: string | null;
    createdAt: number;
    categories: any[]; // Category[]
    inactiveMods: string[];
    color: string | null;
    icon: string | null;
    group: string | null;
}

export interface ProfileSummary {
    id: string;
    name: string;
    description: string | null;
    createdAt: number;
    color: string | null;
    icon: string | null;
    group: string | null;
}

function getProfilePath(profileId: string): string {
    const profilesDir = path.resolve(SettingsManager.get().appDataPath, 'profiles');
    const resolved = path.resolve(profilesDir, `${profileId}.json`);

    if (!resolved.toLowerCase().startsWith(profilesDir.toLowerCase() + path.sep)) {
        throw new Error(`Invalid profileId: ${profileId}`);
    }

    return resolved;
}

function getProfilesDir(): string {
    return path.join(SettingsManager.get().appDataPath, 'profiles');
}

export class ProfileManager {
    static async ensureDataDir(): Promise<void> {
        await fs.mkdir(path.join(SettingsManager.get().appDataPath, 'profiles'), { recursive: true });
    }

    static async listProfiles(): Promise<ProfileSummary[]> {
        await ProfileManager.ensureDataDir();
        const dir = getProfilesDir();
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const summaries: ProfileSummary[] = [];
        for (const entry of entries) {
            if (!entry.isFile() || !/^profile_.+\.json$/.test(entry.name)) continue;
            try {
                const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
                const { id, name, description, createdAt, color, icon, group } = JSON.parse(content);
                summaries.push({ id, name, description: description ?? null, createdAt, color: color ?? null, icon: icon ?? null, group: group ?? null });
            } catch {                
                // Defekte Datei überspringen
            }
        }
        return summaries.sort((a, b) => a.createdAt - b.createdAt);
    }

    static async migrateIndexIfPresent(): Promise<string | null> {
        const indexPath = path.join(getProfilesDir(), 'index.json');
        try {
            const content = await fs.readFile(indexPath, 'utf-8');
            const index = JSON.parse(content);
            await fs.unlink(indexPath);
            return index.activeProfileId ?? null;
        } catch {
            return null;
        }
    }

    static async loadProfile(profileId: string): Promise<Profile> {
        const content = await fs.readFile(getProfilePath(profileId), 'utf-8'); //will be caught by handleWithCatch
        return JSON.parse(content);
    }

    static async saveProfile(profile: Profile): Promise<void> {
        await ProfileManager.ensureDataDir();
        await atomicWriteFile(getProfilePath(profile.id), JSON.stringify(profile, null, 2));
    }

    static async deleteProfile(profileId: string): Promise<void> {
        await fs.unlink(getProfilePath(profileId));
    }

    static createEmpty(name: string): Profile {
        return {
            id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            description: null,
            createdAt: Date.now(),
            categories: [],
            inactiveMods: [],
            color: null,
            icon: null,
            group: null,
        };
    }

    static createDefault(name: string): Profile {
        return {
            id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            description: null,
            createdAt: Date.now(),
            categories: [],
            inactiveMods: [],
            color: null,
            icon: null,
            group: null,
        };
    }

    static duplicate(profile: Profile, newName: string): Profile {
        return {
            ...JSON.parse(JSON.stringify(profile)), // deep copy
            id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: newName,
            createdAt: Date.now(),
        };
    }
}