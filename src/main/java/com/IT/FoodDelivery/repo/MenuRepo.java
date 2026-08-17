package com.IT.FoodDelivery.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Menu;

public interface MenuRepo extends JpaRepository<Menu, Long> {

    List<Menu> findByType(String type);
    Optional<Menu> findByName(String name);
}
