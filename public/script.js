document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('pixelCanvas');
  const ctx = canvas.getContext('2d');
  const modal = document.getElementById('purchaseModal');
  const closeBtn = document.querySelector('.close');
  const pixelForm = document.getElementById('pixelForm');

  let selectedPixels = 0;
  const PIXEL_PRICE = 3; // TL
  let selection = { startX: 0, startY: 0, endX: 0, endY: 0 };

  // Canvas grid çiz
  function drawGrid() {
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= 1000; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1000);
      ctx.stroke();
      ctx.moveTo(0, i);
      ctx.lineTo(1000, i);
      ctx.stroke();
    }
  }

  // Satın alınan pikselleri yükle
  async function loadPurchasedPixels() {
    const response = await fetch('/api/pixels');
    const pixels = await response.json();
    pixels.forEach(pixel => {
      ctx.fillStyle = pixel.color || '#f0f0f0';
      ctx.fillRect(pixel.x, pixel.y, pixel.width, pixel.height);
    });
  }

  // Seçim yap
  canvas.addEventListener('mousedown', (e) => {
    selection.startX = Math.floor(e.offsetX / 10) * 10;
    selection.startY = Math.floor(e.offsetY / 10) * 10;
  });

  canvas.addEventListener('mouseup', (e) => {
    selection.endX = Math.floor(e.offsetX / 10) * 10;
    selection.endY = Math.floor(e.offsetY / 10) * 10;

    const width = Math.abs(selection.endX - selection.startX) + 10;
    const height = Math.abs(selection.endY - selection.startY) + 10;
    selectedPixels = (width * height) / 100; // 10x10 blok sayısı

    document.getElementById('selectedPixels').textContent = selectedPixels;
    document.getElementById('totalPrice').textContent = selectedPixels * PIXEL_PRICE;
    modal.style.display = 'block';
  });

  // Modal kapat
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    loadPurchasedPixels();
  });

  // Form gönderimi
  pixelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('x', selection.startX);
    formData.append('y', selection.startY);
    formData.append('width', Math.abs(selection.endX - selection.startX) + 10);
    formData.append('height', Math.abs(selection.endY - selection.startY) + 10);
    formData.append('url', document.getElementById('url').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('image', document.getElementById('image').files[0]);

    const response = await fetch('/api/pixels', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      alert('Pikseller rezerve edildi!');
      modal.style.display = 'none';
      loadPurchasedPixels();
    }
  });

  // Başlangıç
  drawGrid();
  loadPurchasedPixels();
});
// Canvas render optimizasyonu
const renderCanvas = async () => {
  const response = await fetch('/api/pixels');
  const pixels = await response.json();
  
  const canvas = document.getElementById('pixelCanvas');
  const ctx = canvas.getContext('2d');
  
  // Önce grid çiz
  drawGrid(ctx);
  
  // Sonra pikselleri render et
  pixels.forEach(pixel => {
    ctx.fillStyle = pixel.color || '#f0f0f0';
    ctx.fillRect(
      pixel.coordinates.x,
      pixel.coordinates.y,
      pixel.size.width,
      pixel.size.height
    );
  });
};

// Seçim yönetimi (debounce eklenmiş)
let selectionTimeout;
canvas.addEventListener('mousemove', (e) => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    updateSelection(e);
  }, 50);
});