(() => {
    'use strict';

    const tabMosaic = document.getElementById('tab-mosaic');
    const tabFormulation = document.getElementById('tab-formulation');
    const mosaicApp = document.getElementById('mosaic-app');
    const paintApp = document.getElementById('paint-app');

    function setTab(name) {
        const paint = name === 'paint';
        mosaicApp.hidden = paint;
        paintApp.hidden = !paint;
        tabMosaic.classList.toggle('active', !paint);
        tabFormulation.classList.toggle('active', paint);
        tabMosaic.setAttribute('aria-selected', String(!paint));
        tabFormulation.setAttribute('aria-selected', String(paint));
        if (paint) window.setTimeout(resizeVisibleCanvases, 0);
    }

    tabMosaic.addEventListener('click', () => setTab('mosaic'));
    tabFormulation.addEventListener('click', () => setTab('paint'));

    const video = document.getElementById('paint-video');
    const sourceCanvas = document.getElementById('paint-source-canvas');
    const resultCanvas = document.getElementById('paint-result-canvas');
    const sourcePlaceholder = document.getElementById('paint-source-placeholder');
    const resultPlaceholder = document.getElementById('paint-result-placeholder');
    const sourceLabel = document.getElementById('paint-source-label');
    const startCameraBtn = document.getElementById('paint-start-camera');
    const captureBtn = document.getElementById('paint-capture');
    const fileInput = document.getElementById('paint-file-input');
    const cameraSelect = document.getElementById('paint-camera-select');
    const kSelect = document.getElementById('paint-k');
    const totalGramsInput = document.getElementById('paint-total-grams');
    const statusEl = document.getElementById('paint-status');
    const cardsEl = document.getElementById('paint-palette-cards');
    const manualL = document.getElementById('manual-L');
    const manualA = document.getElementById('manual-a');
    const manualB = document.getElementById('manual-b');
    const manualButton = document.getElementById('manual-calculate');
    const manualResult = document.getElementById('manual-result');
    const manualLabSwatch = document.getElementById('manual-lab-swatch');
    const manualTargetLab = document.getElementById('manual-target-lab');

    const manualLabModalOverlay = document.getElementById('manual-lab-modal-overlay');
    const manualLabModalClose = document.getElementById('manual-lab-modal-close');
    const manualLabModalSwatch = document.getElementById('manual-lab-modal-swatch');
    const manualLabModalTarget = document.getElementById('manual-lab-modal-target');
    const manualLabModalTargetLab = document.getElementById('manual-lab-modal-target-lab');
    const manualLabModalPredictedLab = document.getElementById('manual-lab-modal-predicted-lab');
    const manualLabModalDeltaE = document.getElementById('manual-lab-modal-deltae');
    const manualLabModalTotal = document.getElementById('manual-lab-modal-total');
    const manualLabModalRedPercent = document.getElementById('manual-lab-modal-red-percent');
    const manualLabModalYellowPercent = document.getElementById('manual-lab-modal-yellow-percent');
    const manualLabModalBluePercent = document.getElementById('manual-lab-modal-blue-percent');
    const manualLabModalRedGrams = document.getElementById('manual-lab-modal-red-grams');
    const manualLabModalYellowGrams = document.getElementById('manual-lab-modal-yellow-grams');
    const manualLabModalBlueGrams = document.getElementById('manual-lab-modal-blue-grams');
    const manualLabModalSource = document.getElementById('manual-lab-modal-source');

    const focusModeSelect = document.getElementById('camera-focus-mode');
    const focusInput = document.getElementById('camera-focus');
    const focusValue = document.getElementById('camera-focus-value');
    const exposureModeSelect = document.getElementById('camera-exposure-mode');
    const exposureInput = document.getElementById('camera-exposure');
    const exposureValue = document.getElementById('camera-exposure-value');
    const exposureKind = document.getElementById('camera-exposure-kind');
    const wbModeSelect = document.getElementById('camera-wb-mode');
    const wbInput = document.getElementById('camera-wb');
    const wbValue = document.getElementById('camera-wb-value');
    const brightnessInput = document.getElementById('image-brightness');
    const brightnessValue = document.getElementById('image-brightness-value');
    const contrastInput = document.getElementById('image-contrast');
    const contrastValue = document.getElementById('image-contrast-value');
    const cameraCapabilityNote = document.getElementById('camera-capability-note');
    const resetCameraControlsBtn = document.getElementById('camera-reset-controls');

    const formulationModalOverlay = document.getElementById('formulation-modal-overlay');
    const formulationModalClose = document.getElementById('formulation-modal-close');
    const formulationModalSwatch = document.getElementById('formulation-modal-swatch');
    const formulationModalTitle = document.getElementById('formulation-modal-title');
    const formulationModalCoverage = document.getElementById('formulation-modal-coverage');
    const formulationModalRgb = document.getElementById('formulation-modal-rgb');
    const formulationModalCameraLab = document.getElementById('formulation-modal-camera-lab');
    const formulationModalNixLab = document.getElementById('formulation-modal-nix-lab');
    const formulationModalDeltaE = document.getElementById('formulation-modal-deltae');
    const formulationModalTotal = document.getElementById('formulation-modal-total');
    const formulationModalRedPercent = document.getElementById('formulation-modal-red-percent');
    const formulationModalYellowPercent = document.getElementById('formulation-modal-yellow-percent');
    const formulationModalBluePercent = document.getElementById('formulation-modal-blue-percent');
    const formulationModalRedGrams = document.getElementById('formulation-modal-red-grams');
    const formulationModalYellowGrams = document.getElementById('formulation-modal-yellow-grams');
    const formulationModalBlueGrams = document.getElementById('formulation-modal-blue-grams');
    const formulationModalSource = document.getElementById('formulation-modal-source');

    let cameraStream = null;
    let cameraTrack = null;
    let currentSource = null;
    let lastFormulationRows = null;
    let lastManualCalculation = null;
    let lastKMeansRender = null;
    let activeKMeansClusterIndex = null;
    let selectedFormulationIndex = null;
    let formulationModalPreviousFocus = null;
    let manualLabModalPreviousFocus = null;

    const RECIPES = [
        [100,0,0],[0,100,0],[0,0,100],[50,50,0],[0,50,50],[33,33,34],
        [0,25,75],[75,0,25],[75,25,0],[25,75,0],[25,0,75],[50,0,50],
        [0,75,25],[25,25,50],[25,50,25],[50,25,25],[80,10,10],[10,80,10],
        [10,10,80],[60,30,10],[60,10,30],[30,60,10],[10,60,30],[20,30,50]
    ];

    const NIX_LABS = [
        [46.48,60.97,28.12],[86.11,4.88,84.67],[55.80,-24.28,-37.44],
        [51.97,55.39,32.65],[56.87,-37.61,25.50],[41.66,5.53,7.96],
        [54.91,-38.94,11.98],[42.83,-2.79,-17.93],[47.98,60.66,30.91],
        [57.35,48.65,39.13],[42.51,-2.13,-16.94],[37.62,9.12,-8.65],
        [61.92,-31.97,38.42],[43.17,-4.28,4.05],[44.73,4.54,14.97],
        [39.89,15.04,6.83],[38.22,32.20,10.76],[54.48,2.73,31.96],
        [47.59,-18.40,-6.21],[40.18,13.80,6.39],[37.19,15.72,1.41],
        [46.57,18.91,20.89],[51.07,-11.98,21.81],[44.53,-8.35,7.31]
    ];

    const CAMERA_LABS = [
        [47.24728565224236,60.92399730217453,34.53020254620286],
        [84.87443126586757,-8.14648332080169,74.61966035131158],
        [63.67925571186684,-17.11602692118511,-30.31169811518195],
        [42.5530721972349,57.39872899712344,47.40297051681575],
        [52.1136405275161,-23.46222263852965,27.33449723308534],
        [33.75699111063606,10.69919226771884,17.48905703415698],
        [50.09905316980839,-23.87789635497064,13.77953153368555],
        [36.10587550722265,0.5075398589843197,-10.79133741905492],
        [38.97709693437857,60.37588777190835,47.88939732959663],
        [40.70117885856073,42.02915268524017,37.04561835735678],
        [27.7382856556311,-0.5530803397770747,-15.77193406926713],
        [21.78175918642206,5.745631373570072,-3.894694320994423],
        [53.06430290826749,-25.24722970985302,32.51828973615081],
        [31.14727456821604,-1.474639453704931,2.426774634728713],
        [33.28869796461935,3.549051302373482,15.01970576403429],
        [21.67378918060969,17.53494612915136,9.563209128210866],
        [21.07604033225477,29.85052401747059,16.32639540013526],
        [38.52629361479045,5.135190294016818,32.05566805863258],
        [31.11346011267054,-11.15999507743918,-3.10003967073433],
        [24.10935874157546,16.91617066075248,-0.3177477659502848],
        [20.56438562728635,15.87975525967956,-1.555825704834587],
        [31.26741219094994,21.09134248866696,16.65467769589127],
        [36.30378252818492,-5.45434512214414,12.92582237705484],
        [24.57173783431064,-3.495142416157754,4.824548988269561]
    ];

    const sq = x => x * x;

    function meanStd(rows) {
        const d = rows[0].length;
        const mean = new Array(d).fill(0);
        rows.forEach(r => r.forEach((v,j) => mean[j] += v));
        for (let j=0; j<d; j++) mean[j] /= rows.length;
        const variance = new Array(d).fill(0);
        rows.forEach(r => r.forEach((v,j) => variance[j] += sq(v - mean[j])));
        const std = variance.map(v => Math.sqrt(v / rows.length) || 1);
        return { mean, std };
    }

    function distance(a, b) {
        let s = 0;
        for (let i=0; i<a.length; i++) s += sq(a[i] - b[i]);
        return Math.sqrt(s);
    }

    function solveLinearSystem(A, B) {
        const n = A.length;
        const m = B[0].length;
        const aug = A.map((row, i) => row.slice().concat(B[i]));

        for (let col=0; col<n; col++) {
            let pivot = col;
            for (let r=col+1; r<n; r++) {
                if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
            }
            if (Math.abs(aug[pivot][col]) < 1e-12) throw new Error('RBF model matrix is singular.');
            [aug[col], aug[pivot]] = [aug[pivot], aug[col]];

            const p = aug[col][col];
            for (let j=col; j<n+m; j++) aug[col][j] /= p;

            for (let r=0; r<n; r++) {
                if (r === col) continue;
                const factor = aug[r][col];
                if (Math.abs(factor) < 1e-18) continue;
                for (let j=col; j<n+m; j++) aug[r][j] -= factor * aug[col][j];
            }
        }
        return aug.map(row => row.slice(n));
    }

    function trainCubicRBF(points, values, smoothing) {
        const n = points.length;
        const d = points[0].length;
        const outDim = values[0].length;
        const polyDim = d + 1;
        const size = n + polyDim;
        const A = Array.from({length:size}, () => new Array(size).fill(0));
        const B = Array.from({length:size}, () => new Array(outDim).fill(0));

        for (let i=0; i<n; i++) {
            for (let j=0; j<n; j++) {
                const r = distance(points[i], points[j]);
                A[i][j] = r * r * r + (i === j ? smoothing : 0);
            }
            A[i][n] = 1;
            for (let q=0; q<d; q++) A[i][n + 1 + q] = points[i][q];
            B[i] = values[i].slice();
        }
        for (let p=0; p<polyDim; p++) {
            for (let i=0; i<n; i++) A[n+p][i] = A[i][n+p];
        }

        const coeff = solveLinearSystem(A, B);
        return { points, radial: coeff.slice(0,n), poly: coeff.slice(n) };
    }

    function predictRBF(model, x) {
        const outDim = model.radial[0].length;
        const out = new Array(outDim).fill(0);
        for (let i=0; i<model.points.length; i++) {
            const r = distance(x, model.points[i]);
            const phi = r*r*r;
            for (let q=0; q<outDim; q++) out[q] += phi * model.radial[i][q];
        }
        const polyFeatures = [1].concat(x);
        for (let p=0; p<model.poly.length; p++) {
            for (let q=0; q<outDim; q++) out[q] += polyFeatures[p] * model.poly[p][q];
        }
        return out;
    }

    function deltaE00(lab1, lab2) {
        const [L1,a1,b1] = lab1, [L2,a2,b2] = lab2;
        const C1 = Math.hypot(a1,b1), C2 = Math.hypot(a2,b2);
        const Cbar = (C1+C2)/2;
        const G = Cbar === 0 ? 0 : 0.5 * (1 - Math.sqrt(Math.pow(Cbar,7)/(Math.pow(Cbar,7)+Math.pow(25,7))));
        const a1p=(1+G)*a1, a2p=(1+G)*a2;
        const C1p=Math.hypot(a1p,b1), C2p=Math.hypot(a2p,b2);
        const hue = (b,a) => {
            if (Math.abs(a)<1e-15 && Math.abs(b)<1e-15) return 0;
            const h = Math.atan2(b,a)*180/Math.PI;
            return h < 0 ? h+360 : h;
        };
        const h1p=hue(b1,a1p), h2p=hue(b2,a2p);
        const dLp=L2-L1, dCp=C2p-C1p;
        let dhp=0;
        if (C1p*C2p !== 0) {
            const d=h2p-h1p;
            dhp = Math.abs(d)<=180 ? d : (d>180 ? d-360 : d+360);
        }
        const dHp=2*Math.sqrt(C1p*C2p)*Math.sin((dhp/2)*Math.PI/180);
        const Lbarp=(L1+L2)/2, Cbarp=(C1p+C2p)/2;
        let hbarp;
        if (C1p*C2p===0) hbarp=h1p+h2p;
        else {
            const sum=h1p+h2p;
            hbarp = Math.abs(h1p-h2p)<=180 ? sum/2 : (sum<360 ? (sum+360)/2 : (sum-360)/2);
        }
        const rad = deg => deg*Math.PI/180;
        const T = 1 - 0.17*Math.cos(rad(hbarp-30)) + 0.24*Math.cos(rad(2*hbarp))
            + 0.32*Math.cos(rad(3*hbarp+6)) - 0.20*Math.cos(rad(4*hbarp-63));
        const dtheta=30*Math.exp(-sq((hbarp-275)/25));
        const Rc=Cbarp===0 ? 0 : 2*Math.sqrt(Math.pow(Cbarp,7)/(Math.pow(Cbarp,7)+Math.pow(25,7)));
        const Sl=1+(0.015*sq(Lbarp-50))/Math.sqrt(20+sq(Lbarp-50));
        const Sc=1+0.045*Cbarp;
        const Sh=1+0.015*Cbarp*T;
        const Rt=-Math.sin(rad(2*dtheta))*Rc;
        const tL=dLp/Sl, tC=dCp/Sc, tH=dHp/Sh;
        return Math.sqrt(Math.max(0,tL*tL+tC*tC+tH*tH+Rt*tC*tH));
    }

    function rgbToLabLocal(r,g,b) {
        const lin = c => {
            c /= 255;
            return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
        };
        const R=lin(r), G=lin(g), B=lin(b);
        const X=(R*0.4124564+G*0.3575761+B*0.1804375)*100/95.047;
        const Y=(R*0.2126729+G*0.7151522+B*0.0721750)*100/100.000;
        const Z=(R*0.0193339+G*0.1191920+B*0.9503041)*100/108.883;
        const delta=6/29;
        const f = t => t>Math.pow(delta,3) ? Math.cbrt(t) : t/(3*delta*delta)+4/29;
        const fx=f(X), fy=f(Y), fz=f(Z);
        return [116*fy-16,500*(fx-fy),200*(fy-fz)];
    }

    const camStats = meanStd(CAMERA_LABS);
    const cameraPoints = CAMERA_LABS.map(row => row.map((v,j)=>(v-camStats.mean[j])/camStats.std[j]));
    const cameraDeltas = NIX_LABS.map((row,i) => row.map((v,j)=>v-CAMERA_LABS[i][j]));
    const cameraModel = trainCubicRBF(cameraPoints, cameraDeltas, 5.0);
    const paintPoints = RECIPES.map(r => [r[0]/100, r[1]/100]);
    const paintModel = trainCubicRBF(paintPoints, NIX_LABS, 0.001);

    function correctCameraLab(cameraLab) {
        const x = cameraLab.map((v,j)=>(v-camStats.mean[j])/camStats.std[j]);
        const correction = predictRBF(cameraModel, x);
        return cameraLab.map((v,j)=>v+correction[j]);
    }

    function predictPaintLab(recipe) {
        const total = recipe.reduce((a,b)=>a+b,0) || 1;
        const r = recipe[0]*100/total, y = recipe[1]*100/total;
        return predictRBF(paintModel,[r/100,y/100]);
    }

    const paintGrid = [];
    for (let r=0; r<=100; r++) {
        for (let y=0; y<=100-r; y++) {
            const recipe=[r,y,100-r-y];
            paintGrid.push({recipe,lab:predictPaintLab(recipe)});
        }
    }

    function findPaintMix(target) {
        let nearestMeasured={de:Infinity,index:-1};
        for (let i=0;i<NIX_LABS.length;i++) {
            const de=deltaE00(target,NIX_LABS[i]);
            if (de<nearestMeasured.de) nearestMeasured={de,index:i};
        }
        if (nearestMeasured.de<=1.0) {
            return {
                recipe:RECIPES[nearestMeasured.index].slice(),
                predictedLab:NIX_LABS[nearestMeasured.index].slice(),
                deltaE:nearestMeasured.de,
                source:'Measured Nix formulation'
            };
        }

        let best=null;
        for (const candidate of paintGrid) {
            const de=deltaE00(target,candidate.lab);
            if (!best || de<best.deltaE) best={recipe:candidate.recipe.slice(),predictedLab:candidate.lab.slice(),deltaE:de};
        }

        const center=best.recipe;
        for (let r=Math.max(0,center[0]-2); r<=Math.min(100,center[0]+2)+1e-9; r+=0.25) {
            for (let y=Math.max(0,center[1]-2); y<=Math.min(100-r,center[1]+2)+1e-9; y+=0.25) {
                const b=100-r-y;
                if (b<0) continue;
                const recipe=[r,y,b];
                const lab=predictPaintLab(recipe);
                const de=deltaE00(target,lab);
                if (de<best.deltaE) best={recipe,predictedLab:lab,deltaE:de};
            }
        }
        best.source='Forward RBF + CIEDE2000 search';
        return best;
    }

    function kmeansPlusPlus(points,k) {
        const centroids=[points[Math.floor(Math.random()*points.length)].slice()];
        while (centroids.length<k) {
            const dists=new Float64Array(points.length);
            let total=0;
            for (let i=0;i<points.length;i++) {
                let min=Infinity;
                for (const c of centroids) {
                    const d=sq(points[i][0]-c[0])+sq(points[i][1]-c[1])+sq(points[i][2]-c[2]);
                    if (d<min) min=d;
                }
                dists[i]=min; total+=min;
            }
            if (total<=1e-12) {
                centroids.push(points[centroids.length % points.length].slice());
                continue;
            }
            let pick=Math.random()*total;
            let chosen=points.length-1;
            for (let i=0;i<points.length;i++) { pick-=dists[i]; if (pick<=0) { chosen=i; break; } }
            centroids.push(points[chosen].slice());
        }
        return centroids;
    }

    function runColorKmeans(imageData,k) {
        const {data,width,height}=imageData;
        const n=width*height;
        const labs=new Float32Array(n*3);
        const maxSample=18000;
        const sampleStep=Math.max(1,Math.floor(n/maxSample));
        const sample=[];

        for (let i=0;i<n;i++) {
            const p=i*4;
            const lab=rgbToLabLocal(data[p],data[p+1],data[p+2]);
            labs[i*3]=lab[0]; labs[i*3+1]=lab[1]; labs[i*3+2]=lab[2];
            if (i%sampleStep===0) sample.push(lab);
        }

        let centroids=kmeansPlusPlus(sample,k);
        let labels=new Int32Array(sample.length);
        labels.fill(-1);

        for (let iter=0;iter<35;iter++) {
            let changed=0;
            const sums=Array.from({length:k},()=>[0,0,0,0]);
            for (let i=0;i<sample.length;i++) {
                const p=sample[i];
                let best=0,bestD=Infinity;
                for (let c=0;c<k;c++) {
                    const d=sq(p[0]-centroids[c][0])+sq(p[1]-centroids[c][1])+sq(p[2]-centroids[c][2]);
                    if (d<bestD) {bestD=d;best=c;}
                }
                if (labels[i]!==best) {labels[i]=best;changed++;}
                sums[best][0]+=p[0]; sums[best][1]+=p[1]; sums[best][2]+=p[2]; sums[best][3]++;
            }
            centroids=sums.map((s,c)=>s[3] ? [s[0]/s[3],s[1]/s[3],s[2]/s[3]] : centroids[c]);
            if (changed===0) break;
        }

        const fullLabels=new Int32Array(n);
        const rgbSums=Array.from({length:k},()=>[0,0,0,0]);
        for (let i=0;i<n;i++) {
            const lab=[labs[i*3],labs[i*3+1],labs[i*3+2]];
            let best=0,bestD=Infinity;
            for (let c=0;c<k;c++) {
                const d=sq(lab[0]-centroids[c][0])+sq(lab[1]-centroids[c][1])+sq(lab[2]-centroids[c][2]);
                if (d<bestD) {bestD=d;best=c;}
            }
            fullLabels[i]=best;
            const p=i*4;
            rgbSums[best][0]+=data[p]; rgbSums[best][1]+=data[p+1]; rgbSums[best][2]+=data[p+2]; rgbSums[best][3]++;
        }

        const clusters=rgbSums.map((s,c)=>{
            const count=s[3];
            const rgb=count ? [Math.round(s[0]/count),Math.round(s[1]/count),Math.round(s[2]/count)] : [0,0,0];
            return {oldIndex:c,count,rgb,coverage:count*100/n};
        }).sort((a,b)=>b.count-a.count);

        const remap=new Int32Array(k);
        clusters.forEach((cluster,newIndex)=>remap[cluster.oldIndex]=newIndex);
        const meanColors=clusters.map(c=>c.rgb);
        const output=new ImageData(width,height);
        const sortedLabels=new Int32Array(n);
        for (let i=0;i<n;i++) {
            const newLabel=remap[fullLabels[i]];
            sortedLabels[i]=newLabel;
            const rgb=meanColors[newLabel];
            const p=i*4;
            output.data[p]=rgb[0]; output.data[p+1]=rgb[1]; output.data[p+2]=rgb[2]; output.data[p+3]=255;
        }

        return {
            output,
            labelMap:sortedLabels,
            clusters:clusters.map((c,i)=>({...c,index:i}))
        };
    }

    function clearNativeCameraControls(message='Start the camera to detect focus, exposure and white-balance capabilities.') {
        [focusModeSelect, exposureModeSelect, wbModeSelect].forEach(select => {
            select.innerHTML='<option value="">Unavailable</option>';
            select.disabled=true;
        });
        [focusInput, exposureInput, wbInput].forEach(input => input.disabled=true);
        focusValue.textContent='—';
        exposureValue.textContent='—';
        wbValue.textContent='—';
        exposureKind.textContent='Exposure unavailable';
        cameraCapabilityNote.textContent=message;
    }

    function populateModeSelect(select, modes, current) {
        select.innerHTML='';
        modes.forEach(mode => {
            const option=document.createElement('option');
            option.value=mode;
            option.textContent=mode;
            if (mode===current) option.selected=true;
            select.appendChild(option);
        });
        select.disabled=modes.length===0;
    }

    function configureRange(input, valueEl, cap, current, formatter=v=>String(v)) {
        if (!cap || typeof cap.min!=='number' || typeof cap.max!=='number') {
            input.disabled=true;
            valueEl.textContent='—';
            return false;
        }
        input.min=String(cap.min);
        input.max=String(cap.max);
        input.step=String(cap.step || (cap.max-cap.min)/100 || 0.01);
        const value=Number.isFinite(current) ? current : cap.min;
        input.value=String(Math.min(cap.max,Math.max(cap.min,value)));
        input.disabled=false;
        valueEl.textContent=formatter(Number(input.value));
        return true;
    }

    async function configureCameraControls() {
        if (!cameraTrack) {
            clearNativeCameraControls();
            return;
        }
        if (typeof cameraTrack.getCapabilities!=='function') {
            clearNativeCameraControls('This browser does not expose advanced camera capabilities.');
            return;
        }

        let capabilities={}, settings={};
        try {
            capabilities=cameraTrack.getCapabilities() || {};
            settings=cameraTrack.getSettings ? cameraTrack.getSettings() : {};
        } catch (err) {
            clearNativeCameraControls('Could not read advanced camera capabilities.');
            return;
        }

        const supported=[];

        if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.length) {
            populateModeSelect(focusModeSelect,capabilities.focusMode,settings.focusMode);
            supported.push('focus mode');
        } else {
            focusModeSelect.innerHTML='<option value="">Unavailable</option>';
            focusModeSelect.disabled=true;
        }
        if (configureRange(focusInput,focusValue,capabilities.focusDistance,settings.focusDistance,v=>v.toFixed(2))) {
            supported.push('focus distance');
        }

        if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.length) {
            populateModeSelect(exposureModeSelect,capabilities.exposureMode,settings.exposureMode);
            supported.push('exposure mode');
        } else {
            exposureModeSelect.innerHTML='<option value="">Unavailable</option>';
            exposureModeSelect.disabled=true;
        }

        if (configureRange(
            exposureInput, exposureValue,
            capabilities.exposureCompensation, settings.exposureCompensation,
            v=>v.toFixed(2)
        )) {
            exposureInput.dataset.constraint='exposureCompensation';
            exposureKind.textContent='Exposure compensation';
            supported.push('exposure compensation');
        } else if (configureRange(
            exposureInput, exposureValue,
            capabilities.exposureTime, settings.exposureTime,
            v=>v.toFixed(0)
        )) {
            exposureInput.dataset.constraint='exposureTime';
            exposureKind.textContent='Exposure time';
            supported.push('exposure time');
        } else {
            delete exposureInput.dataset.constraint;
            exposureKind.textContent='Exposure unavailable';
        }

        if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.length) {
            populateModeSelect(wbModeSelect,capabilities.whiteBalanceMode,settings.whiteBalanceMode);
            supported.push('white balance mode');
        } else {
            wbModeSelect.innerHTML='<option value="">Unavailable</option>';
            wbModeSelect.disabled=true;
        }
        if (configureRange(wbInput,wbValue,capabilities.colorTemperature,settings.colorTemperature,v=>`${v.toFixed(0)} K`)) {
            supported.push('color temperature');
        }

        cameraCapabilityNote.textContent = supported.length
            ? `Native controls exposed by this camera/browser: ${supported.join(', ')}. Brightness and contrast below are always available as browser post-processing.`
            : 'No native focus/exposure/white-balance controls were exposed. Brightness and contrast remain available as browser post-processing.';
    }

    async function applyTrackConstraint(constraint) {
        if (!cameraTrack) return;
        try {
            await cameraTrack.applyConstraints({advanced:[constraint]});
            statusEl.textContent='Camera setting applied';
        } catch (err) {
            statusEl.textContent='Camera setting unsupported';
            console.warn('[Skillosaic] Camera constraint rejected:',constraint,err);
        }
    }

    function cloneCanvas(rawCanvas) {
        const c=document.createElement('canvas');
        c.width=rawCanvas.width; c.height=rawCanvas.height;
        c.getContext('2d',{willReadFrequently:true}).drawImage(rawCanvas,0,0);
        return c;
    }

    function applyImageAdjustments(rawCanvas) {
        const c=cloneCanvas(rawCanvas);
        const ctx=c.getContext('2d',{willReadFrequently:true});
        const image=ctx.getImageData(0,0,c.width,c.height);
        const brightness=parseFloat(brightnessInput.value)||0;
        const contrast=parseFloat(contrastInput.value)||0;
        const offset=brightness*255/100;
        const factor=Math.max(0,(100+contrast)/100);

        for (let i=0;i<image.data.length;i+=4) {
            for (let ch=0;ch<3;ch++) {
                const adjusted=(image.data[i+ch]-128)*factor+128+offset;
                image.data[i+ch]=Math.max(0,Math.min(255,Math.round(adjusted)));
            }
        }
        ctx.putImageData(image,0,0);
        return c;
    }

    function updateVideoFilter() {
        const brightness=100+(parseFloat(brightnessInput.value)||0);
        const contrast=100+(parseFloat(contrastInput.value)||0);
        video.style.filter=`brightness(${Math.max(0,brightness)}%) contrast(${Math.max(0,contrast)}%)`;
    }

    async function refreshCameraDevices(preferredDeviceId = null) {
        if (!cameraSelect) return;

        if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
            cameraSelect.innerHTML = '<option value="">Default camera</option>';
            cameraSelect.disabled = true;
            return;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            const previous = preferredDeviceId || cameraSelect.value || '';

            cameraSelect.innerHTML = '';

            if (!cameras.length) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No camera detected';
                cameraSelect.appendChild(option);
                cameraSelect.disabled = true;
                return;
            }

            cameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.textContent = camera.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            cameraSelect.disabled = false;

            const matchingOption = Array.from(cameraSelect.options)
                .find(option => option.value === previous);

            if (matchingOption) {
                cameraSelect.value = previous;
            } else if (preferredDeviceId) {
                const currentOption = Array.from(cameraSelect.options)
                    .find(option => option.value === preferredDeviceId);
                if (currentOption) cameraSelect.value = preferredDeviceId;
            }
        } catch (err) {
            console.warn('[Skillosaic] Could not enumerate cameras:', err);
            cameraSelect.innerHTML = '<option value="">Default camera</option>';
            cameraSelect.disabled = false;
        }
    }

    async function startCamera() {
        try {
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                throw new Error('Camera access is not supported by this browser.');
            }

            const selectedDeviceId = cameraSelect && !cameraSelect.disabled
                ? cameraSelect.value
                : '';

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
                cameraTrack = null;
            }

            clearNativeCameraControls('Detecting camera capabilities…');

            const videoConstraints = {
                width: {ideal:1280},
                height: {ideal:720}
            };

            if (selectedDeviceId) {
                videoConstraints.deviceId = {exact:selectedDeviceId};
            }

            cameraStream=await navigator.mediaDevices.getUserMedia({
                video:videoConstraints,
                audio:false
            });

            cameraTrack=cameraStream.getVideoTracks()[0] || null;
            video.srcObject=cameraStream;
            video.hidden=false;
            sourceCanvas.hidden=true;
            sourcePlaceholder.style.display='none';
            captureBtn.disabled=false;

            const settings = cameraTrack && cameraTrack.getSettings
                ? cameraTrack.getSettings()
                : {};
            await refreshCameraDevices(settings.deviceId || selectedDeviceId || null);

            const selectedLabel = cameraSelect && cameraSelect.selectedOptions.length
                ? cameraSelect.selectedOptions[0].textContent
                : 'Live camera';

            sourceLabel.textContent=selectedLabel || 'Live camera';
            statusEl.textContent='Camera ready';
            updateVideoFilter();
            await configureCameraControls();
        } catch (err) {
            cameraTrack=null;
            clearNativeCameraControls('Camera unavailable.');
            statusEl.textContent='Camera unavailable';
            alert(`Could not access the camera: ${err.message}`);
        }
    }

    function createWorkingCanvasFromVideo() {
        const maxW=640,maxH=480;
        const vw=video.videoWidth || 1280, vh=video.videoHeight || 720;
        const scale=Math.min(maxW/vw,maxH/vh,1);
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(vw*scale)); c.height=Math.max(1,Math.round(vh*scale));
        c.getContext('2d',{willReadFrequently:true}).drawImage(video,0,0,c.width,c.height);
        return c;
    }

    function createWorkingCanvasFromImage(img) {
        const maxW=640,maxH=480;
        const scale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight,1);
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.naturalWidth*scale)); c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        c.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,c.width,c.height);
        return c;
    }

    function showSourceCanvas(rawCanvas,label) {
        const canvas=applyImageAdjustments(rawCanvas);
        sourceCanvas.width=canvas.width; sourceCanvas.height=canvas.height;
        sourceCanvas.getContext('2d').drawImage(canvas,0,0);
        sourceCanvas.hidden=false; video.hidden=true; sourcePlaceholder.style.display='none';
        sourceLabel.textContent=label;
        currentSource={rawCanvas,canvas,kind:'image',name:label};
        captureBtn.disabled=false;
        return canvas;
    }

    async function analyzeCanvas(canvas) {
        const k=parseInt(kSelect.value,10);
        const grams=parseFloat(totalGramsInput.value);
        if (!(grams>0)) { alert('Enter a valid total paint amount in grams.'); return; }
        statusEl.textContent='Analyzing…';
        cardsEl.innerHTML='<div class="paint-empty-state">Processing K-Means and paint formulations…</div>';
        await new Promise(resolve=>setTimeout(resolve,20));

        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        const result=runColorKmeans(ctx.getImageData(0,0,canvas.width,canvas.height),k);
        resultCanvas.width=canvas.width; resultCanvas.height=canvas.height;
        resultCanvas.getContext('2d').putImageData(result.output,0,0);
        resultPlaceholder.style.display='none';

        lastKMeansRender={
            width:result.output.width,
            height:result.output.height,
            labels:result.labelMap,
            baseImageData:new ImageData(
                new Uint8ClampedArray(result.output.data),
                result.output.width,
                result.output.height
            ),
            highlightCache:new Map()
        };
        activeKMeansClusterIndex=null;
        resultCanvas.title='Move over the K-Means result to highlight its formulation card';

        const rows=result.clusters.map(cluster=>{
            const cameraLab=rgbToLabLocal(...cluster.rgb);
            const nixLab=correctCameraLab(cameraLab);
            const formulation=findPaintMix(nixLab);
            return {...cluster,cameraLab,nixLab,formulation};
        });
        lastFormulationRows=rows;
        renderFormulationCards(rows,grams);
        statusEl.textContent=`${k} colors analyzed`;
    }

    function drawResultImageData(imageData) {
        if (!imageData) return;
        const ctx=resultCanvas.getContext('2d');
        ctx.putImageData(imageData,0,0);
    }

    function buildClusterHighlight(clusterIndex) {
        if (!lastKMeansRender) return null;
        if (lastKMeansRender.highlightCache.has(clusterIndex)) {
            return lastKMeansRender.highlightCache.get(clusterIndex);
        }

        const {width,height,labels,baseImageData}=lastKMeansRender;
        const data=new Uint8ClampedArray(baseImageData.data);

        for (let i=0;i<labels.length;i++) {
            const p=i*4;
            if (labels[i]===clusterIndex) {
                data[p]=Math.min(255,Math.round(data[p]*1.10+10));
                data[p+1]=Math.min(255,Math.round(data[p+1]*1.10+10));
                data[p+2]=Math.min(255,Math.round(data[p+2]*1.10+10));
            } else {
                const gray=0.2126*data[p]+0.7152*data[p+1]+0.0722*data[p+2];
                const dim=Math.round(gray*0.20);
                data[p]=dim;
                data[p+1]=dim;
                data[p+2]=dim;
            }
        }

        // Bright outline around the selected K-Means region.
        for (let y=0;y<height;y++) {
            for (let x=0;x<width;x++) {
                const i=y*width+x;
                if (labels[i]!==clusterIndex) continue;

                const edge=
                    x===0 || x===width-1 || y===0 || y===height-1 ||
                    labels[i-1]!==clusterIndex ||
                    labels[i+1]!==clusterIndex ||
                    labels[i-width]!==clusterIndex ||
                    labels[i+width]!==clusterIndex;

                if (edge) {
                    const p=i*4;
                    data[p]=255;
                    data[p+1]=244;
                    data[p+2]=96;
                    data[p+3]=255;
                }
            }
        }

        const highlighted=new ImageData(data,width,height);
        lastKMeansRender.highlightCache.set(clusterIndex,highlighted);
        return highlighted;
    }

    function setActiveFormulationCard(clusterIndex) {
        cardsEl.querySelectorAll('.paint-color-card.cluster-hover-active')
            .forEach(card=>card.classList.remove('cluster-hover-active'));

        if (clusterIndex===null || clusterIndex===undefined) return;
        const card=cardsEl.querySelector(`[data-formulation-index="${clusterIndex}"]`);
        if (card) card.classList.add('cluster-hover-active');
    }

    function highlightKMeansCluster(clusterIndex) {
        if (!lastKMeansRender) return;
        if (clusterIndex===activeKMeansClusterIndex) return;

        activeKMeansClusterIndex=clusterIndex;
        setActiveFormulationCard(clusterIndex);

        if (clusterIndex===null || clusterIndex===undefined) {
            drawResultImageData(lastKMeansRender.baseImageData);
            return;
        }

        const highlighted=buildClusterHighlight(clusterIndex);
        drawResultImageData(highlighted);
    }

    function clearKMeansHighlight() {
        if (!lastKMeansRender) return;
        activeKMeansClusterIndex=null;
        setActiveFormulationCard(null);
        drawResultImageData(lastKMeansRender.baseImageData);
    }

    function resultCanvasPixelFromPointer(event) {
        if (!lastKMeansRender || !resultCanvas.width || !resultCanvas.height) return null;

        const rect=resultCanvas.getBoundingClientRect();
        const scale=Math.min(
            rect.width/resultCanvas.width,
            rect.height/resultCanvas.height
        );
        const displayWidth=resultCanvas.width*scale;
        const displayHeight=resultCanvas.height*scale;
        const offsetX=(rect.width-displayWidth)/2;
        const offsetY=(rect.height-displayHeight)/2;

        const localX=event.clientX-rect.left-offsetX;
        const localY=event.clientY-rect.top-offsetY;

        if (
            localX<0 || localY<0 ||
            localX>=displayWidth || localY>=displayHeight
        ) return null;

        const x=Math.min(resultCanvas.width-1,Math.floor(localX/scale));
        const y=Math.min(resultCanvas.height-1,Math.floor(localY/scale));
        return {x,y,index:y*resultCanvas.width+x};
    }

    function renderFormulationModal(index, grams) {
        if (!lastFormulationRows || !lastFormulationRows[index] || !(grams>0)) return;

        const row=lastFormulationRows[index];
        const [r,g,b]=row.rgb;
        const recipe=row.formulation.recipe;
        const amounts=recipe.map(p=>grams*p/100);

        formulationModalSwatch.style.background=`rgb(${r},${g},${b})`;
        formulationModalTitle.textContent=`Color ${index+1}`;
        formulationModalCoverage.textContent=`${row.coverage.toFixed(1)}% of analyzed image`;
        formulationModalRgb.textContent=`${r}, ${g}, ${b}`;
        formulationModalCameraLab.textContent=fmtLab(row.cameraLab);
        formulationModalNixLab.textContent=fmtLab(row.nixLab);
        formulationModalDeltaE.textContent=row.formulation.deltaE.toFixed(2);
        formulationModalTotal.textContent=`${Math.round(grams)} g total`;

        formulationModalRedPercent.textContent=`${recipe[0].toFixed(1)}%`;
        formulationModalYellowPercent.textContent=`${recipe[1].toFixed(1)}%`;
        formulationModalBluePercent.textContent=`${recipe[2].toFixed(1)}%`;

        formulationModalRedGrams.textContent=`${amounts[0].toFixed(2)} g`;
        formulationModalYellowGrams.textContent=`${amounts[1].toFixed(2)} g`;
        formulationModalBlueGrams.textContent=`${amounts[2].toFixed(2)} g`;
        formulationModalSource.textContent=row.formulation.source;
    }

    function openFormulationModal(index) {
        const grams=parseFloat(totalGramsInput.value);
        if (!lastFormulationRows || !lastFormulationRows[index] || !(grams>0)) return;

        selectedFormulationIndex=index;
        formulationModalPreviousFocus=document.activeElement;
        renderFormulationModal(index,grams);
        formulationModalOverlay.hidden=false;
        document.body.style.overflow='hidden';
        formulationModalClose.focus();
    }

    function closeFormulationModal() {
        if (formulationModalOverlay.hidden) return;

        formulationModalOverlay.hidden=true;
        document.body.style.overflow='';
        selectedFormulationIndex=null;

        if (formulationModalPreviousFocus && typeof formulationModalPreviousFocus.focus==='function') {
            formulationModalPreviousFocus.focus();
        }
        formulationModalPreviousFocus=null;
    }

    function renderFormulationCards(rows,grams) {
        cardsEl.scrollTop=0;
        cardsEl.innerHTML='';
        rows.forEach((row,i)=>{
            const [r,g,b]=row.rgb;
            const lum=0.2126*r+0.7152*g+0.0722*b;
            const fg=lum>145?'#102030':'#fff';
            const recipe=row.formulation.recipe;
            const amounts=recipe.map(p=>grams*p/100);
            const card=document.createElement('div');
            card.className='paint-color-card';
            card.dataset.formulationIndex=String(i);
            card.tabIndex=0;
            card.setAttribute('role','button');
            card.setAttribute('aria-label',`Open details for Color ${i+1}`);
            card.innerHTML=`
                <div class="paint-color-strip" style="background:rgb(${r},${g},${b});color:${fg}">
                    <span>Color ${i+1}</span><span>${row.coverage.toFixed(1)}%</span>
                </div>
                <div class="paint-color-card-body">
                    <div class="small">RGB ${r}, ${g}, ${b}</div>
                    <div class="small">Camera LAB: ${fmtLab(row.cameraLab)}</div>
                    <div class="small">Nix-equivalent LAB: ${fmtLab(row.nixLab)}</div>

                    <div class="paint-recipe">
                        <div><span>Red</span><strong>${recipe[0].toFixed(1)}%</strong></div>
                        <div><span>Yellow</span><strong>${recipe[1].toFixed(1)}%</strong></div>
                        <div><span>Blue</span><strong>${recipe[2].toFixed(1)}%</strong></div>
                    </div>

                    <div class="paint-amount-section">
                        <div class="paint-total-label">For <strong data-role="total-grams">${Math.round(grams)}</strong> g total</div>
                        <div class="paint-amount-grid">
                            <div><span>Red</span><strong data-role="red-grams">${amounts[0].toFixed(2)} g</strong></div>
                            <div><span>Yellow</span><strong data-role="yellow-grams">${amounts[1].toFixed(2)} g</strong></div>
                            <div><span>Blue</span><strong data-role="blue-grams">${amounts[2].toFixed(2)} g</strong></div>
                        </div>
                    </div>

                    <div class="small paint-model-info">Predicted ΔE00: ${row.formulation.deltaE.toFixed(2)} · ${row.formulation.source}</div>
                </div>`;

            card.addEventListener('mouseenter',()=>highlightKMeansCluster(i));
            card.addEventListener('mouseleave',clearKMeansHighlight);
            card.addEventListener('focus',()=>highlightKMeansCluster(i));
            card.addEventListener('blur',clearKMeansHighlight);

            card.addEventListener('click',()=>openFormulationModal(i));
            card.addEventListener('keydown',event=>{
                if (event.key==='Enter' || event.key===' ') {
                    event.preventDefault();
                    openFormulationModal(i);
                }
            });

            cardsEl.appendChild(card);
        });

        // Re-analysis can preserve the previous scroll position in some browsers.
        // Always start the new formulation set at the first row.
        cardsEl.scrollTop=0;
        requestAnimationFrame(()=>{ cardsEl.scrollTop=0; });
    }

    function updateFormulationAmounts(grams) {
        if (!lastFormulationRows || !(grams>0)) return;

        lastFormulationRows.forEach((row,i)=>{
            const recipe=row.formulation.recipe;
            const amounts=recipe.map(p=>grams*p/100);
            const card=cardsEl.querySelector(`[data-formulation-index="${i}"]`);
            if (!card) return;

            const totalEl=card.querySelector('[data-role="total-grams"]');
            const redEl=card.querySelector('[data-role="red-grams"]');
            const yellowEl=card.querySelector('[data-role="yellow-grams"]');
            const blueEl=card.querySelector('[data-role="blue-grams"]');

            if (totalEl) totalEl.textContent=String(Math.round(grams));
            if (redEl) redEl.textContent=`${amounts[0].toFixed(2)} g`;
            if (yellowEl) yellowEl.textContent=`${amounts[1].toFixed(2)} g`;
            if (blueEl) blueEl.textContent=`${amounts[2].toFixed(2)} g`;
        });

        if (selectedFormulationIndex !== null && !formulationModalOverlay.hidden) {
            renderFormulationModal(selectedFormulationIndex,grams);
        }
    }

    function labToRgbDisplay(L,a,b) {
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

    function updateManualLabPreview() {
        const L=parseFloat(manualL.value);
        const a=parseFloat(manualA.value);
        const b=parseFloat(manualB.value);

        if (![L,a,b].every(Number.isFinite) || L<0 || L>100) {
            manualLabSwatch.style.background='linear-gradient(135deg, #eef2f6, #d8e0e8)';
            manualTargetLab.textContent='Enter LAB values';
            return;
        }

        const rgb=labToRgbDisplay(L,a,b);
        manualLabSwatch.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        manualTargetLab.textContent=`L* ${L.toFixed(2)} · a* ${a.toFixed(2)} · b* ${b.toFixed(2)}`;
    }

    function renderManualLabModal(grams) {
        if (!lastManualCalculation || !(grams>0)) return;

        const {L,a,b,formulation}=lastManualCalculation;
        const recipe=formulation.recipe;
        const amounts=recipe.map(p=>grams*p/100);
        const rgb=labToRgbDisplay(L,a,b);

        manualLabModalSwatch.style.background=`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        manualLabModalTarget.textContent=`sRGB preview: ${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
        manualLabModalTargetLab.textContent=fmtLab([L,a,b]);
        manualLabModalPredictedLab.textContent=fmtLab(formulation.predictedLab);
        manualLabModalDeltaE.textContent=formulation.deltaE.toFixed(2);
        manualLabModalTotal.textContent=`${Math.round(grams)} g`;

        manualLabModalRedPercent.textContent=`${recipe[0].toFixed(1)}%`;
        manualLabModalYellowPercent.textContent=`${recipe[1].toFixed(1)}%`;
        manualLabModalBluePercent.textContent=`${recipe[2].toFixed(1)}%`;

        manualLabModalRedGrams.textContent=`${amounts[0].toFixed(2)} g`;
        manualLabModalYellowGrams.textContent=`${amounts[1].toFixed(2)} g`;
        manualLabModalBlueGrams.textContent=`${amounts[2].toFixed(2)} g`;
        manualLabModalSource.textContent=formulation.source;
    }

    function openManualLabModal() {
        const grams=parseFloat(totalGramsInput.value);
        if (!lastManualCalculation || !(grams>0)) return;

        manualLabModalPreviousFocus=document.activeElement;
        renderManualLabModal(grams);
        manualLabModalOverlay.hidden=false;
        document.body.style.overflow='hidden';
        manualLabModalClose.focus();
    }

    function closeManualLabModal() {
        if (manualLabModalOverlay.hidden) return;

        manualLabModalOverlay.hidden=true;
        document.body.style.overflow='';

        if (manualLabModalPreviousFocus && typeof manualLabModalPreviousFocus.focus==='function') {
            manualLabModalPreviousFocus.focus();
        }
        manualLabModalPreviousFocus=null;
    }

    function renderManualCalculation(grams) {
        if (!lastManualCalculation || !(grams>0)) return;

        const {L,a,b,formulation}=lastManualCalculation;
        const recipe=formulation.recipe;
        const amounts=recipe.map(p=>grams*p/100);

        updateManualLabPreview();

        manualResult.innerHTML=`
            <div class="manual-result-summary">
                <div class="manual-result-target">
                    ${Math.round(grams)} g total · Predicted ΔE00 ${formulation.deltaE.toFixed(2)}
                </div>
                <div class="manual-result-recipe">
                    <div>
                        <span>Red</span>
                        <strong>${recipe[0].toFixed(1)}%</strong>
                        <b>${amounts[0].toFixed(2)} g</b>
                    </div>
                    <div>
                        <span>Yellow</span>
                        <strong>${recipe[1].toFixed(1)}%</strong>
                        <b>${amounts[1].toFixed(2)} g</b>
                    </div>
                    <div>
                        <span>Blue</span>
                        <strong>${recipe[2].toFixed(1)}%</strong>
                        <b>${amounts[2].toFixed(2)} g</b>
                    </div>
                </div>
                <div class="manual-result-meta">
                    <strong>Predicted LAB:</strong> ${fmtLab(formulation.predictedLab)}<br>
                    <strong>Source:</strong> ${formulation.source}
                </div>
                <span class="manual-result-open-hint">Click for enlarged details</span>
            </div>`;

        manualResult.classList.add('has-result');
        manualResult.tabIndex=0;
        manualResult.setAttribute('role','button');
        manualResult.setAttribute('aria-label','Open manual LAB formulation details');

        if (!manualLabModalOverlay.hidden) {
            renderManualLabModal(grams);
        }
    }

    function updateAmountsFromTotalPaint() {
        const grams=parseFloat(totalGramsInput.value);
        if (!(grams>0)) {
            statusEl.textContent='Enter a valid total paint amount';
            return;
        }
        updateFormulationAmounts(grams);
        renderManualCalculation(grams);
    }

    function fmtLab(lab) { return `L* ${lab[0].toFixed(2)}, a* ${lab[1].toFixed(2)}, b* ${lab[2].toFixed(2)}`; }

    manualResult.addEventListener('click',()=>{
        if (lastManualCalculation) openManualLabModal();
    });
    manualResult.addEventListener('keydown',event=>{
        if (!lastManualCalculation) return;
        if (event.key==='Enter' || event.key===' ') {
            event.preventDefault();
            openManualLabModal();
        }
    });

    manualLabModalClose.addEventListener('click',closeManualLabModal);
    manualLabModalOverlay.addEventListener('click',event=>{
        if (event.target===manualLabModalOverlay) closeManualLabModal();
    });
    document.addEventListener('keydown',event=>{
        if (event.key==='Escape' && !manualLabModalOverlay.hidden) {
            closeManualLabModal();
        }
    });

    formulationModalClose.addEventListener('click',closeFormulationModal);
    formulationModalOverlay.addEventListener('click',event=>{
        if (event.target===formulationModalOverlay) closeFormulationModal();
    });
    document.addEventListener('keydown',event=>{
        if (event.key==='Escape' && !formulationModalOverlay.hidden) {
            closeFormulationModal();
        }
    });

    focusModeSelect.addEventListener('change',()=> {
        if (focusModeSelect.value) applyTrackConstraint({focusMode:focusModeSelect.value});
    });
    focusInput.addEventListener('change',()=> {
        focusValue.textContent=Number(focusInput.value).toFixed(2);
        applyTrackConstraint({focusDistance:Number(focusInput.value),focusMode:'manual'});
    });

    exposureModeSelect.addEventListener('change',()=> {
        if (exposureModeSelect.value) applyTrackConstraint({exposureMode:exposureModeSelect.value});
    });
    exposureInput.addEventListener('change',()=> {
        const key=exposureInput.dataset.constraint;
        if (!key) return;
        const value=Number(exposureInput.value);
        exposureValue.textContent=key==='exposureTime' ? value.toFixed(0) : value.toFixed(2);
        const constraint={[key]:value};
        if (!exposureModeSelect.disabled && Array.from(exposureModeSelect.options).some(o=>o.value==='manual')) {
            constraint.exposureMode='manual';
        }
        applyTrackConstraint(constraint);
    });

    wbModeSelect.addEventListener('change',()=> {
        if (wbModeSelect.value) applyTrackConstraint({whiteBalanceMode:wbModeSelect.value});
    });
    wbInput.addEventListener('change',()=> {
        const value=Number(wbInput.value);
        wbValue.textContent=`${value.toFixed(0)} K`;
        const constraint={colorTemperature:value};
        if (!wbModeSelect.disabled && Array.from(wbModeSelect.options).some(o=>o.value==='manual')) {
            constraint.whiteBalanceMode='manual';
        }
        applyTrackConstraint(constraint);
    });

    function refreshPostProcessing() {
        brightnessValue.textContent=brightnessInput.value;
        contrastValue.textContent=contrastInput.value;
        updateVideoFilter();
        if (currentSource && currentSource.rawCanvas) {
            showSourceCanvas(currentSource.rawCanvas,currentSource.name);
            statusEl.textContent='Image adjustment changed — analyze again';
        }
    }
    brightnessInput.addEventListener('input',refreshPostProcessing);
    contrastInput.addEventListener('input',refreshPostProcessing);

    resetCameraControlsBtn.addEventListener('click',async()=>{
        brightnessInput.value='0';
        contrastInput.value='0';
        brightnessValue.textContent='0';
        contrastValue.textContent='0';
        updateVideoFilter();

        if (cameraTrack && typeof cameraTrack.getCapabilities==='function') {
            const caps=cameraTrack.getCapabilities() || {};
            const autoConstraints={};
            const autoMode = modes => Array.isArray(modes)
                ? (modes.includes('continuous') ? 'continuous' : modes.find(m=>m!=='manual'))
                : null;
            const focusAuto=autoMode(caps.focusMode);
            const exposureAuto=autoMode(caps.exposureMode);
            const wbAuto=autoMode(caps.whiteBalanceMode);
            if (focusAuto) autoConstraints.focusMode=focusAuto;
            if (exposureAuto) autoConstraints.exposureMode=exposureAuto;
            if (wbAuto) autoConstraints.whiteBalanceMode=wbAuto;
            if (Object.keys(autoConstraints).length) await applyTrackConstraint(autoConstraints);
            await configureCameraControls();
        }
        if (currentSource && currentSource.rawCanvas) showSourceCanvas(currentSource.rawCanvas,currentSource.name);
        statusEl.textContent='Controls reset';
    });

    cameraSelect.addEventListener('change', async () => {
        if (cameraStream) {
            statusEl.textContent='Switching camera…';
            await startCamera();
        }
    });

    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            const currentDeviceId = cameraTrack && cameraTrack.getSettings
                ? cameraTrack.getSettings().deviceId
                : cameraSelect.value;
            await refreshCameraDevices(currentDeviceId || null);
        });
    }

    startCameraBtn.addEventListener('click',startCamera);
    captureBtn.addEventListener('click',async()=>{
        let canvas;
        if (!video.hidden && video.srcObject) {
            const rawCanvas=createWorkingCanvasFromVideo();
            canvas=showSourceCanvas(rawCanvas,'Camera capture');
        } else if (currentSource && currentSource.rawCanvas) {
            canvas=showSourceCanvas(currentSource.rawCanvas,currentSource.name);
        } else return;
        await analyzeCanvas(canvas);
    });

    fileInput.addEventListener('change',()=>{
        const file=fileInput.files && fileInput.files[0];
        if (!file) return;
        const url=URL.createObjectURL(file);
        const img=new Image();
        img.onload=()=>{
            const rawCanvas=createWorkingCanvasFromImage(img);
            const canvas=showSourceCanvas(rawCanvas,file.name);
            URL.revokeObjectURL(url);
            analyzeCanvas(canvas);
        };
        img.onerror=()=>{ URL.revokeObjectURL(url); alert('Could not load the selected image.'); };
        img.src=url;
    });

    [manualL,manualA,manualB].forEach(input=>{
        input.addEventListener('input',updateManualLabPreview);
    });

    manualButton.addEventListener('click',()=>{
        const L=parseFloat(manualL.value), a=parseFloat(manualA.value), b=parseFloat(manualB.value);
        const grams=parseFloat(totalGramsInput.value);
        if (![L,a,b].every(Number.isFinite)) { alert('Enter valid L*, a* and b* values.'); return; }
        if (!(L>=0 && L<=100)) { alert('L* should normally be between 0 and 100.'); return; }
        if (!(grams>0)) { alert('Enter a valid total paint amount in grams.'); return; }

        const formulation=findPaintMix([L,a,b]);
        lastManualCalculation={L,a,b,formulation};
        updateManualLabPreview();
        renderManualCalculation(grams);
    });

    function normalizeTotalPaintInput() {
        const raw=Number(totalGramsInput.value);
        if (!Number.isFinite(raw)) return;

        const normalized=Math.max(5,Math.round(raw/5)*5);
        totalGramsInput.value=String(normalized);
        updateAmountsFromTotalPaint();
    }

    totalGramsInput.addEventListener('keydown',event=>{
        if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) {
            event.preventDefault();
        }
    });

    totalGramsInput.addEventListener('input',updateAmountsFromTotalPaint);
    totalGramsInput.addEventListener('change',normalizeTotalPaintInput);
    totalGramsInput.addEventListener('blur',normalizeTotalPaintInput);

    function resizeVisibleCanvases() {}

    resultCanvas.addEventListener('pointermove',event=>{
        const pixel=resultCanvasPixelFromPointer(event);
        if (!pixel || !lastKMeansRender) {
            clearKMeansHighlight();
            return;
        }

        const clusterIndex=lastKMeansRender.labels[pixel.index];
        highlightKMeansCluster(clusterIndex);
    });

    resultCanvas.addEventListener('pointerleave',clearKMeansHighlight);

    clearNativeCameraControls();
    refreshCameraDevices();
    updateManualLabPreview();

    window.addEventListener('beforeunload',()=>{
        if (cameraStream) cameraStream.getTracks().forEach(t=>t.stop());
    });
})();