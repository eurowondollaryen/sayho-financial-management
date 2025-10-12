import api from "./client";

export interface GoalPayload {
  title: string;
  description?: string;
  target_amount: string;
  target_date?: string;
  contribution_ratio?: number;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  target_amount: string;
  target_date?: string;
  status: string;
  created_at: string;
}

export interface TransactionPayload {
  type: "deposit" | "withdrawal";
  amount: string;
  category?: string;
  occurred_on: string;
  memo?: string;
}

export interface Transaction {
  id: number;
  goal_id: number;
  user_id: number;
  type: string;
  amount: string;
  category?: string;
  occurred_on: string;
  memo?: string;
  created_at: string;
}

export async function fetchGoals() {
  const { data } = await api.get<Goal[]>("/goals/");
  return data;
}

export async function createGoal(payload: GoalPayload) {
  const { data } = await api.post<Goal>("/goals/", payload);
  return data;
}

export async function fetchTransactions(goalId: number) {
  const { data } = await api.get<Transaction[]>(`/goals/${goalId}/transactions/`);
  return data;
}

export async function createTransaction(goalId: number, payload: TransactionPayload) {
  const { data } = await api.post<Transaction>(`/goals/${goalId}/transactions/`, payload);
  return data;
}
