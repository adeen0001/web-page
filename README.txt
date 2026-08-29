THE PERFECT DAY — setup instructions
=====================================

1. Extract the zip
2. Open the "perfect-day-website" folder in VS Code
3. Right click index.html > "Open with Live Server"
   (or just double-click index.html to open it in your browser)

That's it, no npm install, no build step, nothing to break.

Notes:
- The corkboard background is done entirely in CSS (no image needed),
  so the page loads instantly and there's nothing that can 404.
  If you'd rather use a real photo texture, drop a file into
  assets/ and swap the background-image rule for .corkboard
  in css/style.css.
- Sticky notes, mood picker and quote button all save to
  localStorage, so refreshing the page won't lose anything —
  but clearing your browser data will.
- Everything's plain HTML/CSS/JS, no frameworks, no build tools.

Made with ♡ for better days.
