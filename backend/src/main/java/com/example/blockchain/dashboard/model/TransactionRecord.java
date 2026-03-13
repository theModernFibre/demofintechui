package com.example.blockchain.dashboard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
public class TransactionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String txHash;

    private String assetSymbol;

    private BigDecimal amount;

    private BigDecimal fiatValue;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(20)")
    private TransactionType type;

    private Instant timestamp;

    private String status;

    private Long blockHeight;

    private String blockHash;
}

