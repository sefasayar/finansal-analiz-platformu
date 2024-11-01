// script.js

// script.js

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Kullanıcı Kayıt Olma Fonksiyonu
async function signUp(email, password) {
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Kayıt Hatası:', error.message);
        alert('Kayıt Hatası: ' + error.message);
    } else {
        console.log('Kullanıcı Kaydedildi:', user);
        alert('Kayıt Başarılı! Lütfen e-posta adresinizi doğrulayın.');
    }
}

// Kullanıcı Giriş Yapma Fonksiyonu
async function signIn(email, password) {
    const { user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Giriş Hatası:', error.message);
        alert('Giriş Hatası: ' + error.message);
    } else {
        console.log('Kullanıcı Giriş Yaptı:', user);
        alert('Giriş Başarılı!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Finansal Analiz Platformu yüklendi.');

    // Kayıt ve Giriş Butonlarına Event Listener Ekleme
    const signUpButton = document.getElementById('sign-up');
    const signInButton = document.getElementById('sign-in');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            const email = prompt('E-posta adresinizi girin:');
            const password = prompt('Şifrenizi girin:');
            if (email && password) {
                signUp(email, password);
            } else {
                alert('Lütfen geçerli bir e-posta ve şifre girin.');
            }
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            const email = prompt('E-posta adresinizi girin:');
            const password = prompt('Şifrenizi girin:');
            if (email && password) {
                signIn(email, password);
            } else {
                alert('Lütfen geçerli bir e-posta ve şifre girin.');
            }
        });
    }
});

// script.js

// Abonelik Satın Alma Fonksiyonu
async function subscribeUser(planId) {
    const user = supabase.auth.user();

    if (!user) {
        console.error('Kullanıcı giriş yapmamış.');
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

        const data = await response.json();

        if (response.ok) {
            console.log('Abonelik Başarıyla Alındı:', data);
        } else {
            console.error('Abonelik Satın Alma Hatası:', data.message);
        }
    } catch (error) {
        console.error('Ağ Hatası:', error.message);
    }
}

// Örnek: Abonelik butonlarına event listener ekleme
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
