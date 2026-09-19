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

// Put a transparent clickable link over each link that exists inside the PDF.
function addLinks(wrap, annotations, cssViewport) {
  for (const a of annotations) {
    if (a.subtype !== "Link" || !a.url) continue;
    if (!/^(https?:|mailto:|tel:)/i.test(a.url)) continue;
    const [x1, y1, x2, y2] = cssViewport.convertToViewportRectangle(a.rect);
    const link = document.createElement("a");
    link.href = a.url;
    if (/^https?:/i.test(a.url)) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    link.setAttribute("aria-label", a.url);
    link.style.left = Math.min(x1, x2) + "px";
    link.style.top = Math.min(y1, y2) + "px";
    link.style.width = Math.abs(x2 - x1) + "px";
    link.style.height = Math.abs(y2 - y1) + "px";
    wrap.appendChild(link);
  }
}

async function renderAll() {
  const width = pagesEl.clientWidth;
  if (!pdfDoc || !width) return;
  const myId = ++renderId;
  lastWidth = width;
  const dpr = window.devicePixelRatio || 1;
  const sheets = [];

  for (let n = 1; n <= pdfDoc.numPages; n++) {
    const page = await pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const cssScale = width / base.width;
    const viewport = page.getViewport({ scale: cssScale * dpr });
    const cssViewport = page.getViewport({ scale: cssScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Resume page " + n + " of " + pdfDoc.numPages);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    const wrap = document.createElement("div");
    wrap.className = "page";
    wrap.appendChild(canvas);
    addLinks(wrap, await page.getAnnotations(), cssViewport);

    if (myId !== renderId) return; // a newer render started, drop this one
    sheets.push(wrap);
  }
  pagesEl.replaceChildren(...sheets);
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
