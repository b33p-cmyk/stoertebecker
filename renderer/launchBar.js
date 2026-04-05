// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js';
import { t } from './i18n.js';
import { showError, showConfirm, updateCatalogFixButton, softRefresh } from './renderer.js';
import { success, error, info, warn } from './logger.js';
import { showContextMenu } from './contextMenu.js';

export function initLaunchBar(settings) {
    const launchBar = document.getElementById('launch-bar');
    launchBar.innerHTML = '';

    if (!settings.sfseExePath && !settings.starfieldExePath) {
        launchBar.classList.add('hidden');
        return;
    }

    launchBar.classList.remove('hidden');

    if (settings.sfseExePath) {
        const btn = buildLaunchButton('<i class="fa-solid fa-rocket" aria-hidden="true"></i>', 'launch.sfse', settings.sfseExePath, settings.autoSyncContentCatalog);
        launchBar.appendChild(btn);
    }

    if (settings.starfieldExePath) {
        const btn = buildLaunchButton('<i class="fa-solid fa-star" aria-hidden="true"></i>', 'launch.starfield', settings.starfieldExePath, settings.autoSyncContentCatalog);
        launchBar.appendChild(btn);
    }

    buildFolderMenuButton(launchBar, settings);
    buildReloadButton(launchBar);
}

function getGameFolder(exePath) {
    if (!exePath) return null;
    return exePath.replace(/[/\\][^/\\]+$/, '');
}

function buildFolderMenuButton(launchBar, settings) {
    const iconHtml = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i>';
    const labelKey = 'folders.menu';
    const chevronHtml = '<i class="fa-solid fa-chevron-down" aria-hidden="true" style="position:absolute; right:4px; font-size: 0.7rem;"></i>';

    const btn = document.createElement('button');
    btn.className = 'btn btn-launch';
    btn.style.position = 'relative';
    btn.style.paddingRight = '32px';
    btn.innerHTML = `<span class="launch-icon">${iconHtml}</span><span class="launch-label" data-i18n="${labelKey}">${t(labelKey)}</span>${chevronHtml}`;

    btn.addEventListener('click', (e) => {
        const items = [];

        if (settings.starfieldAppDataPath)
            items.push({ label: t('folders.appdata'), action: () => ipc(window.starfieldAPI.openFolder(settings.starfieldAppDataPath)) });
        if (settings.starfieldDataPath)
            items.push({ label: t('folders.data'), action: () => ipc(window.starfieldAPI.openFolder(settings.starfieldDataPath)) });

        const sfseDir = getGameFolder(settings.sfseExePath);
        const sfDir = getGameFolder(settings.starfieldExePath);
        const gameDir = sfseDir || sfDir;
        if (gameDir) {
            if (sfseDir && sfDir && sfseDir.toLowerCase() !== sfDir.toLowerCase()) {
                items.push({ label: `${t('folders.game')} (SFSE)`, action: () => ipc(window.starfieldAPI.openFolder(sfseDir)) });
                items.push({ label: `${t('folders.game')} (Starfield)`, action: () => ipc(window.starfieldAPI.openFolder(sfDir)) });
            } else {
                items.push({ label: t('folders.game'), action: () => ipc(window.starfieldAPI.openFolder(gameDir)) });
            }
        }

        items.push({ separator: true });
        items.push({ label: t('folders.stbkr'), action: () => ipc(window.starfieldAPI.openFolder(settings.appDataPath)) });

        const rect = btn.getBoundingClientRect();
        showContextMenu(rect.left, rect.bottom + 4, items);
        e.stopPropagation();
    });

    launchBar.appendChild(btn);
}

function buildReloadButton(launchBar) {
    const iconHtml ='<i class="fa-solid fa-arrows-spin" aria-hidden="true"></i>';
    const labelKey = 'reload.data';

    const btn = document.createElement('button');
    btn.dataset.iconHtml = iconHtml;
    btn.className = 'btn btn-launch';
    btn.innerHTML = `<span class="launch-icon">${iconHtml}</span><span class="launch-label" data-i18n="${labelKey}">${t(labelKey)}</span>`;

    btn.addEventListener('click', () => softRefresh());
    launchBar.appendChild(btn);
}

function buildLaunchButton(iconHtml, labelKey, exePath, autoSyncContentCatalog ) {
    const btn = document.createElement('button');
    btn.dataset.iconHtml = iconHtml;
    btn.className = 'btn btn-launch';
    btn.dataset.exePath = exePath;
    btn.innerHTML = `<span class="launch-icon">${iconHtml}</span><span class="launch-label" data-i18n="${labelKey}">${t(labelKey)}</span>`;

    btn.addEventListener('click', async () => {
            
        if(autoSyncContentCatalog) {
            info(t('log.sync.catalog'));
            const entriesUpdated = await ipc(window.starfieldAPI.syncCatalog());
            const { fixedCount, needsUpdateCount } = await ipc(window.starfieldAPI.fixFromSyncCatalog());

            const plugins = await ipc(window.starfieldAPI.getPlugins());
            updateCatalogFixButton(plugins); 

            if(needsUpdateCount > 0) {
                error(t('log.sync.catalog.actionRequired', { number: needsUpdateCount}));
                const confirmed = await showConfirm(t('catalog.syncWarning'), true, true);
            }

            if(entriesUpdated > 0) {
                info(t('log.sync.catalog.updateInfo', { updated: entriesUpdated}));
            }
        }

        setButtonState(btn, 'starting');
        try {
            await ipc(window.starfieldAPI.launchExe(exePath));
        } catch (err) {
            setButtonState(btn, 'error');
            error(t('launch.error', { label: t(labelKey)}));
            setTimeout(() => setButtonState(btn, 'idle'), 3000);
        }
    });

    // Launch-Status Events empfangen
    window.starfieldAPI.onLaunchStatus(data => {
        if (data.exePath !== exePath) return;
        switch (data.status) {
            case 'running':
                setButtonState(btn, 'running');
                success(t('launch.success', { label: t(labelKey) }));
                break;
            case 'exited':
                setButtonState(btn, 'idle');
                info(t('launch.exited', { label: t(labelKey) }));
                break;            
            case 'error':
                setButtonState(btn, 'error');
                error(t('launch.error', { label: t(labelKey) }));
                setTimeout(() => setButtonState(btn, 'idle'), 3000);
                break;
            case 'already-running':
                error(t('launch.alreadyRunning', { label:'Starfield' }));
                setButtonState(btn, 'idle');          
                showError(t('starfieldRunning'));      
                break;
        }
    });

    return btn;
}

function setButtonState(btn, state) {
    const icon = btn.querySelector('.launch-icon');
    const label = btn.querySelector('.launch-label');

    btn.disabled = state !== 'idle';
    btn.className = `btn btn-launch btn-launch--${state}`;

    switch (state) {
        case 'idle':
            icon.innerHTML = btn.dataset.iconHtml;
            break;
        case 'starting':
            icon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
            break;
        case 'running':
            icon.innerHTML = '<i class="fa-solid fa-circle" aria-hidden="true" style="color:#4caf50"></i>';
            break;
        case 'error':
            icon.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>';
            break;
    }
}