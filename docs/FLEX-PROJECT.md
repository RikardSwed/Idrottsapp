# Flex – projektdokumentation

Senast uppdaterad: 15 september 2026  
Aktuell version: **0.15.0 – Swipeable Illustration Steps**

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

Version 0.15.0 innehåller sex appskärmar:

1. **Hem** – introduktion, genvägar och användarens program.
2. **Utforska** – textsökning, kategorier, stegvis guidad sökning, bild- eller listvy och hela övningsbanken.
3. **Program** – använd färdiga fokusprogram, filtrera övningar efter behov eller skapa, redigera och ta bort egna träningsprogram.
4. **Studera** – teoretisk kunskapsträning om övningsnamn, fokusområden och val av övning.
5. **Min träning** – logga genomförda pass, repetitioner, set, vikt och anteckningar samt skapa personliga mål och följa progression.
6. **Profil/Inställningar** – språk, versionsnummer och versionshistorik.

Bottennavigationen visar de fyra primära destinationerna Hem, Utforska, Program och Studera. Profil/Inställningar nås via RM-knappen i toppfältet. Det tidigare Hjälp-innehållet är integrerat i den guidade sökningen under Utforska.

Den guidade sökningen börjar med ett perspektiv: smärta/stelhet, upplevd svaghet, hållning, rörlighet, balans/kontroll eller avslappning. Användaren väljer därefter område och får en filtrerad samling. Samma metadata och matchningsprincip används i programbyggarens behovsfilter. Rekommendationerna är fortsatt allmän information och inte diagnos eller behandling.

Study är en första lokal studiemiljö utan ny lagringsnyckel. Användaren väljer ämne och därefter ett av tre lägen: memorera svenska/engelska namn, identifiera fokusområde eller välja en övning för ett angivet område. Frågor skapas från den befintliga övningsdatan så att studiematerialet följer biblioteket.

Från övningens detaljvy finns en Studera-knapp. Den öppnar Studera med den valda övningen som första fråga och upp till nio närliggande övningar med gemensam muskelgrupp eller kategori som fortsatt frågeunderlag. Användaren väljer sedan ett av de tre befintliga lägena. Inga nya lagringsnycklar eller övningsbilder tillkommer.

Färdiga program finns för hela kroppen, rygg, ben och säte, träning utan redskap samt träning med redskap. Lätt, medel och utmanande nivå räknar om set och repetitioner direkt. Färdiga program ligger i appkoden och sparas inte i `localStorage` förrän användaren väljer att skapa en egen kopia. Från en övningsdetalj kan övningen läggas till i ett befintligt eget program eller i en ny kopia av ett färdigt program.

Tre färdiga uppvärmningsprogram kompletterar styrkeprogrammen: dynamisk helkroppsstart, mjuk rygg och axlar samt ben och höfter i gång. De använder samma inbyggda preset-modell och svårighetsval som övriga program.

Min träning nås från Hem, Program och Utforska. Genomförda pass sparas i `flex-workouts` med datum, programnamn, övnings-ID, set, repetitioner, vikt och anteckning. Mål sparas separat i `flex-goals` med text, valfritt måldatum och slutförd-status. Progression beräknas vid visning mot föregående registrerade resultat för samma övning. Befintliga lagringsformat ändras inte.

Övningsbanken innehåller 125 övningar. Den täcker bland annat styrka, rörlighet, yoga, Pilates, Qi gong, Tai chi, ögon, nacke, händer, fötter, hållning, ansikte, stretching, Pilatesboll och Pilatesrulle. Version 0.10.0 lägger särskild vikt vid bred täckning i den guidade sökningen: varje val ger flera relevanta övningar, inklusive kombinationer som hållning och höfter.

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
- guidad sökning och gemensam behovsmatchning för Utforska och Program.

### `js/exercise-data.js`

112 senare tillagda övningar utan bilder. De läggs till i `globalThis.flexAdditionalExercises` och slås samman med de 13 ursprungliga bildsatta övningarna i `app.js`.

### `js/navigation.js`

Logik för:

- de sex appskärmarna och URL-hashar;
- versionshistorik;
- programbyggaren;
- lagring, redigering och borttagning av program;
- visning av program på hemskärmen.
- Study-flöde, frågor, svar och återkoppling.

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
| `flex-programs` | Användarens egna träningsprogram; övningsposter kan även ha det bakåtkompatibla, valfria fältet `sets` |
| `flex-workouts` | Genomförda pass med datum, namn, anteckning och övningsresultat för set, repetitioner och vikt |
| `flex-goals` | Personliga mål med text, valfritt måldatum och slutförd-status |

Informationen synkroniseras inte mellan enheter och försvinner om webbläsarens lokala data rensas. En framtida version behöver en databas eller iCloud-lösning om användaren ska kunna byta enhet.

## 6. Bilder och appstorlek

Nuvarande 39 PNG-bilder väger tillsammans cirka 23 MB, ungefär 0,59 MB per bild eller 1,77 MB per övning med tre steg.

Den senaste thumbnail-ändringen förändrade endast hur bilden visas i CSS. Den komprimerade inte filerna.

### Illustrationspilot

Det första fristående SVG-provet visade att mycket små filer var möjliga men bedömdes vara visuellt för primitivt. Pilotmaterialet ligger därför utanför appmappen i `Flex-image-archive/` och kopplas inte till appens övningsdata.

Piloten visar att SVG-utrymme inte är den begränsande faktorn i den valda detaljnivån. Nästa beslut bör därför prioritera begriplighet, biomekanisk kvalitetssäkring, anatomisk detalj, pilar och redskap. Ett försiktigt produktionsmål är 5–20 KB per övning, motsvarande cirka 1–4 MB för 200 övningar.

Den platta illustrationsstilen är vald som fortsatt riktning. Stilreferenser och komprimeringstester ligger utanför appmappen i `Flex-image-archive/` och ska inte laddas upp tillsammans med appen. Figuren ska fördelas ungefär 50/50 mellan manlig och kvinnlig figur, och varje övning behåller samma figur.

Version 0.13.0 kopplar in den första produktionsserien: knäböj, fågelhund, höftlyft, underarmsglidning mot vägg, nackrotation och tandemstående. Serien har tre kvinnliga och tre manliga figurer och väger totalt 7 589 byte. SVG-filerna ersätter bildkällan endast för dessa sex övningar; övriga bilder och textkort fungerar som tidigare. Detalj- och relaterade vyer använder `object-fit: contain` för SVG så att trestegsbilderna inte beskärs.

Efter visuell granskning bedömdes SVG-serien vara för primitiv jämfört med den valda stilreferensen. Version 0.14.0 kopplade därför bort dessa SVG-filer och testade den polerade platta stilen som WebP och AVIF. WebP i 480 × 480 och kvalitet 82 valdes som standard.

Version 0.15.0 delar åter varje instruktion i tre separata 480 × 480 WebP-filer, så att användaren sveper sidledes mellan stegen precis som med de ursprungliga PNG-bilderna. Knäböj, fågelhund, höftlyft och underarmsglidning mot vägg har nya serier, två med kvinnlig och två med manlig figur. De tolv filerna är tillsammans 65 436 byte. Alla gamla pilot-, referens- och jämförelsebilder har flyttats utanför `Flex` till `Flex-image-archive/` och följer därför inte med när appmappen laddas upp.

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

- **0.15.0 – Swipeable Illustration Steps:** fyra övningar har vardera tre separata WebP-steg för sidscrollning; gamla pilotfiler har flyttats utanför appmappen.
- **0.14.0 – Compressed Illustration Test:** primitiva SVG-bilder bortkopplade, polerad platt stil jämförd som WebP och AVIF och ett cirka 13 KB stort 480-pixelsprov integrerat för knäböj.
- **0.13.0 – Inclusive Illustration System:** första sex platta SVG-instruktionerna integrerade, jämnt fördelade mellan kvinnlig och manlig figur och tillsammans cirka 7,6 KB.
- **0.12.0 – Personal Training Log:** tre uppvärmningsprogram, en personlig träningssida med pass- och mållagring samt jämförelser av repetitioner och vikt mot föregående registrering.
- **0.11.0 – Exercise Study:** den fjärde bottenknappen heter Studera; varje övningsdetalj har en Studera-knapp som startar ett fokuserat kunskapsläge utifrån den valda övningen och närliggande rörelser.
- **0.10.0 – Deep Exercise Library:** 60 nya tvåspråkiga övningar ger totalt 125. Metadata för problemområden och träningsbehov har breddats så att varje val i den guidade sökningen ger flera relevanta träffar, utan att nya bilder eller lagringsformat tillkommer.
- **0.9.0 – Guided Search & Study:** Hjälp integrerad som en stegvis guidad sökning i Utforska, behovsfilter tillagt i programbyggaren och en ny Study-flik med ämnesval och tre kunskapslägen.
- **0.8.1 – Explore Image Fit:** porträttbilder centreras i naturliga proportioner inom bildytan på Utforska-korten och får tydliga maxgränser för både bredd och höjd; övriga bildvyer påverkas inte.
- **0.8.0 – Programs & iPhone Polish:** färdiga fokusprogram med svårighetsval, direkt tillägg från övningsdetaljer samt förbättrad safe area, zoomkontroll, sidbredd och bildpassning på iPhone.
- **0.7.1 – Navigation Space:** Profil flyttad bort från bottennavigationen; de fyra huvudvalen har fått mer utrymme och Inställningar nås via RM-knappen.
- **0.7.0 – Launch Experience:** en tvåspråkig startscen med Flex-logotypen, mjuk övergång och stöd för minskad rörelse.
- **0.6.1 – Card & Profile Polish:** övningskort visar hela demonstrationsbilden med extra luft och profilmarkeringarna visar initialerna RM.
- **0.6.0 – App Identity:** ny grön Flex-logotyp, favicon samt hemskärmsikoner för iPhone och installerbar webbapp.
- **0.1.0 – First Flex:** tvåspråkigt bibliotek, sökning, filter, favoriter och mobilvy.
- **0.2.0 – Exercise Expansion:** fler kategorier, demonstrationsbilder, listvy och alternativa namn.
- **0.3.0 – Connected Movement:** klickbara variationer, relaterade övningar och förbättrade thumbnails.
- **0.4.0 – The Bigger Library:** 52 nya övningar och rekommendationer efter problemområde.
- **0.5.0 – Navigation & Programs:** fem appskärmar, inställningar, versionshistorik och egna program.
