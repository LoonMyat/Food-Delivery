package com.IT.FoodDelivery.repo;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Order;

public interface OrderRepo extends JpaRepository<Order, Long>{
    List<Order> findByStatusIn(List<String> statuses);

    List<Order> findByRiderId(Long id);

    List<Order> findByRiderIdAndStatusNot(Long id, String status);

    // List<Order> findByStatusNot(String status);
    List<Order> findByStatusNotAndStatusNot(String status1, String status2, Sort sort);

    List<Order> findByStatus(String status);

    List<Order> findByUserId(Long id);    

    List<Order> findByRiderIdAndStatus(Long id, String status);
}
