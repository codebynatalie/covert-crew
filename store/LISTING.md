# Store listing text (copy & paste)

The same text works for the Chrome Web Store and Microsoft Edge Add-ons.

---

## Name

```
Covert Crew in Tab
```

(It must match the `name` in `manifest.json` exactly.)

## Short description / summary (max 132 characters)

```
A tiny family of secret agents and their dachshund live in your browser: they walk, climb, react to your searches and cheer you on.
```

## Category

- **Chrome Web Store:** Lifestyle → **Fun** (or the closest "Fun / Entertainment" option shown)
- **Edge Add-ons:** **Entertainment**

## Language

English

## Detailed description

```
Meet the Covert Crew: a tiny family of secret agents (and their very good dog) who move into your browser tabs and keep you company while you browse, study and work.

WHO'S IN THE CREW
• Agent Victor: a calm secret agent in a fedora and trench coat. He reads the paper, sneaks around in his shades and scales walls.
• Goldie: a cheerful inventor with goggles and a trusty wrench. She tinkers, trains her kicks, and is the best climber in the family.
• Pip: a curious junior spy in a yellow raincoat who runs, dances, hops around and wants in on every conversation.
• Biscuit: a loyal dachshund who sniffs around, chases his tail, follows Pip everywhere, chases your cursor and naps a lot.

THEY LIVE ON YOUR PAGES
The crew walks along the bottom of your window, climbs up the sides, and jumps onto images, headings, buttons and cards. When you scroll, they ride along on whatever they're standing on.

THEY REACT TO YOUR SEARCHES
Search for pizza and everyone gets hungry. Search for homework and Pip panics. Search for something spooky and Pip hides behind Goldie. Music starts a dance party, and there are reactions for weather, coffee, pets, sports, movies, science and more. It works on popular search engines, YouTube, Wikipedia and most site search boxes.

THEY CHEER YOU ON
While you type, the crew sends little emotes and encouragement. Step away for a couple of minutes and they doze off, then wake up when you come back.

PLAY WITH THEM
• Drag to pick someone up, then drop or toss them anywhere on the page
• Click to poke them, double-click for a special trick
• Wiggle your cursor over them to give head pats
• Watch them chat, high-five, hug and play with each other

MAKE THEM YOURS
Rename any character, choose who's home, change their size, or upload your own picture for any of them. You can hide the crew on specific websites, or call them together with Gather, Dance Party, Say Hi and Nap Time buttons.

PRIVATE BY DESIGN
Everything happens on your computer. Covert Crew makes no network requests and has no accounts, ads or tracking. It never reads what you type; it only counts keystrokes to know when you're busy. Your settings stay in your browser.
```

(About 2,100 characters. Edge needs at least 250.)

## Search terms / keywords (Edge only, optional, up to 7)

```
desktop pet, virtual pet, cute, characters, animation, fun, companion
```

---

# Privacy tab answers

## Single purpose

```
Covert Crew adds a small family of animated companion characters to web pages. They walk, climb, react to what the user searches for, and respond to the cursor.
```

## Permission justifications

**storage**
```
Saves the user's settings on their own computer: which characters are shown, their names and size, which features are turned on, sites where the crew is hidden, and any custom character pictures the user uploads.
```

**activeTab**
```
When the user opens the extension's popup, it reads the current tab's site address so the user can hide the characters on that site, and sends the popup's buttons (Gather, Dance Party, Say Hi, Nap Time) to that tab.
```

**Host permissions** (the content script runs on `<all_urls>`)
```
The characters are drawn on every page the user visits, so the content script must run on all sites. It reads the page's layout so the characters can stand on and climb page elements, and reads the search term from search-results page addresses so the characters can react to it. All of this happens locally. No page content or browsing data is stored or sent anywhere.
```

**Remote code**
```
No, I am not using remote code. All JavaScript is included in the extension package.
```

## Data usage

- **Chrome:** leave every "data collected" box **unchecked**. The extension doesn't collect or transmit any user data; anything it looks at is processed on the device and never leaves it. Then tick all three certifications:
  - I do not sell or transfer user data to third parties, outside of the approved use cases
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose
  - I do not use or transfer user data to determine creditworthiness or for lending purposes
- **Edge:** answer that the extension doesn't collect or transmit personal information, and certify the same.

## Privacy policy URL

```
https://github.com/codebynatalie/covert-crew/blob/main/PRIVACY.md
```

## Support / homepage URL (optional)

```
https://github.com/codebynatalie/covert-crew
```

---

# Notes for reviewers (Chrome "Test instructions", optional)

```
No account or setup is needed. After installing, open any normal web page (for example https://en.wikipedia.org). Four characters drop in and start walking at the bottom of the window. Try dragging one with the mouse, clicking one, or searching for "pizza" on a search engine to see a reaction. The toolbar popup has on/off switches and Gather / Party / Say hi / Nap buttons.
```
