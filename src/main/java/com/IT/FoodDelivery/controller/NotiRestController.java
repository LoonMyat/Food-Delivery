package com.IT.FoodDelivery.controller;

import com.IT.FoodDelivery.repo.MenuRepo;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.IT.FoodDelivery.model.Menu;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
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
        // DB ထဲမှ Active Orders များကို ဆွဲထုတ်ခြင်း
        List<Order> orders = orderRepo.findByStatusNot("DELIVERED");

        // 💡 Map ထဲမှ Phone နံပါတ်များကို Order တိုင်းထဲသို့ ဖြည့်ပေးခြင်း
        for (Order order : orders) {
            String phone = WebSocketController.ORDER_PHONE_MAP.getOrDefault(order.getId(), "N/A");
            order.setPhone(phone);
        }

        return orders;
    }

    @GetMapping("/riders")
    public List<Rider> getAllRiders() {
        return riderRepo.findAll();
    }

    @GetMapping("/drinks")
    public List<Menu> getMenus() {
        return menuRepo.findByType("Drink");
    }

}