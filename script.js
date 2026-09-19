// Change this if your PDF has a different file name.
const PDF_URL = "Peeranat_Anunteratat_Resume.pdf";

const pagesEl = document.getElementById("pages");
const statusEl = document.getElementById("status");
let pdfDoc = null;
let renderId = 0;
let lastWidth = 0;

function showFallback() {
  statusEl.innerHTML = 'Can\'t show the preview here. <a href="' + PDF_URL + '">Open the resume PDF</a>.';
  statusEl.hidden = false;
}

async function renderAll() {
  const width = pagesEl.clientWidth;
  if (!pdfDoc || !width) return;
  const myId = ++renderId;
  lastWidth = width;
  const dpr = window.devicePixelRatio || 1;
  const canvases = [];

  for (let n = 1; n <= pdfDoc.numPages; n++) {
    const page = await pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * dpr });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Resume page " + n + " of " + pdfDoc.numPages);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    if (myId !== renderId) return; // a newer render started, drop this one
    canvases.push(canvas);
  }
  pagesEl.replaceChildren(...canvases);
  statusEl.hidden = true;
}

async function init() {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfDoc = await pdfjsLib.getDocument(PDF_URL).promise;
    await renderAll();
  } catch (err) {
    console.error(err);
    showFallback();
  }
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (Math.abs(pagesEl.clientWidth - lastWidth) > 1) renderAll();
  }, 200);
});

init();
