import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// State variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let canvas = document.getElementById('pdf-render-canvas');
let ctx = canvas.getContext('2d');
let rawPdfBytes = null;
let signatureBase64 = null; // Will store the base64 string
let signatureImage = null; // For pdf-lib to embed

// DOM Elements
const pdfUpload = document.getElementById('pdf-upload');
const pdfFilename = document.getElementById('pdf-filename');
const signatureUpload = document.getElementById('signature-upload');
const signatureFilename = document.getElementById('signature-filename');
const signaturePreviewImg = document.getElementById('signature-preview-img');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageNumSpan = document.getElementById('page-num');
const pageCountSpan = document.getElementById('page-count');
const downloadBtn = document.getElementById('download-btn');
const viewerPlaceholder = document.getElementById('viewer-placeholder');
const canvasContainer = document.getElementById('canvas-container');
const signatureOverlay = document.getElementById('signature-overlay');
const signatureOverlayImg = document.getElementById('signature-overlay-img');
const themeToggleBtn = document.getElementById('theme-toggle');

// Theme Management
const currentTheme = localStorage.getItem('signati_theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('signati_theme', newTheme);
});

// Load persisted signature from localStorage
function loadPersistedSignature() {
  const savedSig = localStorage.getItem('signati_signature');
  if (savedSig) {
    signatureBase64 = savedSig;
    signaturePreviewImg.src = savedSig;
    signaturePreviewImg.style.display = 'block';
    signatureFilename.textContent = 'Loaded from saved signature';
    
    // Set overlay image but don't show yet
    signatureOverlayImg.src = savedSig;
    
    // Update button state
    updateDownloadButtonState();
  }
}

// Initialize
loadPersistedSignature();

// Event Listeners for PDF
pdfUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  pdfFilename.textContent = file.name;
  rawPdfBytes = await file.arrayBuffer();
  
  // Make a copy of the buffer for pdf.js because the worker takes ownership 
  // and detaches the original ArrayBuffer, making it unusable for pdf-lib later.
  const pdfjsData = rawPdfBytes.slice(0);
  
  const loadingTask = pdfjsLib.getDocument({ data: pdfjsData });
  try {
    pdfDoc = await loadingTask.promise;
    pageCountSpan.textContent = pdfDoc.numPages;
    viewerPlaceholder.style.display = 'none';
    
    // Render first page
    pageNum = 1;
    renderPage(pageNum);
    
    // Show signature overlay if we have a signature
    if (signatureBase64) {
      signatureOverlay.style.display = 'block';
    }
    
    updateDownloadButtonState();
  } catch (error) {
    console.error('Error rendering PDF:', error);
    alert('Failed to load the PDF document.');
  }
});

// Render a specific page
async function renderPage(num) {
  pageRendering = true;
  const page = await pdfDoc.getPage(num);
  
  const viewport = page.getViewport({ scale: scale });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Also size the container to fit canvas
  canvasContainer.style.minHeight = `${viewport.height + 40}px`;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };
  
  const renderTask = page.render(renderContext);
  await renderTask.promise;
  
  pageRendering = false;
  if (pageNumPending !== null) {
    renderPage(pageNumPending);
    pageNumPending = null;
  }
  
  pageNumSpan.textContent = num;
  
  // Update nav buttons
  prevBtn.disabled = num <= 1;
  nextBtn.disabled = num >= pdfDoc.numPages;
}

// Queue rendering
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

prevBtn.addEventListener('click', () => {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
});

nextBtn.addEventListener('click', () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
});

// Event Listeners for Signature
signatureUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  signatureFilename.textContent = file.name;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    signatureBase64 = event.target.result;
    
    // Persist to localStorage
    try {
      localStorage.setItem('signati_signature', signatureBase64);
    } catch (err) {
      console.warn("Could not save signature to localStorage (might be too large).", err);
    }
    
    signaturePreviewImg.src = signatureBase64;
    signaturePreviewImg.style.display = 'block';
    
    signatureOverlayImg.src = signatureBase64;
    if (pdfDoc) {
      signatureOverlay.style.display = 'block';
    }
    
    updateDownloadButtonState();
  };
  reader.readAsDataURL(file);
});

function updateDownloadButtonState() {
  if (pdfDoc && signatureBase64) {
    downloadBtn.disabled = false;
  } else {
    downloadBtn.disabled = true;
  }
}

// Dragging Logic for the Signature Overlay
let isDragging = false;
let startX, startY, initialLeft, initialTop;

signatureOverlay.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('resize-handle')) return; // handled by resize
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialLeft = signatureOverlay.offsetLeft;
  initialTop = signatureOverlay.offsetTop;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    signatureOverlay.style.left = `${initialLeft + dx}px`;
    signatureOverlay.style.top = `${initialTop + dy}px`;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Resizing Logic for the Signature Overlay
const resizeHandle = signatureOverlay.querySelector('.resize-handle');
let isResizing = false;
let initialWidth;
let resizeStartX;

resizeHandle.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  isResizing = true;
  initialWidth = signatureOverlay.offsetWidth;
  resizeStartX = e.clientX;
});

document.addEventListener('mousemove', (e) => {
  if (isResizing) {
    const dx = e.clientX - resizeStartX;
    const newWidth = Math.max(50, initialWidth + dx); // min width 50px
    signatureOverlay.style.width = `${newWidth}px`;
  }
});

document.addEventListener('mouseup', () => {
  isResizing = false;
});

// Apply Signature and Download
downloadBtn.addEventListener('click', async () => {
  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';

    // Load PDF with pdf-lib
    const pdfLibDoc = await PDFDocument.load(rawPdfBytes);
    const pages = pdfLibDoc.getPages();
    const pageToSign = pages[pageNum - 1]; // 0-indexed in pdf-lib
    
    // Embed signature image
    let embeddedImage;
    if (signatureBase64.includes('image/png')) {
      embeddedImage = await pdfLibDoc.embedPng(signatureBase64);
    } else {
      embeddedImage = await pdfLibDoc.embedJpg(signatureBase64);
    }
    
    // Calculate coordinates and scale based on canvas vs pdf-lib page size
    // Canvas might be centered in the container via flex, so we need coordinates relative to the canvas itself
    const canvasRect = canvas.getBoundingClientRect();
    const overlayRect = signatureOverlay.getBoundingClientRect();
    
    // Relative coordinates to the canvas (which represents the PDF page)
    const relX = overlayRect.left - canvasRect.left;
    const relY = overlayRect.top - canvasRect.top;
    
    // pdf-lib origin is bottom-left, canvas origin is top-left
    const pdfWidth = pageToSign.getWidth();
    const pdfHeight = pageToSign.getHeight();
    
    // Scale factor between canvas size and actual PDF size
    const scaleX = pdfWidth / canvasRect.width;
    const scaleY = pdfHeight / canvasRect.height;
    
    const finalWidth = overlayRect.width * scaleX;
    const finalHeight = (embeddedImage.height / embeddedImage.width) * finalWidth; // Keep aspect ratio
    
    // Convert canvas Y to pdf-lib Y (invert axis)
    const finalX = relX * scaleX;
    const finalY = pdfHeight - (relY * scaleY) - finalHeight;

    // Draw the image onto the page
    pageToSign.drawImage(embeddedImage, {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
    });

    // Serialize and download
    const pdfBytes = await pdfLibDoc.save();
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-${pdfFilename.textContent || 'document.pdf'}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error applying signature:', error);
    alert('An error occurred while applying the signature.');
  } finally {
    downloadBtn.textContent = 'Download Signed PDF';
    downloadBtn.disabled = false;
  }
});
