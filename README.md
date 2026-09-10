# Flex

Flex är en mobilanpassad, tvåspråkig träningswebbapp. Målet är att skapa ett stort, lättnavigerat övningsbibliotek som senare kan paketeras som en iPhone-app med Capacitor och Xcode.

Aktuell version: **0.7.1 – Navigation Space**

## Öppna appen

Appen är byggd med vanlig HTML, CSS och JavaScript och har inget byggsteg. Starta en lokal webbserver i mappen ovanför `Flex` och öppna `/Flex/` i webbläsaren. Att dubbelklicka på `index.html` kan fungera, men en lokal webbserver är säkrare för testning.

## Viktiga dokument

- [Full projektdokumentation](docs/FLEX-PROJECT.md)
- [Handoff till en ny Codex-uppgift](docs/HANDOFF.md)

## Projektstruktur

```text
Flex/
├── index.html
├── manifest.webmanifest
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── exercise-data.js
│   └── navigation.js
├── assets/
│   ├── exercises/
│   └── icons/
└── docs/
```

Alla mappar utom systemfiler som `.DS_Store` ska följa med när projektet läggs på GitHub.
