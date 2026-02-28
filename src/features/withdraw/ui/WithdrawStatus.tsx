"use client";

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWithdrawStore } from "../model/store";
import styles from "./withdraw.module.css";

export function WithdrawStatus() {
    const { result, ui, reset } = useWithdrawStore(
        useShallow((s) => ({
            result: s.lastResult,
            ui: s.ui,
            reset: s.reset,
        })),
    );

    const onReset = useCallback(() => reset(), [reset]);

    if (ui !== "success" || !result) return null;

    return (
        <section className={styles.status} aria-label="Withdrawal Result">
            <h3 className={styles.statusTitle}>Withdrawal Created</h3>

            <div className={styles.kv}>
                <div>
                    <span className={styles.k}>ID: </span>
                    <span className={styles.v}>{result.id}</span>
                </div>
                <div>
                    <span className={styles.k}>Amount: </span>
                    <span className={styles.v}>{result.amount}</span>
                </div>
                <div>
                    <span className={styles.k}>Destination: </span>
                    <span className={styles.v}>{result.destination}</span>
                </div>
                <div>
                    <span className={styles.k}>Status: </span>
                    <span className={styles.v}>{result.status}</span>
                </div>
                <div>
                    <span className={styles.k}>Created: </span>
                    <span className={styles.v}>{result.created_at}</span>
                </div>
            </div>

            <div className={styles.divider} />

            <button className={styles.button} onClick={onReset}>
                New withdrawal
            </button>
        </section>
    );
}
