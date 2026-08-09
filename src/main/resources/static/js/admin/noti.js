let stompClient = null;

let ridersList = []; // DB ထဲမှ Rider များ သိမ်းရန်

// Page စပွင့်တာနဲ့ Rider List ကို Fetch လုပ်မည်
async function loadRiders() {
    try {
        const response = await fetch('/api/riders');
        ridersList = await response.json();
    } catch (error) {
        console.error("Error loading riders:", error);
    }
}

// 💡 1. DB ထဲမှ ရှိပြီးသား Active Orders များကို Fetch လုပ်ယူမည့် Function
function loadActiveOrders() {
    fetch('/api/orders/active')
        .then(response => response.json())
        .then(orders => {
            const notiContainer = document.getElementById("noti");
            if (notiContainer) {
                notiContainer.innerHTML = ""; // ရှင်းလင်းမည်
            }
            // အော်ဒါများကို တစ်ခုချင်းစီ Card ထုတ်ပေးမည်
            orders.forEach(order => {
                renderOrderCard(order);
            });
        })
        .catch(error => console.error("Error fetching active orders:", error));
}




// Page စတင်ချိန်တွင် ခေါ်ယူမည်
document.addEventListener("DOMContentLoaded", loadRiders);

// 💡 2. Order Card ဖန်တီးပေးမည့် Reusable Function
function renderOrderCard(order) {
    const notiContainer = document.getElementById("noti");
    if (!notiContainer) return;

    if (document.getElementById("order-card-" + order.id)) {
        return;
    }

    var info = document.createElement("div");
    info.className = "order-card";
    info.id = "order-card-" + order.id;

    let btnText = "Accept";
    let isDisabled = "";

    if (order.status === "PREPARING") {
        btnText = "Ready to pick up";
        isDisabled = "disabled";
    }

    // 💡 DB မှ ရလာသော ridersList ကိုသုံးပြီး Option များ ဆောက်ခြင်း
    let riderOptions = `<option value="" disabled selected>Select Rider</option>`;
    
    ridersList.forEach(rider => {
        riderOptions += `<option value="${rider.id}">${rider.name}</option>`;
    });

    info.innerHTML = `
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Customer:</strong> ${order.cusName}</p>
        
        <!-- 💡 ID ကို order.id ပါအောင် ခွဲပေးထားပါသည် -->
        <select name="rider" id="rider-${order.id}" required>
            ${riderOptions}
        </select>
        
        <button onclick="rejectOrder(${order.id}, this)" ${isDisabled} class="rejectBtn">Reject</button>
        <button onclick="acceptOrder(${order.id}, this)" class="statusBtn">${btnText}</button>
    `;

    notiContainer.prepend(info);
}

function rejectOrder(orderId) {
    if (confirm("Are you sure you want to reject this order?")) {
        if (stompClient && stompClient.connected) {
            // Backend သို့ Reject လုပ်ကြောင်း ပို့မည်
            stompClient.send("/app/reject-order", {}, JSON.stringify({ orderId: orderId }));

            // Restaurant UI ဘက်မှ Noti Card ကို ချက်ချင်း ဖျက်ထုတ်မည်
            const cardElem = document.getElementById("order-card-" + orderId);
            if (cardElem) {
                cardElem.remove();
            }
        }
    }
}

// 💡 3. Real-time WebSocket ချိတ်ဆက်ခြင်း
function connectWebSocket() {
    const socket = new SockJS("/ws"); 
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log("Connected: " + frame);

        stompClient.subscribe('/topic/admin/orders', function(message) {
            var order = JSON.parse(message.body);
            // အသစ်ဝင်လာသော WebSocket Order ကို Card အဖြစ် ပြသမည်
            renderOrderCard(order);
        });
    }, function(error) {
        console.error("WebSocket Error: ", error);
    });
}

// 💡 4. Accept Button နှိပ်သည့် Function
function acceptOrder(orderId, btnElement) {
    if (!stompClient || !stompClient.connected) return;

    const currentText = btnElement ? btnElement.innerText.trim() : "";

    // 💡 ၁။ "Accept" ဖြစ်နေလျှင် -> Customer + Rider ဆီ Noti သွားမည်
    if (currentText === "Accept") {
        
        stompClient.send("/app/accept-order", {}, JSON.stringify({ 
            orderId: orderId,
            status: "ACCEPTED" // Backend ကို status ပါ ပို့ပေးမည်
        }));

        if (btnElement) {
            btnElement.innerText = "Ready to pick up";
            btnElement.style.backgroundColor = "#ff9800"; // (Optional) အရောင်ပြောင်းရန်
        }

    } 
    // 💡 ၂။ "Ready to pick up" ဖြစ်နေလျှင် -> Rider ဆီပဲ Noti သွားမည်
    else if (currentText === "Ready to pick up") {
        
        stompClient.send("/app/ready-order", {}, JSON.stringify({ 
            orderId: orderId,
            status: "READY_FOR_PICKUP"
        }));

        if (btnElement) {
            btnElement.innerText = "Picked Up";
            btnElement.disabled = true; // ပြီးသွားပါက Button နှိပ်မရအောင် ပိတ်မည်
        }
    }
}

// 💡 5. Page ပွင့်သည်နှင့် DB မက်ဆေ့ဂျ်များကို စတင်ခေါ်ယူမည်
window.onload = function() {
    loadActiveOrders(); // DB ထဲမှ အော်ဒါဟောင်းများ ဆွဲယူမည်
    connectWebSocket();  // Real-time အော်ဒါအသစ် နားထောင်မည်
};