// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { t } from './i18n.js';

const EMOJI_CATEGORIES = [
  {
    label: 'emoji.category.favoriten',
    emojis: ['📦', '⚙️', '🔧', '🛡️', '⚔️', '🌍', '🎨', '🔊', '💡', '🚀', '🗺️', '👾', '🧩', '📜', '🎭']
  },
  {
    label: 'emoji.category.spiel',
    emojis: ['⚔️', '🛡️', '🏹', '🔫', '💣', '🗡️', '🪃', '🧨', '🪖', '👑', '💎', '🏆', '🎯', '🎲', '🃏']
  },
  {
    label: 'emoji.category.welt',
    emojis: ['🌍', '🌌', '🏔️', '🌋', '🏜️', '🌊', '🌲', '🏙️', '🚀', '🛸', '🪐', '⭐', '☄️', '🌠', '🗺️']
  },
  {
    label: 'emoji.category.technik',
    emojis: ['⚙️', '🔧', '🔩', '🛠️', '💡', '🔋', '💻', '🖥️', '📡', '🔬', '🧪', '⚗️', '🤖', '🦾', '📱']
  },
  {
    label: 'emoji.category.grafik',
    emojis: ['🎨', '🖌️', '✨', '🌈', '💫', '🔆', '🎭', '🖼️', '📸', '🌟', '💥', '🎇', '🎆', '🌅', '🌄']
  },
  {
    label: 'emoji.category.audio',
    emojis: ['🔊', '🎵', '🎶', '🎸', '🥁', '🎹', '🎷', '🎺', '🎻', '🎤', '🎧', '📻', '🔔', '🔕', '🎼']
  },
  {
    label: 'emoji.category.misc',
    emojis: ['📦', '📜', '📁', '🗂️', '📌', '🔖', '🏷️', '📝', '✅', '❌', '⚠️', '💬', '👁️', '🧩', '🔑']
  },
];

let currentCategory = 0;
let onSelectCallback = null;
let pickerEl = null;
let anchorElRef = null;

// Das wäre vermutlich alles besser gegangen, Zukunfts-Ben :(

export function initEmojiPicker(onSelect) {
  onSelectCallback = onSelect;
  pickerEl = document.createElement('div');
  pickerEl.className = 'emoji-picker hidden';
  pickerEl.innerHTML = `
    <div class="emoji-tabs"></div>
    <div class="emoji-grid"></div>
  `;
  document.body.appendChild(pickerEl);

  renderTabs();
  renderGrid(0);

  document.addEventListener('click', e => {
    if (!pickerEl.contains(e.target) && e.target !== anchorElRef) {
      pickerEl.classList.add('hidden');
    }
  });
}

export function setEmojiPickerCallback(fn) {
  onSelectCallback = fn;
}

export function toggleEmojiPicker(anchorEl) {
  anchorElRef = anchorEl;
  if (pickerEl.classList.contains('hidden')) {
    const rect = anchorEl.getBoundingClientRect();
    pickerEl.style.top = `${rect.bottom + 6}px`;
    pickerEl.style.left = `${rect.left}px`;
    pickerEl.classList.remove('hidden');
  } else {
    pickerEl.classList.add('hidden');
  }
}

function renderTabs() {
  const tabsEl = pickerEl.querySelector('.emoji-tabs');
  tabsEl.innerHTML = '';
  EMOJI_CATEGORIES.forEach((cat, i) => {
    const tab = document.createElement('button');
    tab.className = 'emoji-tab' + (i === currentCategory ? ' active' : '');
    const label = t(cat.label);
    tab.textContent = label.split(' ')[0];
    tab.dataset.i18nTitle = cat.label;
    tab.dataset.tooltip = label;

    tab.addEventListener('click', e => {
      e.stopPropagation();
      currentCategory = i;
      renderTabs();
      renderGrid(i);
    });
    tabsEl.appendChild(tab);
  });
}

function renderGrid(categoryIndex) {
  const gridEl = pickerEl.querySelector('.emoji-grid');
  gridEl.innerHTML = '';
  EMOJI_CATEGORIES[categoryIndex].emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onSelectCallback(emoji);
      pickerEl.classList.add('hidden');
    });
    gridEl.appendChild(btn);
  });
}