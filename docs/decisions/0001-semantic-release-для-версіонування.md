# ADR-0001: Використання semantic-release для автоматичного версіонування

- **Дата:** 2026-06-30
- **Статус:** Accepted

## Контекст

Проєкт використовує conventional commits. Версії та CHANGELOG потрібно підтримувати
вручну, що призводить до помилок і забування оновлень при кожному релізі.

## Рішення

Використовуємо `semantic-release` з плагінами:
- `@semantic-release/commit-analyzer` — визначає тип релізу з повідомлень комітів
- `@semantic-release/changelog` — генерує/оновлює `CHANGELOG.md`
- `@semantic-release/npm` — бампає версію в `package.json` (без публікації в npm)
- `@semantic-release/git` — комітить `CHANGELOG.md` і `package.json` назад у репо
- `@semantic-release/github` — створює GitHub Release

Запускається автоматично у GitHub Actions після успішних тестів на гілці `main`.

## Наслідки

**Позитивні:**
- CHANGELOG і версія в `package.json` завжди актуальні без ручної роботи
- GitHub Releases створюються автоматично з описом змін

**Негативні / компроміси:**
- Дисципліна conventional commits стає обов'язковою — неправильний формат коміту
  не спричинить релізу (`fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major)
- Job `release` потребує `GITHUB_TOKEN` з дозволами на запис у репо
