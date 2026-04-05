// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js';
import { t } from './i18n.js';
import { warn, info, success } from './logger.js';
import { setEmojiPickerCallback, toggleEmojiPicker } from './emojiPicker.js';
import { showConfirm } from './renderer.js';
import { markClean } from './undoRedo.js';

let profileSummaries = [];
let currentProfile = null;
let onProfileSwitch = null;
let isDirtyFn = null;
let onWarnings = null;
let getInactiveMods = () => [];

const btnProfile = document.getElementById('btn-profile');
const profileNameEl = document.getElementById('profile-name');
const profileDropdown = document.getElementById('profile-dropdown');
const profileList = document.getElementById('profile-list');
const btnNewProfile = document.getElementById('btn-new-profile');
const btnDuplicateProfile = document.getElementById('btn-duplicate-profile');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnSetTemplate = document.getElementById('btn-set-template');
const btnDeleteProfile = document.getElementById('btn-delete-profile');

// Profil-Dialog Elemente
const profileDialogOverlay = document.getElementById('profile-dialog-overlay');
const profileDialogTitle = document.getElementById('profile-dialog-title');
const profileIconInput = document.getElementById('profile-icon-input');
const profileNameInput = document.getElementById('profile-name-input');
const profileDescInput = document.getElementById('profile-desc-input');
const profileColorPicker = document.getElementById('profile-color-picker');
const profileGroupInput = document.getElementById('profile-group-input');
const profileDialogSave = document.getElementById('profile-dialog-save');
const profileDialogCancel = document.getElementById('profile-dialog-cancel');

export async function initProfileManager(onSwitch, getDirty, onWarningsLog, getPlugins) {
    onProfileSwitch = onSwitch;
    isDirtyFn = getDirty;
    onWarnings = onWarningsLog;
    const allPlugins = getPlugins();

    if (getPlugins) getInactiveMods = () => allPlugins.filter(m => !m.isActive).map(m => m.name);

    const settings = await ipc(window.starfieldAPI.getSettings());
    profileSummaries = await ipc(window.starfieldAPI.listProfiles());

    // Kein Profil dann Default-Profil mit aktuellem Plugins.txt-Zustand anlegen
    if (profileSummaries.length === 0) {
        const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const templateCategories = await ipc(window.starfieldAPI.getProfileTemplate()) ?? [];
        const defaultProfile = {
            id,
            name: 'Default',
            description: null,
            createdAt: Date.now(),
            categories: templateCategories,
            inactiveMods: getInactiveMods(),
            color: null,
            icon: null,
            group: null,
        };
        await ipc(window.starfieldAPI.saveProfile(defaultProfile));
        markClean();

        await ipc(window.starfieldAPI.setActiveProfile(id));
        profileSummaries = [{ id, name: 'Default', description: null, createdAt: defaultProfile.createdAt, color: null, icon: null, group: null }];
    }

    let activeId = settings.activeProfileId;
    if (!activeId || !profileSummaries.find(p => p.id === activeId)) {
        activeId = profileSummaries[0].id;
        await ipc(window.starfieldAPI.setActiveProfile(activeId));
    }

    const { profile, missingMods } = await ipc(window.starfieldAPI.loadProfile(activeId));
    currentProfile = profile;
    missingMods.forEach(name => warn(t('log.mod.notInstalled', { name })));

    renderProfileList();
    updateProfileButton();

    // Emoji-Picker für Profil-Dialog
    profileIconInput.addEventListener('click', e => {
        e.stopPropagation();
        setEmojiPickerCallback(emoji => {
            profileIconInput.value = emoji;
        });
        toggleEmojiPicker(profileIconInput);
    });

    // Color-Swatches im Profil-Dialog
    profileColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            profileColorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });

    // Dropdown toggle
    btnProfile.addEventListener('click', e => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => profileDropdown.classList.add('hidden'));

    // Aktionen
    btnNewProfile.addEventListener('click', () => handleNewProfile());
    btnDuplicateProfile.addEventListener('click', () => handleDuplicateProfile());
    btnEditProfile.addEventListener('click', () => handleEditProfile());
    btnSetTemplate.addEventListener('click', () => handleSetTemplate());
    btnDeleteProfile.addEventListener('click', () => handleDeleteProfile());
}

export function getCurrentProfile() { return currentProfile; }

export async function saveCurrentProfile(categories, inactiveMods) {
    currentProfile.categories = categories;
    currentProfile.inactiveMods = inactiveMods;
    await ipc(window.starfieldAPI.saveProfile(currentProfile));
    markClean();
}

function renderProfileList() {
    profileList.innerHTML = '';

    // Nach Gruppe sortieren: groupless zuerst, dann alphabetisch
    const groupless = profileSummaries.filter(p => !p.group);
    const grouped = profileSummaries.filter(p => p.group);

    const groupMap = new Map();
    grouped.forEach(p => {
        if (!groupMap.has(p.group)) groupMap.set(p.group, []);
        groupMap.get(p.group).push(p);
    });
    const sortedGroups = [...groupMap.keys()].sort((a, b) => a.localeCompare(b));

    const renderItem = p => {
        const item = document.createElement('div');
        item.className = 'profile-list-item' + (p.id === currentProfile.id ? ' active' : '');
        if (p.color) item.style.borderLeft = `3px solid ${p.color}`;

        const iconEl = document.createElement('span');
        iconEl.className = 'profile-item-icon';
        iconEl.textContent = p.icon || '';

        const nameEl = document.createElement('span');
        nameEl.className = 'profile-item-name';
        nameEl.textContent = p.name;

        item.appendChild(iconEl);
        item.appendChild(nameEl);
        item.addEventListener('click', () => switchProfile(p.id));
        profileList.appendChild(item);
    };

    groupless.forEach(renderItem);

    sortedGroups.forEach(groupName => {
        const header = document.createElement('div');
        header.className = 'profile-group-header';
        header.textContent = groupName;
        profileList.appendChild(header);
        groupMap.get(groupName).forEach(renderItem);
    });
}

function updateProfileButton() {
    const icon = currentProfile.icon ? currentProfile.icon + ' ' : '';
    profileNameEl.textContent = icon + currentProfile.name;
}

// Profil-Dialog 
//{ name, description, color, icon, group }
function openProfileDialog(existing = null) {
    return new Promise(resolve => {
        const isEdit = existing !== null;

        profileDialogTitle.textContent = isEdit ? t('dialog.profile.edit') : t('dialog.profile.new');
        profileDialogSave.textContent = isEdit ? t('dialog.saveChanges') : t('dialog.create');

        // Felder vorausfüllen
        profileIconInput.value = existing?.icon || '';
        profileNameInput.value = existing?.name || '';
        profileDescInput.value = existing?.description || '';
        profileGroupInput.value = existing?.group || '';

        // Farbe vorauswählen
        const targetColor = existing?.color || '#5599ff';
        profileColorPicker.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color === targetColor);
        });
        // Fallback: erste Swatch selektieren wenn Farbe nicht in Liste
        if (!profileColorPicker.querySelector('.color-swatch.selected')) {
            profileColorPicker.querySelector('.color-swatch').classList.add('selected');
        }

        profileDialogOverlay.classList.remove('hidden');
        profileNameInput.focus();
        profileNameInput.select();

        const cleanup = result => {
            profileDialogOverlay.classList.add('hidden');
            profileDialogSave.removeEventListener('click', onSave);
            profileDialogCancel.removeEventListener('click', onCancel);
            profileNameInput.removeEventListener('keydown', onKey);
            resolve(result);
        };

        const onSave = () => {
            const name = profileNameInput.value.trim();
            if (!name) { profileNameInput.focus(); return; }
            const selectedSwatch = profileColorPicker.querySelector('.color-swatch.selected');
            cleanup({
                name,
                description: profileDescInput.value.trim() || null,
                color: selectedSwatch ? selectedSwatch.dataset.color : null,
                icon: profileIconInput.value.trim() || null,
                group: profileGroupInput.value.trim() || null,
            });
        };

        const onCancel = () => cleanup(null);

        const onKey = e => {
            if (e.key === 'Escape') cleanup(null);
        };

        profileDialogSave.addEventListener('click', onSave);
        profileDialogCancel.addEventListener('click', onCancel);
        profileNameInput.addEventListener('keydown', onKey);
    });
}

async function switchProfile(profileId) {
    if (profileId === currentProfile.id) {
        profileDropdown.classList.add('hidden');
        return;
    }

    if (isDirtyFn?.()) {
        const ok = await showConfirm(t('confirm.profile.unsavedChanges'));
        if (!ok) { profileDropdown.classList.add('hidden'); return; }
    }

    const { profile, missingMods } = await ipc(window.starfieldAPI.loadProfile(profileId));
    currentProfile = profile;
    missingMods.forEach(name => warn(t('log.mod.notInstalled', { name })));

    await ipc(window.starfieldAPI.setActiveProfile(profileId));

    info(t('log.profile.switched', { name: currentProfile.name }));

    updateProfileButton();
    renderProfileList();
    profileDropdown.classList.add('hidden');
    onProfileSwitch(currentProfile);
    onWarnings?.(currentProfile);
}

async function handleNewProfile() {

    if (isDirtyFn?.()) {
        const ok = await showConfirm(t('confirm.profile.dirty', { name: currentProfile.name }));
        if (!ok) {
            return;
        }
    }

    profileDropdown.classList.add('hidden');
    const result = await openProfileDialog();
    if (!result) return;

    const templateCategories = await ipc(window.starfieldAPI.getProfileTemplate());
    const categories = templateCategories
        ? templateCategories.map(c => ({
            ...c,
            id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            modNames: [],
        }))
        : [];

    const newProfile = {
        id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: result.name,
        description: result.description,
        createdAt: Date.now(),
        categories,
        inactiveMods: getInactiveMods(),
        color: result.color,
        icon: result.icon,
        group: result.group,
    };

    await ipc(window.starfieldAPI.saveProfile(newProfile));
    markClean();

    profileSummaries.push({ id: newProfile.id, name: newProfile.name, description: newProfile.description, createdAt: newProfile.createdAt, color: newProfile.color, icon: newProfile.icon, group: newProfile.group });

    await switchProfile(newProfile.id);
}

async function handleSetTemplate() {
    profileDropdown.classList.add('hidden');
    await ipc(window.starfieldAPI.saveProfileTemplate(currentProfile.categories));
    success(t('log.profile.templateSaved', { name: currentProfile.name }));
}

async function handleDuplicateProfile() {
    profileDropdown.classList.add('hidden');
    const result = await openProfileDialog({ ...currentProfile, name: `${currentProfile.name} (Kopie)` });
    if (!result) return;

    const duplicate = await ipc(window.starfieldAPI.duplicateProfile(currentProfile.id, result.name));
    duplicate.description = result.description;
    duplicate.color = result.color;
    duplicate.icon = result.icon;
    duplicate.group = result.group;
    await ipc(window.starfieldAPI.saveProfile(duplicate));

    profileSummaries.push({ id: duplicate.id, name: duplicate.name, description: duplicate.description ?? null, createdAt: duplicate.createdAt, color: duplicate.color ?? null, icon: duplicate.icon ?? null, group: duplicate.group ?? null });
    renderProfileList();
}

async function handleEditProfile() {
    profileDropdown.classList.add('hidden');
    const result = await openProfileDialog(currentProfile);
    if (!result) return;

    currentProfile.name = result.name;
    currentProfile.description = result.description;
    currentProfile.color = result.color;
    currentProfile.icon = result.icon;
    currentProfile.group = result.group;
    await ipc(window.starfieldAPI.saveProfile(currentProfile));
    markClean();

    const summary = profileSummaries.find(p => p.id === currentProfile.id);
    if (summary) {
        summary.name = result.name;
        summary.description = result.description;
        summary.color = result.color;
        summary.icon = result.icon;
        summary.group = result.group;
    }

    updateProfileButton();
    renderProfileList();
}

async function handleDeleteProfile() {
    profileDropdown.classList.add('hidden');
    if (profileSummaries.length <= 1) {
        await showConfirm(t('confirm.profile.lastProfile'), true);
        return;
    }

    const ok = await showConfirm(t('confirm.profile.delete', { name: currentProfile.name }));
    if (!ok) return;

    const deletedId = currentProfile.id;
    profileSummaries = profileSummaries.filter(p => p.id !== deletedId);
    await ipc(window.starfieldAPI.deleteProfile(deletedId));

    const next = profileSummaries[0];
    await ipc(window.starfieldAPI.setActiveProfile(next.id));

    const { profile, missingMods } = await ipc(window.starfieldAPI.loadProfile(next.id));
    currentProfile = profile;
    missingMods.forEach(name => warn(t('log.mod.notInstalled', { name })));

    updateProfileButton();
    renderProfileList();
    onProfileSwitch(currentProfile);
}
