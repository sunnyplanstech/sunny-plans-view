import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * When the URL carries ?action=unlock or ?action=subscribe (typically because
 * the user got redirected here from /register after clicking a locked field
 * while logged out), invoke ``open()`` and strip the param so a refresh
 * doesn't re-trigger.
 */
export function usePaywallAutoOpen(open: () => void): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    if (action !== "unlock" && action !== "subscribe") return;

    open();

    params.delete("action");
    const remaining = params.toString();
    navigate(
      `${location.pathname}${remaining ? `?${remaining}` : ""}`,
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
