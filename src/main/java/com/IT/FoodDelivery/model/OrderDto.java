package com.IT.FoodDelivery.model;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class OrderDto {

    private String tempOrderId;
    private String cusName;
    private Double latitude;
    private Double longitude;
    private String status;
    private String phone;
    private LocalDateTime createdAt;
    private Double totalAmount;

}
