package com.IT.FoodDelivery.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {

    private String cusName;
    private Double lattitude;
    private Double longitude;
    private String status;
    private LocalDateTime createdAt;

}
