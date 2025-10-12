import { useMemo } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControlLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker } from "@mui/x-date-pickers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createFundCategory,
  createFundSnapshot,
  deleteFundSnapshot,
  fetchFundCategories,
  fetchFundSnapshots,
  type AssetCategoryType,
  type FundCategory,
  type FundSnapshot,
  updateFundCategory
} from "../../api/fundStatus";
import { useTranslation } from "../../providers/LanguageProvider";

type CategoryFormData = {
  asset_type: AssetCategoryType;
  name: string;
  note?: string;
  is_active: boolean;
};

type SnapshotFormData = {
  reference_date: string;
  category_id?: string;
  amount: string;
};

export default function StatusPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: categoriesData,
    isLoading: isLoadingCategories
  } = useQuery({
    queryKey: ["fund-categories"],
    queryFn: fetchFundCategories
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const {
    data: snapshotsData,
    isLoading: isLoadingSnapshots
  } = useQuery({
    queryKey: ["fund-snapshots"],
    queryFn: fetchFundSnapshots
  });

  const snapshots = Array.isArray(snapshotsData) ? snapshotsData : [];

  const assetTypeOptions = useMemo(
    () => [
      { value: "real_estate" as AssetCategoryType, label: t("status.categories.type.real_estate") },
      { value: "stock" as AssetCategoryType, label: t("status.categories.type.stock") },
      { value: "deposit" as AssetCategoryType, label: t("status.categories.type.deposit") },
      { value: "liability" as AssetCategoryType, label: t("status.categories.type.liability") },
      { value: "savings" as AssetCategoryType, label: t("status.categories.type.savings") }
    ],
    [t]
  );

  const categorySchema = useMemo(
    () =>
      z.object({
        asset_type: z.enum(["real_estate", "stock", "deposit", "liability", "savings"]),
        name: z.string().min(1, { message: t("validation.title_min") }),
        note: z.string().optional(),
        is_active: z.boolean()
      }),
    [t]
  );

  const snapshotSchema = useMemo(
    () =>
      z.object({
        reference_date: z.string().min(1, { message: t("validation.date_required") }),
        category_id: z.string().optional(),
        amount: z.string().min(1, { message: t("validation.amount_required") })
      }),
    [t]
  );

  const {
    control: categoryControl,
    handleSubmit: handleCategorySubmit,
    reset: resetCategoryForm,
    register: registerCategory,
    formState: { errors: categoryErrors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      asset_type: "real_estate",
      name: "",
      note: "",
      is_active: true
    }
  });

  const {
    control: snapshotControl,
    handleSubmit: handleSnapshotSubmit,
    reset: resetSnapshotForm,
    register: registerSnapshot,
    formState: { errors: snapshotErrors }
  } = useForm<SnapshotFormData>({
    resolver: zodResolver(snapshotSchema),
    defaultValues: {
      reference_date: "",
      category_id: "",
      amount: ""
    }
  });

  const categoryMutation = useMutation({
    mutationFn: createFundCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-categories"] });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateFundCategory(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-categories"] });
    }
  });

  const snapshotMutation = useMutation({
    mutationFn: createFundSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-snapshots"] });
    }
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: deleteFundSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-snapshots"] });
    }
  });

  const onSubmitCategory = async (data: CategoryFormData) => {
    await categoryMutation.mutateAsync({
      asset_type: data.asset_type,
      name: data.name,
      note: data.note,
      is_active: data.is_active
    });
    resetCategoryForm({
      asset_type: "real_estate",
      name: "",
      note: "",
      is_active: true
    });
  };

  const onSubmitSnapshot = async (data: SnapshotFormData) => {
    await snapshotMutation.mutateAsync({
      reference_date: data.reference_date,
      amount: data.amount,
      category_id: data.category_id ? Number(data.category_id) : undefined
    });
    resetSnapshotForm({
      reference_date: "",
      category_id: "",
      amount: ""
    });
  };

  const handleToggleCategoryActive = (category: FundCategory, nextValue: boolean) => {
    updateCategoryMutation.mutate({ id: category.id, is_active: nextValue });
  };

  const handleDeleteSnapshot = (snapshotId: number) => {
    deleteSnapshotMutation.mutate(snapshotId);
  };

  return (
    <Stack gap={3}>
      <Typography variant="h4">{t("status.title")}</Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t("status.categories.title")}
          </Typography>
          <Stack
            component="form"
            gap={2}
            onSubmit={handleCategorySubmit(onSubmitCategory)}
            sx={{ mb: 3 }}
          >
            <Controller
              control={categoryControl}
              name="asset_type"
              render={({ field }) => (
                <TextField
                  select
                  label={t("status.categories.type")}
                  value={field.value}
                  onChange={field.onChange}
                >
                  {assetTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label={t("status.categories.name")}
              error={!!categoryErrors.name}
              helperText={categoryErrors.name?.message}
              {...registerCategory("name")}
            />
            <TextField
              label={t("status.categories.note")}
              helperText={t("common.optional")}
              {...registerCategory("note")}
            />
            <Controller
              control={categoryControl}
              name="is_active"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, value) => field.onChange(value)} />}
                  label={field.value ? t("status.categories.active") : t("status.categories.inactive")}
                />
              )}
            />
            <Button type="submit" variant="contained" disabled={categoryMutation.isPending}>
              {categoryMutation.isPending ? t("transactions.form.submitting") : t("status.categories.submit")}
            </Button>
            {categoryMutation.isError ? (
              <Alert severity="error">{t("goals.form.error")}</Alert>
            ) : null}
          </Stack>
          {isLoadingCategories ? (
            <LinearProgress />
          ) : categories.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("status.categories.name")}</TableCell>
                  <TableCell>{t("status.categories.type")}</TableCell>
                  <TableCell>{t("status.categories.is_active")}</TableCell>
                  <TableCell>{t("status.categories.note")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => {
                  const typeLabel =
                    assetTypeOptions.find((option) => option.value === category.asset_type)?.label ??
                    category.asset_type;
                  return (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{typeLabel}</TableCell>
                      <TableCell>
                        <Switch
                          checked={category.is_active}
                          onChange={(_, value) => handleToggleCategoryActive(category, value)}
                          disabled={updateCategoryMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>{category.note || t("transactions.table.placeholder")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">{t("status.categories.empty")}</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t("status.snapshots.title")}
          </Typography>
          <Stack component="form" gap={2} onSubmit={handleSnapshotSubmit(onSubmitSnapshot)} sx={{ mb: 3 }}>
            <Controller
              control={snapshotControl}
              name="reference_date"
              render={({ field }) => (
                <DatePicker
                  label={t("status.snapshots.date")}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(value) => field.onChange(value ? value.format("YYYY-MM-DD") : "")}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      onBlur: field.onBlur,
                      error: !!snapshotErrors.reference_date,
                      helperText: snapshotErrors.reference_date?.message
                    }
                  }}
                />
              )}
            />
            <TextField
              select
              label={t("status.snapshots.category")}
              defaultValue=""
              {...registerSnapshot("category_id")}
              helperText={t("common.optional")}
            >
              <MenuItem value="">{t("status.snapshots.no_category")}</MenuItem>
              {categories
                .filter((category) => category.is_active)
                .map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label={t("status.snapshots.amount")}
              error={!!snapshotErrors.amount}
              helperText={snapshotErrors.amount?.message}
              {...registerSnapshot("amount")}
            />
            <Button type="submit" variant="contained" disabled={snapshotMutation.isPending}>
              {snapshotMutation.isPending ? t("transactions.form.submitting") : t("status.snapshots.submit")}
            </Button>
            {snapshotMutation.isError ? (
              <Alert severity="error">{t("goals.form.error")}</Alert>
            ) : null}
          </Stack>
          {isLoadingSnapshots ? (
            <LinearProgress />
          ) : snapshots.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("status.snapshots.table.date")}</TableCell>
                  <TableCell>{t("status.snapshots.table.category")}</TableCell>
                  <TableCell align="right">{t("status.snapshots.table.amount")}</TableCell>
                  <TableCell>{t("status.snapshots.table.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshots.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell>{snapshot.reference_date}</TableCell>
                    <TableCell>{snapshot.category?.name ?? t("status.snapshots.no_category")}</TableCell>
                    <TableCell align="right">
                      {Number(snapshot.amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: "KRW"
                      })}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSnapshot(snapshot.id)}
                        disabled={deleteSnapshotMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">{t("status.snapshots.table.empty")}</Typography>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}
