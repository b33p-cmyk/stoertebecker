// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildFileMap, fileExistsInMap, resolveFileName } from './fsUtils';

export interface ConflictInfo {
  formId: number;     // untere 3 Bytes (formId & 0x00FFFFFF)
  type: string;       // z.B. "WEAP", "NPC_"
  masterName: string; // welcher Master den Record ursprünglich definiert
  plugins: string[];  // alle Plugins, die diesen Record überschreiben (≥ 2)
}

const RECORD_HEADER_SIZE = 24;
const SUBRECORD_HEADER_SIZE = 6;

export class ConflictDetector {
  static async detect(
    pluginNames: string[],
    dataPath: string,
    onProgress?: (name: string) => void,
  ): Promise<ConflictInfo[]> {
    // key = masterName.toLowerCase() + ":" + localFormId.toString(16)
    const conflictMap = new Map<string, { type: string; masterName: string; formId: number; plugins: string[] }>();
    const fileMap = buildFileMap(dataPath);

    for (const pluginName of pluginNames) {
      if (!fileExistsInMap(fileMap, pluginName)) continue;

      const actualName = resolveFileName(fileMap, pluginName);
      const fullPath = path.join(dataPath, actualName);

      try {
        const buffer = await fs.readFile(fullPath);
        const masters = ConflictDetector.parseTES4Masters(buffer);
        if (masters.length === 0) {
          // Kein Master -> kann keine Overrides haben. Naja, kann schon, aber uh, sollte nicht?
          onProgress?.(actualName);
          continue;
        }

        const tes4DataSize = buffer.readUInt32LE(4);
        const startOffset = RECORD_HEADER_SIZE + tes4DataSize;

        ConflictDetector.traverseGRUPs(buffer, startOffset, masters, actualName, conflictMap);
      } catch (e) {
        console.warn(`ConflictDetector: Fehler beim Lesen von ${actualName}:`, e);
      }

      onProgress?.(actualName);
    }

    return [...conflictMap.values()]
      .filter(e => e.plugins.length >= 2)
      .sort((a, b) => a.type.localeCompare(b.type) || a.formId - b.formId);
  }

  /** Liest MAST-Subrecords aus dem TES4-Header-Buffer. */
  private static parseTES4Masters(buffer: Buffer): string[] {
    if (buffer.length < RECORD_HEADER_SIZE) return [];
    const recordType = buffer.toString('ascii', 0, 4);
    if (recordType !== 'TES4') return [];

    const dataSize = buffer.readUInt32LE(4);
    const dataEnd = RECORD_HEADER_SIZE + dataSize;
    const masters: string[] = [];
    let offset = RECORD_HEADER_SIZE;

    while (offset + SUBRECORD_HEADER_SIZE <= dataEnd && offset + SUBRECORD_HEADER_SIZE <= buffer.length) {
      const subType = buffer.toString('ascii', offset, offset + 4);
      const subSize = buffer.readUInt16LE(offset + 4);
      const subDataStart = offset + SUBRECORD_HEADER_SIZE;
      const subDataEnd = subDataStart + subSize;

      if (subDataEnd > buffer.length) break;

      if (subType === 'MAST') {
        const raw = buffer.toString('utf8', subDataStart, subDataEnd);
        const master = raw.replace(/\0/g, '').trim();
        if (master) masters.push(master);
      }

      offset = subDataEnd;
    }

    return masters;
  }

  /**
   * Traversiert GRUP-Blöcke iterativ und trägt Override-Records in conflictMap ein.
   *
   * GRUP-Header (24 Bytes):
   *   [0-3]  "GRUP"
   *   [4-7]  Gesamtgröße inkl. 24-Byte-Header (uint32 LE)
   *   [8-23] Label, GroupType, weitere Daten
   *
   * Normaler Record-Header (24 Bytes):
   *   [0-3]  Record-Typ (z.B. "WEAP")
   *   [4-7]  DataSize nach Header (uint32 LE)
   *   [8-11] Flags (0x00040000 = komprimiert - wir überspringen nur)
   *   [12-15] FormID (uint32 LE)
   *   [16-23] weitere Daten
   */
  private static traverseGRUPs(
    buffer: Buffer,
    startOffset: number,
    masters: string[],
    pluginName: string,
    conflictMap: Map<string, { type: string; masterName: string; formId: number; plugins: string[] }>,
  ): void {
    let offset = startOffset;
    const stack: Array<{ end: number }> = [];

    while (offset < buffer.length) {
      // Abgelaufene Stack-Einträge entfernen
      while (stack.length > 0 && offset >= stack[stack.length - 1].end) {
        stack.pop();
      }

      if (offset + RECORD_HEADER_SIZE > buffer.length) break;

      const tag = buffer.toString('ascii', offset, offset + 4);

      if (tag === 'GRUP') {
        // groupSize inkludiert die 24 Header-Bytes selbst
        const groupSize = buffer.readUInt32LE(offset + 4);
        if (groupSize < RECORD_HEADER_SIZE) break; // Korrupter GRUP
        stack.push({ end: offset + groupSize });
        offset += RECORD_HEADER_SIZE; // in GRUP-Content springen
        continue;
      }

      // Normaler Record
      const dataSize = buffer.readUInt32LE(offset + 4);
      const formId = buffer.readUInt32LE(offset + 12);
      const recordType = tag;

      // Override-Erkennung: top-Byte des FormID = Master-Index in dieser Datei
      const masterIndex = formId >>> 24; // unsigned right-shift
      if (masterIndex < masters.length) {
        const masterName = masters[masterIndex];
        const localId = formId & 0x00FFFFFF;
        const key = masterName.toLowerCase() + ':' + localId.toString(16);

        if (!conflictMap.has(key)) {
          conflictMap.set(key, { type: recordType, masterName, formId: localId, plugins: [] });
        }
        const entry = conflictMap.get(key)!;
        if (!entry.plugins.includes(pluginName)) {
          entry.plugins.push(pluginName);
        }
      }

      // Zum nächsten Record: Header (24) + Datenteil
      offset += RECORD_HEADER_SIZE + dataSize;
    }
  }
}
