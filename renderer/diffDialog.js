// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js'; 
import { t } from './i18n.js';

const btnDiff = document.getElementById('btn-diff');
let _debounceTimer = null;

export function updateDiffStatus(plugins, cats) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => _runDiffStatus(plugins, cats), 600);
}

async function _runDiffStatus(plugins, cats) {
    const currentContent = await ipc(window.starfieldAPI.readPluginsTxt());
    const currentLines = parsePluginsTxt(currentContent);
    const previewLines = generatePreviewLines(plugins, cats);

    const diff = computeDiff(currentLines, previewLines);
    const { added, removed, moved, activated, deactivated } = diffStats(diff);
    const total = added + removed + moved + activated + deactivated;

    btnDiff.classList.toggle('btn-diff--ok',   total === 0);
    btnDiff.classList.toggle('btn-diff--warn', total > 0);

    const indicator = total === 0
        ? `<span class="diff-btn-indicator diff-btn-indicator--ok"><i class="fa-solid fa-check" aria-hidden="true"></i></span>`
        : `<span class="diff-btn-indicator diff-btn-indicator--warn">${[
            added       > 0 ? `<i class="fa-solid fa-plus" aria-hidden="true"></i>${added}`                       : '',
            removed     > 0 ? `<i class="fa-solid fa-minus" aria-hidden="true"></i>${removed}`                    : '',
            moved       > 0 ? `<i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i>${moved}`             : '',
            activated   > 0 ? `<i class="fa-solid fa-toggle-on" aria-hidden="true"></i>${activated}`              : '',
            deactivated > 0 ? `<i class="fa-solid fa-toggle-off" aria-hidden="true"></i>${deactivated}`           : '',
          ].filter(Boolean).join(' ')}</span>`;

    btnDiff.innerHTML = `<span>${t('toolbar.diff')}</span>${indicator}`;
    btnDiff.dataset.tooltip = total === 0 ? t('diff.statusOk') : t('diff.statusWarn', { n: total });
}

function generatePreviewLines(plugins, categories) {
    const modMap = new Map(plugins.map(m => [m.name.toLowerCase(), m]));
    const written = new Set();
    const lines = [];

    for (const cat of categories) {
        for (const modName of cat.modNames) {
            const mod = modMap.get(modName.toLowerCase());
            if (!mod) continue;
            lines.push((mod.isActive ? '*' : '') + mod.name);
            written.add(mod.name.toLowerCase());
        }
    }

    for (const mod of plugins) {
        if (!written.has(mod.name.toLowerCase())) {
            lines.push((mod.isActive ? '*' : '') + mod.name);
        }
    }

    return lines;
}

function parsePluginsTxt(content) {
    return content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));
}

// LCS-basierter Diff über läuft auf Basename (lowercase), für move und toggle
function computeDiff(oldLines, newLines) {
    const base = v => v.startsWith('*') ? v.slice(1) : v;
    const norm = v => base(v).toLowerCase();
    const isActive = v => v.startsWith('*');

    const oldNorms = oldLines.map(norm);
    const newNorms = newLines.map(norm);
    const newBases = newLines.map(base); // für Anzeige, echte Schreibweise aus new

    // LCS auf normalisiertem Basename
    const m = oldNorms.length, n = newNorms.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = oldNorms[i - 1] === newNorms[j - 1]
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);

    // Schnellsuche: norm in index
    const newIdxByNorm = new Map(newNorms.map((b, i) => [b, i]));
    const oldIdxByNorm = new Map(oldNorms.map((b, i) => [b, i]));

    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldNorms[i - 1] === newNorms[j - 1]) {
            // Gleiche Position im LCS dann noop
            const toggled = isActive(oldLines[i - 1]) !== isActive(newLines[j - 1]);
            if (toggled) {
                const type = isActive(newLines[j - 1]) ? 'activate' : 'deactivate';
                result.push({ type, value: newBases[j - 1] });
            } else {
                result.push({ type: 'same', value: newBases[j - 1] });
            }
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            // Neue Position im neuen File
            const nb = newNorms[j - 1];
            if (oldIdxByNorm.has(nb)) {
                // Mod existiert in old dann zumindest verschoben (+ evtl. getoggelt. Ich les hier immer gegoogelt. Ich brauch ne neue Brille.)
                const oldVal = oldLines[oldIdxByNorm.get(nb)];
                const newVal = newLines[j - 1];
                const toggled = isActive(oldVal) !== isActive(newVal);
                const newActive = isActive(newVal);
                result.push({ type: 'move-to', value: newBases[j - 1], toggled, newActive });
            } else {
                result.push({ type: 'add', value: newLines[j - 1] });
            }
            j--;
        } else {
            // Alte Position im alten File
            const nb = oldNorms[i - 1];
            if (newIdxByNorm.has(nb)) {
                // Mod existiert in new verschoben und vielleicht on/off state
                const oldVal = oldLines[i - 1];
                const newVal = newLines[newIdxByNorm.get(nb)];
                const toggled = isActive(oldVal) !== isActive(newVal);
                const newActive = isActive(newVal);
                result.push({ type: 'move-from', value: newBases[newIdxByNorm.get(nb)], toggled, newActive });
            } else {
                result.push({ type: 'remove', value: oldLines[i - 1] });
            }
            i--;
        }
    }
    return result.reverse();
}

function diffStats(diff) {
    let added = 0, removed = 0, moved = 0, activated = 0, deactivated = 0;
    for (const d of diff) {
        if (d.type === 'add')            added++;
        else if (d.type === 'remove')    removed++;
        else if (d.type === 'move-from') {
            moved++;
            // Gleichzeitiger Toggle zählen
            if (d.toggled) d.newActive ? activated++ : deactivated++;
        }
        else if (d.type === 'activate')    activated++;
        else if (d.type === 'deactivate')  deactivated++;
        // move-to, same same, noop
    }
    return { added, removed, moved, activated, deactivated };
}

function makeSummarySpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

export async function openDiffDialog(allPlugins, categories) {
    const currentContent = await ipc(window.starfieldAPI.readPluginsTxt());
    const currentLines = parsePluginsTxt(currentContent);
    const previewLines = generatePreviewLines(allPlugins, categories);

    const diff = computeDiff(currentLines, previewLines);
    const stats = diffStats(diff);

    const dialog = document.getElementById('diff-dialog');
    const summary = document.getElementById('diff-summary');
    const list = document.getElementById('diff-list');

    const noChanges = stats.added === 0 && stats.removed === 0 && stats.moved === 0
        && stats.activated === 0 && stats.deactivated === 0;

    summary.replaceChildren();

    if (noChanges) {
        summary.appendChild(makeSummarySpan('diff-summary-equal', t('diff.noChanges')));
    } else {
        const entries = [
            [stats.added, 'diff-summary-add', `+${stats.added} ${t('diff.added')}`],
            [stats.removed, 'diff-summary-remove', `−${stats.removed} ${t('diff.removed')}`],
            [stats.moved, 'diff-summary-move', `↕${stats.moved} ${t('diff.moved')}`],
            [stats.activated, 'diff-summary-activate', `●${stats.activated} ${t('diff.activated')}`],
            [stats.deactivated, 'diff-summary-deactivate', `○${stats.deactivated} ${t('diff.deactivated')}`],
        ];
        for (const [count, className, text] of entries) {
            if (count > 0) summary.appendChild(makeSummarySpan(className, text));
        }
    }

    list.innerHTML = '';
    for (const entry of diff) {
        if (entry.type === 'same') {
            const row = document.createElement('div');
            row.className = 'diff-row diff-same';
            row.textContent = '   ' + entry.value;
            list.appendChild(row);
            continue;
        }
        if (entry.type === 'add') {
            const row = document.createElement('div');
            row.className = 'diff-row diff-add';
            row.textContent = '+  ' + entry.value;
            list.appendChild(row);
            continue;
        }
        if (entry.type === 'remove') {
            const row = document.createElement('div');
            row.className = 'diff-row diff-remove';
            row.textContent = '−  ' + entry.value;
            list.appendChild(row);
            continue;
        }
        if (entry.type === 'activate' || entry.type === 'deactivate') {
            const row = document.createElement('div');
            row.className = `diff-row diff-${entry.type}`;
            row.textContent = (entry.type === 'activate' ? '●  ' : '○  ') + entry.value;
            list.appendChild(row);
            continue;
        }
        if (entry.type === 'move-from') {
            const row = document.createElement('div');
            row.className = 'diff-row diff-move-from';
            // Zeige alten Zustand (mit Stern wenn aktiv war in Plugins)
            const wasActive = !entry.toggled ? entry.newActive : !entry.newActive;
            row.textContent = '↕  ' + (wasActive ? '*' : '') + entry.value;
            list.appendChild(row);
            continue;
        }
        if (entry.type === 'move-to') {
            const row = document.createElement('div');
            // Kombinierter Prefix bei gleichzeitigem Toggle
            const toggleMark = entry.toggled ? (entry.newActive ? '● ' : '○ ') : '';
            row.className = 'diff-row diff-move-to' + (entry.toggled ? ' diff-move-toggled' : '');
            row.textContent = '↕  ' + toggleMark + entry.value;
            list.appendChild(row);
        }
    }

    dialog.classList.remove('hidden');
}

export function initDiffDialog() {
    document.getElementById('diff-close').addEventListener('click', () => {
        document.getElementById('diff-dialog').classList.add('hidden');
    });
    document.getElementById('diff-dialog').addEventListener('click', e => {
        if (e.target === e.currentTarget)
            e.currentTarget.classList.add('hidden');
    });
}
