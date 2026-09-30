/* Daily Notepad — data is stored per-day in localStorage. */

const STEPS_GOAL = 10000;
const STORAGE_KEY = "daily-notepad-data";
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

/* ---------- State ---------- */

let currentDate = new Date();
let data = null; // the current day's data (single source of truth)

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyDay() {
  return {
    expenses: [],
    steps: 0,
    workout: [],
    food: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
    work: [],
  };
}

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function loadDay() {
  const all = loadAll();
  const key = dateKey(currentDate);
  if (!all[key]) all[key] = emptyDay();
  data = all[key];
}

function save() {
  const all = loadAll();
  all[dateKey(currentDate)] = data;
  saveAll(all);
}

/* ---------- Helpers ---------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(n) {
  return "€" + Number(n || 0).toFixed(2);
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shiftDay(days) {
  currentDate.setDate(currentDate.getDate() + days);
  loadDay();
  render();
}

/* ---------- Render ---------- */

function render() {
  const today = new Date();
  const isToday = dateKey(currentDate) === dateKey(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const label = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dateEl = document.getElementById("currentDate");
  if (isToday) dateEl.textContent = "Today · " + label;
  else if (dateKey(currentDate) === dateKey(yesterday)) dateEl.textContent = "Yesterday · " + label;
  else dateEl.textContent = label;
  document.getElementById("todayBtn").style.visibility = isToday ? "hidden" : "visible";

  renderExpenses(data);
  renderSteps(data);
  renderWorkout(data);
  renderFood(data);
  renderWork(data);
}

/* ---------- Expenses ---------- */

function renderExpenses(data) {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  if (data.expenses.length === 0) {
    list.innerHTML = `<li class="empty">No expenses yet — add your first one below.</li>`;
  } else {
    data.expenses.forEach((e) => {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `
        <span class="item-text">${escapeHtml(e.name)}</span>
        <span class="item-amount">${fmt(e.amount)}</span>
        <button class="del" aria-label="Delete">&times;</button>`;
      li.querySelector(".del").addEventListener("click", () => {
        data.expenses = data.expenses.filter((x) => x.id !== e.id);
        save();
        render();
      });
      list.appendChild(li);
    });
  }

  const total = data.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  document.getElementById("expenseTotal").textContent = fmt(total);
}

/* ---------- Steps ---------- */

function renderSteps(data) {
  document.getElementById("stepsValue").textContent = fmtNum(data.steps);
  document.getElementById("stepsGoalLabel").textContent = "/ " + fmtNum(STEPS_GOAL);
  document.getElementById("stepsInput").value = data.steps || "";

  const circumference = 2 * Math.PI * 52; // r = 52
  const pct = Math.min((Number(data.steps) || 0) / STEPS_GOAL, 1);
  const ring = document.getElementById("ringFill");
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference * (1 - pct);
}

/* ---------- Workout ---------- */

function renderWorkout(data) {
  const list = document.getElementById("workoutList");
  list.innerHTML = "";

  if (data.workout.length === 0) {
    list.innerHTML = `<li class="empty">Rest day? Log your workout below.</li>`;
  } else {
    data.workout.forEach((w) => {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `
        <span class="item-text">${escapeHtml(w.name)}</span>
        ${w.detail ? `<span class="item-sub">${escapeHtml(w.detail)}</span>` : ""}
        <button class="del" aria-label="Delete">&times;</button>`;
      li.querySelector(".del").addEventListener("click", () => {
        data.workout = data.workout.filter((x) => x.id !== w.id);
        save();
        render();
      });
      list.appendChild(li);
    });
  }
}

/* ---------- Food ---------- */

function renderFood(data) {
  const wrap = document.getElementById("meals");
  wrap.innerHTML = "";

  MEALS.forEach((meal) => {
    const section = document.createElement("div");
    section.className = "meal";

    const items = data.food[meal] || [];
    let itemsHtml = "";
    if (items.length === 0) {
      itemsHtml = `<li class="empty">Nothing logged.</li>`;
    } else {
      itemsHtml = items
        .map(
          (f) => `
        <li class="item">
          <span class="item-text">${escapeHtml(f.text)}</span>
          <button class="del" aria-label="Delete">&times;</button>
        </li>`
        )
        .join("");
    }

    section.innerHTML = `
      <h3>${meal}</h3>
      <ul class="item-list">${itemsHtml}</ul>
      <form class="meal-form" data-meal="${meal}">
        <input type="text" placeholder="Add to ${meal.toLowerCase()}..." autocomplete="off" />
        <button type="submit" class="add-btn" aria-label="Add">+</button>
      </form>`;

    section.querySelectorAll(".item").forEach((li, i) => {
      li.querySelector(".del").addEventListener("click", () => {
        data.food[meal].splice(i, 1);
        save();
        render();
      });
    });

    wrap.appendChild(section);
  });
}

/* ---------- Work done ---------- */

function renderWork(data) {
  const list = document.getElementById("workList");
  list.innerHTML = "";

  if (data.work.length === 0) {
    list.innerHTML = `<li class="empty">Add what you accomplished today.</li>`;
  } else {
    data.work.forEach((t) => {
      const li = document.createElement("li");
      li.className = "item" + (t.done ? " done" : "");
      li.innerHTML = `
        <span class="check">
          <svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>
        </span>
        <span class="item-text">${escapeHtml(t.text)}</span>
        <button class="del" aria-label="Delete">&times;</button>`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".del")) {
          data.work = data.work.filter((x) => x.id !== t.id);
        } else {
          t.done = !t.done;
        }
        save();
        render();
      });
      list.appendChild(li);
    });
  }

  const done = data.work.filter((t) => t.done).length;
  const total = data.work.length;
  document.getElementById("workBadge").textContent = `${done} / ${total}`;
  document.getElementById("workProgress").style.width =
    total === 0 ? "0%" : (done / total) * 100 + "%";
}

/* ---------- Week summary ---------- */

function getLast7Days() {
  const all = loadAll();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    days.push({ date: d, data: all[dateKey(d)] || emptyDay() });
  }
  return days;
}

function buildChart(el, values, dates) {
  el.innerHTML = "";
  const max = Math.max(...values, 1);
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  values.forEach((v, i) => {
    const col = document.createElement("div");
    col.className = "bar-col";
    const pct = Math.max((v / max) * 100, 3);
    const display = v >= 1000 ? (v / 1000).toFixed(1) + "k" : fmtNum(v);
    col.innerHTML = `
      <span class="bar-value">${display}</span>
      <div class="bar-track"><div class="bar" style="height:${pct}%"></div></div>
      <span class="bar-label">${dayNames[dates[i].getDay()]}</span>`;
    el.appendChild(col);
  });
}

function renderWeek() {
  const days = getLast7Days();
  const first = days[0].date;
  const last = days[6].date;
  const fmtDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  document.getElementById("weekRange").textContent =
    `${fmtDay(first)} – ${fmtDay(last)}, ${last.getFullYear()}`;

  let totalExp = 0, totalSteps = 0, workouts = 0, tasksDone = 0, tasksTotal = 0;
  const stepsArr = [], expArr = [];
  days.forEach(({ data: d }) => {
    const exp = (d.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    totalExp += exp;
    totalSteps += Number(d.steps || 0);
    workouts += (d.workout || []).length;
    tasksDone += (d.work || []).filter((t) => t.done).length;
    tasksTotal += (d.work || []).length;
    stepsArr.push(Number(d.steps || 0));
    expArr.push(exp);
  });

  document.getElementById("weekExpenses").textContent = fmt(totalExp);
  document.getElementById("weekSteps").textContent = fmtNum(totalSteps);
  document.getElementById("weekAvgSteps").textContent = fmtNum(Math.round(totalSteps / 7));
  document.getElementById("weekWorkouts").textContent = workouts;
  document.getElementById("weekTasks").textContent = `${tasksDone} / ${tasksTotal}`;

  buildChart(document.getElementById("stepsChart"), stepsArr, days.map((x) => x.date));
  buildChart(document.getElementById("expenseChart"), expArr, days.map((x) => x.date));
}

/* ---------- Events ---------- */

document.getElementById("prevDay").addEventListener("click", () => shiftDay(-1));
document.getElementById("nextDay").addEventListener("click", () => shiftDay(1));
document.getElementById("todayBtn").addEventListener("click", () => {
  currentDate = new Date();
  loadDay();
  render();
});

document.getElementById("expenseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("expenseName").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  if (!name || isNaN(amount) || amount < 0) return;
  data.expenses.push({ id: uid(), name, amount });
  save();
  e.target.reset();
  render();
});

document.getElementById("stepsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = parseInt(document.getElementById("stepsInput").value, 10);
  data.steps = isNaN(val) || val < 0 ? 0 : val;
  save();
  render();
});

document.getElementById("workoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("workoutName").value.trim();
  const detail = document.getElementById("workoutDetail").value.trim();
  if (!name) return;
  data.workout.push({ id: uid(), name, detail });
  save();
  e.target.reset();
  render();
});

document.getElementById("workForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("workInput");
  const text = input.value.trim();
  if (!text) return;
  data.work.push({ id: uid(), text, done: false });
  save();
  input.value = "";
  render();
});

document.getElementById("meals").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target.closest(".meal-form");
  const meal = form.dataset.meal;
  const input = form.querySelector("input");
  const text = input.value.trim();
  if (!text) return;
  if (!data.food[meal]) data.food[meal] = [];
  data.food[meal].push({ id: uid(), text });
  save();
  input.value = "";
  render();
});

/* ---------- Week modal ---------- */

const weekModal = document.getElementById("weekModal");

document.getElementById("weekBtn").addEventListener("click", () => {
  renderWeek();
  weekModal.hidden = false;
});
document.getElementById("weekClose").addEventListener("click", () => {
  weekModal.hidden = true;
});
weekModal.addEventListener("click", (e) => {
  if (e.target === weekModal) weekModal.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") weekModal.hidden = true;
});

/* ---------- Init ---------- */

loadDay();
render();
