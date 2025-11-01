import { useQueries, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import Screen from "../components/Screen";
import { fetchFundSnapshots, type FundSnapshot } from "../api/fundStatus";
import { fetchGoals, fetchTransactions, type Goal, type Transaction } from "../api/goals";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";

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
      queryKey: ["transactions", goal.id],
      queryFn: () => fetchTransactions(goal.id),
      enabled: !!goal.id
    }))
  });

  const isTransactionsLoading = transactionQueries.some((query) => query.isPending);

  const progressList = useMemo(() => {
    return goals.map((goal, index) => {
      const transactions = (transactionQueries[index]?.data ?? []) as Transaction[];
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

  const snapshotSummary = useMemo(() => {
    const snapshots = Array.isArray(snapshotData) ? (snapshotData as FundSnapshot[]) : [];
    const sorted = [...snapshots].sort(
      (a, b) => dayjs(b.reference_date).valueOf() - dayjs(a.reference_date).valueOf()
    );
    const latestTotal = snapshots.reduce((acc, snapshot) => {
      const amount = parseFloat(snapshot.amount);
      return Number.isNaN(amount) ? acc : acc + amount;
    }, 0);

    return {
      latestTotal,
      recent: sorted.slice(0, 5)
    };
  }, [snapshotData]);

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("dashboard.overview")}</Text>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("dashboard.fund_trend_title")}</Text>
          {isSnapshotsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : snapshotSummary.recent.length ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: colors.muted }}>
                {t("dashboard.saved")}: {formatCurrency(snapshotSummary.latestTotal)}
              </Text>
              <View style={{ gap: 8 }}>
              {snapshotSummary.recent.map((snapshot) => (
                <View
                  key={snapshot.id}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Text style={{ color: colors.text, fontWeight: "500" }}>
                    {dayjs(snapshot.reference_date).format("YYYY-MM-DD")}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {formatCurrency(Number.isNaN(parseFloat(snapshot.amount)) ? 0 : parseFloat(snapshot.amount))}
                  </Text>
                </View>
              ))}
              </View>
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
