class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        if (!this.token) {
            window.location.href = '/login.html';
            return;
        }

        this.currentTab = 'dashboard';
        this.blocks = [];
        this.stats = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboard();
        this.blockListenersAttached = false;
    }

    setupEventListeners() {
        // Logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Çıkış Yap';
        logoutButton.className = 'btn btn-secondary';
        logoutButton.addEventListener('click', () => this.logout());
        
        const headerContainer = document.querySelector('.admin-header .container');
        if (headerContainer) {
            headerContainer.appendChild(logoutButton);
        } else {
            console.error('Admin header container not found!');
        }

        // Tab buttons
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                const tabName = event.target.dataset.tab;
                if (tabName) {
                    this.showTab(event, tabName);
                }
            });
        });
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/login.html';
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async fetchWithAuth(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: this.getAuthHeaders(),
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Yetkisiz erişim');
        }
        return response;
    }

    showTab(event, tabName) {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        
        if (event && event.target) {
            event.target.classList.add('active');
        }

        this.currentTab = tabName;

        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'blocks':
                this.loadBlocks();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        this.showLoading(true);
        try {
            const statsResponse = await this.fetchWithAuth('/api/admin/stats');
            if (statsResponse.ok) {
                this.stats = await statsResponse.json();
                this.renderStats();
            }
            const activityResponse = await this.fetchWithAuth('/api/admin/blocks/pending');
            if (activityResponse.ok) {
                const activity = await activityResponse.json();
                this.renderRecentActivity(activity);
            }
        } catch (error) {
            console.error('Dashboard yüklenirken hata:', error);
        } finally {
            this.showLoading(false);
        }
    }

    renderStats() {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <h3>${this.stats.totalBlocks || 0}</h3>
                <p>Toplam Blok</p>
            </div>
            <div class="stat-card">
                <h3>${this.stats.activeBlocks || 0}</h3>
                <p>Aktif Blok</p>
            </div>
            <div class="stat-card">
                <h3>${this.stats.pendingBlocks || 0}</h3>
                <p>Onay Bekleyen</p>
            </div>
            <div class="stat-card">
                <h3>${this.stats.totalClicks || 0}</h3>
                <p>Toplam Tıklama</p>
            </div>
        `;
    }

    renderRecentActivity(activities) {
        const activityDiv = document.getElementById('recentActivity');
        if (!activities || activities.length === 0) {
            activityDiv.innerHTML = '<p>Onay bekleyen aktivite bulunmuyor.</p>';
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item" style="padding: 10px; border-bottom: 1px solid #ecf0f1;">
                <strong>Yeni Blok Satın Alımı</strong> - ${activity.owner.name} (${activity.owner.email})
                <small style="color: #7f8c8d; display: block;">${new Date(activity.createdAt).toLocaleString('tr-TR')}</small>
            </div>
        `).join('');

        activityDiv.innerHTML = activityHTML;
    }

    async loadBlocks() {
        this.showLoading(true);
        try {
            const response = await this.fetchWithAuth('/api/admin/blocks/all');
            if (response.ok) {
                this.blocks = await response.json();
                this.renderBlocks(this.blocks);

                if (!this.blockListenersAttached) {
                    const blockSearch = document.getElementById('blockSearch');
                    const statusFilter = document.getElementById('statusFilter');

                    if (blockSearch) {
                        blockSearch.addEventListener('input', (e) => {
                            this.filterBlocks(e.target.value);
                        });
                    }
                    
                    if (statusFilter) {
                        statusFilter.addEventListener('change', (e) => {
                            this.filterBlocksByStatus(e.target.value);
                        });
                    }
                    
                    this.blockListenersAttached = true;
                }
            }
        } catch (error) {
            console.error('Bloklar yüklenirken hata:', error);
        } finally {
            this.showLoading(false);
        }
    }

    renderBlocks(blocks) {
        const tbody = document.getElementById('blocksTableBody');
        if (!tbody) return;

        if (!blocks || blocks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Henüz blok bulunmuyor.</td></tr>';
            return;
        }

        const blocksHTML = blocks.map(block => `
            <tr>
                <td>(${block.blockX}, ${block.blockY})</td>
                <td>${block.content.title}</td>
                <td>
                    ${block.owner.name}<br>
                    <small>${block.owner.email}</small>
                </td>
                <td><a href="${block.content.url}" target="_blank">${block.content.url}</a></td>
                <td><span class="status-badge status-${block.status}">${this.getStatusText(block.status)}</span></td>
                <td>${block.purchase.price} ${block.purchase.currency}</td>
                <td>${new Date(block.createdAt).toLocaleDateString('tr-TR')}</td>
                <td>
                    <div class="action-buttons">
                        ${block.status === 'pending' ? `
                            <button class="btn-small btn-approve" data-action="approve" data-id="${block._id}">✓ Onayla</button>
                            <button class="btn-small btn-reject" data-action="reject" data-id="${block._id}">✗ Reddet</button>
                        ` : ''}
                        <button class="btn-small btn-delete" data-action="delete" data-id="${block._id}">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = blocksHTML;
        this.attachTableActionListeners();
    }

    attachTableActionListeners() {
        const tbody = document.getElementById('blocksTableBody');
        if (!tbody) return;

        tbody.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (!action || !id) return;

            switch (action) {
                case 'approve':
                    this.approveBlock(id);
                    break;
                case 'reject':
                    this.rejectBlock(id);
                    break;
                case 'delete':
                    this.deleteBlock(id);
                    break;
            }
        });
    }

    filterBlocks(searchTerm) {
        if (!searchTerm) {
            this.renderBlocks(this.blocks);
            return;
        }

        const filtered = this.blocks.filter(block => 
            block.content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            block.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            block.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            block.content.url.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderBlocks(filtered);
    }

    filterBlocksByStatus(status) {
        if (!status) {
            this.renderBlocks(this.blocks);
            return;
        }

        const filtered = this.blocks.filter(block => block.status === status);
        this.renderBlocks(filtered);
    }

    async approveBlock(blockId) {
        if (!confirm('Bu bloğu onaylamak istediğinizden emin misiniz?')) return;

        try {
            const response = await this.fetchWithAuth(`/api/admin/blocks/${blockId}/approve`, { method: 'PUT' });
            if (response.ok) {
                alert('Blok başarıyla onaylandı!');
                await this.loadDashboard();
                if (this.currentTab === 'blocks') await this.loadBlocks();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Blok onaylanırken hata:', error);
        }
    }

    async rejectBlock(blockId) {
        if (!confirm('Bu bloğu reddetmek istediğinizden emin misiniz?')) return;

        try {
            const response = await this.fetchWithAuth(`/api/admin/blocks/${blockId}/reject`, { method: 'PUT' });
            if (response.ok) {
                alert('Blok reddedildi!');
                await this.loadDashboard();
                if (this.currentTab === 'blocks') await this.loadBlocks();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Blok reddedilirken hata:', error);
        }
    }

    async deleteBlock(blockId) {
        if (!confirm('Bu bloğu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;

        try {
            const response = await this.fetchWithAuth(`/api/admin/blocks/${blockId}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Blok başarıyla silindi!');
                await this.loadDashboard();
                if (this.currentTab === 'blocks') await this.loadBlocks();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Blok silinirken hata:', error);
        }
    }

    async loadUsers() {
        this.showLoading(true);
        try {
            const response = await this.fetchWithAuth('/api/admin/users');
            if (response.ok) {
                const users = await response.json();
                this.renderUsers(users);
            } else {
                document.getElementById('usersContent').innerHTML = `<p class="error">Kullanıcılar yüklenemedi.</p>`;
            }
        } catch (error) {
            console.error('Kullanıcılar yüklenirken hata:', error);
        } finally {
            this.showLoading(false);
        }
    }

    renderUsers(users) {
        const usersContent = document.getElementById('usersContent');
        
        if (!users || users.length === 0) {
            usersContent.innerHTML = '<p>Henüz hiç kullanıcı (blok sahibi) bulunmuyor.</p>';
            return;
        }

        const tableHTML = `
            <table class="blocks-table">
                <thead>
                    <tr>
                        <th>İsim</th>
                        <th>Email</th>
                        <th>Blok Sayısı</th>
                        <th>Toplam Harcama (TRY)</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.blockCount}</td>
                            <td>${user.totalSpent.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        usersContent.innerHTML = tableHTML;
    }

    async loadSettings() {
        this.showLoading(true);
        try {
            const response = await this.fetchWithAuth('/api/admin/settings');
            if (response.ok) {
                const settings = await response.json();
                this.renderSettings(settings);
            } else {
                this.renderSettings({});
            }
        } catch (error) {
            console.error('Ayarlar yüklenirken hata:', error);
            this.renderSettings({});
        } finally {
            this.showLoading(false);
        }
    }

    renderSettings(settings) {
        const settingsContent = `
            <div class="form-section">
                <h3>Genel Ayarlar</h3>
                <div class="form-group">
                    <label for="blockPrice">Blok Fiyatı (TRY)</label>
                    <input type="number" id="blockPrice" value="${settings.blockPrice || 300}" min="1" step="0.01">
                </div>
                <div class="form-group">
                    <label for="autoApprove">Otomatik Onay</label>
                    <select id="autoApprove">
                        <option value="false" ${!settings.autoApprove ? 'selected' : ''}>Manuel Onay</option>
                        <option value="true" ${settings.autoApprove ? 'selected' : ''}>Otomatik Onay</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="maxFileSize">Maksimum Dosya Boyutu (MB)</label>
                    <input type="number" id="maxFileSize" value="${settings.maxFileSize || 2}" min="1" max="10">
                </div>
                <button class="btn btn-primary" onclick="adminPanel.saveSettings()">💾 Kaydet</button>
            </div>
        `;
        document.getElementById('settings').innerHTML = `<h2>⚙️ Sistem Ayarları</h2>` + settingsContent;
    }

    async saveSettings() {
        const settings = {
            blockPrice: document.getElementById('blockPrice').value,
            autoApprove: document.getElementById('autoApprove').value === 'true',
            maxFileSize: document.getElementById('maxFileSize').value,
        };

        if (!confirm('Ayarları kaydetmek istediğinizden emin misiniz?')) return;

        this.showLoading(true);
        try {
            const response = await this.fetchWithAuth('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                alert('Ayarlar başarıyla kaydedildi!');
                await this.loadSettings();
            } else {
                const error = await response.json();
                alert('Hata: ' + (error.error || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Ayarlar kaydedilirken hata:', error);
        } finally {
            this.showLoading(false);
        }
    }

    getStatusText(status) {
        const statusMap = { 'pending': 'Bekliyor', 'active': 'Aktif', 'rejected': 'Reddedildi' };
        return statusMap[status] || status;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});