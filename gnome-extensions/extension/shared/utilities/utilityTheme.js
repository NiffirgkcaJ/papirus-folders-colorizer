import GLib from 'gi://GLib';

import { getLocalIconsDir, getSystemIconsDir } from './utilityPaths.js';

/**
 * Check if a theme exists in the given directory.
 * @param {string} baseDir - The icons directory to check.
 * @param {string} themeName - The theme name.
 * @returns {boolean} True if the theme exists.
 */
export function themeExists(baseDir, themeName) {
    const themePath = GLib.build_filenamev([baseDir, themeName]);
    return GLib.file_test(themePath, GLib.FileTest.IS_DIR);
}

/**
 * Get the theme location status.
 * @param {string} themeName - The theme name to check.
 * @returns {'local' | 'system' | 'not-found'} The location of the theme.
 */
export function getThemeLocation(themeName) {
    if (themeExists(getLocalIconsDir(), themeName)) return 'local';
    if (themeExists(getSystemIconsDir(), themeName)) return 'system';
    return 'not-found';
}
