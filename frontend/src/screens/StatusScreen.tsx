import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import Button from "../components/Button";
import Card from "../components/Card";
import PickerField from "../components/PickerField";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import {
  createFundCategory,
  createFundSnapshot,
  deleteFundCategory,
  deleteFundSnapshot,
  fetchFundCategories,
  fetchFundSnapshots,
  updateFundCategory,
  type AssetCategoryType,
  type FundCategory
} from "../api/fundStatus";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";

type CategoryFormData = {
  asset_type: AssetCategoryType;
  name: string;
  note?: string;
  is_active: boolean;
  is_liquid: boolean;
};

type SnapshotFormData = {
  reference_date: string;
  category_id?: string;
  amount: string;
};

export default function StatusScreen() {
  const { colors } = useThemePreference();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isFetching: isCategoriesFetching
  } = useQuery({
    queryKey: ["fund-categories"],
    queryFn: fetchFundCategories
  });

  const {
    data: snapshots = [],
    isFetching: isSnapshotsFetching
  } = useQuery({
    queryKey: ["fund-snapshots"],
    queryFn: fetchFundSnapshots
  });

  const categorySchema = useMemo(
    () =>
      z.object({
        asset_type: z.enum(["real_estate", "stock", "deposit", "liability", "savings"]),
        name: z.string().min(1, { message: t("validation.title_min") }),
        note: z.string().optional(),
        is_active: z.boolean(),
        is_liquid: z.boolean()
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
    formState: { errors: categoryErrors, isSubmitting: isAddingCategory }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      asset_type: "real_estate",
      name: "",
      note: "",
      is_active: true,
      is_liquid: false
    }
  });

  const {
    control: snapshotControl,
    handleSubmit: handleSnapshotSubmit,
    reset: resetSnapshotForm,
    formState: { errors: snapshotErrors, isSubmitting: isAddingSnapshot }
  } = useForm<SnapshotFormData>({
    resolver: zodResolver(snapshotSchema),
    defaultValues: {
      reference_date: dayjs().format("YYYY-MM-DD"),
      category_id: "",
      amount: ""
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: createFundCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-categories"] });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: number;
      payload: Partial<Pick<CategoryFormData, "is_active" | "is_liquid">>;
    }) => updateFundCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-categories"] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteFundCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-categories"] });
      queryClient.invalidateQueries({ queryKey: ["fund-snapshots"] });
    },
    onError: (error) => {
      console.error(error);
      Alert.alert(t("common.error"), t("common.delete_failed"));
    }
  });

  const createSnapshotMutation = useMutation({
    mutationFn: createFundSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-snapshots"] });
    }
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: deleteFundSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund-snapshots"] });
    },
    onError: (error) => {
      console.error(error);
      Alert.alert(t("common.error"), t("common.delete_failed"));
    }
  });

  const submitCategory = handleCategorySubmit(async (data) => {
    await createCategoryMutation.mutateAsync({
      asset_type: data.asset_type,
      name: data.name,
      note: data.note,
      is_active: data.is_active,
      is_liquid: data.is_liquid
    });
    resetCategoryForm({
      asset_type: "real_estate",
      name: "",
      note: "",
      is_active: true,
      is_liquid: false
    });
  });

  const submitSnapshot = handleSnapshotSubmit(async (data) => {
    await createSnapshotMutation.mutateAsync({
      reference_date: data.reference_date,
      amount: data.amount,
      category_id: data.category_id ? Number(data.category_id) : undefined
    });
    resetSnapshotForm({
      reference_date: dayjs().format("YYYY-MM-DD"),
      amount: "",
      category_id: ""
    });
  });

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

  const handleToggleCategory = (category: FundCategory, field: "is_active" | "is_liquid", value: boolean) => {
    updateCategoryMutation.mutate({
      id: category.id,
      payload: {
        [field]: value
      }
    });
  };

  const handleDeleteCategory = (category: FundCategory) => {
    Alert.alert(t("status.categories.delete_confirm_title"), category.name, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteCategoryMutation.mutate(category.id)
      }
    ]);
  };

  const handleDeleteSnapshot = (snapshotId: number) => {
    Alert.alert(t("status.snapshots.delete_confirm_title"), t("status.snapshots.delete_confirm_message"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteSnapshotMutation.mutate(snapshotId)
      }
    ]);
  };

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("status.title")}</Text>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("status.categories.title")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {assetTypeOptions.map((option) => (
                <View
                  key={option.value}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: colors.background
                  }}
                >
                  <Text style={{ color: colors.muted }}>{option.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={{ gap: 12 }}>
            <Controller
              control={categoryControl}
              name="asset_type"
              render={({ field: { value, onChange } }) => (
                <PickerField
                  label={t("status.categories.type")}
                  selectedValue={value}
                  onValueChange={onChange}
                  items={assetTypeOptions}
                />
              )}
            />

            <Controller
              control={categoryControl}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("status.categories.name")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={categoryErrors.name?.message}
                />
              )}
            />

            <Controller
              control={categoryControl}
              name="note"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("status.categories.note")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={categoryErrors.note?.message}
                  multiline
                />
              )}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.text }}>{t("status.categories.is_active")}</Text>
              <Controller
                control={categoryControl}
                name="is_active"
                render={({ field: { value, onChange } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                )}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.text }}>{t("status.categories.is_liquid")}</Text>
              <Controller
                control={categoryControl}
                name="is_liquid"
                render={({ field: { value, onChange } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.border, true: colors.secondary }}
                    thumbColor="#fff"
                  />
                )}
              />
            </View>

            <Button
              title={t("status.categories.submit")}
              onPress={submitCategory}
              loading={isAddingCategory || createCategoryMutation.isPending}
            />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            {t("status.categories.list_title")}
          </Text>
          {isCategoriesFetching ? (
            <ActivityIndicator color={colors.primary} />
          ) : categories.length ? (
            <View style={{ gap: 12 }}>
              {categories.map((category) => (
                <View
                  key={category.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    gap: 6
                  }}
                >
                  <Text style={{ fontWeight: "600", color: colors.text }}>{category.name}</Text>
                  <Text style={{ color: colors.muted }}>
                    {t("status.categories.type")}: {assetTypeOptions.find((opt) => opt.value === category.asset_type)?.label}
                  </Text>
                  {category.note ? <Text style={{ color: colors.muted }}>{category.note}</Text> : null}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.text }}>{t("status.categories.active")}</Text>
                    <Switch
                      value={category.is_active}
                      onValueChange={(value) => handleToggleCategory(category, "is_active", value)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.text }}>{t("status.categories.is_liquid")}</Text>
                    <Switch
                      value={category.is_liquid}
                      onValueChange={(value) => handleToggleCategory(category, "is_liquid", value)}
                      trackColor={{ false: colors.border, true: colors.secondary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <Button title={t("common.delete")} variant="text" onPress={() => handleDeleteCategory(category)} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>{t("status.categories.empty")}</Text>
          )}
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("status.snapshots.add")}</Text>
          <View style={{ gap: 12 }}>
            <Controller
              control={snapshotControl}
              name="reference_date"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("status.snapshots.date")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DD"
                  error={snapshotErrors.reference_date?.message}
                />
              )}
            />

            <Controller
              control={snapshotControl}
              name="category_id"
              render={({ field: { value, onChange } }) => (
                <PickerField
                  label={t("status.snapshots.category")}
                  selectedValue={value}
                  onValueChange={onChange}
                  items={[
                    { label: t("status.snapshots.no_category"), value: "" },
                    ...categories.map((category) => ({
                      label: category.name,
                      value: category.id.toString()
                    }))
                  ]}
                  error={snapshotErrors.category_id?.message}
                />
              )}
            />

            <Controller
              control={snapshotControl}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("status.snapshots.amount")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={snapshotErrors.amount?.message}
                />
              )}
            />

            <Button
              title={t("status.snapshots.submit")}
              onPress={submitSnapshot}
              loading={isAddingSnapshot || createSnapshotMutation.isPending}
            />
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("status.snapshots.title")}</Text>
          {isSnapshotsFetching ? (
            <ActivityIndicator color={colors.primary} />
          ) : Array.isArray(snapshots) && snapshots.length ? (
            <View style={{ gap: 12 }}>
              {snapshots.map((snapshot) => (
                <View
                  key={snapshot.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    gap: 6
                  }}
                >
                  <Text style={{ fontWeight: "600", color: colors.text }}>
                    {dayjs(snapshot.reference_date).format("YYYY-MM-DD")}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {t("status.snapshots.category")}: {snapshot.category?.name ?? t("status.snapshots.no_category")}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {t("status.snapshots.amount")}: {snapshot.amount}
                  </Text>
                  <Button
                    title={t("common.delete")}
                    variant="text"
                    onPress={() => handleDeleteSnapshot(snapshot.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>{t("status.snapshots.table.empty")}</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}
