const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const messages = document.getElementById("messages");
const counter = document.getElementById("counter");

let sentCount = 0;

// 本機測試先用 localhost。
// 部署 Render 後，把這裡改成你的公開 Render URL。
// 例如：https://your-service.onrender.com
const API_URL = "https://simple-chat-backend-q483.onrender.com";

function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "message";
    div.innerText = `${role}: ${text}`;
    messages.appendChild(div);
}

async function sendMessage() {
    const message = input.value.trim();

    if (!message) {
        return;
    }

    addMessage("User", message);
    input.value = "";

    button.disabled = true;
    button.innerText = "Sending...";

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

        addMessage("Server", data.reply);

        sentCount++;
        counter.innerText = `Messages sent: ${sentCount}`;
    } catch (error) {
        addMessage("Error", "無法連線到 Backend。");
        console.error(error);
    } finally {
        button.disabled = false;
        button.innerText = "Send";
        input.focus();
    }
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

clearButton.addEventListener("click", function () {
    messages.innerHTML = '<div class="system-message">聊天紀錄已清除</div>';
    sentCount = 0;
    counter.innerText = "Messages sent: 0";
});
