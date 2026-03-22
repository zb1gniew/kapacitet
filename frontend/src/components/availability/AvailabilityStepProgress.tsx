import {
  AVAILABILITY_STEPS,
  getAvailabilityStepState,
} from "@/constants/availability";
import type {
  AvailabilityStepDefinition,
  AvailabilityStepId,
} from "@/types/availability";
import type { TranslateFn } from "@/types/i18n";
import { StepCompletedIcon } from "./icons";

type AvailabilityStepProgressProps = {
  currentStep: AvailabilityStepId;
  t: TranslateFn;
  steps?: AvailabilityStepDefinition[];
};

function getStepNumberClass(
  stepState: ReturnType<typeof getAvailabilityStepState>,
) {
  switch (stepState) {
    case "completed":
      return "border border-emerald-200 bg-emerald-100 text-emerald-600";
    case "active":
      return "bg-blue-600 text-white";
    default:
      return "bg-neutral-100 text-neutral-400";
  }
}

function getStepTitleClass(
  stepState: ReturnType<typeof getAvailabilityStepState>,
) {
  switch (stepState) {
    case "active":
      return "text-blue-600";
    case "completed":
      return "text-neutral-900";
    default:
      return "text-neutral-600";
  }
}

export function AvailabilityStepProgress({
  currentStep,
  t,
  steps = AVAILABILITY_STEPS,
}: AvailabilityStepProgressProps) {
  return (
    <section className="rounded-[14px] border border-neutral-200 bg-white px-5 py-6 shadow-[0_25px_50px_rgba(0,0,0,0.25)] sm:px-7">
      <ol className="flex overflow-x-auto">
        {steps.map((step, index) => {
          const stepState = getAvailabilityStepState(currentStep, step.id);
          const isLineComplete = currentStep > step.id;

          return (
            <li
              key={step.id}
              className="flex min-w-[180px] flex-1 items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-[10px] text-sm font-bold tracking-[-0.1504px] ${getStepNumberClass(stepState)}`}
                >
                  {stepState === "completed" ? (
                    <StepCompletedIcon className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-neutral-500">
                    {t(step.labelKey)}
                  </p>
                  <p
                    className={`text-xs font-semibold tracking-[-0.1504px] ${getStepTitleClass(stepState)}`}
                  >
                    {t(step.titleKey)}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 ? (
                <span
                  className={`mx-4 h-[2px] flex-1 ${
                    isLineComplete ? "bg-emerald-400" : "bg-neutral-200"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
