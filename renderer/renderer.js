// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js';
import { initUndoRedo, saveSnapshot, undo, redo, clearHistory } from './undoRedo.js';
import { initEmojiPicker, toggleEmojiPicker } from './emojiPicker.js';
import { showContextMenu } from './contextMenu.js';
import { initDragDrop, initCategoryDragDrop } from './dragDrop.js';
import { initDetailPanel, openPanel, closePanel, getMetadata, reOpenPanel, getSelectedDetailMod } from './detailPanel.js';
import { initI18n, setLocale, getLocale, t, getAvailableLocales } from './i18n.js';
import { createTagInput, registerTags } from './tagInput.js';
import { initProfileManager, getCurrentProfile, saveCurrentProfile } from './profileManager.js';
import { initLogPanel } from './logPanel.js';
import { initSettingsPage, openSettings, applyTheme, applyFontSize } from './settingsPage.js';
import { initLaunchBar } from './launchBar.js';
import { openDiffDialog, initDiffDialog, updateDiffStatus } from './diffDialog.js';
import { initConflictDialog, openConflictDialog } from './conflictDialog.js';
import { initAboutDialog, openAboutDialog } from './aboutDialog.js';
import { initSavegameDialog } from './savegameDialog.js';
import { warn, info, success, error, clearWarnings } from './logger.js';
import { initFilterPanel, refreshFilterTags, applyFilter, hasActiveFilters } from './filterPanel.js';

const loading = document.getElementById('loading');
const pluginList = document.getElementById('plugin-list');
const pluginCount = document.getElementById('plugin-count');
const searchInput = document.getElementById('search');
const overlay = document.getElementById('overlay');
const btnAddCategory = document.getElementById('btn-add-category');
const btnCancel = document.getElementById('btn-cancel');
const btnSaveCategory = document.getElementById('btn-save-category');
const btnSave = document.getElementById('btn-save');
const catIconInput = document.getElementById('cat-icon');
const btnExport = document.getElementById('btn-export');
const btnDiff = document.getElementById('btn-diff');
const btnConflicts = document.getElementById('btn-conflicts');

const btnExpandAll = document.getElementById('btn-expand');
const btnCollapseAll = document.getElementById('btn-collapse');

const confirmOverlay = document.getElementById('confirm-overlay');
const confirmMessage = document.getElementById('confirm-message');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');

let allPlugins = [];
let categories = [];
let selectedColor = '#5599ff';
let selectedIcon = '📦';
let isDirty = false;
let editingCategoryId = null;
let categoryTagInput = null;

const pendingNotifications = [];
let domReady = false;

function normalizeProfileModNames(profile, plugins) {
    const canonical = new Map(plugins.map(m => [m.name.toLowerCase(), m.name]));
    const resolve = name => canonical.get(name.toLowerCase()) ?? name;
    return {
        ...profile,
        inactiveMods: profile.inactiveMods.map(resolve),
        categories: profile.categories.map(cat => ({
            ...cat,
            modNames: cat.modNames.map(resolve),
        })),
    };
}

function resolveIsActive(mod, normalized) {
    if (normalized.inactiveMods.includes(mod.name)) return false;
    if (normalized.categories.some(cat => cat.modNames.includes(mod.name))) return true;
    return mod.isActive; // Nicht im Profil dann Plugins.txt-Status beibehalten
}

const openSections = new Set();
let cachedSettings = null;

initI18n();
initLogPanel();

window.starfieldAPI.onConfirmClose(async () => {
    const currentProfile = getCurrentProfile();
    const ok = await showConfirm(t('confirm.profile.dirty', { name: currentProfile.name }));
    if (ok) window.starfieldAPI.closeApp();
});

window.starfieldAPI.onNotifyUser(async (type, message) => {
    if (domReady) {
        await  handleNotification(type, message);
    } else {        
        pendingNotifications.push({ type, message });
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    domReady = true;
    for (const n of pendingNotifications) {
        await handleNotification(n.type, n.message);
    }
    pendingNotifications.length = 0;
});

async function handleNotification(type, message) {
    const translated = t(message) ?? message;
    switch (type) {
        case 'error':
            error(translated);
            await showConfirm(translated, true, false);
            break;
        case 'warning':
            warn(translated);
            break;
        default:
            info(translated);
            break;
    }
}

// Sprachumschalter verdrahten
document.querySelectorAll('.locale-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.locale === getLocale());
    btn.addEventListener('click', () => {
        setLocale(btn.dataset.locale);
        document.querySelectorAll('.locale-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.locale === getLocale())
        );
        renderPlugins(allPlugins); // Liste neu rendern mit neuen Texten
        reOpenPanel();
    });
});

// Emoji Picker
initEmojiPicker(emoji => {
    selectedIcon = emoji;
    catIconInput.value = emoji;
});
catIconInput.addEventListener('click', e => {
    e.stopPropagation();
    toggleEmojiPicker(catIconInput);
});
catIconInput.setAttribute('readonly', true);

// Drag & Drop
initDragDrop(
    () => ({ categories, allPlugins }),
    newCategories => {
        categories = newCategories;
        setDirty(true);
        refreshPlugins();
    },
    saveSnapshot
);

initCategoryDragDrop(
    () => ({ categories, allPlugins }),
    newCategories => {
        categories = newCategories;
        setDirty(true);
        refreshPlugins();
    },
    saveSnapshot
);

const FILE_ERRORS = new Set(["ENOENT", "ENOTDIR", "EACCES", "EPERM", "EISDIR"]);

function isFileError(code) {
    if (!code) return false;
    return FILE_ERRORS.has(code);
}

// Plugins vom Disk laden + ignorierte Masters herausfiltern (ohne Log-Ausgaben)
async function loadPluginsFromDisk(settings) {
    const plugins = await ipc(window.starfieldAPI.getPlugins());
    const baseMastersSet = new Set(settings.baseMasters.map(m => m.toLowerCase()));
    const blueprintMastersSet = new Set(settings.blueprintMasters.map(m => m.toLowerCase()));
    const toIgnore = new Set();
    if (settings.ignoreBaseMasters) baseMastersSet.forEach(m => toIgnore.add(m));
    if (settings.ignoreBlueprintMasters) blueprintMastersSet.forEach(m => toIgnore.add(m));
    return toIgnore.size > 0
        ? plugins.filter(m => !toIgnore.has(m.name.toLowerCase()))
        : plugins;
}

async function applyFreshPlugins(freshPlugins) {
    const profile = getCurrentProfile();
    const normalized = normalizeProfileModNames(profile, freshPlugins);
    categories = normalized.categories;
    allPlugins = freshPlugins.map(mod => ({
        ...mod,
        isActive: resolveIsActive(mod, normalized),
    }));
    updateCatalogFixButton(allPlugins);
    refreshPlugins();
    lastKnownMtimes = await ipc(window.starfieldAPI.getFileMtimes());
    info(t('softRefresh.reloaded'));
}

// TODO: Hier nochma reingucken bitte danke tschö
function showFocusChangeToast() {
    if (document.getElementById('focus-change-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'focus-change-toast';
    toast.className = 'focus-change-toast';
    toast.innerHTML = `
        <span>${t('softRefresh.externalChange')}</span>
        <button class="btn btn-sm" id="toast-reload">${t('softRefresh.reload')}</button>
        <button class="btn btn-sm btn-ghost" id="toast-dismiss">${t('softRefresh.dismiss')}</button>
    `;
    document.body.appendChild(toast);
    document.getElementById('toast-reload').addEventListener('click', async () => {
        toast.remove();
        try {
            const freshPlugins = await loadPluginsFromDisk(cachedSettings);
            setDirty(false);
            clearHistory();
            await applyFreshPlugins(freshPlugins);
        } catch {
            // ipc() hat den Fehler bereits geloggt; State bleibt unverändert? Vielleicht. Uff. 
        }
    });
    document.getElementById('toast-dismiss').addEventListener('click', () => toast.remove());
}

let _softRefreshTimer = null;
let lastKnownMtimes = null;

export async function softRefresh() {
    clearTimeout(_softRefreshTimer);
    _softRefreshTimer = setTimeout(_doSoftRefresh, 500);
}

async function _doSoftRefresh() {
    if (!cachedSettings || !lastKnownMtimes) return;
    let freshMtimes;
    try {
        freshMtimes = await ipc(window.starfieldAPI.getFileMtimes());
    } catch {
        return;
    }
    if (freshMtimes.pluginsTxt === lastKnownMtimes.pluginsTxt &&
        freshMtimes.contentCatalog === lastKnownMtimes.contentCatalog) return;

    if (isDirty) {
        lastKnownMtimes = freshMtimes;
        showFocusChangeToast();
    } else {
        try {
            const freshPlugins = await loadPluginsFromDisk(cachedSettings);
            await applyFreshPlugins(freshPlugins);
        } catch {
            // ipc() hat den Fehler bereits geloggt; lastKnownMtimes bleibt unverändert,
            // sodass der nächste Fokus die Änderung erneut erkennt
        }
    }
}

// Laden
async function init() {
    try {

        await initSettingsPage(() => isDirty, showConfirm);
        // Theme + Schriftgröße
        const earlySettings = await ipc(window.starfieldAPI.getSettings());
        applyTheme(earlySettings.theme ?? 'dark');
        applyFontSize(earlySettings.fontSize ?? 16);

        const [plugins, metaEntries, settings] = await Promise.all([
            ipc(window.starfieldAPI.getPlugins()),
            ipc(window.starfieldAPI.getMetadata()),
            ipc(window.starfieldAPI.getSettings()),
        ]);

        // Ignorierte Masters herausfiltern + loggen
        {
            const baseMastersSet = new Set(settings.baseMasters.map(m => m.toLowerCase()));
            const blueprintMastersSet = new Set(settings.blueprintMasters.map(m => m.toLowerCase()));
            const toIgnore = new Set();
            if (settings.ignoreBaseMasters) baseMastersSet.forEach(m => toIgnore.add(m));
            if (settings.ignoreBlueprintMasters) blueprintMastersSet.forEach(m => toIgnore.add(m));

            if (toIgnore.size > 0) {
                const ignoredPlugins = plugins.filter(m => toIgnore.has(m.name.toLowerCase()));
                if (settings.ignoreBaseMasters) {
                    const baseIgnored = ignoredPlugins
                        .filter(m => baseMastersSet.has(m.name.toLowerCase()))
                        .map(m => m.name);
                    if (baseIgnored.length > 0)
                        info(t('log.plugins.ignoredBase', { n: baseIgnored.length, names: baseIgnored.join(', ') }));
                }
                if (settings.ignoreBlueprintMasters) {
                    const bpOnly = ignoredPlugins
                        .filter(m => blueprintMastersSet.has(m.name.toLowerCase()) && !baseMastersSet.has(m.name.toLowerCase()))
                        .map(m => m.name);
                    if (bpOnly.length > 0)
                        info(t('log.plugins.ignoredBlueprint', { n: bpOnly.length, names: bpOnly.join(', ') }));
                }
                allPlugins = plugins.filter(m => !toIgnore.has(m.name.toLowerCase()));
            } else {
                allPlugins = plugins;
            }
        }

        // Profile initialisieren
        await initProfileManager(
            profile => {
                // Profil gewechselt
                const normalizedA = normalizeProfileModNames(profile, allPlugins);
                categories = normalizedA.categories;
                // Aktiv/Inaktiv aus Profil übernehmen. Und vielleicht auch behalten, diesmal
                allPlugins = allPlugins.map(mod => ({
                    ...mod,
                    isActive: resolveIsActive(mod, normalizedA),
                }));
                setDirty(false);
                clearHistory();
                refreshFilterTags(getMetadata(), categories, () => renderPlugins(allPlugins, false));
                renderPlugins(allPlugins);
            },
            () => isDirty,
            profile => checkProfileWarnings(profile, settings),
            () => allPlugins
        );

        // Kategorien aus aktivem Profil laden
        const profile = getCurrentProfile();
        const normalizedB = normalizeProfileModNames(profile, allPlugins);

        categories = normalizedB.categories;
        allPlugins = allPlugins.map(mod => ({
            ...mod,
            isActive: resolveIsActive(mod, normalizedB),
        }));

        checkProfileWarnings(profile, settings);
        updateCatalogFixButton(allPlugins);

        initLaunchBar(settings);

        const allTags = [
            ...metaEntries.flatMap(([, meta]) => meta.tags ?? []),
            ...categories.flatMap(c => c.tags ?? []),
        ];
        registerTags(allTags);

        loading.classList.add('hidden');
        pluginList.classList.remove('hidden');
        updatePluginCount();

        await initDetailPanel(
            () => categories,
            (modName, categoryId) => {
                moveModToCategory(modName, categoryId);
                // Panel neu öffnen damit Vorschlag verschwindet
                const mod = allPlugins.find(m => m.name === modName);
                if (mod) openPanel(mod);
            },
            () => renderPlugins(allPlugins),
            metaEntries,
            () => allPlugins,
            settings
        );

        initFilterPanel(getMetadata(), categories, () => renderPlugins(allPlugins, false));

        cachedSettings = settings;
        renderPlugins(allPlugins);

        window.starfieldAPI.onWindowFocus(() => softRefresh());
        lastKnownMtimes = await ipc(window.starfieldAPI.getFileMtimes());

        // Fenstergröße beim Schließen speichern
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('windowBounds', JSON.stringify({
                width: window.outerWidth,
                height: window.outerHeight,
                x: window.screenX,
                y: window.screenY,
            }));
        });

        // Gespeicherte Größe an Main schicken
        const savedBounds = localStorage.getItem('windowBounds');
        if (savedBounds) {
            ipc(window.starfieldAPI.setWindowBounds(JSON.parse(savedBounds)));
        }

    } catch (err) {
        if (isFileError(err.code)) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#e55';

            const h1 = document.createElement('h1');
            h1.style.color = 'inherit';
            h1.textContent = err.message;

            const pathP = document.createElement('p');
            pathP.textContent = err.path;

            const hintP = document.createElement('p');
            hintP.textContent = t('error.settings');

            errorDiv.appendChild(h1);
            errorDiv.appendChild(pathP);
            errorDiv.appendChild(hintP);

            loading.replaceChildren();
            loading.appendChild(errorDiv);

            error(t('error.settings'));
            error(err.path);

        } else {
            error(err.message ? err.message : err);
            loading.replaceChildren();

            const span = document.createElement('span');
            span.style.color = '#e55';
            span.textContent = `Fehler: ${err.message}`;

            loading.appendChild(span);
        }

    }
}

init();

// Collapse all & Expand all
btnExpandAll.addEventListener('click', () => {
    categories.map(c => c.id).forEach(id => openSections.add(id));
    renderPlugins(allPlugins);
});

btnCollapseAll.addEventListener('click', () => {
    openSections.clear();
    renderPlugins(allPlugins);
});


// Zahnrad Knopf für Settings. Kann man Knopf sagen? Ich sag oft Knopf. Das sind auch weniger Buchstaben als Button. Mh.
document.getElementById('btn-settings').addEventListener('click', openSettings);

// Speichern
btnSave.addEventListener('click', async () => {
    const inactiveMods = allPlugins.filter(m => !m.isActive).map(m => m.name);
    await saveCurrentProfile(categories, inactiveMods);
    success(t('log.profile.saved', { name: getCurrentProfile().name }));
    setDirty(false);
});

btnExport.addEventListener('click', async () => {
    // Prüfen ob es unkategorisierte Mods gibt
    const uncategorized = allPlugins.filter(m =>
        !categories.some(c => c.modNames.includes(m.name))
    );

    if (uncategorized.length > 0) {
        const confirmed = await showConfirm(
            t('confirm.exportUncategorized', { n: uncategorized.length, s: uncategorized.length !== 1 ? 's' : '' })
        );
        if (!confirmed) return;
    }

    try {
        btnExport.disabled = true;
        btnExport.innerHTML = t('export.exporting');
        await ipc(window.starfieldAPI.exportPlugins(allPlugins, categories, getLocale()));
        btnExport.innerHTML = t('export.done');
        setTimeout(() => {
            btnExport.innerHTML = t('export.button');
            btnExport.disabled = false;
        }, 2000);
        success(t('log.export.success'));
        updateDiffStatus(allPlugins, categories);
    } catch (err) {
        btnExport.innerHTML = t('export.error');
        console.error('Export fehlgeschlagen:', err);
        setTimeout(() => {
            btnExport.innerHTML = t('export.button');
            btnExport.disabled = false;
        }, 2000);
        error(t('log.export.error'));
    }
});

const btnFixCatalog = document.getElementById('btn-fix-catalog');
const bdgFixCatalog = document.getElementById('sync-badge');

export async function updateCatalogFixButton(plugins) {
    const { outOfSync: numberSyncs, updates: updates } = await ipc(window.starfieldAPI.getCatalogChanges());

    const hasCatalogErrors = plugins.some(m => m.catalogErrors && m.catalogErrors.length > 0) || numberSyncs > 0;

    if (hasCatalogErrors) {
        btnFixCatalog.classList.add('btn-warn');
        btnFixCatalog.classList.remove('sync-updates');
        bdgFixCatalog.classList.remove('bdg-sync-updates');

        btnFixCatalog.style.display = '';

        if (numberSyncs === 0) {
            bdgFixCatalog.classList.add('hidden');
        } else {
            bdgFixCatalog.textContent = numberSyncs;
            bdgFixCatalog.classList.remove('hidden');
        }
    } else if (updates > 0) {
        btnFixCatalog.classList.remove('btn-warn');
        btnFixCatalog.classList.add('sync-updates');
        bdgFixCatalog.classList.add('bdg-sync-updates');

        btnFixCatalog.style.display = '';
        bdgFixCatalog.textContent = updates;
        bdgFixCatalog.classList.remove('hidden');
    } else {
        btnFixCatalog.style.display = '';
        btnFixCatalog.classList.remove('btn-warn');
        btnFixCatalog.classList.remove('sync-updates');
        bdgFixCatalog.classList.remove('bdg-sync-updates');
        bdgFixCatalog.classList.add('hidden');
    }

}

btnFixCatalog.addEventListener('click', async () => {
    try {
        const syncedCount = await ipc(window.starfieldAPI.syncCatalog());

        const plugins = await ipc(window.starfieldAPI.getPlugins());
        allPlugins = plugins;
        updateCatalogFixButton(allPlugins);
        refreshPlugins();

        success(t('catalog.syncSuccess', { n: syncedCount }));
    } catch (err) {
        console.error('Catalog-Sync fehlgeschlagen:', err);
        error(t('catalog.syncError'));
    }
});

function setDirty(dirty) {
    isDirty = dirty;
    btnSave.disabled = !dirty;
    window.starfieldAPI.setDirty(dirty);
}

function refreshPlugins() {
    checkProfileWarnings(getCurrentProfile(), cachedSettings);
    renderPlugins(allPlugins);
}

function getAppState() {
    return {
        plugins: JSON.parse(JSON.stringify(allPlugins)),
        categories: JSON.parse(JSON.stringify(categories)),
    };
}

function setAppState({ plugins, categories: cats }) {
    allPlugins = plugins;
    categories = cats;
    setDirty(true);
    refreshPlugins();
}

initUndoRedo(getAppState, setAppState, setDirty, () => isDirty);

document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
});

// Suche
const searchClearBtn = document.getElementById('search-clear');
const searchWrapper = searchInput.closest('.search-wrapper');

function updateSearchClear() {
    searchWrapper.classList.toggle('has-value', searchInput.value.length > 0);
}

searchInput.addEventListener('input', () => {
    updateSearchClear();
    renderPlugins(allPlugins, false);
});

searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    updateSearchClear();
    renderPlugins(allPlugins, false);
    searchInput.focus();
});

function updatePluginCount(redoDiff = true) {
    const inactiveCount = allPlugins.filter(m => !m.isActive).length;
    pluginCount.innerHTML = `${t('app.plugins', { n: allPlugins.length })}<span class="plugin-count-inactive">${t('app.inactive', { n: inactiveCount })}</span>`;
    if (redoDiff) updateDiffStatus(allPlugins, categories);
}

// Plugin-Liste rendern
function renderPlugins(plugins, redoDiff = true) {
    updatePluginCount(redoDiff);
    pluginList.innerHTML = '';
    const query = searchInput.value.toLowerCase();

    // Find ghosts
    const allModNamesInCategories = categories.flatMap(c => c.modNames);
    const pluginNames = new Set(plugins.map(p => p.name));
    const ghostMods = allModNamesInCategories.filter(name => !pluginNames.has(name)).map(name => ({ name, isGhostMod: true }));

    plugins = [...plugins, ...ghostMods];

    const textFiltered = query
        ? plugins.filter(m => (m.title ?? m.name).toLowerCase().includes(query) || m.name.toLowerCase().includes(query))
        : plugins;
    const filtered = applyFilter(textFiltered, getMetadata());

    const categorized = new Map();
    const uncategorized = [];

    filtered.forEach(mod => {
        const cat = categories.find(c => c.modNames.includes(mod.name));
        if (cat) {
            if (!categorized.has(cat.id)) categorized.set(cat.id, []);
            categorized.get(cat.id).push(mod);
        } else {
            uncategorized.push(mod);
        }
    });

    // Bei aktivem Filter/Suche alle Kategorien mit Treffern aufklappen.
    // Das klappt manchmal ganz schön viel auf, aber besser als garnix. Und ich habt Knöpfe (!) eingebaut für das alles einklappern/ausklappern.
    if (query || hasActiveFilters()) {
        categorized.forEach((_, catId) => openSections.add(catId));
        if (uncategorized.length > 0) openSections.add('__uncategorized');
    }

    categories.forEach(cat => {
        const mods = categorized.get(cat.id) ?? [];
        // Reihenfolge laut category.modNames
        mods.sort((a, b) => {
            const ai = cat.modNames.indexOf(a.name);
            const bi = cat.modNames.indexOf(b.name);
            return ai - bi;
        });
        if ((query || hasActiveFilters()) && mods.length === 0) return;
        pluginList.appendChild(buildAccordion(cat, mods));
    });

    if (uncategorized.length > 0 || (!query && !hasActiveFilters())) {
        pluginList.appendChild(buildAccordion(
            { id: '__uncategorized', name: t('accordion.uncategorized'), icon: '❓', color: '#555', description: null },
            uncategorized
        ));
    }
}

function buildAccordion(cat, mods) {
    const section = document.createElement('li');
    section.className = 'accordion';
    section.dataset.categoryId = cat.id;

    const isOpen = openSections.has(cat.id) ?? true;

    // accordion-header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.style.setProperty('--cat-color', cat.color);

    // accordion-header-left
    const headerLeft = document.createElement('div');
    headerLeft.className = 'accordion-header-left';

    const arrow = document.createElement('div');
    arrow.className = `accordion-arrow ${isOpen ? 'open' : ''}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'accordion-icon';
    iconSpan.textContent = cat.icon;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'accordion-name';
    nameSpan.textContent = cat.name;

    headerLeft.appendChild(arrow);
    headerLeft.appendChild(iconSpan);
    headerLeft.appendChild(nameSpan);

    if (cat.description) {
        const descSpan = document.createElement('span');
        descSpan.className = 'accordion-desc';
        descSpan.textContent = cat.description;
        headerLeft.appendChild(descSpan);
    }

    if (cat.tags?.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'mod-tags';
        for (const tag of cat.tags) {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'mod-tag cat-tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        }
        headerLeft.appendChild(tagsDiv);
    }

    // accordion-count
    const countSpan = document.createElement('span');
    countSpan.className = 'accordion-count';
    countSpan.textContent = mods.length === 1
        ? t('accordion.mods.one')
        : t('accordion.mods.many', { n: mods.length });

    header.appendChild(headerLeft);
    header.appendChild(countSpan);

    // accordion-body
    const body = document.createElement('ul');
    body.className = `accordion-body ${isOpen ? 'open' : ''}`;

    section.appendChild(header);
    section.appendChild(body);

    //const body = section.querySelector('.accordion-body');
    mods.forEach(mod => body.appendChild(buildModItem(mod)));

    if (isOpen) {
        // Nach dem Einfügen in den DOM brauchen wir scrollHeight
        requestAnimationFrame(() => {
            body.style.maxHeight = body.scrollHeight + 'px';
        });
    }

    //const header = section.querySelector('.accordion-header');
    header.draggable = true;

    header.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        if (cat.id === '__uncategorized') return;
        showContextMenu(e.clientX, e.clientY, [
            {
                label: t('ctx.editCategory'),
                action: () => openCategoryDialog(cat),
            },
            {
                label: t('ctx.deleteCategory'),
                danger: true,
                action: () => deleteCategory(cat.id),
            },
        ]);
    });

    header.style.cursor = cat.id === '__uncategorized' ? 'default' : 'grab';

    header.addEventListener('click', () => {
        const arrow = section.querySelector('.accordion-arrow');
        const bodyEl = section.querySelector('.accordion-body');
        const opening = !bodyEl.classList.contains('open');

        arrow.classList.toggle('open', opening);
        bodyEl.classList.toggle('open', opening);

        if (opening) {
            bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
            openSections.add(cat.id);
        } else {
            bodyEl.style.maxHeight = '0';
            openSections.delete(cat.id);
        }
    });

    return section;
}

function formatModVersion(version) {
    const parts = version.split('.');
    const first = parseInt(parts[0], 10);
    if (!isNaN(first) && first > 978307200 && first < 4102444800) {
        const date = new Date(first * 1000).toLocaleDateString(getLocale());
        const rest = parts.slice(1).join('.');
        return rest ? `${date} v${rest}` : date;
    }
    return version;
}

function buildModItem(mod) {
    const li = document.createElement('li');
    li.className = 'plugin-item' +
        (mod.isActive ? '' : ' inactive') +
        (mod.isInstalled === false ? ' not-installed' : '');

    li.draggable = true;
    li.dataset.modName = mod.name;

    const displayName = mod.title ?? mod.name;
    const showFilename = mod.title !== null;
    const tags = getMetadata().get(mod.name)?.tags ?? [];

    const isBaseMaster = cachedSettings?.baseMasters
        ?.some(n => n.toLowerCase() === mod.name.toLowerCase()) ?? false;
    const isBlueprintMaster = cachedSettings?.blueprintMasters
        ?.some(n => n.toLowerCase() === mod.name.toLowerCase()) ?? false;

    // status-dot
    const statusDot = document.createElement('div');
    statusDot.className = 'status-dot';

    // plugin-name
    const pluginName = document.createElement('div');
    pluginName.className = 'plugin-name';

    const nameText = document.createTextNode(displayName);

    if (mod.profileWarnings && mod.profileWarnings.length > 0) {
        const warnSpan = document.createElement('span');
        warnSpan.className = 'warn-badge';
        warnSpan.dataset.tooltip = mod.profileWarnings.join('\n');
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.setAttribute('aria-hidden', 'true');
        warnSpan.appendChild(icon);
        pluginName.appendChild(warnSpan);
    }

    pluginName.appendChild(nameText);

    if (showFilename) {
        const filename = document.createElement('div');
        filename.className = 'filename';
        filename.textContent = mod.name;
        pluginName.appendChild(filename);
    }

    if (tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'mod-tags';
        for (const tag of tags) {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'mod-tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        }
        pluginName.appendChild(tagsDiv);
    }

    // plugin-meta
    const pluginMeta = document.createElement('div');
    pluginMeta.className = 'plugin-meta';

    if (isBaseMaster) {
        const span = document.createElement('span');
        span.className = 'tag tag-base-master';
        span.title = t('badge.baseMaster');
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-thumbtack';
        icon.setAttribute('aria-hidden', 'true');
        span.appendChild(icon);
        pluginMeta.appendChild(span);
    }

    if (isBlueprintMaster) {
        const span = document.createElement('span');
        span.className = 'tag tag-blueprint-master';
        span.title = t('badge.blueprintMaster');
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-gem';
        icon.setAttribute('aria-hidden', 'true');
        span.appendChild(icon);
        pluginMeta.appendChild(span);
    }

    const rating = getMetadata().get(mod.name)?.rating ?? null;
    if (rating) {
        const span = document.createElement('span');
        span.className = 'tag tag-rating';
        span.textContent = '★'.repeat(rating);
        pluginMeta.appendChild(span);
    }

    if (mod.achievementSafe === true) {
        const span = document.createElement('span');
        span.className = 'tag achievement';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-shield-halved';
        icon.setAttribute('aria-hidden', 'true');
        span.appendChild(icon);
        span.appendChild(document.createTextNode(' Achievements'));
        pluginMeta.appendChild(span);
    }

    if (mod.version) {
        const span = document.createElement('span');
        span.className = 'tag version';
        span.textContent = formatModVersion(mod.version);
        pluginMeta.appendChild(span);
    }

    li.appendChild(statusDot);
    li.appendChild(pluginName);
    li.appendChild(pluginMeta);

    if (mod === getSelectedDetailMod()) {
        li.classList.add('selected');
    }

    li.addEventListener('click', () => {
        openPanel(mod);
        document.querySelectorAll('.plugin-item.selected')
            .forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');
    });

    li.addEventListener('contextmenu', e => {
        e.preventDefault();

        const ctxIsBaseMaster = cachedSettings.baseMasters
            .some(n => n.toLowerCase() === mod.name.toLowerCase());
        const ctxIsBlueprintMaster = cachedSettings.blueprintMasters
            .some(n => n.toLowerCase() === mod.name.toLowerCase());

        const menu = [
            {
                label: t(mod.isActive ? 'ctx.deactivate' : 'ctx.activate'),
                action: () => toggleMod(mod.name),
            },
            {
                label: t('ctx.details'),
                action: () => {
                    openPanel(mod);
                    li.classList.add('selected');
                },
            },
            { separator: true },
            {
                label: t('ctx.moveToCategory'),
                submenu: [
                    ...categories.map(cat => ({
                        label: `${cat.icon} ${cat.name}`,
                        color: cat.color,
                        action: () => moveModToCategory(mod.name, cat.id),
                    })),
                    { label: t('ctx.uncategorized'), action: () => moveModToCategory(mod.name, null) },
                ],
            },
            { separator: true },
            {
                label: t(ctxIsBaseMaster ? 'ctx.removeFromBaseMasters' : 'ctx.addToBaseMasters'),
                action: () => toggleMasterList(mod.name, 'baseMasters'),
            },
            {
                label: t(ctxIsBlueprintMaster ? 'ctx.removeFromBlueprintMasters' : 'ctx.addToBlueprintMasters'),
                action: () => toggleMasterList(mod.name, 'blueprintMasters'),
            },
        ];

        if (mod.isGhostMod || !mod.isInstalled) {
            menu.push(...[
                { separator: true },
                {
                    label: t('ctx.removeFromProfile'),
                    action: () => removeFromProfile(mod),
                },
            ]);
        }


        showContextMenu(e.clientX, e.clientY, menu);
    });



    return li;
}

function toggleMod(modName) {
    const mod = allPlugins.find(m => m.name === modName);
    if (!mod) return;
    saveSnapshot();
    // isActive ist readonly, daher neues Objekt
    const idx = allPlugins.indexOf(mod);
    allPlugins[idx] = { ...mod, isActive: !mod.isActive };
    setDirty(true);
    refreshPlugins();
}

function moveModToCategory(modName, targetCategoryId) {
    saveSnapshot();
    const newCategories = JSON.parse(JSON.stringify(categories));
    // Aus allen Kategorien entfernen
    newCategories.forEach(c => {
        c.modNames = c.modNames.filter(n => n !== modName);
    });
    // In Zielkategorie einfügen
    if (targetCategoryId) {
        const target = newCategories.find(c => c.id === targetCategoryId);
        target?.modNames.push(modName);
    }
    categories = newCategories;
    setDirty(true);
    refreshPlugins();
}

async function removeFromProfile(mod) {
    if (!mod) return;

    saveSnapshot();

    getCurrentProfile().inactiveMods = getCurrentProfile().inactiveMods.filter(name => name !== mod.name);
    getCurrentProfile().categories.forEach(cat => {
        cat.modNames = cat.modNames.filter(name => name !== mod.name);
    });

    categories = [...getCurrentProfile().categories];

    setDirty(true);
    refreshPlugins();
}

async function toggleMasterList(modName, listKey) {
    const list = cachedSettings[listKey];
    const idx = list.findIndex(n => n.toLowerCase() === modName.toLowerCase());
    if (idx === -1) list.push(modName);
    else list.splice(idx, 1);
    await ipc(window.starfieldAPI.saveSettings(cachedSettings));
    refreshPlugins();
    reOpenPanel();
}

// Diff-Dialog
initDiffDialog();
btnDiff.addEventListener('click', () => openDiffDialog(allPlugins, categories));
initConflictDialog();
initAboutDialog();
initSavegameDialog(() => allPlugins);
initTooltips();
document.getElementById('about-trigger').addEventListener('click', openAboutDialog);
btnConflicts?.addEventListener('click', () => {
    const names = allPlugins.filter(m => m.isInstalled).map(m => m.name);
    openConflictDialog(names);
});

// Kategorie-Dialog
btnAddCategory.addEventListener('click', () => openCategoryDialog(null));
btnCancel.addEventListener('click', closeDialog);
//overlay.addEventListener('click', e => { if (e.target === overlay) closeDialog(); });
//overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeDialog(); });

function openCategoryDialog(existing) {
    editingCategoryId = existing?.id ?? null;

    // Felder vorbelegen
    document.getElementById('cat-name').value = existing?.name ?? '';
    document.getElementById('cat-desc').value = existing?.description ?? '';
    catIconInput.value = existing?.icon ?? '';
    selectedIcon = existing?.icon ?? '📦';
    selectedColor = existing?.color ?? '#5599ff';

    // Farb-Picker aktualisieren
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('selected', s.dataset.color === selectedColor);
    });

    // Dialog-Titel und Button-Label anpassen
    document.querySelector('.dialog h2').textContent =
        existing ? t('dialog.editCategory') : t('dialog.newCategory');
    btnSaveCategory.textContent = existing ? t('dialog.saveChanges') : t('dialog.create');

    // Tags
    const catTagsContainer = document.getElementById('cat-tags-container');
    catTagsContainer.innerHTML = '';
    categoryTagInput = createTagInput(existing?.tags ?? [], () => { });
    catTagsContainer.appendChild(categoryTagInput.element);

    overlay.classList.remove('hidden');
}

document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = swatch.dataset.color;
    });
});

btnSaveCategory.addEventListener('click', async () => {
    const name = document.getElementById('cat-name').value.trim();
    if (!name) { document.getElementById('cat-name').focus(); return; }
    saveSnapshot();

    if (editingCategoryId) {
        // Edit-Modus
        const cat = categories.find(c => c.id === editingCategoryId);
        if (cat) {
            cat.name = name;
            cat.icon = selectedIcon;
            cat.color = selectedColor;
            cat.description = document.getElementById('cat-desc').value.trim() || null;
            cat.tags = categoryTagInput?.getTags() ?? [];
        }
    } else {
        // Neu anlegen
        categories.push({
            id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            color: selectedColor,
            icon: selectedIcon,
            description: document.getElementById('cat-desc').value.trim() || null,
            modNames: [],
            tags: categoryTagInput?.getTags() ?? [],
        });
    }

    setDirty(true);
    renderPlugins(allPlugins);
    closeDialog();
});

function closeDialog() {
    overlay.classList.add('hidden');
    editingCategoryId = null;
    categoryTagInput = null;
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-desc').value = '';
    catIconInput.value = '';
    selectedIcon = '📦';
    selectedColor = '#5599ff';
    document.querySelector('.dialog h2').textContent = t('dialog.newCategory');
    btnSaveCategory.textContent = t('dialog.create');
    document.querySelectorAll('.color-swatch').forEach((s, i) => s.classList.toggle('selected', i === 0));
}

async function deleteCategory(categoryId) {
    const ok = await showConfirm(
        t('confirm.deleteCategory')
    );
    if (!ok) return;
    saveSnapshot();
    categories = categories.filter(c => c.id !== categoryId);
    setDirty(true);
    renderPlugins(allPlugins);
}

// html: true nur für statische i18n-Strings verwenden, nicht so für Nutzerdaten. Aber wenn wir ehrlich sind, wenn die Nutzer Unsinn eingeben,
// dann kommt halt Unsinn raus. Naja. Ich mach das oft. Also lieber sicher. I try.
export function showConfirm(message, errorOnly = false, html = false) {
    return new Promise(resolve => {
        confirmMessage[html ? 'innerHTML' : 'textContent'] = message;
        confirmOverlay.classList.remove('hidden');

        confirmCancel.classList.toggle('hidden', errorOnly);

        function cleanup(result) {
            confirmOverlay.classList.add('hidden');
            confirmOk.removeEventListener('click', onOk);
            confirmCancel.removeEventListener('click', onCancel);
            resolve(result);
        }

        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);

        confirmOk.addEventListener('click', onOk);
        confirmCancel.addEventListener('click', onCancel);
    });
}

export function showError(message) {
    return showConfirm(message, true);
}

function getProfileLoadOrder() {
    const written = new Set();
    const ordered = [];
    categories.forEach(cat => {
        cat.modNames.forEach(modName => {
            const mod = allPlugins.find(m => m.name === modName);
            if (mod) { ordered.push(mod); written.add(modName); }
        });
    });
    allPlugins.forEach(mod => {
        if (!written.has(mod.name)) ordered.push(mod);
    });
    return ordered;
}

function initTooltips() {
    const tooltip = document.createElement('div');
    tooltip.id = 'global-tooltip';
    document.body.appendChild(tooltip);

    document.addEventListener('mouseover', e => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        const text = target.dataset.tooltip;
        if (!text) return;

        tooltip.textContent = text;
        tooltip.style.display = 'block';

        const rect = target.getBoundingClientRect();
        const tRect = tooltip.getBoundingClientRect();

        const isLeft = target.classList.contains('tooltip-left');
        let top = rect.bottom + 4;
        let left = isLeft
            ? rect.right - tRect.width
            : rect.left + rect.width / 2 - tRect.width / 2;

        if (left + tRect.width > window.innerWidth - 8) left = window.innerWidth - tRect.width - 8;
        if (left < 8) left = 8;
        if (top + tRect.height > window.innerHeight - 8) top = rect.top - tRect.height - 4;

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    });

    document.addEventListener('mouseout', e => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        if (!target.contains(e.relatedTarget)) {
            tooltip.style.display = 'none';
        }
    });
}

function addProfileWarning(mod, msg) {
    if (!mod) return;
    mod.profileWarnings = mod.profileWarnings ?? [];
    mod.profileWarnings.push(msg);
}

function checkInstalledPluginsNotInProfile(installedPlugins, profileModNamesSet, baseMasters, blueprintMasters) {
    installedPlugins.forEach(mod => {
        const nameLower = mod.name.toLowerCase();
        if (profileModNamesSet.has(nameLower)) return;
        if (baseMasters.has(nameLower)) return;
        if (blueprintMasters.has(nameLower)) return;
        if (mod.isActive) {
            info(t('log.mod.notInProfile.Active', { name: mod.title ?? mod.name }));
        } else {
            info(t('log.mod.notInProfile', { name: mod.title ?? mod.name }));
        }
    });
}

function checkProfileWarnings(profile, settings) {
    const blueprintMasters = new Set(settings.blueprintMasters.map(m => m.toLowerCase()));
    const baseMasters = new Set(settings.baseMasters.map(m => m.toLowerCase()));
    const installedMods = new Set(allPlugins.filter(m => m.isInstalled).map(m => m.name.toLowerCase()));
    const activeMods = new Set(allPlugins.filter(m => m.isInstalled && m.isActive).map(m => m.name.toLowerCase()));
    const profileModNames = categories.flatMap(c => c.modNames);
    const profileModNamesSet = new Set(profileModNames.map(m => m.toLowerCase()));

    clearWarnings();

    allPlugins.forEach(mod => {
        mod.profileWarnings = null;
    })

    // Fehlende Mods aus Profil
    profileModNames.forEach(modName => {
        const mod = allPlugins.find(m => m.name === modName);
        if (!mod || mod.isInstalled === false) {
            error(t('log.mod.notInstalled', { name: mod?.title ?? modName }));
        }
    });

    // Master-Abhängigkeiten prüfen
    const installedPlugins = allPlugins.filter(m => m.isInstalled);
    const inactiveMasterDependents = new Map(); // masterName (lower) auf displayName[]
    installedPlugins.forEach(mod => {
        
        if(!mod.isActive) return; // Inaktive Mods haben keine relevanten Abhängigkeiten, weil sie ja inaktiv sind. Jawohohol. Logik!

        mod.masters.forEach(master => {
            const masterLower = master.toLowerCase();
            if (baseMasters.has(masterLower)) return; // Base Masters ignorieren
            if (!installedMods.has(masterLower)) {
                error(t('log.mod.missingMaster', { name: mod.title ?? mod.name, master }));
                addProfileWarning(mod, t('warn.missingMaster', { master }));
            } else if (!activeMods.has(masterLower)) {
                error(t('log.mod.masterInactive', { name: mod.title ?? mod.name, master }));
                addProfileWarning(mod, t('warn.masterInactive', { master }));
                if (!inactiveMasterDependents.has(masterLower)) inactiveMasterDependents.set(masterLower, []);
                inactiveMasterDependents.get(masterLower).push(mod.title ?? mod.name);
            }
        });
        mod.missingMasters.forEach(master => {
            error(t('log.mod.missingMaster.File', { name: mod.title ?? mod.name, master }));
            addProfileWarning(mod, t('warn.missingMasterFile', { master }));
        });
    });

    // Warnungen für inaktive Master selbst (zeigt abhängige Mods im Tooltip)
    inactiveMasterDependents.forEach((dependents, masterLower) => {
        const masterMod = allPlugins.find(m => m.name.toLowerCase() === masterLower);
        addProfileWarning(masterMod,
            t('warn.dependentsHeader') + '\n' + dependents.map(n => `  • ${n}`).join('\n'));
    });

    checkInstalledPluginsNotInProfile(installedPlugins, profileModNamesSet, baseMasters, blueprintMasters);

    // Version in Catalog prüfen
    allPlugins.forEach(plg => {
        if (plg.catalogErrors && Array.isArray(plg.catalogErrors) && plg.catalogErrors.length > 0) {
            plg.catalogErrors.forEach(err => {
                const msg = t(err, { name: plg.name });
                error(msg);
                addProfileWarning(plg, msg);
            });
        }

        if (plg.catalogWarnings && Array.isArray(plg.catalogWarnings) && plg.catalogWarnings.length > 0) {
            plg.catalogWarnings.forEach(err => {
                const msg = t(err, { name: plg.name });
                warn(msg);
                addProfileWarning(plg, msg);
            });
        }
    });

    // Blueprint-Abhängigkeiten
    allPlugins.forEach(mod => {
        if (mod.masters.some(m => blueprintMasters.has(m.toLowerCase()))) {
            warn(t('log.mod.blueprintDep', { name: mod.title ?? mod.name }));
            // addProfileWarning(mod, t('warn.blueprintDep')); // <-- nope, not important here
        }
    });

    // Ladereihenfolge prüfen
    const profileOrder = getProfileLoadOrder();
    const modIndex = new Map(profileOrder.map((m, i) => [m.name.toLowerCase(), i]));
    const baseMastersSet = new Set(settings.baseMasters.map(m => m.toLowerCase()));

    allPlugins.filter(m => m.isInstalled && m.isActive).forEach(mod => { // Inaktive Mods haben keine relevanten Abhängigkeiten, weil sie ja inaktiv sind.
        const modIdx = modIndex.get(mod.name.toLowerCase());
        mod.masters.forEach(master => {
            const masterLower = master.toLowerCase();
            if (baseMastersSet.has(masterLower)) return; // Base Masters ignorieren
            const masterIdx = modIndex.get(masterLower);
            if (masterIdx === undefined) return; // nicht in Liste also bereits durch missingMasters abgedeckt
            if (masterIdx > modIdx) {
                error(t('log.mod.masterOrder', { name: mod.title ?? mod.name, master }));
                addProfileWarning(mod, t('warn.masterOrder', { master }));
            }
        });
    });
}