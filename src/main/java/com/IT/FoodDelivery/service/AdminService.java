package com.IT.FoodDelivery.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;
import com.IT.FoodDelivery.repo.UserRepo;

import lombok.Data;

@Service
@Data
public class AdminService {

    private final RiderRepo riderRepo;
    private final OrderRepo orderRepo;
    private final UserRepo userRepo;

    public void deleteRider(Long riderId){
        Rider rider = riderRepo.findById(riderId).orElse(null);

        if(rider != null){
            List<Order> orders = orderRepo.findByRiderId(riderId);

            for(Order order: orders){
                order.setRider(null);
                orderRepo.save(order);
            }

            riderRepo.delete(rider);
        }
    }

    public void deleteUser(Long userId){
        AppUser user = userRepo.findById(userId).orElse(null);
        if(user != null){
            userRepo.delete(user);
        }
    }

}
