# Signati – Web PDF Signer

A simple, elegant client-side application for signing PDF documents directly in your browser. No server uploads, no accounts — your documents never leave your device.

---

## Features

- **Upload & view PDFs** with multi-page navigation
- **Upload a signature image** (PNG / JPEG) and crop it before use
- **Drag & resize** the signature overlay to position it precisely on any page
- **Sign multiple pages** independently — each page retains its own signature placement
- **Download** the final signed PDF with the signature embedded
- **Dark / Light theme** toggle (persisted in `localStorage`)
- **Signature persistence** — your last-used signature is saved in `localStorage` so you don't have to re-upload it every time

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bundler | [Vite](https://vitejs.dev/) |
| PDF rendering | [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) |
| PDF manipulation | [pdf-lib](https://pdf-lib.js.org/) |
| Image cropping | [Cropper.js](https://fengyuanchen.github.io/cropperjs/) |
| Styling | Vanilla CSS with CSS custom properties |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) · [Great Vibes](https://fonts.google.com/specimen/Great+Vibes) (Google Fonts) |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/signati.git
cd signati
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will start a local dev server. By default the app is available at:

```
http://localhost:5173
```

> The exact URL is printed in the terminal output. If port `5173` is busy, Vite will pick the next available port.

---

## Usage

1. **Upload a PDF** — Click *"Select PDF Document"* and choose a `.pdf` file.
2. **Upload your signature** — Click *"Upload Signature (Image)"* and select a PNG or JPEG image of your signature. A crop dialog will appear so you can trim excess whitespace.
3. **Place the signature** — Click *"Sign Current Page"* to add the signature overlay to the current page. Drag it to position and use the bottom-right handle to resize.
4. **Navigate pages** — Use the *← Prev / Next →* buttons to move between pages. Each page's signature position is saved independently.
5. **Remove a signature** — Click the **×** button on the signature overlay to remove it from the current page.
6. **Download** — Once at least one page has a signature, the *"Download Signed PDF"* button becomes enabled. Click it to get your signed PDF.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (hot-reload) |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages via `gh-pages` |

---

## Deployment (GitHub Pages)

The project includes a `gh-pages` setup. To deploy:

```bash
npm run deploy
```

This will run `vite build` (via the `predeploy` script) and publish the `dist/` directory to the `gh-pages` branch.

---

## Known Limitations

- **Encrypted / protected PDFs** cannot be signed. The app will show an error message if you try.
- Signature positioning is calculated relative to the rendered canvas at `scale = 1.5`. Very large or very small PDFs may require adjusting placement after download.
- All processing happens client-side; extremely large PDFs may impact browser performance.

---

## License

This project is private. See the repository settings for access details.
