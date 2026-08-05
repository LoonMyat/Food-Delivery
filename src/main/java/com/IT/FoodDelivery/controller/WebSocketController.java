package com.IT.FoodDelivery.controller;

import java.time.LocalDateTime;

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
    public void orderFromCusToRes(OrderDto dto){

        Order order = new Order();
        order.setCusName(dto.getCusName());
        order.setLattitude(dto.getLattitude());
        order.setLongitude(dto.getLongitude());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepo.save(order);

        messagingTemplate.convertAndSend("/topic/admin/orders", savedOrder);
        
    }

}
