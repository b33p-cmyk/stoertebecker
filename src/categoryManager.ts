// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import * as fs from 'fs/promises';
import { SettingsManager } from './settingsManager';
import path from 'path';

export class Category {
    constructor(
        public readonly id: string,
        public name: string,
        public color: string,
        public icon: string,
        public description: string | null = null,
        public modNames: string[] = [],
        public tags: string[] = [],
    ) { }
}