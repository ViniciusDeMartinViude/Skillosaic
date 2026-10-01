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

    if (!fab || !overlay || !modal) return;

    let currentDraft = null;
    let previousFocus = null;
    let ppeConfirmation = '';
    let isPopulatingIdentification = false;
    let autoSaveTimer = null;

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
                paintFormulation: null
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

    saveDraftBtn.addEventListener('click', () => {
        if (!currentDraft) return;
        saveIdentificationNow();
        tokenStatus.textContent = 'Submission draft saved in this browser.';
        tokenStatus.classList.remove('is-error');
        tokenStatus.classList.add('is-success');
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !overlay.hidden) {
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
