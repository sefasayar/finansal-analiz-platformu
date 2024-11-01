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

// Güçlü Al ve Güçlü Sat Önerilerini Görselleştirme Fonksiyonu
async function displayRecommendations(symbol) {
    try {
        // Serverless fonksiyonunu çağırarak analiz verilerini çekme
        const response = await fetch(`/api/analyzeMarket?symbol=${symbol}`, {
            method: 'GET',
        });

        const result = await response.json();
        if (!response.ok) {
            alert('Veri çekme hatası: ' + result.message);
            return;
        }

        console.log('API Yanıtı:', result);

        // Recommendations Container'ını temizle
        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = '';

        // Eğer "Strong Buy" veya "Strong Sell" önerisi varsa göster
        if (result.recommendation === 'Strong Buy' || result.recommendation === 'Strong Sell') {
            const recommendationCard = document.createElement('div');
            recommendationCard.classList.add('recommendation-card');

            if (result.recommendation === 'Strong Buy') {
                recommendationCard.classList.add('strong-buy');
            } else if (result.recommendation === 'Strong Sell') {
                recommendationCard.classList.add('strong-sell');
            }

            recommendationCard.innerHTML = `
                <h3>${result.recommendation} Önerisi</h3>
                <p>Hisse Senedi: ${result.symbol}</p>
                <p>RSI: ${result.rsi.toFixed(2)}</p>
                <p>Duygu Skoru: ${result.sentiment_score.toFixed(2)}</p>
            `;

            recommendationsDiv.appendChild(recommendationCard);
        } else {
            recommendationsDiv.innerHTML = '<p>Şu anda güçlü al veya güçlü sat önerisi yok.</p>';
        }

        // Supabase'ten teknik analiz verilerini çekme
        const { data: stockData, error: stockError } = await supabaseClient
            .from('stocks')
            .select('*')
            .eq('symbol', symbol)
            .single();

        if (stockError) {
            throw stockError;
        }

        const { data: analysisList, error: analysisError } = await supabaseClient
            .from('stock_analysis')
            .select('*')
            .eq('stock_id', stockData.id)
            .order('date', { ascending: true });

        if (analysisError) {
            throw analysisError;
        }

        if (analysisList.length === 0) {
            alert('Analiz verisi bulunamadı.');
            return;
        }

        // RSI ve diğer verileri grafiğe hazırlama
        const dates = analysisList.map(item => item.date);
        const rsiValues = analysisList.map(item => item.rsi);
        const sentimentScores = analysisList.map(item => item.sentiment_score);

        // Chart.js ile grafik oluşturma
        const ctx = document.getElementById('stockChart').getContext('2d');
        // Eğer önceki grafik varsa sil
        if (window.stockChartInstance) {
            window.stockChartInstance.destroy();
        }
        window.stockChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'RSI Değerleri',
                        data: rsiValues,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: true,
                    },
                    {
                        label: 'Duygu Skoru',
                        data: sentimentScores,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        fill: true,
                    }
                ]
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
        const selectedSymbol = marketDropdown.value;
        if (selectedSymbol) {
            displayRecommendations(selectedSymbol);
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
