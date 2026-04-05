// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { ipc } from './ipcWrapper.js'; 

function closeAboutDialog() {
    document.getElementById('about-dialog-overlay').classList.add('hidden');
}

export async function openAboutDialog() {
    const version = await ipc(window.starfieldAPI.getVersion());
    document.querySelector('[data-i18n="about.version"]').textContent = `Version ${version}`;
    document.getElementById('about-dialog-overlay').classList.remove('hidden');
}

export function initAboutDialog() {
    document.getElementById('about-close').addEventListener('click', closeAboutDialog);
    document.getElementById('about-close-btn').addEventListener('click', closeAboutDialog);

    document.getElementById('about-dialog-overlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeAboutDialog();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('about-dialog-overlay');
            if (!overlay.classList.contains('hidden')) closeAboutDialog();
        }
    });
}
