package com.example.blockchain.dashboard.repository;

import com.example.blockchain.dashboard.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    List<UserAccount> findByUsername(String username);
}

