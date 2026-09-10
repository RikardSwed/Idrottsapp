# Flex – projektdokumentation

Senast uppdaterad: 9 september 2026  
Aktuell version: **0.7.1 – Navigation Space**

## 1. Produktvision

Flex ska bli en lättanvänd träningsapp för webben och iPhone. Användaren ska kunna hitta övningar även när samma rörelse har olika namn på olika språk eller inom olika träningsformer.

Den långsiktiga produkten ska:

- innehålla ett stort övningsbibliotek;
- stödja svenska och engelska samtidigt samt fler språk senare;
- kunna visa alternativa namn, variationer och enklare eller svårare utföranden;
- låta användaren navigera efter kategori, muskelgrupp, kroppsposition och träningssammanhang;
- ge försiktiga, allmänna förslag utifrån smärta, stelhet eller upplevd svaghet utan att ställa diagnos;
- låta användaren bygga egna träningsprogram;
- fungera bra som mobil webbapp och senare paketeras med Capacitor och Xcode.

## 2. Nuvarande produkt

Version 0.7.1 innehåller fem appskärmar:

1. **Hem** – introduktion, genvägar och användarens program.
2. **Utforska** – sökning, kategorier, bild- eller listvy och hela övningsbanken.
3. **Program** – skapa, redigera och ta bort egna träningsprogram.
4. **Hjälp** – rekommendationer utifrån smärta/stelhet eller önskat styrkeområde.
5. **Profil/Inställningar** – språk, versionsnummer och versionshistorik.

Bottennavigationen visar de fyra primära destinationerna Hem, Utforska, Program och Hjälp. Profil/Inställningar nås via RM-knappen i toppfältet, vilket ger huvudvalen större tryckytor utan att ta bort någon skärm.

Övningsbanken innehåller 65 grundövningar. Den täcker bland annat styrka, rörlighet, yoga, Pilates, Qi gong, Tai chi, ögon, nacke, händer, fötter, hållning, ansikte, stretching, Pilatesboll och Pilatesrulle.

## 3. Filer och ansvar

### `index.html`

Appens samtliga skärmar och dialoger. Det är en single-page app: navigationen byter synlig sektion i stället för att ladda separata HTML-sidor.

### `css/style.css`

All visuell form, responsivitet, kort, dialoger, bottennavigation, programbyggare och inställningar. Filen har vuxit organiskt och bör delas upp i mindre filer när nästa större arkitekturändring görs.

### `js/app.js`

Det ursprungliga övningsbiblioteket och logik för:

- språk;
- sökning och filter;
- kort- och listvy;
- favoriter;
- övningsdetaljer;
- alternativa namn;
- variationer;
- relaterade övningar;
- problemområden och styrkerekommendationer.

### `js/exercise-data.js`

52 senare tillagda övningar utan bilder. De läggs till i `globalThis.flexAdditionalExercises` och slås samman med grunddata i `app.js`.

### `js/navigation.js`

Logik för:

- de fem appskärmarna och URL-hashar;
- versionshistorik;
- programbyggaren;
- lagring, redigering och borttagning av program;
- visning av program på hemskärmen.

### `assets/exercises/`

39 PNG-bilder: tre demonstrationssteg för 13 bildsatta övningar. Mappen är cirka 23 MB och står för nästan hela projektstorleken.

### `assets/icons/`

Flex gröna appidentitet: en högupplöst källbild samt PNG-versioner för webbläsarikon, iPhone-hemskärm och PWA-manifest. Appikonen använder mörkgrönt och mintgrönt från appens befintliga färgpalett. Ikonfilerna är separata från träningsbilderna och påverkar inte beslutet om framtida illustrationsformat.

### `manifest.webmanifest`

Grundläggande metadata för installation som fristående webbapp.

### Startscen

Startscenen är ett lättviktigt HTML/CSS-lager i `index.html` och använder den befintliga appikonen. `navigation.js` tonar bort lagret efter att sidan har laddats och har en säker tidsgräns så att scenen aldrig blockerar appen permanent. Lösningen kräver inga enhetsspecifika startbilder och respekterar användarens inställning för minskad rörelse.

## 4. Datamodell för övningar

En normaliserad övning använder ungefär följande fält:

```js
{
  id: "unik-slug",
  sv: "Svenskt namn",
  en: "English name",
  aliases: ["Alternativt namn"],
  cat: "Kategori",
  level: "Nybörjare",
  time: "5–10 min",
  muscles: ["Bål", "Rygg"],
  position: "Ryggläge",
  issues: ["Ländrygg"],
  weaknesses: ["Bål"],
  descSv: "Beskrivning på svenska.",
  descEn: "Description in English.",
  stepsSv: ["Steg ett", "Steg två"],
  stepsEn: ["Step one", "Step two"],
  variations: ["Svenskt namn · English name"],
  images: [],
  image: null
}
```

Nya övningar utan bild ska ha `images: []` och `image: null`. Lägg inte in en bild från en annan övning som platshållare.

## 5. Lokal lagring

Flex använder webbläsarens `localStorage`:

| Nyckel | Innehåll |
|---|---|
| `flex-language` | `both`, `sv` eller `en` |
| `flex-view` | `cards` eller `list` |
| `flex-saved` | Lista med sparade övnings-id:n |
| `flex-programs` | Användarens egna träningsprogram |

Informationen synkroniseras inte mellan enheter och försvinner om webbläsarens lokala data rensas. En framtida version behöver en databas eller iCloud-lösning om användaren ska kunna byta enhet.

## 6. Bilder och appstorlek

Nuvarande 39 PNG-bilder väger tillsammans cirka 23 MB, ungefär 0,59 MB per bild eller 1,77 MB per övning med tre steg.

Den senaste thumbnail-ändringen förändrade endast hur bilden visas i CSS. Den komprimerade inte filerna.

Ungefärlig storlek med nuvarande PNG-metod:

- 65 bildsatta övningar: cirka 115 MB;
- 100 bildsatta övningar: cirka 177 MB;
- 500 bildsatta övningar: cirka 885 MB;
- 1 000 bildsatta övningar: cirka 1,77 GB.

Rekommenderad riktning innan fler bilder skapas:

1. Prova samma övning i fyra format: nuvarande PNG, WebP, SVG-illustration och återanvändbar kropp/pose-data.
2. Jämför tydlighet, tillgänglighet, filstorlek och arbetskostnad.
3. Välj ett huvudformat och dokumentera exakta gränser för dimensioner och filstorlek.
4. För ett mycket stort bibliotek: lagra media externt, hämta vid behov och cacha lokalt.

## 7. Medicinsk avgränsning

Flex är ett tränings- och informationsverktyg, inte en diagnos- eller behandlingsapp.

- Skriv inte att en övning botar ett problem.
- Rekommendationer ska beskrivas som allmänna och försiktiga förslag.
- Visa stoppregler vid ny eller kraftig smärta, yrsel, domningar eller tydlig svullnad.
- Uppmana till vårdkontakt vid allvarliga, nytillkomna eller ihållande besvär.
- Medicinskt specifika rekommendationer ska granskas mot tillförlitliga vårdkällor.

## 8. Versionshantering

Aktuell version ska visas:

- på hemskärmen;
- under Inställningar;
- högst upp i denna dokumentation;
- i versionshistoriken i `js/navigation.js`.

Vid varje uppdatering ska svaret i Codex-tråden tydligt ange versionsnummer och versionsnamn. Använd semantisk versionering:

- patch, exempelvis `0.5.1`, för små rättningar;
- minor, exempelvis `0.6.0`, för nya funktioner;
- major, exempelvis `1.0.0`, när den första stabila produkten är klar.

## 9. Arbetssätt

- Bevara mappstrukturen `Flex/`.
- Kontrollera befintliga filer innan ändringar görs.
- Använd inga nya bildgenerationer utan att användaren uttryckligen godkänner format och uppskattad lagringskostnad.
- Testa JavaScript-syntax efter ändringar.
- Kontrollera mobil layout och iPhone safe areas.
- Behåll svenska och engelska i all ny användarsynlig information.
- Bevara användarens befintliga filer och lokala dataformat.
- Lägg inte till ramverk eller byggsystem utan att först förklara nyttan och migrationskostnaden.

## 10. Kända tekniska förbättringar

- Dela upp den stora CSS-filen i komponent- eller skärmvisa filer.
- Flytta alla övningar till en enda konsekvent datakälla.
- Lägg till automatiska tester för sökning, navigation och programlagring.
- Lägg till stabil validering och migrationsversion för `localStorage`.
- Förbättra tillgänglighet, fokusordning och skärmläsarstöd.
- Lägg till PWA-ikoner och service worker om appen ska fungera helt offline.
- Bestäm bildstrategi innan fler medier produceras.
- Utvärdera Capacitor först när webbappen har stabil navigation och datamodell.

## 11. Versionshistorik

- **0.7.1 – Navigation Space:** Profil flyttad bort från bottennavigationen; de fyra huvudvalen har fått mer utrymme och Inställningar nås via RM-knappen.
- **0.7.0 – Launch Experience:** en tvåspråkig startscen med Flex-logotypen, mjuk övergång och stöd för minskad rörelse.
- **0.6.1 – Card & Profile Polish:** övningskort visar hela demonstrationsbilden med extra luft och profilmarkeringarna visar initialerna RM.
- **0.6.0 – App Identity:** ny grön Flex-logotyp, favicon samt hemskärmsikoner för iPhone och installerbar webbapp.
- **0.1.0 – First Flex:** tvåspråkigt bibliotek, sökning, filter, favoriter och mobilvy.
- **0.2.0 – Exercise Expansion:** fler kategorier, demonstrationsbilder, listvy och alternativa namn.
- **0.3.0 – Connected Movement:** klickbara variationer, relaterade övningar och förbättrade thumbnails.
- **0.4.0 – The Bigger Library:** 52 nya övningar och rekommendationer efter problemområde.
- **0.5.0 – Navigation & Programs:** fem appskärmar, inställningar, versionshistorik och egna program.
