# CODECAMP PWA starter

This is a phone-friendly PWA starter. It includes a small Python learning path, quizzes, local point/progress storage, a basic print() playground demonstration, and a service worker.

## Important limitations
- Progress is currently stored in this browser on this device only (localStorage). It is NOT synced between devices and is not a secure account system.
- Sign-in, Guest account linking, Firestore, server-side points validation, AI tutor, real Python execution, leaderboard, verified achievements, and Premium billing are NOT connected in this starter.
- The playground only demonstrates `print("text")`; it does not execute arbitrary Python.
- The RM10/month Premium price is a proposed display only. No payment is collected.

## Publish as a PWA
1. Upload all files in this folder to a GitHub repository (or another static HTTPS host).
2. Enable GitHub Pages in repository Settings > Pages, or use another HTTPS hosting provider.
3. Open the deployed HTTPS URL on Android Chrome.
4. Use Chrome menu > Install app / Add to Home screen (wording may vary).

## Package as Android app
After the PWA is publicly hosted on HTTPS and the manifest is accessible, use PWABuilder's web interface to inspect/package it for Android. For a Trusted Web Activity, a valid Digital Asset Links file and signing key are required. Keep the signing key private and backed up.

Official docs: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
PWABuilder: https://www.pwabuilder.com/
