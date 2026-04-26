package com.fypals.FYPals.user.repository;

import com.fypals.FYPals.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.fypals.FYPals.enums.Role;
import java.util.List;



public interface UserRepository extends JpaRepository<User, Long> {

    Page<User> findAll(Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.skills) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchByKeyword(@Param("keyword") String keyword);
    List<User> findByRole(Role role);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
