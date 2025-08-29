// app/lib/pdf2img.ts
// Browser-only PDF -> image using pdfjs-dist, with NO hardcoded worker path.
//
// It resolves the worker URL via your bundler (?url). If that fails, it falls
// back to a CDN that matches the installed pdfjs version—still no hardcoding.

export interface PdfConversionResult {
  imageUrl: string;     // remember to URL.revokeObjectURL(imageUrl) when done showing it
  file: File | null;    // PNG (default) or JPEG depending on opts
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function resolveWorkerSrc(lib: any): Promise<string> {
  // Try common ESM/bundler patterns first (no hardcoded path)
  // 1) Vite/modern bundlers: ?url returns the emitted asset URL
  try {
    const u = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default as string;
    if (typeof u === "string" && u.length) return u;
  } catch {}
  // 2) Some setups use non-minified worker
  try {
    const u = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default as string;
    if (typeof u === "string" && u.length) return u;
  } catch {}
  // 3) Webpack worker-loader style (rare now). If you use this, uncomment:
  // try {
  //   const Worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker")).default as any;
  //   const blobUrl = (Worker && Worker.prototype) ? Worker : undefined;
  //   if (blobUrl) return blobUrl;
  // } catch {}

  // Fallback: CDN URL that matches the installed version (still not hardcoded to your app)
  const ver: string = lib.version || "4.6.82";
  return `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.mjs`;
}

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // ESM build of pdfjs
    const lib = await import("pdfjs-dist/build/pdf.mjs");
    const workerSrc = await resolveWorkerSrc(lib);
    lib.GlobalWorkerOptions.workerSrc = workerSrc;
    pdfjsLib = lib;
    return lib;
  })();

  return loadPromise;
}

export async function convertPdfToImage(
  file: File,
  opts?: {
    page?: number;                   // 1-based page index (default 1)
    scale?: number;                  // render scale (default 2)
    mimeType?: "image/png" | "image/jpeg"; // default PNG
    quality?: number;                // JPEG quality (0..1), used only for JPEG
  }
): Promise<PdfConversionResult> {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { imageUrl: "", file: null, error: "convertPdfToImage must run in the browser" };
    }

    const lib = await loadPdfJs();

    const pageNum = Math.max(1, opts?.page ?? 1);
    const scale = opts?.scale ?? 2;
    const mimeType = opts?.mimeType ?? "image/png";
    const quality = typeof opts?.quality === "number" ? opts.quality : 0.92;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    if (pageNum > pdf.numPages) {
      return { imageUrl: "", file: null, error: `PDF has only ${pdf.numPages} page(s)` };
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { imageUrl: "", file: null, error: "Canvas 2D context not available" };

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    // Optional smoothing
    (ctx as any).imageSmoothingEnabled = true;
    try { (ctx as any).imageSmoothingQuality = "high"; } catch {}

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        resolve,
        mimeType,
        mimeType === "image/jpeg" ? quality : undefined
      )
    );

    if (!blob) {
      return { imageUrl: "", file: null, error: "Failed to create image blob" };
    }

    const imageUrl = URL.createObjectURL(blob);
    const base = file.name.replace(/\.pdf$/i, "");
    const outName = `${base}${mimeType === "image/jpeg" ? ".jpg" : ".png"}`;
    const outFile = new File([blob], outName, { type: mimeType, lastModified: Date.now() });

    return { imageUrl, file: outFile };
  } catch (err: any) {
    console.error("[pdf2img] convert error:", err);
    return { imageUrl: "", file: null, error: String(err?.message || err) };
  }
}