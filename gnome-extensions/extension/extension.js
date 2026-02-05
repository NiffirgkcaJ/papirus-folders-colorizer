import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Debouncer } from './shared/utilities/utilityDebouncer.js';
import { themeExists } from './shared/utilities/utilityTheme.js';
import { AccentToPapirus, PapirusThemes } from './shared/constants/constantTheme.js';
import { getLocalIconsDir, getSystemIconsDir } from './shared/utilities/utilityPaths.js';

/**
 * Get the modification time of a directory.
 * @param {string} path - Directory path.
 * @returns {number} Modification time in seconds since epoch, or 0 if not found.
 */
function getModificationTime(path) {
    const file = Gio.File.new_for_path(path);
    try {
        const info = file.query_info('time::modified', Gio.FileQueryInfoFlags.NONE, null);
        return info.get_modification_date_time()?.to_unix() ?? 0;
    } catch {
        // File doesn't exist or can't be accessed, return 0 to indicate no mtime
        return 0;
    }
}

/**
 * Run a command asynchronously using Gio.Subprocess.
 * @param {string[]} argv - Command arguments.
 * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
 */
function runCommandAsync(argv) {
    return new Promise((resolve, reject) => {
        try {
            const proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
            proc.communicate_utf8_async(null, null, (source, result) => {
                try {
                    const [, stdout, stderr] = source.communicate_utf8_finish(result);
                    resolve({
                        success: source.get_successful(),
                        stdout: stdout ?? '',
                        stderr: stderr ?? '',
                    });
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Main extension class.
 */
export default class PapirusFoldersColorizerExtension extends Extension {
    _settings = null;
    _interfaceSettings = null;
    _accentColorChangedId = null;
    _colorSchemeChangedId = null;
    _accentDebouncer = null;
    _pendingCopy = false;

    /**
     * Initialize extension, set up theme sync, and start listening for changes.
     */
    enable() {
        this._settings = this.getSettings();
        this._interfaceSettings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
        this._accentDebouncer = new Debouncer(() => this._applyAccentColor(), 250);

        this._saveOriginalTheme();
        this._ensureLocalThemesAsync().then(() => {
            this._ensurePapirusTheme();
            this._applyAccentColor();
        });

        this._accentColorChangedId = this._interfaceSettings.connect('changed::accent-color', () => this._accentDebouncer.trigger());
        this._colorSchemeChangedId = this._interfaceSettings.connect('changed::color-scheme', () => {
            this._ensurePapirusTheme();
            this._accentDebouncer.trigger();
        });
    }

    /**
     * Disconnect signal handlers and restore original theme.
     * Session-mode aware by properly cleaning up all resources.
     * Disconnects accent-color and color-scheme signals.
     * Destroys the debouncer, restores the original theme, and nulls all settings.
     */
    disable() {
        if (this._accentColorChangedId) {
            this._interfaceSettings.disconnect(this._accentColorChangedId);
            this._accentColorChangedId = null;
        }
        if (this._colorSchemeChangedId) {
            this._interfaceSettings.disconnect(this._colorSchemeChangedId);
            this._colorSchemeChangedId = null;
        }
        if (this._accentDebouncer) {
            this._accentDebouncer.destroy();
            this._accentDebouncer = null;
        }

        this._restoreOriginalTheme();
        this._interfaceSettings = null;
        this._settings = null;
    }

    /**
     * Save the original icon theme on first enable if not already Papirus.
     */
    _saveOriginalTheme() {
        const stored = this._settings.get_string('original-icon-theme');
        if (stored !== '') return;

        const currentTheme = this._interfaceSettings.get_string('icon-theme');
        if (!currentTheme.startsWith('Papirus')) {
            console.log(`[PapirusFoldersColorizer] Saving original theme: ${currentTheme}`);
            this._settings.set_string('original-icon-theme', currentTheme);
        }
    }

    /**
     * Restore the original icon theme and clear the stored value.
     */
    _restoreOriginalTheme() {
        const originalTheme = this._settings.get_string('original-icon-theme');
        if (originalTheme === '') return;

        console.log(`[PapirusFoldersColorizer] Restoring original theme: ${originalTheme}`);
        this._interfaceSettings.set_string('icon-theme', originalTheme);
        this._settings.set_string('original-icon-theme', '');
    }

    /**
     * Set the icon theme to the appropriate Papirus variant if not already.
     */
    _ensurePapirusTheme() {
        const currentTheme = this._interfaceSettings.get_string('icon-theme');
        if (PapirusThemes.includes(currentTheme)) return;

        const papirusTheme = this._getAutoThemeName();
        console.log(`[PapirusFoldersColorizer] Setting icon theme to ${papirusTheme}`);
        this._interfaceSettings.set_string('icon-theme', papirusTheme);
    }

    /**
     * Copy Papirus themes from system to local if missing or outdated.
     */
    async _ensureLocalThemesAsync() {
        if (this._pendingCopy) return;
        this._pendingCopy = true;

        const localDir = getLocalIconsDir();
        const systemDir = getSystemIconsDir();

        const localDirFile = Gio.File.new_for_path(localDir);
        if (!localDirFile.query_exists(null)) {
            try {
                localDirFile.make_directory_with_parents(null);
            } catch (e) {
                console.error(`[PapirusFoldersColorizer] Failed to create local icons dir: ${e.message}`);
                this._pendingCopy = false;
                return;
            }
        }

        const copyOperations = [];
        for (const theme of PapirusThemes) {
            const localThemePath = GLib.build_filenamev([localDir, theme]);
            const systemThemePath = GLib.build_filenamev([systemDir, theme]);

            if (!themeExists(systemDir, theme)) continue;

            if (!themeExists(localDir, theme)) {
                console.log(`[PapirusFoldersColorizer] Copying ${theme} to local...`);
                copyOperations.push(this._copyThemeAsync(systemThemePath, localThemePath));
                continue;
            }

            const localMtime = getModificationTime(localThemePath);
            const systemMtime = getModificationTime(systemThemePath);
            if (systemMtime > localMtime) {
                console.log(`[PapirusFoldersColorizer] Updating ${theme} from system...`);
                copyOperations.push(this._copyThemeAsync(systemThemePath, localThemePath));
            }
        }

        if (copyOperations.length > 0) await Promise.all(copyOperations);

        this._pendingCopy = false;
    }

    /**
     * Copy a theme directory recursively using async native Gio operations.
     * @param {string} sourcePath - Source theme path.
     * @param {string} destPath - Destination theme path.
     */
    async _copyThemeAsync(sourcePath, destPath) {
        try {
            await this._copyDirectoryRecursiveAsync(Gio.File.new_for_path(sourcePath), Gio.File.new_for_path(destPath));
            console.log(`[PapirusFoldersColorizer] Successfully copied theme to ${destPath}`);
        } catch (e) {
            console.error(`[PapirusFoldersColorizer] Failed to copy theme: ${e.message}`);
        }
    }

    /**
     * Recursively copy a directory and its contents asynchronously.
     * @param {Gio.File} source - Source directory.
     * @param {Gio.File} dest - Destination directory.
     */
    async _copyDirectoryRecursiveAsync(source, dest) {
        const sourceType = source.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

        if (sourceType === Gio.FileType.SYMBOLIC_LINK) {
            const info = source.query_info('standard::symlink-target', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            const target = info.get_symlink_target();
            if (dest.query_exists(null)) dest.delete(null);
            dest.make_symbolic_link(target, null);
        } else if (sourceType === Gio.FileType.DIRECTORY) {
            if (!dest.query_exists(null)) {
                dest.make_directory_with_parents(null);
            }

            const enumerator = source.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

            const children = [];
            let info;
            while ((info = enumerator.next_file(null)) !== null) {
                children.push(info.get_name());
            }

            await children.reduce((chain, name) => chain.then(() => this._copyDirectoryRecursiveAsync(source.get_child(name), dest.get_child(name))), Promise.resolve());
        } else {
            await new Promise((resolve, reject) => {
                source.copy_async(dest, Gio.FileCopyFlags.OVERWRITE, GLib.PRIORITY_LOW, null, null, (src, result) => {
                    try {
                        src.copy_finish(result);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    }

    /**
     * Apply the current accent color to Papirus folders.
     */
    _applyAccentColor() {
        if (this._pendingCopy) {
            console.log('[PapirusFoldersColorizer] Skipping apply, copy in progress');
            return;
        }

        const accentColor = this._interfaceSettings.get_string('accent-color');
        const papirusColor = AccentToPapirus[accentColor];
        if (!papirusColor) {
            console.warn(`[PapirusFoldersColorizer] Unknown accent color: ${accentColor}`);
            return;
        }

        const themeName = this._getAutoThemeName();
        const localDir = getLocalIconsDir();
        if (!themeExists(localDir, themeName)) {
            console.warn(`[PapirusFoldersColorizer] Local theme ${themeName} not found, skipping`);
            return;
        }

        this._runPapirusFolders(papirusColor, themeName);
    }

    /**
     * Get the Papirus theme variant based on the current color scheme.
     * @returns {string} Theme name matching the system light/dark preference.
     */
    _getAutoThemeName() {
        const colorScheme = this._interfaceSettings.get_string('color-scheme');
        switch (colorScheme) {
            case 'prefer-dark':
                return 'Papirus-Dark';
            case 'prefer-light':
                return 'Papirus-Light';
            default:
                return 'Papirus';
        }
    }

    /**
     * Run papirus-folders command to change folder icon color.
     * @param {string} color - The Papirus color name.
     * @param {string} theme - The Papirus theme variant.
     */
    async _runPapirusFolders(color, theme) {
        if (GLib.find_program_in_path('papirus-folders') === null) {
            console.warn('[PapirusFoldersColorizer] papirus-folders command not found');
            return;
        }

        try {
            const result = await runCommandAsync(['papirus-folders', '-C', color, '--theme', theme]);
            if (result.success) {
                console.log(`[PapirusFoldersColorizer] Changed folder color to ${color}`);
            } else {
                console.error(`[PapirusFoldersColorizer] Error: ${result.stderr}`);
            }
        } catch (e) {
            console.error(`[PapirusFoldersColorizer] Failed to run papirus-folders: ${e.message}`);
        }
    }
}
