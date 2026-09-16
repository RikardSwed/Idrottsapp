# Flex illustrationspilot

Pilotprovet undersöker en linjebaserad SVG-modell för instruktionsbilder. Det är fristående från appen och ändrar inte övningsbiblioteket.

`flat-vector-gender-reference.png` är den valda visuella stilreferensen. Den visar en kvinnlig och en manlig figur i samma platta illustrationssystem. Filen är endast en designreferens och ska inte användas direkt som appbild eftersom rasterfilen ensam är cirka 1,1 MB.

Öppna `index.html` för att se samtliga sex exempel. På GitHub kan varje SVG även öppnas separat.

## Faktisk storlek

| Fil | Storlek |
|---|---:|
| `squat.svg` | 913 byte |
| `bird-dog.svg` | 940 byte |
| `bridge.svg` | 979 byte |
| `wall-slide.svg` | 1 083 byte |
| `neck-rotation.svg` | 1 112 byte |
| `tandem-balance.svg` | 1 127 byte |
| **Totalt** | **6 154 byte** |

I samma detaljnivå skulle 200 övningar motsvara ungefär 0,2 MB rå SVG-data. Verkliga produktionsbilder kan bli större när pilar, redskap, anatomiska detaljer och fler rörelsesteg läggs till. Ett försiktigare produktionsmål är 5–20 KB per övning, alltså cirka 1–4 MB för 200 övningar.

## Beslut som återstår

- figurens anatomiska detaljnivå;
- om könsneutral eller flera valbara figurer ska användas;
- när riktningspilar och kontaktmarkeringar behövs;
- om tre steg räcker för alla övningar;
- hur bilderna kvalitetssäkras biomekaniskt;
- om SVG-filer ska lagras separat eller genereras från delade kroppsdelar och positionsdata.

## Figurfördelning

Produktionssystemet ska fördela kvinnlig och manlig figur deterministiskt efter övningens ID. Målet är så nära 50/50 som bibliotekets udda antal tillåter. Fördelningen får inte slumpas vid sidladdning, eftersom samma övning då skulle byta figur mellan besök.
