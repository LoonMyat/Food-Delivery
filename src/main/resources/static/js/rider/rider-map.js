// 💡 Global Variables
let map = null;
let riderMarker = null;
let customerMarker = null;
let routingControl = null;
let stompClient = null;
let watchId = null;

const restLat = 22.029440;
const restLng = 96.101202;

const riderId = document.querySelector("meta[name='rider-id']").getAttribute("content");
// 💡 Meta Tags မှ Dynamic Data များ ယူခြင်း
const orderId = document.querySelector('meta[name="order-id"]')?.getAttribute('content');
let currentStatus = document.querySelector('meta[name="order-status"]')?.getAttribute('content') || 'READY_TO_PICKUP';
const customerLat = parseFloat(document.querySelector('meta[name="customer-lat"]')?.getAttribute('content')) || 0;
const customerLng = parseFloat(document.querySelector('meta[name="customer-lng"]')?.getAttribute('content')) || 0;

const actionBtn = document.getElementById('action-btn');

document.addEventListener("DOMContentLoaded", function () {
    initMap();
    connectWebSocket();

    if (currentStatus == "ON_THE_WAY") {
        actionBtn.addEventListener('click', handleButtonClick);
    } else {
        actionBtn.disabled = true;
    }
});

// -------------------------------------------------------------
// Leaflet Map Initialization
// -------------------------------------------------------------
function initMap() {
    const defaultLat = customerLat !== 0 ? customerLat : 16.8409; // Default Lat
    const defaultLng = customerLng !== 0 ? customerLng : 96.1735; // Default Lng

    map = L.map('map').setView([defaultLat, defaultLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Customer location marker
    if (customerLat !== 0 && customerLng !== 0) {
        customerMarker = L.marker([customerLat, customerLng])
            .addTo(map)
            .bindPopup("<b>Customer Location</b>")
            .openPopup();

    }

    // map.on('click', function (e) {
    //     const clickedLat = e.latlng.lat;
    //     const clickedLng = e.latlng.lng;

    //     // ၁။ UI ပေါ်က စာသားကို Update လုပ်မည် (ရှိခဲ့လျှင်)
    //     const locationText = document.getElementById('location-text');
    //     if (locationText) {
    //         locationText.innerText = `${clickedLat.toFixed(5)}, ${clickedLng.toFixed(5)} (Manual)`;
    //     }
    //     // ၂။ သင်ရေးထားပြီးသား Function ဖြင့် Marker နှင့် Route ကို Update လုပ်မည်
    //     updateRiderMapPosition(clickedLat, clickedLng);
    //     // startLiveLocationTracking();

    //     // ၃။ WebSocket မှတစ်ဆင့် Customer ဆီသို့ လှမ်းပို့မည်
    //     if (stompClient && stompClient.connected) {
    //         stompClient.send(`/app/rider-location/${orderId}`, {}, JSON.stringify({
    //             orderId: orderId,
    //             latitude: clickedLat,
    //             longitude: clickedLng
    //         }));
    //     }
    // });
}

// -------------------------------------------------------------
// WebSocket Connection
// -------------------------------------------------------------
function connectWebSocket() {
    const socket = new SockJS('/ws'); // WebSocket Endpoint
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        if (currentStatus === 'ON_THE_WAY') {
            startLiveLocationTracking(); //start live tracking
        }
    });
}

function handleButtonClick() {
    const confirmDelivery = confirm("Are you sure order delivered?");
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

    if (stompClient && stompClient.connected) {
        stompClient.send("/app/accept-order", {}, JSON.stringify(payload));
    }

    currentStatus = "DELIVERED";

    stopLiveLocationTracking();
    alert("🎉 Delivered Successfully!");
    window.location.href = '/rider/home';
}

// -------------------------------------------------------------
// GPS Live Tracking & Map Update
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
                stompClient.send(`/app/rider-location/${orderId}`, {}, JSON.stringify({
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
            timeout: 10000
        });
    }
}

function stopLiveLocationTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
    }
}

// -------------------------------------------------------------
// Draw rider marker and route on map
// -------------------------------------------------------------
function updateRiderMapPosition(lat, lng) {
    const riderLatLng = [lat, lng];


    // Rider Marker မရှိသေးပါက အသစ်ဆွဲ၊ ရှိပါက နေရာရွှေ့မည်
    if (!riderMarker) {
        riderMarker = L.marker(riderLatLng).addTo(map).bindPopup("<b>Rider (You)</b>");
    } else {
        riderMarker.setLatLng(riderLatLng);
    }

    // Customer route
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
                createMarker: function () { return null; }
            }).addTo(map);
        } else {
            routingControl.setWaypoints([
                L.latLng(lat, lng),
                L.latLng(customerLat, customerLng)
            ]);
        }
    }
}

function goToPage(page) {
    window.location.href = page;
}