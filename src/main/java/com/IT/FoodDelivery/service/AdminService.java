package com.IT.FoodDelivery.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.IT.FoodDelivery.model.AppUser;
import com.IT.FoodDelivery.model.Order;
import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.repo.MenuRepo;
import com.IT.FoodDelivery.repo.OrderRepo;
import com.IT.FoodDelivery.repo.RiderRepo;
import com.IT.FoodDelivery.repo.UserRepo;

import jakarta.transaction.Transactional;
import lombok.Data;

@Service
@Data
public class AdminService {

    private final RiderRepo riderRepo;
    private final OrderRepo orderRepo;
    private final UserRepo userRepo;
    private final MenuRepo menuRepo;

    @Transactional 
    public void deleteRider(Long riderId){
        Rider rider = riderRepo.findById(riderId).orElse(null);

        if(rider != null){
            List<Order> orders = orderRepo.findByRiderId(riderId);

            for(Order order: orders){
                order.setRider(null);
                orderRepo.save(order);
            }

            AppUser user = rider.getUser();
            if(user!=null){
                user.setRole("CUSTOMER");
                userRepo.save(user);
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

    public void editMenu(Long id, String name, Double price){
        menuRepo.findById(id).ifPresent(menu -> {
            if(menuRepo.findByName(name).isPresent() && !menu.getName().equals(name)){
                throw new IllegalArgumentException("Menu already exists");
            }
            menu.setName(name);
            menu.setPrice(price);
            menuRepo.save(menu);
        });
    }

    public void deleteMenu(Long id){
        menuRepo.deleteById(id);
    }
}
