import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function HourglassIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M6 3.5h8M6 16.5h8M7.5 3.5v2.167a2.5 2.5 0 0 0 .732 1.768L10 9.202l1.768-1.767a2.5 2.5 0 0 0 .732-1.768V3.5m-5 13v-2.167a2.5 2.5 0 0 1 .732-1.768L10 10.798l1.768 1.767a2.5 2.5 0 0 1 .732 1.768V16.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M4.167 13.333 8.75 8.75l2.5 2.5 4.583-4.583"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12.5 6.667h3.333V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function XMarkIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path
        d="M4.667 4.667 11.333 11.333M11.333 4.667 4.667 11.333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path
        d="m3.333 8.333 3 3 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
