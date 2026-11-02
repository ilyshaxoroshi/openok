<img width="256" height="256" alt="Плюшевый котёнок-акула с табличкой OK" src="https://raw.githubusercontent.com/ilyshaxoroshi/openok/dev/packages/app/public/ok.png" />

# OpenOK

Тёплый форк [OpenCode](https://github.com/anomalyco/opencode) — агент для терминала и десктопа, только с другим лицом.

**[Сайт](https://ilyshaxoroshi.github.io/openok/)** · [Все отличия от OpenCode](#отличия-от-opencode) · [Установка](#установка)

## Отличия от OpenCode

- **Свой маскот** — кот-акула на экране загрузки, вместо буквы «O» на главном экране и в настройках «О приложении».
- **«OK» Pet** — плюшевый кот поверх приложения, которого можно перетаскивать. Включается в *Настройки → Внешний вид → "OK" Pet*, физика — отдельным тумблером: падает, кувыркается, отскакивает от краёв окна.
- **Переходы между вкладками** — панель мягко появляется при смене вкладки (*Внешний вид → Motion → Transitions*).
- **Иконка приложения** — маскот вместо логотипа OpenCode, на всех платформах.
- **Свой сайт** — статическая страница в [`site/`](site), публикуется на GitHub Pages.

## Установка

```bash
git clone https://github.com/ilyshaxoroshi/openok.git
cd openok
bun install
```

Запуск:

```bash
bun dev            # терминальный интерфейс
bun dev:web        # веб-интерфейс на localhost:3000
bun run dev:desktop # десктоп-приложение
```

## Структура

Проект — форк OpenCode, поэтому жить с ним можно так же:

| Пакет | Назначение |
| --- | --- |
| `packages/cli` | CLI и TUI |
| `packages/desktop` | десктоп на Electron |
| `packages/app` | веб-интерфейс и логика интерфейса |
| `packages/ui` | компоненты дизайн-системы |
| `site` | лендинг для GitHub Pages |

## Лицензия

MIT, как и у OpenCode. Все права на исходный агент принадлежат авторам OpenCode.
