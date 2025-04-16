// Classe pour gérer les données des utilisateurs
class DataManager {
    constructor() {
        this.userData = [];
        this.init();
    }

    init() {
        // Charger les données existantes
        this.loadData();

        // Gestionnaire de formulaire d'ajout de données
        const dataForm = document.getElementById('data-form');
        if (dataForm) {
            dataForm.addEventListener('submit', (e) => this.handleAddData(e));
        }
    }

    async loadData() {
        if (!auth.token) return;

        try {
            const response = await fetch('http://localhost:3000/api/data', {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            if (response.ok) {
                this.userData = await response.json();
                this.updateDataList();
            }
        } catch (error) {
            this.showMessage('Erreur lors du chargement des données', 'error');
        }
    }

    async handleAddData(e) {
        e.preventDefault();
        const dataInput = document.getElementById('data-input');
        const newData = dataInput.value.trim();

        if (newData && auth.token) {
            try {
                const response = await fetch('http://localhost:3000/api/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${auth.token}`
                    },
                    body: JSON.stringify({ content: newData })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.userData.push(data);
                    this.updateDataList();
                    dataInput.value = '';
                    this.showMessage('Donnée ajoutée avec succès', 'success');
                } else {
                    this.showMessage('Erreur lors de l\'ajout des données', 'error');
                }
            } catch (error) {
                this.showMessage('Erreur lors de l\'ajout des données', 'error');
            }
        }
    }

    updateDataList() {
        const dataList = document.getElementById('data-list');
        if (!dataList || !auth.currentUser) return;

        if (this.userData.length === 0) {
            dataList.innerHTML = '<p class="text-muted">Aucune donnée disponible</p>';
            return;
        }

        dataList.innerHTML = this.userData.map(item => `
            <div class="data-item">
                <div>
                    <strong>${item.content}</strong>
                    <small class="text-muted d-block">${new Date(item.timestamp).toLocaleString()}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-danger" onclick="dataManager.deleteData('${item._id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteData(dataId) {
        if (!auth.token) return;

        try {
            const response = await fetch(`http://localhost:3000/api/data/${dataId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            if (response.ok) {
                this.userData = this.userData.filter(item => item._id !== dataId);
                this.updateDataList();
                this.showMessage('Donnée supprimée avec succès', 'success');
            } else {
                this.showMessage('Erreur lors de la suppression des données', 'error');
            }
        } catch (error) {
            this.showMessage('Erreur lors de la suppression des données', 'error');
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} mt-3`;
        messageDiv.textContent = message;
        
        const dataManagement = document.getElementById('data-management');
        dataManagement.insertBefore(messageDiv, dataManagement.firstChild);
        
        setTimeout(() => messageDiv.remove(), 3000);
    }
}

// Initialiser le gestionnaire de données
const dataManager = new DataManager(); 