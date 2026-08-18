package com.IT.FoodDelivery.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.IT.FoodDelivery.model.Menu;

public interface MenuRepo extends JpaRepository<Menu, Long> {

    List<Menu> findByType(String type);
    Optional<Menu> findByName(String name);
    @Query(value = "SELECT * FROM menus WHERE LOWER(name) REGEXP CONCAT('\\\\b', LOWER(:word), '\\\\b')", nativeQuery = true)
    List<Menu> findByNameExactWord(@Param("word") String word);
}
