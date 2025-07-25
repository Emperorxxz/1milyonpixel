console.log('login.js dosyası başarıyla yüklendi.');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded olayı tetiklendi.');
    const loginButton = document.getElementById('loginButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    // Eğer kullanıcı zaten giriş yapmışsa, admin sayfasına yönlendir
    if (localStorage.getItem('adminToken')) {
        window.location.href = '/admin.html';
    }

    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Login butonuna tıklandı.');
        errorMessage.textContent = '';

        const username = usernameInput.value;
        const password = passwordInput.value;
        
        console.log('Gönderilen bilgiler:', { username, password });

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            
            console.log('Sunucudan gelen yanıt:', response);

            const data = await response.json();
            console.log('Sunucudan gelen veri (JSON):', data);

            if (response.ok) {
                console.log('Giriş başarılı. Token alınıyor...');
                // Token'ı localStorage'a kaydet
                localStorage.setItem('adminToken', data.token);
                console.log('Token kaydedildi. Yönlendiriliyor...');
                // Admin sayfasına yönlendir
                window.location.href = '/admin.html';
            } else {
                console.error('Giriş başarısız:', data.error);
                errorMessage.textContent = data.error || 'Bir hata oluştu.';
            }
        } catch (error) {
            console.error('Giriş sırasında kritik hata:', error);
            errorMessage.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
        }
    });
});
