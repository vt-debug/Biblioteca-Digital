const USERS_KEY = "bibliotheca_users_db";

const initialUsers = [
    { id: 1, name: "Ana Clara", email: "ana@example.com", role: "Leitor", status: "active", since: "2025-01-12", avatar: "https://i.pravatar.cc/150?img=32", note: "" },
    { id: 2, name: "Lucas Prado", email: "lucas@example.com", role: "Editor", status: "pending", since: "2025-02-03", avatar: "https://i.pravatar.cc/150?img=14", note: "" },
    { id: 3, name: "Sofia Martins", email: "sofia@example.com", role: "Leitor", status: "active", since: "2025-03-20", avatar: "https://i.pravatar.cc/150?img=44", note: "" },
    { id: 4, name: "Carlos Almeida", email: "carlos@example.com", role: "Admin", status: "active", since: "2025-03-05", avatar: "https://i.pravatar.cc/150?img=11", note: "" },
    { id: 5, name: "Fernanda Lopes", email: "fernanda@example.com", role: "Leitor", status: "suspended", since: "2025-01-30", avatar: "https://i.pravatar.cc/150?img=5", note: "" }
];

let usersData = JSON.parse(localStorage.getItem(USERS_KEY)) || initialUsers;

let editUserId = null;
let userIdToDelete = null;

const userModal = document.getElementById("userModal");
const deleteUserModal = document.getElementById("deleteUserConfirm");
const userForm = document.getElementById("userForm");
const feedback = document.getElementById("userFormFeedback");

document.addEventListener("DOMContentLoaded", () => {
    renderUsersTable();
    setupFilters();
    setupModalClosing();
    setupForm();
    updateUserMetrics();
});


function renderUsersTable(filterText = "", filterRole = "all", filterStatus = "all") {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = "";

    const search = filterText.toLowerCase().trim();

    const filtered = usersData.filter(user => {
        const matchText =
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search);

        const matchRole = filterRole === "all" || user.role === filterRole;
        const matchStatus = filterStatus === "all" || user.status === filterStatus;

        return matchText && matchRole && matchStatus;
    });

    setText("totalUsersCount", filtered.length);

    // Empty State
    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(user => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="user-info">
                    <img class="avatar-sm" src="${user.avatar}" onerror="this.src='https://placehold.co/80x80?text=User'">
                    <div>
                        <span class="user-name">${user.name}</span>
                        <span class="user-row-meta">${user.role}</span>
                    </div>
                </div>
            </td>
            <td><span class="user-row-meta">${user.email}</span></td>
            <td><span class="status-badge">${user.role}</span></td>
            <td><span class="status-badge ${user.status}">${statusLabel(user.status)}</span></td>
            <td style="color:var(--text-muted)">${formatDate(user.since)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action edit" onclick="openUserModal(${user.id})">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteUser(${user.id})">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}


function setupFilters() {
    const search = document.getElementById("userSearchInput");
    const role = document.getElementById("roleFilter");
    const status = document.getElementById("statusFilter");

    const apply = () => renderUsersTable(search.value, role.value, status.value);

    search.addEventListener("input", apply);
    role.addEventListener("change", apply);
    status.addEventListener("change", apply);
}


window.openUserModal = function (editId = null) {
    const modalTitle = document.getElementById("userModalTitle");
    const btnSave = document.getElementById("btnSaveUser");

    userForm.reset();
    clearFeedback();

    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));

    userModal.classList.add("open");
    document.body.classList.add("modal-open");

    if (editId) {
        editUserId = editId;
        modalTitle.textContent = "Editar Usuário";

        if (btnSave) btnSave.textContent = "Atualizar";

        loadUser(editId);
    } else {
        editUserId = null;
        modalTitle.textContent = "Novo Usuário";

        if (btnSave) btnSave.textContent = "Salvar";
    }
};

window.closeUserModal = function () {
    userModal.classList.remove("open");
    document.body.classList.remove("modal-open");
    editUserId = null;
};

function loadUser(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) return;

    document.getElementById("inpUserName").value = user.name;
    document.getElementById("inpUserEmail").value = user.email;
    document.getElementById("inpUserRole").value = user.role;
    document.getElementById("inpUserStatus").value = user.status;
    document.getElementById("inpUserNote").value = user.note || "";
}


function setupForm() {
    userForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const data = buildUserData();
        if (!data) return;

        if (editUserId) {

            const index = usersData.findIndex(u => u.id === editUserId);
            if (index !== -1) {
                usersData[index] = data;
            }
        } else {
            usersData.push(data);
        }

        persistUsers();
        renderUsersTable();
        updateUserMetrics();
        closeUserModal();
    });

    const inputs = userForm.querySelectorAll("input, select");
    inputs.forEach(inp => {
        inp.addEventListener("input", () => inp.classList.remove("input-error"));
    });
}

function buildUserData() {
    const name = document.getElementById("inpUserName");
    const email = document.getElementById("inpUserEmail");
    const role = document.getElementById("inpUserRole");
    const status = document.getElementById("inpUserStatus");
    const note = document.getElementById("inpUserNote");

    let hasError = false;
    if (!name.value.trim()) {
        name.classList.add("input-error");
        hasError = true;
    }
    if (!email.value.trim()) {
        email.classList.add("input-error");
        hasError = true;
    }

    if (hasError) {
        setFeedback("Preencha os campos obrigatórios.");
        return null;
    }

    let existingUser = null;
    if (editUserId) {
        existingUser = usersData.find(u => u.id === editUserId);
    }

    return {
        id: editUserId || Date.now(),
        name: name.value.trim(),
        email: email.value.trim(),
        role: role.value,
        status: status.value,
        since: existingUser ? existingUser.since : todayISO(),
        avatar: existingUser ? existingUser.avatar : `https://i.pravatar.cc/150?u=${encodeURIComponent(email.value.trim())}`,
        note: note.value || ""
    };
}

window.deleteUser = function (id) {
    userIdToDelete = id;

    const user = usersData.find(u => u.id === id);
    const text = document.getElementById("deleteUserText");

    text.innerHTML = `Tem certeza que deseja excluir <strong>${user.name}</strong>?`;

    deleteUserModal.classList.add("open");
    document.body.classList.add("modal-open");
};

window.closeDeleteUserModal = function () {
    deleteUserModal.classList.remove("open");
    document.body.classList.remove("modal-open");
    userIdToDelete = null;
};

window.confirmUserDelete = function () {
    if (userIdToDelete === null) return;

    usersData = usersData.filter(u => u.id !== userIdToDelete);

    persistUsers();
    renderUsersTable();
    updateUserMetrics();
    closeDeleteUserModal();
};

function updateUserMetrics() {
    const active = usersData.filter(u => u.status === "active").length;
    const suspended = usersData.filter(u => u.status === "suspended").length;

    const recent = usersData.filter(u => {
        const since = new Date(u.since);
        const past = new Date();
        past.setDate(past.getDate() - 30);
        return since >= past;
    }).length;

    setText("metricActiveUsers", active);
    setText("metricSuspended", suspended);
    setText("metricNewUsers", recent);
}
function setupModalClosing() {
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                if (overlay.id === "userModal") closeUserModal();
                if (overlay.id === "deleteUserConfirm") closeDeleteUserModal();
            }
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeUserModal();
            closeDeleteUserModal();
        }
    });
}

function persistUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(usersData));
}

function statusLabel(status) {
    const map = {
        active: "Ativo",
        pending: "Pendente",
        suspended: "Suspenso"
    };
    return map[status] || status;
}

function formatDate(iso) {
    if (!iso) return "--";
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function setFeedback(msg) {
    if (feedback) feedback.textContent = msg;
}

function clearFeedback() {
    if (feedback) feedback.textContent = "";
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}