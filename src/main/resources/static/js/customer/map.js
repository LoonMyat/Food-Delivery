// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================
let tempOrderId = null;
let orderId = null;
let stompClient = null;

let statusSubscription = null;
let trackSubscription = null;

const currentOrder = JSON.parse(localStorage.getItem("currentOrder"));
if (currentOrder) {
    const foodPriceElem = document.getElementById("foodPrice");
    const totalCountElem = document.getElementById("totalCount");
    if (foodPriceElem) foodPriceElem.innerHTML = `${currentOrder.foodPrice} MMK`;
    if (totalCountElem) totalCountElem.innerHTML = `${currentOrder.totalCount}`;
}

// Restaurant Coordinates
const restLat = 22.029440;
const restLng = 96.101202;

let destLat = 0, destLng = 0;
let currentRiderLat = restLat, currentRiderLng = restLng;

let map, destMarker, riderMarker, restaurantMarker, routingControl = null;

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

        // DB မှ Order Response ပြန်ကျလာတာကို စောင့်ကြည့်ခြင်း
        stompClient.subscribe('/topic/order-response', function (response) {
            const savedOrder = JSON.parse(response.body);

            if (tempOrderId && savedOrder.tempOrderId === tempOrderId) {
                orderId = savedOrder.id; // DB Order ID အမှန်
                console.log("✅ Order matched! Assigned DB Order ID:", orderId);

                let displayElem = document.getElementById("displayOrderId");
                if (displayElem) displayElem.innerText = "#" + orderId;

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
        setTimeout(connectWebSocket, 5000);
    });
}


// ==========================================
// 3. LISTEN TO ORDER STATUS UPDATES
// ==========================================
function listenOrderStatus(assignedOrderId) {
    console.log("Subscribing to status updates for Order:", assignedOrderId);

    if (statusSubscription) statusSubscription.unsubscribe();

    statusSubscription = stompClient.subscribe('/topic/customer/' + assignedOrderId, function (response) {
        const data = JSON.parse(response.body);
        console.log("Received Status Update:", data);

        let statusBtn = document.getElementById("statusBtn");
        if (statusBtn && data.status) {
            const currentStatus = data.status.toUpperCase();

            if (currentStatus === "PREPARING" || currentStatus === "ACCEPTED") {
                statusBtn.innerText = "Preparing meals";
                statusBtn.style.backgroundColor = "#ff9800"; // Orange
                statusBtn.disabled = true;
            }
            else if (currentStatus === "READY_FOR_PICKUP" || currentStatus === "READY_TO_PICKUP" || currentStatus === "READY") {
                statusBtn.innerText = "Ready for Pick Up";
                statusBtn.style.backgroundColor = "#28a745"; // Green
                statusBtn.disabled = true;
            }
            // 💡 1. Rider ပစ္စည်းယူပြီး ထွက်လာချိန်
            else if (currentStatus === "ON_THE_WAY") {
                statusBtn.innerText = "On the Way 🛵";
                statusBtn.style.backgroundColor = "#17a2b8"; // Blue
                statusBtn.disabled = true;
            }
            // 💡 2. ပို့ဆောင်ပြီးစီးချိန်
            else if (currentStatus === "DELIVERED") {
                statusBtn.innerText = "Delivered 🎉";
                statusBtn.style.backgroundColor = "#6c757d";

                const confirmDelivery = confirm("Order arrived successfully!");
                if (confirmDelivery) {
                    localStorage.removeItem("currentOrder");
                    window.location.href = "/customer/home";
                }

            }
            else if (currentStatus === "REJECTED") {
                alert("Sorry! Your order has been rejected.");

                statusBtn.innerText = "Confirm Order";
                statusBtn.disabled = false;
                statusBtn.style.backgroundColor = "";

                tempOrderId = null;
                orderId = null;

                enableMapClick();
            }
        }
    });
}


// ==========================================
// 4. TRACK RIDER LOCATION & SEND CUSTOMER HOME
// ==========================================
function trackRiderLocation(assignedOrderId) {
    if (trackSubscription) trackSubscription.unsubscribe();

    trackSubscription = stompClient.subscribe('/topic/track/' + assignedOrderId, function (response) {
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

    enableMapClick();
}

function onMapClick(e) {
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
}

function enableMapClick() {
    if (map) {
        map.off('click', onMapClick);
        map.on('click', onMapClick);
    }
}

let deliFee = 0;
function calculateTotalAmount(distance, amount) {
    let total = 0;
    if (distance <= 5) deliFee = 1000;
    else if (distance <= 10) deliFee = 2000;
    else if (distance <= 20) deliFee = 3000;
    else deliFee = 3500;

    total = deliFee + amount;
    return total;
}

let total = 0;

function updateRouteAndETA(riderLat, riderLng) {
    currentRiderLat = riderLat;
    currentRiderLng = riderLng;

    if (riderMarker) riderMarker.setLatLng([riderLat, riderLng]);
    if (destLat === 0 || destLng === 0) return;

    if (!routingControl) {
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

            
            if (currentOrder && currentOrder.foodPrice) {
                total = calculateTotalAmount(distanceKm, currentOrder.foodPrice);
                const deliFeeElem = document.getElementById("deliveryFee");
                if (deliFeeElem) deliFeeElem.innerHTML = `${deliFee} MMK`;
            }

            riderMarker.bindPopup(`<b>Rider (${durationMin} mins away)</b>`).openPopup();

            const etaElem = document.getElementById("eta");
            const distanceElem = document.getElementById("distance");
            const totalAmountElem = document.getElementById("totalAmount");

            if (etaElem) {
                etaElem.innerText = (durationMin >= 4) ? `${durationMin * 2} mins` : `${durationMin} mins`;
            }
            if (distanceElem) {
                distanceElem.innerText = `${distanceKm} km`;
            }
            if (totalAmountElem) {
                totalAmountElem.innerText = `${total.toLocaleString()} MMK`;
            }
        });
    } else {
        routingControl.setWaypoints([
            L.latLng(riderLat, riderLng),
            L.latLng(destLat, destLng)
        ]);
    }
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

            tempOrderId = "TEMP_" + Date.now();

            this.innerText = "Pending";
            if (map) map.off('click', onMapClick);

            const phoneElem = document.getElementById("phone");
            let phoneNumber = phoneElem.value.trim();

            if (!phoneNumber) {
                alert("Please enter your phone number");
                return;
            }

            const nameElem = document.getElementById("currentName");
            let currentName = nameElem ? nameElem.value : "Customer";

            let orderDetails = {
                tempOrderId: tempOrderId,
                cusName: currentName,
                phone: phoneNumber,
                latitude: destLat,
                longitude: destLng,
                totalAmount: total
            };

            stompClient.send("/app/new-order", {}, JSON.stringify(orderDetails));
        });
    }
};