import { useQueries, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo } from "react";
import { ActivityIndicator, Text, View, Platform } from "react-native";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import Screen from "../components/Screen";
import { fetchFundSnapshots, type FundSnapshot } from "../api/fundStatus";
import { fetchGoals, fetchTransactions, type Goal, type Transaction } from "../api/goals";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function calculateProgress(goalAmount: number, transactionsTotal: number) {
  if (!goalAmount) {
    return 0;
  }
  const percentage = Math.round((transactionsTotal / goalAmount) * 100);
  return Math.max(0, Math.min(100, percentage));
}

function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₩${Math.round(amount).toLocaleString()}`;
  }
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreference();

  const {
    data: goals = [],
    isLoading: isGoalsLoading
  } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });

  const {
    data: snapshotData = [],
    isLoading: isSnapshotsLoading
  } = useQuery({
    queryKey: ["fund-snapshots"],
    queryFn: fetchFundSnapshots
  });

  const transactionQueries = useQueries({
    queries: goals.map((goal) => ({
      queryKey: ["transactions", goal.id.toString()],
      queryFn: () => fetchTransactions(goal.id)
    }))
  });

  const isTransactionsLoading = transactionQueries.some((query) => query.isPending);

  const progressList = useMemo(() => {
    return goals.map((goal, index) => {
      const queryResult = transactionQueries[index];
      const transactions = (queryResult?.data ?? []) as Transaction[];
      const totalSaved = transactions.reduce((acc, txn) => {
        const amount = parseFloat(txn.amount);
        if (Number.isNaN(amount)) {
          return acc;
        }
        const signedAmount = txn.type === "withdrawal" ? -amount : amount;
        return acc + signedAmount;
      }, 0);
      const parsedTarget = parseFloat(goal.target_amount);
      const targetAmount = Number.isNaN(parsedTarget) ? 0 : parsedTarget;
      return {
        goal,
        percentage: calculateProgress(targetAmount, totalSaved),
        totalSaved,
        targetAmount
      };
    });
  }, [goals, transactionQueries]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: colors.muted
          },
          grid: {
            color: colors.border
          }
        },
        y: {
          ticks: {
            color: colors.muted
          },
          grid: {
            color: colors.border
          }
        }
      }
    }),
    [colors]
  );

  const fundTrendData = useMemo(() => {
    const snapshots = Array.isArray(snapshotData) ? (snapshotData as FundSnapshot[]) : [];

    // Group snapshots by date and sum amounts
    const dailyTotals = snapshots.reduce(
      (acc, snapshot) => {
        const date = dayjs(snapshot.reference_date).format("YYYY-MM-DD");
        const amount = parseFloat(snapshot.amount);
        if (!Number.isNaN(amount)) {
          acc[date] = (acc[date] || 0) + amount;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Sort dates chronologically
    const sortedDates = Object.keys(dailyTotals).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

    const labels = sortedDates;
    const data = sortedDates.map((date) => dailyTotals[date]);

    return {
      labels,
      datasets: [
        {
          label: t("dashboard.fund_trend_title"),
          data,
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}80` // Add some transparency
        }
      ]
    };
  }, [snapshotData, t, colors]);

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("dashboard.overview")}</Text>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("dashboard.fund_trend_title")}</Text>
          {isSnapshotsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : fundTrendData.labels.length ? (
            <View style={{ height: 300, marginTop: 12 }}>
              {Platform.OS === "web" ? (
                <Line options={chartOptions} data={fundTrendData} />
              ) : (
                <Text style={{ color: colors.muted }}>{t("common.chart_not_supported")}</Text>
              )}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>{t("dashboard.fund_trend_empty")}</Text>
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            {t("dashboard.goal_progress_title")}
          </Text>
          {isGoalsLoading || isTransactionsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : progressList.length ? (
            <View style={{ gap: 16 }}>
              {progressList.map(({ goal, percentage, totalSaved, targetAmount }) => (
                <View key={goal.id} style={{ gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{goal.title}</Text>
                  <Text style={{ color: colors.muted }}>
                    {t("dashboard.saved")}: {formatCurrency(totalSaved)}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {t("dashboard.target")}: {formatCurrency(targetAmount)}
                  </Text>
                  <ProgressBar value={percentage} />
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {t("dashboard.progress")} {percentage}% · {t("dashboard.due")}{" "}
                    {goal.target_date ? dayjs(goal.target_date).format("YYYY-MM-DD") : t("dashboard.na")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>{t("dashboard.empty")}</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}
