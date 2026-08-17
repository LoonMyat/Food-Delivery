package com.IT.FoodDelivery.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.OrderDto;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class WebSocketController {

    private OrderRepo orderRepo;
    private SimpMessagingTemplate messagingTemplate;
    private RiderRepo riderRepo;

    public static final Map<Long, String> ORDER_PHONE_MAP = new ConcurrentHashMap<>();

    @MessageMapping("/new-order")
    public void orderFromCusToRes(OrderDto dto) {

        Order order = new Order();
        order.setCusName(dto.getCusName());
        order.setLatitude(dto.getLatitude());
        order.setLongitude(dto.getLongitude());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepo.save(order);

        if (dto.getPhone() != null && !dto.getPhone().isEmpty()) {
            ORDER_PHONE_MAP.put(savedOrder.getId(), dto.getPhone());
        }

        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("id", savedOrder.getId());
        orderPayload.put("tempOrderId", dto.getTempOrderId());
        orderPayload.put("cusName", savedOrder.getCusName());
        orderPayload.put("phone", dto.getPhone());
        orderPayload.put("latitude", savedOrder.getLatitude());
        orderPayload.put("longitude", savedOrder.getLongitude());
        orderPayload.put("status", savedOrder.getStatus());

        messagingTemplate.convertAndSend("/topic/order-response", (Object) orderPayload);
        messagingTemplate.convertAndSend("/topic/admin/orders", (Object) orderPayload);

        System.out.println("order sent: " + savedOrder.getId());
    }

    @MessageMapping("/accept-order")
    public void acceptOrder(Map<String, Object> payload) {
        try {
            Long orderId = Long.parseLong(payload.get("orderId").toString());
            Long riderId = Long.parseLong(payload.get("riderId").toString());
            String status = payload.get("status").toString();

            Order order = orderRepo.findById(orderId).orElse(null);
            Rider rider = riderRepo.findById(riderId).orElse(null);

            if (order != null && rider != null) {
                order.setRider(rider);
                // order.setStatus("PREPARING");
                if("ACCEPTED".equals(status)){
                    order.setStatus("PREPARING");
                }
                else if("READY_FOR_PICKUP".equals(status)){
                    order.setStatus("READY_TO_PICKUP");
                }
                else if("PICKED_UP".equals(status)){
                    order.setStatus("ON_THE_WAY");
                }else if("DELIVERED".equals(status)){
                    order.setStatus(status);
                }

                orderRepo.save(order);

                String customerPhone = ORDER_PHONE_MAP.getOrDefault(orderId, "N/A");

                Map<String, Object> response = new HashMap<>();
                response.put("orderId", order.getId());
                response.put("status", order.getStatus());
                response.put("message", "New order arrive");
                response.put("cusName", order.getCusName() != null ? order.getCusName() : "Customer");
                response.put("phone", customerPhone); 
                response.put("latitude", order.getLatitude() != null ? order.getLatitude() : 0.0);
                response.put("longitude", order.getLongitude() != null ? order.getLongitude() : 0.0);


                messagingTemplate.convertAndSend("/topic/rider/" + riderId + "/orders", (Object) response);
                messagingTemplate.convertAndSend("/topic/customer/" + orderId, (Object) response);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}