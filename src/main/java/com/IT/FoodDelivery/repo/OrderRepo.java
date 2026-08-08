package com.IT.FoodDelivery.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Order;

public interface OrderRepo extends JpaRepository<Order, Long>{
    List<Order> findByStatusIn(List<String> statuses);
}
