# Resilient Withdraw Flow (Next.js + React + TypeScript)

Демонстрационный проект критичного UI-флоу вывода средств: валидация формы, понятные состояния, идемпотентность, защита от двойного сабмита, обработка сетевых ошибок с Retry, восстановление последней заявки после перезагрузки (TTL 5 минут), unit-тесты и E2E-тест.

Проект сделан под критерии тестового задания Frontend Developer (React + Next.js).

## 🎯 Live Demonstration

<div align="center">

<h3>Project Overview & Live Demo</h3>

<div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 30px 0;">

<a href="https://resilient-withdraw-flow.vercel.app/" target="_blank" style="text-decoration: none;">
  <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 15px 30px; border-radius: 12px; color: white; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; border: 2px solid white;">
    View Live Application
  </div>
</a>

</div>

</div>

## 📸 Project Preview

<p align="center">
  <img src="https://github.com/Figrac0/Resilient-Withdraw-Flow/blob/main/github/1.png" alt="nahhh" width="800"/><br/>
  
</p>

---

<p align="center">
  <img src="https://github.com/Figrac0/Resilient-Withdraw-Flow/blob/main/github/2.png" alt="nahhh" width="800"/><br/>
  
</p>

---

<p align="center">
  <img src="https://github.com/Figrac0/Resilient-Withdraw-Flow/blob/main/github/3.png" alt="nahhh" width="800"/><br/>
  
</p>

---

<p align="center">
  <img src="https://github.com/Figrac0/Resilient-Withdraw-Flow/blob/main/github/4.png" alt="nahhh" width="800"/><br/>
  
</p>


---

## Что реализовано (по требованиям задания)

### 1) Страница Withdraw (форма)
- Поля:
  - amount (число больше 0)
  - destination (непустая строка)
  - confirm (checkbox)
- Submit активен только при валидной форме
- Во время запроса Submit disabled

### 2) API-интеграция
- POST /v1/withdrawals
- GET /v1/withdrawals/{id}
- Отправка Idempotency-Key в заголовке при создании заявки
- 409 конфликт отображается понятным текстом
- При сетевой ошибке есть Retry без потери введённых данных и с безопасной повторной отправкой (тот же idempotency key)
- После успеха отображается созданная заявка и статус

### 3) Устойчивость UI
- Защита от двойного сабмита (guard в сторе)
- Состояния: idle / loading / success / error

### 4) Архитектура и безопасность
- Next.js App Router + TypeScript
- Zustand для состояния
- Нет небезопасного рендера HTML (никаких dangerouslySetInnerHTML)
- Токены не хранятся в localStorage (auth отсутствует, ниже описан прод-подход)

### 5) Тесты
- Unit-тесты (Vitest + Testing Library):
  - happy path submit
  - api error 409 (читабельное сообщение)
  - защита от double submit
- E2E-тест (Playwright):
  - happy path submit
  - восстановление результата после reload

### Optional (выполнено)
- Восстановление последней заявки после reload до 5 минут (sessionStorage + TTL)
- Оптимизация рендеров (zustand shallow selectors + стабильные обработчики)
- E2E-тест

## Запуск

### Требования
- Node.js 18+ (рекомендуется 20+)
- npm

### Команды
```bash
npm install
npm run dev
```
Открыть:

http://localhost:3000
 – главная страница с описанием и кнопкой перехода

http://localhost:3000/withdraw
 – страница вывода средств

### Тесты
```bash
npm test
npm run e2e
```

## Важно:

Unit-тесты изолированы от E2E: папка e2e исключена в vitest.config.ts, поэтому `npm test` не пытается исполнить playwright test().

## Быстрая проверка вручную

### Happy path

1. Открыть `/withdraw`
2. Заполнить amount (например 12)
3. Заполнить destination
4. Поставить confirm
5. Нажать Submit
6. Увидеть блок "Withdrawal Created" и поля результата

### Восстановление после reload

1. После успешного сабмита обновить страницу (F5)
2. В течение 5 минут результат будет восстановлен (GET /v1/withdrawals/{id})

### Получение ошибок

**Ошибка валидации (клиент)**

- Не ставить confirm
- Submit будет disabled, а сообщение в helper покажет причину (например "You must confirm the withdrawal.")

**Сетевая ошибка (клиент, с Retry)**

- Самый простой способ: во время нажатия Submit отключить интернет/сеть
- Получишь Network error и появится кнопка Retry
- Нажать Retry – запрос безопасно повторится тем же idempotency key

**409 Duplicate request (API)**

- 409 срабатывает, если повторить POST с тем же Idempotency-Key
- В текущем UI это проще воспроизвести из DevTools/терминала:
  - отправить POST вручную с одинаковым Idempotency-Key два раза
  - второй ответ будет 409

Пример (PowerShell):

```powershell
$h = @{ "Content-Type"="application/json"; "Idempotency-Key"="fixed-key" }
Invoke-RestMethod -Method Post -Uri http://localhost:3000/v1/withdrawals -Headers $h -Body '{"amount":12,"destination":"dest"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/v1/withdrawals -Headers $h -Body '{"amount":12,"destination":"dest"}'
```

## Архитектура

Ключевая идея: разделить UI – State – API – Transport.

**UI-компоненты (features/withdraw/ui):**

- только отображение + обработка событий
- не содержат сетевой логики
- подключают состояние через zustand selectors

**Store (features/withdraw/model/store.ts):**

- владеет состояниями idle/loading/success/error
- делает валидацию формы
- содержит защиту от double submit
- управляет idempotency key
- реализует восстановление последней заявки через sessionStorage TTL

**API слой (shared/api):**

- withdrawApi.ts – вызовы бизнес-API
- http.ts – общий транспорт: JSON, таймаут, типизация ошибок
- types.ts – DTO типы

**Mock API (app/v1/withdrawals):**

- реализованы Next.js route handlers POST/GET
- хранение в памяти процесса (globalThis store)
- идемпотентность (Set ключей)
- полезно для демо без внешнего бэкенда

## Структура проекта и назначение файлов

```text
├───app
│ │ layout.tsx – базовый layout Next.js
│ │ page.module.css – стили главной страницы
│ │ page.tsx – главная страница: краткое описание + кнопка на /withdraw
│ │
│ ├───v1
│ │ └───withdrawals
│ │ │ route.ts – POST /v1/withdrawals (создание)
│ │ │ _mockDb.ts – in-memory store + типы
│ │ │
│ │ └───[id]
│ │ route.ts – GET /v1/withdrawals/{id} (получение)
│ │
│ └───withdraw
│ page.tsx – страница /withdraw, рендерит WithdrawPage
│
├───features
│ └───withdraw
│ ├───model
│ │ store.ts – zustand store (валидация, submit, retry, restore)
│ │ types.ts – типы состояния и ошибок домена
│ │
│ └───ui
│ withdraw.module.css – стили страницы /withdraw
│ WithdrawError.tsx – показ ошибки + Retry для network
│ WithdrawForm.tsx – форма ввода
│ WithdrawPage.test.tsx – unit-тесты
│ WithdrawPage.tsx – композиция страницы
│ WithdrawStatus.tsx – показ результата + New withdrawal
│
├───shared
│ └───api
│ http.ts – универсальный HTTP клиент с типами ошибок
│ types.ts – DTO типов API
│ withdrawApi.ts – createWithdrawal/getWithdrawal
│
└───test
├───msw
│ handlers.ts – обработчики MSW для unit-тестов
│ server.ts – MSW server setup
│
└───utils
setup.ts – подключение jest-dom и lifecycle MSW
```

## Ключевые решения с примерами кода

### 1) Валидация формы и управление доступностью Submit

Валидация вынесена в store.ts и используется в UI через useMemo.
Это гарантирует единые правила валидации и удобную проверку перед submit.

```ts
export function validateDraft(draft: WithdrawStoreState["draft"]): WithdrawDomainError | null {
    const amountNum = Number(draft.amount);

    // Важно: amount хранится как string в draft для UX ввода.
    // Перед запросом всегда нормализуем в number и проверяем корректность.
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return { kind: "validation", message: "Amount must be greater than 0." };
    }

    if (draft.destination.trim().length === 0) {
        return { kind: "validation", message: "Destination is required." };
    }

    if (!draft.confirm) {
        return { kind: "validation", message: "You must confirm the withdrawal." };
    }

    return null;
}
```

В UI Submit disabled, если форма невалидна или идёт запрос:

```ts
const validationError = useMemo(() => validateDraft(draft), [draft]);
const disabled = Boolean(validationError) || isSubmitting;
```

### 2) Защита от двойного submit (критичный момент)

Решение сделано на уровне стора, а не только через disabled в UI.
UI может не успеть перерендериться между двумя кликами, поэтому нужен guard в одном источнике истины.

```ts
submit: async () => {
    let acquired = false;
    let idempotencyKey: string | undefined;

    set((s) => {
        // Guard: если уже submitting – второй клик игнорируем
        if (s.isSubmitting) return s;

        const validationError = validateDraft(s.draft);
        if (validationError) {
            return { ...s, ui: "error", error: validationError, currentIdempotencyKey: undefined };
        }

        acquired = true;

        // Если был network error – ключ сохраняется для безопасного retry
        idempotencyKey = s.currentIdempotencyKey ?? uuidv4();

        return {
            ...s,
            ui: "loading",
            isSubmitting: true,
            error: undefined,
            currentIdempotencyKey: idempotencyKey,
        };
    });

    if (!acquired || !idempotencyKey) return;

    // Далее – реальные запросы
}
```

Именно такой подход закрывает красный флаг задания:
двойной submit не приводит к дублям.

### 3) Идемпотентность и работа с 409

Клиент:

- отправляет Idempotency-Key при POST
- если сервер вернул 409 – показывает понятный текст

```ts
if (e instanceof HttpError) {
    if (e.status === 409) {
        return {
            kind: "conflict",
            message: "This withdrawal request was already processed. Duplicate submission prevented.",
        };
    }
    return { kind: "api", message: "Server error occurred. Please try again later." };
}
```

API mock:

- хранит использованные ключи
- если ключ уже был – 409

```ts
const key = req.headers.get("Idempotency-Key");

if (!isNonEmptyString(key)) {
    return NextResponse.json({ message: "Missing Idempotency-Key" }, { status: 400 });
}

if (store.idempotencyKeys.has(key)) {
    return NextResponse.json({ message: "Duplicate request" }, { status: 409 });
}

store.idempotencyKeys.add(key);
```

API mock:

- хранит использованные ключи
- если ключ уже был – 409

```ts
const key = req.headers.get("Idempotency-Key");

if (!isNonEmptyString(key)) {
    return NextResponse.json({ message: "Missing Idempotency-Key" }, { status: 400 });
}

if (store.idempotencyKeys.has(key)) {
    return NextResponse.json({ message: "Duplicate request" }, { status: 409 });
}

store.idempotencyKeys.add(key);
```

UI показывает кнопку Retry только для network:

```tsx
{error.kind === "network" && (
    <button onClick={onRetry} disabled={isSubmitting}>Retry</button>
)}
```

### 5) Восстановление последней заявки после reload (TTL 5 минут)

Сохраняется только {id, ts} в sessionStorage, без чувствительных данных.
После reload:

- если TTL не истёк – делаем GET и показываем результат
- если истёк или GET упал – очищаем и возвращаемся в idle

```ts
const LAST_KEY = "withdraw:last"; // Ключ в sessionStorage, под которым храним метаданные последней созданной заявки
const TTL_MS = 5 * 60 * 1000; // Время жизни сохранённой ссылки на заявку: 5 минут (в миллисекундах)

function writeLast(id: string) {
    // Сохраняем минимум данных: только id заявки и timestamp сохранения.
    // Важно: не сохраняем всю заявку, чтобы при reload подтянуть актуальный статус с сервера через GET.
    const payload = { id, ts: Date.now() };

    // sessionStorage живёт в рамках вкладки и очищается при закрытии вкладки.
    // Это безопаснее, чем localStorage, и соответствует идее "восстановить после reload" без долгого хранения.
    sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));
}

hydrateLast: async () => {
    // Защита от повторной гидрации: если компонент смонтировался повторно
    // (StrictMode, повторный mount, переходы и т.д.), второй раз запрос не делаем.
    if (get().hydratedOnce) return;

    // Сразу помечаем, что гидрация выполнена, чтобы избежать гонок при быстрых повторных вызовах.
    set({ hydratedOnce: true });

    // Пытаемся прочитать ранее сохранённый { id, ts } из sessionStorage.
    // safeReadLast внутри себя защищён от отсутствия window, ошибок JSON.parse и неверной структуры.
    const last = safeReadLast();
    if (!last) return; // Нечего восстанавливать

    // TTL: если прошло больше 5 минут – считаем данные устаревшими, чистим storage и не восстанавливаем.
    // Это предотвращает "вечное" восстановление старой заявки и снижает вероятность показывать неактуальный контент.
    if (Date.now() - last.ts > TTL_MS) {
        clearLast();
        return;
    }

    // Переходим в loading, чтобы UI показал состояние загрузки восстановления (если нужно).
    set((s) => ({ ...s, ui: "loading", error: undefined }));

    try {
        // Делаем реальный запрос на сервер, чтобы восстановить актуальные данные заявки:
        // статус мог измениться, поэтому нельзя брать данные из storage.
        const fresh = await getWithdrawal(last.id);

        // Если получили ответ – переводим UI в success и кладём результат.
        // lastRequestId сохраняем для трассировки/дебага и для согласованности со структурой стора.
        set((s) => ({
            ...s,
            ui: "success",
            lastResult: fresh,
            lastRequestId: fresh.id,
        }));
    } catch {
        // Если GET упал (например, сервер вернул 404, или сеть недоступна),
        // то считаем сохранённый id бесполезным, очищаем storage и возвращаем UI в idle.
        // Важно: здесь намеренно не показываем ошибку – восстановление optional,
        // пользователь может просто создать заявку заново.
        clearLast();
        set((s) => ({ ...s, ui: "idle" }));
    }
}
```
`hydratedOnce` нужен, чтобы:

- не запускать hydrateLast повторно при возможных повторных маунтах
- избежать дублей GET

### 6) HTTP клиент и типизированные ошибки (HttpError и NetworkError)

httpJson централизует:

- JSON parse
- извлечение message из тела ошибки
- таймаут через AbortController
- различение HttpError и NetworkError

```ts
// Если сервер вернул статус не из диапазона 2xx
if (!res.ok) {
    // Пытаемся извлечь человекочитаемое сообщение из JSON-ответа (например { message: "..." })
    // Если его нет — используем дефолтный текст вида "HTTP 500"
    const msg = extractMessage(data) ?? `HTTP ${res.status}`;

    // Бросаем типизированную HTTP-ошибку с кодом статуса и телом ответа.
    // Это позволит на уровне стора корректно обработать 409, 422 и т.д.
    throw new HttpError({ status: res.status, message: msg, body: data });
}

...

// Если произошёл AbortError (таймаут или ручная отмена запроса)
if (isRecord(e) && e["name"] === "AbortError") {
    // Определяем причину: был ли это таймаут или внешний abort
    const reason = opts.signal?.aborted ? "aborted" : "timeout";

    // Преобразуем в доменную NetworkError с явной причиной.
    // Это позволяет UI различать сетевые ошибки от бизнес-ошибок API.
    throw new NetworkError({
        message: reason === "timeout" ? "Request timeout" : "Request aborted",
        reason
    });
}

// Если это уже HttpError — пробрасываем дальше без изменений,
// чтобы не потерять статус и тело ответа.
if (e instanceof HttpError) throw e;

// Любая другая ошибка (например, падение fetch, DNS, offline)
// нормализуется в NetworkError типа "fetch".
throw new NetworkError({ message: fallbackMessage, reason: "fetch" });
```

## Тестирование

### Unit-тесты (Vitest + Testing Library + MSW)

MSW мокает API вызовы, чтобы тестировать UI и стор без реального сервера.

- **happy path**: заполнили форму – Submit – увидели Withdrawal Created
- **409**: MSW переопределяет POST и возвращает 409 – проверяем понятный текст
- **double submit**: задержка в handler + два клика – проверяем, что POST вызван один раз

### E2E (Playwright)

Запускает реальный next dev через webServer и проверяет:

- сабмит
- reload и восстановление результата

```ts
await page.goto("/withdraw");
await page.getByRole("button", { name: "Submit" }).click();
await page.reload();
await expect(page.getByText("Withdrawal Created")).toBeVisible();
```
## Примеры реальных логов запуска и тестов

### 1) Запуск dev-сервера (Next.js 16 + Turbopack)

Ниже — фрагмент реальных логов при запуске `npm run dev` и работе с флоу:
```bash
▲ Next.js 16.1.6 (Turbopack)

Local: http://localhost:3000

✓ Starting...
✓ Ready in 780ms

GET /withdraw 200
POST /v1/withdrawals 201
GET /v1/withdrawals/1 200
POST /v1/withdrawals 409
POST /v1/withdrawals 201
GET /v1/withdrawals/3 200
```


Что это подтверждает:

- `GET /withdraw 200` — страница корректно рендерится.
- `POST /v1/withdrawals 201` — успешное создание заявки.
- `GET /v1/withdrawals/{id} 200` — корректное получение созданной заявки.
- `POST /v1/withdrawals 409` — идемпотентность работает, повторный ключ приводит к конфликту.
- Повторные `GET` после reload — механизм восстановления через TTL корректно запрашивает актуальные данные.

---

### 2) Unit-тесты (Vitest)

Результат `npm test`:
```bash
✓ src/features/withdraw/ui/WithdrawPage.test.tsx (3 tests)
✓ happy-path submit
✓ api error 409 shows readable text
✓ double submit is guarded

Test Files 1 passed (1)
Tests 3 passed (3)
```

Это подтверждает:

- Happy-path работает.
- 409 корректно отображается пользователю.
- Двойной submit не приводит к двойному вызову API (guard на уровне стора).

---

### 3) E2E-тест (Playwright)

Результат `npm run e2e`:
```bash
Running 1 test using 1 worker

✓ withdraw happy path + restore after reload

1 passed (2.2s)
```

E2E проверяет:

- Полный пользовательский сценарий.
- Успешный submit.
- Восстановление результата после reload.

