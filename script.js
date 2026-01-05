const todo = document.getElementById("to-do");
const progress = document.getElementById("progress");
const done = document.getElementById("done");

const modal = document.querySelector(".modal");
const toggleModal = document.getElementById("toggle-modal");
const addBtn = document.getElementById("add-new-task");

const titleInput = document.getElementById("task-title-input");
const descInput = document.getElementById("task-desc-input");
const dateInput = document.getElementById("task-date-input");

const dateTimeEl = document.getElementById("datetime");
const plannerTitle = document.getElementById("planner-title");

let dragged = null;

/* ================= STATE ================= */

let viewDate = today();          // YYYY-MM-DD
let activeSubject = null;        // null = normal planner

/* ================= HELPERS ================= */

function today() {
  return new Date().toISOString().split("T")[0];
}

function shiftDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/* ================= CLOCK (REAL TIME + VIEW DATE) ================= */

function updateClock() {
  const now = new Date();

  const datePart = new Date(viewDate).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const timePart = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  dateTimeEl.innerText = `${datePart} • ${timePart}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ================= STORAGE ================= */

const getTasks = () =>
  JSON.parse(localStorage.getItem("kanban")) || [];

const saveTasks = t =>
  localStorage.setItem("kanban", JSON.stringify(t));

/* ================= RENDER ================= */

function clearBoard() {
  [todo, progress, done].forEach(col =>
    col.querySelectorAll(".task").forEach(t => t.remove())
  );
}

function render() {
  clearBoard();

  let tasks = getTasks();

  // subject filtering
  if (activeSubject) {
    tasks = tasks.filter(t => t.subject === activeSubject);
  } else {
    tasks = tasks.filter(t => t.date === viewDate);
  }

  tasks.forEach(t => {
    const el = createTask(t);
    (t.status === "done" ? done :
     t.status === "progress" ? progress : todo)
     .appendChild(el);
  });

  updateCounts();
}

/* ================= COUNTS ================= */

function updateCounts() {
  [todo, progress, done].forEach(col => {
    col.querySelector(".right").innerText =
      col.querySelectorAll(".task").length;
  });
}

/* ================= TASK UI ================= */

function createTask(task) {
  const d = document.createElement("div");
  d.className = "task";
  d.draggable = true;
  d.dataset.id = task.id;

  d.innerHTML = `
    <h2>${task.title}</h2>
    <p>${task.desc}</p>
    <div class="task-bottom">
      <span class="date">📅 ${task.date}</span>
      <button>Delete</button>
    </div>
  `;

  d.addEventListener("dragstart", () => dragged = d);
  d.addEventListener("dragend", () => dragged = null);

  // delete
  d.querySelector("button").onclick = () => {
    saveTasks(getTasks().filter(t => t.id !== task.id));
    render();
  };

  // right-click → next day
  d.addEventListener("contextmenu", e => {
    e.preventDefault();
    const tasks = getTasks();
    const t = tasks.find(x => x.id === task.id);
    t.date = shiftDate(t.date, 1);
    saveTasks(tasks);
    render();
  });

  return d;
}

/* ================= ADD TASK ================= */

function addTask() {
  const title = titleInput.value.trim();
  const desc = descInput.value.trim();
  if (!title || !desc) return;

  const tasks = getTasks();
  tasks.push({
    id: Date.now().toString(),
    title,
    desc,
    date: dateInput.value || viewDate,
    status: "to-do",
    subject: activeSubject
  });

  saveTasks(tasks);
  modal.classList.remove("active");

  titleInput.value = "";
  descInput.value = "";
  dateInput.value = "";

  render();
}

/* ================= DRAG ================= */

[todo, progress, done].forEach(col => {
  col.addEventListener("dragover", e => e.preventDefault());
  col.addEventListener("drop", () => {
    if (!dragged) return;
    const tasks = getTasks();
    const t = tasks.find(x => x.id === dragged.dataset.id);
    t.status = col.id;
    saveTasks(tasks);
    render();
  });
});

/* ================= MODAL ================= */

toggleModal.onclick = () => modal.classList.toggle("active");
modal.querySelector(".bg").onclick = () => modal.classList.remove("active");
addBtn.onclick = addTask;

/* ================= SUBJECT PLANNER ================= */

// Double click → subject planner
plannerTitle.ondblclick = () => {
  if (activeSubject) {
    activeSubject = null;
    plannerTitle.innerText = "Hi, Abhijay";
  } else {
    const name = prompt("Enter subject name:");
    if (!name) return;
    activeSubject = name;
    plannerTitle.innerText = `Hi, ${name}`;
  }
  render();
};

/* ================= DAY NAVIGATION ================= */

document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "ArrowRight") {
    viewDate = shiftDate(viewDate, 1);
    updateClock();
    render();
  }

  if (e.ctrlKey && e.key === "ArrowLeft") {
    viewDate = shiftDate(viewDate, -1);
    updateClock();
    render();
  }
});

/* ================= INIT ================= */

render();
