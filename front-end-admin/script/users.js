// ---------------------- CONFIGURAÇÃO & ESTADO ----------------------
const API_URL = "http://localhost:3000/usuarios";

// Elementos do DOM
const userModal = document.getElementById("userModal");
const deleteUserModal = document.getElementById("deleteUserConfirm");
const userForm = document.getElementById("userForm");
const feedback = document.getElementById("userFormFeedback");
const usersTableBody = document.getElementById("usersTableBody");

// Estado da Aplicação
let usersData = [];
let editUserId = null;
let userIdToDelete = null;

// ---------------------- API: CRUD ----------------------

// 1. LISTAR (READ)
async function fetchUsers() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Falha ao buscar usuários");
        
        usersData = await res.json();
        renderUsersTable();
        updateUserMetrics();
    } catch (err) {
        console.error("Erro fetchUsers:", err);
        usersTableBody.innerHTML = `<tr><td colspan="6" class="error-state">Erro ao carregar dados. Tente recarregar a página.</td></tr>`;
    }
}

// 2. SALVAR (CREATE / UPDATE)
async function saveUser(userData) {
    try {
        const url = editUserId ? `${API_URL}/${editUserId}` : API_URL;
        const method = editUserId ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Erro ao salvar usuário");
        }

        // Recarrega tudo para garantir sincronia com o banco
        await fetchUsers();
        closeUserModal();
        
    } catch (err) {
        console.error("Erro saveUser:", err);
        setFeedback(`Erro: ${err.message}`);
    }
}

// 3. EXCLUIR (DELETE)
// Expondo explicitamente para o window para o onclick do HTML funcionar
window.confirmUserDelete = async function() {
    if (!userIdToDelete) return;

    try {
        const res = await fetch(`${API_URL}/${userIdToDelete}`, { method: "DELETE" });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Erro ao excluir usuário");
        }

        await fetchUsers();
        closeDeleteUserModal(); // Nome corrigido para bater com o HTML
        
    } catch (err) {
        console.error("Erro deleteUser:", err);
        alert(`Erro ao excluir: ${err.message}`);
    }
}

// ---------------------- INTERFACE: TABELA & FILTROS ----------------------

function renderUsersTable(filterText = "", filterRole = "all", filterStatus = "all") {
    usersTableBody.innerHTML = "";
    const search = filterText.toLowerCase().trim();

    // Filtragem
    const filtered = usersData.filter(user => {
        const matchText = (user.nome || "").toLowerCase().includes(search) || 
                          (user.email || "").toLowerCase().includes(search);
        
        const matchRole = filterRole === "all" || (user.papel || "").toLowerCase() === filterRole.toLowerCase();
        const matchStatus = filterStatus === "all" || (user.status || "").toLowerCase() === filterStatus.toLowerCase();
        
        return matchText && matchRole && matchStatus;
    });

    // Empty State
    if (!filtered.length) {
        usersTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhum usuário encontrado.</td></tr>`;
        document.getElementById("totalUsersCount").textContent = 0;
        return;
    }

    // Atualiza contador
    document.getElementById("totalUsersCount").textContent = filtered.length;

    // Renderiza Linhas
    filtered.forEach(user => {
        const row = document.createElement("tr");
        const avatarUrl = user.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`;
        
        row.innerHTML = `
            <td>
                <div class="user-info">
                    <img class="avatar-sm" src="${avatarUrl}" onerror="this.src='https://placehold.co/80x80?text=User'">
                    <div>
                        <span class="user-name">${user.nome}</span>
                    </div>
                </div>
            </td>
            <td><span class="user-row-meta">${user.email}</span></td>
            <td><span class="status-badge">${capitalize(user.papel)}</span></td>
            <td>${renderStatusBadge(user.status)}</td>
            <td style="color:var(--text-muted)">${formatDate(user.since || user.created_at)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action edit" data-id="${user.id}">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button class="btn-action delete" data-id="${user.id}">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Event Delegation para botões de ação (Edit/Delete)
usersTableBody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-action.edit');
    const deleteBtn = e.target.closest('.btn-action.delete');

    if (editBtn) {
        const id = editBtn.dataset.id;
        openUserModal(id);
    } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        openDeleteModal(id);
    }
});

function setupFilters() {
    const searchInput = document.getElementById("userSearchInput");
    const roleSelect = document.getElementById("roleFilter");
    const statusSelect = document.getElementById("statusFilter");

    const applyFilters = () => {
        renderUsersTable(searchInput.value, roleSelect.value, statusSelect.value);
    };

    searchInput.addEventListener("input", applyFilters);
    roleSelect.addEventListener("change", applyFilters);
    statusSelect.addEventListener("change", applyFilters);
}

// ---------------------- INTERFACE: MODAIS ----------------------

// Abrir Modal de Criação/Edição
// Abrir Modal de Criação/Edição
window.openUserModal = function(id = null) {
    editUserId = id;
    clearFeedback();
    userForm.reset();

    if (id) {
        // Modo Edição
        // Usando == para permitir comparação entre string e number se necessário
        const user = usersData.find(u => u.id == id);
        
        if (!user) {
            console.error("Usuário não encontrado para edição. ID:", id);
            return;
        }

        document.getElementById("inpUserName").value = user.nome;
        document.getElementById("inpUserEmail").value = user.email;
        document.getElementById("inpUserRole").value = capitalize(user.papel); 
        document.getElementById("inpUserStatus").value = user.status; 
        document.getElementById("inpUserNote").value = user.observacao || "";

        document.getElementById("userModalTitle").textContent = "Editar Usuário";
        document.getElementById("btnSaveUser").textContent = "Atualizar";
    } else {
        // Modo Criação
        document.getElementById("userModalTitle").textContent = "Novo Usuário";
        document.getElementById("btnSaveUser").textContent = "Salvar";
    }

    userModal.classList.add("open");
    document.body.classList.add("modal-open");
};

window.closeUserModal = function() {
    userModal.classList.remove("open");
    document.body.classList.remove("modal-open");
    editUserId = null;
};

// Abrir Modal de Exclusão
window.openDeleteModal = function(id) {
    userIdToDelete = id;
    const user = usersData.find(u => u.id === id);
    
    if (user) {
        document.getElementById("deleteUserText").innerHTML = `Tem certeza que deseja excluir <strong>${user.nome}</strong>?`;
    }
    
    deleteUserModal.classList.add("open");
    document.body.classList.add("modal-open");
};

// Renomeado para bater com o HTML estático (onclick="closeDeleteUserModal()")
window.closeDeleteUserModal = function() {
    deleteUserModal.classList.remove("open");
    document.body.classList.remove("modal-open");
    userIdToDelete = null;
};

// ---------------------- FORMULÁRIO ----------------------

userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Coleta dados
    const nome = document.getElementById("inpUserName").value.trim();
    const email = document.getElementById("inpUserEmail").value.trim();
    const papel = document.getElementById("inpUserRole").value;
    const status = document.getElementById("inpUserStatus").value;
    const observacao = document.getElementById("inpUserNote").value.trim();

    // Validação básica
    if (!nome || !email || !papel || !status) {
        setFeedback("Preencha todos os campos obrigatórios.");
        return;
    }

    // Prepara objeto para API
    const payload = {
        nome,
        email,
        papel: papel.toLowerCase(),
        status: status.toLowerCase(),
        observacao
    };

    await saveUser(payload);
});

// ---------------------- UTILITÁRIOS & MÉTRICAS ----------------------

function updateUserMetrics() {
    // Normaliza para minúsculo
    const active = usersData.filter(u => (u.status || "").toLowerCase() === "active").length;
    const suspended = usersData.filter(u => (u.status || "").toLowerCase() === "suspended").length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recent = usersData.filter(u => {
        const dateStr = u.since || u.created_at;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= thirtyDaysAgo;
    }).length;

    setText("metricActiveUsers", active);
    setText("metricSuspended", suspended);
    setText("metricNewUsers", recent);
}

function renderStatusBadge(status) {
    // Normaliza status para garantir match com as chaves do mapa
    const normalizedStatus = (status || "").toLowerCase();
    
    const map = {
        active: { label: "Ativo", class: "active" },     // CSS .active costuma ser verde
        pending: { label: "Pendente", class: "pending" }, // CSS .pending costuma ser amarelo
        suspended: { label: "Suspenso", class: "suspended" } // CSS .suspended costuma ser vermelho
    };
    
    const config = map[normalizedStatus] || { label: status, class: "" };
    return `<span class="status-badge ${config.class}">${config.label}</span>`;
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(isoDate) {
    if (!isoDate) return "--";
    try {
        const date = new Date(isoDate);
        return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
        return isoDate;
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setFeedback(msg) {
    if (feedback) feedback.textContent = msg;
}

function clearFeedback() {
    if (feedback) feedback.textContent = "";
}

// Fechar modais com ESC ou clique fora
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

// ---------------------- INICIALIZAÇÃO ----------------------
document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();
    setupFilters();
    setupModalClosing();
});
