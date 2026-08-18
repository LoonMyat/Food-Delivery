let stompClient = null;
let riderId = document.querySelector("meta[name='rider-id']").getAttribute("content");
// 💡 1. Real-time WebSocket ချိတ်ဆက်ခြင်း
function connectWebSocket() {
    // if (!riderId) {
    //     console.warn("No Rider ID provided for WebSocket connection.");
    //     return;
    // }

    const socket = new SockJS("/ws"); 
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log("Connected to WebSocket for Rider ID " + riderId + ": " + frame);

        // သက်ဆိုင်ရာ Rider အတွက် Order Topic သို့ Subscribe လုပ်ခြင်း
        stompClient.subscribe('/topic/rider/' + riderId + '/orders', function (message) {
            const data = JSON.parse(message.body);
            const orderId = data.orderId || data.id;

            // Admin ဘက်မှ Ready to pick up နှိပ်လိုက်ပါက Alert Box ကျမည်
            if (data.alert || data.status === "READY_FOR_PICKUP") {
                alert("🔔 Order #" + orderId + " is Ready for Pick Up!");
            }

            renderNewOrderCard(data);
        });
    }, function (error) {
        console.error("WebSocket Error: ", error);
        setTimeout(() => connectWebSocket(riderId), 5000);
    });
}

// 💡 2. Real-time / Active Order Card ဖန်တီးပေးမည့် Function
function renderNewOrderCard(data) {
    const notiContainer = document.getElementById("noti-container") || document.getElementById("orders-container");
    if (!notiContainer) return;

    const orderId = data.orderId || data.id;

    // Status က DELIVERED ဖြစ်သွားပါက Card ဖျက်မည်
    if (data.status === "DELIVERED") {
        const existingCard = document.getElementById("assigned-order-" + orderId);
        if (existingCard) existingCard.remove();
        return;
    }

    const customerPhone = data.phone ? data.phone : "N/A";
    let cardElement = document.getElementById("assigned-order-" + orderId);

    // Status ပေါ်မူတည်၍ Button များ Dynamic ပြောင်းပေးခြင်း
    let actionButtons = '';
    if (data.status === "READY_FOR_PICKUP" || data.status === "ACCEPTED" || data.status === "PREPARING") {
        actionButtons = `<button class="btn-pickup" onclick="pickupOrder(${orderId})">📦 Picked Up</button>`;
    } else if (data.status === "DELIVERING") {
        actionButtons = `<button class="btn-deliver" onclick="deliverOrder(${orderId})">✅ Delivered</button>`;
    }

    const cardContent = `
        <div class="card-body">
            <p><strong>Order ID: </strong>#${String(orderId).padStart(3, '0')}</p>
            <p><strong>Customer Name:</strong> ${data.cusName || 'Customer'}</p>
            <p><strong>Phone:</strong> 
                <a href="tel:${customerPhone}" style="color: inherit; text-decoration: none;">
                    ${customerPhone}
                </a>
            </p>
            <p><strong>Total amount:</strong> ${Number(data.totalAmount || 0).toLocaleString()} MMK</p>
            <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">${data.status || 'ACCEPTED'}</span></p>

            ${actionButtons}
            <button class="btn-map" onclick="viewOrderOnMap('${orderId}')">🗺️ View Map</button>
        </div>
    `;

    if (cardElement) {
        cardElement.innerHTML = cardContent;
    } else {
        cardElement = document.createElement("div");
        cardElement.className = "delivery-card";
        cardElement.id = "assigned-order-" + orderId;
        cardElement.innerHTML = cardContent;
        notiContainer.prepend(cardElement);
    }
}

// 💡 3. Rider က Picked Up နှိပ်ချိန် ➔ Status: DELIVERING (Customer & Admin ထံ ပို့မည်)
function pickupOrder(orderId) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/pickup-order", {}, JSON.stringify({ orderId: orderId }));
    } else {
        alert("WebSocket connection error!");
    }
}

// 💡 4. Rider က Delivered နှိပ်ချိန် ➔ Status: DELIVERED (Card ပျောက်သွားမည်)
function deliverOrder(orderId) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/deliver-order", {}, JSON.stringify({ orderId: orderId }));
        
        const cardElem = document.getElementById("assigned-order-" + orderId);
        if (cardElem) cardElem.remove();
    } else {
        alert("WebSocket connection error!");
    }
}

// 💡 5. Map လမ်းကြောင်းသို့ သွားရန် Function
function viewOrderOnMap(orderId) {
    window.location.href = "/rider/map/" + orderId;
}

function goToPage(page) {
    window.location.href = page;
}

// 💡 6. Page Start Initialization
window.onload = function () {
        connectWebSocket();
};