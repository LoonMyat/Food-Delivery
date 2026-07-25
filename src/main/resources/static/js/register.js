function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const nameErr = document.getElementById("nameError");
    const emailErr = document.getElementById("emailError");
    const pwdErr = document.getElementById("pwdError");
    const successSpan = document.getElementById("success");
    // const loginError = document.getElementById("loginError");
    // Error ဟောင်းများကို ဖျောက်ထားခြင်း
    // loginError.style.display = "none"; 
    nameErr.style.display = "none";
    emailErr.style.display = "none";
    pwdErr.style.display = "none";
    successSpan.style.display = "none";

    if (loginForm.style.display !== "none") {
        // Login ထွက်ပြီး Sign up ဝင်မယ်
        loginForm.classList.add('slide-out');
        setTimeout(() => {
            loginForm.style.display = "none";
            loginForm.classList.remove('slide-out');
            signupForm.style.display = "block";
            signupForm.classList.add('slide-in');
        }, 500);
    } else {
        // Sign up ထွက်ပြီး Login ဝင်မယ်
        signupForm.classList.add('slide-out');
        setTimeout(() => {
            signupForm.style.display = "none";
            signupForm.classList.remove('slide-out');
            loginForm.style.display = "block";
            loginForm.classList.add('slide-in');
        }, 500);
    }
}

// Fetch API Handle Register
async function handleRegister(event) {
    event.preventDefault();

    // 1. Error Message ဟောင်းများကို ရှင်းထုတ်မည်
    const nameErr = document.getElementById("nameError");
    const emailErr = document.getElementById("emailError");
    const pwdErr = document.getElementById("pwdError");
    const successSpan = document.getElementById("success");

    nameErr.style.display = "none";
    emailErr.style.display = "none";
    pwdErr.style.display = "none";
    successSpan.style.display = "none";

    // 2. CSRF Token များ ယူမည်
    const tokenMeta = document.querySelector("meta[name='_csrf']");
    const headerMeta = document.querySelector("meta[name='_csrf_header']");
    
    const headers = { 'Content-Type': 'application/json' };
    if (tokenMeta && headerMeta) {
        headers[headerMeta.getAttribute("content")] = tokenMeta.getAttribute("content");
    }

    const userData = {
        username: document.getElementById("username").value,
        email: document.getElementById("signupEmail").value,
        password: document.getElementById("signupPass").value
    };

    try {
        const response = await fetch('/register', { // <--- သင်၏ Controller Path ကို အမှန်အတိုင်း ထားပါ
            method: 'POST',
            headers: headers,
            body: JSON.stringify(userData)
        });

        // Response status 400 ဖြစ်ဖြစ် 200 ဖြစ်ဖြစ် JSON ကို ဖတ်မည်
        const data = await response.json();
        console.log("Response Data:", data); // Browser Console (F12) မှာ စစ်ရန်

        if (data.success) {
            // Register အောင်မြင်ပါက
            successSpan.innerText = data.message || "Registration Successful!";
            successSpan.style.display = "block";
            document.getElementById("registerForm").reset();

            setTimeout(() => {
                toggleForm();
            }, 1500);
        } else {
            // Error များရှိပါက HTML တွင် ပြသမည်
            if (data.nameError) {
                nameErr.innerText = data.nameError;
                nameErr.style.display = "block";
            }
            if (data.emailError) {
                emailErr.innerText = data.emailError;
                emailErr.style.display = "block";
            }
            if (data.pwdError) {
                pwdErr.innerText = data.pwdError;
                pwdErr.style.display = "block";
            }
        }
    } catch (err) {
        console.error("Error submitting form:", err);
    }
}

async function handleLogin(event) {
    event.preventDefault(); // Page reload မဖြစ်အောင် တားဆီးထားသည်

    const loginError = document.getElementById("loginError");
    const passwordInput = document.getElementById("loginPass"); // Password Field
    
    loginError.style.display = "none";

    const loginData = {
        loginEmail: document.getElementById("loginEmail").value,
        loginPass: passwordInput.value
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirectUrl || "/home";
        } else {
            // Password မှားသွားပါက Error ပြပြီး Password field ကိုပဲ Clear လုပ်မည်
            loginError.innerText = data.message || "Invalid Email or Password!";
            loginError.style.display = "block";
            
            // Password ကွက်ကိုပဲ ခါထုတ်လိုက်မည် (Email Input ကွက် မပျောက်ပါ)
            passwordInput.value = ""; 
            passwordInput.focus(); // Password ပြန်ရိုက်နိုင်ရန် cursor တန်းတင်ပေးမည်
        }
    } catch (err) {
        console.error("Login Error:", err);
    }
}
