# Thanksgiving Gratitude Display System

This is a web application for displaying gratitude messages and signatures during Thanksgiving, with data import from Excel and lottery features.

## Features

1. **Data Import**: Upload Excel files to import gratitude records.
2. **Gratitude Display**: Dynamic floating display of gratitude items.
3. **Gratitude Lottery**: Random selection of gratitude items with animations and music.
4. **Signature Wall**: Add signatures via form (simplified from WeChat QR).
5. **Signature Display**: Scrolling display of signatures.
6. **Signature Lottery**: Random selection of signatures with animations and music.

## Setup

1. Install MongoDB and start it.
2. In the backend folder: `npm install` then `npm start`.
3. Open frontend/index.html in a browser.

## Assets

Place the following files in frontend/assets/:
- thanksgiving-bg.jpg: Background image for Thanksgiving theme.
- thanksgiving-music.mp3: Background music.
- lottery-music.mp3: Music for lottery animations.

## Notes

- WeChat QR scanning is simulated with a form for simplicity.
- Ensure CORS is enabled for frontend-backend communication.