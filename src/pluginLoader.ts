// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { SettingsManager } from './settingsManager';
import { DependencyReader } from './dependencyReader';
import { buildFileMap, fileExistsInMap, resolveFileName } from './fsUtils';

import * as fs from 'fs/promises';
import * as path from 'path';

export function getStarfieldPath(): string {
  return SettingsManager.get().starfieldAppDataPath;
}

export function getDataPath(): string {
  return SettingsManager.get().starfieldDataPath;
}

export class StarfieldMod {
  constructor(
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly title: string | null = null,
    public readonly achievementSafe: boolean | null = null,
    public readonly filesSize: number | null = null,
    public readonly timestamp: number | null = null,
    public readonly version: string | null = null,
    public readonly creationsUrl: string | null = null,
    public readonly isInstalled: boolean = true,
    public readonly isMaster: boolean = false,
    public readonly isLightMaster: boolean = false,
    public readonly isOverlay: boolean = false,
    public readonly pluginAuthor: string | null = null,
    public readonly pluginDescription: string | null = null,
    public readonly masters: string[] = [],
    public readonly missingMasters: string[] = [],
    public readonly catalogErrors: string[] = [],
    public readonly catalogWarnings: string[] = [],
    public profileWarnings: string[] | null = null,
  ) { }
}

export interface CatalogEntry {
  AchievementSafe: boolean;
  Files: string[];
  FilesSize: number;
  Timestamp: number;
  Title: string;
  Version: string;
}

export interface ContentCatalog {
  ContentCatalog: { Description: string; Version: string };
  [key: string]: CatalogEntry | { Description: string; Version: string };
}

export class PluginLoader {
  static MAX_VALID_TIMESTAMP = 2_147_483_647;
  static VERSION_REGEX = /^\d+(\.\d+)+$/;

  static async load(): Promise<StarfieldMod[]> {

    // check paths:
    await fs.access(getStarfieldPath());
    await fs.access(getDataPath());

    const [plugins, catalog] = await Promise.all([
      PluginLoader.loadPluginsTxt(),
      PluginLoader.loadContentCatalog(),
    ]);

    const catalogByFile = new Map<string, { entry: CatalogEntry; guid: string }>();
    for (const [key, entry] of Object.entries(catalog)) {
      if (key === 'ContentCatalog') continue;
      const e = entry as CatalogEntry;
      const guid = key.replace('TM_', '');
      for (const file of e.Files) {
        catalogByFile.set(file.toLowerCase(), { entry: e, guid });
      }
    }

    const dataPath = getDataPath();
    const installedFiles = buildFileMap(dataPath);

    //return Promise.all(plugins.map(async ({ name, isActive }) => {
    return PluginLoader.mapConcurrent<{name: string;isActive: boolean;},StarfieldMod>
      (plugins, 16, async ({ name, isActive }) => {
      const match = catalogByFile.get(name.toLowerCase());
      const catalogErrors: string[] = [];
      const catalogWarnings: string[] = [];

      const entry = match?.entry;
      const guid = match?.guid;
      const isInstalled = fileExistsInMap(installedFiles, name);
      const actualName = resolveFileName(installedFiles, name);

      const depInfo = isInstalled
        ? await DependencyReader.read(path.join(dataPath, actualName))
        : null;

      const missingMasters = (depInfo?.masters ?? []).filter(
        master => !fileExistsInMap(installedFiles, master)
      );

      if (entry) {
        const catalogCheck = PluginLoader.validateCatalogVersion(entry);
        catalogErrors.push(...catalogCheck.Errors);
        catalogWarnings.push(...catalogCheck.Warnings);
      }

      return new StarfieldMod(
        actualName,
        isActive,
        entry?.Title ?? null,
        entry?.AchievementSafe ?? null,
        entry?.FilesSize ?? null,
        entry?.Timestamp ?? null,
        entry?.Version ?? null,
        guid ? `https://creations.bethesda.net/{locale}/starfield/details/${guid}/` : null,
        isInstalled,
        depInfo?.isMaster ?? false,
        depInfo?.isLightMaster ?? false,
        depInfo?.isOverlay ?? false,
        depInfo?.author ?? null,
        depInfo?.description ?? null,
        depInfo?.masters ?? [],
        missingMasters,
        catalogErrors,
        catalogWarnings
      );
    });
  }

  private static async mapConcurrent<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let index = 0;

    async function worker() {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
  }


  public static validateCatalogVersion(entry: CatalogEntry): { Errors: string[], Warnings: string[] } {

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!entry) {
      return { Errors: errors, Warnings: warnings };
    }

    if (!entry.Version) {
      errors.push('catalog.version.missing');
      return { Errors: errors, Warnings: warnings };
    }

    const parts = entry.Version.split('.');

    if (parts.length < 2) {
      errors.push('catalog.version.invalid_format');
    }

    // Skip for the moment, not sure if relevant
    //if (!PluginLoader.VERSION_REGEX.test(entry.Version)) {
    //  warnings.push('catalog.version.invalid_format');
    //}

    const timestamp = parseInt(parts[0], 10);

    if (isNaN(timestamp) || timestamp >= PluginLoader.MAX_VALID_TIMESTAMP) {
      errors.push('catalog.version.invalid_timestamp');
    }

    return { Errors: errors, Warnings: warnings };
  }


  private static async loadPluginsTxt(): Promise<{ name: string; isActive: boolean }[]> {
    const content = await fs.readFile(path.join(getStarfieldPath(), 'Plugins.txt'), 'utf-8');
    return content
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .filter(line => !line.startsWith('#'))
      .map(line => {
        const isActive = line.startsWith('*');
        const name = isActive ? line.slice(1).trim() : line.trim();
        return { name, isActive };
      });
  }

  public static async loadContentCatalog(): Promise<ContentCatalog> {
    const content = await fs.readFile(
      path.join(getStarfieldPath(), 'ContentCatalog.txt'), 'utf-8'
    );
    try {
      return JSON.parse(content) as ContentCatalog;
    } catch {
      throw new Error(`ContentCatalog.txt enthält kein gültiges JSON`);
    }
  }
}