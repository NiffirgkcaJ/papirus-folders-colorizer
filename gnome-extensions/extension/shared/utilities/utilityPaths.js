import GLib from 'gi://GLib';

/**
 * Get the local icons directory path.
 * @returns {string} Path to ~/.local/share/icons
 */
export function getLocalIconsDir() {
    return GLib.build_filenamev([GLib.get_home_dir(), '.local', 'share', 'icons']);
}

/**
 * Get the system icons directory path.
 * @returns {string} Path to /usr/share/icons
 */
export function getSystemIconsDir() {
    return '/usr/share/icons';
}
