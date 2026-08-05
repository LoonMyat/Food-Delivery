package com.IT.FoodDelivery.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Order;

public interface OrderRepo extends JpaRepository<Order, Long>{

}
