package com.IT.FoodDelivery.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.IT.FoodDelivery.model.Menu;

public interface MenuRepo extends JpaRepository<Menu, Long> {

    public List<Menu> findByType(String type);

}
