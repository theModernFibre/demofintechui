package com.example.blockchain.dashboard.controller;

import com.example.blockchain.dashboard.dto.DashboardSummaryDto;
import com.example.blockchain.dashboard.model.TransactionRecord;
import com.example.blockchain.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryDto summary() {
        return dashboardService.getSummaryForDemoUser();
    }

    @GetMapping("/transactions")
    public List<TransactionRecord> transactions() {
        return dashboardService.getRecentTransactions();
    }
}

