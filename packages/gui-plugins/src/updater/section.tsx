import { createMemo, Show } from "solid-js"
import { usePlugin } from "@opencode/plugin/gui"
import { updaterAction } from "./action"
import type { UpdaterState } from "@opencode/plugin/gui/updater"
import type { Release } from "./release"
import type definition from "./index"

export default function UpdatesSection(props: {
  state: () => UpdaterState | undefined
  release: () => Release | undefined
  run: () => void
}) {
  const ctx = usePlugin<typeof definition>()
  const ui = ctx.ui
  const releaseNotes = ctx.stores.releaseNotes
  const action = createMemo(() => updaterAction(props.state()))

  return (
    <ui.SettingsSection title={ctx.t("section.title")}>
      <ui.SettingsRow
        id="settings-release-notes"
        title={ctx.t("releaseNotes.title")}
        description={ctx.t("releaseNotes.description")}
      >
        <ui.Switch
          label={ctx.t("releaseNotes.title")}
          hideLabel
          checked={releaseNotes.value.enabled}
          onChange={(checked) =>
            releaseNotes.update((draft) => {
              draft.enabled = checked
            })
          }
        />
      </ui.SettingsRow>

      <Show when={props.release()}>
        {(release) => (
          <ui.SettingsRow
            id="settings-release-available"
            title={ctx.t("release.available", { version: release().version })}
            description={ctx.t("release.description")}
          >
            <ui.Button onClick={() => ctx.system.openExternal(release().url)}>
              {ctx.t("release.download")}
            </ui.Button>
          </ui.SettingsRow>
        )}
      </Show>

      <ui.SettingsRow id="settings-check-updates" title={ctx.t("check.title")} description={ctx.t("check.description")}>
        <ui.Button disabled={!action().run} onClick={() => props.run()}>
          {ctx.t(action().label)}
        </ui.Button>
      </ui.SettingsRow>
    </ui.SettingsSection>
  )
}