import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { DatePicker } from "@mui/x-date-pickers";

import {
  createGoal,
  createTransaction,
  fetchGoals,
  fetchTransactions,
  type TransactionPayload
} from "../../api/goals";
import { useTranslation } from "../../providers/LanguageProvider";

type GoalFormData = {
  title: string;
  description?: string;
  target_amount: string;
  target_date?: string;
  contribution_ratio?: string;
};

type TransactionFormData = {
  goalId: string;
  type: "deposit" | "withdrawal";
  amount: string;
  category?: string;
  occurred_on: string;
  memo?: string;
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: goals = [], isFetching: isGoalsFetching } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });

  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  const goalSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(2, { message: t("validation.title_min") }),
        description: z.string().optional(),
        target_amount: z.string().min(1, { message: t("goals.form.target_amount_error") }),
        target_date: z.string().optional(),
        contribution_ratio: z.string().optional()
      }),
    [t]
  );

  const transactionSchema = useMemo(
    () =>
      z.object({
        goalId: z.string().min(1, { message: t("validation.goal_required") }),
        type: z.enum(["deposit", "withdrawal"]),
        amount: z.string().min(1, { message: t("validation.amount_required") }),
        category: z.string().optional(),
        occurred_on: z.string().min(1, { message: t("validation.date_required") }),
        memo: z.string().optional()
      }),
    [t]
  );

  const { mutateAsync: createGoalAsync, isPending: isCreatingGoal } = useMutation({
    mutationFn: createGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  const {
    control: goalControl,
    register: registerGoal,
    handleSubmit: handleCreateGoal,
    reset: resetGoalForm,
    formState: { errors: goalErrors }
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", description: "", target_amount: "", target_date: "", contribution_ratio: "" }
  });

  const onCreateGoal = async (data: GoalFormData) => {
    setGoalFormError(null);
    try {
      await createGoalAsync({
        title: data.title,
        description: data.description,
        target_amount: data.target_amount,
        target_date: data.target_date || undefined,
        contribution_ratio: data.contribution_ratio ? Number(data.contribution_ratio) : undefined
      });
      resetGoalForm({ title: "", description: "", target_amount: "", target_date: "", contribution_ratio: "" });
    } catch (err) {
      console.error(err);
      setGoalFormError(t("goals.form.error"));
    }
  };

  const firstGoalId = useMemo(() => (goals[0]?.id ? goals[0].id.toString() : ""), [goals]);
  const [selectedGoal, setSelectedGoal] = useState(firstGoalId);

  const {
    control: transactionControl,
    register: registerTransaction,
    handleSubmit: handleCreateTransaction,
    reset: resetTransactionForm,
    setValue: setTransactionValue,
    formState: { errors: transactionErrors }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { goalId: firstGoalId, type: "deposit", occurred_on: "" }
  });

  useEffect(() => {
    if (!goals.length) {
      setSelectedGoal("");
      setTransactionValue("goalId", "");
      return;
    }

    const hasCurrentGoal = goals.some((goal) => goal.id === Number(selectedGoal));
    if (!selectedGoal || !hasCurrentGoal) {
      const newGoalId = goals[0].id.toString();
      setSelectedGoal(newGoalId);
      setTransactionValue("goalId", newGoalId);
    }
  }, [goals, selectedGoal, setTransactionValue]);

  const { data: transactions = [], isFetching: isTransactionsFetching } = useQuery({
    queryKey: ["transactions", selectedGoal],
    queryFn: () => fetchTransactions(Number(selectedGoal)),
    enabled: !!selectedGoal
  });

  const { mutateAsync: createTransactionAsync, isPending: isCreatingTransaction } = useMutation({
    mutationFn: ({ goalId, payload }: { goalId: number; payload: TransactionPayload }) =>
      createTransaction(goalId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", String(variables.goalId)] });
    }
  });

  const onCreateTransaction = async (data: TransactionFormData) => {
    const goalId = Number(data.goalId);
    await createTransactionAsync({
      goalId,
      payload: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        occurred_on: data.occurred_on,
        memo: data.memo
      }
    });
    resetTransactionForm({
      goalId: data.goalId,
      type: "deposit",
      amount: "",
      occurred_on: "",
      category: "",
      memo: ""
    });
  };

  const displayGoal = useMemo(
    () => goals.find((goal) => goal.id === Number(selectedGoal)),
    [goals, selectedGoal]
  );

  const transactionTypeLabel = (value: string) =>
    value === "deposit" ? t("transactions.form.type.deposit") : t("transactions.form.type.withdrawal");

  return (
    <Stack gap={4}>
      <Typography variant="h4">{t("goals.title")}</Typography>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
        <Stack flex={1} gap={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("goals.add")}
            </Typography>
            {goalFormError ? <Alert severity="error">{goalFormError}</Alert> : null}
            <Stack
              component="form"
              gap={2}
              onSubmit={handleCreateGoal(onCreateGoal)}
              sx={{ maxWidth: { xs: "100%", sm: 480 } }}
            >
              <TextField
                label={t("goals.form.title")}
                error={!!goalErrors.title}
                helperText={goalErrors.title?.message}
                {...registerGoal("title")}
              />
              <TextField
                label={t("goals.form.description")}
                multiline
                minRows={2}
                helperText={t("common.optional")}
                {...registerGoal("description")}
              />
              <TextField
                label={t("goals.form.target_amount")}
                error={!!goalErrors.target_amount}
                helperText={goalErrors.target_amount?.message}
                {...registerGoal("target_amount")}
              />
              <Controller
                control={goalControl}
                name="target_date"
                render={({ field }) => (
                  <DatePicker
                    label={t("goals.form.target_date")}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(value) => field.onChange(value ? value.format("YYYY-MM-DD") : "")}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        onBlur: field.onBlur,
                        error: !!goalErrors.target_date,
                        helperText: goalErrors.target_date?.message ?? t("common.optional")
                      }
                    }}
                  />
                )}
              />
              <TextField
                label={t("goals.form.contribution_ratio")}
                {...registerGoal("contribution_ratio")}
                helperText={t("goals.form.contribution_ratio_hint")}
              />
              <Button type="submit" variant="contained" disabled={isCreatingGoal}>
                {isCreatingGoal ? t("goals.form.submitting") : t("goals.form.submit")}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("goals.list.title")}
            </Typography>
            {isGoalsFetching ? <LinearProgress /> : null}
            <Stack gap={2}>
              {goals.map((goal) => {
                const amount = parseFloat(goal.target_amount).toLocaleString();
                const date = goal.target_date ?? t("dashboard.na");
                const summary = t("goals.list.item")
                  .replace("{amount}", amount)
                  .replace("{date}", date);
                return (
                  <Paper key={goal.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">{goal.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {summary}
                    </Typography>
                  </Paper>
                );
              })}
            </Stack>
            {!goals.length && !isGoalsFetching ? (
              <Typography color="text.secondary">{t("goals.list.empty")}</Typography>
            ) : null}
          </Paper>
        </Stack>

        <Stack flex={1} gap={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("transactions.add")}
            </Typography>
            <Stack component="form" gap={2} onSubmit={handleCreateTransaction(onCreateTransaction)}>
              <Controller
                control={transactionControl}
                name="goalId"
                render={({ field }) => (
                  <TextField
                    select
                    label={t("transactions.form.goal")}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value);
                      setSelectedGoal(value);
                    }}
                    onBlur={field.onBlur}
                    error={!!transactionErrors.goalId}
                    helperText={transactionErrors.goalId?.message}
                  >
                    {goals.map((goal) => (
                      <MenuItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                select
                label={t("transactions.form.type")}
                defaultValue="deposit"
                {...registerTransaction("type")}
              >
                <MenuItem value="deposit">{t("transactions.form.type.deposit")}</MenuItem>
                <MenuItem value="withdrawal">{t("transactions.form.type.withdrawal")}</MenuItem>
              </TextField>
              <TextField
                label={t("transactions.form.amount")}
                error={!!transactionErrors.amount}
                helperText={transactionErrors.amount?.message}
                {...registerTransaction("amount")}
              />
              <TextField
                label={t("transactions.form.category")}
                helperText={t("common.optional")}
                {...registerTransaction("category")}
              />
              <Controller
                control={transactionControl}
                name="occurred_on"
                render={({ field }) => (
                  <DatePicker
                    label={t("transactions.form.date")}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(value) => field.onChange(value ? value.format("YYYY-MM-DD") : "")}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        onBlur: field.onBlur,
                        error: !!transactionErrors.occurred_on,
                        helperText: transactionErrors.occurred_on?.message
                      }
                    }}
                  />
                )}
              />
              <TextField
                label={t("transactions.form.memo")}
                multiline
                minRows={2}
                helperText={t("common.optional")}
                {...registerTransaction("memo")}
              />
              <Button type="submit" variant="contained" disabled={isCreatingTransaction || !goals.length}>
                {isCreatingTransaction ? t("transactions.form.submitting") : t("transactions.form.submit")}
              </Button>
            </Stack>
            {!goals.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("common.no_goals")}
              </Typography>
            ) : null}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{t("transactions.activity.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {displayGoal ? displayGoal.title : t("common.select_goal")}
              </Typography>
            </Box>
            {isTransactionsFetching ? (
              <Typography color="text.secondary">{t("transactions.activity.loading")}</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("transactions.table.date")}</TableCell>
                    <TableCell>{t("transactions.table.type")}</TableCell>
                    <TableCell>{t("transactions.table.category")}</TableCell>
                    <TableCell align="right">{t("transactions.table.amount")}</TableCell>
                    <TableCell>{t("transactions.table.memo")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.occurred_on}</TableCell>
                      <TableCell>{transactionTypeLabel(tx.type)}</TableCell>
                      <TableCell>{tx.category ?? t("transactions.table.placeholder")}</TableCell>
                      <TableCell align="right">
                        {Number(tx.amount).toLocaleString(undefined, { style: "currency", currency: "KRW" })}
                      </TableCell>
                      <TableCell>{tx.memo ?? t("transactions.table.placeholder")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!transactions.length && !isTransactionsFetching ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {t("transactions.activity.empty")}
              </Typography>
            ) : null}
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}
