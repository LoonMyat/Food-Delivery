let stompClient = null;
let riderId = document.querySelector("meta[name='rider-id']").getAttribute("content");
// Connect Real-time WebSocket 
function connectWebSocket() {
    // if (!riderId) {
    //     console.warn("No Rider ID provided for WebSocket connection.");
    //     return;
    // }

    const socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log("Connected to WebSocket for Rider ID " + riderId + ": " + frame);

        stompClient.subscribe('/topic/rider/' + riderId + '/orders', function (message) {
            const data = JSON.parse(message.body);
            const orderId = data.orderId || data.id;
            if (data.status === "PREPARING") {
                showRealtimeToast();
                playNotiSound();
                triggerNewNotification();
            }



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

// Create Real-time / Active Order Card
function renderNewOrderCard(data) {
    const notiContainer = document.getElementById("noti-container") || document.getElementById("orders-container");
    if (!notiContainer) return;

    const orderId = data.orderId || data.id;

    // remove card when delivered
    if (data.status === "DELIVERED") {
        const existingCard = document.getElementById("assigned-order-" + orderId);
        if (existingCard) existingCard.remove();
        return;
    }

    let cardElement = document.getElementById("assigned-order-" + orderId);


    const cardContent = `
        <div class="card-body">
            <p><strong>Order ID: </strong>#${String(orderId).padStart(3, '0')}</p>
            <p><strong>Customer Name:</strong> ${data.cusName || 'Customer'}</p>
            <p><strong>Phone:</strong> 
                <a href="tel:${data.phone}" style="color: inherit; text-decoration: none;">
                    ${data.phone}
                </a>
            </p>
            <p><strong>Total amount:</strong> ${Number(data.totalAmount || 0).toLocaleString()} MMK</p>
            <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">${data.status || 'ACCEPTED'}</span></p>

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



function deliverOrder(orderId) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/deliver-order", {}, JSON.stringify({ orderId: orderId }));

        const cardElem = document.getElementById("assigned-order-" + orderId);
        if (cardElem) cardElem.remove();
    } else {
        alert("WebSocket connection error!");
    }
}

function viewOrderOnMap(orderId) {
    window.location.href = "/rider/map/" + orderId;
}

function goToPage(page) {
    if (page === '/rider/notifications/' + riderId) {
        localStorage.removeItem('hasUnreadNoti');
        const notiDot = document.getElementById('notiDot');
        if (notiDot) {
            notiDot.style.display = 'none';
        }
    }
    window.location.href = page;
}

function showRealtimeToast() {
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

window.onload = function () {

    connectWebSocket();
};