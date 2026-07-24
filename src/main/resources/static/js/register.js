function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const nameErr = document.getElementById("nameError");
    const emailErr = document.getElementById("emailError");
    const pwdErr = document.getElementById("pwdError");
    const successSpan = document.getElementById("success");
    const loginError = document.getElementById("loginError");
    // Error ဟောင်းများကို ဖျောက်ထားခြင်း
    loginError.style.display = "none"; 
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
    event.preventDefault(); // Page reload ဖြစ်ခြင်းကို တားဆီးခြင်း

    const loginError = document.getElementById("loginError");
    loginError.style.display = "none"; // Error ဟောင်းကို ဖျောက်ထားခြင်း

    const loginData = {
        loginEmail: document.getElementById("loginEmail").value,
        loginPass: document.getElementById("loginPass").value
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Login အောင်မြင်ပါက Home/Dashboard Page သို့ ခေါ်ဆောင်သွားမည်
            window.location.href = data.redirectUrl || "/home";
        } else {
            // Login မှားယွင်းပါက Page Reload မဖြစ်ဘဲ Error တန်းပြမည်
            loginError.innerText = data.message || "Invalid Email or Password!";
            loginError.style.display = "block";
        }

    } catch (err) {
        console.error("Login Error:", err);
        loginError.innerText = "Server ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်။";
        loginError.style.display = "block";
    }
}
