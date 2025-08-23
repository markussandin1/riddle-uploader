# Riddle Quiz Uploader

En enkel Next.js-applikation för att ladda upp quiz JSON-filer till Riddle API.

## Funktioner

- 📁 Ladda upp JSON-fil
- 📝 Klistra in JSON direkt i textfält
- ✅ Validering av quiz-struktur
- 🚀 Direkt publicering till Riddle
- 📊 Visar resultat med UUID och länk till quiz

## Installation

1. Klona eller ladda ner projektet
2. Installera dependencies:
```bash
npm install
```

3. Skapa `.env.local` fil med din Riddle API-nyckel:
```
RIDDLE_API_KEY=your_riddle_api_key_here
```

4. Starta utvecklingsservern:
```bash
npm run dev
```

5. Öppna [http://localhost:3000](http://localhost:3000)

## Deployment på Vercel

1. Pusha koden till GitHub
2. Gå till [vercel.com](https://vercel.com) och logga in
3. Importera ditt GitHub repository
4. Lägg till environment variable:
   - `RIDDLE_API_KEY` = din Riddle API-nyckel
5. Deploy!

### Alternativ deployment via CLI

```bash
# Installera Vercel CLI
npm i -g vercel

# Logga in
vercel login

# Deploy
vercel

# Lägg till environment variable
vercel env add RIDDLE_API_KEY
```

## JSON Format

Applikationen förväntar sig JSON i Riddle API-format:

```json
{
  "type": "Quiz",
  "publish": true,
  "build": {
    "title": "Mitt Quiz",
    "description": "Quiz beskrivning",
    "blocks": [
      {
        "title": "Fråga 1?",
        "type": "SingleChoice",
        "items": {
          "Rätt svar": true,
          "Fel svar 1": false,
          "Fel svar 2": false
        }
      }
    ],
    "results": [
      {
        "title": "Bra jobbat!",
        "description": "Du klarade quizet!",
        "minPercentage": 0,
        "maxPercentage": 100
      }
    ]
  }
}
```

## Felhantering

- Validerar JSON-format
- Kontrollerar required fields
- Visar Riddle API-fel med detaljer
- Hanterar validation errors från Riddle

## Säkerhet

- API-nyckel lagras säkert som environment variable
- Ingen API-nyckel exponeras till frontend
- Server-side validation av alla requests