import { ReactNode } from "react";

export function Toast(props: {
  variant: "success" | "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className={`toast toast--${props.variant}`} role="status">
      <p className="toast__message">{props.children}</p>
      {props.onDismiss ? (
        <button className="btn-ghost btn-sm" type="button" onClick={props.onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
