// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
export function suggestCategories(modTags, categories) {
    if (!modTags || modTags.length === 0) return [];

    return categories
        .map(cat => {
            const matches = modTags.filter(tag => cat.tags.includes(tag));
            return { cat, matches, score: matches.length };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score);
}