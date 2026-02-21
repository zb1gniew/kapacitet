type OnboardingProgressDotsProps = {
  activeStep: 1 | 2 | 3;
};

export function OnboardingProgressDots({
  activeStep,
}: OnboardingProgressDotsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {[1, 2, 3].map((step) => {
        const isActive = step <= activeStep;

        return (
          <span
            key={step}
            className={`h-3 w-3 rounded-[2px] ${
              isActive ? "bg-blue-600 shadow-sm" : "bg-neutral-300"
            }`}
          />
        );
      })}
    </div>
  );
}
