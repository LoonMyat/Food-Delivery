package com.IT.FoodDelivery.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.AppUser;

public interface UserRepo extends JpaRepository<AppUser, Long>{

    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);

}
