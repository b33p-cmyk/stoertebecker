// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
let draggedMod = null;
let draggedFromCategoryId = null;
let draggedCategoryId = null;

export function initDragDrop(getState, onchange, onSaveSnapshot) {
  // getState gibt { categories, allPlugins } zurück
  // onChange wird aufgerufen wenn sich was geändert hat. Was für ein passender Name. Gratulation!

  document.addEventListener('dragstart', e => {
    if (!e?.target?.closest) {
      return;
    }

    const item = e.target.closest('.plugin-item');
    if (!item) return;
    draggedMod = item.dataset.modName;
    draggedFromCategoryId = item.closest('.accordion')?.dataset.categoryId ?? '__uncategorized';
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragend', e => {
    if (!e?.target?.closest) {
      return;
    }

    const item = e.target.closest('.plugin-item');
    item?.classList.remove('dragging');
    document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drop-target')
      .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom', 'drop-target'));
    draggedMod = null;
    draggedFromCategoryId = null;
  });

  document.addEventListener('dragover', e => {
    if (!e?.target?.closest) {
      return;
    }


    e.preventDefault();
    const item = e.target.closest('.plugin-item');
    const accordion = e.target.closest('.accordion');

    document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drop-target')
      .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom', 'drop-target'));

    if (item && item.dataset.modName !== draggedMod) {
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      item.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
    } else if (accordion && !item) {
      accordion.classList.add('drop-target');
    }
  });

  document.addEventListener('drop', e => {
    if (!e?.target?.closest) {
      return;
    }

    e.preventDefault();
    if (!draggedMod) return;

    const { categories, allPlugins } = getState();
    const item = e.target.closest('.plugin-item');
    const accordion = e.target.closest('.accordion');

    if (!accordion) return;

    const targetCategoryId = accordion.dataset.categoryId;
    const newCategories = JSON.parse(JSON.stringify(categories)); // deep copy

    // Mod aus alter Kategorie entfernen, tschausi mausi
    newCategories.forEach(c => {
      c.modNames = c.modNames.filter(n => n !== draggedMod);
    });

    if (item && item.dataset.modName !== draggedMod) {
      // Vor/nach einem anderen Mod einfügen
      const targetMod = item.dataset.modName;
      const rect = item.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      const targetCat = newCategories.find(c => c.id === targetCategoryId);

      if (targetCat) {
        const idx = targetCat.modNames.indexOf(targetMod);
        if (idx === -1) {
          targetCat.modNames.push(draggedMod);
        } else {
          targetCat.modNames.splice(isTop ? idx : idx + 1, 0, draggedMod);
        }
      } else if (targetCategoryId === '__uncategorized') {
        // In "nicht kategorisiert", nichts zu tun, Mod ist schon raus
      }
    } else if (targetCategoryId !== '__uncategorized') {
      // Auf Kategorie-Header droppen, ans Ende in der Kateogire
      const targetCat = newCategories.find(c => c.id === targetCategoryId);
      if (targetCat && !targetCat.modNames.includes(draggedMod)) {
        targetCat.modNames.push(draggedMod);
      }
    }

    onSaveSnapshot?.();
    onchange(newCategories);
  });
}

export function initCategoryDragDrop(getState, onChange, onSaveSnapshot) {
  document.addEventListener('dragstart', e => {
    if (!e?.target?.closest) {
      return;
    }

    const header = e.target.closest('.accordion-header');
    const accordion = header?.closest('.accordion');
    if (!header || !accordion) return;
    const catId = accordion.dataset.categoryId;
    if (catId === '__uncategorized') return; // nicht kategorisiert nicht verschiebbar
    draggedCategoryId = catId;
    accordion.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); // nicht mit Mod-Drag verwechseln. Hallololo. Bitte.
  });

  document.addEventListener('dragend', e => {
    if (!e?.target?.closest) {
      return;
    }

    const accordion = e.target.closest('.accordion');
    accordion?.classList.remove('dragging');
    document.querySelectorAll('.accordion.drag-over-top, .accordion.drag-over-bottom')
      .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
    draggedCategoryId = null;
  });

  document.addEventListener('dragover', e => {
    if (!e?.target?.closest) {
      return;
    }

    if (!draggedCategoryId) return;
    const accordion = e.target.closest('.accordion');
    if (!accordion) return;
    const targetId = accordion.dataset.categoryId;
    if (targetId === draggedCategoryId || targetId === '__uncategorized') return;

    document.querySelectorAll('.accordion.drag-over-top, .accordion.drag-over-bottom')
      .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));

    const rect = accordion.getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;
    accordion.classList.add(isTop ? 'drag-over-top' : 'drag-over-bottom');
  });

  document.addEventListener('drop', e => {
    if (!e?.target?.closest) {
      return;
    }

    if (!draggedCategoryId) return;
    const accordion = e.target.closest('.accordion');
    if (!accordion) return;
    const targetId = accordion.dataset.categoryId;
    if (targetId === draggedCategoryId || targetId === '__uncategorized') return;

    const { categories } = getState();
    const newCategories = [...categories];
    const fromIdx = newCategories.findIndex(c => c.id === draggedCategoryId);
    const toIdx = newCategories.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const rect = accordion.getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;

    // Aus alter Position raus
    const [moved] = newCategories.splice(fromIdx, 1);
    // An neuer Position einfügen
    const insertAt = newCategories.findIndex(c => c.id === targetId);
    newCategories.splice(isTop ? insertAt : insertAt + 1, 0, moved);

    onSaveSnapshot?.();
    onChange(newCategories);
  });
}