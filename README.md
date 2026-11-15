# Kızıl Şafak

## Claude Code skill'leri

Aşağıdaki repolar `vendor/` altında git submodule olarak eklidir; skill ve agent'lar
`.claude/skills/` ve `.claude/agents/` altına symlink ile bağlanmıştır, böylece Claude Code
bu repoda otomatik olarak bulur.

| Repo | Konum | İçerik |
|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | `vendor/anthropic-skills` | 19 skill |
| [obra/superpowers](https://github.com/obra/superpowers) | `vendor/superpowers` | 15 skill |
| [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `vendor/awesome-gamedev-agent-skills` | 79 skill + `gamedev-router` |
| [donchitos/claude-code-game-studios](https://github.com/donchitos/claude-code-game-studios) | `vendor/claude-code-game-studios` | 78 skill + 49 agent |

Klonladıktan sonra submodule'leri indirin:

```sh
git clone --recurse-submodules <repo-url>
# veya mevcut bir klonda:
git submodule update --init
```

Güncellemek için: `git submodule update --remote`
