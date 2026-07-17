// ── About modal ───────────────────────────────────────────────────────────────
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const aboutLink    = document.getElementById('about-link');

function openModal()  { modalOverlay.hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal() { modalOverlay.hidden = true;  document.body.style.overflow = ''; }

aboutLink.addEventListener('click', e => { e.preventDefault(); openModal(); });
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

const fileInput      = document.getElementById('file-input');
const uploadArea     = document.getElementById('upload-area');
const previewImg     = document.getElementById('preview-img');
const resultArea     = document.getElementById('result-area');
const resultImg      = document.getElementById('result-img');
const contourBtn     = document.getElementById('contour-btn');
const exportBtn      = document.getElementById('export-btn');
const smoothRadius   = document.getElementById('smooth-radius');
const smoothValue    = document.getElementById('smooth-value');
const contourThickness = document.getElementById('contour-thickness');
const contourThicknessValue = document.getElementById('contour-thickness-value');
const blackThreshold = document.getElementById('black-threshold');
const blackValue     = document.getElementById('black-value');
const whiteThreshold = document.getElementById('white-threshold');
const whiteValue     = document.getElementById('white-value');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingLabel   = document.getElementById('loading-label');

// ── sRGB ↔ LAB conversion ─────────────────────────────────────────────────────

function srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToXyz(r, g, b) {
    return [
        r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
        r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
        r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
    ];
}

function xyzToLab(x, y, z) {
    const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const fx = f(x / 0.95047), fy = f(y / 1.00000), fz = f(z / 1.08883);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function rgbToLab(r, g, b) {
    const [x, y, z] = linearToXyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
    return xyzToLab(x, y, z);
}

function labToXyz(L, a, b) {
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const f = (t) => t > 0.206897 ? t * t * t : (t - 16 / 116) / 7.787;
    return [f(fx) * 0.95047, f(fy) * 1.00000, f(fz) * 1.08883];
}

function xyzToLinear(x, y, z) {
    return [
         x *  3.2404542 + y * -1.5371385 + z * -0.4985314,
         x * -0.9692660 + y *  1.8760108 + z *  0.0415560,
         x *  0.0556434 + y * -0.2040259 + z *  1.0572252,
    ];
}

function linearToSrgb(c) {
    c = Math.max(0, Math.min(1, c));
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255);
}

function labToRgb(L, a, b) {
    const [x, y, z] = labToXyz(L, a, b);
    const [r, g, bl] = xyzToLinear(x, y, z);
    return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl)];
}

// ── Image → LAB extraction ────────────────────────────────────────────────────

function extractLabFromImage(img) {
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = new Float32Array(width * height * 3);

    for (let i = 0, p = 0; i < data.length; i += 4, p += 3) {
        const [L, a, b] = rgbToLab(data[i], data[i + 1], data[i + 2]);
        pixels[p] = L; pixels[p + 1] = a; pixels[p + 2] = b;
    }
    return { width, height, pixels };
}

function saveLabToStorage(labData) {
    const payload = { width: labData.width, height: labData.height, pixels: Array.from(labData.pixels) };
    try {
        localStorage.setItem('skillosaic_lab', JSON.stringify(payload));
        console.info(`[Skillosaic] LAB data saved: ${labData.width}×${labData.height} px`);
    } catch (e) {
        console.warn('[Skillosaic] localStorage quota exceeded.', e);
    }
}

// ── K-Means (on A,B channels only) ───────────────────────────────────────────

// In-memory store — primary source of truth (localStorage is best-effort only)
let currentLabData = null;
let lastKmeansResult = null; // { labels, centroids, avgL }
let selectedClusters = new Set(); // empty = all selected

const K = 5;            // colour clusters from K-Means
const K_BLACK = K;      // cluster index for black pixels
const K_WHITE = K + 1;  // cluster index for white pixels
const K_TOTAL = K + 2;
const MAX_ITER = 50;

function kmeansppInit(ab, k) {
    const n = ab.length / 2;
    const centroids = [];

    // Pick first centroid at random
    const first = Math.floor(Math.random() * n);
    centroids.push([ab[first * 2], ab[first * 2 + 1]]);

    for (let c = 1; c < k; c++) {
        // Compute squared distance from each point to its nearest centroid
        const dists = new Float64Array(n);
        let total = 0;
        for (let i = 0; i < n; i++) {
            let minD = Infinity;
            for (const [ca, cb] of centroids) {
                const da = ab[i * 2] - ca, db = ab[i * 2 + 1] - cb;
                minD = Math.min(minD, da * da + db * db);
            }
            dists[i] = minD;
            total += minD;
        }
        // Weighted random pick
        let r = Math.random() * total;
        for (let i = 0; i < n; i++) {
            r -= dists[i];
            if (r <= 0) { centroids.push([ab[i * 2], ab[i * 2 + 1]]); break; }
        }
        if (centroids.length < c + 1) centroids.push([ab[(n - 1) * 2], ab[(n - 1) * 2 + 1]]);
    }
    return centroids;
}

function runKmeans(labData) {
    const { width, height, pixels } = labData;
    const n = width * height;
    const blackL = parseFloat(blackThreshold.value);
    const whiteL = parseFloat(whiteThreshold.value);

    // Pre-assign black and white pixels; collect indices of colour pixels
    const labels = new Int32Array(n);
    const colorIdx = [];
    for (let i = 0; i < n; i++) {
        const L = pixels[i * 3];
        if (L <= blackL)      { labels[i] = K_BLACK; }
        else if (L >= whiteL) { labels[i] = K_WHITE; }
        else                  { labels[i] = -1; colorIdx.push(i); }
    }

    // Build A,B array for colour pixels only
    const m = colorIdx.length;
    const ab = new Float32Array(m * 2);
    for (let j = 0; j < m; j++) {
        ab[j * 2]     = pixels[colorIdx[j] * 3 + 1];
        ab[j * 2 + 1] = pixels[colorIdx[j] * 3 + 2];
    }

    // K-Means++ on colour pixels
    let centroids = kmeansppInit(ab, K);
    const colorLabels = new Int32Array(m);

    for (let iter = 0; iter < MAX_ITER; iter++) {
        let changed = false;
        for (let j = 0; j < m; j++) {
            const pa = ab[j * 2], pb = ab[j * 2 + 1];
            let best = 0, bestD = Infinity;
            for (let c = 0; c < K; c++) {
                const da = pa - centroids[c][0], db = pb - centroids[c][1];
                const d = da * da + db * db;
                if (d < bestD) { bestD = d; best = c; }
            }
            if (colorLabels[j] !== best) { colorLabels[j] = best; changed = true; }
        }
        if (!changed) break;

        const sums = Array.from({ length: K }, () => [0, 0, 0]);
        for (let j = 0; j < m; j++) {
            const c = colorLabels[j];
            sums[c][0] += ab[j * 2];
            sums[c][1] += ab[j * 2 + 1];
            sums[c][2]++;
        }
        centroids = sums.map(([sa, sb, cnt], idx) =>
            cnt > 0 ? [sa / cnt, sb / cnt] : centroids[idx]
        );
    }

    // Write colour labels back into full labels array
    for (let j = 0; j < m; j++) labels[colorIdx[j]] = colorLabels[j];

    // Compute avgL and centroid a,b for all K_TOTAL clusters
    const lSums   = new Float64Array(K_TOTAL);
    const aSums   = new Float64Array(K_TOTAL);
    const bSums   = new Float64Array(K_TOTAL);
    const counts  = new Int32Array(K_TOTAL);
    for (let i = 0; i < n; i++) {
        const c = labels[i];
        lSums[c]  += pixels[i * 3];
        aSums[c]  += pixels[i * 3 + 1];
        bSums[c]  += pixels[i * 3 + 2];
        counts[c] += 1;
    }

    // Full centroids array (K colour + black + white)
    const allCentroids = Array.from({ length: K_TOTAL }, (_, c) => {
        if (c < K) return centroids[c];
        return counts[c] > 0 ? [aSums[c] / counts[c], bSums[c] / counts[c]] : [0, 0];
    });
    const avgL = Array.from({ length: K_TOTAL }, (_, c) =>
        counts[c] > 0 ? lSums[c] / counts[c] : (c === K_BLACK ? 0 : 100)
    );

    return { labels, centroids: allCentroids, avgL, counts };
}

// ── Mosaic rendering ──────────────────────────────────────────────────────────

function renderMosaic(labData, labels, centroids, activeSet) {
    const { width, height, pixels } = labData;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(width, height);
    const all = !activeSet || activeSet.size === 0;

    for (let i = 0; i < width * height; i++) {
        const L  = pixels[i * 3];
        const cluster = labels[i];
        let r, g, b;
        if (all || activeSet.has(cluster)) {
            const [ca, cb] = centroids[cluster];
            [r, g, b] = labToRgb(L, ca, cb);
        } else {
            // White for unselected pixels
            [r, g, b] = [255, 255, 255];
        }
        out.data[i * 4]     = r;
        out.data[i * 4 + 1] = g;
        out.data[i * 4 + 2] = b;
        out.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(out, 0, 0);
    return canvas.toDataURL('image/png');
}

// ── Palette rendering ─────────────────────────────────────────────────────────

function applySelection() {
    refreshResult();
}

function renderPalette(centroids, avgL, counts) {
    selectedClusters.clear();
    const container = document.getElementById('palette-swatches');
    container.innerHTML = '';
    container.classList.remove('has-selection');

    const labels = { [K_BLACK]: 'Black', [K_WHITE]: 'White' };

    centroids.forEach(([a, b], i) => {
        if (counts && counts[i] === 0) return; // skip empty clusters
        const [r, g, bl] = labToRgb(avgL[i], a, b);
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = `rgb(${r},${g},${bl})`;
        const tag = labels[i] ? `${labels[i]}  ` : '';
        swatch.title = `${tag}L=${avgL[i].toFixed(1)}  a=${a.toFixed(1)}  b=${b.toFixed(1)}`;

        swatch.addEventListener('click', () => {
            swatch.classList.toggle('selected');
            if (swatch.classList.contains('selected')) {
                selectedClusters.add(i);
            } else {
                selectedClusters.delete(i);
            }
            container.classList.toggle('has-selection', selectedClusters.size > 0);
            applySelection();
        });

        container.appendChild(swatch);
    });
}

// ── Label smoothing (mode filter) ─────────────────────────────────────────────

function smoothLabels(labels, width, height, radius) {
    if (radius === 0) return labels;
    const smoothed = new Int32Array(labels.length);
    const counts = new Int32Array(K_TOTAL);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            counts.fill(0);
            const x0 = Math.max(0, x - radius), x1 = Math.min(width - 1,  x + radius);
            const y0 = Math.max(0, y - radius), y1 = Math.min(height - 1, y + radius);
            for (let ny = y0; ny <= y1; ny++)
                for (let nx = x0; nx <= x1; nx++)
                    counts[labels[ny * width + nx]]++;
            let best = 0;
            for (let c = 1; c < K_TOTAL; c++) if (counts[c] > counts[best]) best = c;
            smoothed[y * width + x] = best;
        }
    }
    return smoothed;
}

// ── Contour rendering ─────────────────────────────────────────────────────────

let contourMode = false;

function renderContours(labData, labels, centroids, activeSet, thickness) {
    const { width, height } = labData;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(width, height);
    const all = !activeSet || activeSet.size === 0;
    const r = Math.max(0, (thickness || 1) - 1);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const cluster = labels[i];

            if (!all && !activeSet.has(cluster)) {
                out.data[i * 4]     = 255;
                out.data[i * 4 + 1] = 255;
                out.data[i * 4 + 2] = 255;
                out.data[i * 4 + 3] = 255;
                continue;
            }

            // Check neighbours within `thickness` radius for a different cluster
            let isBoundary = false;
            for (let dy = -r; dy <= r && !isBoundary; dy++) {
                const ny = y + dy;
                if (ny < 0 || ny >= height) continue;
                for (let dx = -r; dx <= r; dx++) {
                    const nx = x + dx;
                    if (nx < 0 || nx >= width) continue;
                    if (labels[ny * width + nx] !== cluster) {
                        isBoundary = true;
                        break;
                    }
                }
            }

            if (isBoundary) {
                const L = labData.pixels[i * 3];
                const [ca, cb] = centroids[cluster];
                const [r, g, b] = labToRgb(L, ca, cb);
                out.data[i * 4]     = r;
                out.data[i * 4 + 1] = g;
                out.data[i * 4 + 2] = b;
            } else {
                out.data[i * 4]     = 255;
                out.data[i * 4 + 1] = 255;
                out.data[i * 4 + 2] = 255;
            }
            out.data[i * 4 + 3] = 255;
        }
    }

    ctx.putImageData(out, 0, 0);
    return canvas.toDataURL('image/png');
}

function refreshResult() {
    if (!currentLabData || !lastKmeansResult) return;
    const { labels, centroids } = lastKmeansResult;
    const { width, height } = currentLabData;
    const radius = parseInt(smoothRadius.value, 10);
    const finalLabels = smoothLabels(labels, width, height, radius);
    const thickness = parseInt(contourThickness.value, 10);
    const dataUrl = contourMode
        ? renderContours(currentLabData, finalLabels, centroids, selectedClusters, thickness)
        : renderMosaic(currentLabData, finalLabels, centroids, selectedClusters);
    resultImg.src = dataUrl;
    resultImg.hidden = false;
    resultArea.querySelector('.placeholder').style.display = 'none';
}

smoothRadius.addEventListener('input', () => {
    smoothValue.textContent = smoothRadius.value;
    refreshResult();
});

contourThickness.addEventListener('input', () => {
    contourThicknessValue.textContent = contourThickness.value;
    refreshResult();
});

blackThreshold.addEventListener('input', () => {
    blackValue.textContent = blackThreshold.value;
    // Clamp white min to stay above black
    whiteThreshold.min = String(parseInt(blackThreshold.value) + 1);
});

whiteThreshold.addEventListener('input', () => {
    whiteValue.textContent = whiteThreshold.value;
});

contourBtn.addEventListener('click', () => {
    contourMode = !contourMode;
    contourBtn.classList.toggle('active', contourMode);
    refreshResult();
});

// ── PDF export ────────────────────────────────────────────────────────────────

exportBtn.addEventListener('click', () => {
    const src = resultImg.src;
    if (!src) return;

    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting…';

    try {
        const { jsPDF } = window.jspdf;
        const img = new Image();
        img.onload = () => {
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            // Fit image to A4 (595 x 842 pt) with 10 pt margin
            const margin = 10;
            const maxW = 595 - margin * 2;
            const maxH = 842 - margin * 2;
            const scale = Math.min(maxW / imgW, maxH / imgH);
            const pdfW = imgW * scale;
            const pdfH = imgH * scale;
            const orientation = imgW > imgH ? 'landscape' : 'portrait';

            const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const x = (pageW - pdfW) / 2;
            const y = (pageH - pdfH) / 2;

            doc.addImage(src, 'PNG', x, y, pdfW, pdfH);
            doc.save('skillosaic.pdf');
        };
        img.onerror = () => { throw new Error('Failed to load result image'); };
        img.src = src;
    } catch (err) {
        alert(`Export failed: ${err.message}`);
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export PDF';
    }
});

// ── Processing ────────────────────────────────────────────────────────────────

function runProcessing() {
    const labData = currentLabData;
    if (!labData) return;

    // Show loading overlay
    resultImg.hidden = true;
    const placeholder = resultArea.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = 'none';
    loadingOverlay.hidden = false;
    contourBtn.disabled = true;
    exportBtn.disabled = true;
    contourBtn.classList.remove('active');
    contourMode = false;

    // Let the browser render the spinner before blocking computation
    setTimeout(() => {
        const kmeansResult = runKmeans(labData);
        lastKmeansResult = kmeansResult;

        renderPalette(kmeansResult.centroids, kmeansResult.avgL, kmeansResult.counts);
        refreshResult();

        loadingOverlay.hidden = true;
        contourBtn.disabled = false;
        exportBtn.disabled = false;
    }, 50);
}

function loadImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    previewImg.onload = () => {
        const labData = extractLabFromImage(previewImg);
        currentLabData = labData;
        saveLabToStorage(labData);
        lastKmeansResult = null;
        runProcessing();
    };
    previewImg.src = url;
    previewImg.hidden = false;
    uploadArea.querySelector('.placeholder').style.display = 'none';
}

fileInput.addEventListener('change', () => loadImage(fileInput.files[0]));

uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    loadImage(e.dataTransfer.files[0]);
});
