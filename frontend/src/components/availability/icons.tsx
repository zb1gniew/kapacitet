import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function StepCompletedIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.875 10.208 9.167 12.5l3.958-4.375"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function WorkersIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M8.125 8.958a2.708 2.708 0 1 0 0-5.416 2.708 2.708 0 0 0 0 5.416Zm-4.167 6.875c0-2.28 1.848-4.125 4.125-4.125 1.485 0 2.788.79 3.514 1.973"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M13.958 10.208a.625.625 0 0 1 .625.625v.368c.167.043.327.11.476.197l.26-.26a.625.625 0 0 1 .884 0l.516.516a.625.625 0 0 1 0 .884l-.26.26c.087.149.153.31.197.476h.368a.625.625 0 0 1 .625.625v.729a.625.625 0 0 1-.625.625h-.368a2.214 2.214 0 0 1-.197.476l.26.26a.625.625 0 0 1 0 .884l-.516.516a.625.625 0 0 1-.884 0l-.26-.26a2.216 2.216 0 0 1-.476.197v.368a.625.625 0 0 1-.625.625h-.729a.625.625 0 0 1-.625-.625v-.368a2.212 2.212 0 0 1-.476-.197l-.26.26a.625.625 0 0 1-.884 0l-.516-.516a.625.625 0 0 1 0-.884l.26-.26a2.219 2.219 0 0 1-.197-.476h-.368A.625.625 0 0 1 10.267 15v-.729c0-.345.28-.625.625-.625h.368c.043-.166.11-.327.197-.476l-.26-.26a.625.625 0 0 1 0-.884l.516-.516a.625.625 0 0 1 .884 0l.26.26c.149-.087.31-.154.476-.197v-.368a.625.625 0 0 1 .625-.625h.729Zm-.365 2.396a.938.938 0 1 0 0 1.875.938.938 0 0 0 0-1.875Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EquipmentIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="m10 2.917 6.25 3.125L10 9.167 3.75 6.042 10 2.917Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3.75 6.042v6.25L10 15.417l6.25-3.125v-6.25"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 9.167v6.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M5.417 2.917v2.5M14.583 2.917v2.5M3.75 7.083h12.5M5 4.583h10c.92 0 1.667.746 1.667 1.667v8.75c0 .92-.746 1.667-1.667 1.667H5c-.92 0-1.667-.746-1.667-1.667V6.25c0-.92.746-1.667 1.667-1.667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M10 17.083s5-4.353 5-8.333a5 5 0 1 0-10 0c0 3.98 5 8.333 5 8.333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="8.75" r="1.667" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M10 2.917a7.083 7.083 0 1 0 0 14.166 7.083 7.083 0 0 0 0-14.166Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 6.667v4.166M10 13.333h.008"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="m10 2.5 6.25 2.5v4.167c0 3.75-2.667 6.875-6.25 7.916-3.583-1.041-6.25-4.166-6.25-7.916V5L10 2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m7.917 9.792 1.458 1.458 2.708-2.917"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function BulletCheckIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
      <path
        d="m5.5 8 1.6 1.6 3.4-3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResourceSummaryIcon(props: IconProps) {
  return <WorkersIcon {...props} />;
}

export function DetailsSummaryIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M5 3.333h7.5l2.5 2.5v10.834A1.667 1.667 0 0 1 13.333 18.333H5A1.667 1.667 0 0 1 3.333 16.667V5A1.667 1.667 0 0 1 5 3.333Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M7.083 9.167h5.834M7.083 12.5h5.834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PeriodSummaryIcon(props: IconProps) {
  return <CalendarIcon {...props} />;
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="m8.333 5.833-4.167 4.167 4.167 4.167M4.167 10h11.667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M11.667 5.833 15.833 10l-4.166 4.167M4.167 10h11.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PublishIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m6.75 10.167 2.333 2.333 4.167-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
