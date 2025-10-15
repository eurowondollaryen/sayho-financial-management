import { useMemo, useCallback, useRef, useState } from "react";
import dayjs from "dayjs";
import { useQueries, useQuery } from "@tanstack/react-query";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  type ScriptableContext
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
            <Stack gap={1}>
              <FundTrendChart data={fundTrendData} />
              <Typography variant="caption" color="text.secondary">
                {t("dashboard.fund_trend_hint")}
              </Typography>
            </Stack>
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
  const AXIS_WIDTH = 68;
  const [axisTicks, setAxisTicks] = useState<{ label: string; percent: number }[]>([]);
  const axisTicksSignature = useRef<string>("");
  const labels = useMemo(() => data.map((point) => dayjs(point.date).format("YYYY-MM-DD")), [data]);
  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(undefined, { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(
        value
      ),
    []
  );
  const createGradientBackground = useCallback(
    (color: string) =>
      (context: ScriptableContext<"line">) => {
        const { chart } = context;
        const { ctx, chartArea } = chart;
        if (!chartArea) {
          return color;
        }
        const gradient = ctx.createLinearGradient(chartArea.left, chartArea.bottom, chartArea.left, chartArea.top);
        gradient.addColorStop(0, alpha(color, 0.05));
        gradient.addColorStop(0.5, alpha(color, 0.2));
        gradient.addColorStop(1, alpha(color, 0.5));
        return gradient;
      },
    []
  );

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "",
          data: data.map((point) => point.amount),
          borderColor: theme.palette.primary.main,
          pointBorderColor: theme.palette.primary.main,
          pointBackgroundColor: theme.palette.background.paper,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          backgroundColor: createGradientBackground(theme.palette.primary.main)
        }
      ]
    }),
    [createGradientBackground, data, labels, theme.palette.background.paper, theme.palette.primary.main]
  );
  const axisTickPlugin = useMemo(
    () => ({
      id: "fund-trend-axis-updater",
      afterLayout: (chart: ChartJS) => {
        const scale = (chart.scales?.y as any);
        if (!scale || !scale.ticks?.length) {
          return;
        }
        const canvasHeight = chart.height || chart.chartArea?.bottom || 1;
        const ticks = scale.ticks.map((tick: { label?: string; value?: number }, index: number) => {
          const pixel = scale.getPixelForTick(index);
          const percent = Math.min(1, Math.max(0, pixel / canvasHeight));
          const numericValue = typeof tick.value === "number" ? tick.value : Number(tick.value ?? 0);
          const rawLabel = typeof tick.label === "string" && tick.label !== "" ? tick.label : formatCurrency(numericValue);
          return { label: rawLabel, percent };
        });
        const signature = ticks.map(({ label, percent }) => `${label}-${Math.round(percent * 1000)}`).join("|");
        if (axisTicksSignature.current !== signature) {
          axisTicksSignature.current = signature;
          setAxisTicks(ticks);
        }
      }
    }),
    [formatCurrency]
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
                return formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: theme.palette.text.secondary,
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false
            },
            grid: {
              color: theme.palette.divider
            }
          },
          y: {
            ticks: {
              display: false,
              callback(value: string | number) {
                const numeric = typeof value === "number" ? value : Number(value);
                return Number.isFinite(numeric) ? formatCurrency(numeric) : String(value);
              }
            },
            grid: {
              color: theme.palette.divider,
              drawTicks: false,
              drawBorder: false
            },
            beginAtZero: true
          }
        },
        layout: {
          padding: { left: 12, right: 16, top: 8, bottom: 8 }
        }
      }) as const,
    [data, formatCurrency, theme.palette.divider, theme.palette.text.secondary]
  );

  const containerMinWidth = useMemo(() => Math.max(data.length * 80, 640), [data.length]);

  return (
    <Box sx={{ position: "relative", height: 320 }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${AXIS_WIDTH}px`,
          pointerEvents: "none",
          borderRight: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to right, ${theme.palette.background.paper} 70%, ${alpha(theme.palette.background.paper, 0)} )`,
          zIndex: 1
        }}
      >
        {axisTicks.map(({ label, percent }) => (
          <Box
            key={`${label}-${percent}`}
            sx={{
              position: "absolute",
              right: theme.spacing(1),
              top: `${percent * 100}%`,
              transform: "translateY(-50%)",
              color: theme.palette.text.secondary,
              fontSize: theme.typography.caption.fontSize,
              textAlign: "right"
            }}
          >
            {label}
          </Box>
        ))}
      </Box>
      <Box sx={{ overflowX: "auto", height: "100%", pl: `${AXIS_WIDTH}px`, pb: 1 }}>
        <Box sx={{ position: "relative", height: "100%", minWidth: `${containerMinWidth}px` }}>
          <Line
            data={chartData}
            options={chartOptions}
            plugins={[axisTickPlugin]}
            style={{ width: "100%", height: "100%" }}
          />
        </Box>
      </Box>
    </Box>
  );
}
