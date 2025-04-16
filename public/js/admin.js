// Classe pour gérer l'administration
class Admin {
    constructor() {
        this.token = null;
        this.init();
    }

    init() {
        // Vérifier si un admin est déjà connecté
        const savedToken = localStorage.getItem('adminToken');
        if (savedToken) {
            this.token = savedToken;
            this.showDashboard();
        }

        // Gestionnaire de formulaire de connexion
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Gestionnaire de formulaire de création d'utilisateur
        const createUserForm = document.getElementById('create-user-form');
        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => this.handleCreateUser(e));
        }

        // Charger la liste des utilisateurs
        this.loadUsers();
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.user.role === 'admin') {
                this.token = data.token;
                localStorage.setItem('adminToken', data.token);
                this.showDashboard();
            } else {
                this.showError('Identifiants invalides ou accès non autorisé');
            }
        } catch (error) {
            this.showError('Erreur lors de la connexion');
        }
    }

    async handleCreateUser(e) {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('user-role').value;

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Utilisateur créé avec succès', 'success');
                document.getElementById('create-user-form').reset();
                this.loadUsers();
            } else {
                this.showMessage(data.error || 'Erreur lors de la création de l\'utilisateur', 'error');
            }
        } catch (error) {
            this.showMessage('Erreur lors de la création de l\'utilisateur', 'error');
        }
    }

    async loadUsers() {
        if (!this.token) {
            console.log('Pas de token trouvé');
            return;
        }

        try {
            console.log('Tentative de chargement des utilisateurs');
            console.log('Token utilisé:', this.token);

            const response = await fetch('http://localhost:3000/api/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Réponse reçue:', response.status);

            if (response.ok) {
                const users = await response.json();
                console.log('Utilisateurs chargés:', users);
                this.updateUsersList(users);
            } else {
                const error = await response.json();
                console.error('Erreur lors du chargement:', error);
                this.showMessage(error.error || 'Erreur lors du chargement des utilisateurs', 'error');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
            this.showMessage('Erreur lors du chargement des utilisateurs', 'error');
        }
    }

    updateUsersList(users) {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = '<tr><td colspan="3" class="text-center">Aucun utilisateur trouvé</td></tr>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteUser('${user._id}')">
                        Supprimer
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async deleteUser(userId) {
        if (!this.token) return;

        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Utilisateur supprimé avec succès', 'success');
                this.loadUsers();
            } else {
                this.showMessage('Erreur lors de la suppression de l\'utilisateur', 'error');
            }
        } catch (error) {
            this.showMessage('Erreur lors de la suppression de l\'utilisateur', 'error');
        }
    }

    showDashboard() {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('admin-dashboard').classList.remove('d-none');
        this.loadUsers();
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} mt-3`;
        messageDiv.textContent = message;
        
        const dashboard = document.getElementById('admin-dashboard');
        dashboard.insertBefore(messageDiv, dashboard.firstChild);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = message;
        
        const form = document.getElementById('admin-login-form');
        form.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('adminToken');
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('admin-dashboard').classList.add('d-none');
        document.getElementById('admin-login-form').reset();
    }
}

// Initialiser l'administration
const admin = new Admin(); 