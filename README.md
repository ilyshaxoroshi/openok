<div align="center">
  <img width="256" alt="Plush shark kitten holding an OK sign" src="https://raw.githubusercontent.com/ilyshaxoroshi/openok/dev/packages/app/public/ok.png" />
  <h1>OpenOK</h1>
  <p>A warm-hearted fork of <a href="https://github.com/anomalyco/opencode">OpenCode</a> — a terminal and desktop coding agent with a new face.</p>
  <p><strong><a href="https://ilyshaxoroshi.github.io/openok/">Website</a></strong> · <a href="#differences-from-opencode">All differences from OpenCode</a> · <a href="#installation">Installation</a> · <a href="README.ru.md">Русский</a></p>
</div>

## Differences from OpenCode

- **Its own mascot** — a shark-cat on the loading screen, instead of the "O" on the home screen and in the "About" settings.
- **"OK" Pet** — a plush cat on top of the app that you can drag around. Enabled in *Settings → Appearance → "OK" Pet*; physics is a separate toggle: it falls, tumbles, and bounces off the window edges. Double-click for a "meow" and hearts; after 25 seconds of rest the cat falls asleep, and the spot where you put it is remembered between launches.
- **Tab transitions** — panels fade in softly when switching tabs (*Appearance → Motion → Transitions*).
- **App icon** — the mascot instead of the OpenCode logo in Windows and Linux builds.
- **Its own website** — a static page in [`site/`](site), published on GitHub Pages.

## Installation

```bash
git clone https://github.com/ilyshaxoroshi/openok.git
cd openok
bun install
```

Run:

```bash
bun dev            # terminal interface
bun dev:web        # web interface on localhost:3000
bun run dev:desktop # desktop app
```

## Building a release

The fork version is set at build time, so the `package.json` files stay on the upstream version. PowerShell commands:

```powershell
cd packages\cli
$env:OPENCODE_CHANNEL="prod"; $env:OPENCODE_VERSION="1.0.0"; $env:OPENCODE_TARGET="windows-x64-baseline"
bun run script/build.ts --skip-install

cd ..\desktop
$env:OPENCODE_TARGET="windows-x64"
bun run build
bun run pack
```

`pack` puts the unpacked app into `dist\desktop\app`. The installer is built from a copy of that directory outside `dist`, because the next `pack` wipes `dist\desktop`:

```powershell
Copy-Item -Recurse ..\..\dist\desktop\app $env:TEMP\openok-app
$env:OPENCODE_DESKTOP_APP="$env:TEMP\openok-app"
bun run pack
```

The finished installer is `dist\desktop\OpenOK-win-x64.exe`. The production build installs as a separate `OpenOK` app (app id `io.github.ilyshaxoroshi.openok`) and updates from the fork's GitHub releases.

## Structure

The project is a fork of OpenCode, so you can live with it the same way:

| Package | Purpose |
| --- | --- |
| `packages/cli` | CLI and TUI |
| `packages/desktop` | Electron desktop app |
| `packages/app` | web interface and UI logic |
| `packages/ui` | design system components |
| `site` | landing page for GitHub Pages |

## License

MIT, same as OpenCode. All rights to the original agent belong to the OpenCode authors.
