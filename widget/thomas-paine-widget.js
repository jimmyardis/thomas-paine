/**
 * Historical Figure Chatbot Widget
 * Embeddable chat widget with persona configuration support
 *
 * Usage:
 * <script src="jacobs-widget.js"
 *         data-api-url="http://localhost:8000"
 *         data-persona-id="jane-jacobs"></script>
 */

(function() {
    'use strict';

    // Configuration from script tag
    const script = document.currentScript;
    const API_URL = script.getAttribute('data-api-url') || 'http://localhost:8000';
    const PERSONA_ID = script.getAttribute('data-persona-id') || 'thomas-paine';

    let conversationId = null;
    let isOpen = false;
    let isTyping = false;
    let personaConfig = null;
    let voiceEnabled = false;
    let currentMode = 'modern';
    let currentLength = 'detailed';
    let currentReadingLevel = 'general';
    let settingsOpen = false;

    // Load persona configuration and initialize widget
    async function init() {
        try {
            personaConfig = await loadPersonaConfig();
            applyPersonaTheme(personaConfig);
            createWidget(personaConfig);
        } catch (error) {
            console.error('Failed to load persona config:', error);
            // Fallback to Jane Jacobs defaults if config fails
            createWidget(getDefaultConfig());
        }
    }

    // Fetch persona configuration from API
    async function loadPersonaConfig() {
        const response = await fetch(`${API_URL}/persona/${PERSONA_ID}/config`);
        if (!response.ok) {
            throw new Error(`Failed to load persona config: ${response.status}`);
        }
        const config = await response.json();
        console.log(`✓ Loaded persona: ${config.metadata.name}`);
        return config;
    }

    // Apply persona theme colors as CSS variables
    function applyPersonaTheme(config) {
        if (!config.widget.theme) return;

        const root = document.documentElement;
        const theme = config.widget.theme;

        // Map config keys to CSS variable names
        const colorMap = {
            'primary_color': '--persona-primary-color',
            'cream': '--persona-cream',
            'charcoal': '--persona-charcoal',
            'warm_gray': '--persona-warm-gray',
            'dark_cream': '--persona-dark-cream',
            'text_gray': '--persona-text-gray'
        };

        Object.entries(colorMap).forEach(([configKey, cssVar]) => {
            if (theme[configKey]) {
                root.style.setProperty(cssVar, theme[configKey]);
            }
        });

        // Apply fonts
        if (theme.font_primary) {
            root.style.setProperty('--persona-font-primary', theme.font_primary);
        }
        if (theme.font_secondary) {
            root.style.setProperty('--persona-font-secondary', theme.font_secondary);
        }
    }

    // Get default config (Jane Jacobs fallback)
    function getDefaultConfig() {
        return {
            metadata: { name: 'Jane Jacobs' },
            widget: {
                conversation_starters: [
                    "What do you think about remote work killing downtowns?",
                    "Are 15-minute cities a real idea or just branding?",
                    "What would you say to a city planner today?",
                    "What are cities still getting wrong?"
                ],
                ui: {
                    header_title: 'Jane Jacobs',
                    header_subtitle: '(1916 – )',
                    header_tagline: 'Ask her anything about cities, neighborhoods, or what we keep getting wrong',
                    input_placeholder: 'Ask Jane a question...',
                    error_message: 'Sorry, I encountered an error. Please try again.'
                }
            }
        };
    }

    // Create widget HTML with persona-specific content
    function createWidget(config) {
        const ui = config.widget.ui;
        const starters = config.widget.conversation_starters;
        const trust = config.trust_score || {};
        const trustBadgeHtml = trust.score != null
            ? `<div class="jj-trust-badge" title="Source grounding: ${trust.score}/100 — ${(trust.corpus_chunks||0).toLocaleString()} corpus chunks from ${trust.distinct_works||0} works${trust.has_discourse ? ', with critical discourse' : ''}">`
              + `<span class="jj-trust-label">Grounded</span>`
              + `<span class="jj-trust-score">${trust.score}</span>`
              + `<span class="jj-trust-max">/100</span>`
              + `<span class="jj-trust-lbl">${trust.label||''}</span></div>`
            : '';

        const container = document.createElement('div');
        container.id = 'jane-jacobs-widget';
        container.innerHTML = `
            <div id="jj-trigger" class="jj-trigger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            </div>

            <div id="jj-chat-window" class="jj-chat-window jj-hidden">
                <div class="jj-header">
                    <div class="jj-header-content">
                        <h3>${ui.header_title}</h3>
                        <p class="jj-subtitle">${ui.header_subtitle}</p>
                        <p class="jj-tagline">${ui.header_tagline}</p>
                        ${trustBadgeHtml}
                    </div>
                    <div class="jj-header-btns">
                        <button id="jj-settings-btn" class="jj-settings-btn" title="Conversation settings" aria-label="Settings">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </button>
                        <button id="jj-close" class="jj-close-btn">&times;</button>
                    </div>
                </div>

                <div id="jj-settings-panel" class="jj-settings-panel jj-hidden">
                    <div class="jj-settings-row">
                        <span class="jj-settings-label">Era</span>
                        <div class="jj-pill-group" id="jj-mode-pills">
                            <button class="jj-pill" data-group="mode" data-value="modern">Modern</button>
                            <button class="jj-pill" data-group="mode" data-value="historical">Historical only</button>
                        </div>
                    </div>
                    <div class="jj-settings-row">
                        <span class="jj-settings-label">Length</span>
                        <div class="jj-pill-group" id="jj-length-pills">
                            <button class="jj-pill" data-group="length" data-value="brief">Brief</button>
                            <button class="jj-pill" data-group="length" data-value="conversational">Conversational</button>
                            <button class="jj-pill" data-group="length" data-value="detailed">Detailed</button>
                        </div>
                    </div>
                    <div class="jj-settings-row">
                        <span class="jj-settings-label">Reading level</span>
                        <div class="jj-pill-group" id="jj-level-pills">
                            <button class="jj-pill" data-group="reading_level" data-value="general">Standard</button>
                            <button class="jj-pill" data-group="reading_level" data-value="middle_school">Student (6–8th grade)</button>
                        </div>
                    </div>
                </div>

                <div id="jj-messages" class="jj-messages">
                    <div class="jj-starters">
                        ${starters.map((starter, i) =>
                            `<button class="jj-starter-btn" data-index="${i}">${starter}</button>`
                        ).join('')}
                    </div>
                </div>

                <div class="jj-input-container">
                    <button id="jj-voice" class="jj-voice-btn" title="Enable voice" aria-label="Toggle voice output">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </button>
                    <input
                        type="text"
                        id="jj-input"
                        class="jj-input"
                        placeholder="${ui.input_placeholder}"
                        disabled
                    />
                    <button id="jj-send" class="jj-send-btn" disabled>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>

                <div class="jj-educator-bar">
                    <button id="jj-lesson-plan" class="jj-edu-btn" disabled title="Generate a lesson plan featuring this figure">
                        Lesson Plan
                    </button>
                    <button id="jj-discussion" class="jj-edu-btn" disabled title="Generate discussion questions">
                        Discussion Questions
                    </button>
                </div>

                <div id="jj-edu-panel" class="jj-edu-panel jj-hidden">
                    <div class="jj-edu-panel-header">
                        <span id="jj-edu-panel-title" class="jj-edu-panel-title"></span>
                        <button id="jj-edu-close" class="jj-edu-close" title="Close">&times;</button>
                    </div>
                    <div id="jj-edu-panel-body" class="jj-edu-panel-body"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        attachEventListeners(config);
    }

    // Attach event listeners
    function attachEventListeners(config) {
        const trigger = document.getElementById('jj-trigger');
        const closeBtn = document.getElementById('jj-close');
        const sendBtn = document.getElementById('jj-send');
        const input = document.getElementById('jj-input');

        const voiceBtn = document.getElementById('jj-voice');
        const settingsBtn = document.getElementById('jj-settings-btn');

        trigger.addEventListener('click', toggleChat);
        settingsBtn.addEventListener('click', toggleSettings);
        closeBtn.addEventListener('click', closeChat);
        sendBtn.addEventListener('click', sendMessage);
        voiceBtn.addEventListener('click', toggleVoice);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Settings pill buttons
        document.querySelectorAll('.jj-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.getAttribute('data-group');
                const value = btn.getAttribute('data-value');
                if (group === 'mode') currentMode = value;
                else if (group === 'length') currentLength = value;
                else if (group === 'reading_level') currentReadingLevel = value;
                syncPills(group, value);
            });
        });
        syncPills('mode', currentMode);
        syncPills('length', currentLength);
        syncPills('reading_level', currentReadingLevel);

        // Starter buttons
        const starters = config.widget.conversation_starters;
        document.querySelectorAll('.jj-starter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                const message = starters[index];
                hideStarters();
                sendMessageWithText(message);
            });
        });

        // Educator toolbar buttons
        const lessonPlanBtn = document.getElementById('jj-lesson-plan');
        const discussionBtn = document.getElementById('jj-discussion');
        const eduClose = document.getElementById('jj-edu-close');

        lessonPlanBtn.addEventListener('click', () => fetchEducatorContent('lesson-plan', 'Lesson Plan'));
        discussionBtn.addEventListener('click', () => fetchEducatorContent('discussion-questions', 'Discussion Questions'));
        eduClose.addEventListener('click', closeEduPanel);
    }

    // Toggle chat window
    function toggleChat() {
        const chatWindow = document.getElementById('jj-chat-window');
        const trigger = document.getElementById('jj-trigger');

        if (isOpen) {
            chatWindow.classList.add('jj-hidden');
            trigger.classList.remove('jj-active');
            isOpen = false;
        } else {
            chatWindow.classList.remove('jj-hidden');
            trigger.classList.add('jj-active');
            isOpen = true;
            enableInput();
        }
    }

    // Close chat window
    function closeChat() {
        const chatWindow = document.getElementById('jj-chat-window');
        const trigger = document.getElementById('jj-trigger');
        chatWindow.classList.add('jj-hidden');
        trigger.classList.remove('jj-active');
        isOpen = false;
    }

    // Enable input after initial open
    function enableInput() {
        const input = document.getElementById('jj-input');
        const sendBtn = document.getElementById('jj-send');
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }

    // Hide conversation starters
    function hideStarters() {
        const starters = document.querySelector('.jj-starters');
        if (starters) {
            starters.style.display = 'none';
        }
    }

    // Toggle voice output on/off for this session
    function toggleVoice() {
        voiceEnabled = !voiceEnabled;
        const btn = document.getElementById('jj-voice');
        btn.classList.toggle('jj-voice-active', voiceEnabled);
        btn.title = voiceEnabled ? 'Voice on — click to mute' : 'Enable voice';
    }

    // Toggle settings panel
    function toggleSettings() {
        settingsOpen = !settingsOpen;
        const panel = document.getElementById('jj-settings-panel');
        const btn = document.getElementById('jj-settings-btn');
        panel.classList.toggle('jj-hidden', !settingsOpen);
        btn.classList.toggle('jj-settings-active', settingsOpen);
    }

    // Sync pill active state
    function syncPills(group, activeValue) {
        document.querySelectorAll(`.jj-pill[data-group="${group}"]`).forEach(btn => {
            btn.classList.toggle('jj-pill-active', btn.getAttribute('data-value') === activeValue);
        });
    }

    // Play base64-encoded MP3 audio
    function playAudio(base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
        audio.play().catch(err => console.warn('Audio playback blocked:', err));
    }

    // Send message (from input)
    function sendMessage() {
        const input = document.getElementById('jj-input');
        const message = input.value.trim();

        if (!message || isTyping) return;

        sendMessageWithText(message);
        input.value = '';
    }

    // Show three-dot loading indicator while bot is preparing a response
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('jj-messages');
        const el = document.createElement('div');
        el.id = 'jj-typing-bubble';
        el.className = 'jj-message jj-message-assistant';
        el.innerHTML = `
            <div class="jj-message-content">
                <div class="jj-typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
        messagesContainer.appendChild(el);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Remove the typing indicator before inserting the real response
    function removeTypingIndicator() {
        const el = document.getElementById('jj-typing-bubble');
        if (el) el.remove();
    }

    // Send message with specific text
    async function sendMessageWithText(message) {
        hideStarters();
        addMessage('user', message);

        isTyping = true;
        showTypingIndicator();

        try {
            const endpoint = voiceEnabled ? '/chat/voice' : '/chat';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    conversation_id: conversationId,
                    mode: currentMode,
                    length: currentLength,
                    reading_level: currentReadingLevel
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            conversationId = data.conversation_id;

            // Unlock educator buttons once a conversation is established
            enableEducatorButtons();

            // Add assistant response with typewriter effect
            removeTypingIndicator();
            addMessage('assistant', data.response, true, {
                confidence: data.confidence,
                confidence_score: data.confidence_score,
                sources: data.sources || [],
            });

            // Play audio if voice is enabled and API returned it
            if (voiceEnabled && data.audio_base64) {
                playAudio(data.audio_base64);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = personaConfig?.widget?.ui?.error_message ||
                           'Sorry, I encountered an error. Please try again.';
            removeTypingIndicator();
            addMessage('assistant', errorMsg);
        } finally {
            isTyping = false;
        }
    }

    // Add message to chat
    function addMessage(role, content, useTypewriter = false, meta = null) {
        const messagesContainer = document.getElementById('jj-messages');

        const messageDiv = document.createElement('div');
        messageDiv.className = `jj-message jj-message-${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'jj-message-content';

        if (role === 'assistant' && useTypewriter) {
            typewriterEffect(contentDiv, content);
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);

        if (role === 'assistant' && meta) {
            messageDiv.appendChild(buildMessageMeta(meta));
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Build confidence badge + sources panel for an assistant message
    function buildMessageMeta(meta) {
        const { confidence, confidence_score, sources } = meta;
        const wrap = document.createElement('div');
        wrap.className = 'jj-message-meta';

        if (confidence) {
            const dots = { high: '●●●', medium: '●●○', low: '●○○' };
            const badge = document.createElement('span');
            badge.className = `jj-confidence jj-confidence-${confidence}`;
            badge.textContent = `${dots[confidence] || '●○○'} ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}`;
            badge.title = `Source confidence: ${confidence_score || 0}/100`;
            wrap.appendChild(badge);
        }

        if (sources && sources.length > 0) {
            const toggle = document.createElement('button');
            toggle.className = 'jj-sources-toggle';
            toggle.textContent = `§ ${sources.length} source${sources.length !== 1 ? 's' : ''}`;

            const panel = document.createElement('div');
            panel.className = 'jj-sources-panel jj-hidden';

            sources.forEach(src => {
                const item = document.createElement('div');
                item.className = 'jj-source-item';

                const typeSpan = document.createElement('span');
                const isOwn = src.knowledge_type === 'own words';
                typeSpan.className = `jj-source-type ${isOwn ? 'jj-source-own' : 'jj-source-discourse'}`;
                typeSpan.textContent = isOwn ? 'own writings' : 'discourse';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'jj-source-title';
                const yr = src.year && src.year !== 'Unknown' ? ` · ${src.year}` : '';
                titleSpan.textContent = (src.title || 'Unknown') + yr;

                item.appendChild(typeSpan);
                item.appendChild(titleSpan);
                panel.appendChild(item);
            });

            toggle.addEventListener('click', () => {
                panel.classList.toggle('jj-hidden');
                toggle.classList.toggle('jj-sources-active');
            });

            wrap.appendChild(toggle);
            wrap.appendChild(panel);
        }

        return wrap;
    }

    // Typewriter effect with variable speed
    function typewriterEffect(element, text) {
        let i = 0;
        const baseSpeed = 15; // milliseconds per character

        function typeChar() {
            if (i < text.length) {
                const char = text.charAt(i);
                element.textContent += char;

                // Variable speed based on punctuation
                let speed = baseSpeed;
                if (char === '.' || char === '!' || char === '?') {
                    speed = baseSpeed * 15; // Long pause at sentence end
                } else if (char === ',' || char === ';' || char === ':') {
                    speed = baseSpeed * 8; // Medium pause at punctuation
                } else if (char === '\n') {
                    speed = baseSpeed * 10; // Pause at line breaks
                }

                // Add slight randomness for natural feel
                speed *= (0.8 + Math.random() * 0.4);

                i++;

                // Auto-scroll as text appears
                const messagesContainer = document.getElementById('jj-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                setTimeout(typeChar, speed);
            }
        }

        typeChar();
    }

    // Enable educator buttons once a conversation starts
    function enableEducatorButtons() {
        const lessonBtn = document.getElementById('jj-lesson-plan');
        const discussBtn = document.getElementById('jj-discussion');
        if (lessonBtn) lessonBtn.disabled = false;
        if (discussBtn) discussBtn.disabled = false;
    }

    // Fetch educator content from API and display in panel
    async function fetchEducatorContent(endpoint, title) {
        const lessonBtn = document.getElementById('jj-lesson-plan');
        const discussBtn = document.getElementById('jj-discussion');
        const panel = document.getElementById('jj-edu-panel');
        const panelTitle = document.getElementById('jj-edu-panel-title');
        const panelBody = document.getElementById('jj-edu-panel-body');

        // Disable buttons, show loading
        if (lessonBtn) lessonBtn.disabled = true;
        if (discussBtn) discussBtn.disabled = true;
        panelTitle.textContent = title;
        panelBody.textContent = 'Generating…';
        panel.classList.remove('jj-hidden');

        try {
            const response = await fetch(`${API_URL}/educator/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona_id: PERSONA_ID }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const content = data.lesson_plan || data.questions || '';
            panelBody.innerHTML = markdownToHtml(content);
        } catch (err) {
            console.error('Educator fetch error:', err);
            panelBody.textContent = 'Sorry, could not generate content. Please try again.';
        } finally {
            // Re-enable if conversation is active
            if (conversationId) {
                if (lessonBtn) lessonBtn.disabled = false;
                if (discussBtn) discussBtn.disabled = false;
            }
        }
    }

    // Close educator panel
    function closeEduPanel() {
        const panel = document.getElementById('jj-edu-panel');
        if (panel) panel.classList.add('jj-hidden');
    }

    // Minimal markdown-to-HTML converter for lesson plan / questions content
    function markdownToHtml(text) {
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]+?<\/li>)\n(?!<li>)/g, '$1</ul>\n')
            .replace(/(?:^|\n)(<li>)/g, '\n<ul>$1')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[hul]|<\/[hul])(.+)$/gm, '$1')
            .replace(/<p><\/p>/g, '')
            || text;
    }

    // Initialize widget when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

