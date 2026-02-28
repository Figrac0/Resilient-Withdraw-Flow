"use client";

import { useEffect } from "react";
import { WithdrawForm } from "./WithdrawForm";
import { WithdrawError } from "./WithdrawError";
import { WithdrawStatus } from "./WithdrawStatus";
import { useWithdrawStore } from "../model/store";
import styles from "./withdraw.module.css";

export function WithdrawPage() {
    const hydrateLast = useWithdrawStore((s) => s.hydrateLast);

    useEffect(() => {
        void hydrateLast();
    }, [hydrateLast]);

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Withdraw</h1>
                    <p className={styles.sub}>
                        Create a withdrawal request. After success, reload
                        within 5 minutes to restore the last request.
                    </p>
                </header>

                <WithdrawForm />
                <WithdrawError />
                <WithdrawStatus />
            </section>
        </main>
    );
}
