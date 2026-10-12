/** @jsxImportSource @opentui/solid */
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { createSignal, Show } from "solid-js"
import { Plugin, usePlugin } from "@opencode/plugin/tui"

// ponytail: dollar caps hardcoded from https://opencode.ai/docs/go — update if the plan changes
const CAPS = { rolling: 12, weekly: 30, monthly: 60 } as const
const ENDPOINT = "https://opencode.ai/zen/go/v1/usage"

type Window = { status: string; percent: number; resetsAt: string }
type Usage = Record<keyof typeof CAPS, Window>

const [usage, setUsage] = createSignal<Usage | null>(null)

function readKey(): string | undefined {
  try {
    const base = process.env.XDG_DATA_HOME ?? `${homedir()}/.local/share`
    const auth = JSON.parse(readFileSync(`${base}/opencode/auth.json`, "utf8"))
    return auth["opencode-go"]?.key ?? auth.opencode?.key
  } catch {
    return undefined
  }
}

async function refresh(): Promise<void> {
  const key = readKey()
  if (!key) {
    setUsage(null)
    return
  }
  try {
    const res = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${key}` } })
    if (res.ok) setUsage((await res.json()).usage)
  } catch {}
}

function money(percent: number, cap: number): string {
  return `$${((percent / 100) * cap).toFixed(2)}`
}

function resetsIn(iso: string): string {
  const mins = Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 60_000))
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.round(mins / 60)}h`
  return `${Math.round(mins / 1440)}d`
}

const WINDOWS = ["rolling", "weekly", "monthly"] as const
const LABELS = { rolling: "5-hour", weekly: "Weekly", monthly: "Monthly" } as const

function View() {
  const context = usePlugin()
  return (
    <box>
      <text fg={context.theme.text.base}>
        <b>Usage</b>
      </text>
      <Show when={usage()} fallback={<text fg={context.theme.text.muted}>no usage data</text>}>
        {(data) => (
          <>
            {WINDOWS.map((w) => (
              <text fg={context.theme.text.muted}>{`${LABELS[w]}: ${data()[w].percent}%`}</text>
            ))}
          </>
        )}
      </Show>
    </box>
  )
}

export default Plugin.define({
  id: "usage",
  async setup(context) {
    void refresh()
    const timer = setInterval(refresh, 5 * 60_000)

    context.ui.slot({
      append: "sidebar.content",
      render: () => <View />,
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "usage.show",
          title: "Show Go usage",
          group: "Plugin",
          palette: true,
          slash: { name: "usage" },
          run() {
            const u = usage()
            if (!u) {
              context.ui.toast.show({
                variant: "warning",
                title: "Usage",
                message: "No usage data — signed in to OpenCode Go?",
              })
              return
            }
            context.ui.toast.show({
              title: "OpenCode Go usage",
              message: WINDOWS.map(
                (w) =>
                  `${LABELS[w]}: ${u[w].percent}% (${money(u[w].percent, CAPS[w])}) · resets in ${resetsIn(u[w].resetsAt)}`,
              ).join("\n"),
            })
          },
        },
      ],
    }))

    return () => clearInterval(timer)
  },
})
