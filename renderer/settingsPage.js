// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js'; 
import { t } from './i18n.js';
import { info } from './logger.js';
import { THEMES, getTheme, getThemeDescription } from './themes/themes.js';
import { getLocale } from './i18n.js';
import { getCurrentProfile } from './profileManager.js';

const settingsPage = document.getElementById('settings-page');
const btnSettingsBack = document.getElementById('btn-settings-back');
const btnSettingsSave = document.getElementById('btn-settings-save');
const btnSettingsReset = document.getElementById('btn-settings-reset');
const inputAppDataPath = document.getElementById('settings-appdata-path');
const inputDataPath = document.getElementById('settings-data-path');
const inputAppPath = document.getElementById('settings-app-path');
const inputBaseMasters = document.getElementById('settings-base-masters');
const inputBlueprintMasters = document.getElementById('settings-blueprint-masters');
const inputSfseExe = document.getElementById('settings-sfse-exe');
const inputStarfieldExe = document.getElementById('settings-starfield-exe');
const cbIgnoreBaseMasters = document.getElementById('settings-ignore-base-masters');
const cbIgnoreBlueprintMasters = document.getElementById('settings-ignore-blueprint-masters');
const cbCreateBackup = document.getElementById('settings-create-backup');
const cbAutoSyncContentCatalog = document.getElementById('settings-autoSyncContentCatalog');
const cbCreateContentCatalogBackupOnSync = document.getElementById('settings-createContentCatalogBackupOnSync');
const themeSelectBtn      = document.getElementById('theme-select-btn');
const themeSelectDropdown = document.getElementById('theme-select-dropdown');
const themeSelectLabel    = document.getElementById('theme-select-label');
const themeSelectDesc     = document.getElementById('theme-select-desc');
const fontSizeInput = document.getElementById('settings-font-size');
const fontSizeDisplay = document.getElementById('font-size-display');

let currentSettings = null;
let currentThemeId = 'dark';
let isDirtyFn = null;
let showConfirmFn = null;

export function applyTheme(theme) {
    document.getElementById('theme-stylesheet').href = `themes/${theme}.css`;
    currentThemeId = theme;
    const meta = getTheme(theme);
    if (themeSelectLabel) themeSelectLabel.textContent = meta.name;
    if (themeSelectDesc)  themeSelectDesc.textContent  = getThemeDescription(meta, getLocale());
    if (themeSelectDropdown) {
        themeSelectDropdown.querySelectorAll('.theme-select-item')
            .forEach(item => item.classList.toggle('active', item.dataset.theme === theme));
    }
}

export function applyFontSize(size) {
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    if (fontSizeDisplay) fontSizeDisplay.textContent = size;
    if (fontSizeInput)   fontSizeInput.value = size;
}

export async function initSettingsPage(getDirty, showConfirm) {
    currentSettings = await ipc(window.starfieldAPI.getSettings());
    isDirtyFn = getDirty;
    showConfirmFn = showConfirm;

    // Dropdown befüllen
    THEMES.forEach(t => {
        const item = document.createElement('button');
        item.className = 'theme-select-item';
        item.dataset.theme = t.id;
        item.type = 'button';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'theme-select-item-name';
        nameSpan.textContent = t.name;

        const descSpan = document.createElement('span');
        descSpan.className = 'theme-select-item-desc';
        descSpan.textContent = getThemeDescription(t, getLocale());

        item.appendChild(nameSpan);
        item.appendChild(descSpan);

        item.addEventListener('click', () => {
            applyTheme(t.id);
            themeSelectDropdown.classList.add('hidden');
        });
        themeSelectDropdown.appendChild(item);
    });

    // Toggle öffnen/schließen
    themeSelectBtn.addEventListener('click', () =>
        themeSelectDropdown.classList.toggle('hidden')
    );

    // Klick auf Overlay schließt Dialog. Also ist kein Dialog mehr, aber same shit, different cow.
    document.addEventListener('click', e => {
        if (!document.getElementById('theme-select').contains(e.target))
            themeSelectDropdown.classList.add('hidden');
    });

    // Zurück
    btnSettingsBack.addEventListener('click', closeSettings);

    // Schriftgröße Slider. Warum eigentlich Slider? Das war mehr Arbeit als worth, wenn Du mich fragst.
    fontSizeInput.addEventListener('input', () => applyFontSize(Number(fontSizeInput.value)));

    // Ordner-Picker
    document.getElementById('btn-pick-appdata').addEventListener('click', async () => {
        const folder = await ipc(window.starfieldAPI.pickFolder());
        if (folder) inputAppDataPath.value = folder;
    });

    document.getElementById('btn-pick-data').addEventListener('click', async () => {
        const folder = await ipc(window.starfieldAPI.pickFolder());
        if (folder) inputDataPath.value = folder;
    });

    document.getElementById('btn-pick-app').addEventListener('click', async () => {
        const folder = await ipc(window.starfieldAPI.pickFolder());
        if (folder) inputAppPath.value = folder;
    });

    document.getElementById('btn-pick-sfse').addEventListener('click', async () => {
        const file = await ipc(window.starfieldAPI.pickFile([
            { name: 'Executable', extensions: ['exe'] }
        ]));
        if (file) inputSfseExe.value = file;
    });

    document.getElementById('btn-pick-starfield').addEventListener('click', async () => {
        const file = await ipc(window.starfieldAPI.pickFile([
            { name: 'Executable', extensions: ['exe'] }
        ]));
        if (file) inputStarfieldExe.value = file;
    });

    // Speichern
    btnSettingsSave.addEventListener('click', async () => {

        let doSaveAndReload = true;
        if (isDirtyFn?.()) {
            doSaveAndReload = false;
            const currentProfile = getCurrentProfile();
            const ok = await showConfirmFn?.(t('confirm.profile.dirty', { name: currentProfile?.name ?? 'Unknown' }));
            if (ok) {
                doSaveAndReload = true;
            }
        }

        if(!doSaveAndReload) {
            return;
        }
        
        const newSettings = {
            starfieldAppDataPath: inputAppDataPath.value.trim(),
            starfieldDataPath: inputDataPath.value.trim(),
            appDataPath: inputAppPath.value.trim(),
            baseMasters: inputBaseMasters.value.split('\n').map(s => s.trim()).filter(Boolean),
            blueprintMasters: inputBlueprintMasters.value.split('\n').map(s => s.trim()).filter(Boolean),
            ignoreBaseMasters: cbIgnoreBaseMasters.checked,
            ignoreBlueprintMasters: cbIgnoreBlueprintMasters.checked,
            createBackupOnExport: cbCreateBackup.checked,
            autoSyncContentCatalog: cbAutoSyncContentCatalog.checked,
            createContentCatalogBackupOnSync: cbCreateContentCatalogBackupOnSync.checked,
            sfseExePath: inputSfseExe.value.trim() || null,
            starfieldExePath: inputStarfieldExe.value.trim() || null,
            theme: currentThemeId,
            fontSize: Number(fontSizeInput.value),
            activeProfileId: currentSettings.activeProfileId ?? null,
        };
        await ipc(window.starfieldAPI.saveSettings(newSettings));
        info(t('settings.saved'));

        // Neu laden damit neue Pfade aktiv werden
        window.starfieldAPI.setDirty(false);
        location.reload();
    });

    // Zurücksetzen
    btnSettingsReset.addEventListener('click', async () => {
        const defaults = await ipc(window.starfieldAPI.getDefaultSettings());
        inputAppDataPath.value = defaults.starfieldAppDataPath;
        inputDataPath.value = defaults.starfieldDataPath;
        inputAppPath.value = defaults.appDataPath;
        cbIgnoreBaseMasters.checked = defaults.ignoreBaseMasters ?? true;
        cbIgnoreBlueprintMasters.checked = defaults.ignoreBlueprintMasters ?? true;
        cbCreateBackup.checked = defaults.createBackupOnExport ?? true;
        cbAutoSyncContentCatalog.checked = defaults.autoSyncContentCatalog ?? true;
        cbCreateContentCatalogBackupOnSync.checked = defaults.createContentCatalogBackupOnSync ?? true;

        applyTheme(defaults.theme ?? 'dark');
        applyFontSize(defaults.fontSize ?? 16);
    });
}

export function openSettings() {
    currentSettings = null;
    ipc(window.starfieldAPI.getSettings()).then(settings => {
        currentSettings = settings;
        inputAppDataPath.value = settings.starfieldAppDataPath;
        inputDataPath.value = settings.starfieldDataPath;
        inputAppPath.value = settings.appDataPath;
        inputBaseMasters.value = settings.baseMasters.join('\n');
        inputBlueprintMasters.value = settings.blueprintMasters.join('\n');
        cbIgnoreBaseMasters.checked = settings.ignoreBaseMasters ?? true;
        cbIgnoreBlueprintMasters.checked = settings.ignoreBlueprintMasters ?? true;
        cbCreateBackup.checked = settings.createBackupOnExport ?? true;
        cbAutoSyncContentCatalog.checked = settings.autoSyncContentCatalog ?? true;
        cbCreateContentCatalogBackupOnSync.checked = settings.createContentCatalogBackupOnSync ?? true;

        inputSfseExe.value = settings.sfseExePath ?? '';
        inputStarfieldExe.value = settings.starfieldExePath ?? '';
        applyTheme(settings.theme ?? 'dark');
        applyFontSize(settings.fontSize ?? 16);
    });
    settingsPage.classList.remove('hidden');
}

function closeSettings() {
    settingsPage.classList.add('hidden');
}
