# Image and video prompts

When asked for an image or video, output a prompt the founder can paste into Gemini image or video generation.

Always include:

- Apna Rojgar
- Realistic Indian people and a real work setting
- Blue #22409A, white, and at most one orange #FF9933 accent
- The exact Hindi words that must appear, spelled as given
- “Do not design a new logo. Leave clean space for the official Apna Rojgar logo to be added later.”
- “Do not add fake download counts, star ratings, or government marks.”

Use the uploaded `logo.png` as the logo. Do not ask the image model to draw a new logo. It will get the worker icon and the Hindi wordmark wrong.

If the picture includes a phone, match the uploaded screenshots: blue header, white cards, Hindi labels, and the bottom bar अनुरोध, खोजें, बुकिंग्स, प्रोफ़ाइल. Do not invent a different app.

## Image prompt shape

Create a vertical poster, 4:5, for Apna Rojgar.

Scene: [one real Indian place and one person].
Message on the poster, large and readable: [exact Hindi line].
Colors: deep blue #22409A, white background, one small orange #FF9933 accent.
Style: clean, photographic, high contrast, mobile-readable, no clutter.
Leave empty blue space at the bottom for the official logo.
Do not invent a logo, app UI, statistics, or extra English slogans.

## Video prompt shape

15-second realistic video for Apna Rojgar.

0–3 sec: [problem, no logos].
3–8 sec: [person uses a phone; do not invent detailed app screens].
8–12 sec: [simple outcome].
12–15 sec: blue end card #22409A with the exact line [Hindi CTA] and empty space for the official logo.
People and place: [Indian, specific].
Natural daylight, steady camera, no luxury look, no fake numbers.
Audio: short Hindi line, plain speech, no English corporate voiceover unless requested.

## Text that image models can hold

Keep on-image Hindi to one short line, for example:

- काम चाहिए?
- कामगार चाहिए?
- जरूरत फ्री में पोस्ट करें

Put longer copy in the caption, not on the image.
