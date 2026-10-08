package com.IT.FoodDelivery.controller;

public class DistanceCalculator {

    private static final double EARTH_RADIUS_KM = 6371.0; // ကမ္ဘာ့ ব্যাসার্ধ (ကီလိုမီတာ)

    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c; // ထွက်လာမယ့် တန်ဖိုးက ကီလိုမီတာ (KM) ဖြစ်ပါသည်
    }
}
