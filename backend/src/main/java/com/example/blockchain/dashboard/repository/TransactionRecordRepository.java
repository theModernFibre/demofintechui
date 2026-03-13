package com.example.blockchain.dashboard.repository;

import com.example.blockchain.dashboard.model.TransactionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long> {
}

