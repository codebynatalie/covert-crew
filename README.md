# Covert Crew in Tab

A Chrome extension that lets a little family of secret agents and their dog live in your browser.

| | Who | Personality |
|---|---|---|
| 🕶️ | **Agent Victor** | A calm secret agent in a fedora and trench coat. He reads the paper, sneaks around in his shades and climbs walls. |
| 🔧 | **Goldie** | A cheerful inventor. She tinkers with her wrench, practices kicks and is the best climber. |
| ✨ | **Pip** | A curious junior spy. Pip runs, dances, hops around and wants to be part of every conversation. |
| 🐾 | **Biscuit** | A dachshund. He sniffs, wags, chases his tail, follows Pip around, chases your cursor and naps a lot. |

You can rename any of them and give them your own artwork (see below).

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder (`covert-crew`).
4. Pin the extension with the 🧩 puzzle icon, then reload any tabs that were already open.

## What they do

- **Live on the page.** They walk along the bottom of the window, climb up the sides, hang there, then climb down or let go. They also jump onto images, headings, buttons and cards and ride them as you scroll.
- **Interact with each other.** Victor and Goldie chat and get shy. Pip high-fives Victor and hugs Goldie. Everyone pets Biscuit, and Biscuit plays with Pip.
- **React to your searches.** This works on Google, Bing, DuckDuckGo, YouTube, Yahoo, Ecosia, Brave, Wikipedia and most site search boxes. Some examples:
  - *pizza, cake, snacks* make them all hungry, and Biscuit grabs a bone.
  - *spy, mystery, mission* send Victor sneaking.
  - *homework, math, exam* make Pip panic.
  - *horror, ghost* scare everyone, and Pip hides behind Goldie.
  - *love, wedding* make Victor and Goldie blush.
  - *gym, karate* start Goldie's training.
  - *movies, games* make Pip dance.
  - *music, party* start a dance party.
  - Weather, coffee, money, cats, dogs, flowers, robots and more each get their own reaction.
- **Cheer you on.** While you type, they send little emotes and encouragement. If you go idle for 2 minutes they fall asleep, and they wake up when you come back.
- **Respond to your cursor:**
  - **Drag** to pick someone up. Toss them and they bounce, and a hard landing makes them dizzy. Drop a climber near the edge of the window and they grab the wall.
  - **Click** to poke them.
  - **Double-click** for a trick.
  - **Wiggle the cursor back and forth** over them to pet them.
- **Popup controls:** turn the crew on or off, choose who's home, rename them, change their size, hide them on the current site, and send commands (📣 Gather, 🎉 Party, 👋 Say hi, 💤 Nap time).

## Use your own artwork

In the popup, click 🖼️ next to a character and pick an image. A PNG with a transparent background works best. That picture replaces the drawn character, and an emoji badge shows their mood. Click ↺ to go back to the original look. Images are shrunk and stored only in Chrome's local extension storage.

## Privacy

Everything runs locally. The extension makes no network requests. It reads the search term from the URL (or from a search box when you press Enter) only to pick a reaction, and it never stores it. For typing, it counts keystrokes and never reads what you type.

## Limits

Chrome doesn't let extensions run on `chrome://` pages, the New Tab page or the Chrome Web Store, so the crew can't appear there.

## Development

`dev/demo.html` fakes the Chrome APIs so you can test the content script in a normal page. To try it:

1. Run `dev/serve.ps1` (a tiny PowerShell web server).
2. Open http://localhost:8765/dev/demo.html.

| File | What it does |
|---|---|
| `content/art.js` | The character SVGs, with separate parts for limbs and faces so they can be animated |
| `content/styles.js` | Animations and expressions |
| `content/engine.js` | Behavior, physics, interactions and reactions |
| `popup/` | The settings popup |

## Publishing

Everything needed for the Chrome Web Store and Microsoft Edge Add-ons is in [`store/`](store/README.md): the packaging script, listing text, screenshots, promo art and a step-by-step checklist. The privacy policy is [PRIVACY.md](PRIVACY.md).
