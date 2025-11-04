import api from "./client";

export type AssetCategoryType = "real_estate" | "stock" | "deposit" | "liability" | "savings";

export interface FundCategory {
  id: number;
  user_id: number;
  asset_type: AssetCategoryType;
  name: string;
  is_active: boolean;
  is_liquid: boolean;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundCategoryPayload {
  asset_type: AssetCategoryType;
  name: string;
  is_active?: boolean;
  is_liquid?: boolean;
  note?: string;
}

export interface FundCategoryUpdatePayload {
  asset_type?: AssetCategoryType;
  name?: string;
  is_active?: boolean;
  is_liquid?: boolean;
  note?: string | null;
}

export interface FundSnapshot {
  id: number;
  user_id: number;
  reference_date: string;
  amount: string;
  category_id?: number | null;
  created_at: string;
  category?: FundCategory | null;
}

export interface FundSnapshotPayload {
  reference_date: string;
  amount: string;
  category_id?: number | null;
}

export interface FundSnapshotUpdatePayload {
  reference_date?: string;
  amount?: string;
  category_id?: number | null;
}

export async function fetchFundCategories() {
  const { data } = await api.get<FundCategory[]>("/fund-categories/");
  return data;
}

export async function createFundCategory(payload: FundCategoryPayload) {
  const { data } = await api.post<FundCategory>("/fund-categories/", payload);
  return data;
}

export async function updateFundCategory(categoryId: number, payload: FundCategoryUpdatePayload) {
  const { data } = await api.patch<FundCategory>(`/fund-categories/${categoryId}`, payload);
  return data;
}

export async function deleteFundCategory(categoryId: number) {
  await api.delete(`/fund-categories/${categoryId}/`);
}

export async function fetchFundSnapshots() {
  const { data } = await api.get<FundSnapshot[]>("/fund-snapshots/");
  return data;
}

export async function createFundSnapshot(payload: FundSnapshotPayload) {
  const { data } = await api.post<FundSnapshot>("/fund-snapshots/", payload);
  return data;
}

export async function updateFundSnapshot(snapshotId: number, payload: FundSnapshotUpdatePayload) {
  const { data } = await api.patch<FundSnapshot>(`/fund-snapshots/${snapshotId}`, payload);
  return data;
}

export async function deleteFundSnapshot(snapshotId: number) {
  await api.delete(`/fund-snapshots/${snapshotId}/`);
}

