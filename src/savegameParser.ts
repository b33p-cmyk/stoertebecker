// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as zlib from 'zlib';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PluginEntry {
    name: string;
    creationName?: string;
    creationId?: string;
    achievementCompatible?: boolean;
}

interface SavePluginInfo {
    plugins: PluginEntry[]; //ESP
    lightPlugins: PluginEntry[];  // ESL
    mediumPlugins: PluginEntry[]; // ESM
}

export interface StarfieldSave {
    saveVersion: number;
    saveNumber: number;

    playerName: string;
    playerLevel: number;
    playerLocation: string;
    playtimeSeconds: number;
    raceName: string;
    gender: number;

    experience: number;
    experienceRequired: number;

    lastPlayed: Date; // UTC?

    gameVersion: string;

    plugins: SavePluginInfo;

    filePath: string;
    fileName: string;
}


export async function parseSave(filePath: string): Promise<StarfieldSave> {
    const raw = await fs.readFile(filePath);
    const decompressed = decompressSfs(raw);
    return parseDecompressed(decompressed, filePath);
}

export function groupByCharacter(saves: StarfieldSave[]): Map<string, StarfieldSave[]> {
    const map = new Map<string, StarfieldSave[]>();
    for (const save of saves) {
        const key = save.playerName.trim() || '(Unknown)';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(save);
    }

    for (const group of map.values()) {
        group.sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());
    }
    return map;
}

export function allPluginNames(save: StarfieldSave): string[] {
    return [
        ...save.plugins.plugins,
        ...save.plugins.lightPlugins,
        ...save.plugins.mediumPlugins,
    ].map(p => p.name);
}

export function diffPlugins(
    save: StarfieldSave,
    activePlugins: string[]
): { missingFromActive: string[]; newSinceLastSave: string[] } {
    const savePlugins = new Set(allPluginNames(save).map(n => n.toLowerCase()));
    const active = new Set(activePlugins.map(n => n.toLowerCase()));

    const missingFromActive = [...savePlugins].filter(p => !active.has(p));
    const newSinceLastSave = [...active].filter(p => !savePlugins.has(p));

    return { missingFromActive, newSinceLastSave };
}

function decompressChunk(compressed: Buffer): Buffer {
    // Versuche zuerst zlib (mit Header), dann raw deflate, dann unkomprimiert
    const strategies = [
        () => zlib.inflateSync(compressed),           // zlib-Header (78 9C / 78 DA)
        () => zlib.inflateRawSync(compressed),        // Raw Deflate (kein Header)
        () => zlib.gunzipSync(compressed),            // gzip
        () => compressed,                             // stored / unkomprimiert / miep muhp ka was sonst?
    ];

    for (const fn of strategies) {
        try {
            return fn();
        } catch {
            // nächste Strategie
        }
    }
    throw new Error('Invalid stored block lengths');
}


function decompressSfs(raw: Buffer): Buffer {
    const r = new BinaryReader(raw);

    // Magic: "BCPS"
    const magic = r.readBytes(4).toString('ascii');
    if (magic !== 'BCPS') {
        throw new Error(`Invalid SFS magic: expected "BCPS", got "${magic}"`);
    }

    r.readUInt32();           // ?
    r.readUInt64();           // chunkSizesOffset
    r.readUInt64();           // ?
    r.readUInt64();           // compressedDataOffset
    const uncompressedSize = Number(r.readUInt64());
    r.readFloat();            // version
    r.readUInt32();           // ?
    const chunkSize = Number(r.readUInt64()); // sizeUncompressedChunks
    r.readUInt64();           // paddingSize
    r.readUInt32();           // ?

    const compressionType = r.readBytes(4).toString('ascii');
    if (!compressionType.startsWith('ZIP')) {
        throw new Error(`Unknown compression type: "${compressionType}"`);
    }

    const numChunks = Math.ceil(uncompressedSize / chunkSize);
    const chunkSizes: number[] = [];
    for (let i = 0; i < numChunks; i++) {
        chunkSizes.push(r.readUInt32());
    }

    const alignment = 16;
    const misalign = r.position % alignment;
    if (misalign !== 0) r.skip(alignment - misalign);

    const parts: Buffer[] = [];
    for (const compressedSize of chunkSizes) {
        const compressedChunk = r.readBytes(compressedSize);
        parts.push(decompressChunk(compressedChunk));

        const padded = compressedSize % alignment;
        if (padded !== 0) r.skip(alignment - padded);
    }

    return Buffer.concat(parts);
}

function parsePlugin(r: BinaryReader, saveVersion: number): PluginEntry {
    const name = r.readPrefixedString();
    const entry: PluginEntry = { name };

    // 143 vor Terran Armada / Free Lanes
    // 153 aktuell?
    // Änderungen? Noch nix relevantes?

    if (saveVersion >= 140) {
        const hasExtra = r.readUInt8(); // 0 = kein Extra, 1 = hat Extra
        if (hasExtra === 1) {
            entry.creationName = r.readPrefixedString();
            entry.creationId = r.readPrefixedString();
            const flagsSize = r.readUInt16();
            if (flagsSize > 0) r.skip(flagsSize);
            entry.achievementCompatible = r.readUInt8() === 1;
        }
    } else if (saveVersion >= 122) {
        // Kein Flag-Byte :( 
        // creationNameSize ist 0 also kein Extra
        // glaub wir supporten das einfach nich, ich bekomm ja nirgendswo saves zum testen her wa
        const creationNameSize = r.readUInt16();
        if (creationNameSize > 0) {
            entry.creationName = r.readString(creationNameSize);
            entry.creationId = r.readPrefixedString();
            const flagsSize = r.readUInt16();
            if (flagsSize > 0) r.skip(flagsSize);
            entry.achievementCompatible = r.readUInt8() === 1;
        }
    }

    return entry;
}

function parsePluginInfo(r: BinaryReader, saveVersion: number): SavePluginInfo {
    if (saveVersion < 140) {
        throw new Error(`Save version ${saveVersion} not supported (min: 140)`);
    }

    r.readUInt8();
    r.readUInt8();

    const pluginCount = r.readUInt8();
    const plugins: PluginEntry[] = [];
    for (let i = 0; i < pluginCount; i++) {
        plugins.push(parsePlugin(r, saveVersion));
    }

    const lightPluginCount = r.readUInt16();
    const lightPlugins: PluginEntry[] = [];
    for (let i = 0; i < lightPluginCount; i++) {
        lightPlugins.push(parsePlugin(r, saveVersion));
    }

    const mediumPlugins: PluginEntry[] = [];
    if (saveVersion >= 122) {
        const mediumPluginCount = r.readUInt32();
        for (let i = 0; i < mediumPluginCount; i++) {
            mediumPlugins.push(parsePlugin(r, saveVersion));
        }
    }

    return { plugins, lightPlugins, mediumPlugins };
}


function parsePlaytime(playtime: string): number {
    const match = playtime.match(/(\d+)d\.(\d+)h\.(\d+)m/);
    if (!match) return 0;
    const [, d, h, m] = match.map(Number);
    return d * 86400 + h * 3600 + m * 60;
}

function fileTimeToDate(fileTime: bigint): Date {
    const EPOCH_DIFF = 116444736000000000n;
    const ms = Number((fileTime - EPOCH_DIFF) / 10000n);
    return new Date(ms);
}

function parseDecompressed(buf: Buffer, filePath: string): StarfieldSave {
    const r = new BinaryReader(buf);

    const magic = r.readBytes(12).toString('ascii');
    if (magic !== 'SFS_SAVEGAME') {
        throw new Error(`Invalid decompressed magic: "${magic}"`);
    }

    const headerSize = r.readUInt32();
    const headerStart = r.position;

    r.readUInt32();  // engineVersion?
    const saveVersion = r.readUInt8();
    const saveNumber = r.readUInt32();
    const playerName = r.readPrefixedString();
    const playerLevel = r.readUInt32();
    const playerLocation = r.readPrefixedString();
    const playtime = r.readPrefixedString();
    const raceName = r.readPrefixedString();
    const gender = r.readUInt16();
    const experience = r.readFloat();
    const experienceRequired = r.readFloat();
    const fileTimeBuf = r.readBytes(8);
    const fileTime = fileTimeBuf.readBigUInt64LE(0);
    const lastPlayed = fileTimeToDate(fileTime);
    r.skip(8);  // padding
    r.readUInt32(); // unknown

    // Kein Plan was das is, gut das wir nur lesen :)
    const headerBytesRead = r.position - headerStart;
    if (headerBytesRead < headerSize) {
        r.skip(headerSize - headerBytesRead);
    }

    // saveVersion byte nochma
    const outerSaveVersion = r.readUInt8();
    const currentGameVersion = r.readPrefixedString();
    r.readPrefixedString(); // createdGameVersion

    // pluginInfoSize
    r.readUInt16();

    const plugins = parsePluginInfo(r, outerSaveVersion || saveVersion);

    return {
        saveVersion: outerSaveVersion || saveVersion,
        saveNumber,
        playerName,
        playerLevel,
        playerLocation,
        playtimeSeconds: parsePlaytime(playtime),
        raceName,
        gender,
        experience,
        experienceRequired,
        lastPlayed,
        gameVersion: currentGameVersion,
        plugins,
        filePath,
        fileName: path.basename(filePath, '.sfs')
    };
}

class BinaryReader {
    private pos = 0;

    constructor(private buf: Buffer) { }

    get position() { return this.pos; }
    get remaining() { return this.buf.length - this.pos; }

    skip(n: number) { this.pos += n; }

    readUInt8() { const v = this.buf.readUInt8(this.pos); this.pos += 1; return v; }
    readUInt16() { const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
    readUInt32() { const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
    readUInt64() { const v = this.buf.readBigUInt64LE(this.pos); this.pos += 8; return v; }
    readFloat() { const v = this.buf.readFloatLE(this.pos); this.pos += 4; return v; }

    readBytes(n: number): Buffer {
        const v = this.buf.subarray(this.pos, this.pos + n);
        this.pos += n;
        return v;
    }

    readString(len: number): string {
        const v = this.buf.subarray(this.pos, this.pos + len).toString('utf8');
        this.pos += len;
        return v;
    }

    readPrefixedString(): string {
        const len = this.readUInt16();
        return this.readString(len);
    }

    readBytePrefixedString(): string {
        const len = this.readUInt8();
        return this.readString(len);
    }

    peekChar4(): string {
        return this.buf.subarray(this.pos, this.pos + 4).toString('ascii');
    }
}
