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
      className="flex min-h-screen items-center justify-center bg-[linear-gradient(151deg,#f5f5f5_0%,#f8fafc_50%,#f5f5f5_100%)] px-4 py-8"
      data-name={dataName}
      data-node-id={dataNodeId}
    >
      <div className={`w-full ${maxWidthClassName}`}>{children}</div>
    </main>
  );
}
