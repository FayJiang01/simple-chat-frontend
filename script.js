const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const themeToggle = document.getElementById("themeToggle");
const messages = document.getElementById("messages");
const counter = document.getElementById("counter");

const STORAGE_KEY = "simple-chat-history";
const THEME_KEY = "simple-chat-theme";
let chatHistory = loadChatHistory();
let sentCount = chatHistory.filter((item) => item.role === "User").length;

// 本機測試先用 localhost。
// 部署 Render 後，把這裡改成你的公開 Render URL。
// 例如：https://your-service.onrender.com
const API_URL = "https://simple-chat-backend-q483.onrender.com";

function loadChatHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error("Unable to load chat history", error);
        return [];
    }
}

function saveChatHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
}

function updateCounter() {
    counter.innerText = `Messages sent: ${sentCount}`;
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    themeToggle.innerText = isDark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    applyTheme(savedTheme || preferredTheme);
}

function scrollToLatestMessage() {
    messages.scrollTop = messages.scrollHeight;
}

function addMessage(role, text, options = {}) {
    const { save = true, extraClass = "" } = options;
    const placeholder = messages.querySelector(".system-message");

    if (placeholder) {
        placeholder.remove();
    }

    const div = document.createElement("div");
    div.className = `message ${role.toLowerCase()}-message ${extraClass}`.trim();
    div.innerText = `${role}: ${text}`;
    messages.appendChild(div);

    if (save) {
        chatHistory.push({ role, text });
        saveChatHistory();
    }

    scrollToLatestMessage();
    return div;
}

function restoreChatHistory() {
    if (chatHistory.length === 0) {
        return;
    }

    messages.innerHTML = "";
    chatHistory.forEach(({ role, text }) => {
        addMessage(role, text, { save: false });
    });
    updateCounter();
}

function addRetryMessage(message) {
    const div = document.createElement("div");
    div.className = "message error-message";

    const text = document.createElement("span");
    text.innerText = "無法連線到 Backend。";

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "retry-button";
    retryButton.innerText = "Retry";
    retryButton.addEventListener("click", function () {
        div.remove();
        sendMessage(message, false);
    });

    div.append(text, retryButton);
    messages.appendChild(div);
    scrollToLatestMessage();
}

async function sendMessage(messageToRetry = null, addUserMessage = true) {
    const message = messageToRetry ?? input.value.trim();

    if (!message) {
        return;
    }

    if (addUserMessage) {
        addMessage("User", message);
        sentCount++;
        updateCounter();
        input.value = "";
    }

    button.disabled = true;
    button.innerText = "Sending...";
    const typingMessage = addMessage("Server", "正在輸入…", {
        save: false,
        extraClass: "typing-message"
    });

    try {
        const response = await fetch(
            `${API_URL}/api/message`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message
                })
            }
        );

        if (!response.ok) {
            throw new Error("Backend returned an error");
        }

        const data = await response.json();

        typingMessage.remove();
        addMessage("Server", data.reply);
    } catch (error) {
        typingMessage.remove();
        addRetryMessage(message);
        console.error(error);
    } finally {
        button.disabled = false;
        button.innerText = "Send";
        input.focus();
    }
}

button.addEventListener("click", function () {
    sendMessage();
});

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

clearButton.addEventListener("click", function () {
    messages.innerHTML = '<div class="system-message">聊天紀錄已清除</div>';
    chatHistory = [];
    localStorage.removeItem(STORAGE_KEY);
    sentCount = 0;
    updateCounter();
});

themeToggle.addEventListener("click", function () {
    const nextTheme = document.documentElement.dataset.theme === "dark"
        ? "light"
        : "dark";

    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
});

loadTheme();
restoreChatHistory();
