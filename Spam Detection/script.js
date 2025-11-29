
const HISTORY_KEY = "spamguardHistory";
const FEEDBACK_KEY = "spamguardFeedback";


const spamRules = {
  keywords: [
    "free",
    "win",
    "winner",
    "lottery",
    "jackpot",
    "offer",
    "limited",
    "click here",
    "urgent",
    "act now",
    "bonus",
    "reward"
  ],
  urgency: ["now", "immediately", "within 24 hours", "last chance"],
  urlRegex: /(https?:\/\/[^\s]+)/gi
};

const escapeHtml = (str = "") =>
  str.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const shorten = (text, max = 45) =>
  text.length > max ? text.slice(0, max).trim() + "..." : text;


const calculateSpamScore = message => {
  const lower = message.toLowerCase();

  const keywordMatches = spamRules.keywords.filter(w => lower.includes(w));
  const keywordScore = keywordMatches.reduce(acc => acc + 10, 0); 

  const links = lower.match(spamRules.urlRegex) || [];
  const linkScore = links.length * 20;

  const urgencyMatches = spamRules.urgency.filter(w => lower.includes(w));
  const urgencyScore = urgencyMatches.length * 10;

  const exclamationCount = (message.match(/!/g) || []).length;
  const punctuationScore = exclamationCount >= 3 ? 5 : 0;

  const total = Math.min(keywordScore + linkScore + urgencyScore + punctuationScore, 100);

  return {
    total,
    keywordScore,
    linkScore,
    urgencyScore,
    exclamationCount,
    keywordMatches,
    links
  };
};


const getCategoryFromScore = score => {
  if (score < 30) return { label: "Safe", color: "#2f8f5b" };
  if (score < 70) return { label: "Suspicious", color: "#c78b00" };
  return { label: "High Spam Risk", color: "#d12b3b" };
};


const loadHistory = () => {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveHistoryEntry = entry => {
  const history = loadHistory();
  const updated = [entry, ...history].slice(0, 10); 
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};


const initDetectorPage = () => {
  const inputEl = document.getElementById("spamInput");
  if (!inputEl) return; 

  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const sampleBtn = document.getElementById("sampleBtn");
  const highlightBox = document.getElementById("highlightBox");
  const scoreEl = document.getElementById("spamScore");
  const statusEl = document.getElementById("spamStatus");
  const categoryEl = document.getElementById("spamCategory");
  const charsEl = document.getElementById("charCount");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const renderHistory = () => {
    if (!historyList) return;
    const history = loadHistory();
    historyList.innerHTML = "";

    if (!history.length) {
      historyList.innerHTML = "<li class='history-item'>No previous analyses yet.</li>";
      return;
    }

    history.forEach(({ text, score, category, time }) => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.textContent = `${score}/100 • ${category} • ${shorten(text)} (${new Date(
        time
      ).toLocaleTimeString()})`;
      historyList.appendChild(li);
    });
  };

  const updateCharCount = () => {
    if (!charsEl) return;
    const length = inputEl.value.length;
    charsEl.textContent = `${length} characters`;
  };

  const highlightMessage = message => {
   
    let html = escapeHtml(message);

  
    html = html.replace(spamRules.urlRegex, match => `<span class="highlight-link">${match}</span>`);

    
    spamRules.keywords.forEach(word => {
      const reg = new RegExp(word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
      html = html.replace(reg, m => `<span class="highlight-keyword">${m}</span>`);
    });

    spamRules.urgency.forEach(word => {
      const reg = new RegExp(word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
      html = html.replace(reg, m => `<span class="highlight-urgency">${m}</span>`);
    });

    highlightBox.innerHTML = html || "Message highlights will appear here.";
  };

  const analyze = () => {
    const text = inputEl.value.trim();
    if (!text) {
      alert("Please paste or type a message to analyze.");
      return;
    }

    const result = calculateSpamScore(text);
    const { total } = result;
    const { label, color } = getCategoryFromScore(total);

    scoreEl.textContent = total;
    statusEl.textContent = label;
    statusEl.style.color = color;
    categoryEl.textContent = total < 30 ? "Not spam" : total < 70 ? "Maybe scam" : "Likely scam";

    highlightMessage(text);

   
    const entry = {
      text,
      score: total,
      category: label,
      time: new Date().toISOString()
    };
    saveHistoryEntry(entry);
    renderHistory();
  };

  const clearForm = () => {
    inputEl.value = "";
    scoreEl.textContent = "0";
    statusEl.textContent = "—";
    statusEl.style.color = "#18213f";
    categoryEl.textContent = "—";
    highlightBox.textContent = "Message highlights will appear here.";
    updateCharCount();
  };

  const useSample = () => {
    inputEl.value =
      "Congratulations!!! You have been selected as the FINAL WINNER of our ₹5,00,000 FREE LOTTERY OFFER. " +
      "Click here: http://secure-claim-free-prize-now.com and act now to claim your reward immediately!";
    updateCharCount();
    analyze();
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  };

 
  analyzeBtn.addEventListener("click", analyze);
  clearBtn.addEventListener("click", clearForm);
  sampleBtn.addEventListener("click", useSample);
  inputEl.addEventListener("input", updateCharCount);
  if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", clearHistory);

  
  updateCharCount();
  renderHistory();
};


const initTipsPage = () => {
  const apiContainer = document.getElementById("apiTips");
  const form = document.getElementById("contactForm");
  const errorBox = document.getElementById("contactErrors");
  const successBox = document.getElementById("contactSuccess");

  
  const fetchSecurityTips = async () => {
    if (!apiContainer) return;
    apiContainer.textContent = "Loading extra security tips from API...";

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
      if (!response.ok) {
        throw new Error("Network error");
      }
      const posts = await response.json();

      apiContainer.innerHTML = "";
      posts.map(post => {
        const div = document.createElement("div");
        div.className = "api-card";
        div.innerHTML = `<strong>${post.title.slice(0, 40)}...</strong><br>${post.body.slice(
          0,
          80
        )}...`;
        apiContainer.appendChild(div);
      });
    } catch (err) {
      apiContainer.textContent = "Could not load tips. Please check your connection.";
    }
  };

  fetchSecurityTips();

  
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      const errors = [];

      if (!name) errors.push("Name is required.");
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) errors.push("Enter a valid email address.");
      if (message.length < 10) errors.push("Message should be at least 10 characters long.");

      if (errors.length) {
        errorBox.style.display = "block";
        successBox.style.display = "none";
        errorBox.innerHTML = `<ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>`;
        return;
      }

      errorBox.style.display = "none";

     
      const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      const newFeedback = { name, email, message, time: new Date().toISOString() };
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...existing, newFeedback]));

      successBox.style.display = "block";
      successBox.textContent = "Thank you! Your feedback has been recorded (demo only).";
      form.reset();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initDetectorPage();
  initTipsPage();
});
