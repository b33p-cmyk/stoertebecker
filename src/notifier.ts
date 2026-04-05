// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { BrowserWindow } from 'electron';

export type NotificationType = 'info' | 'warning' | 'error';

export function notifyUser(type: NotificationType, message: string): void {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    win.webContents.send('notify-user', { type, message });
}