# CODECAMP — Python Learning PWA

This package contains the 12-chapter, 72-unit CODECAMP learning prototype, with a local Log In / Sign Up screen.

## Files

- `index.html` — app pages and sign-in / sign-up form
- `style.css` — visual styles
- `app.js` — account prototype, progress, points, lessons and quizzes
- `course-data.js` — 12 chapters, 72 units and their practice questions
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA installation and offline cache files

## Deploy on GitHub Pages

Upload all files in this folder to the repository's root folder (the same level as the repository's existing `index.html`), then commit the changes. Keep all eight files together.

## Account limitation — read this

The Log In / Sign Up flow is a **device-local prototype**. Account records and learning progress are saved in the current browser's local storage. It does not use a server, does not verify email ownership, and does not sync accounts or progress between devices. Clearing the browser's site data can remove the local accounts and progress. Do not use a password that you use for important accounts elsewhere.

A real multi-device account system needs a secure authentication backend and a database (for example, Firebase Authentication + Firestore), along with appropriate security rules and privacy handling. This static GitHub Pages prototype does not include those services.

## Premium

The Premium panel is only a concept preview. Real payments or subscriptions are not enabled.
