// 简化版 ChatGPT 前端逻辑（尽量易读、易改）
(function () {
  const log = document.getElementById("chat-log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const clearBtn = document.getElementById("chat-clear");

  // 复制到剪贴板（优先使用 Clipboard API，失败则降级）
  async function copyText(text, btn){
    try{
      if (navigator.clipboard && window.isSecureContext !== false) {
        await navigator.clipboard.writeText(text || "");
      } else {
        const ta = document.createElement("textarea");
        ta.value = text || "";
        ta.style.position = "fixed"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
      if (btn){
        const prev = btn.textContent;
        btn.textContent = "已复制 ✓";
        btn.classList.add("copy-ok");
        setTimeout(()=>{ btn.textContent = prev; btn.classList.remove("copy-ok"); }, 1200);
      }
    }catch(e){
      alert("复制失败：" + e.message);
    }
  }

  // --- 工具函数 ---
  function nowTime() {
    const d = new Date();
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
           " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function appendBubble(role, text, time) {
      const wrap = document.createElement("div");

      const bubble = document.createElement("div");
      bubble.className = "bubble " + (role === "user" ? "bubble-user" : "bubble-bot");
      bubble.innerHTML = (window.markdownToHtml ? window.markdownToHtml(text) : (text || ''));

      // === 新增: 复制按钮 ===
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "复制本气泡内容";
      copyBtn.addEventListener("click", () => copyText(text, copyBtn));

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = (role === "user" ? "我" : "机器人") + " · " + (time || nowTime());

      wrap.appendChild(bubble);
      wrap.appendChild(copyBtn); // 把按钮放在 meta 前面
      wrap.appendChild(meta);

      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "typing";
    el.textContent = "对方正在输入…";
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  // --- 本地存储：保存/恢复对话 ---
  const STORAGE_KEY = "chat_history_simple";
  function saveMessage(role, text, time) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.push({ role, text, time: time || nowTime() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getHistory() {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log("history get:", list);
    return list;
  }

  function restoreHistory() {
    try {
      const list = getHistory();
      list.forEach(m => appendBubble(m.role, m.text, m.time));
    } catch (e) {}
  }
  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    log.innerHTML = "";
  }

  restoreHistory();

  // --- 发送消息 ---
  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendBubble("user", text);
    saveMessage("user", text);
    input.value = "";
    input.focus();

    // 打字中提示
    const typingEl = showTyping();

    try {
      // 获取对话历史记录
      const history = getHistory();
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text,
          history: history  // 发送对话历史
        })
      });
      const data = await res.json();
      typingEl.remove();
      appendBubble("bot", data.reply);
      saveMessage("bot", data.reply);
    } catch (err) {
      typingEl.remove();
      appendBubble("bot", "请求失败：" + err);
      saveMessage("bot", "请求失败：" + err);
    }
  }

  form.addEventListener("submit", handleSubmit);
  clearBtn.addEventListener("click", clearHistory);
  input.focus();
})();