import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/style.css";
import { User } from "./models/User";
import { generateTestUser } from "./utils";
import { State } from "./state";
import { authUser } from "./services/auth";
import { initKanban } from "./services/kanban";

export const appState = new State();

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("app-login-form");
    const mainPanel = document.getElementById("mainTextPanel");
    const kanbanContainer = document.getElementById("kanban-container");
    const userMenu = document.getElementById("userMenuContainer");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const logoutLink = document.getElementById("logout");
    const content = document.getElementById("content");

    generateTestUser(User);

    const myTaskLink = dropdownMenu.querySelector('a[data-menu="my-task"]');
    const homeLink = dropdownMenu.querySelector('a[data-menu="home"]');
    const myAccountLink = dropdownMenu.querySelector('a[data-menu="my-account"]');

    function showHomePage() {
        mainPanel.classList.remove("hidden");
        kanbanContainer.classList.add("hidden");
        userMenu.classList.remove("hidden");
        loginForm.classList.add("hidden");

        content.classList.add("hidden");
        content.innerHTML = "";
    }

    function showKanban() {
        mainPanel.classList.add("hidden");
        kanbanContainer.classList.remove("hidden");
        userMenu.classList.remove("hidden");
        loginForm.classList.add("hidden");

        content.classList.add("hidden");
        content.innerHTML = "";

        if(appState.currentUser){
            initKanban(appState.currentUser.login);
        }
    }

    function showUserManagementPage() {
        content.classList.remove("hidden");
        mainPanel.classList.add("hidden");
        kanbanContainer.classList.add("hidden");
        loginForm.classList.add("hidden");

        const users = JSON.parse(localStorage.getItem("users") || "[]");

        content.innerHTML = `
      <div class="admin-panel">
        <h2>Пользователи</h2>
        <table class="user-table">
          <thead>
            <tr><th>Логин</th><th>Пароль</th><th>Роль</th><th>Действия</th></tr>
          </thead>
          <tbody>
            ${users.map((u, index) => `
              <tr>
                <td>${u.login}</td>
                <td>${u.password}</td>
                <td>${u.role || "user"}</td>
                <td>
                  <button class="delete-user-btn" data-index="${index}">Удалить</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Добавить пользователя</h3>
        <form id="addUserForm" class="user-form">
          <label>Логин:<input type="text" name="login" required></label>
          <label>Пароль:<input type="password" name="password" required></label>
          <label>Роль:
            <select name="role">
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
            </select>
          </label>
          <button type="submit" class="submit-btn">Создать</button>
          <button type="button" id="backBtn" style="margin-top:10px;">Назад</button>
        </form>
      </div>
    `;

        document.querySelectorAll(".delete-user-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const userIndex = btn.dataset.index;
                if(!confirm("Удалить данного пользователя?")) return;

                users.splice(userIndex, 1);
                localStorage.setItem("users", JSON.stringify(users));
                showUserManagementPage();
            });
        });

        const addUserForm = document.getElementById("addUserForm");
        addUserForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(addUserForm);
            const login = formData.get("login").trim();
            const password = formData.get("password").trim();
            const role = formData.get("role");

            if(!login || !password){
                alert("Введите логин и пароль");
                return;
            }

            if(users.find(u => u.login === login)){
                alert("Пользователь с таким логином уже существует");
                return;
            }

            users.push({login, password, role});
            localStorage.setItem("users", JSON.stringify(users));

            alert("Пользователь создан");
            showUserManagementPage();
        });

        document.getElementById("backBtn").addEventListener("click", () => {
            content.classList.add("hidden");
            showHomePage();
        });
    }

    myTaskLink.addEventListener("click", (e) => {
        e.preventDefault();
        showKanban();
    });

    homeLink.addEventListener("click", (e) => {
        e.preventDefault();
        showHomePage();
    });

    myAccountLink.addEventListener("click", (e) => {
        e.preventDefault();
        if(!appState.currentUser || appState.currentUser.role !== "admin"){
            alert("Доступ запрещён. Только для администраторов.");
            return;
        }
        showUserManagementPage();
    });

    const userInfo = document.getElementById("userInfo");
    const arrow = document.getElementById("arrow");
    userInfo.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.style.display === "block";
        if(isOpen){
            dropdownMenu.style.display = "none";
            arrow.classList.remove("up");
            arrow.classList.add("down");
        } else {
            dropdownMenu.style.display = "block";
            arrow.classList.remove("down");
            arrow.classList.add("up");
        }
    });

    document.addEventListener("click", () => {
        if(dropdownMenu.style.display === "block"){
            dropdownMenu.style.display = "none";
            arrow.classList.remove("up");
            arrow.classList.add("down");
        }
    });

    logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        appState.currentUser = null;

        kanbanContainer.classList.add("hidden");
        mainPanel.classList.remove("hidden");
        userMenu.classList.add("hidden");
        loginForm.classList.remove("hidden");
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const login = formData.get("login");
        const password = formData.get("password");

        const user = authUser(login, password);
        if(user){
            appState.currentUser = user;
            showHomePage();
        } else {
            alert("Incorrect login or password");
        }
    });

    if(appState.currentUser){
        showHomePage();
    } else {
        kanbanContainer.classList.add("hidden");
        mainPanel.classList.remove("hidden");
        userMenu.classList.add("hidden");
        loginForm.classList.remove("hidden");
    }
});
