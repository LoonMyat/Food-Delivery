package com.IT.FoodDelivery.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.OrderDto;
import com.IT.FoodDelivery.repo.OrderRepo;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class WebSocketController {

    private OrderRepo orderRepo;
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/new-order")
    public void orderFromCusToRes(OrderDto dto) {

        Order order = new Order();
        order.setCusName(dto.getCusName());
        order.setLattitude(dto.getLatitude());
        order.setLongitude(dto.getLongitude());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepo.save(order);

        // 💡 Customer နှင့် Restaurant ထံ ပို့ပေးမည့် Payload Structure
        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("id", savedOrder.getId());
        orderPayload.put("tempOrderId", dto.getTempOrderId()); // 👈 ၁။ Customer JS စစ်နိုင်ရန် tempOrderId
                                                               // ထည့်ပေးရပါမည်
        orderPayload.put("cusName", savedOrder.getCusName());
        orderPayload.put("phno", dto.getPhno());
        orderPayload.put("latitude", savedOrder.getLattitude());
        orderPayload.put("longitude", savedOrder.getLongitude());
        orderPayload.put("status", savedOrder.getStatus());

        // Customer ထံသို့ tempOrderId ပါသော Payload ပို့ပေးခြင်း
        messagingTemplate.convertAndSend("/topic/order-response", (Object) orderPayload);

        // Restaurant (Admin) ထံသို့ ပို့ပေးခြင်း
        messagingTemplate.convertAndSend("/topic/admin/orders", (Object) orderPayload);

        System.out.println("order sent: " + savedOrder.getId());
    }

    @MessageMapping("/accept-order")
    public void acceptOrder(Map<String, Object> payload) {

        Long orderId = Long.parseLong(payload.get("orderId").toString());

        Order order = orderRepo.findById(orderId).orElseThrow();
        if (order != null) {
            order.setStatus("PREPARING");
            orderRepo.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("status", "PREPARING");
            response.put("message", "Order Accept");

            // 👈 ၂။ Customer JS နားထောင်နေသည့် Topic Path အတိုင်း
            // /topic/order-status/{orderId} သို့ ပြောင်းလိုက်ပါ
            messagingTemplate.convertAndSend("/topic/order-status/" + orderId, (Object) response);
        }

    }

    @MessageMapping("/reject-order")
    public void rejectOrder(Map<String, Object> payload) {

        Long orderId = Long.parseLong(payload.get("orderId").toString());

        Order order = orderRepo.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus("REJECTED");
            orderRepo.save(order); // DB ထဲတွင် REJECTED အဖြစ် သိမ်းမည်

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("status", "REJECTED");
            response.put("message", "Order Rejected");

            // Customer နားထောင်နေသည့် Topic သို့ ပို့ပေးမည်
            messagingTemplate.convertAndSend("/topic/order-status/" + orderId, (Object) response);
        }
    }

}