// Copyright (C) 2026 b33p-cmyk
// SPDX-License-Identifier: GPL-3.0-or-later
const translations = {
    de: {
        // Header
        'app.title': 'Störtebecker',
        'app.subtitle': 'Starfield Load Order Baker',
        'app.plugins': '{n} Plugins',
        'app.inactive': '({n} inaktiv)',
        'conflicts.title': 'Konflikt-Analyse',
        'conflicts.scanning': 'Scanne {current}/{total}: {name}…',
        'conflicts.done': '{n} Konflikte gefunden',
        'conflicts.none': 'Keine Konflikte gefunden',
        'toolbar.conflicts': 'Konflikte',

        'error.settings': 'Eine Datei oder ein Verzeichnis konnte nicht gefunden werden. Bitte prüfe deine Einstellungen.',

        'diff.title': 'Vergleich: Plugins.txt',
        'diff.noChanges': 'Keine Änderungen',
        'diff.added': 'hinzugefügt',
        'diff.removed': 'entfernt',
        'diff.moved': 'verschoben',
        'diff.activated': 'aktiviert',
        'diff.deactivated': 'deaktiviert',
        'diff.statusOk': 'Loadorder aktuell',
        'diff.statusWarn': '{n} Unterschied(e)',

        // Toolbar
        'toolbar.addCategory': '<i class="fa-solid fa-folder-plus" aria-hidden="true"></i> Neue Kategorie',
        'toolbar.diff': '<i class="fa-solid fa-code-compare" aria-hidden="true"></i> Vergleich',
        'toolbar.save': '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Speichern',
        'toolbar.export': '<i class="fa-solid fa-file-export" aria-hidden="true"></i> Export',
        'toolbar.search': 'Suchen…',
        'toolbar.settings': 'Einstellungen',
        'toolbar.expand': 'Alle Kategorien ausklappen',
        'toolbar.collapse': 'Alle Kategorien einklappen',

        // Filter
        'filter.button': 'Filter',
        'filter.title': 'Filter',
        'filter.reset': 'Alles zurücksetzen',
        'filter.section.status': 'Status',
        'filter.section.type': 'Typ',
        'filter.section.tags': 'Tags',
        'filter.section.rating': 'Mindestbewertung',
        'filter.section.quick': 'Schnellfilter',
        'filter.status.all': 'Alle',
        'filter.status.active': 'Aktiv',
        'filter.status.inactive': 'Inaktiv',
        'filter.status.notInstalled': 'Nicht installiert',
        'filter.type.master': 'Master (ESM)',
        'filter.type.lightMaster': 'Light Master (ESL)',
        'filter.type.mediumMaster': 'Medium Master (ESH)',
        'filter.type.overlay': 'Overlay',
        'filter.type.regular': 'Plugin (ESP)',
        'filter.type.achievementSafe': 'Achievement Safe',
        'filter.type.missingMasters': 'Fehlende Master',
        'filter.quick.hasUrl': 'Hat URL',
        'filter.quick.hasNotes': 'Hat Notizen',
        'filter.quick.hasWarnings': 'Hat Warnungen',
        'filter.type.notAchievementSafe': 'Nicht Achievement Safe',
        'filter.tags.noTags': 'Hat keine Tags',
        'filter.noTags': 'Keine Tags vorhanden',
        'filter.rating.any': 'Alle',
        'toolbar.undo': 'Rückgängig (Ctrl+Z)',
        'toolbar.redo': 'Wiederholen (Ctrl+Y)',

        // Loading
        'loading.plugins': 'Lade Plugins…',
        'loading.error': 'Fehler: {msg}',

        // Accordion
        'accordion.uncategorized': 'Nicht kategorisiert',
        'accordion.mods.one': '1 Mod',
        'accordion.mods.many': '{n} Mods',

        // Kontextmenü Mods
        'ctx.activate': '<i class="fa-solid fa-toggle-on" aria-hidden="true"></i> Aktivieren',
        'ctx.deactivate': '<i class="fa-solid fa-toggle-off" aria-hidden="true"></i> Deaktivieren',
        'ctx.moveToCategory': 'Schiebe in Kategorie',
        'ctx.uncategorized': '❓ Nicht kategorisiert',
        'ctx.details': '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> Details',
        'ctx.addToBaseMasters': '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Zu BaseMasters hinzufügen',
        'ctx.removeFromBaseMasters': '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Aus BaseMasters entfernen',
        'ctx.addToBlueprintMasters': '<i class="fa-solid fa-gem" aria-hidden="true"></i> Zu BlueprintMasters hinzufügen',
        'ctx.removeFromProfile': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Aus Profil entfernen',
        'ctx.removeFromBlueprintMasters': '<i class="fa-solid fa-gem" aria-hidden="true"></i> Aus BlueprintMasters entfernen',
        'badge.baseMaster': 'Base Master',
        'badge.blueprintMaster': 'Blueprint Master',

        // Kontextmenü Kategorien
        'ctx.editCategory': '<i class="fa-solid fa-pen" aria-hidden="true"></i> Bearbeiten',
        'ctx.deleteCategory': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Löschen',

        // Kategorie-Dialog
        'dialog.newCategory': 'Neue Kategorie',
        'dialog.editCategory': 'Kategorie bearbeiten',
        'dialog.category.icon': 'Icon',
        'dialog.category.name': 'Name',
        'dialog.category.desc': 'Beschreibung',
        'dialog.category.color': 'Farbe',
        'dialog.category.namePlaceholder': 'z.B. Grafik-Mods',
        'dialog.category.descPlaceholder': 'Optional…',
        'dialog.category.iconPlaceholder': '📦',
        'dialog.cancel': 'Abbrechen',
        'dialog.create': 'Erstellen',
        'dialog.saveChanges': 'Speichern',

        // Bestätigung
        'confirm.deleteCategory': 'Kategorie wirklich löschen? Die Mods bleiben erhalten und landen in "Nicht kategorisiert".',
        'confirm.exportUncategorized': '{n} Mod{s} noch nicht kategorisiert.\n\nTrotzdem exportieren?',
        'confirm.profile.unsavedChanges': 'Es gibt ungespeicherte Änderungen. Profil trotzdem wechseln?',
        'confirm.profile.lastProfile': 'Das letzte Profil kann nicht gelöscht werden.',
        'confirm.profile.delete': 'Profil "{name}" wirklich löschen?',
        'confirm.profile.dirty': 'Profil "{name}" ist eventuell noch nicht gespeichert. Weitermachen?',

        // Profil-Dialog
        'dialog.profile.new': 'Neues Profil',
        'dialog.profile.edit': 'Profil bearbeiten',
        'dialog.profile.group': 'Gruppe',
        'dialog.profile.groupPlaceholder': 'z.B. "Vanilla", "Modded"…',
        'dialog.ok': 'OK',

        // Profil-Dropdown-Aktionen
        'profile.action.new': '<i class="fa-solid fa-plus" aria-hidden="true"></i> Neues Profil',
        'profile.action.duplicate': '<i class="fa-solid fa-copy" aria-hidden="true"></i> Duplizieren',
        'profile.action.edit': '<i class="fa-solid fa-pen" aria-hidden="true"></i> Bearbeiten',
        'profile.action.delete': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Löschen',
        'profile.action.setTemplate': '<i class="fa-solid fa-stamp" aria-hidden="true"></i> Als Template setzen',
        'log.profile.templateSaved': 'Kategorien von "{name}" als Standard-Template gespeichert',

        // Export
        'export.exporting': '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Exportiere…',
        'export.done': '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Exportiert!',
        'export.error': '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> Fehler!',
        'export.button': '<i class="fa-solid fa-file-export" aria-hidden="true"></i> Export',

        // Detail Panel
        'detail.category': 'Kategorie',
        'detail.achievementSafe': 'Achievement Safe',
        'detail.achievementYes': '✓ Ja',
        'detail.achievementNo': '✗ Nein',
        'detail.achievementUnknown': '-',
        'detail.rating': 'Bewertung',
        'detail.url': 'URL',
        'detail.urlPlaceholder': 'https://www.nexusmods.com/…',
        'detail.notes': 'Notizen',
        'detail.notesPlaceholder': 'Eigene Notizen…',
        'detail.save': '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Speichern',
        'detail.saved': '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Gespeichert!',
        'detail.uncategorized': 'Nicht kategorisiert',
        'detail.openInBrowser': 'Im Browser öffnen',
        'detail.pluginType': 'Typ',
        'detail.pluginAuthor': 'Autor',
        'detail.version': 'Version',
        'detail.pluginDescription': 'Plugin-Beschreibung',
        'detail.masters': 'Abhängigkeiten',
        'detail.masters.none': 'Keine',
        'detail.type.esm': 'Master (ESM)',
        'detail.type.esl': 'Light Master (ESL)',
        'detail.type.overlay': 'Overlay',
        'detail.type.esp': 'Plugin (ESP)',
        'detail.type.esh': 'Medium Master (ESH)',
        'detail.masters.missing': 'Master fehlt',
        'detail.masters.blueprint': 'Hängt von Blueprint-Master ab - muss ans Ende der Ladereihenfolge',
        'detail.ghost' : 'Die Datei konnte nicht gefunden werden',


        'tags.placeholder': 'Tag hinzufügen…',
        'tags.suggestions': 'Vorschläge',
        'detail.tags': 'Tags',
        'detail.suggestedCategory': 'Vorgeschlagene Kategorie',
        'detail.assignCategory': 'Zuordnung übernehmen',
        'detail.noSuggestion': 'Keine passende Kategorie gefunden',

        'log.title': 'Log',
        'log.clear': 'Leeren',
        'log.warnings': '{n} Warnung',
        'log.warnings.plural': '{n} Warnungen',
        'log.hideWarnings': 'Warnungen ausblenden',
        'log.mod.notInstalled': '"{name}" ist im Profil - aber nicht installiert',
        'log.plugins.loaded': '{n} Plugins geladen',
        'log.plugins.ignoredBase': '{n} Base Master(s) ignoriert: {names}',
        'log.plugins.ignoredBlueprint': '{n} Blueprint Master(s) ignoriert: {names}',
        'log.export.success': 'Export erfolgreich - Plugins.txt gesichert',
        'log.export.error': 'Export nicht erfolgreich - Plugins.txt nicht gesichert',
        'log.profile.switched': 'Profil gewechselt: {name}',
        'log.profile.saved': 'Profil "{name}" gespeichert',
        'log.mod.blueprintDep': '"{name}" hängt von einem Blueprint-Master ab - dieser lädt automatisch nach allen anderen Plugins.',
        'log.mod.missingMaster': '"{name}" benötigt "{master}" - nicht installiert oder nicht in Plugins.txt',
        'log.mod.missingMaster.File': '"{name}" benötigt "{master}" - Datei nicht gefunden',
        'log.mod.masterInactive': '"{name}" benötigt "{master}" - aber dieser Master ist deaktiviert',
        'log.mod.masterOrder': '"{name}" wird vor seinem Master "{master}" geladen',
        'log.mod.notInProfile': 'Plugin "{name}" ist nicht kategorisiert - nicht Teil des aktuellen Profils.',
        'log.mod.notInProfile.Active': 'Plugin "{name}" ist nicht kategorisiert aber aktiviert - nicht Teil des aktuellen Profils.',
        'log.sync.catalog': 'Synchronisiere ContentCatalog.txt',
        'log.sync.catalog.actionRequired': '{number} Mods müssen in Starfield aktualisiert werden',
        'log.sync.catalog.updateInfo': '{updated} Einträge in CatalogDB aktualisiert',


        'settings.title': 'Einstellungen',
        'settings.appearance': 'Darstellung',
        'settings.theme': 'Theme',
        'settings.theme.dark': 'Dark',
        'settings.theme.light': 'Light',
        'settings.theme.highContrast': 'High Contrast',
        'settings.fontSize': 'Schriftgröße',
        'settings.paths': 'Pfade',
        'settings.starfieldAppData': 'Starfield AppData-Pfad',
        'settings.starfieldAppData.hint': 'Enthält Plugins.txt und ContentCatalog.txt',
        'settings.starfield.pathsAbsolute' : 'Pfade sollten absolut sein, nicht relativ',
        'settings.createBackupOnExport': 'Backup beim Export erstellen',
        'settings.createBackupOnExport.hint': 'Sichert Plugins.txt vor jedem Export automatisch',
        'settings.autoSyncContentCatalog': 'ContentCatalog.txt automatisch schreiben',
        'settings.autoSyncContentCatalog.hint': 'Schreibt die ContentCatalog.txt beim Start von Starfield aus neu',
        'settings.createContentCatalogBackupOnSync': 'Backup von ContentCatalog.txt beim Sync erstellen',
        'settings.createContentCatalogBackupOnSync.hint': 'Sichert ContentCatalog.txt automatisch vor jeder Synchronisation',
        'settings.starfieldData': 'Starfield Data-Pfad',
        'settings.starfieldData.hint': 'Enthält die .esm/.esp/.esl Dateien',
        'settings.appData': 'App-Daten Pfad',
        'settings.appData.hint': 'Enthält Profile und Metadaten',
        'settings.browse': 'Durchsuchen',
        'settings.reset': 'Zurücksetzen',
        'settings.save': 'Speichern & Neu laden',
        'settings.back': '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Zurück',
        'settings.masters': 'Basis-Master Dateien',
        'settings.baseMasters': 'Base Masters',
        'settings.baseMasters.hint': 'ESMs die immer geladen werden - eine Datei pro Zeile',
        'settings.blueprintMasters': 'Blueprint Masters',
        'settings.blueprintMasters.hint': 'ESMs nach denen abhängige Mods ans Ende müssen - eine Datei pro Zeile',
        'settings.ignoreBaseMasters': 'Base Masters ignorieren (nicht laden, nicht exportieren)',
        'settings.ignoreBlueprintMasters': 'Blueprint Masters ignorieren (nicht laden, nicht exportieren)',
        'settings.saved': 'Einstellungen gespeichert',

        'settings.launch': 'Starten',
        'settings.sfseExe': 'SFSE Executable',
        'settings.sfseExe.hint': 'Pfad zur sfse_loader.exe',
        'settings.starfieldExe': 'Starfield Executable',
        'settings.starfieldExe.hint': 'Pfad zur Starfield.exe (ohne SFSE)',

        'launch.sfse': 'Mit SFSE starten',
        'launch.starfield': 'Starfield starten',
        'launch.success': '{label} gestartet',
        'launch.error': '{label} konnte nicht gestartet werden',
        'launch.exited': '{label} wurde beendet',
        'launch.alreadyRunning': '{label} läuft bereits!',
        'reload.data': 'Daten neu laden',
        'folders.menu': 'Ordner öffnen',
        'folders.appdata': 'Starfield AppData',
        'folders.data': 'Mods-Ordner',
        'folders.game': 'Spielverzeichnis',
        'folders.stbkr': 'Störtebecker-Ordner',
        'softRefresh.reloaded': 'Plugins und Catalog neu geladen',
        'softRefresh.externalChange': 'Plugins.txt/ContentCatalog.txt wurde extern geändert - ungespeicherte Änderungen vorhanden.',
        'softRefresh.reload': 'Neu laden',
        'softRefresh.dismiss': 'Ignorieren',

        'starfieldRunning': 'Starfield läuft schon!',

        // Inline-Warnungen
        'warn.missingMaster': 'Fehlender Master: {master}',
        'warn.masterInactive': 'Inaktiver Master: {master}',
        'warn.masterOrder': 'Falsche Reihenfolge: {master} kommt nach diesem Mod',
        'warn.missingMasterFile': 'Fehlende Master-Datei: {master}',
        'warn.blueprintDep': 'Hängt von Blueprint Master ab',
        'warn.dependentsHeader': 'Abhängige Mods:',

        // Katalog-Fehler
        'catalog.version.missing': '"{name}": Catalog-Version fehlt',
        'catalog.version.invalid_format': '"{name}": Catalog-Version hat ungültiges Format',
        'catalog.version.invalid_timestamp': '"{name}": Catalog-Version enthält ungültigen Timestamp',
        'toolbar.syncCatalog': 'Catalog synchronisieren (experimentell)',
        'catalog.syncWarning': '<b>⚠️ Mods mit ungültigen Versionen gefunden</b><br><br>Einige Mods haben fehlerhafte Versionseinträge und werden Starfield als aktualisiert angezeigt. Bitte lade diese Mods im Creations-Menü neu herunter.<br><br><b>Danach unbedingt:</b> Starfield beenden und den Catalog synchronisieren - entweder über den entsprechenden Button oder durch erneutes Starten über diese App. <b>Nicht spielen</b> bevor der Catalog synchronisiert wurde!',
        'catalog.syncSuccess': '{n} Versionseinträge in ContentCatalog DB aktualisiert.',
        'catalog.syncError': 'Fehler beim Synchronisieren der ContentCatalog.txt.',

        // STARCAT
        'about.open': 'Über Störtebecker',
        'about.title': 'Störtebecker',
        'about.version': 'Version …',
        'about.subtitle': 'Starfield Load Order Baker',
        'about.label.author': 'Autor',
        'about.author': 'beep-cmyk',
        'about.label.license': 'Lizenz',
        'about.close': 'Schließen',
        'about.fontawesome': 'Enthält Font Awesome Free - lizenziert unter SIL OFL 1.1 (Icons), MIT (CSS), CC BY 4.0 (Dokumentation).',

        // Other
        'metadata.load.corrupt': 'MetaData.json ist beschädigt und konnte nicht gelesen werden. Alle Metadaten wurden zurückgesetzt. Du kannst die Datei noch sichern, bevor du den Dialog schließt.',

        // Emojis
        "emoji.category.favoriten": "⭐ Favoriten",
        "emoji.category.spiel": "🎮 Spiel",
        "emoji.category.welt": "🌍 Welt",
        "emoji.category.technik": "🔧 Technik",
        "emoji.category.grafik": "🎨 Grafik",
        "emoji.category.audio": "🔊 Audio",
        "emoji.category.misc": "📋 Misc",
    },

    en: {
        'app.title': 'Störtebecker',
        'app.subtitle': 'Starfield Load Order Baker',
        'app.plugins': '{n} Plugins',
        'app.inactive': '({n} inactive)',
        'conflicts.title': 'Conflict Analysis',
        'conflicts.scanning': 'Scanning {current}/{total}: {name}…',
        'conflicts.done': '{n} conflicts found',
        'conflicts.none': 'No conflicts found',
        'toolbar.conflicts': 'Conflicts',

        'error.settings': 'A file or directory could not be found or accessed. Please check your settings.',

        'diff.title': 'Compare: Plugins.txt',
        'diff.noChanges': 'No changes',
        'diff.added': 'added',
        'diff.removed': 'removed',
        'diff.moved': 'moved',
        'diff.activated': 'activated',
        'diff.deactivated': 'deactivated',
        'diff.statusOk': 'Load order up to date',
        'diff.statusWarn': '{n} difference(s)',

        'toolbar.addCategory': '<i class="fa-solid fa-folder-plus" aria-hidden="true"></i> New Category',
        'toolbar.diff': '<i class="fa-solid fa-code-compare" aria-hidden="true"></i> Compare',
        'toolbar.save': '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save',
        'toolbar.export': '<i class="fa-solid fa-file-export" aria-hidden="true"></i> Export',
        'toolbar.search': 'Search…',
        'toolbar.settings': 'Settings',
        'toolbar.expand': 'Expand all categories',
        'toolbar.collapse': 'Collapse all categories',


        // Filter
        'filter.button': 'Filter',
        'filter.title': 'Filter',
        'filter.reset': 'Reset all',
        'filter.section.status': 'Status',
        'filter.section.type': 'Type',
        'filter.section.tags': 'Tags',
        'filter.section.rating': 'Minimum rating',
        'filter.section.quick': 'Quick filters',
        'filter.status.all': 'All',
        'filter.status.active': 'Active',
        'filter.status.inactive': 'Inactive',
        'filter.status.notInstalled': 'Not installed',
        'filter.type.master': 'Master (ESM)',
        'filter.type.lightMaster': 'Light Master (ESL)',
        'filter.type.mediumMaster': 'Medium Master (ESH)',
        'filter.type.overlay': 'Overlay',
        'filter.type.regular': 'Plugin (ESP)',
        'filter.type.achievementSafe': 'Achievement Safe',
        'filter.type.missingMasters': 'Missing masters',
        'filter.quick.hasUrl': 'Has URL',
        'filter.quick.hasNotes': 'Has notes',
        'filter.quick.hasWarnings': 'Has warnings',
        'filter.type.notAchievementSafe': 'Not Achievement Safe',
        'filter.tags.noTags': 'Has no tags',
        'filter.noTags': 'No tags available',
        'filter.rating.any': 'All',
        'toolbar.undo': 'Undo (Ctrl+Z)',
        'toolbar.redo': 'Redo (Ctrl+Y)',

        'loading.plugins': 'Loading plugins…',
        'loading.error': 'Error: {msg}',

        'accordion.uncategorized': 'Uncategorized',
        'accordion.mods.one': '1 Mod',
        'accordion.mods.many': '{n} Mods',

        'ctx.activate': '<i class="fa-solid fa-toggle-on" aria-hidden="true"></i> Activate',
        'ctx.deactivate': '<i class="fa-solid fa-toggle-off" aria-hidden="true"></i> Deactivate',
        'ctx.moveToCategory': 'Move to category',
        'ctx.uncategorized': '❓ Uncategorized',
        'ctx.details': '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> Details',
        'ctx.addToBaseMasters': '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Add to BaseMasters',
        'ctx.removeFromBaseMasters': '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i> Remove from BaseMasters',
        'ctx.addToBlueprintMasters': '<i class="fa-solid fa-gem" aria-hidden="true"></i> Add to BlueprintMasters',
        'ctx.removeFromBlueprintMasters': '<i class="fa-solid fa-gem" aria-hidden="true"></i> Remove from BlueprintMasters',
        'ctx.removeFromProfile': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Remove from profile',
        'badge.baseMaster': 'Base Master',
        'badge.blueprintMaster': 'Blueprint Master',

        'ctx.editCategory': '<i class="fa-solid fa-pen" aria-hidden="true"></i> Edit',
        'ctx.deleteCategory': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete',

        'dialog.newCategory': 'New Category',
        'dialog.editCategory': 'Edit Category',
        'dialog.category.icon': 'Icon',
        'dialog.category.name': 'Name',
        'dialog.category.desc': 'Description',
        'dialog.category.color': 'Color',
        'dialog.category.namePlaceholder': 'e.g. Graphics Mods',
        'dialog.category.descPlaceholder': 'Optional…',
        'dialog.category.iconPlaceholder': '📦',
        'dialog.cancel': 'Cancel',
        'dialog.create': 'Create',
        'dialog.saveChanges': 'Save',

        'confirm.deleteCategory': 'Really delete this category? Mods will remain and move to "Uncategorized".',
        'confirm.exportUncategorized': '{n} mod{s} not yet categorized.\n\nExport anyway?',
        'confirm.profile.unsavedChanges': 'There are unsaved changes. Switch profile anyway?',
        'confirm.profile.lastProfile': 'The last profile cannot be deleted.',
        'confirm.profile.delete': 'Really delete profile "{name}"?',
        'confirm.profile.dirty': 'Profile "{name}" might not be saved yet. Continue?',

        'dialog.profile.new': 'New Profile',
        'dialog.profile.edit': 'Edit Profile',
        'dialog.profile.group': 'Group',
        'dialog.profile.groupPlaceholder': 'e.g. "Vanilla", "Modded"…',
        'dialog.ok': 'OK',

        'profile.action.new': '<i class="fa-solid fa-plus" aria-hidden="true"></i> New Profile',
        'profile.action.duplicate': '<i class="fa-solid fa-copy" aria-hidden="true"></i> Duplicate',
        'profile.action.edit': '<i class="fa-solid fa-pen" aria-hidden="true"></i> Edit',
        'profile.action.delete': '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete',
        'profile.action.setTemplate': '<i class="fa-solid fa-stamp" aria-hidden="true"></i> Set as Template',
        'log.profile.templateSaved': 'Categories from "{name}" saved as default template',

        'export.exporting': '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Exporting…',
        'export.done': '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Exported!',
        'export.error': '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> Error!',
        'export.button': '<i class="fa-solid fa-file-export" aria-hidden="true"></i> Export',        

        'detail.category': 'Category',
        'detail.achievementSafe': 'Achievement Safe',
        'detail.achievementYes': '✓ Yes',
        'detail.achievementNo': '✗ No',
        'detail.achievementUnknown': '-',
        'detail.rating': 'Rating',
        'detail.url': 'URL',
        'detail.urlPlaceholder': 'https://www.nexusmods.com/…',
        'detail.notes': 'Notes',
        'detail.notesPlaceholder': 'Personal notes…',
        'detail.save': '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save',
        'detail.saved': '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Saved!',
        'detail.uncategorized': 'Uncategorized',
        'detail.openInBrowser': 'Open in browser',
        'detail.pluginType': 'Type',
        'detail.pluginAuthor': 'Author',
        'detail.version': 'Version',
        'detail.pluginDescription': 'Plugin description',
        'detail.masters': 'Dependencies',
        'detail.masters.none': 'None',
        'detail.type.esm': 'Master (ESM)',
        'detail.type.esl': 'Light Master (ESL)',
        'detail.type.overlay': 'Overlay',
        'detail.type.esp': 'Plugin (ESP)',
        'detail.type.esh': 'Medium Master (ESH)',
        'detail.masters.missing': 'Master missing',
        'detail.masters.blueprint': 'Depends on Blueprint Master - must load last',
        'tags.placeholder': 'Add tag…',
        'tags.suggestions': 'Suggestions',
        'detail.tags': 'Tags',
        'detail.suggestedCategory': 'Suggested Category',
        'detail.assignCategory': 'Apply suggestion',
        'detail.noSuggestion': 'No matching category found',
        'detail.ghost' : 'The file could not be found',

        'log.title': 'Log',
        'log.clear': 'Clear',
        'log.warnings': '{n} warning',
        'log.warnings.plural': '{n} warnings',
        'log.hideWarnings': 'Hide warnings',
        'log.mod.notInstalled': '"{name}" is in the profile - but not installed',
        'log.plugins.loaded': '{n} plugins loaded',
        'log.plugins.ignoredBase': '{n} base master(s) ignored: {names}',
        'log.plugins.ignoredBlueprint': '{n} blueprint master(s) ignored: {names}',
        'log.export.success': 'Export successful - Plugins.txt saved',
        'log.export.error': 'Export unsuccessful - Plugins.txt not saved',
        'log.profile.switched': 'Profile switched: {name}',
        'log.profile.saved': 'Profile "{name}" saved',
        'log.mod.blueprintDep': '"{name}" depends on a Blueprint Master - it will automatically load after all other plugins.',
        'log.mod.missingMaster': '"{name}" requires "{master}" - not installed or not in Plugins.txt',
        'log.mod.missingMaster.File': '"{name}" requires "{master}" - file not found',
        'log.mod.masterInactive': '"{name}" requires "{master}" - but this master is disabled',
        'log.mod.masterOrder': '"{name}" is loaded before its master "{master}"',
        'log.mod.notInProfile': 'Plugin "{name}" is not categorized - not part of the current profile.',
        'log.mod.notInProfile.Active': 'Plugin "{name}" is not categorized - not part of the current profile but active.',
        'log.sync.catalog': 'Synchronizing ContentCatalog.txt',
        'log.sync.catalog.actionRequired': '{number} mods require an update in Starfield',
        'log.sync.catalog.updateInfo': '{updated} entries updated in CatalogDB',

        'settings.title': 'Settings',
        'settings.appearance': 'Appearance',
        'settings.theme': 'Theme',
        'settings.theme.dark': 'Dark',
        'settings.theme.light': 'Light',
        'settings.theme.highContrast': 'High Contrast',
        'settings.fontSize': 'Font Size',
        'settings.paths': 'Paths',
        'settings.starfield.pathsAbsolute' : 'Paths should be absolute, not relative.',
        'settings.starfieldAppData': 'Starfield AppData Path',
        'settings.starfieldAppData.hint': 'Contains Plugins.txt and ContentCatalog.txt',
        'settings.createBackupOnExport': 'Create backup on export',
        'settings.createBackupOnExport.hint': 'Automatically backs up Plugins.txt before each export',
        'settings.autoSyncContentCatalog': 'Write ContentCatalog.txt automatically',
        'settings.autoSyncContentCatalog.hint': 'Rewrites the ContentCatalog.txt when starting Starfield',
        'settings.createContentCatalogBackupOnSync': 'Create backup of ContentCatalog.txt when syncing',
        'settings.createContentCatalogBackupOnSync.hint': 'Automatically backs up ContentCatalog.txt before each sync',
        'settings.starfieldData': 'Starfield Data Path',
        'settings.starfieldData.hint': 'Contains .esm/.esp/.esl files',
        'settings.appData': 'App Data Path',
        'settings.appData.hint': 'Contains profiles and metadata',
        'settings.browse': 'Browse',
        'settings.reset': 'Reset to defaults',
        'settings.save': 'Save & Reload',
        'settings.back': '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back',
        'settings.masters': 'Base Master Files',
        'settings.baseMasters': 'Base Masters',
        'settings.baseMasters.hint': 'ESMs that are always loaded - one file per line',
        'settings.blueprintMasters': 'Blueprint Masters',
        'settings.blueprintMasters.hint': 'ESMs after which dependent mods must load last - one file per line',
        'settings.ignoreBaseMasters': 'Ignore Base Masters (don\'t load or export)',
        'settings.ignoreBlueprintMasters': 'Ignore Blueprint Masters (don\'t load or export)',
        'settings.saved': 'Settings saved',
        'settings.launch': 'Launch',
        'settings.sfseExe': 'SFSE Executable',
        'settings.sfseExe.hint': 'Path to sfse_loader.exe',
        'settings.starfieldExe': 'Starfield Executable',
        'settings.starfieldExe.hint': 'Path to Starfield.exe (without SFSE)',

        'launch.sfse': 'Launch with SFSE',
        'launch.starfield': 'Launch Starfield',
        'launch.success': '{label} launched',
        'launch.error': 'Could not launch {label}',
        'launch.exited': '{label} has exited',
        'launch.alreadyRunning': '{label} is already running!',
        'reload.data': 'Reload files',
        'folders.menu': 'Open folder',
        'folders.appdata': 'Starfield AppData',
        'folders.data': 'Mods folder',
        'folders.game': 'Game folder',
        'folders.stbkr': 'Störtebecker folder',
        'softRefresh.reloaded': 'Plugins/Catalog reloaded',
        'softRefresh.externalChange': 'Plugins.txt/ContentCatalog.txt changed externally - you have unsaved changes.',
        'softRefresh.reload': 'Reload',
        'softRefresh.dismiss': 'Ignore',

        'starfieldRunning': 'Starfield is already running!',

        'warn.missingMaster': 'Missing master: {master}',
        'warn.masterInactive': 'Inactive master: {master}',
        'warn.masterOrder': 'Wrong order: {master} loaded after this mod',
        'warn.missingMasterFile': 'Missing master file: {master}',
        'warn.blueprintDep': 'Depends on Blueprint Master',
        'warn.dependentsHeader': 'Dependent mods:',

        'catalog.version.missing': '"{name}": Catalog version missing',
        'catalog.version.invalid_format': '"{name}": Catalog version has invalid format',
        'catalog.version.invalid_timestamp': '"{name}": Catalog version contains invalid timestamp',
        'toolbar.syncCatalog': 'Synchronize Catalog (experimental)',
        'catalog.syncWarning': '<b>⚠️ Mods with invalid versions found</b><br><br>Some mods have corrupted version entries and will appear as updated in Starfield\'s Creations menu. Please re-download these mods from the Creations menu.<br><br><b>Important afterwards:</b> Close Starfield and synchronize the catalog - either via the corresponding button or by launching again through this app. <b>Do not play</b> before the catalog has been synchronized!',
        'catalog.syncSuccess': '{n} version entries in ContentCatalog.txt synced to DB.',
        'catalog.syncError': 'Error syncing ContentCatalog.txt.',

        'about.open': 'About Störtebecker',
        'about.title': 'Störtebecker',
        'about.version': 'Version …',
        'about.subtitle': 'Starfield Load Order Baker',
        'about.label.author': 'Author',
        'about.author': 'beep-cmyk',
        'about.label.license': 'License',
        'about.close': 'Close',
        'about.fontawesome': 'Includes Font Awesome Free - licensed under SIL OFL 1.1 (Icons), MIT (CSS), CC BY 4.0 (Documentation).',

        'metadata.load.corrupt': 'MetaData.json is corrupted and could not be read. All metadata has been reset. You can still back up the file before closing this dialog.',

        "emoji.category.favoriten": "⭐ Favorites",
        "emoji.category.spiel": "🎮 Game",
        "emoji.category.welt": "🌍 World",
        "emoji.category.technik": "🔧 Tech",
        "emoji.category.grafik": "🎨 Graphics",
        "emoji.category.audio": "🔊 Audio",
        "emoji.category.misc": "📋 Misc"
    }
};

let currentLocale = 'de';

export function initI18n() {
    // Systemsprache ist? Also hoffentlich deutsch oder englisch, mehr gibts hier (noch) nicht.
    const sysLang = navigator.language.split('-')[0];
    const saved = localStorage.getItem('locale');
    currentLocale = saved ?? (translations[sysLang] ? sysLang : 'de');
    applyTranslations();
}

export function setLocale(locale) {
    if (!translations[locale]) return;
    currentLocale = locale;
    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);
    applyTranslations();
}

export function getLocale() { return currentLocale; }

export function t(key, vars = {}) {
    const str = translations[currentLocale]?.[key] ?? translations['de']?.[key] ?? key;
    if (typeof str !== 'string') return key;
    return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function applyTranslations() {
    // Alle Elemente mit data-i18n-Attribut per Magie übersetzen. Ehrlich?
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const target = el.dataset.i18nTarget ?? 'htmlContent';
        if(el.dataset.i18nTarget) {
            el[target] = t(key);
        } else {
            el.innerHTML = `<span>${t(key)}</span>`;
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        //el.title = t(el.dataset.i18nTitle);
        el.dataset.tooltip = t(el.dataset.i18nTitle); // Coolerer Tooltip! Das Auge liest mit!
    });
}

export function getAvailableLocales() {
    return [
        { code: 'de', label: 'Deutsch' },
        { code: 'en', label: 'English' },
    ];
}

export const I18N_LABEL_VALUES = new Set(
  Object.values(translations).flatMap(locale => Object.values(locale))
);