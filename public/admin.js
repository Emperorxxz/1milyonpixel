class AdminPanel {
    constructor() {
        this.currentTab = 'dashboard';
        this.blocks = [];
        this.stats = {};
        
        this.init();
    }

    async init() {
        await this.loadDashboard();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('blockSearch').addEventListener('input', (e) => {
            this.filterBlocks(e.target.value);
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterBlocksByStatus(e.target.value);
        });
    }

    showTab(tabName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to clicked tab
        event.target.classList.add('active');

        this.currentTab = tabName;

        // Load content based on tab
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
            // Load stats
            const statsResponse = await fetch('/api/admin/stats');
            if (statsResponse.ok) {
                this.stats = await statsResponse.json();
                this.renderStats();
            }

            // Load recent activity
            const activityResponse = await fetch('/api/admin/recent-activity');
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
                <h3>${this.stats.totalRevenue || 0} ₺</h3>
                <p>Toplam Gelir</p>
            </div>
            <div class="stat-card">
                <h3>${this.stats.totalClicks || 0}</h3>
                <p>Toplam Tıklama</p>
            </div>
            <div class="stat-card">
                <h3>${this.stats.totalViews || 0}</h3>
                <p>Toplam Görüntülenme</p>
            </div>
        `;
    }

    renderRecentActivity(activities) {
        const activityDiv = document.getElementById('recentActivity');
        if (!activities || activities.length === 0) {
            activityDiv.innerHTML = '<p>Henüz aktivite bulunmuyor.</p>';
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item" style="padding: 10px; border-bottom: 1px solid #ecf0f1;">
                <strong>${activity.type}</strong> - ${activity.description}
                <small style="color: #7f8c8d; display: block;">${new Date(activity.createdAt).toLocaleString('tr-TR')}</small>
            </div>
        `).join('');

        activityDiv.innerHTML = activityHTML;
    }

    async loadBlocks() {
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/admin/blocks');
            if (response.ok) {
                this.blocks = await response.json();
                this.renderBlocks(this.blocks);
            }
        } catch (error) {
            console.error('Bloklar yüklenirken hata:', error);
        } finally {
            this.showLoading(false);
        }
    }

    renderBlocks(blocks) {
        const tbody = document.getElementById('blocksTableBody');
        
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
                            <button class="btn-small btn-approve" onclick="adminPanel.approveBlock('${block._id}')">✓ Onayla</button>
                            <button class="btn-small btn-reject" onclick="adminPanel.rejectBlock('${block._id}')">✗ Reddet</button>
                        ` : ''}
                        <button class="btn-small btn-delete" onclick="adminPanel.deleteBlock('${block._id}')">🗑️ Sil</button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = blocksHTML;
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
        if (!confirm('Bu bloğu onaylamak istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/blocks/${blockId}/approve`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('Blok başarıyla onaylandı!');
                await this.loadBlocks();
                await this.loadDashboard();
            } else {
                const error = await response.json();
                alert('Hata: ' + error.message);
            }
        } catch (error) {
            console.error('Blok onaylanırken hata:', error);
            alert('Bir hata oluştu.');
        }
    }

    async rejectBlock(blockId) {
        if (!confirm('Bu bloğu reddetmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/blocks/${blockId}/reject`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('Blok reddedildi!');
                await this.loadBlocks();
                await this.loadDashboard();
            } else {
                const error = await response.json();
                alert('Hata: ' + error.message);
            }
        } catch (error) {
            console.error('Blok reddedilirken hata:', error);
            alert('Bir hata oluştu.');
        }
    }

    async deleteBlock(blockId) {
        if (!confirm('Bu bloğu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/blocks/${blockId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Blok başarıyla silindi!');
                await this.loadBlocks();
                await this.loadDashboard();
            } else {
                const error = await response.json();
                alert('Hata: ' + error.message);
            }
        } catch (error) {
            console.error('Blok silinirken hata:', error);
            alert('Bir hata oluştu.');
        }
    }

    loadUsers() {
        const usersContent = document.getElementById('usersContent');
        usersContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>👥 Kullanıcı Yönetimi</h3>
                <p>Bu özellik gelecek güncellemelerde eklenecektir.</p>
                <p>Şu anda blok sahiplerini "Blok Yönetimi" sekmesinden görebilirsiniz.</p>
            </div>
        `;
    }

    loadSettings() {
        // Settings are already in HTML, just show a message
        console.log('Settings tab loaded');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'active': 'Aktif',
            'rejected': 'Reddedildi',
            'approved': 'Onaylandı'
        };
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

// Global functions for HTML onclick events
function showTab(tabName) {
    adminPanel.showTab(tabName);
}

function loadBlocks() {
    adminPanel.loadBlocks();
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
