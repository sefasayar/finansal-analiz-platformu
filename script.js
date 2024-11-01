// script.js

// Supabase bağlantısı
const supabaseUrl = 'https://neijkzbyyqtwpmsvymip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWpremJ5eXF0d3Btc3Z5bWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NjY2NjAsImV4cCI6MjA0NjA0MjY2MH0.JiDT3kT_Ror6-AWFKTo9JJBQUC_ZQTPXOYJNpBlaaxQ';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase Client Oluşturuldu:', supabase);

// Kullanıcı Kayıt Olma Fonksiyonu
async function signUp(email, password) {
    console.log('Kayıt Fonksiyonu Çalıştırılıyor...');
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
    console.log('Giriş Fonksiyonu Çalıştırılıyor...');
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

// Abonelik Satın Alma Fonksiyonu
async function subscribeUser(planId) {
    const user = supabase.auth.user();

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

        const data = await response.json();

        if (response.ok) {
            console.log('Abonelik Başarıyla Alındı:', data);
            alert('Abonelik Başarıyla Alındı!');
        } else {
            console.error('Abonelik Satın Alma Hatası:', data.message);
            alert('Abonelik Satın Alma Hatası: ' + data.message);
        }
    } catch (error) {
        console.error('Ağ Hatası:', error.message);
        alert('Ağ Hatası: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Finansal Analiz Platformu yüklendi.');

    // Kayıt ve Giriş Butonlarına Event Listener Ekleme
    const signUpButton = document.getElementById('sign-up');
    const signInButton = document.getElementById('sign-in');
    const authForms = document.getElementById('auth-forms');
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            console.log('Kayıt Ol Butonuna Tıklandı.');
            authForms.style.display = 'block';
            signupForm.style.display = 'block';
            signinForm.style.display = 'none';
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            console.log('Giriş Yap Butonuna Tıklandı.');
            authForms.style.display = 'block';
            signinForm.style.display = 'block';
            signupForm.style.display = 'none';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            signUp(email, password);
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
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
});
