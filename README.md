# Papirus Folders Colorizer GNOME Extension

Automatically sync your **Papirus** folder icons with your **GNOME Accent Color**.

This extension provides a seamless integration between your system's accent color preference and the Papirus icon theme. It automatically detects changes and updates folder colors instantly, supports light/dark mode switching, and handles all necessary file operations safely in the background.

## Features

*   **Auto-Sync:**
    *   Changes folder colors instantly when you switch GNOME accent colors.
    *   Supports all standard GNOME accent colors (Blue, Teal, Green, Yellow, Orange, Red, Pink, Purple, Slate).
*   **Dark/Light Mode:**
    *   Automatically switches between `Papirus`, `Papirus-Light` and `Papirus-Dark` icon themes based on your system preference.
*   **Smart Caching:**
    *   Safely copies icons from the system directory (`/usr/share/icons`) to your local directory (`~/.local/share/icons`) if needed.
    *   Avoiding needing root permissions or `sudo` or `pkexec` to change folder colors.
*   **Auto-Restore:**
    *   Reverts to your previous icon theme when the extension is disabled.
*   **Debounced Updates:**
    *   Handles rapid color changes efficiently without freezing the shell.

## Compatibility

Requires GNOME Shell version 47 and up.

## Requirements

You must have the **Papirus Icon Theme** installed on your system.

### Ubuntu / Debian
```bash
sudo apt install papirus-icon-theme
```

### Fedora
```bash
sudo dnf install papirus-icon-theme
```

### Arch Linux
```bash
sudo pacman -S papirus-icon-theme
```

### Papirus Folders Script
If the `papirus-folders` command is not available after installing the theme, you can install it using the official installer:

```bash
wget -qO- https://git.io/papirus-folders-install | sh
```

## Installation

### From extensions.gnome.org (Recommended)

The easiest way to install is from the official GNOME Extensions website.

<a href="https://extensions.gnome.org/extension/9261/papirus-folders-colorizer/">
<img src="https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.svg" alt="Get it on EGO" width="200" />
</a>

### Installing from a ZIP File

1.  **Download the ZIP:** Go to the [Releases](https://github.com/NiffirgkcaJ/papirus-folders-colorizer/releases) page and download the latest `papirus-folders-colorizer@NiffirgkcaJ.github.com.zip` file.

2.  **Unzip the File:** Extract the contents of the zip file. This will create a folder with the extension's files inside (like `extension.js`, `metadata.json`, etc.).

3.  **Find the Destination Folder:** The extension needs to be placed in your local extensions directory. You can open it in your file manager or create it if it doesn't exist with this command:
    ```bash
    mkdir -p ~/.local/share/gnome-shell/extensions/
    ```

4.  **Move and Rename:** Move the unzipped folder into the extensions directory and **rename the folder to match the extension's UUID**. This step is crucial. The UUID is: `papirus-folders-colorizer@NiffirgkcaJ.github.com`.

    For example, if you unzipped the files into a folder named `papirus-folders-colorizer`, you would run:
    ```bash
    mv papirus-folders-colorizer ~/.local/share/gnome-shell/extensions/papirus-folders-colorizer@NiffirgkcaJ.github.com
    ```

5.  **Restart GNOME Shell:**
    *   On **X11**, press `Alt` + `F2`, type `r` into the dialog, and press `Enter`.
    *   On **Wayland**, you must log out and log back in.

6.  **Enable the Extension:** Open the **Extensions** app (or GNOME Tweaks) and enable "Papirus Folders Colorizer". You can also do this from the command line:
    ```bash
    gnome-extensions enable papirus-folders-colorizer@NiffirgkcaJ.github.com
    ```

### Install from Source (for Developers)

1.  Clone the repository:
    ```bash
    git clone https://github.com/NiffirgkcaJ/papirus-folders-colorizer.git
    cd papirus-folders-colorizer
    ```
2.  Run the installation script:
    ```bash
    ./install.sh
    ```
3.  Restart GNOME Shell (press `Alt` + `F2`, type `r`, and press `Enter`) or log out and back in.
4.  Enable the extension using the Extensions app or the command line:
    ```bash
    gnome-extensions enable papirus-folders-colorizer@NiffirgkcaJ.github.com
    ```

## Usage

*   **Install Papirus:** Ensure `papirus-icon-theme` is installed via your package manager (e.g., `sudo apt install papirus-icon-theme`).
*   **Enable Extension:** Once enabled, the extension takes over managing your folder colors.
*   **Change Accent:** Open **Settings** -> **Appearance** (or **Style** depending on your distro) and change the **Accent Color**. Your folders will update instantly.

## Uninstallation

*   **Using the Extensions App (Recommended):**
    Open the "Extensions" application, find "Papirus Folders Colorizer", and click the "Uninstall" button.

*   **Using the Script:**
    If you installed from source, navigate to the cloned repository directory and run:
    ```bash
    ./uninstall.sh
    ```

## Contributing

Contributions are welcome! Please feel free to open an issue to report a bug or suggest a feature, or submit a pull request with your improvements.

## License

This project is licensed under the **GPLv3** - see the [LICENSE](LICENSE) file for details.