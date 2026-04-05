// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
const MAX_ENTRIES = 100;
let entries = [];
let onChangeCallback = null;

export function initLogger(onChange) {
  onChangeCallback = onChange;
}

export function log(level, message) {
  entries.unshift({
    id: Date.now() + Math.random(),
    level, // 'info' | 'warn' | 'error' | 'success'
    message,
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });
  if (entries.length > MAX_ENTRIES) entries = entries.slice(0, MAX_ENTRIES);
  onChangeCallback?.();
}

export function clearWarnings() {
    entries = entries.filter(e => e.level !== 'warn' && e.level !== 'error');
    onChangeCallback?.();
}

export function info(message) { log('info', message);console.log(message); }
export function warn(message) { log('warn', message); console.log(message); }
export function error(message) { log('error', message);console.log(message); }
export function success(message) { log('success', message);console.log(message); }

export function getEntries() { return entries; }
export function clearEntries() { entries = []; onChangeCallback?.(); }

export function getWarnCount() {
  return entries.filter(e => e.level === 'warn' || e.level === 'error').length;
}