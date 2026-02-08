export interface BugCatalogEntry {
  id: string;
  category: "backend" | "frontend" | "performance" | "security";
  title: string;
  description: string;
  flag: string;
  severity: "low" | "medium" | "high" | "critical";
  hints: string[];
  testIdea: string;
}

export const BUGS_CATALOG: BugCatalogEntry[] = [
  // --- Backend bugs ---
  {
    id: "BUG_AUTH_WRONG_STATUS",
    category: "backend",
    title: "Wrong status on auth failure",
    description: "Błędny login zwraca HTTP 500 zamiast 401",
    flag: "BUG_AUTH_WRONG_STATUS",
    severity: "medium",
    hints: [
      "Sprawdź status code przy niepoprawnym haśle",
      "Porównaj z dokumentacją REST — jaki kod powinien być?",
    ],
    testIdea:
      "Wyślij POST /auth/login z błędnym hasłem i sprawdź status code",
  },
  {
    id: "BUG_PAGINATION_MIXED_BASE",
    category: "backend",
    title: "Pagination off-by-one",
    description:
      "Paginacja traktuje page jako 0-based (skip = page * limit zamiast (page-1) * limit), przez co strona 1 pomija pierwsze wyniki",
    flag: "BUG_PAGINATION_MIXED_BASE",
    severity: "medium",
    hints: [
      "Pobierz GET /courses?page=1&limit=2 i porównaj z total",
      "Sprawdź czy pierwszy kurs z bazy pojawia się na stronie 1",
    ],
    testIdea:
      "Utwórz 3 kursy, pobierz ?page=1&limit=2 — powinny być 2 wyniki, ale pierwszy kurs z bazy jest pominięty",
  },
  {
    id: "BUG_NPLUS1_COURSES",
    category: "performance",
    title: "N+1 query on courses",
    description:
      "Zamiast jednego zapytania z include sessions, API wykonuje osobne zapytanie o sesje dla każdego kursu",
    flag: "BUG_NPLUS1_COURSES",
    severity: "low",
    hints: [
      "Włącz logi Prisma i policz liczbę zapytań SELECT przy listowaniu kursów",
      "Przy 4 kursach powinno być 1-2 zapytania, nie 5+",
    ],
    testIdea:
      "Pobierz GET /courses z włączonymi logami DB i policz zapytania SQL — powinno być jedno z JOIN, a jest N+1",
  },
  {
    id: "BUG_BOOKINGS_PAST_ALLOWED",
    category: "backend",
    title: "Booking past sessions",
    description:
      "API nie waliduje czy sesja już się rozpoczęła — pozwala rezerwować przeszłe sesje",
    flag: "BUG_BOOKINGS_PAST_ALLOWED",
    severity: "high",
    hints: [
      "Utwórz sesję z datą w przeszłości i spróbuj ją zarezerwować",
      "Sprawdź czy API porównuje startsAt z aktualną datą",
    ],
    testIdea:
      "POST /bookings z sessionId sesji, której startsAt < now() — powinien zwrócić 400, ale zwraca 201",
  },
  {
    id: "BUG_BOOKINGS_RACE",
    category: "backend",
    title: "Race condition on capacity",
    description:
      "Sztuczny delay między sprawdzeniem capacity a insertem pozwala dwóm równoległym requestom przekroczyć limit miejsc",
    flag: "BUG_BOOKINGS_RACE",
    severity: "critical",
    hints: [
      "Utwórz sesję z capacity=1 i wyślij 2 requesty booking jednocześnie",
      "Użyj Promise.all lub curl w tle",
    ],
    testIdea:
      "Sesja z capacity=1, dwóch userów wysyła POST /bookings w tym samym momencie — oba dostają 201",
  },
  {
    id: "BUG_BOOKINGS_LEAK",
    category: "security",
    title: "Data leak — all bookings exposed",
    description:
      "GET /bookings/mine zwraca rezerwacje WSZYSTKICH użytkowników zamiast filtrować po zalogowanym userze",
    flag: "BUG_BOOKINGS_LEAK",
    severity: "critical",
    hints: [
      "Zaloguj się jako student i sprawdź ile rezerwacji widzisz",
      "Porównaj z liczbą rezerwacji tego studenta w bazie",
    ],
    testIdea:
      "Zaloguj się jako student, GET /bookings/mine — zobaczysz rezerwacje innych userów",
  },
  {
    id: "BUG_CORS_MISCONFIG",
    category: "frontend",
    title: "CORS blocks Authorization",
    description:
      "Konfiguracja CORS nie zawiera 'Authorization' w allowedHeaders — preflight blokuje requesty z tokenem JWT",
    flag: "BUG_CORS_MISCONFIG",
    severity: "high",
    hints: [
      "Otwórz konsolę przeglądarki i sprawdź błędy CORS",
      "Porównaj nagłówki preflight response z wymaganymi",
    ],
    testIdea:
      "Z frontendu wyślij request z Authorization header — przeglądarka zablokuje go na etapie preflight",
  },
  // --- Frontend bugs ---
  {
    id: "VITE_BUG_UI_DOUBLE_SUBMIT",
    category: "frontend",
    title: "Double submit on booking",
    description:
      "Przycisk 'Zarezerwuj' nie jest blokowany podczas wysyłania — szybkie podwójne kliknięcie tworzy duplikat rezerwacji",
    flag: "VITE_BUG_UI_DOUBLE_SUBMIT",
    severity: "medium",
    hints: [
      "Kliknij przycisk Book dwa razy bardzo szybko",
      "Sprawdź w /bookings/mine czy nie ma duplikatu",
    ],
    testIdea:
      "Otwórz sesję z wolnymi miejscami, kliknij Book podwójnie — sprawdź czy powstały 2 rezerwacje",
  },
  {
    id: "VITE_BUG_CACHE_STALE",
    category: "frontend",
    title: "Stale cache after booking",
    description:
      "Po udanej rezerwacji nie odświeża się liczba wolnych miejsc — cache react-query nie jest invalidowany",
    flag: "VITE_BUG_CACHE_STALE",
    severity: "low",
    hints: [
      "Zarezerwuj sesję i sprawdź czy liczba 'available' się zmieniła",
      "Odśwież stronę ręcznie — dopiero wtedy dane się zaktualizują",
    ],
    testIdea:
      "Zarezerwuj sesję, obserwuj licznik wolnych miejsc — powinien się zmniejszyć, ale się nie zmienia",
  },
  {
    id: "VITE_BUG_TIMEZONE_SHIFT",
    category: "frontend",
    title: "Timezone shift +1h",
    description:
      "Godziny sesji są przesunięte o +1 godzinę względem danych z API",
    flag: "VITE_BUG_TIMEZONE_SHIFT",
    severity: "medium",
    hints: [
      "Porównaj godzinę sesji na stronie z odpowiedzią GET /sessions",
      "Sprawdź czy frontend nie dodaje offsetu do daty",
    ],
    testIdea:
      "Porównaj startsAt z API response z tym co wyświetla się na stronie — powinno być to samo, a jest +1h",
  },
  {
    id: "VITE_BUG_ERROR_MESSAGE",
    category: "frontend",
    title: "Misleading error message",
    description:
      "Przy błędzie serwera (500) wyświetla się 'Problem z połączeniem' zamiast 'Błąd serwera'",
    flag: "VITE_BUG_ERROR_MESSAGE",
    severity: "low",
    hints: [
      "Wywołaj sytuację 500 (np. z BUG_AUTH_WRONG_STATUS) i sprawdź komunikat",
      "Porównaj komunikat z rzeczywistym status code",
    ],
    testIdea:
      "Włącz BUG_AUTH_WRONG_STATUS, spróbuj się zalogować z błędnym hasłem — komunikat mówi o połączeniu, nie o serwerze",
  },
  {
    id: "VITE_BUG_FORM_VALIDATION",
    category: "frontend",
    title: "Missing form validation",
    description:
      "Formularz tworzenia kursu nie waliduje tytułu — można wysłać pusty tytuł",
    flag: "VITE_BUG_FORM_VALIDATION",
    severity: "medium",
    hints: [
      "Otwórz /courses/new i spróbuj submitnąć formularz z pustym tytułem",
      "Sprawdź czy frontend sprawdza minimum length",
    ],
    testIdea:
      "Jako mentor otwórz Create Course, zostaw puste pole Title i kliknij submit — formularz powinien zablokować, ale tego nie robi",
  },
  {
    id: "VITE_BUG_XSS_DESCRIPTION",
    category: "security",
    title: "XSS in course description",
    description:
      "Opis kursu jest renderowany przez dangerouslySetInnerHTML zamiast jako plain text — HTML/JS w opisie jest wykonywany",
    flag: "VITE_BUG_XSS_DESCRIPTION",
    severity: "critical",
    hints: [
      "Utwórz kurs z opisem zawierającym <script> lub <img onerror>",
      "Otwórz szczegóły kursu i sprawdź czy HTML się wyrenderował",
    ],
    testIdea:
      'Utwórz kurs z description: \'<img src=x onerror="alert(1)">\' i otwórz /courses/:id — alert powinien się wykonać',
  },
];
