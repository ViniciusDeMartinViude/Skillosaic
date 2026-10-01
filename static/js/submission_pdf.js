(() => {
    'use strict';

    const finalizeBtn = document.getElementById('submission-finalize-pdf');
    const finalizationStateEl = document.getElementById('submission-finalization-state');

    if (!finalizeBtn || !finalizationStateEl) return;

    const MARGIN = 42;
    const PAGE_BOTTOM = 800;
    const CONTENT_WIDTH = 511;

    function safeText(value, fallback = '-') {
        if (value === null || value === undefined || value === '') return fallback;
        return String(value);
    }

    function number(value, digits = 2) {
        const n = Number(value);
        return Number.isFinite(n) ? n.toFixed(digits) : '-';
    }

    function percent(value, digits = 1) {
        const n = Number(value);
        return Number.isFinite(n) ? `${n.toFixed(digits)}%` : '-';
    }

    function grams(value, digits = 2) {
        const n = Number(value);
        return Number.isFinite(n) ? `${n.toFixed(digits)} g` : '-';
    }

    function formatDate(value) {
        if (!value) return '-';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? safeText(value) : d.toLocaleString();
    }

    function labText(value) {
        if (Array.isArray(value) && value.length >= 3) {
            return `L* ${number(value[0])} | a* ${number(value[1])} | b* ${number(value[2])}`;
        }
        if (value && typeof value === 'object') {
            const L = value.L ?? value.l;
            const a = value.a;
            const b = value.b;
            if ([L, a, b].every(v => Number.isFinite(Number(v)))) {
                return `L* ${number(L)} | a* ${number(a)} | b* ${number(b)}`;
            }
        }
        return '-';
    }

    function rgbText(value) {
        return Array.isArray(value) && value.length >= 3
            ? `${Math.round(Number(value[0]))}, ${Math.round(Number(value[1]))}, ${Math.round(Number(value[2]))}`
            : '-';
    }

    function filenameSafe(value) {
        return safeText(value, 'submission')
            .replace(/[^a-z0-9_-]+/gi, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 60) || 'submission';
    }

    function rgbArray(value) {
        if (!Array.isArray(value) || value.length < 3) return null;
        const rgb = value.slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(Number(v)))));
        return rgb.every(Number.isFinite) ? rgb : null;
    }

    function labToRgb(lab) {
        if (!Array.isArray(lab) || lab.length < 3) return null;

        const [L, a, b] = lab.map(Number);
        if (![L, a, b].every(Number.isFinite)) return null;

        const fy = (L + 16) / 116;
        const fx = fy + a / 500;
        const fz = fy - b / 200;
        const invf = t => {
            const t3 = t * t * t;
            return t3 > 0.008856 ? t3 : (116 * t - 16) / 903.3;
        };

        const X = 0.95047 * invf(fx);
        const Y = 1.00000 * invf(fy);
        const Z = 1.08883 * invf(fz);

        const rl =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
        const gl = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
        const bl =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

        const gamma = value => {
            const encoded = value <= 0.0031308
                ? 12.92 * value
                : 1.055 * Math.pow(Math.max(value, 0), 1 / 2.4) - 0.055;
            return Math.round(Math.max(0, Math.min(1, encoded)) * 255);
        };

        return [gamma(rl), gamma(gl), gamma(bl)];
    }

    function recipeLines(formulation) {
        const pct = formulation?.recipePercent || {};
        const wt = formulation?.grams || {};
        return [
            `Red: ${percent(pct.red)} | ${grams(wt.red)}`,
            `Yellow: ${percent(pct.yellow)} | ${grams(wt.yellow)}`,
            `Blue: ${percent(pct.blue)} | ${grams(wt.blue)}`
        ];
    }

    function createWriter(doc) {
        let y = MARGIN;

        const pageWidth = doc.internal.pageSize.getWidth();

        function newPage() {
            doc.addPage();
            y = MARGIN;
        }

        function ensure(height) {
            if (y + height > PAGE_BOTTOM) newPage();
        }

        function setText(size = 9, style = 'normal') {
            doc.setFont('helvetica', style);
            doc.setFontSize(size);
            doc.setTextColor(38, 53, 69);
        }

        function title(text) {
            ensure(42);
            setText(20, 'bold');
            doc.setTextColor(17, 63, 103);
            doc.text(text, MARGIN, y);
            y += 27;
        }

        function subtitle(text) {
            setText(10, 'normal');
            doc.setTextColor(92, 107, 122);
            const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
            doc.text(lines, MARGIN, y);
            y += lines.length * 13 + 5;
        }

        function section(text) {
            ensure(34);
            if (y > MARGIN + 4) y += 8;
            doc.setFillColor(232, 240, 248);
            doc.roundedRect(MARGIN, y - 14, CONTENT_WIDTH, 24, 4, 4, 'F');
            setText(12, 'bold');
            doc.setTextColor(17, 63, 103);
            doc.text(text, MARGIN + 8, y + 2);
            y += 24;
        }

        function subsection(text) {
            ensure(24);
            setText(10, 'bold');
            doc.setTextColor(30, 80, 125);
            doc.text(text, MARGIN, y);
            y += 15;
        }

        function line(label, value, options = {}) {
            const width = options.width || CONTENT_WIDTH;
            const labelWidth = options.labelWidth || 132;
            const valueText = safeText(value);

            setText(8.5, 'bold');
            doc.setTextColor(83, 98, 113);
            const labelLines = doc.splitTextToSize(`${label}:`, labelWidth - 8);

            setText(8.5, 'normal');
            doc.setTextColor(38, 53, 69);
            const valueLines = doc.splitTextToSize(valueText, width - labelWidth);

            const lines = Math.max(labelLines.length, valueLines.length);
            ensure(lines * 11 + 3);

            setText(8.5, 'bold');
            doc.setTextColor(83, 98, 113);
            doc.text(labelLines, MARGIN, y);

            setText(8.5, 'normal');
            doc.setTextColor(38, 53, 69);
            doc.text(valueLines, MARGIN + labelWidth, y);
            y += lines * 11 + 3;
        }

        function paragraph(text, size = 8.5) {
            setText(size, 'normal');
            doc.setTextColor(55, 70, 85);
            const lines = doc.splitTextToSize(safeText(text), CONTENT_WIDTH);
            ensure(lines.length * 11 + 4);
            doc.text(lines, MARGIN, y);
            y += lines.length * 11 + 4;
        }

        function divider() {
            ensure(9);
            doc.setDrawColor(222, 228, 234);
            doc.line(MARGIN, y, pageWidth - MARGIN, y);
            y += 8;
        }

        function swatch(rgb, label = null) {
            const color = rgbArray(rgb);
            ensure(32);
            if (color) {
                doc.setFillColor(color[0], color[1], color[2]);
                doc.setDrawColor(185, 193, 201);
                doc.roundedRect(MARGIN, y - 10, 28, 22, 3, 3, 'FD');
            }
            if (label) {
                setText(8.5, 'normal');
                doc.text(label, MARGIN + 38, y + 3);
            }
            y += 27;
        }

        function image(label, imageObj, maxHeight = 220) {
            if (!imageObj || !imageObj.dataUrl) {
                line(label, 'Not captured');
                return;
            }

            const iw = Number(
                imageObj.previewWidth ||
                imageObj.storedWidth ||
                imageObj.width ||
                imageObj.originalWidth ||
                4
            );
            const ih = Number(
                imageObj.previewHeight ||
                imageObj.storedHeight ||
                imageObj.height ||
                imageObj.originalHeight ||
                3
            );

            const ratio = iw > 0 && ih > 0 ? iw / ih : 4 / 3;
            const maxWidth = CONTENT_WIDTH;
            let drawWidth = Math.min(maxWidth, 430);
            let drawHeight = drawWidth / ratio;

            if (drawHeight > maxHeight) {
                drawHeight = maxHeight;
                drawWidth = drawHeight * ratio;
            }

            ensure(drawHeight + 35);
            subsection(label);

            try {
                const format = imageObj.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
                doc.addImage(imageObj.dataUrl, format, MARGIN, y, drawWidth, drawHeight, undefined, 'FAST');
                y += drawHeight + 9;
            } catch (error) {
                paragraph(`[Image could not be embedded: ${error.message || error}]`);
            }
        }

        function paletteRow(row, index) {
            const rgb = rgbArray(row?.rgb);
            ensure(42);

            if (rgb) {
                doc.setFillColor(rgb[0], rgb[1], rgb[2]);
                doc.setDrawColor(190, 197, 205);
                doc.roundedRect(MARGIN, y - 9, 24, 18, 3, 3, 'FD');
            }

            setText(8.5, 'bold');
            doc.text(safeText(row?.label, `Color ${index + 1}`), MARGIN + 34, y);

            setText(8, 'normal');
            const details = [
                labText(row?.lab),
                `RGB ${rgbText(row?.rgb)}`,
                `Coverage ${percent(row?.coveragePercent)}`,
                `Pixels ${safeText(row?.count)}`
            ].join(' | ');
            const lines = doc.splitTextToSize(details, CONTENT_WIDTH - 34);
            doc.text(lines, MARGIN + 34, y + 11);
            y += 15 + lines.length * 9;
        }

        function keyObject(prefix, object) {
            if (!object || typeof object !== 'object') {
                line(prefix, '-');
                return;
            }
            Object.entries(object).forEach(([key, value]) => {
                let display;
                if (Array.isArray(value)) display = value.join(', ');
                else if (value && typeof value === 'object') display = JSON.stringify(value);
                else display = value;
                line(`${prefix} ${key}`, display);
            });
        }

        function pageFooter() {
            const total = doc.getNumberOfPages();
            for (let page = 1; page <= total; page++) {
                doc.setPage(page);
                doc.setDrawColor(225, 230, 235);
                doc.line(MARGIN, 815, pageWidth - MARGIN, 815);
                setText(7.5, 'normal');
                doc.setTextColor(115, 125, 135);
                doc.text('Skillosaic - Submission Report', MARGIN, 829);
                doc.text(`Page ${page} of ${total}`, pageWidth - MARGIN, 829, {align:'right'});
            }
        }

        return {
            title,
            subtitle,
            section,
            subsection,
            line,
            paragraph,
            divider,
            swatch,
            image,
            paletteRow,
            keyObject,
            pageFooter
        };
    }

    function buildSubmissionPdf(draft, finalization) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF is not available.');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation:'portrait',
            unit:'pt',
            format:'a4',
            compress:true
        });

        doc.setProperties({
            title:'Skillosaic Submission Report',
            subject:`Submission token ${safeText(draft.token)}`,
            author:'Skillosaic',
            creator:'Skillosaic browser application'
        });

        const w = createWriter(doc);
        const fields = draft.fields || {};
        const identification = fields.identification || {};

        w.title('Skillosaic - Submission Report');
        w.subtitle('AI Color Matching - Complete collected submission data');

        w.line('Submission token', draft.token);
        w.line('Finalized at', formatDate(finalization.finalizedAt));
        w.line('Draft created at', formatDate(draft.createdAt));
        w.line('Draft last updated', formatDate(draft.updatedAt));
        w.line('PDF file', finalization.pdfFileName);

        w.section('1 - Identification');
        w.line('Station number', identification.stationNumber);
        w.line('Full name', identification.fullName);
        w.line('ATS school', identification.atsSchool);
        w.line('Date', identification.date);
        w.line('Registration number / image name', identification.registrationOrImageName);
        w.line('PPE confirmation', identification.ppeConfirmation);

        const mosaic = fields.imageKMeansPalette;
        w.section('2 - Image & K-Means Palette');
        if (!mosaic) {
            w.paragraph('No Step 2 data captured.');
        } else {
            w.line('Captured at', formatDate(mosaic.capturedAt));
            w.line('Source file', mosaic.sourceFileName);
            w.line('Image dimensions', `${safeText(mosaic.imageWidth)} x ${safeText(mosaic.imageHeight)} px`);
            w.line('K-Means color clusters', mosaic.kMeansColorClusters);

            const settings = mosaic.settings || {};
            w.line('Black threshold L', settings.blackThresholdL);
            w.line('White threshold L', settings.whiteThresholdL);
            w.line('Smoothing radius', settings.smoothingRadius);
            w.line('Line thickness', settings.lineThickness);
            w.line('View', settings.contoursEnabled ? 'Contours' : 'Mosaic');
            w.line(
                'Selected clusters',
                Array.isArray(settings.selectedClusters) && settings.selectedClusters.length
                    ? settings.selectedClusters.map(v => `C${Number(v) + 1}`).join(', ')
                    : 'All'
            );

            w.image('Original image', mosaic.originalImage);
            w.image('K-Means / Mosaic result', mosaic.resultImage);

            w.subsection('Captured palette');
            const palette = Array.isArray(mosaic.palette) ? mosaic.palette : [];
            if (!palette.length) {
                w.paragraph('No palette rows captured.');
            } else {
                palette.forEach((row, index) => w.paletteRow(row, index));
            }
        }

        const paint = fields.paintFormulation;
        w.section('3 - Paint Formulation Processing');
        if (!paint) {
            w.paragraph('No Step 3 data captured.');
        } else {
            w.line('Captured at', formatDate(paint.capturedAt));
            w.line('Source type', paint.source?.kind);
            w.line('Source name', paint.source?.name);
            w.line('K-Means colors', paint.kMeans?.colors);
            w.line('Total paint', grams(paint.totalPaintGrams, 0));
            w.line('Brightness adjustment', paint.imageAdjustments?.brightness);
            w.line('Contrast adjustment', paint.imageAdjustments?.contrast);

            if (paint.camera) {
                w.subsection('Camera settings');
                w.line('Selected camera', paint.camera.selectedCameraLabel);
                w.keyObject('Actual', paint.camera.actualSettings);
                w.keyObject('Requested', paint.camera.requestedControls);
            }

            w.image('Paint Formulation input', paint.source?.image);
            w.image('Paint Formulation K-Means result', paint.kMeans?.resultImage);

            w.subsection('Color formulations');
            const formulations = Array.isArray(paint.formulations) ? paint.formulations : [];

            if (!formulations.length) {
                w.paragraph('No color formulations captured.');
            } else {
                formulations.forEach((row, index) => {
                    w.divider();
                    const swatchRgb = rgbArray(row.rgb);
                    w.swatch(swatchRgb, `${safeText(row.label, `Color ${index + 1}`)} - coverage ${percent(row.coveragePercent)}`);
                    w.line('Pixel count', row.pixelCount);
                    w.line('RGB', rgbText(row.rgb));
                    w.line('Camera LAB', labText(row.cameraLab));
                    w.line('Nix-equivalent LAB', labText(row.nixEquivalentLab));
                    w.line('Predicted LAB', labText(row.formulation?.predictedLab));
                    w.line('Predicted Delta E00', number(row.formulation?.predictedDeltaE00));
                    recipeLines(row.formulation).forEach((text, recipeIndex) => {
                        const names = ['Recipe Red', 'Recipe Yellow', 'Recipe Blue'];
                        w.line(names[recipeIndex], text.split(': ').slice(1).join(': '));
                    });
                    w.line('Model source', row.formulation?.source);
                });
            }

            if (paint.manualLab) {
                w.subsection('Manual LAB formulation');
                const manual = paint.manualLab;
                w.swatch(manual.targetPreviewRgb, 'Manual LAB target preview');
                w.line('Target LAB', labText(manual.targetLab));
                w.line('Predicted LAB', labText(manual.formulation?.predictedLab));
                w.line('Predicted Delta E00', number(manual.formulation?.predictedDeltaE00));
                recipeLines(manual.formulation).forEach((text, recipeIndex) => {
                    const names = ['Recipe Red', 'Recipe Yellow', 'Recipe Blue'];
                    w.line(names[recipeIndex], text.split(': ').slice(1).join(': '));
                });
                w.line('Model source', manual.formulation?.source);
            } else {
                w.line('Manual LAB formulation', 'Not captured');
            }
        }

        const testColor = fields.testColor;
        w.section('4 - Test Color');
        if (!testColor) {
            w.paragraph('No test color captured.');
        } else {
            w.swatch(testColor.rgb, safeText(testColor.label, 'Selected test color'));
            w.line('Selected at', formatDate(testColor.selectedAt));
            w.line('Color index', Number.isFinite(Number(testColor.index)) ? Number(testColor.index) + 1 : '-');
            w.line('Coverage', percent(testColor.coveragePercent));
            w.line('Pixel count', testColor.pixelCount);
            w.line('RGB', rgbText(testColor.rgb));
            w.line('Camera LAB', labText(testColor.cameraLab));
            w.line('Target LAB - Nix-equivalent', labText(testColor.targetLab || testColor.nixEquivalentLab));
            w.line('Predicted LAB', labText(testColor.formulation?.predictedLab));
            w.line('Predicted Delta E00', number(testColor.formulation?.predictedDeltaE00));
            w.line('Total paint', grams(testColor.totalPaintGrams, 0));
            recipeLines(testColor.formulation).forEach((text, recipeIndex) => {
                const names = ['Recipe Red', 'Recipe Yellow', 'Recipe Blue'];
                w.line(names[recipeIndex], text.split(': ').slice(1).join(': '));
            });
            w.line('Model source', testColor.formulation?.source);
        }

        const weighing = fields.weighing;
        w.section('5 - Weighing');
        if (!weighing) {
            w.paragraph('No weighing data captured.');
        } else {
            const paints = weighing.paints || {};
            ['red', 'yellow', 'blue'].forEach(key => {
                const paintRow = paints[key] || {};
                w.subsection(key.charAt(0).toUpperCase() + key.slice(1));
                w.line('Can code', paintRow.code);
                w.line('Recipe percentage', percent(paintRow.recipePercent));
                w.line('Expected weight', grams(paintRow.expectedGrams));
            });

            const confirmation = weighing.confirmation || {};
            w.subsection('Expert confirmation');
            w.line('Status', confirmation.status);
            w.line('Verification method', confirmation.verificationMethod || '-');
            w.line('Expert code format', confirmation.codeFormat || '-');
            w.line('Requested at', formatDate(confirmation.requestedAt));
            w.line('Confirmed at', formatDate(confirmation.confirmedAt));
            w.line('Returned for correction at', formatDate(confirmation.rejectedAt));
        }

        const verification = fields.verification;
        w.section('6 - Verification');
        if (!verification) {
            w.paragraph('No verification result captured.');
        } else {
            w.line('Verified at', formatDate(verification.verifiedAt));
            w.line('Desired LAB', labText(verification.targetLab));
            w.line('Measured LAB', labText(verification.measuredLab));
            w.line('Delta E00', number(verification.deltaE00));
            w.line('Verification score', `${number(verification.score, 1)} / 100`);
            w.line('Score maximum Delta E00', number(verification.maxDeltaE00, 0));
            w.paragraph('Score formula: max(0, 100 x (1 - Delta E00 / maximum Delta E00))');

            w.subsection('Desired vs measured color preview');
            w.swatch(labToRgb(verification.targetLab), 'Desired color');
            w.swatch(labToRgb(verification.measuredLab), 'Measured color');
        }

        const closing = fields.closing;
        w.section('7 - Closing');
        if (!closing) {
            w.paragraph('No closing workspace image captured.');
        } else {
            w.line('Source type', closing.sourceType);
            w.line('Source name', closing.sourceName);
            w.line('Captured at', formatDate(closing.capturedAt));
            w.line(
                'Original dimensions',
                closing.originalWidth && closing.originalHeight
                    ? `${closing.originalWidth} x ${closing.originalHeight} px`
                    : '-'
            );
            w.line(
                'Stored dimensions',
                closing.storedWidth && closing.storedHeight
                    ? `${closing.storedWidth} x ${closing.storedHeight} px`
                    : '-'
            );
            w.image(
                'Final workspace evidence',
                {
                    dataUrl:closing.dataUrl,
                    storedWidth:closing.storedWidth,
                    storedHeight:closing.storedHeight,
                    originalWidth:closing.originalWidth,
                    originalHeight:closing.originalHeight
                },
                360
            );
        }

        w.section('Submission Finalization');
        w.line('Token', draft.token);
        w.line('Finalized at', formatDate(finalization.finalizedAt));
        w.line('Generated PDF', finalization.pdfFileName);
        w.paragraph('This report was generated locally in the browser from the submission data associated with the token above.');

        w.pageFooter();
        return doc;
    }

    async function finalizeSubmission() {
        const api = window.SkillosaicSubmission;

        if (!api || typeof api.getCurrentDraft !== 'function') {
            finalizationStateEl.textContent = 'Submission data is not available.';
            finalizationStateEl.classList.add('is-error');
            return;
        }

        try {
            finalizeBtn.disabled = true;
            finalizeBtn.textContent = 'Generating PDF...';
            finalizationStateEl.textContent = 'Preparing complete submission report...';
            finalizationStateEl.classList.remove('is-error', 'is-success');

            if (typeof api.save === 'function') {
                api.save();
            }

            let draft = api.getCurrentDraft();
            if (!draft) {
                throw new Error('Open or create a submission token before finalizing.');
            }

            const finalizedAt = new Date().toISOString();
            const stamp = finalizedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
            const pdfFileName = `Skillosaic_Submission_${filenameSafe(draft.token)}_${stamp}.pdf`;
            const finalization = {
                finalizedAt,
                pdfFileName
            };

            const doc = buildSubmissionPdf(draft, finalization);
            doc.save(pdfFileName);

            if (typeof api.updateFields === 'function') {
                api.updateFields({finalization});
            }

            finalizationStateEl.textContent =
                `Finalized ${formatDate(finalizedAt)} - PDF generated: ${pdfFileName}`;
            finalizationStateEl.classList.remove('is-error');
            finalizationStateEl.classList.add('is-success');
            finalizeBtn.textContent = 'Regenerate Submission PDF';
        } catch (error) {
            console.error('[Skillosaic] Submission PDF generation failed:', error);
            finalizationStateEl.textContent = `PDF generation failed: ${error.message || error}`;
            finalizationStateEl.classList.remove('is-success');
            finalizationStateEl.classList.add('is-error');
            finalizeBtn.textContent = 'Finalize Submission & Generate PDF';
        } finally {
            finalizeBtn.disabled = false;
        }
    }

    finalizeBtn.addEventListener('click', finalizeSubmission);

    window.addEventListener('skillosaic:submission-opened', event => {
        const finalization = event.detail?.finalization;

        finalizationStateEl.classList.remove('is-success', 'is-error');

        if (finalization && finalization.finalizedAt) {
            finalizationStateEl.textContent =
                `Last finalized ${formatDate(finalization.finalizedAt)} - ${safeText(finalization.pdfFileName)}`;
            finalizationStateEl.classList.add('is-success');
            finalizeBtn.textContent = 'Regenerate Submission PDF';
        } else {
            finalizationStateEl.textContent = 'Draft only - PDF not generated yet.';
            finalizeBtn.textContent = 'Finalize Submission & Generate PDF';
        }
    });
})();
