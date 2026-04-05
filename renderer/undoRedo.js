// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
const MAX_HISTORY = 50;

let undoStack = [];
let redoStack = [];
let getStateFn = null;
let setStateFn = null;
let btnUndo = null;
let btnRedo = null;
let btnSave = null;
let setDirtyFn = null;
let getDirtyFn = null;

export function initUndoRedo(getState, setState, setDirty, getDirty) {
    getStateFn = getState;
    setStateFn = setState;
    setDirtyFn = setDirty;
    getDirtyFn = getDirty;
    btnUndo = document.getElementById('btn-undo');
    btnRedo = document.getElementById('btn-redo');
    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);
    updateButtons();
}

export function isDirty() {
    return getDirtyFn ? getDirtyFn() : false;
}

export function markDirty() {
    setDirtyFn?.(true);
}

export function markClean() {
    setDirtyFn?.(false);
}

export function saveSnapshot() {
    if (!getStateFn) return;
    markDirty();
    undoStack.push(getStateFn());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateButtons();
}

export function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(getStateFn());
    setStateFn(undoStack.pop());
    updateButtons();
}

export function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(getStateFn());
    setStateFn(redoStack.pop());
    updateButtons();
}

export function clearHistory() {
    undoStack = [];
    redoStack = [];
    updateButtons();
}

function updateButtons() {
    if (btnUndo) btnUndo.disabled = undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = redoStack.length === 0;
}
