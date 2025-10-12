import { useMemo } from "react";
import dayjs from "dayjs";
import { useQueries, useQuery } from "@tanstack/react-query";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

import { fetchGoals, fetchTransactions } from "../../api/goals";
import type { Transaction } from "../../api/goals";
import { fetchFundSnapshots } from "../../api/fundStatus";
import type { FundSnapshot } from "../../api/fundStatus";
import { useTranslation } from "../../providers/LanguageProvider";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

function calculateProgress(goalAmount: number, transactionsTotal: number) {
  if (!goalAmount) return 0;
  const percentage = Math.round((transactionsTotal / goalAmount) * 100);
  return Math.max(0, Math.min(100, percentage));
}

export default function DashboardPage() {
  const {
    data: goals = [],
    isLoading: isGoalsLoading
  } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });

  const {
    data: snapshotsData,
    isLoading: isSnapshotsLoading
  } = useQuery({
    queryKey: ["fund-snapshots"],
    queryFn: fetchFundSnapshots
  });
  const { t } = useTranslation();

  const snapshots = Array.isArray(snapshotsData) ? (snapshotsData as FundSnapshot[]) : [];

  const transactionQueries = useQueries({
    queries: goals.map((goal) => ({
      queryKey: ["transactions", goal.id],
      queryFn: () => fetchTransactions(goal.id),
      enabled: !!goal.id
    }))
  });

  const isTransactionsLoading = transactionQueries.some((query) => query.isPending);

  const fundTrendData = useMemo(() => {
    const totals = new Map<string, number>();
    snapshots.forEach((snapshot) => {
      const amount = parseFloat(snapshot.amount);
      if (Number.isNaN(amount)) {
        return;
      }
      const current = totals.get(snapshot.reference_date) ?? 0;
      totals.set(snapshot.reference_date, current + amount);
    });
    return Array.from(totals.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  }, [snapshots]);

  const progressList = useMemo(
    () =>
      goals.map((goal, index) => {
        const transactions = (transactionQueries[index]?.data ?? []) as Transaction[];
        const totalSaved = transactions.reduce((accumulator, transaction) => {
          const rawAmount = parseFloat(transaction.amount);
          if (Number.isNaN(rawAmount)) {
            return accumulator;
          }
          const signedAmount = transaction.type === "withdrawal" ? -rawAmount : rawAmount;
          return accumulator + signedAmount;
        }, 0);
        const parsedTarget = parseFloat(goal.target_amount);
        const targetAmount = Number.isNaN(parsedTarget) ? 0 : parsedTarget;
        return {
          goal,
          percentage: calculateProgress(targetAmount, totalSaved),
          totalSaved,
          targetAmount
        };
      }),
    [goals, transactionQueries]
  );

  return (
    <Stack gap={3}>
      <Typography variant="h4">{t("dashboard.overview")}</Typography>
      <Stack gap={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("dashboard.fund_trend_title")}
          </Typography>
          {isSnapshotsLoading ? (
            <LinearProgress />
          ) : fundTrendData.length ? (
            <FundTrendChart data={fundTrendData} />
          ) : (
            <Typography color="text.secondary">{t("dashboard.fund_trend_empty")}</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("dashboard.goal_progress_title")}
          </Typography>
          {isGoalsLoading || isTransactionsLoading ? (
            <LinearProgress />
          ) : progressList.length ? (
            <Grid container spacing={2}>
              {progressList.map(({ goal, percentage, totalSaved, targetAmount }) => (
                <Grid key={goal.id} item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
                    <Typography variant="h6">{goal.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("dashboard.target")}: ₩{targetAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      {t("dashboard.saved")}: ₩{totalSaved.toLocaleString()}
                    </Typography>
                    <LinearProgress variant="determinate" value={percentage} sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard.progress")} {percentage}% · {t("dashboard.due")}{" "}
                      {goal.target_date ?? t("dashboard.na")}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">{t("dashboard.empty")}</Typography>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}

function FundTrendChart({ data }: { data: { date: string; amount: number }[] }) {
  const theme = useTheme();
  const labels = useMemo(() => data.map((point) => dayjs(point.date).format("YYYY-MM-DD")), [data]);
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "",
          data: data.map((point) => point.amount),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.3,
          fill: {
            target: "origin",
            above: theme.palette.primary.light
          },
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    }),
    [data, labels, theme.palette.primary.light, theme.palette.primary.main]
  );

  const chartOptions = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title(context: { dataIndex: number }[]) {
                const index = context[0]?.dataIndex ?? 0;
                return dayjs(data[index].date).format("YYYY-MM-DD");
              },
              label(context: { parsed: { y: number } }) {
                const value = context.parsed.y;
                return new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "KRW"
                }).format(value);
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: theme.palette.text.secondary
            },
            grid: {
              color: theme.palette.divider
            }
          },
          y: {
            ticks: {
              color: theme.palette.text.secondary,
              callback(value: string | number) {
                if (typeof value === "string") return value;
                return new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "KRW",
                  maximumFractionDigits: 0
                }).format(value);
              }
            },
            grid: {
              color: theme.palette.divider
            },
            beginAtZero: true
          }
        }
      }) as const,
    [data, theme.palette.divider, theme.palette.text.secondary]
  );

  return (
    <Stack sx={{ position: "relative", height: 320 }}>
      <Line data={chartData} options={chartOptions} />
    </Stack>
  );
}
