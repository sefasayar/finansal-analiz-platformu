// script.js

// script.js

// Supabase bağlantısı
<<<<<<< HEAD
const supabaseUrl = 'https://neijkzbyyqtwpmsvymip.supabase.co'; // Supabase URL'nizi buraya ekleyin
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWpremJ5eXF0d3Btc3Z5bWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NjY2NjAsImV4cCI6MjA0NjA0MjY2MH0.JiDT3kT_Ror6-AWFKTo9JJBQUC_ZQTPXOYJNpBlaaxQ'; // Supabase Anon Key'inizi buraya ekleyin
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase Client Oluşturuldu:', supabaseClient);
=======
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabase.createClient(supabaseUrl, supabaseKey);
>>>>>>> ed55db3 (Ortam değişkenleri ve hata bildirimleri eklendi)

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
<<<<<<< HEAD
        console.log('Kullanıcı Kaydedildi:', data.user);
=======
        console.log('Kullanıcı Kaydedildi:', user);
>>>>>>> ed55db3 (Ortam değişkenleri ve hata bildirimleri eklendi)
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
<<<<<<< HEAD
        console.log('Kullanıcı Giriş Yaptı:', data.user);
=======
        console.log('Kullanıcı Giriş Yaptı:', user);
>>>>>>> ed55db3 (Ortam değişkenleri ve hata bildirimleri eklendi)
        alert('Giriş Başarılı!');
    }
}

<<<<<<< HEAD
=======
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

>>>>>>> ed55db3 (Ortam değişkenleri ve hata bildirimleri eklendi)
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