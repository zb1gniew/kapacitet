import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  maxWidthClassName?: string;
  dataName?: string;
  dataNodeId?: string;
};

export function AuthShell({
  children,
  maxWidthClassName = "max-w-[768px]",
  dataName,
  dataNodeId,
}: AuthShellProps) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_16%_14%,rgba(0,159,154,0.16),transparent_30rem),radial-gradient(circle_at_86%_8%,rgba(0,107,182,0.16),transparent_28rem),linear-gradient(151deg,#f8fafc_0%,#eef7f8_48%,#f5f7fb_100%)] px-4 py-10"
      data-name={dataName}
      data-node-id={dataNodeId}
    >
      <div className={`w-full ${maxWidthClassName}`}>{children}</div>
    </main>
  );
}
