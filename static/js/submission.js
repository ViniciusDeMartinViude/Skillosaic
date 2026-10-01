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

    if (!fab || !overlay || !modal) return;

    let currentDraft = null;
    let previousFocus = null;

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
            fields: {}
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

    function renderDraft(draft, created) {
        currentDraft = draft;
        currentTokenEl.textContent = draft.token;
        workspace.hidden = false;

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
            saveCurrentDraft();
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

    saveDraftBtn.addEventListener('click', () => {
        if (!currentDraft) return;
        saveCurrentDraft();
        tokenStatus.textContent = 'Draft saved in this browser.';
        tokenStatus.classList.remove('is-error');
        tokenStatus.classList.add('is-success');
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !overlay.hidden) {
            closeSubmissionModal();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (currentDraft) saveCurrentDraft();
    });

    // Small public API so the form can grow without changing the storage layer.
    window.SkillosaicSubmission = Object.freeze({
        getCurrentDraft,
        updateFields,
        save: saveCurrentDraft,
        getCurrentToken: () => currentDraft ? currentDraft.token : null
    });
})();
