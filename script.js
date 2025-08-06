const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const adminIcon = document.getElementById('admin-icon');
const resetChatIcon = document.getElementById('reset-chat-icon');
const switchGPT = document.getElementById('switch-gpt');
const switchLuna = document.getElementById('switch-luna');

// --- Conversational Styles ---
const STYLES = [
    { id: 'gpt', label: 'GPT', storageKey: 'gpt' },
    { id: 'luna', label: 'Luna', storageKey: 'luna' }
];
let activeStyle = localStorage.getItem('active_style') || 'gpt';

function setActiveStyle(styleId) {
    activeStyle = styleId;
    localStorage.setItem('active_style', styleId);
    updateStyleSwitchUI();
    loadStyleContext();
}

function updateStyleSwitchUI() {
    if (activeStyle === 'gpt') {
        switchGPT.classList.add('active');
        switchLuna.classList.remove('active');
    } else {
        switchGPT.classList.remove('active');
        switchLuna.classList.add('active');
    }
}

switchGPT.addEventListener('click', () => setActiveStyle('gpt'));
switchLuna.addEventListener('click', () => setActiveStyle('luna'));

// --- API Key por estilo ---
function getStyleApiKey(styleId) {
    try {
        return localStorage.getItem('style_apikey_' + styleId) || '';
    } catch { return ''; }
}
function setStyleApiKey(styleId, key) {
    try {
        localStorage.setItem('style_apikey_' + styleId, key);
    } catch {}
}

// --- Historial por estilo ---
function getStyleChatHistory(styleId) {
    try {
        const data = localStorage.getItem('chat_history_' + styleId);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}
function saveStyleChatHistory(styleId, history) {
    try {
        localStorage.setItem('chat_history_' + styleId, JSON.stringify(history));
    } catch {}
}
function removeStyleChatHistory(styleId) {
    try {
        localStorage.removeItem('chat_history_' + styleId);
    } catch {}
}

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const addApikeyForm = document.getElementById('add-apikey-form');
const apikeyNameInput = document.getElementById('apikey-name-input');
const apikeyValueInput = document.getElementById('apikey-value-input');
const apikeyList = document.getElementById('apikey-list');
const settingsError = document.getElementById('settings-error');
// Contextos
const addContextForm = document.getElementById('add-context-form');
const contextNameInput = document.getElementById('context-name-input');
const contextTextInput = document.getElementById('context-text-input');
const contextList = document.getElementById('context-list');
const contextAssignInfo = document.getElementById('context-assign-info');
// Export/Import
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const importDataFile = document.getElementById('import-data-file');
const deleteAllBtn = document.getElementById('delete-all-btn');

// Borrar todo y cerrar sesión
if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres borrar TODA la información y cerrar sesión? Esta acción no se puede deshacer.')) {
            localStorage.clear();
            settingsModal.style.display = 'none';
            setTimeout(() => location.reload(), 200);
        }
    });
}

// Exportar datos (keys, contextos, historiales)
exportDataBtn.addEventListener('click', () => {
    const data = {
        apikeys: getAllApiKeys(),
        style_apikeys: {
            gpt: getStyleApiKey('gpt'),
            luna: getStyleApiKey('luna')
        },
        contexts: getAllContexts(),
        style_contexts: {
            gpt: getStyleContextId('gpt'),
            luna: getStyleContextId('luna')
        },
        histories: {
            gpt: getStyleChatHistory('gpt'),
            luna: getStyleChatHistory('luna')
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aiwebchat-backup.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
});

// Importar datos (keys, contextos, historiales)
importDataBtn.addEventListener('click', () => {
    importDataFile.value = '';
    importDataFile.click();
});
importDataFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (!data) throw new Error('Archivo vacío o corrupto');
            if (!confirm('¿Seguro que quieres importar y sobrescribir tus datos actuales?')) return;
            // Restaurar datos
            if (data.apikeys) saveAllApiKeys(data.apikeys);
            if (data.style_apikeys) {
                setStyleApiKey('gpt', data.style_apikeys.gpt || '');
                setStyleApiKey('luna', data.style_apikeys.luna || '');
            }
            if (data.contexts) saveAllContexts(data.contexts);
            if (data.style_contexts) {
                setStyleContextId('gpt', data.style_contexts.gpt || '');
                setStyleContextId('luna', data.style_contexts.luna || '');
            }
            if (data.histories) {
                if (Array.isArray(data.histories.gpt)) saveStyleChatHistory('gpt', data.histories.gpt);
                if (Array.isArray(data.histories.luna)) saveStyleChatHistory('luna', data.histories.luna);
            }
            settingsError.textContent = '¡Datos importados correctamente!';
            renderApiKeyList();
            renderContextList();
            loadStyleContext();
        } catch (err) {
            settingsError.textContent = 'Error al importar: ' + err.message;
        }
    };
    reader.readAsText(file);
});

// --- Contextos helpers ---
function getAllContexts() {
    try {
        const list = localStorage.getItem('contexts_list');
        return list ? JSON.parse(list) : [];
    } catch { return []; }
}
function saveAllContexts(list) {
    try {
        localStorage.setItem('contexts_list', JSON.stringify(list));
    } catch {}
}
function getStyleContextId(styleId) {
    try {
        return localStorage.getItem('style_context_' + styleId) || '';
    } catch { return ''; }
}
function setStyleContextId(styleId, contextId) {
    try {
        localStorage.setItem('style_context_' + styleId, contextId);
    } catch {}
}
function getContextById(id) {
    return getAllContexts().find(ctx => ctx.id === id);
}
function getStyleContextText(styleId) {
    const ctxId = getStyleContextId(styleId);
    const ctx = getContextById(ctxId);
    return ctx ? ctx.text : '';
}
// --- END Contextos helpers ---

// Helpers para API Keys múltiples
function getAllApiKeys() {
    try {
        const list = localStorage.getItem('apikeys_list');
        return list ? JSON.parse(list) : [];
    } catch { return []; }
}
function saveAllApiKeys(list) {
    try {
        localStorage.setItem('apikeys_list', JSON.stringify(list));
    } catch {}
}
// Asignar una API Key guardada a un estilo
function assignApiKeyToStyle(styleId, keyName) {
    const all = getAllApiKeys();
    const found = all.find(k => k.name === keyName);
    if (found) {
        setStyleApiKey(styleId, found.key);
        if (activeStyle === styleId) {
            openaiApiKey = found.key;
            saveAPIKeyLocally(found.key);
            loadStyleContext(); // Fuerza recarga de chat con la Key asignada
        }
    }
}
function getStyleApiKeyName(styleId) {
    const key = getStyleApiKey(styleId);
    if (!key) return '';
    const all = getAllApiKeys();
    const found = all.find(k => k.key === key);
    return found ? found.name : '';
}

// Modal open/close
adminIcon.addEventListener('click', () => {
    renderApiKeyList();
    renderContextList();
    settingsModal.style.display = 'flex';
    settingsError.textContent = '';
});
closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
});

// Agregar nueva API Key
addApikeyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = apikeyNameInput.value.trim();
    const key = apikeyValueInput.value.trim().replace(/\s/g, "");
    if (!name || !key) {
        settingsError.textContent = 'Both fields are required.';
        return;
    }
    if (!validateAPIKeyFormat(key)) {
        settingsError.textContent = 'Invalid API key format.';
        return;
    }
    let all = getAllApiKeys();
    if (all.some(k => k.name === name)) {
        settingsError.textContent = 'Name already exists.';
        return;
    }
    all.push({ name, key });
    saveAllApiKeys(all);
    setStyleApiKey(activeStyle, key); // Asigna la key al estilo activo automáticamente
    openaiApiKey = key;
    saveAPIKeyLocally(key);
    renderApiKeyList();
    loadStyleContext(); // Recarga el chat automáticamente
    apikeyNameInput.value = '';
    apikeyValueInput.value = '';
    settingsError.textContent = '';
});

function renderApiKeyList() {
    const all = getAllApiKeys();
    apikeyList.innerHTML = '';
    if (all.length === 0) {
        apikeyList.innerHTML = '<li style="color:#888;">No API Keys saved.</li>';
        return;
    }
    all.forEach(({ name, key }) => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'apikey-name';
        nameSpan.textContent = name;
        const partialSpan = document.createElement('span');
        partialSpan.className = 'apikey-partial';
        partialSpan.textContent = key.slice(0, 4) + '...' + key.slice(-4);
        const actions = document.createElement('span');
        actions.className = 'apikey-actions';
        // Asignar a GPT
        const assignGPTBtn = document.createElement('button');
        assignGPTBtn.textContent = 'GPT';
        if (getStyleApiKey('gpt') === key) assignGPTBtn.classList.add('selected');
        assignGPTBtn.onclick = () => {
            assignApiKeyToStyle('gpt', name);
            renderApiKeyList();
            if (activeStyle === 'gpt') loadStyleContext();
        };
        // Asignar a Luna
        const assignLunaBtn = document.createElement('button');
        assignLunaBtn.textContent = 'Luna';
        if (getStyleApiKey('luna') === key) assignLunaBtn.classList.add('selected');
        assignLunaBtn.onclick = () => {
            assignApiKeyToStyle('luna', name);
            renderApiKeyList();
            if (activeStyle === 'luna') loadStyleContext();
        };
        // Eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            const confirmDelete = confirm('Delete API Key "' + name + '"?');
            if (!confirmDelete) return;
            let allNow = getAllApiKeys();
            allNow = allNow.filter(k => k.name !== name);
            saveAllApiKeys(allNow);
            // Si la key eliminada estaba asignada a algún estilo, quitarla
            if (getStyleApiKey('gpt') === key) setStyleApiKey('gpt', '');
            if (getStyleApiKey('luna') === key) setStyleApiKey('luna', '');
            renderApiKeyList();
            loadStyleContext();
        };
        actions.appendChild(assignGPTBtn);
        actions.appendChild(assignLunaBtn);
        actions.appendChild(deleteBtn);
        li.appendChild(nameSpan);
        li.appendChild(partialSpan);
        li.appendChild(actions);
        apikeyList.appendChild(li);
    });
    // Mostrar cuál key está asignada a cada estilo
    const info = document.createElement('div');
    info.style.fontSize = '0.97em';
    info.style.marginTop = '0.7em';
    info.innerHTML = `<b>GPT:</b> ${getStyleApiKeyName('gpt') || '<i>None</i>'} &nbsp;&nbsp; <b>Luna:</b> ${getStyleApiKeyName('luna') || '<i>None</i>'}`;
    apikeyList.parentElement.appendChild(info);
}

// -------- Contextos --------
function renderContextList() {
    const all = getAllContexts();
    contextList.innerHTML = '';
    if (all.length === 0) {
        contextList.innerHTML = '<li style="color:#888;">No hay contextos guardados.</li>';
    } else {
        all.forEach(ctx => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.flexDirection = 'column';
            li.style.marginBottom = '0.5em';
            const topRow = document.createElement('div');
            topRow.style.display = 'flex';
            topRow.style.alignItems = 'center';
            topRow.style.gap = '0.5em';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'context-name';
            nameSpan.textContent = ctx.name;
            nameSpan.style.fontWeight = 'bold';
            const actions = document.createElement('span');
            actions.className = 'context-actions';
            // Asignar a GPT
            const assignGPTBtn = document.createElement('button');
            assignGPTBtn.textContent = 'GPT';
            if (getStyleContextId('gpt') === ctx.id) assignGPTBtn.classList.add('selected');
            assignGPTBtn.onclick = () => {
                setStyleContextId('gpt', ctx.id);
                renderContextList();
                if (activeStyle === 'gpt') loadStyleContext();
            };
            // Asignar a Luna
            const assignLunaBtn = document.createElement('button');
            assignLunaBtn.textContent = 'Luna';
            if (getStyleContextId('luna') === ctx.id) assignLunaBtn.classList.add('selected');
            assignLunaBtn.onclick = () => {
                setStyleContextId('luna', ctx.id);
                renderContextList();
                if (activeStyle === 'luna') loadStyleContext();
            };
            // Eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                const confirmDelete = confirm('¿Eliminar el contexto "' + ctx.name + '"?');
                if (!confirmDelete) return;
                let allNow = getAllContexts();
                allNow = allNow.filter(c => c.id !== ctx.id);
                saveAllContexts(allNow);
                // Si estaba asignado, quitarlo del estilo
                if (getStyleContextId('gpt') === ctx.id) setStyleContextId('gpt', '');
                if (getStyleContextId('luna') === ctx.id) setStyleContextId('luna', '');
                renderContextList();
                loadStyleContext();
            };
            actions.appendChild(assignGPTBtn);
            actions.appendChild(assignLunaBtn);
            actions.appendChild(deleteBtn);
            topRow.appendChild(nameSpan);
            topRow.appendChild(actions);
            li.appendChild(topRow);
            // Texto del contexto
            const txt = document.createElement('div');
            txt.textContent = ctx.text;
            txt.style.fontSize = '0.98em';
            txt.style.color = '#444';
            txt.style.marginTop = '2px';
            li.appendChild(txt);
            contextList.appendChild(li);
        });
    }
    // Mostrar cuál contexto está asignado a cada estilo
    const ctxGPT = getContextById(getStyleContextId('gpt'));
    const ctxLuna = getContextById(getStyleContextId('luna'));
    contextAssignInfo.innerHTML = `<b>GPT:</b> ${ctxGPT ? ctxGPT.name : '<i>Ninguno</i>'} &nbsp;&nbsp; <b>Luna:</b> ${ctxLuna ? ctxLuna.name : '<i>Ninguno</i>'}`;
}

// Agregar nuevo contexto
addContextForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = contextNameInput.value.trim();
    const text = contextTextInput.value.trim();
    if (!name || !text) {
        settingsError.textContent = 'Ambos campos para contexto son obligatorios.';
        return;
    }
    let all = getAllContexts();
    if (all.some(c => c.name === name)) {
        settingsError.textContent = 'Ya existe un contexto con ese nombre.';
        return;
    }
    // Generar ID único
    const id = 'ctx_' + Date.now() + '_' + Math.random().toString(16).slice(2,8);
    all.push({ id, name, text });
    saveAllContexts(all);
    contextNameInput.value = '';
    contextTextInput.value = '';
    settingsError.textContent = '';
    renderContextList();
});

let conversationHistory = [];
function saveChatHistoryLocally(history) {}
function getChatHistoryLocally() { return []; }
function removeChatHistoryLocally() {}
let isLoading = false;
let openaiApiKey = null;

function getActiveSystemMessage() {
    const ctxText = getStyleContextText(activeStyle);
    return {
        role: "system",
        content: ctxText || "You are a helpful and friendly AI assistant. Strive for clarity and conciseness. You are on a mobile-friendly chat interface."
    };
}

/* API Key Panel Logic */
const apikeyPanel = document.getElementById('apikey-panel');
const apikeyInput = document.getElementById('apikey-input');
const apikeySaveBtn = document.getElementById('apikey-save-btn');
const apikeyError = document.getElementById('apikey-error');
const chatContainer = document.getElementById('chat-container');

function saveAPIKeyLocally(apikey) {
    try {
        localStorage.setItem('openai_apikey', apikey);
    } catch {}
}
function getAPIKeyLocally() {
    try {
        return localStorage.getItem('openai_apikey') || '';
    } catch { return ''; }
}
function removeAPIKeyLocally() {
    try {
        localStorage.removeItem('openai_apikey');
    } catch {}
}

function showAPIKeyPanel(show) {
    apikeyPanel.style.display = show ? 'flex' : 'none';
    chatContainer.style.display = show ? 'none' : 'flex';
    if (show) {
        apikeyInput.value = '';
        apikeyError.textContent = '';
        setTimeout(() => apikeyInput.focus(), 120);
    }
}

// Cambia validación de API Key para Cerebras
function validateAPIKeyFormat(key) {
    const trimmed = key.trim().replace(/\s/g, "");
    // Cerebras keys empiezan con "csk-"
    if (/^csk-[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
        return true;
    }
    return false;
}
apikeySaveBtn.addEventListener('click', () => {
    const key = apikeyInput.value.trim().replace(/\s/g, "");
    apikeyError.textContent = '';
    if (!validateAPIKeyFormat(key)) {
        apikeyError.textContent = 'Por favor ingresa una API Key válida de Cerebras (debe comenzar con "csk-").';
        return;
    }
    openaiApiKey = key;
    saveAPIKeyLocally(key);
    setStyleApiKey(activeStyle, key); // Asigna directa
    loadStyleContext(); // Recarga el chat automáticamente
    showAPIKeyPanel(false);
    resetChatToWelcome();
});
apikeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') apikeySaveBtn.click();
});

// Reset chat icon handler to just restart conversation (keep API key)
resetChatIcon.addEventListener('click', () => {
    resetChatToWelcome();
});

/* Main Chat Logic */
function resetChatToWelcome() {
    chatBox.innerHTML = '';
    conversationHistory = [];
    removeStyleChatHistory(activeStyle);
    const sysMsg = getActiveSystemMessage();
    addMessageToChat(sysMsg.content, 'ai');
    saveStyleChatHistory(activeStyle, conversationHistory);
    userInput.focus();
}

function addMessageToChat(text, sender, isHtml = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    if (isHtml) {
        messageElement.innerHTML = text;
    } else {
        messageElement.textContent = text;
    }
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoadingIndicator() {
    isLoading = true;
    sendButton.disabled = true;
    userInput.disabled = true;
    addMessageToChat('<div class="loading-dots"><span></span><span></span><span></span></div>', 'ai', true);
    chatBox.lastElementChild.classList.add('loading-indicator');
}

function removeLoadingIndicator() {
    isLoading = false;
    sendButton.disabled = false;
    userInput.disabled = false;
    const loadingElement = chatBox.querySelector('.loading-indicator');
    if (loadingElement) {
        chatBox.removeChild(loadingElement);
    }
    userInput.focus();
}

async function handleSendMessage() {
    const userText = userInput.value.trim();
    if (userText === '' || isLoading || !openaiApiKey) {
        return;
    }
    addMessageToChat(userText, 'user');
    userInput.value = '';

    const newUserMessage = {
        role: "user",
        content: userText,
    };
    conversationHistory.push(newUserMessage);
    saveStyleChatHistory(activeStyle, conversationHistory);

    const systemMessage = getActiveSystemMessage();

    const messagesToSend = [
        systemMessage,
        ...conversationHistory.slice(-10)
    ];

    showLoadingIndicator();

    try {
        const aiResponseText = await fetchOpenAIChatResponse(messagesToSend);
        removeLoadingIndicator();
        addMessageToChat(aiResponseText, 'ai');
        conversationHistory.push({ role: 'assistant', content: aiResponseText });
        saveStyleChatHistory(activeStyle, conversationHistory);

        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
            saveStyleChatHistory(activeStyle, conversationHistory);
        }
    } catch (error) {
        removeLoadingIndicator();
        let mensaje = "Error al contactar OpenAI: " + (error.message || error);
        addMessageToChat(mensaje, 'ai');
        showAPIKeyPanel(true);
    }
}

sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
    }
});

/**
 * Fetch chat completion from Cerebras API
 * @param {*} messages array of {role, content}
 * @returns completion string
 */
async function fetchOpenAIChatResponse(messages) {
    if (!openaiApiKey) throw new Error("No API key set.");

    // Endpoint Cerebras
    const endpoint = "https://api.cerebras.cloud/v1/chat/completions";
    const body = {
        model: "gpt-oss-120b",
        messages,
        stream: false,
        max_completion_tokens: 2048,
        temperature: 1,
        top_p: 1,
        reasoning_effort: "medium"
    };
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        let errorDetail = await res.text();
        let errMsg = `API error ${res.status}: ${errorDetail}`;
        try {
            const errorJson = JSON.parse(errorDetail);
            if (errorJson.error && errorJson.error.message) {
                errMsg = `API error: ${errorJson.error.message}`;
            } else if (res.status === 401) {
                errMsg = "API Key inválida o no autorizada. Verifica e ingresa nuevamente.";
            }
        } catch (e) {
            if (res.status === 401) {
                errMsg = "API Key inválida o no autorizada. Verifica e ingresa nuevamente.";
            }
        }
        throw new Error(errMsg);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API error");
    return data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content
        ? data.choices[0].delta.content.trim()
        : (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
            ? data.choices[0].message.content.trim()
            : '[No response]');
}

/* On Page Load: restore API key if present, otherwise show panel */
window.addEventListener('load', () => {
    updateStyleSwitchUI();
    loadStyleContext();
});

function loadStyleContext() {
    openaiApiKey = getStyleApiKey(activeStyle);
    if (!openaiApiKey || !validateAPIKeyFormat(openaiApiKey)) {
        showAPIKeyPanel(true);
        chatBox.innerHTML = '';
        conversationHistory = [];
        addMessageToChat('No hay ninguna API Key de Cerebras asignada a este chat. Ve a configuración para agregar o asignar una (debe comenzar con "csk-").', 'ai');
        return;
    }
    showAPIKeyPanel(false);
    conversationHistory = getStyleChatHistory(activeStyle);
    chatBox.innerHTML = '';
    if (conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
            addMessageToChat(msg.content, msg.role === 'user' ? 'user' : 'ai');
        });
    } else {
        resetChatToWelcome();
    }
}
