# Compressly website

Static website for [Compressly](https://github.com/MinimackStudios/compressly).

## Pages

- `index.html`: Compressly 2.0 overview and feature highlights
- `smart-compression.html`: dedicated Smart Compression product page
- `download.html`: Windows, Apple Silicon, and Intel Mac downloads
- `about.html`: project background, technology, and open-source information

The download page reads the latest GitHub release in the browser and matches assets by platform and architecture. Apple Silicon downloads require an asset filename containing `arm64` or `aarch64`; if a matching asset is unavailable, the button opens the latest release page instead of downloading an incompatible Intel build.
