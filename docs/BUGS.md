# QualityCat Academy — Katalog celowych bugów

## Jak to działa

Aplikacja posiada **13 celowo zaszytych bugów** (7 backendowych + 6 frontendowych) służących do nauki testowania oprogramowania. Każdy bug jest kontrolowany przez flagę środowiskową i może być niezależnie włączany/wyłączany.

### System flag

Bugi działają w modelu **master switch + indywidualna flaga**:

1. **Master switch** — `BUGS=on` (backend) / `VITE_BUGS=on` (frontend)
2. **Indywidualna flaga** — np. `BUG_AUTH_WRONG_STATUS=1`

Bug jest aktywny **tylko** gdy oba warunki są spełnione:

```typescript
// Backend (apps/api/src/lib/bug-flags.ts)
function isBugEnabled(flagName: string): boolean {
  return process.env.BUGS === "on" && process.env[flagName] === "1";
}

// Frontend (apps/web/src/config/bug-flags.ts)
function isBugEnabled(flag: string): boolean {
  return import.meta.env.VITE_BUGS === "on" && import.meta.env[flag] === "1";
}
```

### Jak włączyć/wyłączyć

**Docker Compose** — edytuj `infra/docker/.env`:
```env
BUGS=on
BUG_AUTH_WRONG_STATUS=1
BUG_BOOKINGS_LEAK=1
```

**Lokalne dev** — edytuj `apps/api/.env` i `apps/web/.env`:
```env
BUGS=on
BUG_AUTH_WRONG_STATUS=1
```

**Wyłączenie wszystkich bugów** — ustaw `BUGS=off` (indywidualne flagi są wtedy ignorowane).

### GET /__debug/flags

Endpoint diagnostyczny zwracający aktualny stan wszystkich flag backendowych.

```bash
curl http://localhost:8081/__debug/flags | jq
```

Przykładowa odpowiedź:
```json
{
  "masterSwitch": "on",
  "flags": {
    "BUG_AUTH_WRONG_STATUS": true,
    "BUG_PAGINATION_MIXED_BASE": false,
    "BUG_NPLUS1_COURSES": false,
    "BUG_BOOKINGS_PAST_ALLOWED": false,
    "BUG_BOOKINGS_RACE": false,
    "BUG_BOOKINGS_LEAK": true,
    "BUG_CORS_MISCONFIG": false
  }
}
```

> **Uwaga:** Endpoint zwraca `404` gdy `BUGS` nie jest ustawione na `"on"`. Nie wymaga autentykacji.

### GET /internal/bugs

Pełny katalog bugów z informacją o aktywności. Wymaga autentykacji z rolą **TRAINER**.

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@qualitycat.dev","password":"password123"}' | jq -r .token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/internal/bugs | jq
```

### Konta testowe (seed)

| Rola    | Email                     | Hasło        |
|---------|---------------------------|--------------|
| ADMIN   | admin@qualitycat.dev      | password123  |
| MENTOR  | mentor@qualitycat.dev     | password123  |
| STUDENT | student@qualitycat.dev    | password123  |
| TRAINER | trainer@qualitycat.dev    | password123  |

---

## Bugi backendowe

### BUG_AUTH_WRONG_STATUS

- **Flaga:** `BUG_AUTH_WRONG_STATUS=1`
- **Moduł:** `apps/api/src/modules/auth/auth.handlers.ts`
- **Objawy:** Login z błędnym hasłem (lub nieistniejącym emailem) zwraca HTTP **500** (Internal Server Error) zamiast **401** (Unauthorized)
- **Jak wykryć:** Wyślij request z niepoprawnym hasłem, sprawdź status code — powinien być 401, a jest 500
- **Przykładowy test:**
```bash
# Oczekiwany status: 401, z bugiem: 500
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@qualitycat.dev","password":"wrong"}'
```
- **Ryzyko/Impact:** Błędne monitorowanie (alerty na 500), mylące logi, klient nie potrafi odróżnić błędu serwera od niepoprawnych danych, systemy retry mogą powtarzać request myśląc że serwer ma problem
- **Kategoria:** Functional, HTTP semantics
- **Interakcja:** W połączeniu z `VITE_BUG_ERROR_MESSAGE` frontend wyświetla "Problem z połączeniem" zamiast "Nieprawidłowy email lub hasło"

---

### BUG_PAGINATION_MIXED_BASE

- **Flaga:** `BUG_PAGINATION_MIXED_BASE=1`
- **Moduł:** `apps/api/src/modules/courses/courses.handlers.ts`
- **Objawy:** Paginacja traktuje `page` jako 0-based (`skip = page * limit`), przez co strona 1 pomija pierwsze `limit` wyników. Strona 1 zwraca te same wyniki co strona 2 w poprawnej wersji.
- **Jak wykryć:** Pobierz `/courses?page=1&limit=2` i sprawdź czy pierwszy kurs z bazy jest obecny w wynikach. Porównaj wyniki strony 1 i 2 — dane się nie zgadzają z total.
- **Przykładowy test:**
```bash
TOKEN="..." # zaloguj się dowolnym kontem

# Pobierz total
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8081/courses?page=1&limit=100" | jq '.total'

# Pobierz stronę 1 (limit=2)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8081/courses?page=1&limit=2" | jq '.data[].title'

# Pobierz stronę 2 (limit=2)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8081/courses?page=2&limit=2" | jq '.data[].title'

# Z bugiem: strona 1 pomija 2 pierwsze kursy, strona 2 pomija 4 pierwsze
```
- **Ryzyko/Impact:** Użytkownicy nigdy nie widzą pierwszych wyników, dane z paginacji mają luki, testy integracyjne mogą przechodzić z małą ilością danych ale failować z większą
- **Kategoria:** Functional, Pagination

---

### BUG_NPLUS1_COURSES

- **Flaga:** `BUG_NPLUS1_COURSES=1`
- **Moduł:** `apps/api/src/modules/courses/courses.handlers.ts`
- **Objawy:** Zamiast jednego zapytania SQL z `include: { sessions: true }`, API wykonuje osobne zapytanie `SELECT * FROM sessions WHERE courseId = ?` dla każdego kursu. Przy N kursach = N+1 zapytań.
- **Jak wykryć:** Włącz logi Prisma (`prisma.$on("query", ...)`) i policz liczbę zapytań SELECT przy `GET /courses`. Przy 4 kursach powinno być 1-2 zapytań, a jest 5+.
- **Przykładowy test:**
```bash
# Włącz logi Prisma i obserwuj stdout API:
# Oczekiwane: 1 SELECT na courses z JOIN/subquery na sessions
# Z bugiem: 1 SELECT courses + 4 SELECT sessions (dla 4 kursów)

# Alternatywnie zmierz czas odpowiedzi:
time curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8081/courses?page=1&limit=100" > /dev/null
```
- **Ryzyko/Impact:** Degradacja wydajności proporcjonalna do ilości danych, przy 100 kursach = 101 zapytań, timeout przy dużych zbiorach danych
- **Kategoria:** Performance

---

### BUG_BOOKINGS_PAST_ALLOWED

- **Flaga:** `BUG_BOOKINGS_PAST_ALLOWED=1`
- **Moduł:** `apps/api/src/modules/bookings/bookings.handlers.ts`
- **Objawy:** API nie waliduje czy sesja już się rozpoczęła — pozwala rezerwować sesje z datą `startsAt` w przeszłości. Request zwraca 201 zamiast 400.
- **Jak wykryć:** Utwórz (lub znajdź) sesję z datą w przeszłości i spróbuj ją zarezerwować. Powinien być błąd 400 `SESSION_IN_PAST`, a dostaniesz 201.
- **Przykładowy test:**
```bash
# Znajdź sesję z datą w przeszłości (jeśli istnieje) lub utwórz jedną przez API
# Potem:
curl -s -w "\n%{http_code}" \
  -X POST http://localhost:8081/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<ID_SESJI_Z_PRZESZLOSCI>"}'

# Oczekiwane: 400 + {"code":"SESSION_IN_PAST",...}
# Z bugiem: 201 + nowa rezerwacja
```
- **Ryzyko/Impact:** Niespójne dane w systemie, raportowanie uczestnictwa w sesjach które już się odbyły, potencjalne naruszenia regulaminu
- **Kategoria:** Functional, Business logic, Validation

---

### BUG_BOOKINGS_RACE

- **Flaga:** `BUG_BOOKINGS_RACE=1`
- **Moduł:** `apps/api/src/modules/bookings/bookings.handlers.ts`
- **Objawy:** Sztuczny delay 200ms między sprawdzeniem capacity a insertem rezerwacji. Dwa równoległe requesty mogą oba przejść walidację capacity i oba utworzyć rezerwację, przekraczając limit miejsc.
- **Jak wykryć:** Utwórz sesję z `capacity=1`, zaloguj się jako 2 różnych userów i wyślij `POST /bookings` jednocześnie. Oba requesty dostaną 201.
- **Przykładowy test:**
```bash
# Zaloguj się jako 2 różni użytkownicy
TOKEN_A="..." # student
TOKEN_B="..." # mentor

# Wyślij 2 requesty jednocześnie (sesja z capacity=1)
curl -s -X POST http://localhost:8081/bookings \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<SESSION_ID>"}' &

curl -s -X POST http://localhost:8081/bookings \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<SESSION_ID>"}' &

wait
# Z bugiem: oba zwracają 201, capacity przekroczone
```

Alternatywnie w JavaScript:
```javascript
await Promise.all([
  fetch("/bookings", { method: "POST", headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ sessionId }) }),
  fetch("/bookings", { method: "POST", headers: { Authorization: `Bearer ${tokenB}` }, body: JSON.stringify({ sessionId }) }),
]);
```
- **Ryzyko/Impact:** Overbooking sesji, przekroczenie fizycznej pojemności sali/spotkania, niespójność danych
- **Kategoria:** Functional, Concurrency, Race condition

---

### BUG_BOOKINGS_LEAK

- **Flaga:** `BUG_BOOKINGS_LEAK=1`
- **Moduł:** `apps/api/src/modules/bookings/bookings.handlers.ts`
- **Objawy:** `GET /bookings/mine` zwraca rezerwacje **WSZYSTKICH** użytkowników zamiast filtrować po zalogowanym userze. Query `where` jest pustym obiektem `{}`.
- **Jak wykryć:** Zaloguj się jako nowy user (bez rezerwacji) i sprawdź odpowiedź `GET /bookings/mine` — zobaczysz cudze rezerwacje. Porównaj `userId` w wynikach z własnym ID.
- **Przykładowy test:**
```bash
# Zaloguj się jako student
TOKEN=$(curl -s -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@qualitycat.dev","password":"password123"}' | jq -r .token)

# Pobierz "moje" rezerwacje
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/bookings/mine | jq '.[].userId'

# Z bugiem: zobaczysz różne userId (nie tylko swoje)
# Poprawnie: tylko twoje userId
```
- **Ryzyko/Impact:** **Wyciek danych osobowych** — naruszenie prywatności użytkowników, potencjalne naruszenie RODO/GDPR, ujawnienie harmonogramów i aktywności innych użytkowników
- **Kategoria:** Security, Data leak, Authorization

---

### BUG_CORS_MISCONFIG

- **Flaga:** `BUG_CORS_MISCONFIG=1`
- **Moduł:** `apps/api/src/plugins/cors.ts`
- **Objawy:** Konfiguracja CORS zawiera `allowedHeaders: ["Content-Type"]` bez `"Authorization"`. Przeglądarka blokuje preflight (OPTIONS) dla requestów z headerem `Authorization: Bearer <JWT>`. Efekt: **wszystkie** autentykowane requesty z frontendu przestają działać.
- **Jak wykryć:** Otwórz konsolę przeglądarki (DevTools → Console/Network), zaloguj się i sprawdź błędy CORS. Preflight response nie zawiera `access-control-allow-headers: authorization`.
- **Przykładowy test:**
```bash
# Sprawdź preflight response
curl -s -X OPTIONS http://localhost:8081/courses \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -D - -o /dev/null | grep -i access-control-allow-headers

# Poprawnie: access-control-allow-headers: Content-Type, Authorization
# Z bugiem: access-control-allow-headers: Content-Type (brak Authorization)
```
- **Ryzyko/Impact:** Frontend całkowicie traci dostęp do chronionych endpointów, aplikacja wygląda jakby "nie działała" po zalogowaniu, trudny do zdiagnozowania dla początkujących testerów
- **Kategoria:** Security, CORS, Configuration

---

## Bugi frontendowe

### VITE_BUG_UI_DOUBLE_SUBMIT

- **Flaga:** `VITE_BUG_UI_DOUBLE_SUBMIT=1`
- **Moduł:** `apps/web/src/components/SessionCard.tsx`
- **Objawy:** Przycisk "Zarezerwuj" nie jest blokowany (`disabled`) podczas trwania mutacji. Szybkie podwójne kliknięcie wysyła 2 requesty `POST /bookings`, tworząc duplikat rezerwacji.
- **Jak wykryć:** Otwórz sesję z wolnymi miejscami, kliknij "Book" dwa razy bardzo szybko. Sprawdź `/bookings` — pojawiły się 2 rezerwacje na tę samą sesję.
- **Przykładowy test (Playwright):**
```typescript
test("double click creates duplicate booking", async ({ page }) => {
  await login(page, "student@qualitycat.dev", "password123");
  await page.goto("/courses/<COURSE_ID>");

  const bookBtn = page.getByRole("button", { name: "Zarezerwuj" }).first();
  // Szybkie podwójne kliknięcie
  await bookBtn.dblclick();
  await page.waitForTimeout(1000);

  await page.goto("/bookings");
  // Oczekiwane: 1 rezerwacja. Z bugiem: 2 rezerwacje na tę samą sesję
});
```
- **Ryzyko/Impact:** Duplikaty rezerwacji, zużycie dodatkowych miejsc, frustracja użytkownika przy anulowaniu duplikatów
- **Kategoria:** UX, Functional

---

### VITE_BUG_CACHE_STALE

- **Flaga:** `VITE_BUG_CACHE_STALE=1`
- **Moduł:** `apps/web/src/components/SessionCard.tsx`
- **Objawy:** Po udanej rezerwacji cache react-query **nie jest invalidowany**. Liczba wolnych miejsc na stronie nie zmienia się. Dopiero ręczne odświeżenie strony (F5) aktualizuje dane.
- **Jak wykryć:** Zarezerwuj sesję i obserwuj licznik "available" — powinien zmaleć o 1, ale nadal pokazuje starą wartość. Odśwież stronę — dopiero teraz jest poprawna.
- **Przykładowy test (Playwright):**
```typescript
test("seat count does not update after booking", async ({ page }) => {
  await login(page, "student@qualitycat.dev", "password123");
  await page.goto("/courses/<COURSE_ID>");

  // Zapamiętaj liczbę miejsc
  const before = await page.locator("[data-testid='available']").first().textContent();
  await page.getByRole("button", { name: "Zarezerwuj" }).first().click();
  await page.waitForTimeout(500);

  // Sprawdź bez odświeżania
  const after = await page.locator("[data-testid='available']").first().textContent();
  // Z bugiem: before === after (nie odświeżyło się)
  // Poprawnie: after = before - 1
});
```
- **Ryzyko/Impact:** Użytkownik widzi nieaktualne dane, może próbować zarezerwować sesję która jest już pełna, złe UX
- **Kategoria:** UX, Cache

---

### VITE_BUG_TIMEZONE_SHIFT

- **Flaga:** `VITE_BUG_TIMEZONE_SHIFT=1`
- **Moduł:** `apps/web/src/components/SessionCard.tsx`
- **Objawy:** Godziny sesji wyświetlane na stronie są przesunięte o **+1 godzinę** względem danych z API. Sesja o 10:00 wyświetla się jako 11:00.
- **Jak wykryć:** Porównaj godzinę wyświetlaną na stronie z odpowiedzią `GET /courses/:id` z API. Będzie różnica +1h.
- **Przykładowy test:**
```bash
# 1. Pobierz dane sesji z API
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/courses/<COURSE_ID> | jq '.sessions[0].startsAt'
# np. "2025-06-15T10:00:00.000Z"

# 2. Sprawdź co wyświetla frontend — powinno być 10:00, a jest 11:00
```

Playwright:
```typescript
test("session time matches API data", async ({ page, request }) => {
  const api = await request.get("http://localhost:8081/courses/<COURSE_ID>",
    { headers: { Authorization: `Bearer ${token}` } });
  const { sessions } = await api.json();
  const apiTime = new Date(sessions[0].startsAt).toLocaleTimeString();

  await page.goto("/courses/<COURSE_ID>");
  const uiTime = await page.locator(".session-time").first().textContent();
  // Z bugiem: uiTime !== apiTime (różnica +1h)
});
```
- **Ryzyko/Impact:** Użytkownicy przychodzą o złej godzinie, nieufność do systemu, problemy w różnych strefach czasowych się kumulują
- **Kategoria:** Functional, Data integrity

---

### VITE_BUG_ERROR_MESSAGE

- **Flaga:** `VITE_BUG_ERROR_MESSAGE=1`
- **Moduł:** `apps/web/src/components/ErrorMessage.tsx`
- **Objawy:** Przy błędach serwera (HTTP 500+) wyświetla się komunikat **"Problem z połączeniem"** zamiast **"Błąd serwera"**. Komunikat sugeruje problem z siecią, a nie błąd po stronie serwera.
- **Jak wykryć:** Wywołaj sytuację generującą HTTP 500 (np. z `BUG_AUTH_WRONG_STATUS`) i sprawdź treść komunikatu błędu na stronie.
- **Przykładowy test (manualny):**
  1. Włącz `BUG_AUTH_WRONG_STATUS=1` + `VITE_BUG_ERROR_MESSAGE=1`
  2. Spróbuj się zalogować z błędnym hasłem
  3. Oczekiwany komunikat: "Nieprawidłowy email lub hasło"
  4. Z bugami: "Problem z połączeniem" (bo backend zwraca 500, a frontend mapuje 500 na "problem z połączeniem")

Playwright:
```typescript
test("wrong login shows misleading message", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "student@qualitycat.dev");
  await page.fill('[name="password"]', "wrong");
  await page.click('button[type="submit"]');

  // Z bugiem: "Problem z połączeniem"
  // Poprawnie: "Nieprawidłowy email lub hasło" (401) lub "Błąd serwera" (500)
  const error = await page.locator('[role="alert"]').textContent();
});
```
- **Ryzyko/Impact:** Użytkownik myśli że problem jest z siecią/serwerem, nie z jego danymi. Helpdesk dostaje zgłoszenia "nie działa internet" zamiast "niepoprawne hasło"
- **Kategoria:** UX, Error handling

---

### VITE_BUG_FORM_VALIDATION

- **Flaga:** `VITE_BUG_FORM_VALIDATION=1`
- **Moduł:** `apps/web/src/pages/CreateCoursePage.tsx`
- **Objawy:** Cała walidacja client-side formularza tworzenia kursu jest pominięta. Można wysłać formularz z pustym tytułem (mniej niż 3 znaki) i pustym opisem. Request leci prosto do API.
- **Jak wykryć:** Otwórz `/courses/new` (jako mentor/admin), zostaw puste pola i kliknij submit. Formularz nie pokaże błędu walidacji.
- **Przykładowy test (Playwright):**
```typescript
test("empty form submits without validation", async ({ page }) => {
  await login(page, "mentor@qualitycat.dev", "password123");
  await page.goto("/courses/new");

  // Nie wypełniaj nic, od razu submit
  await page.click('button[type="submit"]');

  // Poprawnie: pojawi się "Title must be at least 3 characters"
  // Z bugiem: brak komunikatu, request leci do API
  const validationError = page.locator('[role="alert"]');
  // Z bugiem: brak walidacji po stronie klienta
});
```
- **Ryzyko/Impact:** Zanieczyszczone dane w bazie (kursy bez tytułu), słabe UX (błąd dopiero z API), potencjalnie nieczytelne karty kursów na liście
- **Kategoria:** UX, Validation

---

### VITE_BUG_XSS_DESCRIPTION

- **Flaga:** `VITE_BUG_XSS_DESCRIPTION=1`
- **Moduł:** `apps/web/src/pages/CourseDetailPage.tsx`
- **Objawy:** Opis kursu jest renderowany przez `dangerouslySetInnerHTML` zamiast jako plain text. Dowolny HTML/JavaScript wstrzyknięty w pole `description` jest wykonywany w przeglądarce użytkownika. **Stored XSS.**
- **Jak wykryć:** Utwórz kurs z opisem zawierającym `<script>alert('XSS')</script>` lub `<img src=x onerror="alert(1)">`. Otwórz szczegóły kursu — JavaScript się wykona.
- **Przykładowy test:**
```bash
# 1. Utwórz kurs z payloadem XSS (jako mentor)
TOKEN_MENTOR=$(curl -s -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@qualitycat.dev","password":"password123"}' | jq -r .token)

curl -X POST http://localhost:8081/courses \
  -H "Authorization: Bearer $TOKEN_MENTOR" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "XSS Test Course",
    "description": "<img src=x onerror=\"alert(document.cookie)\">",
    "level": "BEGINNER"
  }'

# 2. Otwórz /courses/:id w przeglądarce — alert z cookies się wykona
```

Playwright:
```typescript
test("XSS payload executes in description", async ({ page }) => {
  // Po utworzeniu kursu z payloadem XSS przez API:
  await page.goto("/courses/<XSS_COURSE_ID>");

  // Sprawdź czy img tag został wyrenderowany jako HTML
  const imgTag = page.locator('img[src="x"]');
  // Z bugiem: img tag istnieje w DOM (dangerouslySetInnerHTML)
  // Poprawnie: opis wyświetlony jako tekst, brak tagu img
  await expect(imgTag).toBeVisible(); // Z bugiem — HTML się wyrenderował
});
```
- **Ryzyko/Impact:** **Krytyczna luka bezpieczeństwa** — atakujący może wykraść sesje (cookies/JWT), przekierować użytkowników, modyfikować zawartość strony, wykonywać akcje w imieniu ofiary (CSRF). Naruszenie OWASP Top 10 (A7: Cross-Site Scripting)
- **Kategoria:** Security, XSS

---

## Matryca bugów

| ID | Flaga | Kategoria | Typ | Severity | Trudność znalezienia |
|----|-------|-----------|-----|----------|---------------------|
| 1 | `BUG_AUTH_WRONG_STATUS` | Backend | Functional, HTTP semantics | Medium | Łatwa |
| 2 | `BUG_PAGINATION_MIXED_BASE` | Backend | Functional, Pagination | Medium | Średnia |
| 3 | `BUG_NPLUS1_COURSES` | Backend | Performance | Low | Trudna |
| 4 | `BUG_BOOKINGS_PAST_ALLOWED` | Backend | Functional, Validation | High | Średnia |
| 5 | `BUG_BOOKINGS_RACE` | Backend | Functional, Concurrency | Critical | Trudna |
| 6 | `BUG_BOOKINGS_LEAK` | Backend | Security, Data leak | Critical | Łatwa |
| 7 | `BUG_CORS_MISCONFIG` | Backend | Security, CORS | High | Średnia |
| 8 | `VITE_BUG_UI_DOUBLE_SUBMIT` | Frontend | UX, Functional | Medium | Średnia |
| 9 | `VITE_BUG_CACHE_STALE` | Frontend | UX, Cache | Low | Średnia |
| 10 | `VITE_BUG_TIMEZONE_SHIFT` | Frontend | Functional, Data integrity | Medium | Średnia |
| 11 | `VITE_BUG_ERROR_MESSAGE` | Frontend | UX, Error handling | Low | Łatwa |
| 12 | `VITE_BUG_FORM_VALIDATION` | Frontend | UX, Validation | Medium | Łatwa |
| 13 | `VITE_BUG_XSS_DESCRIPTION` | Frontend | Security, XSS | Critical | Średnia |

### Rozkład według severity

| Severity | Ilość | Bugi |
|----------|-------|------|
| Critical | 3 | BUG_BOOKINGS_RACE, BUG_BOOKINGS_LEAK, VITE_BUG_XSS_DESCRIPTION |
| High | 2 | BUG_BOOKINGS_PAST_ALLOWED, BUG_CORS_MISCONFIG |
| Medium | 5 | BUG_AUTH_WRONG_STATUS, BUG_PAGINATION_MIXED_BASE, VITE_BUG_UI_DOUBLE_SUBMIT, VITE_BUG_TIMEZONE_SHIFT, VITE_BUG_FORM_VALIDATION |
| Low | 3 | BUG_NPLUS1_COURSES, VITE_BUG_CACHE_STALE, VITE_BUG_ERROR_MESSAGE |

### Rozkład według typu

| Typ | Bugi |
|-----|------|
| Functional | 1, 2, 4, 5, 8, 10 |
| Security | 6, 7, 13 |
| Performance | 3 |
| UX | 8, 9, 11, 12 |

### Znane interakcje między bugami

| Kombinacja | Efekt |
|------------|-------|
| `BUG_AUTH_WRONG_STATUS` + `VITE_BUG_ERROR_MESSAGE` | Login z błędnym hasłem: backend zwraca 500, frontend wyświetla "Problem z połączeniem" zamiast komunikatu o błędnych danych |
| `BUG_BOOKINGS_RACE` + `VITE_BUG_UI_DOUBLE_SUBMIT` | Double-click + race condition = łatwe przekroczenie capacity nawet przy jednym userze |
| `VITE_BUG_FORM_VALIDATION` + `VITE_BUG_XSS_DESCRIPTION` | Brak walidacji pozwala łatwiej wstrzyknąć payload XSS (choć XSS jest w opisie, nie w tytule) |
| `BUG_CORS_MISCONFIG` + dowolny frontend bug | CORS blokuje wszystkie autentykowane requesty — inne bugi frontendowe stają się niemożliwe do zaobserwowania |
