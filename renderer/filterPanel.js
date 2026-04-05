// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { t } from './i18n.js';

// ── Filter-State ────────────────────────────────────────────────────────────

const defaultState = () => ({
    status: 'all',      // 'all' | 'active' | 'inactive' | 'not-installed'
    types: new Set(),   // 'master' | 'lightMaster' | 'overlay' | 'regular' | 'achievementSafe' | 'notAchievementSafe' | 'missingMasters'
    tags: new Set(),    // AND-Logik: Mod muss alle ausgewählten Tags haben
    minRating: 0,
    hasUrl: false,
    hasNotes: false,
    hasWarnings: false,
    noTags: false,
});

let filterState = defaultState();

export function getFilterState() { return filterState; }

export function hasActiveFilters() {
    return filterState.status !== 'all'
        || filterState.types.size > 0
        || filterState.tags.size > 0
        || filterState.minRating > 0
        || filterState.hasUrl
        || filterState.hasNotes
        || filterState.hasWarnings
        || filterState.noTags;
}

const panel       = document.getElementById('filter-panel');
const btnFilter   = document.getElementById('btn-filter');
const badge       = document.getElementById('filter-badge');
const btnReset    = document.getElementById('filter-reset');
const statusGroup = document.getElementById('filter-status-group');
const typeGroup   = document.getElementById('filter-type-group');
const ratingGroup = document.getElementById('filter-rating-group');
const quickGroup  = document.getElementById('filter-quick-group');
const tagGroup    = document.getElementById('filter-tag-group');

function countActiveFilters() {
    let n = 0;
    if (filterState.status !== 'all') n++;
    n += filterState.types.size;
    n += filterState.tags.size;
    if (filterState.minRating > 0) n++;
    if (filterState.hasUrl)      n++;
    if (filterState.hasNotes)    n++;
    if (filterState.hasWarnings) n++;
    if (filterState.noTags)      n++;
    return n;
}

function updateBadge() {
    const n = countActiveFilters();
    badge.textContent = n;
    badge.classList.toggle('hidden', n === 0);
    btnFilter.classList.toggle('filter-btn-active', n > 0);
}

let isOpen = false;

function openPanel() {
    panel.classList.remove('hidden');
    isOpen = true;
    const btnRect = btnFilter.getBoundingClientRect();
    panel.style.top   = (btnRect.bottom + 6) + 'px';
    panel.style.right = (document.documentElement.clientWidth - btnRect.right) + 'px';
}

function closePanel() {
    panel.classList.add('hidden');
    isOpen = false;
}

function togglePanel() {
    isOpen ? closePanel() : openPanel();
}

export function collectAllTags(metadata, categories) {
    const seen = new Set();
    metadata.forEach(meta => (meta.tags ?? []).forEach(tag => seen.add(tag)));
    categories.forEach(cat => (cat.tags ?? []).forEach(tag => seen.add(tag)));
    return [...seen].sort((a, b) => a.localeCompare(b));
}

function buildTagCloud(allTags, onChange) {
    tagGroup.innerHTML = '';
    if (allTags.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'filter-no-tags';
        empty.textContent = t('filter.noTags');
        tagGroup.appendChild(empty);
        return;
    }
    allTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip filter-chip-check';
        btn.dataset.value = tag;
        btn.textContent = tag;
        if (filterState.tags.has(tag)) btn.classList.add('active');
        btn.addEventListener('click', () => {
            filterState.tags.has(tag) ? filterState.tags.delete(tag) : filterState.tags.add(tag);
            btn.classList.toggle('active', filterState.tags.has(tag));
            updateBadge();
            onChange?.();
        });
        tagGroup.appendChild(btn);
    });
}

export function refreshFilterTags(metadata, categories, onChange) {
    const allTags = collectAllTags(metadata, categories);
    // Veraltete Tags aus State entfernen
    const tagSet = new Set(allTags);
    for (const tag of filterState.tags) {
        if (!tagSet.has(tag)) filterState.tags.delete(tag);
    }
    buildTagCloud(allTags, onChange);
    updateBadge();
}

function wireRadioGroup(groupEl, onSelect) {
    groupEl.querySelectorAll('.filter-chip-radio').forEach(btn => {
        btn.addEventListener('click', () => {
            groupEl.querySelectorAll('.filter-chip-radio').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onSelect(btn.dataset.value);
            updateBadge();
            onChangeCallback?.();
        });
    });
}

function wireCheckGroup(groupEl, stateSet) {
    groupEl.querySelectorAll('.filter-chip-check').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = btn.dataset.value;
            stateSet.has(v) ? stateSet.delete(v) : stateSet.add(v);
            btn.classList.toggle('active', stateSet.has(v));
            updateBadge();
            onChangeCallback?.();
        });
    });
}

function resetAll() {
    filterState = defaultState();
    [statusGroup, ratingGroup].forEach(g => {
        const chips = g.querySelectorAll('.filter-chip-radio');
        chips.forEach((b, i) => b.classList.toggle('active', i === 0));
    });
    [typeGroup, quickGroup, tagGroup].forEach(g => {
        g.querySelectorAll('.filter-chip-check').forEach(b => b.classList.remove('active'));
    });
    document.getElementById('filter-no-tags-chip')?.classList.remove('active');
    updateBadge();
    onChangeCallback?.();
}

let onChangeCallback = null;
let eventsWired = false;

export function initFilterPanel(metadata, categories, onChange) {
    onChangeCallback = onChange;

    buildTagCloud(collectAllTags(metadata, categories), onChange);

    if (eventsWired) return;
    eventsWired = true;

    wireRadioGroup(statusGroup, v => { filterState.status = v; });
    wireCheckGroup(typeGroup, filterState.types);
    wireRadioGroup(ratingGroup, v => { filterState.minRating = parseInt(v, 10); });

    quickGroup.querySelector('[data-value="hasUrl"]').addEventListener('click', function () {
        filterState.hasUrl = !filterState.hasUrl;
        this.classList.toggle('active', filterState.hasUrl);
        updateBadge();
        onChange?.();
    });
    quickGroup.querySelector('[data-value="hasNotes"]').addEventListener('click', function () {
        filterState.hasNotes = !filterState.hasNotes;
        this.classList.toggle('active', filterState.hasNotes);
        updateBadge();
        onChange?.();
    });
    quickGroup.querySelector('[data-value="hasWarnings"]').addEventListener('click', function () {
        filterState.hasWarnings = !filterState.hasWarnings;
        this.classList.toggle('active', filterState.hasWarnings);
        updateBadge();
        onChange?.();
    });

    document.getElementById('filter-no-tags-chip').addEventListener('click', function () {
        filterState.noTags = !filterState.noTags;
        this.classList.toggle('active', filterState.noTags);
        updateBadge();
        onChange?.();
    });

    btnFilter.addEventListener('click', e => {
        e.stopPropagation();
        togglePanel();
    });

    btnReset.addEventListener('click', resetAll);

    document.addEventListener('click', e => {
        if (isOpen && !panel.contains(e.target) && e.target !== btnFilter) {
            closePanel();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closePanel();
    });

    updateBadge();
}

export function applyFilter(plugins, metadata) {
    const state = filterState;
    if (!hasActiveFilters()) return plugins;

    return plugins.filter(mod => {
        const meta = metadata.get(mod.name);

        // Status
        if (state.status === 'active'        && !mod.isActive)              return false;
        if (state.status === 'inactive'       && mod.isActive)               return false;
        if (state.status === 'not-installed'  && mod.isInstalled !== false)  return false;

        // Typen OR. Das klingt so ein bissel wie in ner Disko. "Typen? ORRRRRRR."
        if (state.types.size > 0) {
            const isRegular = !mod.isMaster && !mod.isLightMaster && !mod.isOverlay && !mod.isMediumMaster;
            const match =
                (state.types.has('master')          && mod.isMaster)                    ||
                (state.types.has('lightMaster')     && mod.isLightMaster)               ||
                (state.types.has('overlay')         && mod.isOverlay)                   ||
                (state.types.has('mediumMaster')    && mod.isMediumMaster)              ||
                (state.types.has('regular')         && isRegular)                       ||
                (state.types.has('achievementSafe')    && mod.achievementSafe === true)   ||
                (state.types.has('notAchievementSafe') && mod.achievementSafe !== true)   ||
                (state.types.has('missingMasters')     && mod.missingMasters?.length > 0);
            if (!match) return false;
        }

        // Haha, nein, danke, heute nicht. -17 Sterne? Wir sind nicht bei Lieferando hier.
        if (state.minRating > 0) {
            if ((meta?.rating ?? 0) < state.minRating) return false;
        }

        // Hat URL
        if (state.hasUrl && !meta?.url) return false;

        // Hat Notizen -> guck da: ModMetadata.description
        if (state.hasNotes && !meta?.description) return false;

        // Hat Warnungen
        if (state.hasWarnings && (!mod.profileWarnings || mod.profileWarnings.length === 0)) return false;

        // Keine Tags
        if (state.noTags && (meta?.tags ?? []).length > 0) return false;

        // Tags AND
        if (state.tags.size > 0) {
            const modTags = new Set(meta?.tags ?? []);
            for (const tag of state.tags) {
                if (!modTags.has(tag)) return false;
            }
        }

        return true;
    });
}
