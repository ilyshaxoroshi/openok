import { APP_IDS } from "../electron-builder.config"
import { resolveChannel } from "./utils"

const arg = process.argv[2]

const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel()

const appId = APP_IDS[channel]

const productName = channel === "prod" ? "OpenOK" : `OpenCode ${channel.charAt(0).toUpperCase() + channel.slice(1)}`

const summary = `Open source AI coding agent${channel !== "prod" ? ` (${channel})` : ""}`

const description =
  channel === "prod"
    ? "OpenOK is an open fork of OpenCode, the open source agent that helps you write and run code with any AI model."
    : "OpenCode is an open source agent that helps you write and run code with any AI model."

const links =
  channel === "prod"
    ? {
        bugtracker: "https://github.com/ilyshaxoroshi/openok/issues",
        homepage: "https://github.com/ilyshaxoroshi/openok",
        vcs: "https://github.com/ilyshaxoroshi/openok",
      }
    : {
        bugtracker: "https://github.com/anomalyco/opencode/issues",
        homepage: "https://opencode.ai",
        vcs: "https://github.com/anomalyco/opencode",
      }

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${appId}</id>

  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>

  <name>${productName}</name>
  <summary>${summary}</summary>

  <developer id="ly.anoma">
    <name>Anomaly Innovations Inc.</name>
  </developer>

  <description>
    <p>
      ${description}
    </p>
  </description>

  <launchable type="desktop-id">${appId}.desktop</launchable>

  <content_rating type="oars-1.1" />

  <url type="bugtracker">${links.bugtracker}</url>
  <url type="homepage">${links.homepage}</url>
  <url type="vcs-browser">${links.vcs}</url>

  <screenshots>
    <screenshot type="default">
      <image>https://raw.githubusercontent.com/anomalyco/opencode/b75d4d1c5ec449585d515c756fc81f080a157a9a/packages/web/src/assets/lander/screenshot.png</image>
    </screenshot>
  </screenshots>
</component>
`

await Bun.write(`resources/${appId}.metainfo.xml`, xml)

console.log(`Generated metainfo for ${channel} at resources/${appId}.metainfo.xml`)
