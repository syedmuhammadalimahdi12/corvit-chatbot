(function () {
  const CHAT_ENDPOINT = "/.netlify/functions/chat";
  const MAX_HISTORY = 6;

  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const resetBtn = document.getElementById("chat-reset");
  const body = document.getElementById("chat-body");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const charCount = document.getElementById("char-count");
  const status = document.getElementById("chat-status");
  const quickReplies = document.getElementById("quick-replies");

  let history = [];
  let opened = false;

  function openPanel() {
    panel.classList.add("open");
    if (!opened) {
      opened = true;
      addBotMessage(
        "Hi! I'm the Corvit assistant. Ask me about courses, admission (paid vs NAVTTC), timetables or campuses — or tap a suggestion below.",
        {}
      );
    }
    input.focus();
  }

  function closePanel() {
    panel.classList.remove("open");
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  if (resetBtn) resetBtn.addEventListener("click", resetChat);
  document.querySelectorAll("[data-open-chat]").forEach((btn) =>
    btn.addEventListener("click", openPanel)
  );

  quickReplies.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (!btn) return;
    sendMessage(btn.dataset.q);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(text);
  });

  if (charCount) {
    input.addEventListener("input", () => {
      charCount.textContent = `${input.value.length} / 500`;
    });
  }

  function resetChat() {
    history = [];
    body.innerHTML = "";
    quickReplies.hidden = false;
    if (status) status.textContent = "Online · admissions guidance";
    opened = false;
    openPanel();
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addUserMessage(text) {
    const el = document.createElement("div");
    el.className = "msg user";
    el.innerHTML = `<div class="bubble"></div>`;
    el.querySelector(".bubble").textContent = text;
    body.appendChild(el);
    scrollToBottom();
  }

  function addBotMessage(text, { images = [], recommendations = [] } = {}) {
    const el = document.createElement("div");
    el.className = "msg bot";

    const imagesHtml = images.length
      ? `<div class="msg-images">${images
          .map((img) => `<img src="${img.src}" alt="${escapeHtml(img.title)}" title="${escapeHtml(img.title)}" />`)
          .join("")}</div>`
      : "";

    const recsHtml = recommendations.length
      ? `<div class="msg-recs">${recommendations
          .map((r) => `<a href="${r.href}">${escapeHtml(r.label)} →</a>`)
          .join("")}</div>`
      : "";

    el.innerHTML = `<div class="bubble">${escapeHtml(text)}${imagesHtml}${recsHtml}</div>`;
    body.appendChild(el);
    scrollToBottom();
  }

  function addTypingIndicator() {
    const el = document.createElement("div");
    el.className = "msg bot";
    el.id = "typing-indicator";
    el.innerHTML = `<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
    body.appendChild(el);
    scrollToBottom();
    return el;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function sendMessage(text) {
    addUserMessage(text);
    quickReplies.hidden = true;
    const typingEl = addTypingIndicator();
    input.disabled = true;
    if (status) status.textContent = "Thinking · checking Corvit guidance";

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      typingEl.remove();

      if (!res.ok) {
        addBotMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      addBotMessage(data.reply, {
        images: data.images || [],
        recommendations: data.recommendations || [],
      });

      addSourceNote(data);

      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: data.reply });
      history = history.slice(-MAX_HISTORY);
    } catch (err) {
      typingEl.remove();
      addBotMessage(
        "I couldn't reach the server. If you're running this locally, make sure you started it with `netlify dev` (not just opening index.html directly)."
      );
      if (status) status.textContent = "Offline · check your local server";
    } finally {
      input.disabled = false;
      input.focus();
      if (status && status.textContent.startsWith("Thinking")) {
        status.textContent = "Online · admissions guidance";
      }
    }
  }

  function addSourceNote(data) {
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const sourceText = sources.length ? `Based on ${sources.length} Corvit topic${sources.length === 1 ? "" : "s"}` : "General guidance";
    const webText = data.usedWebSearch ? " · web checked" : "";
    const el = document.createElement("div");
    el.className = "source-note";
    el.textContent = `${sourceText}${webText}`;
    body.appendChild(el);
    scrollToBottom();
  }
})();
