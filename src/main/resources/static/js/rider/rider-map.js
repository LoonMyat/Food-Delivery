// 💡 Global Variables
let map = null;
let riderMarker = null;
let customerMarker = null;
let routingControl = null;
let stompClient = null;
let watchId = null;

const riderId = document.querySelector("meta[name='rider-id']").getAttribute("content");
// 💡 Meta Tags မှ Dynamic Data များ ယူခြင်း
const orderId = document.querySelector('meta[name="order-id"]')?.getAttribute('content');
let currentStatus = document.querySelector('meta[name="order-status"]')?.getAttribute('content') || 'READY_TO_PICKUP';
const customerLat = parseFloat(document.querySelector('meta[name="customer-lat"]')?.getAttribute('content')) || 0;
const customerLng = parseFloat(document.querySelector('meta[name="customer-lng"]')?.getAttribute('content')) || 0;

const actionBtn = document.getElementById('action-btn');

document.addEventListener("DOMContentLoaded", function () {
    initMap();               // ၁။ မြေပုံ စတင်ဆွဲမည်
    connectWebSocket();      // ၂။ WebSocket ချိတ်ဆက်မည်
    // updateButtonUI(currentStatus); // ၃။ Button UI ကို လက်ရှိ Status အတိုင်း ပြမည်


    if (actionBtn) {
        actionBtn.addEventListener('click', handleButtonClick);
    }
});

// -------------------------------------------------------------
// 🗺️ ၁။ Leaflet Map Initialization
// -------------------------------------------------------------
function initMap() {
    const defaultLat = customerLat !== 0 ? customerLat : 16.8409; // Default Yangon Lat
    const defaultLng = customerLng !== 0 ? customerLng : 96.1735; // Default Yangon Lng

    map = L.map('map').setView([defaultLat, defaultLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Customer တည်နေရာရှိပါက Marker စိုက်မည်
    if (customerLat !== 0 && customerLng !== 0) {
        customerMarker = L.marker([customerLat, customerLng])
            .addTo(map)
            .bindPopup("<b>Customer Location</b>")
            .openPopup();

        document.getElementById('customer-text').innerText = `${customerLat.toFixed(5)}, ${customerLng.toFixed(5)}`;
    }
}

// -------------------------------------------------------------
// 🔌 ၂။ WebSocket Connection
// -------------------------------------------------------------
function connectWebSocket() {
    const socket = new SockJS('/ws'); // သင်၏ WebSocket Endpoint
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        document.getElementById('status').innerText = 'Connected';
        document.getElementById('status').style.color = 'green';

        // အကယ်၍ အော်ဒါက ON_THE_WAY ဖြစ်နေပြီးသားဆိုပါက တန်းပြီး Live Tracking စတင်မည်
        if (currentStatus === 'ON_THE_WAY') {
            startLiveLocationTracking();
        }
    }, function (error) {
        document.getElementById('status').innerText = 'Disconnected';
        document.getElementById('status').style.color = 'red';
    });
}

// -------------------------------------------------------------
// 🔘 ၃။ Button UI & State Management
// -------------------------------------------------------------
// function updateButtonUI(status) {
//     if (!actionBtn) return;

//     if (status === 'READY_TO_PICKUP' || status === 'PREPARING') {
//         actionBtn.innerText = "📦 Picked Up (ပစ္စည်းယူပြီးပြီ)";
//         actionBtn.className = "status-btn btn-pickup";
//         actionBtn.style.display = "block";
//     } else if (status === 'ON_THE_WAY') {
//         actionBtn.innerText = "✅ Delivered (ပို့ဆောင်ပြီးပြီ)";
//         actionBtn.className = "status-btn btn-delivered";
//         actionBtn.style.display = "block";
//     } else {
//         actionBtn.style.display = "none"; 
//     }
// }

function handleButtonClick() {
    
        const confirmDelivery = confirm("အော်ဒါ ပို့ဆောင်ပြီးစီးကြောင်း အတည်ပြုပါသလား။");
        if (confirmDelivery) {
            changeOrderStatus();
        }
    
}

function changeOrderStatus() {
    const payload = {
        orderId: orderId,
        riderId: riderId,
        status: "DELIVERED"
    };

    // WebSocket သို့ Status ပြောင်းကြောင်း ပို့ခြင်း
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/accept-order", {}, JSON.stringify(payload));
    }

    currentStatus = "DELIVERED";

    stopLiveLocationTracking();
    alert("🎉 Delivered Successfully!");
    window.location.href = '/rider/home'; // Rider Home သို့ ပြန်ပို့မည်
}

// -------------------------------------------------------------
// 📡 ၄။ GPS Live Tracking & Map Update
// -------------------------------------------------------------
function startLiveLocationTracking() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            document.getElementById('location-text').innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            // 💡 Rider ရဲ့ Marker နဲ့ Route ကို မြေပုံပေါ်မှာ Update လုပ်မည်
            updateRiderMapPosition(lat, lng);

            // 💡 WebSocket ကနေ Customer ဆီ Live Location ပို့မည်
            if (stompClient && stompClient.connected) {
                stompClient.send(`/app/rider/location/${orderId}`, {}, JSON.stringify({
                    orderId: orderId,
                    latitude: lat,
                    longitude: lng
                }));
            }
        }, function (error) {
            console.error("GPS Error:", error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    }
}

function stopLiveLocationTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
}

// -------------------------------------------------------------
// 📍 ၅။ Leaflet Map ပေါ်တွင် Rider Marker & Route ဆွဲပေးခြင်း
// -------------------------------------------------------------
function updateRiderMapPosition(lat, lng) {
    const riderLatLng = [lat, lng];

    // Rider Marker မရှိသေးပါက အသစ်ဆွဲ၊ ရှိပါက နေရာရွှေ့မည်
    if (!riderMarker) {
        riderMarker = L.marker(riderLatLng).addTo(map).bindPopup("<b>Rider (You)</b>");
    } else {
        riderMarker.setLatLng(riderLatLng);
    }

    // Customer တည်နေရာ ရှိပါက လမ်းကြောင်း (Routing) ဆွဲပေးမည်
    if (customerLat !== 0 && customerLng !== 0) {
        if (!routingControl) {
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(lat, lng),
                    L.latLng(customerLat, customerLng)
                ],
                routeWhileDragging: false,
                addWaypoints: false,
                show: false,
                createMarker: function () { return null; } // Default Marker များ မပေါ်စေရန်
            }).addTo(map);
        } else {
            routingControl.setWaypoints([
                L.latLng(lat, lng),
                L.latLng(customerLat, customerLng)
            ]);
        }
    }
}