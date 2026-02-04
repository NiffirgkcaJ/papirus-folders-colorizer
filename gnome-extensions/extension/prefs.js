import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { getThemeLocation } from './shared/utilities/utilityTheme.js';
import { PapirusThemes } from './shared/constants/constantTheme.js';

export default class PapirusFoldersColorizerPreferences extends ExtensionPreferences {
    /**
     * Populate the preferences window with widgets.
     * @param {Adw.PreferencesWindow} window - The preferences window to fill.
     */
    fillPreferencesWindow(window) {
        const anyThemeAvailable = PapirusThemes.some((theme) => getThemeLocation(theme) !== 'not-found');
        const papirusFoldersAvailable = GLib.find_program_in_path('papirus-folders') !== null;

        if (!anyThemeAvailable) {
            window.add_toast(
                new Adw.Toast({
                    title: 'Papirus icon theme not found. Please install it first.',
                    timeout: 0,
                }),
            );
        }

        if (!papirusFoldersAvailable) {
            window.add_toast(
                new Adw.Toast({
                    title: 'papirus-folders command not found. Please install papirus-folders.',
                    timeout: 0,
                }),
            );
        }

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'folder-symbolic',
        });
        window.add(page);

        const statusGroup = new Adw.PreferencesGroup({
            title: 'Theme Status',
            description: 'Current Papirus theme installation status',
        });
        page.add(statusGroup);

        for (const theme of PapirusThemes) {
            const location = getThemeLocation(theme);
            const statusRow = new Adw.ActionRow({
                title: theme,
                subtitle: this._getLocationLabel(location),
            });
            const statusIcon = new Gtk.Image({
                icon_name: this._getStatusIcon(location),
                valign: Gtk.Align.CENTER,
            });
            statusRow.add_suffix(statusIcon);
            statusGroup.add(statusRow);
        }

        const infoGroup = new Adw.PreferencesGroup({ title: 'About' });
        page.add(infoGroup);

        const infoRow = new Adw.ActionRow({
            title: 'How it works',
            subtitle: 'Automatically syncs folder colors with your accent color. Theme variant follows light/dark mode.',
        });
        infoGroup.add(infoRow);
    }

    /**
     * Get a human-readable label for the theme location.
     * @param {'local' | 'system' | 'not-found'} location - The theme location.
     * @returns {string} A descriptive label.
     */
    _getLocationLabel(location) {
        switch (location) {
            case 'local':
                return 'Installed locally (~/.local/share/icons)';
            case 'system':
                return 'Installed system-wide (/usr/share/icons)';
            default:
                return 'Not installed';
        }
    }

    /**
     * Get the appropriate status icon for the location.
     * @param {'local' | 'system' | 'not-found'} location - The theme location.
     * @returns {string} Icon name.
     */
    _getStatusIcon(location) {
        switch (location) {
            case 'local':
                return 'emblem-ok-symbolic';
            case 'system':
                return 'emblem-synchronizing-symbolic';
            default:
                return 'dialog-warning-symbolic';
        }
    }
}
