// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { initLogger, getEntries, clearEntries, getWarnCount } from './logger.js';
import { t } from './i18n.js';

const logPanel = document.getElementById('log-panel');
const logHeader = document.getElementById('log-header');
const logBody = document.getElementById('log-body');
const logBadge = document.getElementById('log-badge');
const logClear = document.getElementById('log-clear');
const logHideWarnings = document.getElementById('log-hide-warnings');
const logFilterLabel = document.getElementById('log-filter-label');

const ICONS = {
    info:    '<i class="fa-solid fa-circle-info"          aria-hidden="true"></i>',
    warn:    '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"         aria-hidden="true"></i>',
    success: '<i class="fa-solid fa-circle-check"         aria-hidden="true"></i>',
};

export function initLogPanel() {
    initLogger(renderLog);

    // 

    
    logFilterLabel.addEventListener('click', e => e.stopPropagation());

    // Gespeicherten Wert laden
    logHideWarnings.checked = localStorage.getItem('logHideWarnings') === 'true';

    logHideWarnings.addEventListener('change', () => {
        localStorage.setItem('logHideWarnings', logHideWarnings.checked);
        renderLog();
    });

    logHeader.addEventListener('click', e => {
        if (e.target === logClear || e.target === logHideWarnings ||
            e.target.closest('.log-filter-label')) return;
        logPanel.classList.toggle('collapsed');
    });

    logClear.addEventListener('click', e => {
        e.stopPropagation();
        clearEntries();
    });
}

function renderLog() {
    const hideWarnings = logHideWarnings.checked;
    const entries = getEntries().filter(e =>
        hideWarnings ? e.level !== 'warn' : true
    );
    logBody.innerHTML = '';

    entries.forEach(entry => {
        const el = document.createElement('div');
        el.className = `log-entry ${entry.level}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = entry.time;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'log-icon';
        iconSpan.innerHTML = ICONS[entry.level]; // statisch, sicher

        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-message';
        messageSpan.textContent = entry.message;

        el.appendChild(timeSpan);
        el.appendChild(iconSpan);
        el.appendChild(messageSpan);
        logBody.appendChild(el);
    });

    // Badge aktualisieren
    const warnCount = getWarnCount();
    if (warnCount > 0) {
        logBadge.textContent = t(warnCount === 1 ? 'log.warnings' : 'log.warnings.plural', { n: warnCount });

        logBadge.classList.remove('hidden');
        logBadge.classList.toggle('has-errors',
            getEntries().some(e => e.level === 'error')
        );
        // Automatisch aufklappen bei neuen Warnungen
        logPanel.classList.remove('collapsed');
    } else {
        logBadge.classList.add('hidden');
    }
}