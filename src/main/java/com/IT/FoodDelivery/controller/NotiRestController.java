package com.IT.FoodDelivery.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api")
@AllArgsConstructor
public class NotiRestController {

    private final MenuRepo menuRepo;
    private final OrderRepo orderRepo;
    private final RiderRepo riderRepo;

    @GetMapping("/orders/active")
    @ResponseBody
    public List<Order> getActiveOrders() {
        // Get active orders 
        List<Order> orders = orderRepo.findByStatusNotAndStatusNot("DELIVERED", "REJECTED");

        return orders;
    }

    @GetMapping("/riders")
    public List<Rider> getAllRiders() {
        List<Rider> riders = riderRepo.findByStatus("AVAILABLE");
        return riders;
    }

    @GetMapping("/drinks")
    public List<Menu> getMenus() {
        return menuRepo.findByType("Drink");
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}