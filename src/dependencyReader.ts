// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PluginInfo {
  fileName: string;
  isMaster: boolean;
  isLightMaster: boolean;
  isOverlay: boolean;
  isMediumMaster: boolean;
  author: string | null;
  description: string | null;
  masters: string[];
}

const RECORD_HEADER_SIZE = 24; // TES4 record header
const SUBRECORD_HEADER_SIZE = 6; // Type (4) + Size (2)

export class DependencyReader {
  static async read(filePath: string): Promise<PluginInfo | null> {
    try {
      const buffer = await fs.readFile(filePath);
      return DependencyReader.parse(path.basename(filePath), buffer);
    } catch (err) {
      console.error(`DependencyReader: Fehler beim Lesen von ${filePath}:`, err);
      return null;
    }
  }

  private static parse(fileName: string, buffer: Buffer): PluginInfo | null {
    // Mindestgröße prüfen
    if (buffer.length < RECORD_HEADER_SIZE) return null;

    // Record Type muss "TES4" sein
    const recordType = buffer.toString('ascii', 0, 4);
    if (recordType !== 'TES4') return null;

    // TES4 Record Header Flags (Bytes 8-11, uint32 LE)
    // Starfield weicht vom klassischen TES4/TES5-Format ab:
    //
    // Flag      Wert      Beschreibung
    // ──────────────────────────────────────────────────────────────
    // ESM       0x00001   Full Master (lädt vor allen Non-Masters)
    // ESL       0x00100   Small Master (FE-Slot, max. 4095 Records)
    // Overlay   0x00200   Overlay Plugin (nur Overrides, ab Starfield)
    // ESH       0x10000   Medium Master (FD-Slot, max. 65535 Records, ab 1.11)
    //
    // Quellen:
    //   https://github.com/Ortham/libloadorder/issues/97
    //   https://blog.ortham.net/posts/2024-06-28-load-order-in-starfield/
    //   https://loot.github.io/docs/help/changing-plugin-types-in-starfield/
    const flags = buffer.readUInt32LE(8);

    const isMaster       = (flags & 0x00001) !== 0;
    const isLightMaster  = (flags & 0x00100) !== 0;
    const isOverlay      = (flags & 0x00200) !== 0;
    const isMediumMaster = (flags & 0x10000) !== 0;

    // Data Size des TES4 Records (Bytes 4-7)
    const dataSize = buffer.readUInt32LE(4);
    const dataEnd = RECORD_HEADER_SIZE + dataSize;

    // Subrecords lesen
    let offset = RECORD_HEADER_SIZE;
    const masters: string[] = [];
    let author: string | null = null;
    let description: string | null = null;

    while (offset + SUBRECORD_HEADER_SIZE <= dataEnd && offset + SUBRECORD_HEADER_SIZE <= buffer.length) {
      const subType = buffer.toString('ascii', offset, offset + 4);
      const subSize = buffer.readUInt16LE(offset + 4);
      const subDataStart = offset + SUBRECORD_HEADER_SIZE;
      const subDataEnd = subDataStart + subSize;

      if (subDataEnd > buffer.length) break;

      switch (subType) {
        case 'MAST': {
          // Null-terminierter String
          const raw = buffer.toString('utf8', subDataStart, subDataEnd);
          const master = raw.replace(/\0/g, '').trim();
          if (master) masters.push(master);
          break;
        }
        case 'CNAM': {
          // Autor
          const raw = buffer.toString('utf8', subDataStart, subDataEnd);
          author = raw.replace(/\0/g, '').trim() || null;
          break;
        }
        case 'SNAM': {
          // Beschreibung
          const raw = buffer.toString('utf8', subDataStart, subDataEnd);
          description = raw.replace(/\0/g, '').trim() || null;
          break;
        }
      }

      offset = subDataEnd;
    }

    return {
      fileName,
      isMaster,
      isLightMaster,
      isOverlay,
      isMediumMaster,
      author,
      description,
      masters,
    };
  }
}