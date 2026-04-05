// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js'; 
import { t, getLocale } from './i18n.js';
import { createTagInput } from './tagInput.js';
import { suggestCategories } from './categoryMatcher.js';

let selectedMod = null;
let metadata = new Map();
let currentRating = null;
let getCategories = null;
let isUrlPrefilled = false;
let modTagInput = null;
let onAssignCategory = null;
let onMetadataChange = null;
let getPlugins = null;
let cachedSettings = null;

const panel = document.getElementById('detail-panel');
const detailIcon = document.getElementById('detail-icon');
const detailName = document.getElementById('detail-name');
const detailFilename = document.getElementById('detail-filename');
const detailCategory = document.getElementById('detail-category');
const detailAchievement = document.getElementById('detail-achievement');
const detailUrl = document.getElementById('detail-url');
const detailUrlOpen = document.getElementById('detail-url-open');
const detailNotes = document.getElementById('detail-notes');
const detailSave = document.getElementById('detail-save');
const detailClose = document.getElementById('detail-close');
const stars = document.querySelectorAll('.star');

// Tag im Panel
const detailBody = document.querySelector('.detail-body');

const pluginInfoSection = document.createElement('div');
pluginInfoSection.id = 'detail-plugin-info';
pluginInfoSection.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
detailBody.appendChild(pluginInfoSection);

// Tags
const tagsSection = document.createElement('div');
tagsSection.className = 'detail-field';
tagsSection.innerHTML = `<label class="detail-label">${t('detail.tags')}</label>`;
detailBody.appendChild(tagsSection);

// Vorschläge
const suggestionSection = document.createElement('div');
suggestionSection.className = 'detail-field';
suggestionSection.id = 'suggestion-section';
detailBody.appendChild(suggestionSection);


function initResizeHandle() {
    const handle = document.getElementById('detail-resize-handle');
    if (!handle) return;

    const savedWidth = localStorage.getItem('detailPanelWidth');
    if (savedWidth) {
        document.documentElement.style.setProperty('--detail-panel-width', `${savedWidth}px`);
    }

    let startX = 0;
    let startWidth = 0;

    function onMouseMove(e) {
        const delta = startX - e.clientX;
        const newWidth = Math.min(600, Math.max(200, startWidth + delta));
        document.documentElement.style.setProperty('--detail-panel-width', `${newWidth}px`);
    }

    function onMouseUp(e) {
        const delta = startX - e.clientX;
        const newWidth = Math.min(600, Math.max(200, startWidth + delta));
        localStorage.setItem('detailPanelWidth', String(newWidth));
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        handle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = panel.offsetWidth;
        handle.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

export async function initDetailPanel(getCats, assignCategory, metadataChanged, initialMetaEntries, getPluginsFn, initialSettings) {
    onMetadataChange = metadataChanged;
    getCategories = getCats;
    getPlugins = getPluginsFn;
    onAssignCategory = assignCategory;
    metadata = new Map(initialMetaEntries);
    cachedSettings = initialSettings;

    initResizeHandle();
    detailClose.addEventListener('click',async () => {
        await closePanel();
    });

    // Sterne für Rating
    stars.forEach(star => {
        star.addEventListener('click', () => setRating(parseInt(star.dataset.value)));
        star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.value)));
        star.addEventListener('mouseleave', () => highlightStars(currentRating ?? 0));
    });

    // URL öffnen. Weiß noch nich ob das ne gute Idee is.
    detailUrlOpen.addEventListener('click', () => {
        const url = detailUrl.value.trim();
        if (url) ipc(window.starfieldAPI.openUrl(resolveUrl(url)));
    });

    detailUrl.addEventListener('input', () => { isUrlPrefilled = false; });

    // Speichern
    detailSave.addEventListener('click', async () => {
        await saveDetail();
    });
}

function hasChanges() {
    if (!selectedMod) return false;
    const existing = metadata.get(selectedMod.name);
    const newDescription = detailNotes.value.trim() || null;
    const newUrl = isUrlPrefilled ? null : (detailUrl.value.trim() || null);
    const newRating = currentRating;
    const newTags = modTagInput?.getTags() ?? [];

    if (!existing) {
        return newDescription !== null || newUrl !== null || newRating !== null || newTags.length > 0;
    }

    if (existing.description !== newDescription) return true;
    if (existing.url !== newUrl) return true;
    if (existing.rating !== newRating) return true;

    const existingTags = existing.tags ?? [];
    if (existingTags.length !== newTags.length) return true;
    
    const sorted = (arr) => [...arr].sort();
    const sortedNew = sorted(newTags);
    return sorted(existingTags).some((t, i) => t !== sortedNew[i]);
}

async function saveDetail(selectOtherModAfterSave) {

    if (!selectedMod) return;
    if (!hasChanges()) return;

    metadata.set(selectedMod.name, {
        modName: selectedMod.name,
        description: detailNotes.value.trim() || null,
        url: isUrlPrefilled ? null : (detailUrl.value.trim() || null),
        rating: currentRating,
        tags: modTagInput?.getTags() ?? [],
    });
    await ipc(window.starfieldAPI.saveMetadata(Array.from(metadata.entries())));

    if(selectOtherModAfterSave){
        selectedMod = selectOtherModAfterSave;
    }

    onMetadataChange?.();
    if(!selectOtherModAfterSave) {
        detailSave.innerHTML = t('detail.saved');
        setTimeout(() => { detailSave.innerHTML = t('detail.save'); }, 1500);
    }
}

function resolveUrl(url) {
    if (!url) return '';
    return url.replace('{locale}', getLocale());
}

export async function reOpenPanel() {
    const sMod = selectedMod;
    await closePanel();
    if (sMod) {
        await openPanel(sMod);
    }
}

export function getSelectedDetailMod() {
    return selectedMod;
}

export async function openPanel(mod) {
    // Alten ausgewählten Mod deselektieren. Also alle. Because maybe I fucked that up. Again. :(
    document.querySelectorAll('.plugin-item.selected')
        .forEach(el => el.classList.remove('selected'));

    if(selectedMod && selectedMod !== mod) {
        await saveDetail(mod);        
    }

    detailSave.innerHTML = t('detail.save');
    selectedMod = mod;
    const meta = metadata.get(mod.name);
    const categories = getCategories();
    const cat = categories.find(c => c.modNames.includes(mod.name));

    // Header
    if (cat?.icon) {
        detailIcon.textContent = cat.icon;
    } else {
        detailIcon.innerHTML = '<i class="fa-solid fa-layer-group" aria-hidden="true"></i>';
    }
    detailName.textContent = mod.title ?? mod.name;
    detailFilename.textContent = mod.title ? mod.name : '';

    // Infos
    detailAchievement.textContent = mod.achievementSafe === true ? t('detail.achievementYes') :
        mod.achievementSafe === false ? t('detail.achievementNo') :
            t('detail.achievementUnknown');
    detailCategory.textContent = cat ? `${cat.icon} ${cat.name}` : t('detail.uncategorized');

    // URL
    const prefilled = !meta?.url && !!mod.creationsUrl;
    isUrlPrefilled = prefilled;
    detailUrl.value = meta?.url ?? resolveUrl(mod.creationsUrl ?? '');

    // Metadaten
    detailNotes.value = meta?.description ?? '';
    currentRating = meta?.rating ?? null;
    highlightStars(currentRating ?? 0);

    // Plugin Typ
    function getPluginType(mod) {
        let types = [];

        if(mod.isMaster) {
            types.push(t('detail.type.esm'))
        }
        if(mod.isLightMaster) {
            types.push(t('detail.type.esl'))
        }
        if(mod.isMediumMaster) {
            types.push(t('detail.type.esh'))
        }
        if(mod.isOverlay) {
            types.push(t('detail.type.overlay'))
        }

        if(types.length == 0) {
            return t('detail.type.esp');
        }

        return types.join(', ');
    }

    // Plugin Info Sektion neu aufbauen
    const pluginInfoSection = document.getElementById('detail-plugin-info');
    pluginInfoSection.innerHTML = '';

    // Typ
    pluginInfoSection.appendChild(buildDetailRow(t('detail.pluginType'), getPluginType(mod)));

    // Autor (nur wenn da)
    if (mod.pluginAuthor) {
        pluginInfoSection.appendChild(buildDetailRow(t('detail.pluginAuthor'), mod.pluginAuthor));
    }

    // Version (nur wenn verfügbar)
    if (mod.version) {
        pluginInfoSection.appendChild(buildDetailRow(t('detail.version'), formatModVersion(mod.version)));
    }

    // Plugin-Beschreibung (nur wenn ausgelesen)
    if (mod.pluginDescription) {
        const field = document.createElement('div');
        field.className = 'detail-field';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'detail-label';
        labelSpan.textContent = t('detail.pluginDescription');

        const valueSpan = document.createElement('span');
        valueSpan.className = 'detail-value';
        valueSpan.style.whiteSpace = 'pre-wrap';
        valueSpan.style.lineHeight = '1.5';
        valueSpan.textContent = mod.pluginDescription;

        field.appendChild(labelSpan);
        field.appendChild(valueSpan);
        pluginInfoSection.appendChild(field);
    }

    // Abhängigkeiten
    const baseMasters = new Set(cachedSettings.baseMasters.map(m => m.toLowerCase()));
    const blueprintMasters = new Set(cachedSettings.blueprintMasters.map(m => m.toLowerCase()));

    // Master Badges
    const modLower = mod.name.toLowerCase();
    const masterBadges = [];
    if (baseMasters.has(modLower))
        masterBadges.push(`<span class="master-list-badge master-list-badge--base"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i> ${t('badge.baseMaster')}</span>`);
    if (blueprintMasters.has(modLower))
        masterBadges.push(`<span class="master-list-badge master-list-badge--blueprint"><i class="fa-solid fa-gem" aria-hidden="true"></i> ${t('badge.blueprintMaster')}</span>`);
    if (masterBadges.length > 0) {
        const badgeRow = document.createElement('div');
        badgeRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
        badgeRow.innerHTML = masterBadges.join('');
        pluginInfoSection.appendChild(badgeRow);
    }

    const mastersField = document.createElement('div');
    mastersField.className = 'detail-field';
    mastersField.innerHTML = `<span class="detail-label">${t('detail.masters')}</span>`;
    
    if (mod.isGhostMod) { // GHOST IN THE STARF... okay, ich lass es ja schon
        const warnGhost = document.createElement('span');
        warnGhost.className = 'detail-ghost';
        warnGhost.textContent = t('detail.ghost');
        mastersField.appendChild(warnGhost);
    }
    else if (mod.masters.length === 0) {
        const none = document.createElement('span');
        none.className = 'detail-value';
        none.textContent = t('detail.masters.none');
        mastersField.appendChild(none);
    } else {
        const list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:3px;margin-top:4px;';
        mod.masters.forEach(master => {
            const masterLower = master.toLowerCase();
            const isBase = baseMasters.has(masterLower);
            const isBlueprint = blueprintMasters.has(masterLower);
            const masterMod = (getPlugins() ?? []).find(m => m.name.toLowerCase() === masterLower);
            const isMissing = !isBase && (!masterMod || !masterMod.isInstalled);
            const isBlueprintDep = isBlueprint;

            const chip = buildChip(isMissing, isBlueprintDep, master);

            if (isMissing) chip.title = t('detail.masters.missing');
            if (isBlueprintDep) chip.title = t('detail.masters.blueprint');

            list.appendChild(chip);
        });
        mastersField.appendChild(list);
    }
    pluginInfoSection.appendChild(mastersField);

    // Tags
    tagsSection.innerHTML = `<label class="detail-label">${t('detail.tags')}</label>`;
    const currentMeta = metadata.get(mod.name);
    modTagInput = createTagInput(currentMeta?.tags ?? [], (newTags) => {
        renderSuggestions(mod, newTags);
    });
    tagsSection.appendChild(modTagInput.element);

    // Vorschlag nur wenn unkategorisiert. Ooooder wenn man nen Tag dazu macht? Think about it!
    if (!cat) {
        renderSuggestions(mod, currentMeta?.tags ?? []);
    } else {
        suggestionSection.innerHTML = '';
    }

    panel.classList.remove('hidden');
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

function buildChip(isMissing, isBlueprintDep, master) {
    const chip = document.createElement('span');
    chip.className = 'master-chip' +
        (isMissing ? ' missing' : '') +
        (isBlueprintDep ? ' blueprint' : '');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'master-icon';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-puzzle-piece';
    icon.setAttribute('aria-hidden', 'true');

    iconSpan.appendChild(icon);
    chip.appendChild(iconSpan);

    const textNode = document.createTextNode(master);
    chip.appendChild(textNode);

    return chip;
}

function buildDetailRow(label, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'detail-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'detail-value';
    valueSpan.textContent = value;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);

    return row;
}

function renderSuggestions(mod, modTags) {
    const categories = getCategories();
    const suggestions = suggestCategories(modTags, categories);
    suggestionSection.innerHTML = '';

    if (modTags.length === 0) return;

    const box = document.createElement('div');
    box.className = 'suggestion-box';
    box.innerHTML = `<span class="detail-label"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> ${t('detail.suggestedCategory')}</span>`;

    if (suggestions.length === 0) {
        const none = document.createElement('span');
        none.style.cssText = 'font-size:0.82rem;color:#555;';
        none.textContent = t('detail.noSuggestion');
        box.appendChild(none);
    } else {
        const list = document.createElement('div');
        list.className = 'suggestion-list';

        suggestions.forEach(({ cat, matches, score }) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';

            const leftSpan = document.createElement('span');
            leftSpan.textContent = `${cat.icon} ${cat.name}`;

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'suggestion-score';
            scoreSpan.textContent = `${score} Tag${score !== 1 ? 's' : ''}`;

            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.dataset.catId = cat.id;
            button.textContent = t('detail.assignCategory');

            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.alignItems = 'center';
            rightDiv.style.gap = '8px';
            rightDiv.appendChild(scoreSpan);
            rightDiv.appendChild(button);

            item.appendChild(leftSpan);
            item.appendChild(rightDiv);
            
            item.querySelector('button').addEventListener('click', async () => {
                await saveDetail();
                onAssignCategory(mod.name, cat.id);
            });
            list.appendChild(item);
        });

        box.appendChild(list);
    }

    suggestionSection.appendChild(box);
}

export async function closePanel() {
    await saveDetail();
    panel.classList.add('hidden');
    document.querySelectorAll('.plugin-item.selected')
        .forEach(el => el.classList.remove('selected'));
    selectedMod = null;
}

function setRating(value) {
    currentRating = currentRating === value ? null : value; // nochmal klicken = zurücksetzen
    highlightStars(currentRating ?? 0);
}

function highlightStars(value) {
    stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= value));
}

export function getMetadata() { return metadata; }