// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { t } from './i18n.js';

const knownTags = new Set([
    'Bethesda', 'Early Loader', 'Framework', 'Library', 'Patch', 'Fix',
    'Quest', 'Complex', 'Overhaul', 'Faction', 'NPC', 'Companion',
    'POI', 'Location', 'Vehicle', 'Immersion', 'Ship Parts', 'Ships',
    'Outpost', 'Decoration', 'Weapon', 'Armor', 'Item', 'Clothing',
    'Hair', 'Texture', 'Mesh', 'Visual', 'Weather', 'Skin', 'Sounds',
    'Audio', 'Music', 'UI', 'HUD', 'Fix', 'Performance', 'Late Loader',
    'Gameplay', 'Lore', 'Cheat'
]);

export function registerTags(tags) {
  tags.forEach(tag => knownTags.add(tag));
}

export function createTagInput(initialTags = [], onChange) {
    let tags = [...initialTags];

    const container = document.createElement('div');
    container.className = 'tag-input-container';

    function render() {
        container.innerHTML = '';

        // Bestehende Tags
        tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'tag-chip';
            const textNode = document.createTextNode(tag + ' ');

            const button = document.createElement('button');
            button.className = 'tag-remove';
            button.dataset.tag = tag;
            button.textContent = '×';

            chip.appendChild(textNode);
            chip.appendChild(button);

            chip.querySelector('.tag-remove').addEventListener('click', e => {
                e.stopPropagation();
                tags = tags.filter(t => t !== tag);
                onChange(tags);
                render();
            });
            container.appendChild(chip);
        });

        // Eingabefeld
        const input = document.createElement('input');
        input.className = 'tag-input';
        input.placeholder = t('tags.placeholder');
        container.appendChild(input);

        // Autocomplete-Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'tag-dropdown hidden';
        container.appendChild(dropdown);

        input.addEventListener('input', () => {
            const val = input.value.trim().toLowerCase();
            if (!val) { dropdown.classList.add('hidden'); return; }

            const matches = [...knownTags].filter(s =>
                s.toLowerCase().startsWith(val) && !tags.includes(s)
            ).slice(0, 6);

            if (matches.length === 0) { dropdown.classList.add('hidden'); return; }

            dropdown.innerHTML = '';
            dropdown.classList.remove('hidden');

            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'tag-dropdown-item';
                item.textContent = match;
                item.addEventListener('mousedown', e => {
                    e.preventDefault();
                    addTag(match, input, dropdown);
                });
                dropdown.appendChild(item);
            });
        });

        input.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
                e.preventDefault();
                addTag(input.value.trim(), input, dropdown);
            }
            if (e.key === 'Backspace' && !input.value && tags.length > 0) {
                tags = tags.slice(0, -1);
                onChange(tags);
                render();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.classList.add('hidden'), 150);
        });
    }

    function addTag(tag, input, dropdown) {
        const normalized = tag.replace(/,/g, '').trim();
        if (!normalized || tags.includes(normalized)) return;
        tags.push(normalized);
        knownTags.add(normalized);
        onChange(tags);
        render();
        // Fokus zurück aufs Input
        container.querySelector('.tag-input')?.focus();
        dropdown.classList.add('hidden');
    }

    render();
    return { element: container, getTags: () => tags };
}