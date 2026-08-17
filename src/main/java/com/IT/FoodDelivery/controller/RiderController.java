package com.IT.FoodDelivery.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping("/rider")
@AllArgsConstructor
public class RiderController {
    
    private final RiderRepo riderRepo;
    private final OrderRepo orderRepo;

    @GetMapping("/home")
    public String home(Model model, Authentication auth) {
        if (auth != null) {
            String email = auth.getName();
            Rider rider = riderRepo.findByUserEmail(email).orElse(null);

            if (rider != null) {
                model.addAttribute("rider", rider);
                model.addAttribute("riderId", rider.getId());
            } else {
                model.addAttribute("errorMessage", "Rider profile not found.");
            }
        }
        return "rider/home";
    }

    @GetMapping("/orders/{riderId}")
    public String orders(@PathVariable("riderId") Long riderId, Model model) {
        List<Order> orders = orderRepo.findByRiderId(riderId);

        for (Order order : orders) {
            String phone = WebSocketController.ORDER_PHONE_MAP.getOrDefault(order.getId(), "N/A");
            order.setPhone(phone);
        }
        model.addAttribute("riderId", riderId);
        model.addAttribute("orders", orders);
        return "rider/orders";
    }

    @GetMapping("/notifications/{riderId}")
    public String showNotifications(@PathVariable("riderId") Long riderId, Model model) {
        List<Order> orders = orderRepo.findByRiderIdAndStatusNot(riderId, "DELIVERED");

        for (Order order : orders) {
            String phone = WebSocketController.ORDER_PHONE_MAP.getOrDefault(order.getId(), "N/A");
            order.setPhone(phone);
        }

        model.addAttribute("riderId", riderId);
        model.addAttribute("orders", orders);

        return "rider/notifications";
    }

    @GetMapping("/map/{orderId}")
    public String map(@PathVariable("orderId") Long orderId, Model model) {
        Order order = orderRepo.findById(orderId).orElse(null);

        if (order != null) {
            String phone = WebSocketController.ORDER_PHONE_MAP.getOrDefault(order.getId(), "N/A");
            order.setPhone(phone);

            if (order.getRider() != null) {
            model.addAttribute("riderId", order.getRider().getId());
        }
        }

        model.addAttribute("order", order);
        return "rider/map";
    }
}