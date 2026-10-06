function goToPage(page) {
    if (page === '/admin/notification') {
        localStorage.removeItem('hasUnreadNoti');
        const notiDot = document.getElementById('notiDot');
        if (notiDot) {
            notiDot.style.display = 'none';
        }
    }
    window.location.href = page;
}

const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function (frame) {
    // WebSocket ကနေ Message ရောက်လာသည့်အခါ အလုပ်လုပ်မည်
    stompClient.subscribe('/topic/admin/orders', function (notification) {

        // Server က ပို့လိုက်သော Order Data ကို ယူခြင်း
        const order = JSON.parse(notification.body);

        // ၁။ Toast Box ထဲမှာ စာသားနှင့် တန်ဖိုး သွားထည့်ခြင်း
        showRealtimeToast(order);

        // ၂။ Noti အသံပေးခြင်း
        playNotiSound();

        //show noti-dot
        triggerNewNotification();
    });
});

function showRealtimeToast(order) {
    const toastHtml = `
        <div class="custom-toast" style="position: fixed; top: 20px; background: #FFF8E7; color: #750608; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 9999;">
            <div style="font-weight: bold; font-size: 16px;">🔔 New order arrive!</div>
        </div>
    `;

    // Pop-up noti
    document.body.insertAdjacentHTML('beforeend', toastHtml);

    // remove after 10 secs
    setTimeout(() => {
        const toast = document.querySelector('.custom-toast');
        if (toast) toast.remove();
    }, 10000);
}

function playNotiSound() {
    const audio = new Audio('/audio/notification.wav');
    audio.play().catch(e => console.log("Audio play constraint:", e));
}

function triggerNewNotification() {
    const notiDot = document.getElementById('notiDot');
    if (notiDot) {
        notiDot.style.display = 'inline-block'; // အနီရောင်အစက် ဖော်ပြမည်
    }

    // Refresh လုပ်ရင်လည်း မပျောက်သွားအောင် LocalStorage ထဲ မှတ်ထားမည်
    localStorage.setItem('hasUnreadNoti', 'true');
}

// show noti-dot even page refreshed
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('hasUnreadNoti') === 'true') {
        const notiDot = document.getElementById('notiDot');
        if (notiDot) notiDot.style.display = 'inline-block';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById("modal");
    const editForm = document.getElementById("edit-form");
    const nameInput = document.getElementById("modal-fname");
    const priceInput = document.getElementById("modal-fprice");
    const close = document.getElementById("close-box");

    close.addEventListener("click", function () {
        if (modal) {
            modal.style.display = "none";
        }
    });

    const editBtns = document.querySelectorAll(".edit-btn");
    let currentMenuId = null;
    editBtns.forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            
            // ID နဲ့ Data များကို သိမ်းဆည်းခြင်း
            currentMenuId = this.getAttribute("data-id");
            const name = this.getAttribute("data-name");
            const price = this.getAttribute("data-price");

            // Input တွေထဲ ထည့်ပေးခြင်း
            if (nameInput) nameInput.value = name;
            if (priceInput) priceInput.value = price;
            
            // Modal ကို ပေါ်လာစေရန်
            if (modal) {
                modal.style.display = "block";
            }
        });
    });

    if (editForm) {
        editForm.addEventListener("submit", function (e) {
            e.preventDefault(); 

            const url = `/admin/edit-menu/${currentMenuId}`;
            const formData = new FormData(editForm);

            
            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    if (modal) modal.style.display = "none";

                    location.reload(); 
                } else {
                    alert("Try again!");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error when connecting server.");
            });
        });
    }


    const deleteBtns = document.querySelectorAll(".delete-btn");

    deleteBtns.forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();

            if (!confirm("Are you sure to delete this item?")) {
                return;
            }

            const menuId = this.getAttribute("data-id");
            const url = `/admin/delete-menu/${menuId}`;

            const token = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
            const headerName = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
            
            const headers = {};
            if (token && headerName) {
                headers[headerName] = token;
            }

            fetch(url, {
                method: 'POST',
                headers: headers
            })
            .then(response => {
                if (response.ok) {
                    location.reload(); 
                } else {
                    alert("Delete failed!");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error when connecting server.");
            });
        });
    });

    window.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    })
});
