import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type Language = "ko" | "en";

export type TranslationKey =
  | "app.title"
  | "app.logout"
  | "nav.dashboard"
  | "nav.status"
  | "nav.goals"
  | "nav.transactions"
  | "nav.settings"
  | "auth.login_required"
  | "login.title"
  | "login.email"
  | "login.password"
  | "login.submit"
  | "login.submitting"
  | "login.error"
  | "login.signup_prompt"
  | "login.signup_link"
  | "signup.title"
  | "signup.email"
  | "signup.name"
  | "signup.password"
  | "signup.confirm_password"
  | "signup.submit"
  | "signup.submitting"
  | "signup.error"
  | "signup.login_prompt"
  | "signup.login_link"
  | "error.password_mismatch"
  | "dashboard.overview"
  | "dashboard.target"
  | "dashboard.saved"
  | "dashboard.progress"
  | "dashboard.due"
  | "dashboard.na"
  | "dashboard.empty"
  | "dashboard.fund_trend_title"
  | "dashboard.fund_trend_empty"
  | "dashboard.fund_trend_hint"
  | "dashboard.fund_trend_total_label"
  | "dashboard.fund_trend_liquid_label"
  | "dashboard.goal_progress_title"
  | "status.title"
  | "status.categories.title"
  | "status.categories.add"
  | "status.categories.type"
  | "status.categories.type.real_estate"
  | "status.categories.type.stock"
  | "status.categories.type.deposit"
  | "status.categories.type.liability"
  | "status.categories.type.savings"
  | "status.categories.name"
  | "status.categories.is_active"
  | "status.categories.is_liquid"
  | "status.categories.liquid"
  | "status.categories.illiquid"
  | "status.categories.note"
  | "status.categories.actions"
  | "status.categories.submit"
  | "status.categories.empty"
  | "status.categories.active"
  | "status.categories.inactive"
  | "status.categories.list_title"
  | "status.snapshots.title"
  | "status.snapshots.add"
  | "status.snapshots.date"
  | "status.snapshots.category"
  | "status.snapshots.amount"
  | "status.snapshots.submit"
  | "status.snapshots.table.date"
  | "status.snapshots.table.category"
  | "status.snapshots.table.amount"
  | "status.snapshots.table.actions"
  | "status.snapshots.table.empty"
  | "status.snapshots.delete"
  | "status.snapshots.no_category"
  | "status.snapshots.template_download"
  | "status.snapshots.template_download_error"
  | "status.snapshots.upload"
  | "status.snapshots.upload_success"
  | "status.snapshots.upload_error"
  | "status.snapshots.upload_help"
  | "goals.title"
  | "goals.add"
  | "goals.form.error"
  | "goals.form.title"
  | "goals.form.description"
  | "goals.form.target_amount"
  | "goals.form.target_amount_error"
  | "goals.form.target_date"
  | "goals.form.contribution_ratio"
  | "goals.form.contribution_ratio_hint"
  | "goals.form.submit"
  | "goals.form.submitting"
  | "goals.list.title"
  | "goals.list.item"
  | "goals.list.empty"
  | "transactions.title"
  | "transactions.add"
  | "transactions.form.goal"
  | "transactions.form.type"
  | "transactions.form.type.deposit"
  | "transactions.form.type.withdrawal"
  | "transactions.form.amount"
  | "transactions.form.category"
  | "transactions.form.date"
  | "transactions.form.memo"
  | "transactions.form.submit"
  | "transactions.form.submitting"
  | "transactions.activity.title"
  | "transactions.activity.subtitle"
  | "transactions.activity.loading"
  | "transactions.activity.empty"
  | "transactions.table.date"
  | "transactions.table.type"
  | "transactions.table.category"
  | "transactions.table.amount"
  | "transactions.table.memo"
  | "transactions.table.placeholder"
  | "settings.title"
  | "settings.profile.title"
  | "settings.profile.success"
  | "settings.profile.error"
  | "settings.profile.name"
  | "settings.profile.theme"
  | "settings.profile.theme.light"
  | "settings.profile.theme.dark"
  | "settings.profile.submit"
  | "settings.profile.submitting"
  | "settings.password.title"
  | "settings.password.success"
  | "settings.password.error"
  | "settings.password.current"
  | "settings.password.new"
  | "settings.password.confirm"
  | "settings.password.submit"
  | "settings.password.submitting"
  | "language.label"
  | "language.korean"
  | "language.english"
  | "common.select_goal"
  | "common.no_goals"
  | "common.loading"
  | "common.optional"
  | "common.delete"
  | "common.chart_not_supported"
  | "validation.email"
  | "validation.password_min"
  | "validation.name_min"
  | "validation.title_min"
  | "validation.goal_required"
  | "validation.amount_required"
  | "validation.date_required";

type Translations = Record<Language, Record<TranslationKey, string>>;

const translations: Translations = {
  ko: {
    "app.title": "자금관리",
    "app.logout": "로그아웃",
    "auth.login_required": "로그인이 필요합니다. 다시 로그인해주세요.",
    "nav.dashboard": "대시보드",
    "nav.status": "현황",
    "nav.goals": "목표",
    "nav.transactions": "내역",
    "nav.settings": "설정",
    "login.title": "로그인",
    "login.email": "이메일",
    "login.password": "비밀번호",
    "login.submit": "로그인",
    "login.submitting": "로그인 중...",
    "login.error": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "login.signup_prompt": "처음이신가요?",
    "login.signup_link": "회원가입",
    "signup.title": "회원가입",
    "signup.email": "이메일",
    "signup.name": "이름",
    "signup.password": "비밀번호",
    "signup.confirm_password": "비밀번호 확인",
    "signup.submit": "계정 만들기",
    "signup.submitting": "생성 중...",
    "signup.error": "계정을 생성할 수 없습니다.",
    "signup.login_prompt": "이미 계정이 있으신가요?",
    "signup.login_link": "로그인",
    "error.password_mismatch": "비밀번호가 일치해야 합니다.",
    "dashboard.overview": "개요",
    "dashboard.target": "목표 금액",
    "dashboard.saved": "누적 적립액",
    "dashboard.progress": "진행률",
    "dashboard.due": "목표일",
    "dashboard.na": "미정",
    "dashboard.empty": "첫 번째 목표를 생성해보세요.",
    "dashboard.fund_trend_title": "자금 추이",
    "dashboard.fund_trend_empty": "등록된 자금 현황이 없습니다.",
    "dashboard.fund_trend_hint": "그래프를 좌우로 스크롤하여 더 많은 시점을 확인하세요.",
    "dashboard.fund_trend_total_label": "시점별 전체 자금 합계",
    "dashboard.fund_trend_liquid_label": "시점별 유동성 자금 합계",
    "dashboard.goal_progress_title": "목표 달성 현황",
    "status.title": "현황",
    "status.categories.title": "자금구분 관리",
    "status.categories.add": "자금구분 등록",
    "status.categories.type": "금액구분",
    "status.categories.type.real_estate": "부동산",
    "status.categories.type.stock": "주식",
    "status.categories.type.deposit": "예금",
    "status.categories.type.liability": "부채",
    "status.categories.type.savings": "적금",
    "status.categories.name": "명칭",
    "status.categories.is_active": "사용여부",
    "status.categories.is_liquid": "유동성 여부",
    "status.categories.liquid": "유동성 있음",
    "status.categories.illiquid": "유동성 없음",
    "status.categories.note": "비고",
    "status.categories.actions": "관리",
    "status.categories.submit": "등록",
    "status.categories.empty": "등록된 자금구분이 없습니다.",
    "status.categories.active": "사용",
    "status.categories.inactive": "미사용",
    "status.categories.list_title": "자금구분 목록",
    "status.snapshots.title": "시점별 현황",
    "status.snapshots.add": "현황 등록",
    "status.snapshots.date": "기준일자",
    "status.snapshots.category": "자금구분",
    "status.snapshots.amount": "금액",
    "status.snapshots.submit": "등록",
    "status.snapshots.table.date": "기준일자",
    "status.snapshots.table.category": "자금구분",
    "status.snapshots.table.amount": "금액",
    "status.snapshots.table.actions": "관리",
    "status.snapshots.table.empty": "등록된 현황이 없습니다.",
    "status.snapshots.delete": "삭제",
    "status.snapshots.no_category": "미지정",
    "status.snapshots.template_download": "양식 다운로드",
    "status.snapshots.template_download_error": "엑셀 양식을 다운로드할 수 없습니다.",
    "status.snapshots.upload": "엑셀 업로드",
    "status.snapshots.upload_success": "엑셀 데이터가 업로드되었습니다.",
    "status.snapshots.upload_error": "엑셀 데이터를 업로드할 수 없습니다.",
    "status.snapshots.upload_help": "XLSX 파일을 사용하고, 헤더는 [기준일자, 자금구분, 금액] 순서로 입력해주세요.",
    "goals.title": "목표",
    "goals.add": "새 목표 추가",
    "goals.form.error": "목표를 생성할 수 없습니다.",
    "goals.form.title": "제목",
    "goals.form.description": "설명",
    "goals.form.target_amount": "목표 금액",
    "goals.form.target_amount_error": "목표 금액을 입력하세요.",
    "goals.form.target_date": "목표 날짜 (YYYY-MM-DD)",
    "goals.form.contribution_ratio": "분담 비율 (0-1)",
    "goals.form.contribution_ratio_hint": "선택 항목 - 이 사용자 비율",
    "goals.form.submit": "목표 생성",
    "goals.form.submitting": "저장 중...",
    "goals.list.title": "등록된 목표",
    "goals.list.item": "목표 ₩{amount} · 기한 {date}",
    "goals.list.empty": "아직 목표가 없습니다.",
    "transactions.title": "거래 내역",
    "transactions.add": "거래 등록",
    "transactions.form.goal": "목표",
    "transactions.form.type": "유형",
    "transactions.form.type.deposit": "입금",
    "transactions.form.type.withdrawal": "출금",
    "transactions.form.amount": "금액",
    "transactions.form.category": "카테고리",
    "transactions.form.date": "날짜 (YYYY-MM-DD)",
    "transactions.form.memo": "메모",
    "transactions.form.submit": "내역 추가",
    "transactions.form.submitting": "저장 중...",
    "transactions.activity.title": "최근 활동",
    "transactions.activity.subtitle": "선택된 목표",
    "transactions.activity.loading": "불러오는 중...",
    "transactions.activity.empty": "등록된 내역이 없습니다.",
    "transactions.table.date": "날짜",
    "transactions.table.type": "유형",
    "transactions.table.category": "카테고리",
    "transactions.table.amount": "금액",
    "transactions.table.memo": "메모",
    "transactions.table.placeholder": "-",
    "settings.title": "설정",
    "settings.profile.title": "프로필",
    "settings.profile.success": "프로필이 업데이트되었습니다.",
    "settings.profile.error": "프로필을 업데이트하지 못했습니다.",
    "settings.profile.name": "이름",
    "settings.profile.theme": "테마",
    "settings.profile.theme.light": "라이트",
    "settings.profile.theme.dark": "다크",
    "settings.profile.submit": "변경사항 저장",
    "settings.profile.submitting": "저장 중...",
    "settings.password.title": "비밀번호",
    "settings.password.success": "비밀번호가 변경되었습니다.",
    "settings.password.error": "비밀번호를 변경하지 못했습니다.",
    "settings.password.current": "현재 비밀번호",
    "settings.password.new": "새 비밀번호",
    "settings.password.confirm": "비밀번호 확인",
    "settings.password.submit": "비밀번호 변경",
    "settings.password.submitting": "변경 중...",
    "language.label": "언어",
    "language.korean": "한국어",
    "language.english": "English",
    "common.select_goal": "목표를 선택하세요",
    "common.no_goals": "등록된 목표가 없습니다.",
    "common.loading": "불러오는 중...",
    "common.optional": "선택 항목",
    "common.delete": "삭제",
    "common.chart_not_supported": "이 플랫폼에서는 그래프를 지원하지 않습니다.",
    "validation.email": "유효한 이메일을 입력하세요.",
    "validation.password_min": "비밀번호는 최소 8자 이상이어야 합니다.",
    "validation.name_min": "이름은 최소 2자 이상이어야 합니다.",
    "validation.title_min": "제목은 최소 2자 이상이어야 합니다.",
    "validation.goal_required": "목표를 선택하세요.",
    "validation.amount_required": "금액을 입력하세요.",
    "validation.date_required": "날짜를 입력하세요."
  },
  en: {
    "app.title": "Financial Management",
    "app.logout": "Logout",
    "auth.login_required": "Please log in to continue.",
    "nav.dashboard": "Dashboard",
    "nav.status": "Status",
    "nav.goals": "Goals",
    "nav.transactions": "Transactions",
    "nav.settings": "Settings",
    "login.title": "Sign in",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in...",
    "login.error": "Invalid credentials",
    "login.signup_prompt": "New here?",
    "login.signup_link": "Create an account",
    "signup.title": "Create account",
    "signup.email": "Email",
    "signup.name": "Name",
    "signup.password": "Password",
    "signup.confirm_password": "Confirm Password",
    "signup.submit": "Sign up",
    "signup.submitting": "Creating...",
    "signup.error": "Unable to create account",
    "signup.login_prompt": "Already have an account?",
    "signup.login_link": "Sign in",
    "error.password_mismatch": "Passwords must match",
    "dashboard.overview": "Overview",
    "dashboard.target": "Target",
    "dashboard.saved": "Total saved",
    "dashboard.progress": "Progress",
    "dashboard.due": "Due",
    "dashboard.na": "N/A",
    "dashboard.empty": "Create your first goal to get started.",
    "dashboard.fund_trend_title": "Fund Trend",
    "dashboard.fund_trend_empty": "No fund snapshots recorded yet.",
    "dashboard.fund_trend_hint": "Scroll horizontally to explore more dates.",
    "dashboard.fund_trend_total_label": "Total funds per snapshot",
    "dashboard.fund_trend_liquid_label": "Liquid funds per snapshot",
    "dashboard.goal_progress_title": "Goal Progress",
    "status.title": "Status",
    "status.categories.title": "Fund Categories",
    "status.categories.add": "Add fund category",
    "status.categories.type": "Asset type",
    "status.categories.type.real_estate": "Real estate",
    "status.categories.type.stock": "Stocks",
    "status.categories.type.deposit": "Deposits",
    "status.categories.type.liability": "Liabilities",
    "status.categories.type.savings": "Savings",
    "status.categories.name": "Name",
    "status.categories.is_active": "Active",
    "status.categories.is_liquid": "Liquidity",
    "status.categories.liquid": "Liquid",
    "status.categories.illiquid": "Illiquid",
    "status.categories.note": "Notes",
    "status.categories.actions": "Actions",
    "status.categories.submit": "Save",
    "status.categories.empty": "No categories yet.",
    "status.categories.active": "Active",
    "status.categories.inactive": "Inactive",
    "status.categories.list_title": "Category List",
    "status.snapshots.title": "Snapshots",
    "status.snapshots.add": "Add snapshot",
    "status.snapshots.date": "Reference date",
    "status.snapshots.category": "Fund category",
    "status.snapshots.amount": "Amount",
    "status.snapshots.submit": "Save",
    "status.snapshots.table.date": "Reference date",
    "status.snapshots.table.category": "Category",
    "status.snapshots.table.amount": "Amount",
    "status.snapshots.table.actions": "Actions",
    "status.snapshots.table.empty": "No snapshots recorded.",
    "status.snapshots.delete": "Delete",
    "status.snapshots.no_category": "Unassigned",
    "status.snapshots.template_download": "Download template",
    "status.snapshots.template_download_error": "Unable to download the Excel template.",
    "status.snapshots.upload": "Upload Excel",
    "status.snapshots.upload_success": "Excel data imported successfully.",
    "status.snapshots.upload_error": "Unable to import the Excel file.",
    "status.snapshots.upload_help": "Use an XLSX file with columns [reference_date, category, amount].",
    "goals.title": "Goals",
    "goals.add": "Add new goal",
    "goals.form.error": "Unable to create goal.",
    "goals.form.title": "Title",
    "goals.form.description": "Description",
    "goals.form.target_amount": "Target amount",
    "goals.form.target_amount_error": "Enter a target amount",
    "goals.form.target_date": "Target date (YYYY-MM-DD)",
    "goals.form.contribution_ratio": "Contribution ratio (0-1)",
    "goals.form.contribution_ratio_hint": "Optional split ratio for this member",
    "goals.form.submit": "Create goal",
    "goals.form.submitting": "Saving...",
    "goals.list.title": "Existing goals",
    "goals.list.item": "Target ₩{amount} by {date}",
    "goals.list.empty": "No goals yet.",
    "transactions.title": "Transactions",
    "transactions.add": "Record a transaction",
    "transactions.form.goal": "Goal",
    "transactions.form.type": "Type",
    "transactions.form.type.deposit": "Deposit",
    "transactions.form.type.withdrawal": "Withdrawal",
    "transactions.form.amount": "Amount",
    "transactions.form.category": "Category",
    "transactions.form.date": "Date (YYYY-MM-DD)",
    "transactions.form.memo": "Memo",
    "transactions.form.submit": "Add transaction",
    "transactions.form.submitting": "Saving...",
    "transactions.activity.title": "Recent activity",
    "transactions.activity.subtitle": "Selected goal",
    "transactions.activity.loading": "Loading...",
    "transactions.activity.empty": "No transactions recorded yet.",
    "transactions.table.date": "Date",
    "transactions.table.type": "Type",
    "transactions.table.category": "Category",
    "transactions.table.amount": "Amount",
    "transactions.table.memo": "Memo",
    "transactions.table.placeholder": "-",
    "settings.title": "Settings",
    "settings.profile.title": "Profile",
    "settings.profile.success": "Profile updated successfully.",
    "settings.profile.error": "Failed to update profile.",
    "settings.profile.name": "Name",
    "settings.profile.theme": "Theme preference",
    "settings.profile.theme.light": "Light",
    "settings.profile.theme.dark": "Dark",
    "settings.profile.submit": "Save changes",
    "settings.profile.submitting": "Saving...",
    "settings.password.title": "Password",
    "settings.password.success": "Password updated.",
    "settings.password.error": "Failed to update password.",
    "settings.password.current": "Current password",
    "settings.password.new": "New password",
    "settings.password.confirm": "Confirm password",
    "settings.password.submit": "Update password",
    "settings.password.submitting": "Updating...",
    "language.label": "Language",
    "language.korean": "한국어",
    "language.english": "English",
    "common.select_goal": "Select a goal",
    "common.no_goals": "No goals available.",
    "common.loading": "Loading...",
    "common.optional": "Optional",
    "common.delete": "Delete",
    "common.chart_not_supported": "Charts are not available on this platform.",
    "validation.email": "Enter a valid email address.",
    "validation.password_min": "Password must be at least 8 characters.",
    "validation.name_min": "Name must be at least 2 characters.",
    "validation.title_min": "Title must be at least 2 characters.",
    "validation.goal_required": "Select a goal.",
    "validation.amount_required": "Enter an amount.",
    "validation.date_required": "Enter a date."
  }
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "app_language";
const DEFAULT_LANGUAGE: Language = "ko";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "ko" || stored === "en") {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { language } = useLanguage();

  const translate = useCallback(
    (key: TranslationKey, options?: { fallback?: string }) => {
      const current = translations[language]?.[key];
      if (current) {
        return current;
      }
      const fallback = translations[DEFAULT_LANGUAGE]?.[key];
      return fallback ?? options?.fallback ?? key;
    },
    [language]
  );

  return useMemo(
    () => ({
      t: translate,
      language
    }),
    [translate, language]
  );
}
