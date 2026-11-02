<img width="256" height="256" alt="Плюшевый котёнок-акула с табличкой OK" src="https://raw.githubusercontent.com/ilyshaxoroshi/openok/dev/packages/app/public/ok.png" />

# OpenOK

Тёплый форк [OpenCode](https://github.com/anomalyco/opencode) — агент для терминала и десктопа, только с другим лицом.

**[Сайт](https://ilyshaxoroshi.github.io/openok/)** · [Все отличия от OpenCode](#отличия-от-opencode) · [Установка](#установка)

## Отличия от OpenCode

- **Свой маскот** — кот-акула на экране загрузки, вместо буквы «O» на главном экране и в настройках «О приложении».
- **«OK» Pet** — плюшевый кот поверх приложения, которого можно перетаскивать. Включается в *Настройки → Внешний вид → "OK" Pet*, физика — отдельным тумблером: падает, кувыркается, отскакивает от краёв окна. Двойной клик — «мяу» и сердечки, после 25 секунд покоя кот засыпает, а место, куда его положили, запоминается между запусками.
- **Переходы между вкладками** — панель мягко появляется при смене вкладки (*Внешний вид → Motion → Transitions*).
- **Иконка приложения** — маскот вместо логотипа OpenCode в сборках для Windows и Linux.
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

## Сборка релиза

Версия форка задаётся при сборке, поэтому `package.json` остаются на версии апстрима. Команды для PowerShell:

```powershell
cd packages\cli
$env:OPENCODE_CHANNEL="prod"; $env:OPENCODE_VERSION="1.0.0"; $env:OPENCODE_TARGET="windows-x64-baseline"
bun run script/build.ts --skip-install

cd ..\desktop
$env:OPENCODE_TARGET="windows-x64"
bun run build
bun run pack
```

`pack` кладёт распакованное приложение в `dist\desktop\app`. Установщик собирается из копии этого каталога вне `dist`, потому что следующий `pack` очищает `dist\desktop`:

```powershell
Copy-Item -Recurse ..\..\dist\desktop\app $env:TEMP\openok-app
$env:OPENCODE_DESKTOP_APP="$env:TEMP\openok-app"
bun run pack
```

Готовый установщик — `dist\desktop\OpenOK-win-x64.exe`. Прод-сборка ставится как отдельное приложение `OpenOK` (app id `io.github.ilyshaxoroshi.openok`) и обновляется с GitHub-релизов форка.

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
