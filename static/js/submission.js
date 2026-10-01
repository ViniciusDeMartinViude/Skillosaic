(() => {
    'use strict';

    const STORAGE_PREFIX = 'skillosaic.submission.v1.';
    const LAST_TOKEN_KEY = 'skillosaic.submission.lastToken.v1';

    const fab = document.getElementById('submission-fab');
    const overlay = document.getElementById('submission-modal-overlay');
    const modal = document.getElementById('submission-modal');
    const closeBtn = document.getElementById('submission-modal-close');
    const tokenInput = document.getElementById('submission-token');
    const openTokenBtn = document.getElementById('submission-open-token');
    const tokenStatus = document.getElementById('submission-token-status');
    const workspace = document.getElementById('submission-workspace');
    const currentTokenEl = document.getElementById('submission-current-token');
    const saveStateEl = document.getElementById('submission-save-state');
    const saveDraftBtn = document.getElementById('submission-save-draft');

    const stationNumberInput = document.getElementById('submission-station-number');
    const fullNameInput = document.getElementById('submission-full-name');
    const atsSchoolInput = document.getElementById('submission-ats-school');
    const dateInput = document.getElementById('submission-date');
    const registrationImageInput = document.getElementById('submission-registration-image');
    const ppeYesBtn = document.getElementById('submission-ppe-yes');
    const ppeNoBtn = document.getElementById('submission-ppe-no');

    const captureMosaicBtn = document.getElementById('submission-capture-mosaic');
    const captureStatusEl = document.getElementById('submission-capture-status');
    const capturedAnalysisEl = document.getElementById('submission-captured-analysis');
    const originalImageEl = document.getElementById('submission-original-image');
    const mosaicImageEl = document.getElementById('submission-mosaic-image');
    const analysisSettingsEl = document.getElementById('submission-analysis-settings');
    const paletteCountEl = document.getElementById('submission-palette-count');
    const paletteListEl = document.getElementById('submission-palette-list');

    const capturePaintBtn = document.getElementById('submission-capture-paint');
    const paintCaptureStatusEl = document.getElementById('submission-paint-capture-status');
    const capturedPaintEl = document.getElementById('submission-captured-paint');
    const paintSourceImageEl = document.getElementById('submission-paint-source-image');
    const paintKmeansImageEl = document.getElementById('submission-paint-kmeans-image');
    const paintSettingsEl = document.getElementById('submission-paint-settings');
    const paintCameraSettingsEl = document.getElementById('submission-paint-camera-settings');
    const paintFormulationCountEl = document.getElementById('submission-paint-formulation-count');
    const paintFormulationListEl = document.getElementById('submission-paint-formulation-list');
    const manualPaintCaptureEl = document.getElementById('submission-manual-paint-capture');
    const manualPaintSwatchEl = document.getElementById('submission-manual-paint-swatch');
    const manualPaintDataEl = document.getElementById('submission-manual-paint-data');

    const captureTestColorBtn = document.getElementById('submission-capture-test-color');
    const testColorCaptureStatusEl = document.getElementById('submission-test-color-status');
    const testColorResultEl = document.getElementById('submission-test-color-result');
    const testColorSwatchEl = document.getElementById('submission-test-color-swatch');
    const testColorLabelEl = document.getElementById('submission-test-color-label');
    const testColorCoverageEl = document.getElementById('submission-test-color-coverage');
    const testColorDeltaEEl = document.getElementById('submission-test-color-deltae');
    const testColorCameraLabEl = document.getElementById('submission-test-color-camera-lab');
    const testColorTargetLabEl = document.getElementById('submission-test-color-target-lab');
    const testColorPredictedLabEl = document.getElementById('submission-test-color-predicted-lab');
    const testColorRedPercentEl = document.getElementById('submission-test-color-red-percent');
    const testColorYellowPercentEl = document.getElementById('submission-test-color-yellow-percent');
    const testColorBluePercentEl = document.getElementById('submission-test-color-blue-percent');
    const testColorRedGramsEl = document.getElementById('submission-test-color-red-grams');
    const testColorYellowGramsEl = document.getElementById('submission-test-color-yellow-grams');
    const testColorBlueGramsEl = document.getElementById('submission-test-color-blue-grams');
    const testColorTotalEl = document.getElementById('submission-test-color-total');
    const testColorSourceEl = document.getElementById('submission-test-color-source');

    const weighingTargetEl = document.getElementById('submission-weighing-target');
    const weighingTargetSwatchEl = document.getElementById('submission-weighing-target-swatch');
    const weighingTargetLabelEl = document.getElementById('submission-weighing-target-label');
    const weighingTargetTotalEl = document.getElementById('submission-weighing-target-total');
    const weighingStatusEl = document.getElementById('submission-weighing-status');
    const weighingPaintsEl = document.getElementById('submission-weighing-paints');
    const weighingConfirmationLabelEl = document.getElementById('submission-weighing-confirmation-label');
    const weighingConfirmationTimeEl = document.getElementById('submission-weighing-confirmation-time');
    const requestExpertConfirmationBtn = document.getElementById('submission-request-expert-confirmation');

    const expertWeighingOverlay = document.getElementById('expert-weighing-modal-overlay');
    const expertWeighingCloseBtn = document.getElementById('expert-weighing-modal-close');
    const expertWeighingSummaryEl = document.getElementById('expert-weighing-summary');
    const expertWeighingConfirmBtn = document.getElementById('expert-weighing-confirm');
    const expertWeighingRejectBtn = document.getElementById('expert-weighing-reject');

    const verificationTargetEl = document.getElementById('submission-verification-target');
    const verificationTargetSwatchEl = document.getElementById('submission-verification-target-swatch');
    const verificationTargetLabelEl = document.getElementById('submission-verification-target-label');
    const verificationTargetLabEl = document.getElementById('submission-verification-target-lab');
    const verificationStatusEl = document.getElementById('submission-verification-status');
    const verificationLInput = document.getElementById('submission-verification-L');
    const verificationAInput = document.getElementById('submission-verification-a');
    const verificationBInput = document.getElementById('submission-verification-b');
    const verificationCalculateBtn = document.getElementById('submission-calculate-verification');
    const verificationResultEl = document.getElementById('submission-verification-result');
    const verificationDesiredSwatchEl = document.getElementById('submission-verification-desired-swatch');
    const verificationMeasuredSwatchEl = document.getElementById('submission-verification-measured-swatch');
    const verificationDesiredLabEl = document.getElementById('submission-verification-desired-lab');
    const verificationMeasuredLabEl = document.getElementById('submission-verification-measured-lab');
    const verificationDeltaEEl = document.getElementById('submission-verification-deltae');
    const verificationScoreEl = document.getElementById('submission-verification-score');

    if (!fab || !overlay || !modal) return;

    let currentDraft = null;
    let previousFocus = null;
    let ppeConfirmation = '';
    let isPopulatingIdentification = false;
    let autoSaveTimer = null;
    let expertWeighingPreviousFocus = null;

    const PAINT_CODE_PATTERN = /^[A-Z]\d{4}[A-Z]$/;
    const VERIFICATION_MAX_DELTA_E00 = 100;
    const PAINT_META = {
        red: {label:'Red', cssClass:'red'},
        yellow: {label:'Yellow', cssClass:'yellow'},
        blue: {label:'Blue', cssClass:'blue'}
    };

    function nowIso() {
        return new Date().toISOString();
    }

    function normalizeToken(value) {
        return String(value || '').trim();
    }

    function storageKeyForToken(token) {
        return STORAGE_PREFIX + encodeURIComponent(token);
    }

    function safeReadJson(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[Skillosaic] Could not read local submission draft:', error);
            return null;
        }
    }

    function safeWriteJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('[Skillosaic] Could not save local submission draft:', error);
            return false;
        }
    }

    function createDraft(token) {
        const timestamp = nowIso();
        return {
            version: 1,
            token,
            createdAt: timestamp,
            updatedAt: timestamp,
            fields: {
                identification: {
                    stationNumber: '',
                    fullName: '',
                    atsSchool: '',
                    date: '',
                    registrationOrImageName: '',
                    ppeConfirmation: ''
                },
                imageKMeansPalette: null,
                paintFormulation: null,
                testColor: null,
                weighing: null,
                verification: null
            }
        };
    }

    function loadOrCreateDraft(token) {
        const key = storageKeyForToken(token);
        let draft = safeReadJson(key);
        let created = false;

        if (
            !draft ||
            typeof draft !== 'object' ||
            draft.version !== 1 ||
            normalizeToken(draft.token) !== token
        ) {
            draft = createDraft(token);
            created = true;
            safeWriteJson(key, draft);
        }

        return { draft, created };
    }

    function saveCurrentDraft() {
        if (!currentDraft) return false;

        currentDraft.updatedAt = nowIso();
        const saved = safeWriteJson(storageKeyForToken(currentDraft.token), currentDraft);

        if (saved) {
            try {
                localStorage.setItem(LAST_TOKEN_KEY, currentDraft.token);
            } catch (error) {
                console.warn('[Skillosaic] Could not remember last submission token:', error);
            }

            saveStateEl.textContent = 'Saved locally';
            saveStateEl.classList.remove('is-error');
            saveStateEl.classList.add('is-saved');
        } else {
            saveStateEl.textContent = 'Could not save';
            saveStateEl.classList.remove('is-saved');
            saveStateEl.classList.add('is-error');
        }

        return saved;
    }

    function setPpeSelection(value) {
        ppeConfirmation = value === 'yes' || value === 'no' ? value : '';

        [
            [ppeYesBtn, 'yes'],
            [ppeNoBtn, 'no']
        ].forEach(([button, buttonValue]) => {
            if (!button) return;
            const selected = ppeConfirmation === buttonValue;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    }

    function getIdentificationFromForm() {
        return {
            stationNumber: stationNumberInput ? stationNumberInput.value : '',
            fullName: fullNameInput ? fullNameInput.value.trim() : '',
            atsSchool: atsSchoolInput ? atsSchoolInput.value : '',
            date: dateInput ? dateInput.value : '',
            registrationOrImageName: registrationImageInput ? registrationImageInput.value.trim() : '',
            ppeConfirmation
        };
    }

    function populateIdentificationForm(identification = {}) {
        isPopulatingIdentification = true;

        if (stationNumberInput) stationNumberInput.value = identification.stationNumber || '';
        if (fullNameInput) fullNameInput.value = identification.fullName || '';
        if (atsSchoolInput) atsSchoolInput.value = identification.atsSchool || '';
        if (dateInput) dateInput.value = identification.date || '';
        if (registrationImageInput) {
            registrationImageInput.value = identification.registrationOrImageName || '';
        }
        setPpeSelection(identification.ppeConfirmation || '');

        isPopulatingIdentification = false;
    }

    function syncIdentificationToDraft() {
        if (!currentDraft) return;

        currentDraft.fields = currentDraft.fields && typeof currentDraft.fields === 'object'
            ? currentDraft.fields
            : {};

        currentDraft.fields.identification = getIdentificationFromForm();
    }

    function markDraftChanged() {
        if (!currentDraft || isPopulatingIdentification) return;

        saveStateEl.textContent = 'Saving…';
        saveStateEl.classList.remove('is-saved', 'is-error');

        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            syncIdentificationToDraft();
            saveCurrentDraft();
        }, 250);
    }

    function saveIdentificationNow() {
        if (!currentDraft) return false;
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
        syncIdentificationToDraft();
        return saveCurrentDraft();
    }

    function clearCapturedAnalysisView() {
        if (capturedAnalysisEl) capturedAnalysisEl.hidden = true;
        if (originalImageEl) originalImageEl.removeAttribute('src');
        if (mosaicImageEl) mosaicImageEl.removeAttribute('src');
        if (analysisSettingsEl) analysisSettingsEl.innerHTML = '';
        if (paletteListEl) paletteListEl.innerHTML = '';
        if (paletteCountEl) paletteCountEl.textContent = '';
    }

    function renderCapturedAnalysis(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            clearCapturedAnalysisView();
            if (captureStatusEl) {
                captureStatusEl.textContent = 'No Mosaic & Contours result captured yet.';
                captureStatusEl.classList.remove('is-success', 'is-error');
            }
            if (captureMosaicBtn) captureMosaicBtn.textContent = 'Capture from Mosaic & Contours';
            return;
        }

        if (capturedAnalysisEl) capturedAnalysisEl.hidden = false;

        if (originalImageEl && snapshot.originalImage && snapshot.originalImage.dataUrl) {
            originalImageEl.src = snapshot.originalImage.dataUrl;
        }
        if (mosaicImageEl && snapshot.resultImage && snapshot.resultImage.dataUrl) {
            mosaicImageEl.src = snapshot.resultImage.dataUrl;
        }

        if (analysisSettingsEl) {
            analysisSettingsEl.innerHTML = '';
            const settings = snapshot.settings || {};
            const selectedClusters = Array.isArray(settings.selectedClusters)
                ? settings.selectedClusters
                : [];
            const selectionLabel = selectedClusters.length
                ? selectedClusters.map(index => `C${index + 1}`).join(', ')
                : 'All';

            const items = [
                ['Image', snapshot.sourceFileName || `${snapshot.imageWidth || '?'} × ${snapshot.imageHeight || '?'} px`],
                ['Black L <', settings.blackThresholdL ?? '—'],
                ['White L >', settings.whiteThresholdL ?? '—'],
                ['Smoothing', settings.smoothingRadius ?? '—'],
                ['Line', settings.lineThickness ?? '—'],
                ['View', settings.contoursEnabled ? 'Contours' : 'Mosaic'],
                ['Selection', selectionLabel]
            ];

            items.forEach(([label, value]) => {
                const chip = document.createElement('div');
                chip.className = 'submission-analysis-chip';

                const labelEl = document.createElement('span');
                labelEl.textContent = label;

                const valueEl = document.createElement('strong');
                valueEl.textContent = String(value);

                chip.append(labelEl, valueEl);
                analysisSettingsEl.appendChild(chip);
            });
        }

        const palette = Array.isArray(snapshot.palette) ? snapshot.palette : [];
        if (paletteCountEl) paletteCountEl.textContent = `${palette.length} captured colors`;

        if (paletteListEl) {
            paletteListEl.innerHTML = '';

            palette.forEach((color, orderIndex) => {
                const row = document.createElement('div');
                row.className = 'submission-palette-row';

                const swatch = document.createElement('div');
                swatch.className = 'submission-palette-swatch';
                const rgb = Array.isArray(color.rgb) ? color.rgb : [0, 0, 0];
                swatch.style.background = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

                const name = document.createElement('div');
                name.className = 'submission-palette-name';
                name.textContent = color.label || `Color ${orderIndex + 1}`;

                const lab = document.createElement('div');
                lab.className = 'submission-palette-lab';
                const values = color.lab || {};
                lab.textContent =
                    `L ${Number(values.L ?? 0).toFixed(2)} · ` +
                    `a ${Number(values.a ?? 0).toFixed(2)} · ` +
                    `b ${Number(values.b ?? 0).toFixed(2)}`;

                const coverage = document.createElement('div');
                coverage.className = 'submission-palette-coverage';
                coverage.textContent = `${Number(color.coveragePercent ?? 0).toFixed(1)}%`;

                row.append(swatch, name, lab, coverage);
                paletteListEl.appendChild(row);
            });
        }

        const capturedAt = snapshot.capturedAt ? new Date(snapshot.capturedAt) : null;
        if (captureStatusEl) {
            captureStatusEl.textContent = capturedAt && !Number.isNaN(capturedAt.getTime())
                ? `Captured from Mosaic & Contours · ${capturedAt.toLocaleString()}`
                : 'Captured from Mosaic & Contours.';
            captureStatusEl.classList.remove('is-error');
            captureStatusEl.classList.add('is-success');
        }

        if (captureMosaicBtn) captureMosaicBtn.textContent = 'Recapture from Mosaic & Contours';
    }

    function captureMosaicAnalysis() {
        if (!currentDraft) return;

        const mosaicApi = window.SkillosaicMosaic;
        if (!mosaicApi || typeof mosaicApi.getSubmissionSnapshot !== 'function') {
            captureStatusEl.textContent = 'Mosaic & Contours capture is not available.';
            captureStatusEl.classList.remove('is-success');
            captureStatusEl.classList.add('is-error');
            return;
        }

        const snapshot = mosaicApi.getSubmissionSnapshot();
        if (!snapshot) {
            captureStatusEl.textContent =
                'No completed Mosaic & Contours analysis found. Load an image and wait for K-Means to finish, then capture again.';
            captureStatusEl.classList.remove('is-success');
            captureStatusEl.classList.add('is-error');
            return;
        }

        syncIdentificationToDraft();
        currentDraft.fields = currentDraft.fields && typeof currentDraft.fields === 'object'
            ? currentDraft.fields
            : {};
        currentDraft.fields.imageKMeansPalette = snapshot;

        const saved = saveCurrentDraft();
        renderCapturedAnalysis(snapshot);

        if (!saved) {
            captureStatusEl.textContent =
                'The analysis was captured in memory, but the browser could not save it to local storage.';
            captureStatusEl.classList.remove('is-success');
            captureStatusEl.classList.add('is-error');
        }
    }

    function formatLabValues(values) {
        if (!Array.isArray(values) || values.length < 3) return '—';
        return `L* ${Number(values[0]).toFixed(2)} · a* ${Number(values[1]).toFixed(2)} · b* ${Number(values[2]).toFixed(2)}`;
    }

    function addAnalysisChip(container,label,value) {
        if (!container) return;
        const chip=document.createElement('div');
        chip.className='submission-analysis-chip';

        const labelEl=document.createElement('span');
        labelEl.textContent=label;

        const valueEl=document.createElement('strong');
        valueEl.textContent=value === null || value === undefined || value === '' ? '—' : String(value);

        chip.append(labelEl,valueEl);
        container.appendChild(chip);
    }

    function clearCapturedPaintView() {
        if (capturedPaintEl) capturedPaintEl.hidden=true;
        if (paintSourceImageEl) paintSourceImageEl.removeAttribute('src');
        if (paintKmeansImageEl) paintKmeansImageEl.removeAttribute('src');
        if (paintSettingsEl) paintSettingsEl.innerHTML='';
        if (paintCameraSettingsEl) paintCameraSettingsEl.innerHTML='';
        if (paintFormulationListEl) paintFormulationListEl.innerHTML='';
        if (paintFormulationCountEl) paintFormulationCountEl.textContent='';
        if (manualPaintCaptureEl) manualPaintCaptureEl.hidden=true;
        if (manualPaintDataEl) manualPaintDataEl.innerHTML='';
        if (manualPaintSwatchEl) manualPaintSwatchEl.style.background='';
    }

    function renderCapturedPaint(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            clearCapturedPaintView();
            if (paintCaptureStatusEl) {
                paintCaptureStatusEl.textContent='No Paint Formulation result captured yet.';
                paintCaptureStatusEl.classList.remove('is-success','is-error');
            }
            if (capturePaintBtn) capturePaintBtn.textContent='Capture from Paint Formulation';
            return;
        }

        if (capturedPaintEl) capturedPaintEl.hidden=false;

        if (paintSourceImageEl && snapshot.source && snapshot.source.image && snapshot.source.image.dataUrl) {
            paintSourceImageEl.src=snapshot.source.image.dataUrl;
        }
        if (paintKmeansImageEl && snapshot.kMeans && snapshot.kMeans.resultImage && snapshot.kMeans.resultImage.dataUrl) {
            paintKmeansImageEl.src=snapshot.kMeans.resultImage.dataUrl;
        }

        if (paintSettingsEl) {
            paintSettingsEl.innerHTML='';
            addAnalysisChip(paintSettingsEl,'Source',snapshot.source ? `${snapshot.source.kind || 'image'} · ${snapshot.source.name || ''}` : '—');
            addAnalysisChip(paintSettingsEl,'K-Means',snapshot.kMeans ? snapshot.kMeans.colors : '—');
            addAnalysisChip(paintSettingsEl,'Total paint',Number(snapshot.totalPaintGrams || 0).toFixed(0)+' g');
            addAnalysisChip(paintSettingsEl,'Brightness',snapshot.imageAdjustments ? snapshot.imageAdjustments.brightness : '—');
            addAnalysisChip(paintSettingsEl,'Contrast',snapshot.imageAdjustments ? snapshot.imageAdjustments.contrast : '—');
        }

        if (paintCameraSettingsEl) {
            paintCameraSettingsEl.innerHTML='';
            const camera=snapshot.camera || {};
            const actual=camera.actualSettings || {};
            const requested=camera.requestedControls || {};

            if (camera.selectedCameraLabel) addAnalysisChip(paintCameraSettingsEl,'Camera',camera.selectedCameraLabel);
            if (actual.width && actual.height) addAnalysisChip(paintCameraSettingsEl,'Resolution',`${actual.width} × ${actual.height}`);
            if (actual.focusMode || requested.focusMode) {
                addAnalysisChip(
                    paintCameraSettingsEl,
                    'Focus',
                    [actual.focusMode || requested.focusMode, actual.focusDistance ?? requested.focusDistance]
                        .filter(value=>value !== null && value !== undefined && value !== '')
                        .join(' · ')
                );
            }
            if (actual.exposureMode || requested.exposureMode) {
                const exposureValue =
                    actual.exposureTime ??
                    actual.exposureCompensation ??
                    (requested.exposureControl ? requested.exposureControl.value : null);
                addAnalysisChip(
                    paintCameraSettingsEl,
                    'Exposure',
                    [actual.exposureMode || requested.exposureMode, exposureValue]
                        .filter(value=>value !== null && value !== undefined && value !== '')
                        .join(' · ')
                );
            }
            if (actual.whiteBalanceMode || requested.whiteBalanceMode || actual.colorTemperature || requested.colorTemperature) {
                addAnalysisChip(
                    paintCameraSettingsEl,
                    'White balance',
                    [
                        actual.whiteBalanceMode || requested.whiteBalanceMode,
                        actual.colorTemperature ?? requested.colorTemperature
                    ]
                        .filter(value=>value !== null && value !== undefined && value !== '')
                        .join(' · ')
                );
            }
        }

        const formulations=Array.isArray(snapshot.formulations) ? snapshot.formulations : [];
        if (paintFormulationCountEl) {
            paintFormulationCountEl.textContent=`${formulations.length} captured formulations`;
        }

        if (paintFormulationListEl) {
            paintFormulationListEl.innerHTML='';

            formulations.forEach((row,index)=>{
                const card=document.createElement('div');
                card.className='submission-paint-formulation-card';

                const header=document.createElement('div');
                header.className='submission-paint-formulation-header';

                const swatch=document.createElement('div');
                swatch.className='submission-palette-swatch submission-paint-formulation-swatch';
                const rgb=Array.isArray(row.rgb) ? row.rgb : [0,0,0];
                swatch.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

                const title=document.createElement('div');
                title.className='submission-paint-formulation-title';
                const titleStrong=document.createElement('strong');
                titleStrong.textContent=row.label || `Color ${index+1}`;
                const titleSmall=document.createElement('span');
                titleSmall.textContent=`${Number(row.coveragePercent || 0).toFixed(1)}% coverage · RGB ${rgb.join(', ')}`;
                title.append(titleStrong,titleSmall);

                const delta=document.createElement('div');
                delta.className='submission-paint-delta';
                delta.textContent=`ΔE00 ${Number(row.formulation?.predictedDeltaE00 || 0).toFixed(2)}`;

                header.append(swatch,title,delta);

                const labs=document.createElement('div');
                labs.className='submission-paint-labs';
                const cameraLab=document.createElement('div');
                cameraLab.innerHTML='<span>Camera LAB</span>';
                const cameraLabStrong=document.createElement('strong');
                cameraLabStrong.textContent=formatLabValues(row.cameraLab);
                cameraLab.appendChild(cameraLabStrong);

                const nixLab=document.createElement('div');
                nixLab.innerHTML='<span>Nix-equivalent LAB</span>';
                const nixLabStrong=document.createElement('strong');
                nixLabStrong.textContent=formatLabValues(row.nixEquivalentLab);
                nixLab.appendChild(nixLabStrong);

                const predictedLab=document.createElement('div');
                predictedLab.innerHTML='<span>Predicted LAB</span>';
                const predictedLabStrong=document.createElement('strong');
                predictedLabStrong.textContent=formatLabValues(row.formulation?.predictedLab);
                predictedLab.appendChild(predictedLabStrong);
                labs.append(cameraLab,nixLab,predictedLab);

                const recipe=document.createElement('div');
                recipe.className='submission-paint-recipe';
                const percentages=row.formulation?.recipePercent || {};
                const grams=row.formulation?.grams || {};
                [
                    ['Red',percentages.red,grams.red],
                    ['Yellow',percentages.yellow,grams.yellow],
                    ['Blue',percentages.blue,grams.blue]
                ].forEach(([name,percent,weight])=>{
                    const item=document.createElement('div');
                    const nameEl=document.createElement('span');
                    nameEl.textContent=name;
                    const pctEl=document.createElement('strong');
                    pctEl.textContent=`${Number(percent || 0).toFixed(1)}%`;
                    const gramsEl=document.createElement('b');
                    gramsEl.textContent=`${Number(weight || 0).toFixed(2)} g`;
                    item.append(nameEl,pctEl,gramsEl);
                    recipe.appendChild(item);
                });

                const source=document.createElement('div');
                source.className='submission-paint-model-source';
                source.textContent=row.formulation?.source || '';

                card.append(header,labs,recipe,source);
                paintFormulationListEl.appendChild(card);
            });
        }

        const manual=snapshot.manualLab;
        if (manual && manual.formulation) {
            if (manualPaintCaptureEl) manualPaintCaptureEl.hidden=false;
            if (manualPaintSwatchEl && Array.isArray(manual.targetPreviewRgb)) {
                manualPaintSwatchEl.style.background=
                    `rgb(${manual.targetPreviewRgb[0]}, ${manual.targetPreviewRgb[1]}, ${manual.targetPreviewRgb[2]})`;
            }

            if (manualPaintDataEl) {
                manualPaintDataEl.innerHTML='';

                const target=document.createElement('div');
                target.className='submission-manual-paint-line';
                target.innerHTML='<span>Target LAB</span>';
                const targetStrong=document.createElement('strong');
                targetStrong.textContent=formatLabValues(manual.targetLab);
                target.appendChild(targetStrong);

                const predicted=document.createElement('div');
                predicted.className='submission-manual-paint-line';
                predicted.innerHTML='<span>Predicted LAB</span>';
                const predictedStrong=document.createElement('strong');
                predictedStrong.textContent=formatLabValues(manual.formulation.predictedLab);
                predicted.appendChild(predictedStrong);

                const delta=document.createElement('div');
                delta.className='submission-manual-paint-line';
                delta.innerHTML='<span>Predicted ΔE00</span>';
                const deltaStrong=document.createElement('strong');
                deltaStrong.textContent=Number(manual.formulation.predictedDeltaE00 || 0).toFixed(2);
                delta.appendChild(deltaStrong);

                const recipe=document.createElement('div');
                recipe.className='submission-paint-recipe compact';
                const percentages=manual.formulation.recipePercent || {};
                const weights=manual.formulation.grams || {};
                [
                    ['Red',percentages.red,weights.red],
                    ['Yellow',percentages.yellow,weights.yellow],
                    ['Blue',percentages.blue,weights.blue]
                ].forEach(([name,percent,weight])=>{
                    const item=document.createElement('div');
                    const nameEl=document.createElement('span');
                    nameEl.textContent=name;
                    const pctEl=document.createElement('strong');
                    pctEl.textContent=`${Number(percent || 0).toFixed(1)}%`;
                    const gramsEl=document.createElement('b');
                    gramsEl.textContent=`${Number(weight || 0).toFixed(2)} g`;
                    item.append(nameEl,pctEl,gramsEl);
                    recipe.appendChild(item);
                });

                const source=document.createElement('div');
                source.className='submission-paint-model-source';
                source.textContent=manual.formulation.source || '';

                manualPaintDataEl.append(target,predicted,delta,recipe,source);
            }
        } else if (manualPaintCaptureEl) {
            manualPaintCaptureEl.hidden=true;
        }

        const capturedAt=snapshot.capturedAt ? new Date(snapshot.capturedAt) : null;
        if (paintCaptureStatusEl) {
            paintCaptureStatusEl.textContent=capturedAt && !Number.isNaN(capturedAt.getTime())
                ? `Captured from Paint Formulation · ${capturedAt.toLocaleString()}`
                : 'Captured from Paint Formulation.';
            paintCaptureStatusEl.classList.remove('is-error');
            paintCaptureStatusEl.classList.add('is-success');
        }

        if (capturePaintBtn) capturePaintBtn.textContent='Recapture from Paint Formulation';
    }

    function capturePaintFormulation() {
        if (!currentDraft) return;

        const paintApi=window.SkillosaicPaint;
        if (!paintApi || typeof paintApi.getSubmissionSnapshot!=='function') {
            paintCaptureStatusEl.textContent='Paint Formulation capture is not available.';
            paintCaptureStatusEl.classList.remove('is-success');
            paintCaptureStatusEl.classList.add('is-error');
            return;
        }

        const snapshot=paintApi.getSubmissionSnapshot();
        if (!snapshot) {
            paintCaptureStatusEl.textContent=
                'No completed Paint Formulation analysis found. Analyze an image or camera capture first, then capture again.';
            paintCaptureStatusEl.classList.remove('is-success');
            paintCaptureStatusEl.classList.add('is-error');
            return;
        }

        syncIdentificationToDraft();
        currentDraft.fields=currentDraft.fields && typeof currentDraft.fields==='object'
            ? currentDraft.fields
            : {};
        currentDraft.fields.paintFormulation=snapshot;

        const saved=saveCurrentDraft();
        renderCapturedPaint(snapshot);

        if (!saved) {
            paintCaptureStatusEl.textContent=
                'The Paint Formulation result was captured in memory, but the browser could not save it to local storage.';
            paintCaptureStatusEl.classList.remove('is-success');
            paintCaptureStatusEl.classList.add('is-error');
        }
    }

    function clearTestColorView() {
        if (testColorResultEl) testColorResultEl.hidden=true;
        if (testColorSwatchEl) testColorSwatchEl.style.background='';
        if (testColorLabelEl) testColorLabelEl.textContent='—';
        if (testColorCoverageEl) testColorCoverageEl.textContent='—';
        if (testColorDeltaEEl) testColorDeltaEEl.textContent='—';
        if (testColorCameraLabEl) testColorCameraLabEl.textContent='—';
        if (testColorTargetLabEl) testColorTargetLabEl.textContent='—';
        if (testColorPredictedLabEl) testColorPredictedLabEl.textContent='—';
        if (testColorRedPercentEl) testColorRedPercentEl.textContent='—';
        if (testColorYellowPercentEl) testColorYellowPercentEl.textContent='—';
        if (testColorBluePercentEl) testColorBluePercentEl.textContent='—';
        if (testColorRedGramsEl) testColorRedGramsEl.textContent='—';
        if (testColorYellowGramsEl) testColorYellowGramsEl.textContent='—';
        if (testColorBlueGramsEl) testColorBlueGramsEl.textContent='—';
        if (testColorTotalEl) testColorTotalEl.textContent='—';
        if (testColorSourceEl) testColorSourceEl.textContent='—';
    }

    function renderCapturedTestColor(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            clearTestColorView();
            if (testColorCaptureStatusEl) {
                testColorCaptureStatusEl.textContent='No test color captured yet.';
                testColorCaptureStatusEl.classList.remove('is-success','is-error');
            }
            if (captureTestColorBtn) captureTestColorBtn.textContent='Capture selected test color';
            return;
        }

        if (testColorResultEl) testColorResultEl.hidden=false;

        const rgb=Array.isArray(snapshot.rgb) ? snapshot.rgb : [0,0,0];
        if (testColorSwatchEl) {
            testColorSwatchEl.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
        if (testColorLabelEl) testColorLabelEl.textContent=snapshot.label || 'Selected color';
        if (testColorCoverageEl) {
            testColorCoverageEl.textContent=
                `${Number(snapshot.coveragePercent || 0).toFixed(1)}% coverage · RGB ${rgb.join(', ')}`;
        }

        const formulation=snapshot.formulation || {};
        const percentages=formulation.recipePercent || {};
        const grams=formulation.grams || {};

        if (testColorDeltaEEl) {
            testColorDeltaEEl.textContent=Number(formulation.predictedDeltaE00 || 0).toFixed(2);
        }
        if (testColorCameraLabEl) testColorCameraLabEl.textContent=formatLabValues(snapshot.cameraLab);
        if (testColorTargetLabEl) {
            testColorTargetLabEl.textContent=formatLabValues(snapshot.targetLab || snapshot.nixEquivalentLab);
        }
        if (testColorPredictedLabEl) {
            testColorPredictedLabEl.textContent=formatLabValues(formulation.predictedLab);
        }

        if (testColorRedPercentEl) testColorRedPercentEl.textContent=`${Number(percentages.red || 0).toFixed(1)}%`;
        if (testColorYellowPercentEl) testColorYellowPercentEl.textContent=`${Number(percentages.yellow || 0).toFixed(1)}%`;
        if (testColorBluePercentEl) testColorBluePercentEl.textContent=`${Number(percentages.blue || 0).toFixed(1)}%`;

        if (testColorRedGramsEl) testColorRedGramsEl.textContent=`${Number(grams.red || 0).toFixed(2)} g`;
        if (testColorYellowGramsEl) testColorYellowGramsEl.textContent=`${Number(grams.yellow || 0).toFixed(2)} g`;
        if (testColorBlueGramsEl) testColorBlueGramsEl.textContent=`${Number(grams.blue || 0).toFixed(2)} g`;

        if (testColorTotalEl) {
            testColorTotalEl.textContent=`Total paint: ${Number(snapshot.totalPaintGrams || 0).toFixed(0)} g`;
        }
        if (testColorSourceEl) testColorSourceEl.textContent=formulation.source || '';

        const selectedAt=snapshot.selectedAt ? new Date(snapshot.selectedAt) : null;
        if (testColorCaptureStatusEl) {
            testColorCaptureStatusEl.textContent=selectedAt && !Number.isNaN(selectedAt.getTime())
                ? `${snapshot.label || 'Test color'} captured · selected ${selectedAt.toLocaleString()}`
                : `${snapshot.label || 'Test color'} captured from Paint Formulation.`;
            testColorCaptureStatusEl.classList.remove('is-error');
            testColorCaptureStatusEl.classList.add('is-success');
        }

        if (captureTestColorBtn) captureTestColorBtn.textContent='Recapture selected test color';
    }

    function captureSelectedTestColor() {
        if (!currentDraft) return;

        const paintApi=window.SkillosaicPaint;
        if (!paintApi || typeof paintApi.getSelectedTestColor!=='function') {
            testColorCaptureStatusEl.textContent='Test-color selection is not available.';
            testColorCaptureStatusEl.classList.remove('is-success');
            testColorCaptureStatusEl.classList.add('is-error');
            return;
        }

        const snapshot=paintApi.getSelectedTestColor();
        if (!snapshot) {
            testColorCaptureStatusEl.textContent=
                'No test color selected. In Paint Formulation, analyze an image and click “Set as test color” on one formulation card.';
            testColorCaptureStatusEl.classList.remove('is-success');
            testColorCaptureStatusEl.classList.add('is-error');
            return;
        }

        syncIdentificationToDraft();
        currentDraft.fields=currentDraft.fields && typeof currentDraft.fields==='object'
            ? currentDraft.fields
            : {};
        currentDraft.fields.testColor=snapshot;
        currentDraft.fields.weighing=null;
        currentDraft.fields.verification=null;

        const saved=saveCurrentDraft();
        renderCapturedTestColor(snapshot);
        renderWeighing(snapshot,null);
        renderVerification(snapshot,null);

        if (!saved) {
            testColorCaptureStatusEl.textContent=
                'The selected test color was captured in memory, but the browser could not save it to local storage.';
            testColorCaptureStatusEl.classList.remove('is-success');
            testColorCaptureStatusEl.classList.add('is-error');
        }
    }

    function normalizePaintCode(value) {
        return String(value || '')
            .toUpperCase()
            .replace(/\s+/g,'')
            .slice(0,6);
    }

    function testColorSignature(testColor) {
        if (!testColor || typeof testColor !== 'object') return '';
        const recipe=testColor.formulation?.recipePercent || {};
        const target=Array.isArray(testColor.targetLab) ? testColor.targetLab : [];
        return JSON.stringify({
            index:testColor.index,
            target,
            totalPaintGrams:Number(testColor.totalPaintGrams || 0),
            red:Number(recipe.red || 0),
            yellow:Number(recipe.yellow || 0),
            blue:Number(recipe.blue || 0)
        });
    }

    function usedPaintsFromTestColor(testColor) {
        if (!testColor || !testColor.formulation) return [];
        const recipe=testColor.formulation.recipePercent || {};
        const grams=testColor.formulation.grams || {};

        return ['red','yellow','blue']
            .map(key=>({
                key,
                label:PAINT_META[key].label,
                percent:Number(recipe[key] || 0),
                grams:Number(grams[key] || 0)
            }));
    }

    function createWeighingState(testColor) {
        const paints={};
        usedPaintsFromTestColor(testColor).forEach(paint=>{
            paints[paint.key]={
                code:'',
                expectedGrams:paint.grams,
                recipePercent:paint.percent
            };
        });

        return {
            testColorSignature:testColorSignature(testColor),
            paints,
            confirmation:{
                status:'not_requested',
                requestedAt:null,
                confirmedAt:null,
                rejectedAt:null
            }
        };
    }

    function normalizeWeighingState(testColor,weighing) {
        const signature=testColorSignature(testColor);
        if (!signature) return null;

        if (
            !weighing ||
            typeof weighing!=='object' ||
            weighing.testColorSignature!==signature
        ) {
            return createWeighingState(testColor);
        }

        weighing.paints=weighing.paints && typeof weighing.paints==='object'
            ? weighing.paints
            : {};

        usedPaintsFromTestColor(testColor).forEach(paint=>{
            const existing=weighing.paints[paint.key] || {};
            weighing.paints[paint.key]={
                code:normalizePaintCode(existing.code || ''),
                expectedGrams:paint.grams,
                recipePercent:paint.percent
            };
        });

        weighing.confirmation=weighing.confirmation && typeof weighing.confirmation==='object'
            ? weighing.confirmation
            : {
                status:'not_requested',
                requestedAt:null,
                confirmedAt:null,
                rejectedAt:null
            };

        return weighing;
    }

    function allWeighingCodesValid(weighing,testColor) {
        if (!weighing || !testColor) return false;
        const paints=usedPaintsFromTestColor(testColor);
        if (!paints.length) return false;

        return paints.every(paint=>{
            const code=normalizePaintCode(weighing.paints?.[paint.key]?.code || '');
            return PAINT_CODE_PATTERN.test(code);
        });
    }

    function saveWeighingState(weighing) {
        if (!currentDraft) return false;
        currentDraft.fields=currentDraft.fields && typeof currentDraft.fields==='object'
            ? currentDraft.fields
            : {};
        currentDraft.fields.weighing=weighing;
        return saveCurrentDraft();
    }

    function updateWeighingStatus(testColor,weighing) {
        const confirmation=weighing?.confirmation || {};
        const status=confirmation.status || 'not_requested';
        const valid=allWeighingCodesValid(weighing,testColor);

        if (weighingStatusEl) {
            weighingStatusEl.classList.remove('is-success','is-error');

            if (!testColor) {
                weighingStatusEl.textContent='Capture a test color in Step 4 before entering paint codes.';
            } else if (status==='confirmed') {
                weighingStatusEl.textContent='Expert confirmed the paint codes and expected weights. Ready to mix.';
                weighingStatusEl.classList.add('is-success');
            } else if (status==='pending') {
                weighingStatusEl.textContent='Expert confirmation requested. Paint codes are locked until the Expert responds.';
            } else if (status==='rejected') {
                weighingStatusEl.textContent='Expert requested a correction. Review the paint cans, correct the codes, and request confirmation again.';
                weighingStatusEl.classList.add('is-error');
            } else if (valid) {
                weighingStatusEl.textContent='All required paint codes are valid. Ready to request Expert confirmation.';
                weighingStatusEl.classList.add('is-success');
            } else {
                weighingStatusEl.textContent='Enter a valid code for every paint used in the selected recipe.';
            }
        }

        if (weighingConfirmationLabelEl) {
            const labels={
                not_requested:'Not requested',
                pending:'Waiting for Expert',
                confirmed:'Confirmed by Expert',
                rejected:'Needs correction'
            };
            weighingConfirmationLabelEl.textContent=labels[status] || 'Not requested';
            weighingConfirmationLabelEl.className='';
            weighingConfirmationLabelEl.classList.add(`status-${status}`);
        }

        if (weighingConfirmationTimeEl) {
            let message='The Expert must check the paint codes and expected weights before mixing.';
            const timestamp=
                status==='confirmed' ? confirmation.confirmedAt :
                status==='rejected' ? confirmation.rejectedAt :
                status==='pending' ? confirmation.requestedAt :
                null;

            if (timestamp) {
                const date=new Date(timestamp);
                if (!Number.isNaN(date.getTime())) {
                    const prefix=
                        status==='confirmed' ? 'Confirmed' :
                        status==='rejected' ? 'Returned for correction' :
                        'Requested';
                    message=`${prefix} · ${date.toLocaleString()}`;
                }
            }
            weighingConfirmationTimeEl.textContent=message;
        }

        if (requestExpertConfirmationBtn) {
            if (!testColor) {
                requestExpertConfirmationBtn.disabled=true;
                requestExpertConfirmationBtn.textContent='Request Expert Confirmation';
            } else if (status==='confirmed') {
                requestExpertConfirmationBtn.disabled=true;
                requestExpertConfirmationBtn.textContent='Expert Confirmed';
            } else if (status==='pending') {
                requestExpertConfirmationBtn.disabled=false;
                requestExpertConfirmationBtn.textContent='Open Expert Check';
            } else {
                requestExpertConfirmationBtn.disabled=!valid;
                requestExpertConfirmationBtn.textContent=
                    status==='rejected' ? 'Request Expert Confirmation Again' : 'Request Expert Confirmation';
            }
        }
    }

    function renderWeighing(testColor,weighing) {
        if (!weighingPaintsEl) return;

        weighingPaintsEl.innerHTML='';

        if (!testColor) {
            if (weighingTargetEl) weighingTargetEl.hidden=true;
            updateWeighingStatus(null,null);
            return;
        }

        const normalized=normalizeWeighingState(testColor,weighing);
        currentDraft.fields.weighing=normalized;

        if (weighingTargetEl) weighingTargetEl.hidden=false;
        const rgb=Array.isArray(testColor.rgb) ? testColor.rgb : [0,0,0];
        if (weighingTargetSwatchEl) {
            weighingTargetSwatchEl.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
        if (weighingTargetLabelEl) weighingTargetLabelEl.textContent=testColor.label || 'Selected test color';
        if (weighingTargetTotalEl) {
            weighingTargetTotalEl.textContent=`Expected total: ${Number(testColor.totalPaintGrams || 0).toFixed(0)} g`;
        }

        const confirmationStatus=normalized.confirmation?.status || 'not_requested';
        const locked=confirmationStatus==='pending' || confirmationStatus==='confirmed';

        usedPaintsFromTestColor(testColor).forEach(paint=>{
            const item=document.createElement('div');
            item.className=`submission-weighing-paint ${PAINT_META[paint.key].cssClass}`;

            const colorMark=document.createElement('div');
            colorMark.className='submission-weighing-paint-mark';

            const info=document.createElement('div');
            info.className='submission-weighing-paint-info';
            const name=document.createElement('strong');
            name.textContent=paint.label;
            const recipe=document.createElement('span');
            recipe.textContent=`${paint.percent.toFixed(1)}% · expected ${paint.grams.toFixed(2)} g`;
            info.append(name,recipe);

            const field=document.createElement('label');
            field.className='submission-weighing-code-field';
            const fieldLabel=document.createElement('span');
            fieldLabel.textContent='Can code';
            const input=document.createElement('input');
            input.type='text';
            input.inputMode='text';
            input.autocomplete='off';
            input.spellcheck=false;
            input.maxLength=6;
            input.placeholder='A1234B';
            input.dataset.paintKey=paint.key;
            input.value=normalizePaintCode(normalized.paints?.[paint.key]?.code || '');
            input.disabled=locked;
            input.setAttribute('aria-label',`${paint.label} paint can code`);

            const validation=document.createElement('small');
            validation.className='submission-weighing-code-validation';

            const refreshValidation=()=>{
                const value=normalizePaintCode(input.value);
                input.value=value;
                const valid=PAINT_CODE_PATTERN.test(value);

                input.classList.toggle('is-valid',valid);
                input.classList.toggle('is-invalid',Boolean(value) && !valid);
                validation.textContent=
                    !value ? 'Required · format A1234B' :
                    valid ? 'Valid code' :
                    'Use 1 letter + 4 digits + 1 letter';

                normalized.paints[paint.key].code=value;

                if (
                    normalized.confirmation.status==='rejected' ||
                    normalized.confirmation.status==='not_requested'
                ) {
                    normalized.confirmation={
                        status:'not_requested',
                        requestedAt:null,
                        confirmedAt:null,
                        rejectedAt:null
                    };
                }

                saveWeighingState(normalized);
                updateWeighingStatus(testColor,normalized);
            };

            input.addEventListener('input',refreshValidation);
            input.addEventListener('blur',refreshValidation);

            const initialValid=PAINT_CODE_PATTERN.test(input.value);
            input.classList.toggle('is-valid',initialValid);
            input.classList.toggle('is-invalid',Boolean(input.value) && !initialValid);
            validation.textContent=
                !input.value ? 'Required · format A1234B' :
                initialValid ? 'Valid code' :
                'Use 1 letter + 4 digits + 1 letter';

            field.append(fieldLabel,input,validation);
            item.append(colorMark,info,field);
            weighingPaintsEl.appendChild(item);
        });

        updateWeighingStatus(testColor,normalized);
    }

    function populateExpertWeighingSummary(testColor,weighing) {
        if (!expertWeighingSummaryEl) return;
        expertWeighingSummaryEl.innerHTML='';

        const header=document.createElement('div');
        header.className='expert-weighing-target-row';

        const swatch=document.createElement('div');
        swatch.className='expert-weighing-target-swatch';
        const rgb=Array.isArray(testColor.rgb) ? testColor.rgb : [0,0,0];
        swatch.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

        const targetInfo=document.createElement('div');
        const targetTitle=document.createElement('strong');
        targetTitle.textContent=testColor.label || 'Test color';
        const targetTotal=document.createElement('span');
        targetTotal.textContent=`Expected total: ${Number(testColor.totalPaintGrams || 0).toFixed(0)} g`;
        targetInfo.append(targetTitle,targetTotal);
        header.append(swatch,targetInfo);
        expertWeighingSummaryEl.appendChild(header);

        const list=document.createElement('div');
        list.className='expert-weighing-paint-list';

        usedPaintsFromTestColor(testColor).forEach(paint=>{
            const row=document.createElement('div');
            row.className=`expert-weighing-paint-row ${paint.key}`;

            const name=document.createElement('strong');
            name.textContent=paint.label;

            const code=document.createElement('span');
            code.className='expert-weighing-code';
            code.textContent=normalizePaintCode(weighing.paints?.[paint.key]?.code || '');

            const weight=document.createElement('span');
            weight.className='expert-weighing-weight';
            weight.textContent=`${paint.grams.toFixed(2)} g`;

            row.append(name,code,weight);
            list.appendChild(row);
        });

        expertWeighingSummaryEl.appendChild(list);
    }

    function openExpertWeighingModal() {
        const testColor=currentDraft?.fields?.testColor;
        const weighing=currentDraft?.fields?.weighing;
        if (!testColor || !weighing || !allWeighingCodesValid(weighing,testColor)) return;

        expertWeighingPreviousFocus=document.activeElement;
        populateExpertWeighingSummary(testColor,weighing);
        expertWeighingOverlay.hidden=false;
        document.body.style.overflow='hidden';
        expertWeighingConfirmBtn.focus();
    }

    function closeExpertWeighingModal() {
        if (!expertWeighingOverlay || expertWeighingOverlay.hidden) return;
        expertWeighingOverlay.hidden=true;

        document.body.style.overflow=overlay && !overlay.hidden ? 'hidden' : '';

        if (expertWeighingPreviousFocus && typeof expertWeighingPreviousFocus.focus==='function') {
            expertWeighingPreviousFocus.focus();
        }
        expertWeighingPreviousFocus=null;
    }

    function requestExpertWeighingConfirmation() {
        const testColor=currentDraft?.fields?.testColor;
        if (!testColor) return;

        let weighing=normalizeWeighingState(testColor,currentDraft.fields.weighing);
        if (!allWeighingCodesValid(weighing,testColor)) {
            updateWeighingStatus(testColor,weighing);
            return;
        }

        if (weighing.confirmation.status!=='pending') {
            weighing.confirmation={
                status:'pending',
                requestedAt:nowIso(),
                confirmedAt:null,
                rejectedAt:null
            };
            saveWeighingState(weighing);
            renderWeighing(testColor,weighing);
        }

        openExpertWeighingModal();
    }

    function decideExpertWeighingConfirmation(decision) {
        const testColor=currentDraft?.fields?.testColor;
        let weighing=currentDraft?.fields?.weighing;
        if (!testColor || !weighing) return;

        if (decision==='confirmed') {
            weighing.confirmation={
                status:'confirmed',
                requestedAt:weighing.confirmation?.requestedAt || nowIso(),
                confirmedAt:nowIso(),
                rejectedAt:null
            };
        } else {
            weighing.confirmation={
                status:'rejected',
                requestedAt:weighing.confirmation?.requestedAt || nowIso(),
                confirmedAt:null,
                rejectedAt:nowIso()
            };
        }

        saveWeighingState(weighing);
        closeExpertWeighingModal();
        renderWeighing(testColor,weighing);
    }

    function verificationLabToRgb(lab) {
        if (!Array.isArray(lab) || lab.length < 3) return [238,242,246];
        const [L,a,b]=lab.map(Number);
        const fy=(L+16)/116;
        const fx=fy+a/500;
        const fz=fy-b/200;

        const invf=t=>{
            const t3=t*t*t;
            return t3>0.008856 ? t3 : (116*t-16)/903.3;
        };

        const X=0.95047*invf(fx);
        const Y=1.00000*invf(fy);
        const Z=1.08883*invf(fz);

        let r= 3.2404542*X - 1.5371385*Y - 0.4985314*Z;
        let g=-0.9692660*X + 1.8760108*Y + 0.0415560*Z;
        let bl=0.0556434*X - 0.2040259*Y + 1.0572252*Z;

        const gamma=v=>{
            const encoded=v<=0.0031308 ? 12.92*v : 1.055*Math.pow(Math.max(v,0),1/2.4)-0.055;
            return Math.round(Math.max(0,Math.min(1,encoded))*255);
        };

        return [gamma(r),gamma(g),gamma(bl)];
    }

    function verificationDeltaE00(lab1,lab2) {
        const sq=value=>value*value;
        const [L1,a1,b1]=lab1.map(Number);
        const [L2,a2,b2]=lab2.map(Number);
        const C1=Math.hypot(a1,b1);
        const C2=Math.hypot(a2,b2);
        const Cbar=(C1+C2)/2;
        const G=Cbar===0
            ? 0
            : 0.5*(1-Math.sqrt(Math.pow(Cbar,7)/(Math.pow(Cbar,7)+Math.pow(25,7))));
        const a1p=(1+G)*a1;
        const a2p=(1+G)*a2;
        const C1p=Math.hypot(a1p,b1);
        const C2p=Math.hypot(a2p,b2);

        const hue=(b,a)=>{
            if (Math.abs(a)<1e-15 && Math.abs(b)<1e-15) return 0;
            const h=Math.atan2(b,a)*180/Math.PI;
            return h<0 ? h+360 : h;
        };

        const h1p=hue(b1,a1p);
        const h2p=hue(b2,a2p);
        const dLp=L2-L1;
        const dCp=C2p-C1p;
        let dhp=0;

        if (C1p*C2p!==0) {
            const d=h2p-h1p;
            dhp=Math.abs(d)<=180 ? d : (d>180 ? d-360 : d+360);
        }

        const dHp=2*Math.sqrt(C1p*C2p)*Math.sin((dhp/2)*Math.PI/180);
        const Lbarp=(L1+L2)/2;
        const Cbarp=(C1p+C2p)/2;
        let hbarp;

        if (C1p*C2p===0) {
            hbarp=h1p+h2p;
        } else {
            const sum=h1p+h2p;
            hbarp=Math.abs(h1p-h2p)<=180
                ? sum/2
                : (sum<360 ? (sum+360)/2 : (sum-360)/2);
        }

        const rad=deg=>deg*Math.PI/180;
        const T=1
            -0.17*Math.cos(rad(hbarp-30))
            +0.24*Math.cos(rad(2*hbarp))
            +0.32*Math.cos(rad(3*hbarp+6))
            -0.20*Math.cos(rad(4*hbarp-63));
        const dtheta=30*Math.exp(-sq((hbarp-275)/25));
        const Rc=Cbarp===0
            ? 0
            : 2*Math.sqrt(Math.pow(Cbarp,7)/(Math.pow(Cbarp,7)+Math.pow(25,7)));
        const Sl=1+(0.015*sq(Lbarp-50))/Math.sqrt(20+sq(Lbarp-50));
        const Sc=1+0.045*Cbarp;
        const Sh=1+0.015*Cbarp*T;
        const Rt=-Math.sin(rad(2*dtheta))*Rc;
        const tL=dLp/Sl;
        const tC=dCp/Sc;
        const tH=dHp/Sh;

        return Math.sqrt(Math.max(0,tL*tL+tC*tC+tH*tH+Rt*tC*tH));
    }

    function verificationScoreFromDelta(deltaE00) {
        const raw=100*(1-(Number(deltaE00)/VERIFICATION_MAX_DELTA_E00));
        return Math.max(0,Math.min(100,raw));
    }

    function verificationSignature(testColor) {
        if (!testColor) return '';
        return JSON.stringify({
            index:testColor.index,
            targetLab:Array.isArray(testColor.targetLab) ? testColor.targetLab : [],
            selectedAt:testColor.selectedAt || ''
        });
    }

    function clearVerificationResult() {
        if (verificationResultEl) verificationResultEl.hidden=true;
        if (verificationDesiredSwatchEl) verificationDesiredSwatchEl.style.background='';
        if (verificationMeasuredSwatchEl) verificationMeasuredSwatchEl.style.background='';
        if (verificationDesiredLabEl) verificationDesiredLabEl.textContent='—';
        if (verificationMeasuredLabEl) verificationMeasuredLabEl.textContent='—';
        if (verificationDeltaEEl) verificationDeltaEEl.textContent='—';
        if (verificationScoreEl) verificationScoreEl.textContent='—';
    }

    function renderVerification(testColor,verification) {
        const hasTarget=Boolean(
            testColor &&
            Array.isArray(testColor.targetLab) &&
            testColor.targetLab.length>=3
        );

        if (!hasTarget) {
            if (verificationTargetEl) verificationTargetEl.hidden=true;
            if (verificationCalculateBtn) verificationCalculateBtn.disabled=true;
            if (verificationStatusEl) {
                verificationStatusEl.textContent='Capture a test color in Step 4 before verification.';
                verificationStatusEl.classList.remove('is-success','is-error');
            }
            if (verificationLInput) verificationLInput.value='';
            if (verificationAInput) verificationAInput.value='';
            if (verificationBInput) verificationBInput.value='';
            clearVerificationResult();
            return;
        }

        const targetLab=testColor.targetLab.map(Number);
        const targetRgb=verificationLabToRgb(targetLab);

        if (verificationTargetEl) verificationTargetEl.hidden=false;
        if (verificationTargetSwatchEl) {
            verificationTargetSwatchEl.style.background=
                `rgb(${targetRgb[0]},${targetRgb[1]},${targetRgb[2]})`;
        }
        if (verificationTargetLabelEl) verificationTargetLabelEl.textContent=testColor.label || 'Test color';
        if (verificationTargetLabEl) verificationTargetLabEl.textContent=formatLabValues(targetLab);
        if (verificationCalculateBtn) verificationCalculateBtn.disabled=false;

        const validVerification=
            verification &&
            verification.testColorSignature===verificationSignature(testColor) &&
            Array.isArray(verification.measuredLab);

        if (!validVerification) {
            if (verificationStatusEl) {
                verificationStatusEl.textContent='Enter the LAB values measured from the painted and scanned sample.';
                verificationStatusEl.classList.remove('is-success','is-error');
            }
            clearVerificationResult();
            return;
        }

        const measuredLab=verification.measuredLab.map(Number);
        if (verificationLInput) verificationLInput.value=String(measuredLab[0]);
        if (verificationAInput) verificationAInput.value=String(measuredLab[1]);
        if (verificationBInput) verificationBInput.value=String(measuredLab[2]);

        const measuredRgb=verificationLabToRgb(measuredLab);
        if (verificationResultEl) verificationResultEl.hidden=false;

        if (verificationDesiredSwatchEl) {
            verificationDesiredSwatchEl.style.background=
                `rgb(${targetRgb[0]},${targetRgb[1]},${targetRgb[2]})`;
        }
        if (verificationMeasuredSwatchEl) {
            verificationMeasuredSwatchEl.style.background=
                `rgb(${measuredRgb[0]},${measuredRgb[1]},${measuredRgb[2]})`;
        }

        if (verificationDesiredLabEl) verificationDesiredLabEl.textContent=formatLabValues(targetLab);
        if (verificationMeasuredLabEl) verificationMeasuredLabEl.textContent=formatLabValues(measuredLab);
        if (verificationDeltaEEl) verificationDeltaEEl.textContent=Number(verification.deltaE00).toFixed(2);
        if (verificationScoreEl) verificationScoreEl.textContent=`${Number(verification.score).toFixed(1)} / 100`;

        if (verificationStatusEl) {
            const when=verification.verifiedAt ? new Date(verification.verifiedAt) : null;
            verificationStatusEl.textContent=
                when && !Number.isNaN(when.getTime())
                    ? `Verification calculated · ${when.toLocaleString()}`
                    : 'Verification calculated.';
            verificationStatusEl.classList.remove('is-error');
            verificationStatusEl.classList.add('is-success');
        }
    }

    function calculateVerification() {
        if (!currentDraft) return;

        const testColor=currentDraft.fields?.testColor;
        if (!testColor || !Array.isArray(testColor.targetLab)) {
            renderVerification(null,null);
            return;
        }

        const L=Number(verificationLInput.value);
        const a=Number(verificationAInput.value);
        const b=Number(verificationBInput.value);

        if (![L,a,b].every(Number.isFinite)) {
            verificationStatusEl.textContent='Enter valid measured L*, a* and b* values.';
            verificationStatusEl.classList.remove('is-success');
            verificationStatusEl.classList.add('is-error');
            return;
        }

        if (L<0 || L>100) {
            verificationStatusEl.textContent='Measured L* must be between 0 and 100.';
            verificationStatusEl.classList.remove('is-success');
            verificationStatusEl.classList.add('is-error');
            return;
        }

        const targetLab=testColor.targetLab.map(Number);
        const measuredLab=[L,a,b];
        const deltaE00=verificationDeltaE00(targetLab,measuredLab);
        const score=verificationScoreFromDelta(deltaE00);

        const verification={
            testColorSignature:verificationSignature(testColor),
            targetLab,
            measuredLab,
            deltaE00,
            score,
            maxDeltaE00:VERIFICATION_MAX_DELTA_E00,
            verifiedAt:nowIso()
        };

        currentDraft.fields.verification=verification;
        saveCurrentDraft();
        renderVerification(testColor,verification);
    }

    function renderDraft(draft, created) {
        currentDraft = draft;
        currentTokenEl.textContent = draft.token;
        workspace.hidden = false;

        const identification = draft.fields && draft.fields.identification
            ? draft.fields.identification
            : {};
        populateIdentificationForm(identification);

        const imageKMeansPalette = draft.fields && draft.fields.imageKMeansPalette
            ? draft.fields.imageKMeansPalette
            : null;
        renderCapturedAnalysis(imageKMeansPalette);

        const paintFormulation = draft.fields && draft.fields.paintFormulation
            ? draft.fields.paintFormulation
            : null;
        renderCapturedPaint(paintFormulation);

        const testColor = draft.fields && draft.fields.testColor
            ? draft.fields.testColor
            : null;
        renderCapturedTestColor(testColor);

        const weighing = draft.fields && draft.fields.weighing
            ? draft.fields.weighing
            : null;
        renderWeighing(testColor,weighing);

        const verification = draft.fields && draft.fields.verification
            ? draft.fields.verification
            : null;
        renderVerification(testColor,verification);

        tokenStatus.textContent = created
            ? 'New local submission draft created.'
            : 'Existing local submission draft loaded.';

        tokenStatus.classList.remove('is-error');
        tokenStatus.classList.add('is-success');

        saveStateEl.textContent = created ? 'New draft' : 'Saved locally';
        saveStateEl.classList.remove('is-error');
        saveStateEl.classList.toggle('is-saved', !created);
    }

    function openTokenDraft() {
        const token = normalizeToken(tokenInput.value);

        if (!token) {
            tokenStatus.textContent = 'Enter a token before opening the submission form.';
            tokenStatus.classList.remove('is-success');
            tokenStatus.classList.add('is-error');
            tokenInput.focus();
            return;
        }

        if (currentDraft && currentDraft.token !== token) {
            saveIdentificationNow();
        }

        const { draft, created } = loadOrCreateDraft(token);
        renderDraft(draft, created);

        try {
            localStorage.setItem(LAST_TOKEN_KEY, token);
        } catch (error) {
            console.warn('[Skillosaic] Could not remember last submission token:', error);
        }
    }

    function openSubmissionModal() {
        previousFocus = document.activeElement;

        let lastToken = '';
        try {
            lastToken = localStorage.getItem(LAST_TOKEN_KEY) || '';
        } catch (error) {
            console.warn('[Skillosaic] Could not read last submission token:', error);
        }

        if (!tokenInput.value && lastToken) {
            tokenInput.value = lastToken;
        }

        overlay.hidden = false;
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            if (tokenInput.value) {
                openTokenBtn.focus();
            } else {
                tokenInput.focus();
            }
        });
    }

    function closeSubmissionModal() {
        if (overlay.hidden) return;

        if (currentDraft) {
            saveIdentificationNow();
        }

        overlay.hidden = true;
        document.body.style.overflow = '';

        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
        previousFocus = null;
    }

    function updateFields(partialFields) {
        if (!currentDraft) {
            throw new Error('No submission draft is currently open.');
        }

        if (!partialFields || typeof partialFields !== 'object' || Array.isArray(partialFields)) {
            throw new Error('Submission fields must be supplied as an object.');
        }

        currentDraft.fields = {
            ...currentDraft.fields,
            ...partialFields
        };

        return saveCurrentDraft();
    }

    function getCurrentDraft() {
        if (!currentDraft) return null;
        return JSON.parse(JSON.stringify(currentDraft));
    }

    fab.addEventListener('click', openSubmissionModal);
    closeBtn.addEventListener('click', closeSubmissionModal);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeSubmissionModal();
    });

    openTokenBtn.addEventListener('click', openTokenDraft);

    tokenInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            openTokenDraft();
        }
    });

    [
        stationNumberInput,
        fullNameInput,
        atsSchoolInput,
        dateInput,
        registrationImageInput
    ].filter(Boolean).forEach(input => {
        input.addEventListener('input', markDraftChanged);
        input.addEventListener('change', markDraftChanged);
    });

    if (ppeYesBtn) {
        ppeYesBtn.addEventListener('click', () => {
            setPpeSelection('yes');
            markDraftChanged();
        });
    }

    if (ppeNoBtn) {
        ppeNoBtn.addEventListener('click', () => {
            setPpeSelection('no');
            markDraftChanged();
        });
    }

    if (captureMosaicBtn) {
        captureMosaicBtn.addEventListener('click', captureMosaicAnalysis);
    }

    if (capturePaintBtn) {
        capturePaintBtn.addEventListener('click', capturePaintFormulation);
    }

    if (captureTestColorBtn) {
        captureTestColorBtn.addEventListener('click', captureSelectedTestColor);
    }

    if (requestExpertConfirmationBtn) {
        requestExpertConfirmationBtn.addEventListener('click',requestExpertWeighingConfirmation);
    }

    if (verificationCalculateBtn) {
        verificationCalculateBtn.addEventListener('click',calculateVerification);
    }

    if (expertWeighingCloseBtn) {
        expertWeighingCloseBtn.addEventListener('click',closeExpertWeighingModal);
    }

    if (expertWeighingOverlay) {
        expertWeighingOverlay.addEventListener('click',event=>{
            if (event.target===expertWeighingOverlay) closeExpertWeighingModal();
        });
    }

    if (expertWeighingConfirmBtn) {
        expertWeighingConfirmBtn.addEventListener('click',()=>{
            decideExpertWeighingConfirmation('confirmed');
        });
    }

    if (expertWeighingRejectBtn) {
        expertWeighingRejectBtn.addEventListener('click',()=>{
            decideExpertWeighingConfirmation('rejected');
        });
    }

    window.addEventListener('skillosaic:test-color-selected',event=>{
        if (!testColorCaptureStatusEl || !event.detail) return;
        testColorCaptureStatusEl.textContent=
            `${event.detail.label || 'Test color'} selected in Paint Formulation. Click capture to store it in this submission.`;
        testColorCaptureStatusEl.classList.remove('is-error','is-success');
    });

    saveDraftBtn.addEventListener('click', () => {
        if (!currentDraft) return;
        saveIdentificationNow();
        tokenStatus.textContent = 'Submission draft saved in this browser.';
        tokenStatus.classList.remove('is-error');
        tokenStatus.classList.add('is-success');
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;

        if (expertWeighingOverlay && !expertWeighingOverlay.hidden) {
            event.preventDefault();
            closeExpertWeighingModal();
            return;
        }

        if (!overlay.hidden) {
            closeSubmissionModal();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (currentDraft) {
            syncIdentificationToDraft();
            saveCurrentDraft();
        }
    });

    // Small public API so the form can grow without changing the storage layer.
    window.SkillosaicSubmission = Object.freeze({
        getCurrentDraft,
        updateFields,
        save: saveCurrentDraft,
        getCurrentToken: () => currentDraft ? currentDraft.token : null
    });
})();
