// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
export const THEMES = [
    {
        id:          'dark',
        name:        'Dark',
        description: {
            de: 'Dunkles Theme - schont die Augen bei wenig Umgebungslicht.',
            en: 'Dark theme - easier on the eyes in low light.',
        },
        file:        'themes/dark.css',
    },
    {
        id:          'light',
        name:        'Light',
        description: {
            de: 'Helles Theme für helle Umgebungen und Tageslicht.',
            en: 'Light theme for bright environments and daylight.',
        },
        file:        'themes/light.css',
    },
    {
        id:          'high-contrast',
        name:        'High Contrast',
        description: {
            de: 'Maximaler Kontrast für bessere Lesbarkeit und Barrierefreiheit.',
            en: 'Maximum contrast for better readability and accessibility.',
        },
        file:        'themes/high-contrast.css',
    },
    {
        id:          'starfield',
        name:        'Starfield',
        description: {
            de: 'Ein Theme mit Farben angelehnt an Starfield.',
            en: 'A theme with colors akin to starfields colors.',
        },
        file:        'themes/starfield.css',
    },
    {
        id:          'meowfield',
        name:        'Meowfield',
        description: {
            de: 'Ein Theme mit Farben angelehnt an Starfield. Meow.',
            en: 'A theme with colors akin to starfields colors. Meow.',
        },
        file:        'themes/meowfield.css',
    },
];

export function getTheme(id) {
    return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function getThemeDescription(theme, locale) {
    return theme.description[locale] ?? theme.description['de'] ?? '';
}
