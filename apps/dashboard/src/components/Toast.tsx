import { ReactNode } from "react";

export function Toast(props: {
  variant: "success" | "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const border =
    props.variant === "success"
      ? "#5AAD64"
      : props.variant === "error"
        ? "#ff8f8f"
        : "#6B8A6E";

  return (
    <div
      role="status"
      style={{
        border: `1px solid ${border}`,
        background: "#0D1610",
        padding: "10px 12px",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 12
      }}
    >
      <div style={{ color: "#E8EFE9" }}>{props.children}</div>
      {props.onDismiss ? (
        <button className="btn" type="button" onClick={props.onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

