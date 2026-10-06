package com.IT.FoodDelivery.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "orders")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cusName;
    private Double latitude;
    private Double longitude;
    private String status;
    private LocalDateTime createdAt;
    private Double totalAmount;
    private String phone;
    
    
    @ManyToOne
    @JoinColumn(name = "rider_id") // Foreign key column အမည်
    private Rider rider;


}
