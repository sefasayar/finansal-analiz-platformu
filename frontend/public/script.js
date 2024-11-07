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
    }
}

// Abonelik Satın Alma Fonksiyonu
async function subscribeUser(planId) {
    console.log('Abonelik Satın Alma Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error('Kullanıcı Bilgisi Alınamadı:', error.message);
        alert('Kullanıcı bilgisi alınamadı: ' + error.message);
        return;
    }

    const user = data.user;

    if (!user) {
        console.error('Kullanıcı giriş yapmamış.');
        alert('Lütfen önce giriş yapın.');
        return;
    }

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id, planId: planId }),
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
        // ...

    } catch (error) {
        console.error('Önerileri görüntüleme hatası:', error);
        alert('Önerileri görüntüleme hatası: ' + error.message);
    }
}
// DOMContentLoaded etkinliğinde güncellemeler
document.addEventListener('DOMContentLoaded', () => {


        // Recommendations Container'ını temizle
        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = '';

        if (result.analysis.length === 0) {
            recommendationsDiv.innerHTML = '<p>Seçilen market için analiz bulunamadı.</p>';
        } else {
            result.analysis.forEach(pair => {
                if (pair.recommendation === 'Strong Buy' || pair.recommendation === 'Strong Sell') {
                    const recommendationCard = document.createElement('div');
                    recommendationCard.classList.add('recommendation-card');

                    if (pair.recommendation === 'Strong Buy') {
                        recommendationCard.classList.add('strong-buy');
                    } else if (pair.recommendation === 'Strong Sell') {
                        recommendationCard.classList.add('strong-sell');
                    }

                    recommendationCard.innerHTML = `
                        <h3>${pair.recommendation} Önerisi</h3>
                        <p>Parite: ${pair.symbol}</p>
                        <p>RSI: ${pair.rsi.toFixed(2)}</p>
                        <p>Duygu Skoru: ${pair.sentiment_score.toFixed(2)}</p>
                    `;

                    recommendationsDiv.appendChild(recommendationCard);
                }
   // Paket Dropdown Event Listener
    const marketDropdown = document.getElementById('market-dropdown');
    marketDropdown.addEventListener('change', () => {
        const selectedPackage = marketDropdown.value;
        if (selectedPackage) {
            displayRecommendations(selectedPackage);
        } else {
            // Clear recommendations and chart
            const recommendationsDiv = document.getElementById('recommendations');
            recommendationsDiv.innerHTML = '';
            // Grafik temizleme işlemi...
        }
    });
});
            });

            // Eğer hiç sinyal yoksa
            if (!result.analysis.some(pair => pair.recommendation === 'Strong Buy' || pair.recommendation === 'Strong Sell')) {
                recommendationsDiv.innerHTML = '<p>Şu anda güçlü al veya güçlü sat önerisi yok.</p>';
            }
        }

        // Grafik için verileri toplama
        const chartData = {};
        result.analysis.forEach(pair => {
            if (!chartData[pair.symbol]) {
                chartData[pair.symbol] = { dates: [], rsi: [], sentiment: [] };
            }
            chartData[pair.symbol].dates.push(pair.date);
            chartData[pair.symbol].rsi.push(pair.rsi);
            chartData[pair.symbol].sentiment.push(pair.sentiment_score);
        });

        // Chart.js ile grafik oluşturma
        const ctx = document.getElementById('stockChart').getContext('2d');
        // Eğer önceki grafik varsa sil
        if (window.stockChartInstance) {
            window.stockChartInstance.destroy();
        }

        const datasets = [];
        Object.keys(chartData).forEach(symbol => {
            datasets.push({
                label: `${symbol} RSI`,
                data: chartData[symbol].rsi,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: true,
            });
            datasets.push({
                label: `${symbol} Duygu Skoru`,
                data: chartData[symbol].sentiment,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: true,
            });
        });

        window.stockChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: result.analysis.length > 0 ? result.analysis.map(pair => pair.date) : [],
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Tarih'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Değerler'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Önerileri görüntüleme hatası:', error);
        alert('Önerileri görüntüleme hatası: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Finansal Analiz Platformu yüklendi.');

    // Kayıt ve Giriş Butonlarına Event Listener Ekleme
    const signUpButton = document.getElementById('sign-up');
    const signInButton = document.getElementById('sign-in');
    const authForms = document.getElementById('auth-forms');
    const signupFormContainer = document.getElementById('signup-form');
    const signinFormContainer = document.getElementById('signin-form');
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            console.log('Kayıt Ol Butonuna Tıklandı.');
            authForms.style.display = 'flex'; // Flex for centering
            signupFormContainer.style.display = 'block';
            signinFormContainer.style.display = 'none';
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            console.log('Giriş Yap Butonuna Tıklandı.');
            authForms.style.display = 'flex'; // Flex for centering
            signinFormContainer.style.display = 'block';
            signupFormContainer.style.display = 'none';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Sayfa yenilenmesini engelle
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            signUp(email, password);
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Sayfa yenilenmesini engelle
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;
            signIn(email, password);
        });
    }

    // Abonelik butonlarına event listener ekleme
    document.querySelectorAll('.package .btn').forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.parentElement.querySelector('h3').innerText;
            let planId;

            switch (planName) {
                case 'Basic':
                    planId = 1;
                    break;
                case 'Silver':
                    planId = 2;
                    break;
                case 'Platinum':
                    planId = 3;
                    break;
                default:
                    console.error('Bilinmeyen Abonelik Paketi');
            }

            subscribeUser(planId);
        });
    });

    // Çarpı Butonlarına Event Listener Ekleme
    const closeSignupButton = document.getElementById('close-signup');
    const closeSigninButton = document.getElementById('close-signin');

    if (closeSignupButton) {
        closeSignupButton.addEventListener('click', () => {
            authForms.style.display = 'none';
            signupFormContainer.style.display = 'none';
        });
    }

    if (closeSigninButton) {
        closeSigninButton.addEventListener('click', () => {
            authForms.style.display = 'none';
            signinFormContainer.style.display = 'none';
        });
    }

    // Market Dropdown Event Listener
    const marketDropdown = document.getElementById('market-dropdown');
    marketDropdown.addEventListener('change', () => {
        const selectedMarket = marketDropdown.value;
        if (selectedMarket) {
            displayRecommendations(selectedMarket);
        } else {
            // Clear recommendations and chart
            const recommendationsDiv = document.getElementById('recommendations');
            recommendationsDiv.innerHTML = '';
            if (window.stockChartInstance) {
                window.stockChartInstance.destroy();
            }
        }
    });
});
