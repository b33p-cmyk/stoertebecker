// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js';
import { t } from './i18n.js';
import { error  } from './logger.js';

export function initSavegameDialog(getPlugins) {
    document.getElementById('btn-scan-save').addEventListener('click', () => openSavegameDialog(getPlugins));
    document.getElementById('save-scan-close').addEventListener('click', closeSaveScanDialog);
    document.getElementById('save-scan-ok').addEventListener('click', closeSaveScanDialog);
    document.getElementById('save-scan-overlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeSaveScanDialog();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSaveScanDialog();
    });
}

function closeSaveScanDialog() {
    document.getElementById('save-scan-overlay').classList.add('hidden');
}

function createRow(label, content) {
    const row = document.createElement('div');
    row.className = 'save-scan-row';

    if (label) {
        const rowLabel = document.createElement('span');
        rowLabel.className = 'save-scan-label';
        rowLabel.textContent = label;
        row.appendChild(rowLabel);
    }


    const span = document.createElement('span');
    span.textContent = content;
    row.appendChild(span);
    return row;
}

function parsePlaytime(seconds) {

    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (d > 0) parts.push(`${d} ${d === 1 ? t('day') : t('days')}`);
    if (h > 0) parts.push(`${h} ${t('hour')}`);
    if (m > 0) parts.push(`${m} ${t('minutes')}`);

    return parts.join(' ') || `0 ${t('minutes')}`;
}


async function openSavegameDialog(getPlugins) {
    const [save, settings] = await Promise.all([
        ipc(window.starfieldAPI.parseSaveFile()),
        ipc(window.starfieldAPI.getSettings()),
    ]);
    if (!save) {
        error("Could not parse file"); //Übersetz mich bitte
        return;
    }
    
    // Die saveVersion ist nach Terran Armada/Free Lanes von 143 auf 153 gesprungen! Vorsicht im Parser?
    document.getElementById('save-scan-title').textContent = `${save.playerName} - Level ${save.playerLevel} at ${save.playerLocation} (v${save.saveVersion})`;

    const meta = document.getElementById('save-scan-meta');
    const lastPlayed = new Date(save.lastPlayed);
    meta.innerHTML = "";

    meta.appendChild(createRow(t('save.file'), save.fileName));
    meta.appendChild(createRow(t('save.lastPlayed'), lastPlayed.toLocaleString()));
    meta.appendChild(createRow(t('save.playtime'), parsePlaytime(save.playtimeSeconds)));

    const savePluginNames = [
        ...save.plugins.plugins,
        ...save.plugins.lightPlugins,
        ...save.plugins.mediumPlugins,
    ].map(p => p.name.toLowerCase());

    const allPlugins = getPlugins();
    const activeSet = new Set(allPlugins.filter(p => p.isActive).map(p => p.name.toLowerCase()));
    const knownSet = new Set(allPlugins.map(p => p.name.toLowerCase()));
    const nameMap = Object.fromEntries(allPlugins.map(p => [p.name.toLowerCase(), p.name]));

    // Plugins die immer als aktiv gelten (baseMasters / blueprintMasters je nach Einstellung)
    const implicitlyActive = new Set();
    if (settings.ignoreBaseMasters) settings.baseMasters.forEach(m => implicitlyActive.add(m.toLowerCase()));
    if (settings.ignoreBlueprintMasters) settings.blueprintMasters.forEach(m => implicitlyActive.add(m.toLowerCase()));

    const savePluginSet = new Set(savePluginNames);

    const missing = savePluginNames
        .filter(n => !activeSet.has(n) && !implicitlyActive.has(n))
        .map(n => ({ name: nameMap[n] ?? n, reason: knownSet.has(n) ? 'inactive' : 'missing' }));

    const extra = [...activeSet]
        .filter(n => !savePluginSet.has(n))
        .map(n => nameMap[n] ?? n);

    const lists = document.getElementById('save-scan-lists');
    lists.replaceChildren(
        buildSection(
            t('save.missing', { n: missing.length }),
            missing.map(m => {
                const li = document.createElement('li');
                li.textContent = m.name;
                const tag = document.createElement('span');
                tag.className = `save-scan-tag save-scan-tag--${m.reason}`;
                tag.textContent = t('save.reason.' + m.reason);
                li.appendChild(tag);
                return li;
            }),
            missing.length > 0
        ),
        buildSection(
            t('save.extra', { n: extra.length }),
            extra.map(n => {
                const li = document.createElement('li');
                li.textContent = n;
                return li;
            }),
            false
        )
    );

    document.getElementById('save-scan-overlay').classList.remove('hidden');
}

function buildSection(label, items, openByDefault) {
    const details = document.createElement('details');
    if (openByDefault) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'save-scan-summary';
    summary.textContent = label;

    const ul = document.createElement('ul');
    ul.className = 'save-scan-list';
    if (items.length > 0) {
        ul.replaceChildren(...items);
    } else {
        const empty = document.createElement('li');
        empty.className = 'save-scan-empty';
        empty.textContent = '\u2014';
        ul.appendChild(empty);
    }

    details.appendChild(summary);
    details.appendChild(ul);
    return details;
}
