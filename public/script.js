// script.js

// Supabase bağlantısı
const supabaseUrl = 'https://neijkzbyyqtwpmsvymip.supabase.co'; // Supabase URL'nizi buraya ekleyin
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWpremJ5eXF0d3Btc3Z5bWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NjY2NjAsImV4cCI6MjA0NjA0MjY2MH0.JiDT3kT_Ror6-AWFKTo9JJBQUC_ZQTPXOYJNpBlaaxQ'; // Supabase Anon Key'inizi buraya ekleyin
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase Client Oluşturuldu:', supabaseClient);

// Kullanıcı Kayıt Olma Fonksiyonu
async function signUp(email, password) {
    console.log('Kayıt Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Kayıt Hatası:', error.message);
        alert('Kayıt Hatası: ' + error.message);
    } else {
        console.log('Kullanıcı Kaydedildi:', data.user);
        alert('Kayıt Başarılı! Lütfen e-posta adresinizi doğrulayın.');
    }
}

// Kullanıcı Giriş Yapma Fonksiyonu
async function signIn(email, password) {
    console.log('Giriş Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Giriş Hatası:', error.message);
        alert('Giriş Hatası: ' + error.message);
    } else {
        console.log('Kullanıcı Giriş Yaptı:', data.user);
        alert('Giriş Başarılı!');
        // Kullanıcı giriş yaptıktan sonra ek işlemler yapabilirsiniz
    }
}

// Abonelik Satın Alma Fonksiyonu
async function subscribeUser(planId) {
    console.log('Abonelik Satın Alma Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        console.error('Kullanıcı Bilgisi Alınamadı:', error ? error.message : 'Giriş yapılmamış');
        alert('Lütfen önce giriş yapın.');
        return;
    }

    const user = data.user;

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id, planId: planId })
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('Abonelik Başarıyla Alındı:', responseData);
            alert('Abonelik Başarıyla Alındı!');
        } else {
            console.error('Abonelik Satın Alma Hatası:', responseData.message);
            alert('Abonelik Satın Alma Hatası: ' + responseData.message);
        }
    } catch (error) {
        console.error('Ağ Hatası:', error.message);
        alert('Ağ Hatası: ' + error.message);
    }
}

// Önerileri Görselleştirme Fonksiyonu
async function displayRecommendations(packageName) {
    try {
        // Serverless fonksiyonunu çağırarak analiz verilerini çekme
        const response = await fetch(`/api/analyzeMarket?market=${encodeURIComponent(packageName)}`, {
            method: 'GET',
        });

        const result = await response.json();
        if (!response.ok) {
            alert('Veri çekme hatası: ' + result.message);
            return;
        }

        // Recommendations Container'ını temizle
        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = '';

        if (result.analysis.length === 0) {
            recommendationsDiv.innerHTML = '<p>Seçilen paket için analiz bulunamadı.</p>';
        } else {
            result.analysis.forEach(item => {
                const recommendationCard = document.createElement('div');
                recommendationCard.classList.add('recommendation-card');

                if (item.signal === 'Buy') {
                    recommendationCard.classList.add('strong-buy');
                } else if (item.signal === 'Sell') {
                    recommendationCard.classList.add('strong-sell');
                }

                recommendationCard.innerHTML = `
                    <h3>${item.signal} Sinyali</h3>
                    <p>Sembol: ${item.symbol}</p>
                    <p>RSI: ${item.rsi.toFixed(2)}</p>
                    <p>MACD: ${item.macd.toFixed(5)}</p>
                    <p>${item.textual_analysis}</p>
                `;

                recommendationsDiv.appendChild(recommendationCard);
            });
        }

        // Grafik oluşturma (isteğe bağlı)
        // Burada Chart.js veya başka bir kütüphane kullanarak grafik oluşturabilirsiniz

    } catch (error) {
        console.error('Önerileri görüntüleme hatası:', error);
        alert('Önerileri görüntüleme hatası: ' + error.message);
    }
}

// DOMContentLoaded etkinliğinde Event Listener'lar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Finansal Analiz Platformu yüklendi.');

    // "Satın Al" Butonlarına Event Listener Ekleme
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedPackage = button.getAttribute('data-package');
            console.log('Seçilen Paket:', selectedPackage);
            // Giriş kontrolü yapabilir ve abonelik işlemini başlatabilirsiniz
            subscribeUser(selectedPackage);
        });
    });

    // Giriş ve Kayıt Formları Arasında Geçiş
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Giriş ve Kayıt Butonlarına Event Listener Ekleme
    document.getElementById('login-btn').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signIn(email, password);
    });

    document.getElementById('register-btn').addEventListener('click', () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        signUp(email, password);
    });

    // Modal Kapatma İşlemi
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Modal Dışına Tıklanınca Kapatma
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Market Dropdown Event Listener
    const marketDropdown = document.getElementById('market-dropdown');
    if (marketDropdown) {
        marketDropdown.addEventListener('change', () => {
            const selectedPackage = marketDropdown.value;
            if (selectedPackage) {
                displayRecommendations(selectedPackage);
            } else {
                // Önerileri ve grafikleri temizleme
                const recommendationsDiv = document.getElementById('recommendations');
                recommendationsDiv.innerHTML = '';
                // Grafik temizleme işlemi (eğer varsa)
            }
        });
    }
});
