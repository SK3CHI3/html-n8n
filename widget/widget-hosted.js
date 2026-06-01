// Interactive Chat Widget for n8n
(function() {
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    const defaultSettings = {
        webhook: { url: '', route: '' },
        leadWebhook: { url: '' },
        branding: {
            logo: '',
            name: 'Chat',
            welcomeText: 'Hi 👋, how can we help?',
            responseTimeText: 'We typically respond right away',
            poweredBy: { text: 'Powered by n8n', link: 'https://n8n.io' }
        },
        style: {
            primaryColor: '#854fff',
            secondaryColor: '#6b3fd4',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#333333'
        }
    };

    let settings = {};
    let conversationId = '';
    let isWaitingForResponse = false;
    let userData = { name: '', email: '' };

    function createWidget() {
        const widgetRoot = document.createElement('div');
        widgetRoot.className = 'chat-assist-widget';

        widgetRoot.innerHTML = `
        <style>
            .chat-assist-widget {
                --chat-color-primary: var(--chat-widget-primary, ${settings.style.primaryColor});
                --chat-color-secondary: var(--chat-widget-secondary, ${settings.style.secondaryColor});
                --chat-color-tertiary: var(--chat-widget-secondary, ${settings.style.secondaryColor});
                --chat-color-light: var(--chat-widget-light, #ede9fe);
                --chat-color-surface: var(--chat-widget-surface, ${settings.style.backgroundColor});
                --chat-color-text: var(--chat-widget-text, ${settings.style.fontColor});
                --chat-color-text-light: var(--chat-widget-text-light, #888888);
                --chat-color-border: var(--chat-widget-border, #e0e0e0);
                --chat-shadow-sm: 0 1px 3px rgba(133,79,255,0.1);
                --chat-shadow-md: 0 4px 6px rgba(133,79,255,0.15);
                --chat-shadow-lg: 0 10px 15px rgba(133,79,255,0.2);
                --chat-radius-sm: 8px;
                --chat-radius-md: 12px;
                --chat-radius-lg: 20px;
                --chat-radius-full: 9999px;
                --chat-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            }
            .chat-assist-widget * { box-sizing: border-box; margin: 0; padding: 0; }
            .chat-assist-widget .chat-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                z-index: 1000;
                width: 380px;
                height: 580px;
                background: var(--chat-color-surface);
                border-radius: var(--chat-radius-lg);
                box-shadow: var(--chat-shadow-lg);
                border: 1px solid var(--chat-color-light);
                overflow: hidden;
                display: none;
                flex-direction: column;
                transition: var(--chat-transition);
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            .chat-assist-widget .chat-window.right-side { right: 20px; }
            .chat-assist-widget .chat-window.left-side { left: 20px; }
            .chat-assist-widget .chat-window.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
            .chat-assist-widget .chat-header {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                position: relative;
            }
            .chat-assist-widget .chat-header-logo {
                width: 32px;
                height: 32px;
                border-radius: var(--chat-radius-sm);
                object-fit: contain;
                background: white;
                padding: 4px;
            }
            .chat-assist-widget .chat-header-title { font-size: 16px; font-weight: 600; color: white; }
            .chat-assist-widget .chat-close-btn {
                position: absolute;
                right: 16px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                border-radius: var(--chat-radius-full);
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-assist-widget .chat-close-btn:hover { background: rgba(255,255,255,0.3); }
            .chat-assist-widget .chat-welcome {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 24px;
                text-align: center;
                width: 100%;
                max-width: 320px;
                display: block;
            }
            .chat-assist-widget .chat-welcome.hidden { display: none; }
            .chat-assist-widget .user-registration {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 24px;
                text-align: center;
                width: 100%;
                max-width: 320px;
                display: none;
            }
            .chat-assist-widget .user-registration.active { display: block; }
            .chat-assist-widget .registration-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--chat-color-text);
                margin-bottom: 16px;
            }
            .chat-assist-widget .registration-form {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 16px;
            }
            .chat-assist-widget .form-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
                text-align: left;
            }
            .chat-assist-widget .form-label {
                font-size: 13px;
                font-weight: 500;
                color: var(--chat-color-text);
            }
            .chat-assist-widget .form-input {
                padding: 10px 12px;
                border: 1.5px solid var(--chat-color-border);
                border-radius: var(--chat-radius-md);
                font-family: inherit;
                font-size: 14px;
                background: #fafafa;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .chat-assist-widget .form-input:focus {
                outline: none;
                border-color: var(--chat-color-primary);
                background: white;
                box-shadow: 0 0 0 3px rgba(133,79,255,0.12);
            }
            .chat-assist-widget .form-input.error { border-color: #ef4444; background: #fff5f5; }
            .chat-assist-widget .form-error {
                font-size: 11px;
                color: #ef4444;
                margin-top: 2px;
                display: none;
            }
            .chat-assist-widget .form-error.show { display: block; }
            .chat-assist-widget .submit-registration {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                border: none;
                border-radius: var(--chat-radius-md);
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                font-family: inherit;
            }
            .chat-assist-widget .submit-registration:hover { opacity: 0.9; }
            .chat-assist-widget .submit-registration:disabled { opacity: 0.5; cursor: not-allowed; }
            .chat-assist-widget .chat-start-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                padding: 14px 20px;
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                border: none;
                border-radius: var(--chat-radius-md);
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                font-family: inherit;
                margin-bottom: 16px;
                box-shadow: var(--chat-shadow-md);
            }
            .chat-assist-widget .chat-start-btn:hover { transform: translateY(-2px); box-shadow: var(--chat-shadow-lg); }
            .chat-assist-widget .chat-response-time { font-size: 14px; color: var(--chat-color-text-light); }
            .chat-assist-widget .chat-body { display: none; flex-direction: column; height: 100%; }
            .chat-assist-widget .chat-body.active { display: flex; }
            .chat-assist-widget .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f9fafb;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .chat-assist-widget .chat-messages::-webkit-scrollbar { width: 6px; }
            .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb { background: rgba(133,79,255,0.3); border-radius: 99px; }
            .chat-assist-widget .chat-bubble {
                padding: 14px 18px;
                border-radius: var(--chat-radius-md);
                max-width: 85%;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.6;
                white-space: pre-line;
            }
            .chat-assist-widget .chat-bubble.user-bubble {
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .chat-assist-widget .chat-bubble.bot-bubble {
                background: white;
                color: var(--chat-color-text);
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                border: 1px solid var(--chat-color-light);
            }
            .chat-assist-widget .typing-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 14px 18px;
                background: white;
                border-radius: var(--chat-radius-md);
                border-bottom-left-radius: 4px;
                max-width: 80px;
                align-self: flex-start;
                border: 1px solid var(--chat-color-light);
            }
            .chat-assist-widget .typing-dot {
                width: 8px;
                height: 8px;
                background: var(--chat-color-primary);
                border-radius: 99px;
                opacity: 0.7;
                animation: typingAnimation 1.4s infinite ease-in-out;
            }
            .chat-assist-widget .typing-dot:nth-child(1) { animation-delay: 0s; }
            .chat-assist-widget .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .chat-assist-widget .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typingAnimation { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
            .chat-assist-widget .chat-controls {
                padding: 16px;
                background: var(--chat-color-surface);
                border-top: 1px solid var(--chat-color-light);
                display: flex;
                gap: 10px;
            }
            .chat-assist-widget .chat-textarea {
                flex: 1;
                padding: 14px 16px;
                border: 1px solid var(--chat-color-light);
                border-radius: var(--chat-radius-md);
                background: var(--chat-color-surface);
                color: var(--chat-color-text);
                resize: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.5;
                max-height: 120px;
                min-height: 48px;
            }
            .chat-assist-widget .chat-textarea:focus {
                outline: none;
                border-color: var(--chat-color-primary);
                box-shadow: 0 0 0 3px rgba(133,79,255,0.2);
            }
            .chat-assist-widget .chat-textarea::placeholder { color: var(--chat-color-text-light); }
            .chat-assist-widget .chat-submit {
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                border: none;
                border-radius: var(--chat-radius-md);
                width: 48px;
                height: 48px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .chat-assist-widget .chat-submit:hover { transform: scale(1.05); }
            .chat-assist-widget .chat-submit svg { width: 22px; height: 22px; }
            .chat-assist-widget .chat-launcher {
                position: fixed;
                bottom: 20px;
                right: 20px;
                height: 56px;
                border-radius: var(--chat-radius-full);
                background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: var(--chat-shadow-md);
                z-index: 999;
                display: flex;
                align-items: center;
                padding: 0 20px 0 16px;
                gap: 8px;
            }
            .chat-assist-widget .chat-launcher.right-side { right: 20px; }
            .chat-assist-widget .chat-launcher.left-side { left: 20px; }
            .chat-assist-widget .chat-launcher:hover { transform: scale(1.05); box-shadow: var(--chat-shadow-lg); }
            .chat-assist-widget .chat-launcher svg { width: 24px; height: 24px; }
            .chat-assist-widget .chat-launcher-text { font-weight: 600; font-size: 15px; white-space: nowrap; }
            .chat-assist-widget .chat-footer {
                padding: 10px;
                text-align: center;
                background: var(--chat-color-surface);
                border-top: 1px solid var(--chat-color-light);
            }
            .chat-assist-widget .chat-footer-link {
                color: var(--chat-color-primary);
                text-decoration: none;
                font-size: 12px;
                opacity: 0.8;
            }
            .chat-assist-widget .chat-footer-link:hover { opacity: 1; }
            .chat-assist-widget .chat-link { color: var(--chat-color-primary); text-decoration: underline; word-break: break-all; }
            @media (max-width: 480px) {
                .chat-assist-widget .chat-window { right: 12px; width: calc(100vw - 24px); }
                .chat-assist-widget .chat-launcher.right-side { right: 12px; }
            }
        </style>
        <div class="chat-window right-side">
            <div class="chat-header">
                <img class="chat-header-logo" src="" alt="" style="display:none">
                <span class="chat-header-title"></span>
                <button class="chat-close-btn">×</button>
            </div>
            <div class="chat-welcome">
                <h2 class="chat-welcome-title"></h2>
                <button class="chat-start-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Start chatting
                </button>
                <p class="chat-response-time"></p>
            </div>
            <div class="user-registration">
                <h2 class="registration-title">Please enter your details to start chatting</h2>
                <form class="registration-form">
                    <div class="form-field">
                        <label class="form-label" for="chat-user-name">Name</label>
                        <input type="text" id="chat-user-name" class="form-input" placeholder="Your name" required>
                        <div class="form-error" id="name-error"></div>
                    </div>
                    <div class="form-field">
                        <label class="form-label" for="chat-user-email">Email</label>
                        <input type="email" id="chat-user-email" class="form-input" placeholder="Your email" required>
                        <div class="form-error" id="email-error"></div>
                    </div>
                    <button type="submit" class="submit-registration">Continue to Chat</button>
                </form>
            </div>
            <div class="chat-body">
                <div class="chat-messages"></div>
                <div class="chat-controls">
                    <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
                    <button class="chat-submit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                    </button>
                </div>
                <div class="chat-footer">
                    <a class="chat-footer-link" href="" target="_blank"></a>
                </div>
            </div>
        </div>
        <button class="chat-launcher right-side">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span class="chat-launcher-text">Need help?</span>
        </button>`;

        document.body.appendChild(widgetRoot);

        const chatWindow = widgetRoot.querySelector('.chat-window');
        const launchBtn = widgetRoot.querySelector('.chat-launcher');
        const headerLogo = widgetRoot.querySelector('.chat-header-logo');
        const headerTitle = widgetRoot.querySelector('.chat-header-title');
        const welcomeTitle = widgetRoot.querySelector('.chat-welcome-title');
        const startBtn = widgetRoot.querySelector('.chat-start-btn');
        const responseTime = widgetRoot.querySelector('.chat-response-time');
        const chatBody = widgetRoot.querySelector('.chat-body');
        const messagesContainer = widgetRoot.querySelector('.chat-messages');
        const textarea = widgetRoot.querySelector('.chat-textarea');
        const submitBtn = widgetRoot.querySelector('.chat-submit');
        const footerLink = widgetRoot.querySelector('.chat-footer-link');
        const closeBtn = widgetRoot.querySelector('.chat-close-btn');
        const userRegistration = widgetRoot.querySelector('.user-registration');
        const registrationForm = widgetRoot.querySelector('.registration-form');
        const welcomeSection = widgetRoot.querySelector('.chat-welcome');
        const nameInput = widgetRoot.querySelector('#chat-user-name');
        const emailInput = widgetRoot.querySelector('#chat-user-email');
        const nameError = widgetRoot.querySelector('#name-error');
        const emailError = widgetRoot.querySelector('#email-error');
        const submitRegistrationBtn = widgetRoot.querySelector('.submit-registration');

        if (settings.branding.logo) {
            headerLogo.src = settings.branding.logo;
            headerLogo.style.display = 'block';
        }
        headerTitle.textContent = settings.branding.name || 'Chat';
        welcomeTitle.textContent = settings.branding.welcomeText || 'Hi 👋';
        responseTime.textContent = settings.branding.responseTimeText || '';
        footerLink.href = settings.branding.poweredBy?.link || 'https://n8n.io';
        footerLink.textContent = settings.branding.poweredBy?.text || 'Powered by n8n';

        if (settings.style.position === 'left') {
            chatWindow.classList.remove('right-side');
            chatWindow.classList.add('left-side');
            launchBtn.classList.remove('right-side');
            launchBtn.classList.add('left-side');
        }

        launchBtn.addEventListener('click', () => {
            chatWindow.classList.add('visible');
        });
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('visible');
        });

        startBtn.addEventListener('click', () => {
            welcomeSection.classList.add('hidden');
            userRegistration.classList.add('active');
        });

        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            nameError.textContent = '';
            emailError.textContent = '';
            nameInput.classList.remove('error');
            emailInput.classList.remove('error');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            let isValid = true;
            
            if (!name) {
                nameError.textContent = 'Please enter your name';
                nameError.classList.add('show');
                nameInput.classList.add('error');
                isValid = false;
            }
            
            if (!email) {
                emailError.textContent = 'Please enter your email';
                emailError.classList.add('show');
                emailInput.classList.add('error');
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emailError.textContent = 'Please enter a valid email';
                emailError.classList.add('show');
                emailInput.classList.add('error');
                isValid = false;
            }
            
            if (!isValid) return;
            
            userData = { name, email };
            submitRegistrationBtn.disabled = true;
            submitRegistrationBtn.textContent = 'Connecting...';
            
            try {
                if (settings.leadWebhook?.url) {
                    await fetch(settings.leadWebhook.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            firstName: name.split(' ')[0] || name,
                            lastName: name.split(' ').slice(1).join(' ') || '',
                            email: email,
                            clientSite: window.location.hostname
                        })
                    });
                }
                
                userRegistration.classList.remove('active');
                chatBody.classList.add('active');
                conversationId = crypto.randomUUID();
                await initChat();
                
            } catch (e) {
                console.error(e);
                submitRegistrationBtn.disabled = false;
                submitRegistrationBtn.textContent = 'Continue to Chat';
            }
        });

        submitBtn.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text && !isWaitingForResponse) {
                sendMessage(text);
                textarea.value = '';
                textarea.style.height = 'auto';
            }
        });

        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = textarea.value.trim();
                if (text && !isWaitingForResponse) {
                    sendMessage(text);
                    textarea.value = '';
                    textarea.style.height = 'auto';
                }
            }
        });

        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        });

        async function initChat() {
            addTyping();
            try {
                await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify([{
                        action: "loadPreviousSession",
                        sessionId: conversationId,
                        route: settings.webhook.route,
                        metadata: { userId: userData.email, userName: userData.name }
                    }])
                });

                const res = await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: "sendMessage",
                        sessionId: conversationId,
                        route: settings.webhook.route,
                        chatInput: `Name: ${userData.name}\nEmail: ${userData.email}`,
                        metadata: { userId: userData.email, userName: userData.name, isUserInfo: true }
                    })
                });
                const data = await res.json();
                removeTyping();
                addBotMessage(getResponseText(data) || 'Hi! How can I help you today?');
            } catch (e) {
                console.error(e);
                removeTyping();
                addBotMessage('Hi! How can I help you today?');
            }
        }

        async function sendMessage(text) {
            if (isWaitingForResponse) return;
            isWaitingForResponse = true;
            addUserMessage(text);
            addTyping();
            try {
                const res = await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: "sendMessage",
                        sessionId: conversationId,
                        route: settings.webhook.route,
                        chatInput: text,
                        metadata: { userId: userData.email, userName: userData.name }
                    })
                });
                const data = await res.json();
                removeTyping();
                addBotMessage(getResponseText(data) || "I didn't get a response.");
            } catch (e) {
                console.error(e);
                removeTyping();
                addBotMessage("Sorry, I couldn't send your message. Please try again.");
            }
            isWaitingForResponse = false;
        }

        function getResponseText(data) {
            if (!data) return '';
            if (Array.isArray(data)) return data[0]?.output || data[0]?.text || data[0]?.message || '';
            return data.output || data.text || data.message || '';
        }

        function addUserMessage(text) {
            const m = document.createElement('div');
            m.className = 'chat-bubble user-bubble';
            m.textContent = text;
            messagesContainer.appendChild(m);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function addBotMessage(text) {
            const m = document.createElement('div');
            m.className = 'chat-bubble bot-bubble';
            m.innerHTML = text.replace(/\n/g, '<br>').replace(linkifyPattern, '<a href="$1" target="_blank" class="chat-link">$1</a>');
            messagesContainer.appendChild(m);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        const linkifyPattern = /(https?:\/\/[^\s<]+)/g;

        function addTyping() {
            if (!messagesContainer.querySelector('.typing-indicator')) {
                const t = document.createElement('div');
                t.className = 'typing-indicator';
                t.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
                messagesContainer.appendChild(t);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        function removeTyping() {
            const t = messagesContainer.querySelector('.typing-indicator');
            if (t) t.remove();
        }
    }

    window.ChatWidget = {
        init: function(config) {
            settings = { ...defaultSettings, ...config };
            settings.branding = { ...defaultSettings.branding, ...config.branding };
            settings.style = { ...defaultSettings.style, ...config.style };
            if (config.metadata) {
                userData = { name: config.metadata.userName || '', email: config.metadata.userId || '' };
            }
            createWidget();
        }
    };
})();