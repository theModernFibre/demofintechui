package com.example.blockchain.dashboard.service;

import com.example.blockchain.dashboard.dto.DashboardSummaryDto;
import com.example.blockchain.dashboard.model.TransactionRecord;
import com.example.blockchain.dashboard.model.TransactionType;
import com.example.blockchain.dashboard.model.UserAccount;
import com.example.blockchain.dashboard.repository.TransactionRecordRepository;
import com.example.blockchain.dashboard.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserAccountRepository userAccountRepository;
    private final TransactionRecordRepository transactionRecordRepository;
    private static final Object DEMO_DATA_LOCK = new Object();

    public DashboardService(UserAccountRepository userAccountRepository,
                            TransactionRecordRepository transactionRecordRepository) {
        this.userAccountRepository = userAccountRepository;
        this.transactionRecordRepository = transactionRecordRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureDemoData() {
        synchronized (DEMO_DATA_LOCK) {
            if (!userAccountRepository.findByUsername("demo-user").isEmpty()) {
                return;
            }

            UserAccount account = new UserAccount();
            account.setUsername("demo-user");
            account.setFiatBalance(new BigDecimal("12500.50"));
            account.setCryptoBalance(new BigDecimal("2.3456"));
            userAccountRepository.save(account);

            Instant now = Instant.now();
            for (int i = 0; i < 20; i++) {
                TransactionRecord tx = new TransactionRecord();
                tx.setTxHash(UUID.randomUUID().toString().replace("-", ""));
                tx.setAssetSymbol(i % 2 == 0 ? "BTC" : "ETH");
                BigDecimal amount = i % 2 == 0 ? new BigDecimal("0.01") : new BigDecimal("0.2");
                tx.setAmount(amount);
                tx.setFiatValue(amount.multiply(new BigDecimal("65000")));
                tx.setType(i % 3 == 0 ? TransactionType.BUY : TransactionType.SELL);
                tx.setTimestamp(now.minus(20 - i, ChronoUnit.HOURS));
                tx.setStatus("CONFIRMED");
                tx.setBlockHeight(1_000L + i);
                tx.setBlockHash(UUID.randomUUID().toString().substring(0, 16));
                transactionRecordRepository.save(tx);
            }
        }
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummaryForDemoUser() {
        ensureDemoData();

        UserAccount account = userAccountRepository.findByUsername("demo-user").stream()
                .findFirst()
                .orElseThrow();

        List<TransactionRecord> recent = transactionRecordRepository.findAll();

        BigDecimal totalVolume24h = recent.stream()
                .filter(tx -> tx.getTimestamp() != null && tx.getTimestamp().isAfter(Instant.now().minus(24, ChronoUnit.HOURS)))
                .map(TransactionRecord::getFiatValue)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal fiat = account.getFiatBalance() != null ? account.getFiatBalance() : BigDecimal.ZERO;
        BigDecimal crypto = account.getCryptoBalance() != null ? account.getCryptoBalance() : BigDecimal.ZERO;
        BigDecimal portfolioValue = fiat.add(crypto.multiply(new BigDecimal("65000")));

        BigDecimal dailyPnl = new BigDecimal("245.33");

        Map<String, BigDecimal> byAsset = recent.stream()
                .collect(Collectors.groupingBy(
                        TransactionRecord::getAssetSymbol,
                        Collectors.mapping(tx -> tx.getFiatValue() != null ? tx.getFiatValue() : BigDecimal.ZERO,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        List<String> topAssets = byAsset.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        return new DashboardSummaryDto(
                account.getUsername() != null ? account.getUsername() : "demo-user",
                fiat,
                crypto,
                portfolioValue,
                dailyPnl,
                totalVolume24h,
                topAssets
        );
    }

    @Transactional(readOnly = true)
    public List<TransactionRecord> getRecentTransactions() {
        ensureDemoData();
        return transactionRecordRepository.findAll().stream()
                .filter(tx -> tx.getTimestamp() != null)
                .sorted(Comparator.comparing(TransactionRecord::getTimestamp).reversed())
                .limit(50)
                .toList();
    }
}

