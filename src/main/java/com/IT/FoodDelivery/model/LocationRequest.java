package com.IT.FoodDelivery.model;

import lombok.Data;

@Data
public class LocationRequest {

    private Long orderId;
    private Double latitude;
    private Double longitude;

}
