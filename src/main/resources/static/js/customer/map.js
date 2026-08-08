// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================
let tempOrderId = null; // Client ဘက်မှ ခေတ္တထုတ်ယူမည့် Temp ID
let orderId = null;     // DB မှ ကျလာမည့် Order ID အမှန်
let stompClient = null;

// Restaurant Coordinates (ဆိုင် တည်နေရာ)
const restLat = 22.029440;
const restLng = 96.101202;

let destLat = 0, destLng = 0;
let currentRiderLat = restLat, currentRiderLng = restLng;

let map, destMarker, riderMarker, restaurantMarker, routingControl = null;

// Dynamic Server IP Setup
const SERVER_IP = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "localhost"
    : "172.20.10.4";


// ==========================================
// 2. WEBSOCKET CONNECTION
// ==========================================
function connectWebSocket() {
    const socket = new SockJS(`http://${SERVER_IP}:8080/ws`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log("Connected to WebSocket: " + frame);

        const statusElem = document.getElementById("connection-status");
        if (statusElem) {
            statusElem.innerText = "Connected";
            statusElem.style.color = "green";
        }

        // 💡 DB မှ Order Response ပြန်ကျလာတာကို စောင့်ကြည့်ခြင်း
        stompClient.subscribe('/topic/order-response', function (response) {
            const savedOrder = JSON.parse(response.body);

            // 💡 tempOrderId တူမတူ စစ်ဆေးခြင်း
            if (tempOrderId && savedOrder.tempOrderId === tempOrderId) {
                orderId = savedOrder.id; // DB Order ID အမှန်ကို ရရှိပါပြီ (e.g. 102)
                console.log("✅ Order matched! Assigned DB Order ID:", orderId);

                // UI ပေါ်တွင် Order ID ပြသပေးခြင်း
                let displayElem = document.getElementById("displayOrderId");
                if (displayElem) displayElem.innerText = "#" + orderId;

                // 💡 ID ရသည်နှင့် အောက်ပါ Function များကို စတင်ခေါ်ယူမည်
                trackRiderLocation(orderId);
                listenOrderStatus(orderId);
                sendCustomerHomeToBackend(destLat, destLng);
            }
        });

    }, function (error) {
        console.error("WebSocket Connection Error: ", error);
        const statusElem = document.getElementById("connection-status");
        if (statusElem) {
            statusElem.innerText = "Connection Failed";
            statusElem.style.color = "red";
        }
        // ၅ စက္ကန့်အကြာတွင် ပြန်လည် ချိတ်ဆက်မည်
        setTimeout(connectWebSocket, 5000);
    });
}


// ==========================================
// 3. LISTEN TO ORDER STATUS UPDATES (ACCEPT/PREPARING/READY)
// ==========================================
function listenOrderStatus(assignedOrderId) {
    console.log("Subscribing to status updates for Order:", assignedOrderId);

    stompClient.subscribe('/topic/order-status/' + assignedOrderId, function (response) {
        const data = JSON.parse(response.body);
        console.log("Received Status Update:", data);

        let statusBtn = document.getElementById("statusBtn");
        if (statusBtn && data.status) {
            const currentStatus = data.status.toUpperCase();

            if (currentStatus === "PREPARING") {
                statusBtn.innerText = "Preparing meals";
                statusBtn.style.backgroundColor = "#ff9800"; // Orange
            } 
            else if (currentStatus === "READY") {
                statusBtn.innerText = "Ready for Pick Up";
                statusBtn.style.backgroundColor = "#28a745"; // Green
            } 
            // 💡 Restaurant က Reject လုပ်လိုက်လျှင် အောက်ပါအတိုင်း အလုပ်လုပ်မည်
            else if (currentStatus === "REJECTED") {
                // ၁။ Alert Noti ပြပေးမည်
                alert("Sorry! Your order has been rejected.");

                // ၂။ Button ကို "Confirm Order" ဟု မူလအတိုင်း ပြန်ပြောင်းပြီး ပြန်နှိပ်လို့ရအောင် လုပ်မည်
                statusBtn.innerText = "Confirm Order"; 
                statusBtn.disabled = false;             // Button နှိပ်လို့ရအောင် ပြန်ဖွင့်ပေးမည်
                statusBtn.style.backgroundColor = "";  // မူလ Button အရောင်အတိုင်း ပြန်ပြောင်းမည်

                // ၃။ ID များကို Reset ပြန်လုပ်ပေးမည်
                tempOrderId = null;
                orderId = null;

                // ၄။ Map ပေါ်တွင် Pin ပြန်ထောက်လို့ရအောင် Event ပြန်ဖွင့်ပေးမည်
                if (map) {
                    map.on('click', function (e) {
                        destLat = e.latlng.lat;
                        destLng = e.latlng.lng;

                        if (destMarker) {
                            destMarker.setLatLng([destLat, destLng]);
                        } else {
                            destMarker = L.marker([destLat, destLng]).addTo(map);
                        }
                        destMarker.bindPopup("<b>Your Home</b>").openPopup();
                        updateRouteAndETA(currentRiderLat, currentRiderLng);
                    });
                }
            }
        }
    });
}


// ==========================================
// 4. TRACK RIDER LOCATION & SEND CUSTOMER HOME
// ==========================================
function trackRiderLocation(assignedOrderId) {
    stompClient.subscribe('/topic/track/' + assignedOrderId, function (response) {
        const riderLocation = JSON.parse(response.body);
        updateRouteAndETA(riderLocation.latitude, riderLocation.longitude);
    });
}

function sendCustomerHomeToBackend(lat, lng) {
    if (stompClient && stompClient.connected && orderId) {
        stompClient.send("/app/customer-home/" + orderId, {}, JSON.stringify({
            latitude: lat,
            longitude: lng
        }));
        console.log("Customer home sent to backend for Order:", orderId);
    }
}


// ==========================================
// 5. LEAFLET MAP & ROUTING LOGIC
// ==========================================
function initMap() {
    map = L.map('map').setView([restLat, restLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    restaurantMarker = L.marker([restLat, restLng], { icon: redIcon }).addTo(map).bindPopup("<b>Restaurant</b>");
    riderMarker = L.marker([restLat, restLng]).addTo(map).bindPopup("Rider (At Store)").openPopup();

    // Customer မြေပုံပေါ် Pin ထောက်သည့် Event
    map.on('click', function (e) {
        destLat = e.latlng.lat;
        destLng = e.latlng.lng;

        if (destMarker) {
            destMarker.setLatLng([destLat, destLng]);
        } else {
            destMarker = L.marker([destLat, destLng]).addTo(map);
        }
        destMarker.bindPopup("<b>Your Home</b>").openPopup();

        if (orderId) {
            sendCustomerHomeToBackend(destLat, destLng);
        }
        updateRouteAndETA(currentRiderLat, currentRiderLng);
    });
}

function updateRouteAndETA(riderLat, riderLng) {
    currentRiderLat = riderLat;
    currentRiderLng = riderLng;

    if (riderMarker) riderMarker.setLatLng([riderLat, riderLng]);
    if (destLat === 0 || destLng === 0) return;

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(riderLat, riderLng), L.latLng(destLat, destLng)],
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        lineOptions: { styles: [{ color: 'blue', opacity: 0.8, weight: 6 }] },
        addWaypoints: false,
        draggableWaypoints: false,
        createMarker: function () { return null; }
    }).addTo(map);

    routingControl.on('routesfound', function (e) {
        const summary = e.routes[0].summary;
        const distanceKm = (summary.totalDistance / 1000).toFixed(2);
        const durationMin = Math.round(summary.totalTime / 60);

        riderMarker.bindPopup(`<b>Rider (${durationMin} mins away)</b>`).openPopup();
        const etaElem = document.getElementById("eta-text");
        if (etaElem) {
            etaElem.innerText = `အကွာအဝေး: ${distanceKm} Km | ရောက်ရန်ကြာချိန်: ${durationMin} mins`;
        }
    });
}


// ==========================================
// 6. ORDER SUBMISSION & INITIALIZATION
// ==========================================
window.onload = function () {
    initMap();
    connectWebSocket();

    const statusBtn = document.getElementById("statusBtn");
    if (statusBtn) {
        statusBtn.addEventListener("click", function () {
            if (!destLat || !destLng || destLat === 0 || destLng === 0) {
                alert("Please pin your location on the map!");
                return;
            }

            // 💡 ချိန်စက်အပေါ်မူတည်ပြီး unique ဖြစ်သော Temp ID ဖန်တီးပေးမည်
            tempOrderId = "TEMP_" + Date.now();

            this.innerText = "Pending";
            // this.disabled = true;
            if (map) map.off('click'); // Pin ပြန်ရွှေ့မရအောင် တားဆီးမည်

            const nameElem = document.getElementById("currentName");
            let currentName = nameElem ? nameElem.value : "Customer";

            let orderDetails = {
                tempOrderId: tempOrderId,
                cusName: currentName,
                latitude: destLat,
                longitude: destLng
            };

            stompClient.send("/app/new-order", {}, JSON.stringify(orderDetails));
        });
    }
};