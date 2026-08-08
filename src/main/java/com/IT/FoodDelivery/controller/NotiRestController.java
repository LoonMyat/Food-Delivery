package com.IT.FoodDelivery.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.repo.OrderRepo;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class NotiRestController {

    private final OrderRepo orderRepo;

    @GetMapping("/active")
    public List<Order> getActiveOrders(){
        return orderRepo.findByStatusIn(List.of("PENDING", "PREPARING"));
    }

}
