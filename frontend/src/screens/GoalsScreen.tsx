import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import Button from "../components/Button";
import Card from "../components/Card";
import PickerField from "../components/PickerField";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { createGoal, createTransaction, fetchGoals, fetchTransactions, type Goal } from "../api/goals";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";

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

export default function GoalsScreen() {
  const { colors } = useThemePreference();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedGoal, setSelectedGoal] = useState<string>("");

  const {
    data: goals = [],
    isFetching: isGoalsFetching
  } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });

  useEffect(() => {
    if (!goals.length) {
      setSelectedGoal("");
      return;
    }
    if (!selectedGoal || !goals.some((goal) => goal.id === Number(selectedGoal))) {
      setSelectedGoal(goals[0].id.toString());
    }
  }, [goals, selectedGoal]);

  const {
    data: transactions = [],
    isFetching: isTransactionsFetching
  } = useQuery({
    queryKey: ["transactions", selectedGoal],
    queryFn: () => fetchTransactions(Number(selectedGoal)),
    enabled: !!selectedGoal
  });

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

  const {
    control: goalControl,
    handleSubmit: handleGoalSubmit,
    formState: { errors: goalErrors, isSubmitting: isCreatingGoal },
    reset: resetGoalForm
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      target_amount: "",
      target_date: "",
      contribution_ratio: ""
    }
  });

  const {
    control: transactionControl,
    handleSubmit: handleTransactionSubmit,
    formState: { errors: transactionErrors, isSubmitting: isCreatingTransaction },
    reset: resetTransactionForm,
    setValue: setTransactionValue
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      goalId: selectedGoal,
      type: "deposit",
      amount: "",
      category: "",
      occurred_on: dayjs().format("YYYY-MM-DD"),
      memo: ""
    }
  });

  useEffect(() => {
    if (selectedGoal) {
      setTransactionValue("goalId", selectedGoal);
    }
  }, [selectedGoal, setTransactionValue]);

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: ({ goalId, payload }: { goalId: number; payload: Omit<TransactionFormData, "goalId"> }) =>
      createTransaction(goalId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", variables.goalId.toString()] });
    }
  });

  const onCreateGoal = handleGoalSubmit(async (data) => {
    await createGoalMutation.mutateAsync({
      title: data.title,
      description: data.description,
      target_amount: data.target_amount,
      target_date: data.target_date || undefined,
      contribution_ratio: data.contribution_ratio ? Number(data.contribution_ratio) : undefined
    });
    resetGoalForm({
      title: "",
      description: "",
      target_amount: "",
      target_date: "",
      contribution_ratio: ""
    });
  });

  const onCreateTransaction = handleTransactionSubmit(async (data) => {
    const goalId = Number(data.goalId);
    await createTransactionMutation.mutateAsync({
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
      category: "",
      occurred_on: dayjs().format("YYYY-MM-DD"),
      memo: ""
    });
  });

  const selectedGoalObject = useMemo(
    () => goals.find((goal) => goal.id === Number(selectedGoal)),
    [goals, selectedGoal]
  );

  const totalSavedForSelectedGoal = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return 0;
    }
    return transactions.reduce((acc, txn) => {
      const amount = parseFloat(txn.amount);
      if (Number.isNaN(amount)) {
        return acc;
      }
      const signed = txn.type === "withdrawal" ? -amount : amount;
      return acc + signed;
    }, 0);
  }, [transactions]);

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("goals.title")}</Text>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("goals.add")}</Text>
          <View style={{ gap: 12 }}>
            <Controller
              control={goalControl}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("goals.form.title")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={goalErrors.title?.message}
                />
              )}
            />

            <Controller
              control={goalControl}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("goals.form.description")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={goalErrors.description?.message}
                  multiline
                />
              )}
            />

            <Controller
              control={goalControl}
              name="target_amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("goals.form.target_amount")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={goalErrors.target_amount?.message}
                />
              )}
            />

            <Controller
              control={goalControl}
              name="target_date"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("goals.form.target_date")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  error={goalErrors.target_date?.message}
                />
              )}
            />

            <Controller
              control={goalControl}
              name="contribution_ratio"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("goals.form.contribution_ratio")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  helperText={t("goals.form.contribution_ratio_hint")}
                  error={goalErrors.contribution_ratio?.message}
                />
              )}
            />

            <Button
              title={t("goals.form.submit")}
              onPress={onCreateGoal}
              loading={isCreatingGoal || createGoalMutation.isPending}
            />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("goals.list.title")}</Text>
          {isGoalsFetching ? (
            <ActivityIndicator color={colors.primary} />
          ) : goals.length ? (
            <View style={{ gap: 12 }}>
              {goals.map((goal) => {
                const targetAmount = Number.isNaN(parseFloat(goal.target_amount))
                  ? 0
                  : parseFloat(goal.target_amount);
                const progress = selectedGoal === goal.id.toString() ? totalSavedForSelectedGoal : undefined;
                return (
                  <View
                    key={goal.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                      backgroundColor: selectedGoal === goal.id.toString() ? colors.background : colors.surface,
                      gap: 4
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: colors.text }}>{goal.title}</Text>
                    <Text style={{ color: colors.muted }}>
                      {t("dashboard.target")}: {formatCurrency(targetAmount)}
                    </Text>
                    {goal.target_date ? (
                      <Text style={{ color: colors.muted }}>
                        {t("dashboard.due")}: {dayjs(goal.target_date).format("YYYY-MM-DD")}
                      </Text>
                    ) : null}
                    {progress !== undefined ? (
                      <Text style={{ color: colors.muted }}>
                        {t("dashboard.saved")}: {formatCurrency(progress)}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>{t("goals.list.empty")}</Text>
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("transactions.add")}</Text>
          <View style={{ gap: 12 }}>
            <Controller
              control={transactionControl}
              name="goalId"
              render={({ field: { value, onChange } }) => (
                <PickerField
                  label={t("transactions.form.goal")}
                  selectedValue={value}
                  onValueChange={(itemValue) => {
                    onChange(itemValue);
                    if (itemValue) {
                      setSelectedGoal(itemValue.toString());
                    }
                  }}
                  items={[
                    { label: t("common.select_goal"), value: "" },
                    ...goals.map((goal) => ({
                      label: goal.title,
                      value: goal.id.toString()
                    }))
                  ]}
                  error={transactionErrors.goalId?.message}
                />
              )}
            />

            <Controller
              control={transactionControl}
              name="type"
              render={({ field: { value, onChange } }) => (
                <PickerField
                  label={t("transactions.form.type")}
                  selectedValue={value}
                  onValueChange={onChange}
                  items={[
                    { label: t("transactions.form.type.deposit"), value: "deposit" },
                    { label: t("transactions.form.type.withdrawal"), value: "withdrawal" }
                  ]}
                />
              )}
            />

            <Controller
              control={transactionControl}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("transactions.form.amount")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={transactionErrors.amount?.message}
                />
              )}
            />

            <Controller
              control={transactionControl}
              name="category"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("transactions.form.category")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={transactionErrors.category?.message}
                />
              )}
            />

            <Controller
              control={transactionControl}
              name="occurred_on"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("transactions.form.date")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  error={transactionErrors.occurred_on?.message}
                />
              )}
            />

            <Controller
              control={transactionControl}
              name="memo"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("transactions.form.memo")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  multiline
                  error={transactionErrors.memo?.message}
                />
              )}
            />

            <Button
              title={t("transactions.form.submit")}
              onPress={onCreateTransaction}
              loading={isCreatingTransaction || createTransactionMutation.isPending}
            />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            {t("transactions.activity.title")}
          </Text>
          {selectedGoal ? (
            isTransactionsFetching ? (
              <ActivityIndicator color={colors.primary} />
            ) : Array.isArray(transactions) && transactions.length ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.muted }}>
                  {t("transactions.activity.subtitle")}: {selectedGoalObject?.title ?? "-"}
                </Text>
                {transactions.map((txn) => {
                  const amount = Number.isNaN(parseFloat(txn.amount)) ? 0 : parseFloat(txn.amount);
                  const isWithdrawal = txn.type === "withdrawal";
                  return (
                    <View
                      key={txn.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        gap: 4
                      }}
                    >
                      <Text style={{ fontWeight: "600", color: colors.text }}>
                        {dayjs(txn.occurred_on).format("YYYY-MM-DD")} ·{" "}
                        {isWithdrawal ? t("transactions.form.type.withdrawal") : t("transactions.form.type.deposit")}
                      </Text>
                      <Text style={{ color: isWithdrawal ? colors.danger : colors.secondary, fontWeight: "600" }}>
                        {isWithdrawal ? "-" : "+"}
                        {formatCurrency(amount)}
                      </Text>
                      {txn.category ? <Text style={{ color: colors.muted }}>{txn.category}</Text> : null}
                      {txn.memo ? <Text style={{ color: colors.muted }}>{txn.memo}</Text> : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>{t("transactions.activity.empty")}</Text>
            )
          ) : (
            <Text style={{ color: colors.muted }}>{t("common.no_goals")}</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}