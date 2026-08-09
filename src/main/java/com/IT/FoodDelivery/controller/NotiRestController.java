package com.IT.FoodDelivery.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo; 

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api")
@AllArgsConstructor
public class NotiRestController {

    private final OrderRepo orderRepo;
    private final RiderRepo riderRepo; 

    
    @GetMapping("/orders/active")
    public List<Order> getActiveOrders(){
        return orderRepo.findByStatusIn(List.of("PENDING", "PREPARING"));
    }

    
    @GetMapping("/riders")
    public List<Rider> getAllRiders(){
        return riderRepo.findAll(); 
    }

}