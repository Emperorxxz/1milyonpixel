class PixelBlockApp {
    constructor() {
        this.pixelGrid = document.getElementById('pixelGrid');
        this.selectedBlocks = new Set();
        this.isSelecting = false;
        this.selectionStart = null;
        this.zoomLevel = 1;
        this.blocks = new Map();
        this.tooltip = null;
        this.socket = null; // Socket.IO nesnesi
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        this.createGrid();
        this.setupEventListeners();
        this.setupSocket(); // Socket'i başlat
        await this.loadBlocks();
        await this.loadStats();
        this.showLoading(false);
    }

    createGrid() {
        this.pixelGrid.innerHTML = '';
        
        // 100x100 grid oluştur (10,000 blok)
        for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 100; x++) {
                const block = document.createElement('div');
                block.className = 'pixel-block';
                block.dataset.x = x;
                block.dataset.y = y;
                block.dataset.blockId = `${x}-${y}`;
                
                // Event listeners
                block.addEventListener('click', (e) => this.handleBlockClick(e, x, y));
                block.addEventListener('mouseenter', (e) => this.handleBlockHover(e, x, y));
                block.addEventListener('mouseleave', () => this.hideTooltip());
                
                this.pixelGrid.appendChild(block);
            }
        }
    }

    setupEventListeners() {
        // Purchase form
        document.getElementById('showPurchaseForm').addEventListener('click', () => this.showPurchaseForm());
        document.getElementById('closePurchaseModal').addEventListener('click', () => this.hidePurchaseForm());
        document.getElementById('cancelPurchase').addEventListener('click', () => this.hidePurchaseForm());
        document.getElementById('purchaseForm').addEventListener('submit', (e) => this.handlePurchase(e));
        
        // Block info panel
        document.getElementById('closeBlockInfo').addEventListener('click', () => this.hideBlockInfo());
        
        // Modal click outside to close
        document.getElementById('purchaseModal').addEventListener('click', (e) => {
            if (e.target.id === 'purchaseModal') {
                this.hidePurchaseForm();
            }
        });
    }

    setupSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Socket.IO sunucusuna bağlandı!');
        });

        // Başka bir kullanıcıdan gelen piksel güncellemesini dinle
        this.socket.on('update_pixel', (data) => {
            console.log('Gelen piksel güncellemesi:', data);
            this.updatePixelOnGrid(data);
        });
    }

    updatePixelOnGrid(data) {
        const element = document.querySelector(`[data-x="${data.x}"][data-y="${data.y}"]`);
        if (element) {
            element.style.backgroundColor = data.color;
            // Gerekirse diğer sınıfları ve verileri de güncelle
            element.classList.add('updated-by-socket');
        }
    }

    async loadBlocks() {
        try {
            const response = await fetch('/api/blocks/all-for-grid');
            if (response.ok) {
                const blocks = await response.json();
                this.renderBlocks(blocks);
            }
        } catch (error) {
            console.error('Bloklar yüklenirken hata:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/blocks/stats/summary');
            if (response.ok) {
                const stats = await response.json();
                this.updateStats(stats);
            }
        } catch (error) {
            console.error('İstatistikler yüklenirken hata:', error);
        }
    }

    renderBlocks(blocks) {
        // Clear existing styles first
        document.querySelectorAll('.pixel-block').forEach(el => {
            el.className = 'pixel-block';
            el.style.backgroundColor = '';
            el.style.backgroundImage = '';
        });
        this.blocks.clear();

        blocks.forEach(block => {
            const element = document.querySelector(`[data-x="${block.blockX}"][data-y="${block.blockY}"]`);
            if (element) {
                element.classList.add(block.status);
                
                if (block.status === 'active') {
                    element.style.backgroundColor = block.content.backgroundColor;
                    if (block.content.imagePath) {
                        element.style.backgroundImage = `url(${block.content.imagePath})`;
                    }
                }
                
                // Store full block info for tooltips and clicks
                this.blocks.set(`${block.blockX}-${block.blockY}`, block);
            }
        });
    }

    updateStats(stats) {
        document.getElementById('soldBlocks').textContent = stats.activeBlocks || 0;
        document.getElementById('availableBlocks').textContent = (10000 - (stats.totalBlocks || 0));
        document.getElementById('totalClicks').textContent = stats.totalClicks || 0;
    }

    handleBlockClick(event, x, y) {
        const blockId = `${x}-${y}`;
        const block = this.blocks.get(blockId);
        
        if (block) {
            // Block is either 'active' or 'pending'
            this.showBlockInfo(block);
        } else {
            // Müsait blok - seçim
            this.selectBlock(x, y, event);
        }
    }

    async recordClick(x, y, url) {
        try {
            const response = await fetch(`/api/blocks/${x}/${y}/click`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Tıklama kaydedildi:', result);
                
                // Yeni sekmede aç
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Tıklama kaydedilirken hata:', error);
        }
    }

    selectBlock(x, y, event) {
        const blockId = `${x}-${y}`;
        const element = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        
        // Normal tıklama ile çoklu seçim
        if (this.selectedBlocks.has(blockId)) {
            // Seçimi kaldır
            this.selectedBlocks.delete(blockId);
            element.classList.remove('selected');
        } else {
            // Seçime ekle
            this.selectedBlocks.add(blockId);
            element.classList.add('selected');
        }
        
        this.updateSelectionInfo();
    }

    clearSelection() {
        this.selectedBlocks.forEach(blockId => {
            const [x, y] = blockId.split('-');
            const element = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (element) {
                element.classList.remove('selected');
            }
        });
        this.selectedBlocks.clear();
    }

    updateSelectionInfo() {
        const count = this.selectedBlocks.size;
        const totalPrice = count * 300;
        
        if (count === 0) {
            document.getElementById('selectedBlockInfo').textContent = 'Lütfen grid üzerinden blok seçin';
            document.getElementById('blockX').value = '';
            document.getElementById('blockY').value = '';
        } else if (count === 1) {
            const blockId = Array.from(this.selectedBlocks)[0];
            const [x, y] = blockId.split('-');
            document.getElementById('selectedBlockInfo').textContent = `Blok (${x}, ${y}) - ${totalPrice} TL`;
            document.getElementById('blockX').value = x;
            document.getElementById('blockY').value = y;
        } else {
            document.getElementById('selectedBlockInfo').textContent = `${count} blok seçildi - Toplam: ${totalPrice} TL`;
            document.getElementById('blockX').value = Array.from(this.selectedBlocks).map(id => id.split('-')[0]).join(',');
            document.getElementById('blockY').value = Array.from(this.selectedBlocks).map(id => id.split('-')[1]).join(',');
        }
        
        // Fiyatı güncelle
        document.getElementById('price').value = totalPrice;
    }

    handleBlockHover(event, x, y) {
        const blockId = `${x}-${y}`;
        const block = this.blocks.get(blockId);
        
        if (block && block.status === 'active') {
            this.showTooltip(event, block);
        } else if (!block) {
            this.showTooltip(event, { 
                content: { title: 'Müsait Blok', description: 'Satın almak için tıklayın' }
            });
        }
    }

    showTooltip(event, block) {
        this.hideTooltip();
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.innerHTML = `
            <strong>${block.content.title}</strong>
            ${block.content.description ? `<br>${block.content.description}` : ''}
        `;
        
        document.body.appendChild(this.tooltip);
        
        const rect = event.target.getBoundingClientRect();
        this.tooltip.style.left = rect.left + rect.width / 2 + 'px';
        this.tooltip.style.top = rect.top - this.tooltip.offsetHeight - 10 + 'px';
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    showBlockInfo(block) {
        const content = document.getElementById('blockInfoContent');
        content.innerHTML = `
            <h3>${block.content.title}</h3>
            <p><strong>Durum:</strong> ${this.getStatusText(block.status)}</p>
            ${block.content.description ? `<p><strong>Açıklama:</strong> ${block.content.description}</p>` : ''}
            <p><strong>Pozisyon:</strong> (${block.blockX}, ${block.blockY})</p>
            ${block.stats ? `<p><strong>Tıklanma:</strong> ${block.stats.clicks}</p>` : ''}
            ${block.content.url && block.status === 'active' ? 
                `<p><a href="${block.content.url}" target="_blank" class="btn btn-primary">Siteyi Ziyaret Et</a></p>` : ''}
        `;
        
        document.getElementById('blockInfo').classList.remove('hidden');
    }

    hideBlockInfo() {
        document.getElementById('blockInfo').classList.add('hidden');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Onay Bekliyor',
            'approved': 'Onaylandı',
            'active': 'Aktif',
            'rejected': 'Reddedildi'
        };
        return statusMap[status] || status;
    }

    showPurchaseForm() {
        if (this.selectedBlocks.size === 0) {
            alert('Lütfen önce bir veya daha fazla blok seçin!');
            return;
        }
        
        document.getElementById('purchaseModal').classList.remove('hidden');
    }

    hidePurchaseForm() {
        document.getElementById('purchaseModal').classList.add('hidden');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('purchaseForm').reset();
        this.clearSelection();
        document.getElementById('selectedBlockInfo').textContent = 'Lütfen grid üzerinden blok seçin';
        document.getElementById('price').value = '300';
    }

    async handlePurchase(event) {
        event.preventDefault();
        
        if (this.selectedBlocks.size === 0) {
            alert('Lütfen bir blok seçin!');
            return;
        }

        this.showLoading(true);

        const purchasePromises = [];
        const originalForm = document.getElementById('purchaseForm');

        for (const blockId of this.selectedBlocks) {
            const [x, y] = blockId.split('-');
            
            // Create a new FormData for each block
            const formData = new FormData(originalForm);
            formData.set('blockX', x);
            formData.set('blockY', y);
            formData.set('price', 300); // Assuming a fixed price per block

            const promise = fetch('/api/blocks/purchase', {
                method: 'POST',
                body: formData
            }).then(response => response.json());

            purchasePromises.push(promise);
        }

        try {
            const results = await Promise.all(purchasePromises);
            
            const successfulPurchases = results.filter(r => !r.error);
            const failedPurchases = results.filter(r => r.error);

            let alertMessage = '';
            if (successfulPurchases.length > 0) {
                alertMessage += `${successfulPurchases.length} blok için başvurunuz başarıyla alındı. Admin onayı sonrası size e-posta ile bilgi verilecektir.\n`;
                // Update UI for successful purchases
                successfulPurchases.forEach(result => {
                    const blockElement = document.querySelector(`[data-block-id="${result.blockX}-${result.blockY}"]`);
                    if (blockElement) {
                        blockElement.classList.add('pending');
                        blockElement.classList.remove('selected');
                    }
                });
            }

            if (failedPurchases.length > 0) {
                const failedBlocks = failedPurchases.map(r => r.error).join('\n - ');
                alertMessage += `\n${failedPurchases.length} blok için hata oluştu:\n - ${failedBlocks}`;
            }

            alert(alertMessage);

            if (successfulPurchases.length > 0) {
                this.hidePurchaseForm();
                await this.loadStats();
            }
            
        } catch (error) {
            console.error('Satın alma hatası:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            this.showLoading(false);
            this.clearSelection();
        }
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

// Uygulama başlat
document.addEventListener('DOMContentLoaded', () => {
    new PixelBlockApp();
});

// Periyodik güncelleme (her 30 saniyede bir)
setInterval(async () => {
    if (window.pixelApp) {
        await window.pixelApp.loadStats();
    }
}, 30000);
