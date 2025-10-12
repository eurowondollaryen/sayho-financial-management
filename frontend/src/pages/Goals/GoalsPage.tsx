import { useMemo, useState } from "react";
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
import { DatePicker } from "@mui/x-date-pickers";

import { createGoal, fetchGoals } from "../../api/goals";
import { useTranslation } from "../../providers/LanguageProvider";

type FormData = {
  title: string;
  description?: string;
  target_amount: string;
  target_date?: string;
  contribution_ratio?: string;
};

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const { data: goals = [], isFetching } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals
  });

  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(
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

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", target_amount: "", target_date: "", contribution_ratio: "" }
  });

  const onSubmit = async (data: FormData) => {
    setFormError(null);
    try {
      await mutateAsync({
        title: data.title,
        description: data.description,
        target_amount: data.target_amount,
        target_date: data.target_date || undefined,
        contribution_ratio: data.contribution_ratio ? Number(data.contribution_ratio) : undefined
      });
      reset({ title: "", description: "", target_amount: "", target_date: "", contribution_ratio: "" });
    } catch (err) {
      console.error(err);
      setFormError(t("goals.form.error"));
    }
  };

  return (
    <Stack gap={3}>
      <Typography variant="h4">{t("goals.title")}</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("goals.add")}
        </Typography>
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <Stack
          component="form"
          gap={2}
          onSubmit={handleSubmit(onSubmit)}
          sx={{ maxWidth: 480 }}
        >
          <TextField
            label={t("goals.form.title")}
            error={!!errors.title}
            helperText={errors.title?.message}
            {...register("title")}
          />
          <TextField
            label={t("goals.form.description")}
            multiline
            minRows={2}
            helperText={t("common.optional")}
            {...register("description")}
          />
          <TextField
            label={t("goals.form.target_amount")}
            error={!!errors.target_amount}
            helperText={errors.target_amount?.message}
            {...register("target_amount")}
          />
          <Controller
            control={control}
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
                    error: !!errors.target_date,
                    helperText: errors.target_date?.message ?? t("common.optional")
                  }
                }}
              />
            )}
          />
          <TextField
            label={t("goals.form.contribution_ratio")}
            {...register("contribution_ratio")}
            helperText={t("goals.form.contribution_ratio_hint")}
          />
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? t("goals.form.submitting") : t("goals.form.submit")}
          </Button>
        </Stack>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("goals.list.title")}
        </Typography>
        {isFetching ? <LinearProgress /> : null}
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
        {!goals.length && !isFetching ? (
          <Typography color="text.secondary">{t("goals.list.empty")}</Typography>
        ) : null}
      </Paper>
    </Stack>
  );
}
