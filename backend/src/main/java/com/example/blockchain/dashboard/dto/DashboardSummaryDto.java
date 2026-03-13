package com.example.blockchain.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryDto(
        String username,
        BigDecimal fiatBalance,
        BigDecimal cryptoBalance,
        BigDecimal portfolioValue,
        BigDecimal dailyPnl,
        BigDecimal totalVolume24h,
        List<String> topAssets
) {
}

