"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWithdrawStore, validateDraft } from "../model/store";
import styles from "./withdraw.module.css";

export function WithdrawForm() {
    const { draft, setDraft, submit, isSubmitting, ui } = useWithdrawStore(
        useShallow((s) => ({
            draft: s.draft,
            setDraft: s.setDraft,
            submit: s.submit,
            isSubmitting: s.isSubmitting,
            ui: s.ui,
        })),
    );

    const validationError = useMemo(() => validateDraft(draft), [draft]);
    const disabled = Boolean(validationError) || isSubmitting;

    const onAmount = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setDraft({ amount: e.target.value }),
        [setDraft],
    );

    const onDestination = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setDraft({ destination: e.target.value }),
        [setDraft],
    );

    const onConfirm = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setDraft({ confirm: e.target.checked }),
        [setDraft],
    );

    const onSubmit = useCallback(() => void submit(), [submit]);

    return (
        <section className={styles.form}>
            <div className={styles.field}>
                <label className={styles.label}>
                    Amount
                    <input
                        className={styles.input}
                        inputMode="decimal"
                        value={draft.amount}
                        onChange={onAmount}
                        disabled={isSubmitting}
                    />
                </label>
                <div className={styles.helper}>Must be greater than 0</div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    Destination
                    <input
                        className={styles.input}
                        value={draft.destination}
                        onChange={onDestination}
                        disabled={isSubmitting}
                    />
                </label>
            </div>

            <label className={`${styles.label} ${styles.row}`}>
                <input
                    className={styles.checkbox}
                    type="checkbox"
                    checked={draft.confirm}
                    onChange={onConfirm}
                    disabled={isSubmitting}
                />
                Confirm
            </label>

            <div className={styles.actions}>
                <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={onSubmit}
                    disabled={disabled}>
                    {ui === "loading" ? "Submitting..." : "Submit"}
                </button>

                {validationError ? (
                    <div className={styles.helper}>
                        {validationError.message}
                    </div>
                ) : (
                    <div className={styles.helper}>
                        Submit will be enabled when the form is valid
                    </div>
                )}
            </div>
        </section>
    );
}
