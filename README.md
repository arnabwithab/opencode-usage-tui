# opencode-usage-tui

[OpenCode Go](https://opencode.ai/docs/go/) usage inside the [OpenCode](https://opencode.ai) TUI: a **Usage** section in the session sidebar and a `/usage` slash command.

```
Usage
5-hour: 5%
Weekly: 12%
Monthly: 6%
```

## Install

```sh
opencode plugin add opencode-usage-tui
```

Requires an [OpenCode Go](https://opencode.ai/docs/go/) subscription. Reads your existing API key from OpenCode's auth store — nothing to configure.

## Notes

- Usage data refreshes every 5 minutes
- `/usage` shows the same numbers with dollar values and reset times
- Source: ~100 lines, no build step
