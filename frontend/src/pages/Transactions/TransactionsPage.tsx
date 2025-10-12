import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@mui/x-date-pickers";

import {
  createTransaction,
  fetchGoals,
  fetchTransactions,
  type TransactionPayload
} from "../../api/goals";
import { useTranslation } from "../../providers/LanguageProvider";

type FormData = {
  goalId: string;
  type: "deposit" | "withdrawal";
  amount: string;
  category?: string;
  occurred_on: string;
  memo?: string;
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });
  const { t } = useTranslation();

  const schema = useMemo(
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

  const firstGoalId = goals[0]?.id ? goals[0].id.toString() : "";
  const [selectedGoal, setSelectedGoal] = useState(firstGoalId);

  useEffect(() => {
    if (!selectedGoal && firstGoalId) {
      setSelectedGoal(firstGoalId);
    }
  }, [firstGoalId, selectedGoal]);

  const { data: transactions = [], isFetching } = useQuery({
    queryKey: ["transactions", selectedGoal],
    queryFn: () => fetchTransactions(Number(selectedGoal)),
    enabled: !!selectedGoal
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ goalId, payload }: { goalId: number; payload: TransactionPayload }) =>
      createTransaction(goalId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", String(variables.goalId)] });
    }
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { goalId: firstGoalId, type: "deposit", occurred_on: "" }
  });

  const onSubmit = async (data: FormData) => {
    const goalId = Number(data.goalId);
    await mutateAsync({
      goalId,
      payload: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        occurred_on: data.occurred_on,
        memo: data.memo
      }
    });
    reset({
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
    <Stack gap={3}>
      <Typography variant="h4">{t("transactions.title")}</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("transactions.add")}
        </Typography>
        <Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)} direction="column">
          <TextField
            select
            label={t("transactions.form.goal")}
            defaultValue={firstGoalId}
            {...register("goalId", {
              onChange: (event) => setSelectedGoal(event.target.value)
            })}
            error={!!errors.goalId}
            helperText={errors.goalId?.message}
          >
            {goals.map((goal) => (
              <MenuItem key={goal.id} value={goal.id.toString()}>
                {goal.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("transactions.form.type")}
            defaultValue="deposit"
            {...register("type")}
          >
            <MenuItem value="deposit">{t("transactions.form.type.deposit")}</MenuItem>
            <MenuItem value="withdrawal">{t("transactions.form.type.withdrawal")}</MenuItem>
          </TextField>
          <TextField
            label={t("transactions.form.amount")}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            {...register("amount")}
          />
          <TextField
            label={t("transactions.form.category")}
            helperText={t("common.optional")}
            {...register("category")}
          />
          <Controller
            control={control}
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
                    error: !!errors.occurred_on,
                    helperText: errors.occurred_on?.message
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
            {...register("memo")}
          />
          <Button type="submit" variant="contained" disabled={isPending || !goals.length}>
            {isPending ? t("transactions.form.submitting") : t("transactions.form.submit")}
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
        {isFetching ? (
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
        {!transactions.length && !isFetching ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {t("transactions.activity.empty")}
          </Typography>
        ) : null}
      </Paper>
    </Stack>
  );
}
