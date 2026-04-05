// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js'; 
import { t } from './i18n.js';

export function initConflictDialog() {
    document.getElementById('conflict-close')
        .addEventListener('click', _close);
    document.getElementById('conflict-dialog')
        .addEventListener('click', e => { if (e.target === e.currentTarget) _close(); });

    // Progress-Listener einmalig registrieren (analog onLaunchStatus)
    window.starfieldAPI.onConflictProgress(({ current, total, pluginName }) => {
        const fill = document.getElementById('conflict-progress-fill');
        const label = document.getElementById('conflict-progress-label');
        if (fill) fill.style.width = `${Math.round(current / total * 100)}%`;
        if (label) label.textContent = t('conflicts.scanning', { current, total, name: pluginName });
    });
}

function _close() {
    document.getElementById('conflict-dialog').classList.add('hidden');
}

export async function openConflictDialog(installedPluginNames) {
    const dialog  = document.getElementById('conflict-dialog');
    const summary = document.getElementById('conflict-summary');
    const list    = document.getElementById('conflict-list');
    const bar     = document.getElementById('conflict-progress-bar');
    const fill    = document.getElementById('conflict-progress-fill');

    list.innerHTML = '';
    summary.textContent = '';
    fill.style.width = '0%';
    bar.classList.remove('hidden');
    dialog.classList.remove('hidden');

    const conflicts = await ipc(window.starfieldAPI.detectConflicts(installedPluginNames));
    bar.classList.add('hidden');

    if (conflicts.length === 0) {
        summary.innerHTML = `<span class="conflict-ok">${t('conflicts.none')}</span>`;
        return;
    }

    summary.innerHTML = `<span class="conflict-warn">${t('conflicts.done', { n: conflicts.length })}</span>`;

    // Nach Record-Typ gruppieren
    const byType = new Map();
    for (const c of conflicts) {
        if (!byType.has(c.type)) byType.set(c.type, []);
        byType.get(c.type).push(c);
    }

    for (const [type, entries] of [...byType.entries()].sort()) {
        const hdr = document.createElement('div');
        hdr.className = 'conflict-group-header';
        hdr.textContent = type;
        list.appendChild(hdr);

        for (const e of entries) {
            const row = document.createElement('div');
            row.className = 'conflict-row';

            const formIdSpan = document.createElement('span');
            formIdSpan.className = 'conflict-cell conflict-formid';
            formIdSpan.textContent = e.formId.toString(16).padStart(6, '0').toUpperCase();

            const masterSpan = document.createElement('span');
            masterSpan.className = 'conflict-cell conflict-master';
            masterSpan.textContent = e.masterName;

            const pluginsSpan = document.createElement('span');
            pluginsSpan.className = 'conflict-cell conflict-plugins';
            pluginsSpan.textContent = e.plugins.join(', ');

            row.appendChild(formIdSpan);
            row.appendChild(masterSpan);
            row.appendChild(pluginsSpan);

            list.appendChild(row);
        }
    }
}
