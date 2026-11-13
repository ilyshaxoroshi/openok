/**
 * OpenOK release highlights for the What's New dialog, newest first. Add a release here when it ships: the dialog
 * lists the entries newer than the version the user last saw, so keep the tag equal to OPENCODE_VERSION.
 */
export const RELEASES = [
  {
    tag: "2.2.6",
    highlights: [
      {
        title: "AGENTS.md from every folder",
        description:
          "Every AGENTS.md in the project loads when a session starts, nearest first, so monorepo packages keep their own rules without waiting for the agent to read a file there.",
      },
      {
        title: "Claude Code rules as fallbacks",
        description:
          "A folder without AGENTS.md uses its CLAUDE.md, and ~/.config/opencode/AGENTS.md falls back to ~/.claude/CLAUDE.md for every project.",
      },
      {
        title: "Download updates by hand",
        description:
          "Builds that cannot update themselves now show the latest GitHub release in the titlebar and in Settings › Updates, with a button that opens the download page.",
      },
    ],
  },
  {
    tag: "2.2.5",
    highlights: [
      {
        title: "Free models work again",
        description:
          "The OpenCode Console gates its free tier by client version. OpenOK now reports its OpenCode base version, so the free tier stops asking for 1.18.0 or newer.",
      },
      {
        title: "Versions follow OpenCode",
        description:
          "OpenOK releases now use the upstream version they are built from, so you can tell at a glance which OpenCode a build carries.",
      },
    ],
  },
  {
    tag: "1.0.2",
    highlights: [
      {
        title: "The pet follows your agent",
        description:
          "While a session runs, OK stays awake instead of dozing off, fidgets with thinking dots above its head, and cheers with hearts when the run finishes.",
      },
      {
        title: "What's new has a cat",
        description: "This screen now lists OpenOK's own changes and greets you with the mascot.",
      },
      {
        title: "Synced with OpenCode",
        description:
          "Merged the latest upstream dev branch, bringing its desktop, CLI and app fixes into OpenOK while keeping our own touches.",
      },
    ],
  },
  {
    tag: "1.0.1",
    highlights: [
      {
        title: "The sleeping sticker",
        description: "Left alone for a while, OK dozes off and switches to its sleeping artwork until you touch it.",
      },
      {
        title: "Background service fix",
        description:
          "The production CLI now registers the background service where the desktop app looks for it, so it no longer hangs on startup.",
      },
    ],
  },
]
