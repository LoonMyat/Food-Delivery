let stompClient = null;

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

// 💡 2. Order Card ဖန်တီးပေးမည့် Reusable Function
function renderOrderCard(order) {
    const notiContainer = document.getElementById("noti");
    if (!notiContainer) return;

    // ရှိပြီးသား Card ဖြစ်ပါက ထပ်မံ မထည့်စေရန် စစ်ဆေးခြင်း
    if (document.getElementById("order-card-" + order.id)) {
        return;
    }

    var info = document.createElement("div");
    info.className = "order-card";
    info.id = "order-card-" + order.id;

    let btnText = "Accept";
    let isDisabled = "";

    // Status အပေါ်မူတည်ပြီး Button စာသား ပြောင်းလဲခြင်း
    if (order.status === "PREPARING") {
        btnText = "Ready to pick up";
        isDisabled = "disabled";
    }

    info.innerHTML = `
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Customer:</strong> ${order.cusName}</p>
        <button onclick="rejectOrder(${order.id}, this)" ${isDisabled} class="rejectBtn">Reject</button>
        <button onclick="acceptOrder(${order.id}, this)" class="statusBtn">${btnText}</button>
    `;

    // အပေါ်ဆုံးတွင် ထည့်သွင်းမည်
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
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/accept-order", {}, JSON.stringify({ orderId: orderId }));

        if (btnElement) {
            btnElement.innerText = "Ready to pick up";
        }
    }
}

// 💡 5. Page ပွင့်သည်နှင့် DB မက်ဆေ့ဂျ်များကို စတင်ခေါ်ယူမည်
window.onload = function() {
    loadActiveOrders(); // DB ထဲမှ အော်ဒါဟောင်းများ ဆွဲယူမည်
    connectWebSocket();  // Real-time အော်ဒါအသစ် နားထောင်မည်
};