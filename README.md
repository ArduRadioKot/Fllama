# Fllama

[Русский](READMERU.md)

Fllama is a desktop workspace for running coding agents across local projects. Choose an agent and a model for each task, run tasks in parallel, and review their file changes in one window.

## Run locally

Install Node.js and Git, then run these commands from the repository root.

```sh
cd src
npm ci
npm start
```

Git is required for worktrees and change review. Connect the agent you intend to use.

| Agent | Setup |
| --- | --- |
| Codex CLI | Install and sign in to the `codex` executable on your PATH. |
| Claude Code CLI | Install and sign in to the `claude` executable on your PATH. |
| OpenCode | Install `opencode` or configure the URL of a running OpenCode server in Settings. Select a project before running a task. |
| Ollama | Run Ollama locally and pull a model from the **Ollama models** panel. |
| LM Studio | Start its local server and check the URL in Settings. |
| OpenAI API / Anthropic API | Enter a key and configure the endpoint in Settings. |

The interface is available in English, Russian, German and Spanish. Choose a language in **Settings → Interface**.

| Additional integration | Setup |
| --- | --- |
| Kiro, Hermes, Cline, Roo Code, Gemini CLI | Install and authenticate the relevant CLI, then open a project and select it for a task. |
| Kilo Code CLI | Install `kilo` on PATH and use `kilo auth` to connect a provider. Select Kilo Code CLI in a project task. |
| OpenRouter, Gemini API, DeepSeek, Groq, xAI, Mistral, Kilo Gateway | Configure the provider in **Settings → Providers**. Without a Kilo key, choose a model marked `:free`. |
| OpenAI-compatible | Set the API base URL and an optional key in **Settings → Providers**. Models can also be entered by ID. |

## Work with agents

1. Open a project folder or create a scratchpad task for a conversation without project files.
2. Choose an agent and a model, then describe the task. Pick **Worktree** to isolate changes when the folder is a Git repository with a commit. Pick **Project folder** to work on the selected files directly.
3. Start another task to run agents in parallel. In each task, the inspector shows run status, activity, files, and the Git diff.
4. Use **Hand off to an agent** to start a follow-up with the previous prompt and response. A worktree handoff shares the existing branch and checkout, so the next agent can review its changes.

Each new worktree starts from the current Git commit on a separate `fllama/…` branch. Uncommitted edits stay in the original checkout. Tasks that share a checkout run one at a time. Deleting a task keeps the worktree and branch on disk so its code can still be recovered. Fllama leaves merging to Git.

Fllama can also expose its local model server from **Settings → Fllama as an agent**.

## License

[GNU GPL v2.0](LICENSE)
