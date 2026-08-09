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

        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("id", savedOrder.getId());
        orderPayload.put("tempOrderId", dto.getTempOrderId());
        orderPayload.put("cusName", savedOrder.getCusName());
        orderPayload.put("phno", dto.getPhno());
        orderPayload.put("latitude", savedOrder.getLattitude());
        orderPayload.put("longitude", savedOrder.getLongitude());
        orderPayload.put("status", savedOrder.getStatus());

        messagingTemplate.convertAndSend("/topic/order-response", (Object) orderPayload);

        messagingTemplate.convertAndSend("/topic/admin/orders", (Object) orderPayload);

        System.out.println("order sent: " + savedOrder.getId());
    }

    @MessageMapping("/accept-order")
    public void acceptOrder(Map<String, Object> payload) {

        Long orderId = Long.parseLong(payload.get("orderId").toString());

        Order order = orderRepo.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus("PREPARING");
            orderRepo.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("status", "PREPARING");
            response.put("message", "Order Accept");

            messagingTemplate.convertAndSend("/topic/order-status/" + orderId, (Object) response);
            messagingTemplate.convertAndSend("/topic/riders/order-status/", (Object) response);
        }

    }

    @MessageMapping("/ready-order")
public void readyOrder(Map<String, Object> payload) {

    Long orderId = Long.parseLong(payload.get("orderId").toString());
    
    // 💡 Frontend ကနေ ပါလာမည့် riderId ကို ယူပါမည်
    Long riderId = Long.parseLong(payload.get("riderId").toString()); 

    Order order = orderRepo.findById(orderId).orElse(null);
    if (order != null) {
        order.setStatus("READY_FOR_PICKUP");
        orderRepo.save(order);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("riderId", riderId);
        response.put("status", "READY_FOR_PICKUP");
        response.put("message", "Ready for pickup!");

        // 📢 ၁။ ရွေးချယ်ထားသော သီးသန့် Rider ထံသို့သာ ပို့မည်
        messagingTemplate.convertAndSend("/topic/rider-status/" + riderId, (Object)response);

    }
}

    @MessageMapping("/reject-order")
    public void rejectOrder(Map<String, Object> payload) {

        Long orderId = Long.parseLong(payload.get("orderId").toString());

        Order order = orderRepo.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus("REJECTED");
            orderRepo.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("status", "REJECTED");
            response.put("message", "Order Rejected");

            // Send to customer
            messagingTemplate.convertAndSend("/topic/order-status/" + orderId, (Object) response);
        }
    }

}