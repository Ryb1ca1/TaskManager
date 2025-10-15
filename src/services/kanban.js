const defaultTasks = {
    backlog: [],
    ready: [],
    "in-progress": [],
    finished: []
};

let tasks = { ...defaultTasks };
let storageKey = null;

function loadTasks(userLogin) {
    storageKey = `kanban_tasks_${userLogin}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        tasks = JSON.parse(saved);
    } else {
        tasks = { ...defaultTasks };
    }
}

function saveTasks() {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function createTaskObj(text) {
    return {
        id: Date.now() + Math.random(),
        text: text.trim()
    };
}

function renderTasks() {
    ["backlog", "ready", "in-progress", "finished"].forEach((listName) => {
        const listEl = document.querySelector(`.task-list[data-list="${listName}"]`);
        if (!listEl) return;
        listEl.innerHTML = "";

        tasks[listName].forEach((taskObj, index) => {
            const li = document.createElement("li");
            li.className = "task-item";
            li.setAttribute("draggable", "true");
            li.dataset.taskId = taskObj.id;

            const span = document.createElement("span");
            span.textContent = taskObj.text;
            span.className = "task-text";
            span.onclick = (e) => {
                e.stopPropagation();
                span.classList.toggle("expanded");
                if (span.classList.contains("expanded")) {
                    span.style.whiteSpace = "normal";
                    span.style.overflow = "visible";
                    span.style.textOverflow = "clip";
                } else {
                    span.style.whiteSpace = "nowrap";
                    span.style.overflow = "hidden";
                    span.style.textOverflow = "ellipsis";
                }
            };
            li.appendChild(span);

            const btnContainer = document.createElement("div");
            btnContainer.className = "task-buttons";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "icon-btn delete-btn";
            deleteBtn.title = "Удалить задачу";
            deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="m21.5,2h-13.295L.047,12l8.158,10h13.295c1.379,0,2.5-1.122,2.5-2.5V4.5c0-1.378-1.121-2.5-2.5-2.5Zm1.5,17.5c0,.827-.673,1.5-1.5,1.5h-12.82L1.338,12,8.68,3h12.82c.827,0,1.5.673,1.5,1.5v15Zm-5.041-10.752l-3.252,3.252,3.252,3.252-.707.707-3.252-3.252-3.252,3.252-.707-.707,3.252-3.252-3.252-3.252.707-.707,3.252,3.252,3.252-3.252.707.707Z"/>
        </svg>
      `;
            deleteBtn.onclick = (ev) => {
                ev.stopPropagation();
                tasks[listName].splice(index, 1);
                saveTasks();
                renderTasks();
            };

            const editBtn = document.createElement("button");
            editBtn.className = "icon-btn edit-btn";
            editBtn.title = "Редактировать задачу";
            editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm0,23c-6.065,0-11-4.935-11-11S5.935,1,12,1s11,4.935,11,11-4.935,11-11,11Zm2.244-17.184l-6.926,6.926c-.851.85-1.318,1.98-1.318,3.183v1.575c0,.276.224.5.5.5h1.575c1.202,0,2.333-.468,3.183-1.318l6.926-6.926c.526-.526.816-1.226.816-1.97s-.29-1.443-.816-1.97c-1.053-1.053-2.887-1.053-3.939,0Zm-3.693,10.158c-.661.661-1.54,1.025-2.476,1.025h-1.075v-1.075c0-.936.364-1.814,1.025-2.476l5.108-5.108,2.525,2.525-5.108,5.108Zm6.926-6.926l-1.11,1.11-2.525-2.525,1.11-1.11c.676-.676,1.85-.676,2.525,0,.338.338.523.786.523,1.263s-.186.925-.523,1.263Z"/>
        </svg>
      `;
            editBtn.onclick = (ev) => {
                ev.stopPropagation();
                const newText = prompt("Введите новый текст задачи:", taskObj.text);
                if (newText !== null && newText.trim() !== "") {
                    tasks[listName][index].text = newText.trim();
                    saveTasks();
                    renderTasks();
                }
            };

            btnContainer.appendChild(deleteBtn);
            btnContainer.appendChild(editBtn);
            li.appendChild(btnContainer);

            listEl.appendChild(li);
        });
    });
    updateFooter();
    updateAddCardButtons();
}

function setupDragAndDrop() {
    const kanbanBoard = document.querySelector(".kanban-board");
    if (!kanbanBoard) return;
    let draggedTaskId = null;
    let sourceList = null;

    kanbanBoard.addEventListener("dragstart", (e) => {
        if (e.target.tagName === "LI") {
            draggedTaskId = e.target.dataset.taskId;
            sourceList = e.target.parentElement.dataset.list;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", draggedTaskId);
            e.target.classList.add("dragging");
        }
    });

    kanbanBoard.addEventListener("dragend", (e) => {
        const draggingEl = document.querySelector(".dragging");
        if (draggingEl) draggingEl.classList.remove("dragging");
        draggedTaskId = null;
        sourceList = null;
    });

    kanbanBoard.querySelectorAll(".kanban-column").forEach((column) => {
        column.addEventListener("drop", (e) => {
            e.preventDefault();
            column.classList.remove("drag-over");
            const targetList = column.dataset.list;
            if (!targetList || !tasks[targetList]) return;
            if (!draggedTaskId) return;
            if (sourceList === targetList) return;
            const sourceTasks = tasks[sourceList];
            const idx = sourceTasks.findIndex((t) => t.id == draggedTaskId);
            if (idx > -1) {
                const taskObj = sourceTasks.splice(idx, 1)[0];
                tasks[targetList].push(taskObj);
                saveTasks();
                renderTasks();
            }
        });

        column.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            column.classList.add("drag-over");
        });

        column.addEventListener("dragleave", () => {
            column.classList.remove("drag-over");
        });
    });
}

function updateAddCardButtons() {
    document.querySelector('.add-card-btn[data-list="backlog"]').disabled = false;

    const readyBtn = document.querySelector('.add-card-btn[data-list="ready"]');
    readyBtn.disabled = tasks.backlog.length === 0;

    const inProgressBtn = document.querySelector('.add-card-btn[data-list="in-progress"]');
    inProgressBtn.disabled = tasks.ready.length === 0;

    const finishedBtn = document.querySelector('.add-card-btn[data-list="finished"]');
    finishedBtn.disabled = tasks["in-progress"].length === 0;
}

function updateFooter() {
    const activeTasks = document.getElementById("active-tasks");
    const finishedTasks = document.getElementById("finished-tasks");

    let activeCount = tasks.ready ? tasks.ready.length : 0;
    let finishedCount = tasks.finished ? tasks.finished.length : 0;

    if (activeTasks) activeTasks.textContent = `Active tasks: ${activeCount}`;
    if (finishedTasks) finishedTasks.textContent = `Finished tasks: ${finishedCount}`;
}

export function initKanban(userLogin) {
    loadTasks(userLogin);
    renderTasks();
    setupDragAndDrop();

    document.querySelectorAll(".add-card-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const listName = btn.dataset.list;
            const listEl = document.querySelector(`.task-list[data-list="${listName}"]`);
            if (!listEl) return;

            // prevent multiple input containers
            if (listEl.querySelector(".input-container")) return;

            const container = document.createElement("div");
            container.className = "input-container";

            if (listName === "backlog") {
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "Enter task title...";
                input.className = "new-task-input";

                const submitBtn = document.createElement("button");
                submitBtn.textContent = "Submit";

                function saveTask() {
                    const val = input.value.trim();
                    if (val.length > 0) {
                        tasks.backlog.push(createTaskObj(val));
                        saveTasks();
                        renderTasks();
                    }
                    container.remove();
                    btn.disabled = false;
                }

                submitBtn.onclick = () => saveTask();
                input.addEventListener("blur", () => saveTask());

                container.appendChild(input);
                container.appendChild(submitBtn);
                listEl.appendChild(container);
                input.focus();

                btn.disabled = true;
            } else {
                const select = document.createElement("select");
                select.className = "task-select";

                let prevListName;
                switch (listName) {
                    case "ready": prevListName = "backlog"; break;
                    case "in-progress": prevListName = "ready"; break;
                    case "finished": prevListName = "in-progress"; break;
                }

                if (!prevListName || tasks[prevListName].length === 0) {
                    btn.disabled = true;
                    return;
                }

                tasks[prevListName].forEach((taskObj) => {
                    const option = document.createElement("option");
                    option.value = taskObj.id;
                    option.textContent = taskObj.text;
                    select.appendChild(option);
                });

                const confirmBtn = document.createElement("button");
                confirmBtn.textContent = "Add";

                function addSelectedTask() {
                    const selectedId = select.value;
                    if (!selectedId) return;

                    const prevListTasks = tasks[prevListName];
                    const idx = prevListTasks.findIndex((t) => t.id == selectedId);
                    if (idx > -1) {
                        const movedTask = prevListTasks.splice(idx, 1)[0];
                        tasks[listName].push(movedTask);

                        saveTasks();
                        renderTasks();
                        container.remove();
                        btn.disabled = false;
                    }
                }

                confirmBtn.onclick = addSelectedTask;
                select.addEventListener("blur", addSelectedTask);

                container.appendChild(select);
                container.appendChild(confirmBtn);
                listEl.appendChild(container);
                select.focus();

                btn.disabled = true;
            }
        });
    });
}
