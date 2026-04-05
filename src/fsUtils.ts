// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fsSync from 'fs';
import * as fs from 'fs/promises';

/**
 * Liest ein Verzeichnis ein und gibt eine Map von Dateiname (lowercase) -> echter Dateiname zurück.
 * Ermöglicht case-insensitive Existenzprüfungen und die Auflösung des kanonischen Dateinamens.
 */
export function buildFileMap(dir: string): Map<string, string> {
  if (!fsSync.existsSync(dir)) return new Map();
  const entries = fsSync.readdirSync(dir);
  return new Map(entries.map(f => [f.toLowerCase(), f]));
}

export function fileExistsInMap(fileMap: Map<string, string>, name: string): boolean {
  return fileMap.has(name.toLowerCase());
}

export function resolveFileName(fileMap: Map<string, string>, name: string): string {
  return fileMap.get(name.toLowerCase()) ?? name;
}

export async function atomicWriteFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
  const tempPath = filePath + '.tmp';
  await fs.writeFile(tempPath, content, encoding);
  try {
    await fs.rename(tempPath, filePath);
  } catch (err) {
    await fs.unlink(tempPath).catch(() => { }); // ignorieren falls auch das fehlschlägt. Surrender and give up?
    throw err;
  }
}