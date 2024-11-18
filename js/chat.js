const API_KEY = 'sk-Qqb4YtDMzZ1uZcjF8512E103DdD54282B57157Bd92576f40';
const API_URL = 'https://free.v36.cm/v1/chat/completions';
let isLoading = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_TOKENS = 2000;
const MAX_INPUT_LENGTH = 500;

// 添加网页内容作为上下文
const pageContent = document.querySelector('.about-content').textContent.trim();

let messageHistory = [{
    role: 'system',
    content: `你是四湾岛的AI旅游助手。请基于以下信息回答问题：${pageContent}\n\n请用简短友好的中文回答关于四湾岛旅游的问题。如果问题与四湾岛旅游无关，请礼貌地引导用户询问相关问题。`
}];

// 添加敏感词过滤
const sensitiveWords = ['赌博', '色情', '政治', '暴力'];
function containsSensitiveWords(text) {
    return sensitiveWords.some(word => text.includes(word));
}

// 防抖函数
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 初始化聊天界面
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    // 添加欢迎消息
    setTimeout(() => {
        appendMessage('ai', '您好！我是四湾岛AI旅游助手。我可以为您介绍：\n1. 景点信息\n2. 交通方式\n3. 住宿建议\n4. 活动推荐\n请问您想了解哪些内容？');
    }, 500);
});

function initializeChat() {
    const toggleBtn = document.getElementById('toggleChat');
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.querySelector('.chat-input button');

    // 保存聊天窗口状态
    const chatState = localStorage.getItem('chatState');
    if (chatState === 'hidden') {
        chatContainer.style.display = 'none';
    }

    toggleBtn.addEventListener('click', () => {
        const newState = chatContainer.style.display === 'none' ? 'flex' : 'none';
        chatContainer.style.display = newState;
        localStorage.setItem('chatState', newState === 'none' ? 'hidden' : 'visible');
    });

    // 输入框处理
    userInput.addEventListener('input', debounce(() => {
        const length = userInput.value.length;
        if (length > MAX_INPUT_LENGTH) {
            userInput.value = userInput.value.substring(0, MAX_INPUT_LENGTH);
        }
        // 显示剩余字数
        const remainingChars = MAX_INPUT_LENGTH - length;
        userInput.setAttribute('placeholder', `还可以输入${remainingChars}字...`);
    }, 100));

    // 发送消息事件
    const sendMessageHandler = () => {
        if (!isLoading && userInput.value.trim()) {
            sendMessage();
        }
    };

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessageHandler();
        }
    });

    sendBtn.addEventListener('click', sendMessageHandler);

    // 添加清除按钮
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清除记录';
    clearBtn.className = 'clear-btn';
    clearBtn.onclick = clearChat;
    document.querySelector('.chat-header').appendChild(clearBtn);
}

async function sendMessage() {
    if (isLoading) return;

    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message || message.length > MAX_INPUT_LENGTH) {
        appendMessage('error', '请输入1-500字的问题。');
        return;
    }

    // 敏感词检查
    if (containsSensitiveWords(message)) {
        appendMessage('error', '请勿输入不当内容。');
        return;
    }

    appendMessage('user', message);
    userInput.value = '';
    isLoading = true;
    retryCount = 0;

    messageHistory.push({
        role: 'user',
        content: message
    });

    const loadingId = appendMessage('loading', '正在考...');

    try {
        await sendMessageWithRetry(loadingId);
    } catch (error) {
        console.error('Error:', error);
        removeMessage(loadingId);
        appendMessage('error', '抱歉，服务暂时不可用，请稍后重试。');
        messageHistory.pop();
    } finally {
        isLoading = false;
        userInput.setAttribute('placeholder', '请输入您的问题...');
    }
}

async function sendMessageWithRetry(loadingId) {
    while (retryCount < MAX_RETRIES) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messageHistory,
                    temperature: 0.7,
                    max_tokens: MAX_TOKENS,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.5,
                    top_p: 0.9,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(`API错误: ${response.status} ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            const aiResponse = data.choices[0].message.content;
            
            messageHistory.push({
                role: 'assistant',
                content: aiResponse
            });

            if (messageHistory.length > 10) {
                messageHistory = [
                    messageHistory[0],
                    ...messageHistory.slice(-9)
                ];
            }
            
            removeMessage(loadingId);
            appendMessage('ai', aiResponse);
            return;

        } catch (error) {
            console.error('Error details:', error);
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
        }
    }
}

function appendMessage(type, content) {
    try {
        const chatBox = document.getElementById('chatBox');
        const messageDiv = document.createElement('div');
        const messageId = 'msg-' + Date.now();
        
        messageDiv.id = messageId;
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = content;
        
        // 添加复制按钮
        if (type === 'ai') {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = '复制';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content)
                    .then(() => {
                        copyBtn.textContent = '已复制';
                        setTimeout(() => {
                            copyBtn.textContent = '复制';
                        }, 2000);
                    });
            };
            messageDiv.appendChild(copyBtn);
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        return messageId;
    } catch (error) {
        console.error('Error appending message:', error);
        return null;
    }
}

function removeMessage(messageId) {
    try {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    } catch (error) {
        console.error('Error removing message:', error);
    }
}

// 清理聊天记录
function clearChat() {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';
    messageHistory = [messageHistory[0]];
    appendMessage('ai', '聊天记录已清空，请问有什么可以帮您？');
} 