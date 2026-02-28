"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWithdrawStore } from "../model/store";
import styles from "./withdraw.module.css";

export function WithdrawError() {
    const { error, retry, isSubmitting } = useWithdrawStore(
        useShallow((s) => ({
            error: s.error,
            retry: s.retry,
            isSubmitting: s.isSubmitting,
        })),
    );

    const onRetry = useCallback(() => void retry(), [retry]);

    if (!error) return null;

    return (
        <div role="alert" className={styles.alert}>
            <div className={styles.alertMessage}>{error.message}</div>

            {error.kind === "network" && (
                <div className={styles.alertActions}>
                    <button
                        className={styles.button}
                        onClick={onRetry}
                        disabled={isSubmitting}>
                        Retry
                    </button>
                </div>
            )}
        </div>
    );
}
