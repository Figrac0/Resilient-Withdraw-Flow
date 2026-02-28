import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Withdraw Flow</h1>
                    <p className={styles.subtitle}>
                        Демонстрационная страница флоу вывода средств,
                        реализованного на Next.js App Router, TypeScript и
                        Zustand, с мок-API, unit-тестами и E2E-тестом.
                    </p>
                </header>

                <div className={styles.grid}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Реализовано</h2>
                        <ul className={styles.list}>
                            <li>
                                Форма Withdraw – amount (число больше 0),
                                destination, confirm (checkbox). Кнопка Submit
                                активна только при валидной форме.
                            </li>
                            <li>
                                Состояния запроса – idle, loading, success,
                                error. Во время loading Submit отключён.
                            </li>
                            <li>
                                Интеграция с API – POST /v1/withdrawals и GET
                                /v1/withdrawals/{`{id}`}.
                            </li>
                            <li>
                                Идемпотентность – заголовок Idempotency-Key при
                                создании; для 409 показывается понятное
                                сообщение.
                            </li>
                            <li>
                                Устойчивость – обработка сетевой ошибки с Retry
                                без потери введённых данных и с безопасной
                                повторной отправкой.
                            </li>
                            <li>
                                Защита от двойного сабмита – submit guarded на
                                уровне стора.
                            </li>
                            <li>
                                Optional – восстановление последней заявки после
                                reload до 5 минут (TTL в sessionStorage).
                            </li>
                            <li>
                                Optional – оптимизация перерендеров Zustand
                                (shallow selectors и стабильные handlers).
                            </li>
                            <li>
                                Тесты – unit-тесты (happy path, 409, double
                                submit) и E2E-тест (submit и восстановление
                                после reload).
                            </li>
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Команды</h2>
                        <div className={styles.kbdRow}>
                            <span className={styles.kbd}>npm run dev</span>
                            <span className={styles.kbd}>npm test</span>
                            <span className={styles.kbd}>npm run e2e</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        href="/withdraw">
                        Открыть Withdraw
                    </Link>

                    <span className={styles.note}>
                        Подсказка – после успешной отправки обнови /withdraw в
                        течение 5 минут, чтобы проверить восстановление.
                    </span>
                </div>
            </section>
        </main>
    );
}
