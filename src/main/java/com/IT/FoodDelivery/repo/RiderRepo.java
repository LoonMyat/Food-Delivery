package com.IT.FoodDelivery.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Rider;
import com.IT.FoodDelivery.model.AppUser;



public interface RiderRepo extends JpaRepository<Rider, Long>{
    boolean existsByUser(AppUser user);
    Optional<Rider> findByUserEmail(String email);
}
