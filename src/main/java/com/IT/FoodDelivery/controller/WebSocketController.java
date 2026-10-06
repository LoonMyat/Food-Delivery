package com.IT.FoodDelivery.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.OrderDto;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;

import lombok.Data;

@Controller
@Data
public class WebSocketController {

    private final OrderRepo orderRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final RiderRepo riderRepo;

    @MessageMapping("/new-order")
    public void orderFromCusToRes(OrderDto dto) {

        Order order = new Order();
        order.setCusName(dto.getCusName());
        order.setLatitude(dto.getLatitude());
        order.setLongitude(dto.getLongitude());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalAmount(dto.getTotalAmount());
        order.setPhone(dto.getPhone());

        Order savedOrder = orderRepo.save(order);

        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("id", savedOrder.getId());
        orderPayload.put("tempOrderId", dto.getTempOrderId());
        orderPayload.put("cusName", savedOrder.getCusName());
        orderPayload.put("phone", savedOrder.getPhone());
        orderPayload.put("latitude", savedOrder.getLatitude());
        orderPayload.put("longitude", savedOrder.getLongitude());
        orderPayload.put("status", savedOrder.getStatus());
        orderPayload.put("totalAmount", savedOrder.getTotalAmount());

        messagingTemplate.convertAndSend("/topic/order-response", (Object) orderPayload);
        messagingTemplate.convertAndSend("/topic/admin/orders", (Object) orderPayload);

        System.out.println("order sent: " + savedOrder.getId());
    }

    @MessageMapping("/accept-order")
    public void acceptOrder(Map<String, Object> payload) {
        try {
            Long orderId = Long.parseLong(payload.get("orderId").toString());

            Object riderIdObj = payload.get("riderId");
            Long riderId = null;
            if (riderIdObj != null && !riderIdObj.toString().isEmpty() && !"null".equals(riderIdObj.toString())) {
                riderId = Long.parseLong(riderIdObj.toString());
            }

            String status = payload.get("status").toString();

            Order order = orderRepo.findById(orderId).orElse(null);
            if (order == null) {
                return;
            }

            Rider rider = null;
            if (riderId != null) {
                rider = riderRepo.findById(riderId).orElse(null);
                if (rider != null) {
                    rider.setStatus("UNAVAILABLE");
                    order.setRider(rider);
                }
            } else if (order.getRider() != null) {
                rider = order.getRider();
            }

            if ("ACCEPTED".equals(status)) {
                order.setStatus("PREPARING");
            } else if ("READY_FOR_PICKUP".equals(status)) {
                order.setStatus("READY_TO_PICKUP");
            } else if ("PICKED_UP".equals(status)) {
                order.setStatus("ON_THE_WAY");
            } else if ("DELIVERED".equals(status)) {
                order.setStatus(status);
                if (rider != null) {
                    rider.setStatus("AVAILABLE");
                }
            }

            if (rider != null) {
                riderRepo.save(rider);
            }
            orderRepo.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getId());
            response.put("status", order.getStatus());
            response.put("message", "Order status updated");
            response.put("cusName", order.getCusName() != null ? order.getCusName() : "Customer");
            response.put("phone", order.getPhone());
            response.put("latitude", order.getLatitude() != null ? order.getLatitude() : 0.0);
            response.put("longitude", order.getLongitude() != null ? order.getLongitude() : 0.0);
            response.put("totalAmount", order.getTotalAmount());

            // 💡 Response Map အစား order object တစ်ခုလုံးကို ပို့ပေးရန်
            messagingTemplate.convertAndSend("/topic/admin/orders", (Object) order);
            if (rider != null) {
                messagingTemplate.convertAndSend("/topic/rider/" + rider.getId() + "/orders", (Object) order);
            }
            messagingTemplate.convertAndSend("/topic/customer/" + orderId, (Object) order);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @MessageMapping("/reject-order")
    public void rejectOrder(Map<String, Object> payload) {
        try {
            Long orderId = Long.parseLong(payload.get("orderId").toString());
            Order order = orderRepo.findById(orderId).orElse(null);
            if (order != null) {
                order.setStatus("REJECTED");
            }

            orderRepo.save(order);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getId());
            response.put("status", order.getStatus());

            messagingTemplate.convertAndSend("/topic/customer/" + orderId, (Object) response);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
