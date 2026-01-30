# Audio Setup for Match Completion

To add celebration music (Sri Lankan papare style), place an audio file at:

```
frontend/public/celebration.mp3
```

## How to add the audio file:

1. Find a Sri Lankan papare/celebration music file (MP3 format)
2. Place it in the `frontend/public` folder
3. Rename it to `celebration.mp3`

## Alternative - Use Online Audio:

You can also modify `MatchCompletionModal.js` to use an online audio URL:

```javascript
const audio = new Audio('https://example.com/celebration-music.mp3');
```

## Free Music Resources:

- YouTube Audio Library
- Pixabay
- Freesound.org

Search for "celebration music" or "victory fanfare"
