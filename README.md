# Assistant for Mom

`Assistant for Mom` is a guided AI coach designed for Christina, an older adult working in healthcare who wants practical help, clearer prompting, and safer habits around misinformation.

Instead of opening with a blank chat box, the app offers suggested tasks such as:

- organizing information
- writing emails
- checking whether something online is true
- learning how to use AI for a task

The current examples are tuned toward healthcare-office and administrative workflows while avoiding unsafe medical authority.

The homepage is designed as a one-page assistant desk rather than a blank chat. It includes:

- a personalized intro
- guided action cards
- a visible running conversation
- a Windows shortcuts cheat sheet
- a trusted tools panel
- an always-visible weekend ideas panel
- a collapsible rotating Cat of the Day card that opens by default

When the user picks one, the assistant explains what details would help and why, then guides them into a better prompt without sounding rude, technical, or sycophantic.

## What is included

- Next.js App Router scaffold
- guided prompt cards on the homepage
- browser-stored personalization profile
- server-side `/api/chat` route using the OpenAI Responses API
- a system prompt designed for warmth, clarity, anti-sycophancy, and gentle correction

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`.
5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `OPENAI_API_KEY`: required for chat replies
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`

## Product direction for the next iteration

- add proper user accounts and server-side memory
- add source-backed fact checking with citations for current claims
- support file uploads for letters, notes, and forms
- add a "show me why this prompt works" teaching mode
- add analytics or evaluations around misinformation handling
- replace placeholder work context with Christina's real resume and day-to-day responsibilities once confirmed

## Notes

This workspace did not have `node` or `npm` available when the scaffold was created, so dependencies have not been installed and the app has not been run locally yet.
