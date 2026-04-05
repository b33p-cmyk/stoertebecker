// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
import { I18N_LABEL_VALUES } from "./i18n.js";

let menuEl = null;
let submenuEl = null;

export function showContextMenu(x, y, items) {
  closeContextMenu();

  menuEl = document.createElement('div');
  menuEl.className = 'context-menu';

  items.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#333;margin:4px 0;';
      menuEl.appendChild(sep);
      return;
    }

    const el = document.createElement('div');
    el.className = 'context-menu-item' + (item.danger ? ' danger' : '');

    const labelSpan = document.createElement('span');

    if (I18N_LABEL_VALUES.has(item.label)) {
      labelSpan.innerHTML = item.label; // statisch aus i18n
    } else {
      labelSpan.textContent = item.label; // Nutzerinput
    }
    el.appendChild(labelSpan);

    if (item.submenu) {
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'submenu-arrow';
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-chevron-right';
      icon.setAttribute('aria-hidden', 'true');
      arrowSpan.appendChild(icon);
      el.appendChild(arrowSpan);
    }

    if (item.submenu) {
      el.addEventListener('mouseenter', e => {
        closeSubmenu();
        const rect = el.getBoundingClientRect();
        showSubmenu(rect.right + 4, rect.top, item.submenu);
      });
    } else {
      el.addEventListener('mouseenter', closeSubmenu);
      el.addEventListener('click', () => {
        item.action?.();
        closeContextMenu();
      });
    }

    menuEl.appendChild(el);
  });

  // Zu weit draussen, das ist der Inbegriff von TO BOLDLY GO, oder? :D
  document.body.appendChild(menuEl);
  const rect = menuEl.getBoundingClientRect();
  menuEl.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  menuEl.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;

  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
//    document.addEventListener('contextmenu', closeContextMenu, { once: true });
  }, 0);
}

function showSubmenu(x, y, items) {
  submenuEl = document.createElement('div');
  submenuEl.className = 'context-submenu';

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'context-submenu-scroll';

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'context-menu-item';

    if (item.color) {
      el.style.setProperty('--cat-color', item.color);
    }

    const labelSpan = document.createElement('span');

    if (I18N_LABEL_VALUES.has(item.label)) {
      labelSpan.innerHTML = item.label; // statisch aus i18n
    } else {
      labelSpan.textContent = item.label; // Nutzerinput
    }

    el.appendChild(labelSpan);
    el.addEventListener('click', () => {
      item.action?.();
      closeContextMenu();
    });
    scrollContainer.appendChild(el);
  });

  submenuEl.appendChild(scrollContainer);
  document.body.appendChild(submenuEl);
  const rect = submenuEl.getBoundingClientRect();
  submenuEl.style.left = `${Math.min(x, window.innerWidth - rect.width - 8)}px`;
  submenuEl.style.top = `${Math.min(y, window.innerHeight - rect.height - 8)}px`;
}

function closeSubmenu() {
  submenuEl?.remove();
  submenuEl = null;
}

export function closeContextMenu() {
  closeSubmenu();
  menuEl?.remove();
  menuEl = null;
}