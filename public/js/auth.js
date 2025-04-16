// Classe pour gérer l'authentification
class Auth {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.token = null;
        this.init();
    }

    init() {
        // Vérifier si un utilisateur est déjà connecté
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('currentUser');
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.currentUser = JSON.parse(savedUser);
            this.isAdmin = this.currentUser.role === 'admin';
            this.showDashboard();
        }

        // Gestionnaire de formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
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

            if (response.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                this.isAdmin = data.user.role === 'admin';
                localStorage.setItem('token', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.showDashboard();
            } else {
                this.showError(data.error || 'Identifiants invalides');
            }
        } catch (error) {
            this.showError('Erreur lors de la connexion');
        }
    }

    showDashboard() {
        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('dashboard-section').classList.remove('d-none');
        this.updateUserInfo();
    }

    updateUserInfo() {
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.currentUser) {
            userInfo.innerHTML = `
                <div class="alert alert-info">
                    Connecté en tant que : ${this.currentUser.username}
                    <button class="btn btn-sm btn-danger float-end" onclick="auth.logout()">Déconnexion</button>
                </div>
            `;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = message;
        
        const form = document.getElementById('login-form');
        form.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 3000);
    }

    logout() {
        this.currentUser = null;
        this.isAdmin = false;
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        document.getElementById('login-section').classList.remove('d-none');
        document.getElementById('dashboard-section').classList.add('d-none');
        document.getElementById('login-form').reset();
    }
}

// Initialiser l'authentification
const auth = new Auth(); 