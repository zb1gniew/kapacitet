export type WorkflowHint = {
  id: string;
  severity: "info" | "warning" | "positive";
  message: string; // English fallback — shown when no translation key found
  params?: Record<string, unknown>;
};
