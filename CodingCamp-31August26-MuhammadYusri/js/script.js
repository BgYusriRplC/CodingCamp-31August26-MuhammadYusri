const $ = (id) => document.getElementById(id);

const state = {
  tasks: JSON.parse(localStorage.getItem("lifeTasks")) || [],
  links: JSON.parse(localStorage.getItem("lifeLinks")) || [
    { name: "Google", url: "https://google.com" },
    { name: "Gmail", url: "https://mail.google.com" }
  ],
  name: localStorage.getItem("lifeName") || "there",
  dark: localStorage.getItem("lifeTheme") === "dark"
};

let timerSeconds = Number(localStorage.getItem("timerSeconds")) || 1500;
let timerInterval = null;

function saveTasks() { localStorage.setItem("lifeTasks", JSON.stringify(state.tasks)); }
function saveLinks() { localStorage.setItem("lifeLinks", JSON.stringify(state.links)); }

function updateClock() {
  const now = new Date();
  $("time").textContent = now.toLocaleTimeString("en-GB");
  $("date").textContent = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const hour = now.getHours();
  $("greeting").textContent = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
}
updateClock();
setInterval(updateClock, 1000);

function renderName() {
  $("displayName").textContent = state.name;
  $("nameInput").value = state.name === "there" ? "" : state.name;
}
$("saveName").addEventListener("click", () => {
  const name = $("nameInput").value.trim();
  if (!name) return;
  state.name = name;
  localStorage.setItem("lifeName", name);
  renderName();
});
$("nameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("saveName").click(); });
renderName();

function formatTimer() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const s = (timerSeconds % 60).toString().padStart(2, "0");
  $("timerDisplay").textContent = `${m}:${s}`;
  localStorage.setItem("timerSeconds", timerSeconds);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}
$("startTimer").addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      formatTimer();
    } else {
      stopTimer();
      alert("Focus session complete! Great work.");
    }
  }, 1000);
});
$("stopTimer").addEventListener("click", stopTimer);
$("resetTimer").addEventListener("click", () => {
  stopTimer();
  timerSeconds = Number($("timerMinutes").value || 25) * 60;
  formatTimer();
});
$("applyTimer").addEventListener("click", () => {
  const minutes = Number($("timerMinutes").value);
  if (minutes < 1 || minutes > 120) return alert("Choose between 1 and 120 minutes.");
  stopTimer();
  timerSeconds = minutes * 60;
  formatTimer();
});
$("timerMinutes").value = Math.ceil(timerSeconds / 60);
formatTimer();

function getSortedTasks() {
  const sort = $("sortTasks").value;
  const tasks = [...state.tasks];
  if (sort === "oldest") return tasks.sort((a,b) => a.created - b.created);
  if (sort === "az") return tasks.sort((a,b) => a.text.localeCompare(b.text));
  if (sort === "unfinished") return tasks.sort((a,b) => Number(a.done) - Number(b.done));
  return tasks.sort((a,b) => b.created - a.created);
}

function renderTasks() {
  const list = $("taskList");
  list.innerHTML = "";
  const tasks = getSortedTasks();
  $("emptyTasks").style.display = tasks.length ? "none" : "block";
  $("taskCount").textContent = `${state.tasks.filter(t => !t.done).length} active`;
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "completed" : ""}`;
    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""}>
      <span class="task-text"></span>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>`;
    li.querySelector(".task-text").textContent = task.text;
    li.querySelector("input").addEventListener("change", () => {
      task.done = !task.done; saveTasks(); renderTasks();
    });
    li.querySelector(".edit-btn").addEventListener("click", () => {
      const edited = prompt("Edit task:", task.text);
      if (edited && edited.trim()) {
        const duplicate = state.tasks.some(t => t.id !== task.id && t.text.toLowerCase() === edited.trim().toLowerCase());
        if (duplicate) return alert("This task already exists.");
        task.text = edited.trim(); saveTasks(); renderTasks();
      }
    });
    li.querySelector(".delete-btn").addEventListener("click", () => {
      state.tasks = state.tasks.filter(t => t.id !== task.id); saveTasks(); renderTasks();
    });
    list.appendChild(li);
  });
}
function addTask() {
  const text = $("taskInput").value.trim();
  if (!text) return;
  const duplicate = state.tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) return alert("Duplicate task detected.");
  state.tasks.push({ id: Date.now(), text, done:false, created:Date.now() });
  $("taskInput").value = "";
  saveTasks(); renderTasks();
}
$("addTask").addEventListener("click", addTask);
$("taskInput").addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
$("sortTasks").addEventListener("change", renderTasks);
$("clearCompleted").addEventListener("click", () => {
  state.tasks = state.tasks.filter(t => !t.done); saveTasks(); renderTasks();
});
renderTasks();

function renderLinks() {
  const container = $("linkList");
  container.innerHTML = "";
  state.links.forEach((link, index) => {
    const item = document.createElement("div");
    item.className = "quick-link";
    const a = document.createElement("a");
    a.href = link.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = link.name;
    a.style.color = "inherit"; a.style.textDecoration = "none";
    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.title = "Remove link";
    remove.addEventListener("click", () => {
      state.links.splice(index, 1); saveLinks(); renderLinks();
    });
    item.append(a, remove); container.appendChild(item);
  });
}
$("addLink").addEventListener("click", () => {
  const name = $("linkName").value.trim();
  let url = $("linkUrl").value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  state.links.push({name, url});
  $("linkName").value = ""; $("linkUrl").value = "";
  saveLinks(); renderLinks();
});
renderLinks();

if (state.dark) document.body.classList.add("dark");
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  state.dark = document.body.classList.contains("dark");
  localStorage.setItem("lifeTheme", state.dark ? "dark" : "light");
});
