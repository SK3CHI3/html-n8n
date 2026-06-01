// Interactive Chat Widget for n8n
(function() {
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    const defaultSettings = {
        webhook: {
            url: '',
            route: ''
        },
        leadWebhook: {
            url: ''
        },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: {
                text: 'Powered by n8n',
                link: 'https://n8n.io'
            }
        },
        style: {
            primaryColor: '#854fff',
            secondaryColor: '#6b3fd4',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#333333'
        },
        suggestedQuestions: []
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
                    --chat-color-primary: var(--chat-widget-primary, #854fff);
                    --chat-color-secondary: var(--chat-widget-secondary, #6b3fd4);
                    --chat-color-tertiary: var(--chat-widget-secondary, #6b3fd4);
                    --chat-color-light: var(--chat-widget-light, #ede9fe);
                    --chat-color-surface: var(--chat-widget-surface, #ffffff);
                    --chat-color-text: var(--chat-widget-text, #333333);
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
                .chat-assist-widget .chat-window.visible {
                    display: flex;
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
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
                .chat-assist-widget .chat-header-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                }
                .chat-assist-widget .chat-close-btn {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--chat-transition);
                    font-size: 18px;
                    border-radius: var(--chat-radius-full);
                    width: 28px;
                    height: 28px;
                }
                .chat-assist-widget .chat-close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-50%) scale(1.1);
                }
                .chat-assist-widget .chat-welcome {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 24px;
                    text-align: center;
                    width: 100%;
                    max-width: 320px;
                }
                .chat-assist-widget .chat-welcome-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--chat-color-text);
                    margin-bottom: 24px;
                    line-height: 1.3;
                }
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
                    transition: var(--chat-transition);
                    font-weight: 600;
                    font-family: inherit;
                    margin-bottom: 16px;
                    box-shadow: var(--chat-shadow-md);
                }
                .chat-assist-widget .chat-start-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--chat-shadow-lg);
                }
                .chat-assist-widget .chat-response-time {
                    font-size: 14px;
                    color: var(--chat-color-text-light);
                    margin: 0;
                }
                .chat-assist-widget .chat-body {
                    display: none;
                    flex-direction: column;
                    height: 100%;
                }
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
                .chat-assist-widget .chat-messages::-webkit-scrollbar-track { background: transparent; }
                .chat-assist-widget .chat-messages::-webkit-scrollbar-thumb {
                    background-color: rgba(133, 79, 255, 0.3);
                    border-radius: var(--chat-radius-full);
                }
                .chat-assist-widget .chat-bubble {
                    padding: 14px 18px;
                    border-radius: var(--chat-radius-md);
                    max-width: 85%;
                    word-wrap: break-word;
                    font-size: 14px;
                    line-height: 1.6;
                    position: relative;
                    white-space: pre-line;
                }
                .chat-assist-widget .chat-bubble.user-bubble {
                    background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                    box-shadow: var(--chat-shadow-sm);
                }
                .chat-assist-widget .chat-bubble.bot-bubble {
                    background: white;
                    color: var(--chat-color-text);
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                    box-shadow: var(--chat-shadow-sm);
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
                    box-shadow: var(--chat-shadow-sm);
                    border: 1px solid var(--chat-color-light);
                }
                .chat-assist-widget .typing-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--chat-color-primary);
                    border-radius: var(--chat-radius-full);
                    opacity: 0.7;
                    animation: typingAnimation 1.4s infinite ease-in-out;
                }
                .chat-assist-widget .typing-dot:nth-child(1) { animation-delay: 0s; }
                .chat-assist-widget .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .chat-assist-widget .typing-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typingAnimation {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
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
                    transition: var(--chat-transition);
                }
                .chat-assist-widget .chat-textarea:focus {
                    outline: none;
                    border-color: var(--chat-color-primary);
                    box-shadow: 0 0 0 3px rgba(133, 79, 255, 0.2);
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
                    transition: var(--chat-transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: var(--chat-shadow-sm);
                }
                .chat-assist-widget .chat-submit:hover {
                    transform: scale(1.05);
                    box-shadow: var(--chat-shadow-md);
                }
                .chat-assist-widget .chat-submit svg { width: 22px; height: 22px; }
                .chat-assist-widget .chat-launcher {
                    position: fixed;
                    bottom: 20px;
                    height: 56px;
                    border-radius: var(--chat-radius-full);
                    background: linear-gradient(135deg, var(--chat-color-primary) 0%, var(--chat-color-secondary) 100%);
                    color: white;
                    border: none;
                    cursor: pointer;
                    box-shadow: var(--chat-shadow-md);
                    z-index: 999;
                    transition: var(--chat-transition);
                    display: flex;
                    align-items: center;
                    padding: 0 20px 0 16px;
                    gap: 8px;
                }
                .chat-assist-widget .chat-launcher.right-side { right: 20px; }
                .chat-assist-widget .chat-launcher.left-side { left: 20px; }
                .chat-assist-widget .chat-launcher:hover {
                    transform: scale(1.05);
                    box-shadow: var(--chat-shadow-lg);
                }
                .chat-assist-widget .chat-launcher svg { width: 24px; height: 24px; }
                .chat-assist-widget .chat-launcher-text {
                    font-weight: 600;
                    font-size: 15px;
                    white-space: nowrap;
                }
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
                    transition: var(--chat-transition);
                    font-family: inherit;
                }
                .chat-assist-widget .chat-footer-link:hover { opacity: 1; }
                .chat-assist-widget .suggested-questions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin: 12px 0;
                    align-self: flex-start;
                    max-width: 85%;
                }
                .chat-assist-widget .suggested-question-btn {
                    background: #f3f4f6;
                    border: 1px solid var(--chat-color-light);
                    border-radius: var(--chat-radius-md);
                    padding: 10px 14px;
                    text-align: left;
                    font-size: 13px;
                    color: var(--chat-color-text);
                    cursor: pointer;
                    transition: var(--chat-transition);
                    font-family: inherit;
                    line-height: 1.4;
                }
                .chat-assist-widget .suggested-question-btn:hover {
                    background: var(--chat-color-light);
                    border-color: var(--chat-color-primary);
                }
                .chat-assist-widget .chat-link {
                    color: var(--chat-color-primary);
                    text-decoration: underline;
                    word-break: break-all;
                }
                .chat-assist-widget .chat-link:hover {
                    color: var(--chat-color-secondary);
                }
                @media (max-width: 480px) {
                    .chat-assist-widget .chat-window {
                        right: 12px;
                        width: calc(100vw - 24px);
                        height: calc(100vh - 120px);
                    }
                    .chat-assist-widget .chat-launcher.right-side { right: 12px; }
                    .chat-assist-widget .chat-launcher.left-side { left: 12px; }
                }
            </style>
            <div class="chat-window right-side">
                <div class="chat-header">
                    <img class="chat-header-logo" src="" alt="" style="display:none;">
                    <span class="chat-header-title"></span>
                    <button class="chat-close-btn">×</button>
                </div>
                <div class="chat-welcome">
                    <h2 class="chat-welcome-title"></h2>
                    <button class="chat-start-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Start chatting
                    </button>
                    <p class="chat-response-time"></p>
                </div>
                <div class="chat-body">
                    <div class="chat-messages"></div>
                    <div class="chat-controls">
                        <textarea class="chat-textarea" placeholder="Type your message here..." rows="1"></textarea>
                        <button class="chat-submit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 2L11 13"></path>
                                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="chat-footer">
                        <a class="chat-footer-link" href="" target="_blank"></a>
                    </div>
                </div>
            </div>
            <button class="chat-launcher right-side">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span class="chat-launcher-text">Need help?</span>
            </button>
        `;
        
        document.body.appendChild(widgetRoot);
        
        widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
        widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
        widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
        widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);
        
        const chatWindow = widgetRoot.querySelector('.chat-window');
        const launchButton = widgetRoot.querySelector('.chat-launcher');
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
        
        if (settings.branding.logo) {
            headerLogo.src = settings.branding.logo;
            headerLogo.style.display = 'block';
        }
        headerTitle.textContent = settings.branding.name || 'Chat';
        welcomeTitle.textContent = settings.branding.welcomeText || 'Hi 👋, how can we help?';
        responseTime.textContent = settings.branding.responseTimeText || 'We typically respond right away';
        footerLink.href = settings.branding.poweredBy?.link || 'https://n8n.io';
        footerLink.textContent = settings.branding.poweredBy?.text || 'Powered by n8n';
        
        if (settings.style.position === 'left') {
            chatWindow.classList.remove('right-side');
            chatWindow.classList.add('left-side');
            launchButton.classList.remove('right-side');
            launchButton.classList.add('left-side');
        }
        
        launchButton.addEventListener('click', () => {
            chatWindow.classList.toggle('visible');
        });
        
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.remove('visible');
        });
        
        startBtn.addEventListener('click', async () => {
            widgetRoot.querySelector('.chat-welcome').style.display = 'none';
            
            conversationId = crypto.randomUUID();
            
            await initializeChat();
        });
        
        submitBtn.addEventListener('click', () => {
            const text = textarea.value.trim();
            if (text && !isWaitingForResponse) {
                submitMessage(text);
                textarea.value = '';
                textarea.style.height = 'auto';
            }
        });
        
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = textarea.value.trim();
                if (text && !isWaitingForResponse) {
                    submitMessage(text);
                    textarea.value = '';
                    textarea.style.height = 'auto';
                }
            }
        });
        
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight > 120 ? 120 : textarea.scrollHeight) + 'px';
        });
        
        async function initializeChat() {
            chatBody.classList.add('active');
            
            const typingIndicator = createTypingIndicator();
            messagesContainer.appendChild(typingIndicator);
            
            try {
                const sessionData = [{
                    action: "loadPreviousSession",
                    sessionId: conversationId,
                    route: settings.webhook.route,
                    metadata: { userId: userData.email, userName: userData.name }
                }];
                
                await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionData)
                });
                
                const userInfoData = {
                    action: "sendMessage",
                    sessionId: conversationId,
                    route: settings.webhook.route,
                    chatInput: `Name: ${userData.name}\nEmail: ${userData.email}`,
                    metadata: { userId: userData.email, userName: userData.name, isUserInfo: true }
                };
                
                const response = await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userInfoData)
                });
                
                const data = await response.json();
                messagesContainer.removeChild(typingIndicator);
                
                const messageText = getResponseText(data);
                addBotMessage(messageText || 'Hi! How can I help you today?');
                
            } catch (error) {
                console.error('Init error:', error);
                messagesContainer.removeChild(typingIndicator);
                addBotMessage("Hi! How can I help you today?");
            }
        }
        
        async function submitMessage(text) {
            if (isWaitingForResponse) return;
            
            isWaitingForResponse = true;
            
            addUserMessage(text);
            
            const typingIndicator = createTypingIndicator();
            messagesContainer.appendChild(typingIndicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            try {
                const requestData = {
                    action: "sendMessage",
                    sessionId: conversationId,
                    route: settings.webhook.route,
                    chatInput: text,
                    metadata: { userId: userData.email, userName: userData.name }
                };
                
                const response = await fetch(settings.webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                
                const data = await response.json();
                messagesContainer.removeChild(typingIndicator);
                
                const messageText = getResponseText(data);
                addBotMessage(messageText || "I didn't get a response. Please try again.");
                
            } catch (error) {
                console.error('Message error:', error);
                messagesContainer.removeChild(typingIndicator);
                addBotMessage("Sorry, I couldn't send your message. Please try again.");
            } finally {
                isWaitingForResponse = false;
            }
        }
        
        function getResponseText(data) {
            if (!data) return '';
            if (Array.isArray(data)) {
                return data[0]?.output || data[0]?.text || data[0]?.message || '';
            }
            return data.output || data.text || data.message || '';
        }
        
        function addUserMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'chat-bubble user-bubble';
            msg.textContent = text;
            messagesContainer.appendChild(msg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function addBotMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'chat-bubble bot-bubble';
            msg.innerHTML = linkifyText(text);
            messagesContainer.appendChild(msg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function createTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            return indicator;
        }
        
        function linkifyText(text) {
            const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            return text.replace(urlPattern, function(url) {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
            });
        }
    }

    window.ChatWidget = {
        init: function(config) {
            settings = {
                ...defaultSettings,
                ...config,
                branding: { ...defaultSettings.branding, ...config.branding },
                style: { ...defaultSettings.style, ...config.style },
                webhook: { ...defaultSettings.webhook, ...config.webhook },
                leadWebhook: { ...defaultSettings.leadWebhook, ...config.leadWebhook }
            };
            
            if (config.metadata) {
                userData = {
                    name: config.metadata.userName || '',
                    email: config.metadata.userId || ''
                };
            }
            
            createWidget();
        }
    };
})();