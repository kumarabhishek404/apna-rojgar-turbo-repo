# Create the Apna Rojgar Gem

This folder is for a **Gemini Gem** (gemini.google.com → Gems → New Gem).

It is not the Spark skill. Do not upload `apna-rojgar-ai-skills` here. That folder is only for Gemini Spark.

A Gem has four fields. Fill them like this.

## 1. Name

```text
Apna Rojgar
```

## 2. Description

```text
Writes Apna Rojgar messages, captions, reel scripts, image prompts, and video prompts for workers, employers, and mediators. Uses only confirmed brand and product facts.
```

## 3. Instructions

Open `instructions.txt` in this folder. Copy everything in that file. Paste it into the Gem **Instructions** box.

Do not click “Use Gemini to re-write instructions”. That rewrite drops Apna Rojgar rules.

## 4. Knowledge

Click **Add files** and upload these ten files. A Gem allows 10 knowledge files, so do not add anything else.

From `knowledge`:

1. `knowledge/01-brand.md`
2. `knowledge/02-company.md`
3. `knowledge/03-product.md`
4. `knowledge/04-messaging.md`
5. `knowledge/05-reels-and-campaigns.md`
6. `knowledge/06-image-and-video.md`

From `images`:

7. `images/logo.png` — official circular logo
8. `images/screenshot-find-work.png` — काम और मज़दूर खोजें
9. `images/screenshot-job-detail.png` — काम की जानकारी
10. `images/screenshot-bookings.png` — सभी बुकिंग

Do not upload this HOW_TO_CREATE file. Do not upload the Spark skills folder. Do not upload any other logo. `images/logo.png` is the only logo.

## 5. Other settings

- **Default tool:** No default tool. The Gem should write first, then make an image or video only when you ask.
- **Disable Knowledge Citations:** turn this on so captions and scripts are not filled with file names.

## 6. Save

Preview on the right with a real request, for example: “Instagram caption for workers in a village, Hindi.” Then click **Save**. Preview does not save the Gem by itself.

## What to ask the Gem

- “WhatsApp message for employers: posting work is free.”
- “15 second reel script for a labour chowk, Hindi.”
- “Image prompt for a poster: काम चाहिए?”
- “Video prompt, 15 seconds, worker finding work on the phone.”
