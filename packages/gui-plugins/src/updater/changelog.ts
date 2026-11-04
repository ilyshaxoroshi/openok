/**
 * OpenOK release highlights for the What's New dialog, newest first. Add a release here when it ships: the dialog
 * lists the entries newer than the version the user last saw, so keep the tag equal to OPENCODE_VERSION.
 */
export const RELEASES = [
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
