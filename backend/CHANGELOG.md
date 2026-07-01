## [1.31.2](https://github.com/Shchebyvovk/huligan/compare/v1.31.1...v1.31.2) (2026-07-01)


### Bug Fixes

* **notifications:** fire for runs completed between polls using createdAt recency check ([a531074](https://github.com/Shchebyvovk/huligan/commit/a531074330128a21b7c8358b03151b391118e21d))

## [1.31.1](https://github.com/Shchebyvovk/huligan/compare/v1.31.0...v1.31.1) (2026-07-01)


### Bug Fixes

* **notifications:** add error diagnostics to test button ([984870b](https://github.com/Shchebyvovk/huligan/commit/984870ba912ac7f76a6571373f84fb210341c912))

# [1.31.0](https://github.com/Shchebyvovk/huligan/compare/v1.30.1...v1.31.0) (2026-07-01)


### Features

* **notifications:** add test button in settings ([1bbd585](https://github.com/Shchebyvovk/huligan/commit/1bbd58568beeb650f46f4752e207aa25d4025cf2))

## [1.30.1](https://github.com/Shchebyvovk/huligan/compare/v1.30.0...v1.30.1) (2026-07-01)


### Bug Fixes

* **notifications:** use useRef for status tracking, add 10s background poll ([9d110e1](https://github.com/Shchebyvovk/huligan/commit/9d110e17a8166cd6f09c2688b680029e1966461d))

# [1.30.0](https://github.com/Shchebyvovk/huligan/compare/v1.29.3...v1.30.0) (2026-07-01)


### Features

* **notifications:** browser notifications for run completion, settings toggle ([c997f75](https://github.com/Shchebyvovk/huligan/commit/c997f7503417e68167bd95e604adc6f6b0235b38))

## [1.29.3](https://github.com/Shchebyvovk/huligan/compare/v1.29.2...v1.29.3) (2026-07-01)


### Bug Fixes

* **scheduler:** create run in DB before firing runJob, fix argument contract ([cb61247](https://github.com/Shchebyvovk/huligan/commit/cb61247a2a45c8a857a5a6509094e8002237062d))

## [1.29.2](https://github.com/Shchebyvovk/huligan/compare/v1.29.1...v1.29.2) (2026-07-01)


### Bug Fixes

* **retry:** exponential backoff with jitter for 429/502/503, max 3 retries ([b9e1a79](https://github.com/Shchebyvovk/huligan/commit/b9e1a798c6342cd742373872a93fb96d559f3d23))

## [1.29.1](https://github.com/Shchebyvovk/huligan/compare/v1.29.0...v1.29.1) (2026-07-01)


### Bug Fixes

* **scheduler:** fix apostrophe syntax error in Ukrainian string ([a077517](https://github.com/Shchebyvovk/huligan/commit/a0775173ef4787e11ff358557c9b58c813592716))

# [1.29.0](https://github.com/Shchebyvovk/huligan/compare/v1.28.2...v1.29.0) (2026-07-01)


### Features

* **scheduler:** scheduled runs with repeat and max iterations ([41113d9](https://github.com/Shchebyvovk/huligan/commit/41113d95bfa68b593bdd9245a47d78e051e35193))

## [1.28.2](https://github.com/Shchebyvovk/huligan/compare/v1.28.1...v1.28.2) (2026-07-01)


### Bug Fixes

* **settings:** validate max runs (1-1000) and trash days (1-90) with inline errors ([97bf27d](https://github.com/Shchebyvovk/huligan/commit/97bf27dcf04d9351816e630d24c4b6c23d5dc792))

## [1.28.1](https://github.com/Shchebyvovk/huligan/compare/v1.28.0...v1.28.1) (2026-07-01)


### Bug Fixes

* **compare:** align summary stats to left/right columns ([dd062b7](https://github.com/Shchebyvovk/huligan/commit/dd062b736fab2ca3b2fbf70039d60144d5b7162b))

# [1.28.0](https://github.com/Shchebyvovk/huligan/compare/v1.27.0...v1.28.0) (2026-07-01)


### Features

* run selection, trash, and comparison ([dbaa29a](https://github.com/Shchebyvovk/huligan/commit/dbaa29ab7fd5c37327855f42d424d9b4fd5e0803))

# [1.27.0](https://github.com/Shchebyvovk/huligan/compare/v1.26.2...v1.27.0) (2026-07-01)


### Features

* partial status + run retention setting ([841b096](https://github.com/Shchebyvovk/huligan/commit/841b0967af3786f99d0f63523b68f1aff70945bd))

## [1.26.2](https://github.com/Shchebyvovk/huligan/compare/v1.26.1...v1.26.2) (2026-07-01)


### Bug Fixes

* record actual ms for failed requests + retry on 429/502/503 ([0d90fa9](https://github.com/Shchebyvovk/huligan/commit/0d90fa9d31f5bec94ba5e78647dd6589daaa40a3))

## [1.26.1](https://github.com/Shchebyvovk/huligan/compare/v1.26.0...v1.26.1) (2026-07-01)


### Bug Fixes

* ramp-up now correctly spaces users in time, not slots ([6ca04b1](https://github.com/Shchebyvovk/huligan/commit/6ca04b12d26ce53550d67adcff0d4f2fbe8e611b))

# [1.26.0](https://github.com/Shchebyvovk/huligan/compare/v1.25.0...v1.26.0) (2026-07-01)


### Features

* ramp-up support for load test runs ([7202b85](https://github.com/Shchebyvovk/huligan/commit/7202b852e938a232360c114a25e55a0411136079))

# [1.25.0](https://github.com/Shchebyvovk/huligan/compare/v1.24.0...v1.25.0) (2026-07-01)


### Features

* register scenario step + scenario editor docs panel ([16d4dca](https://github.com/Shchebyvovk/huligan/commit/16d4dcabbe8b2bcd242273de2055a4348e611106))

# [1.24.0](https://github.com/Shchebyvovk/huligan/compare/v1.23.0...v1.24.0) (2026-07-01)


### Bug Fixes

* target server accepts any email/password ([e3505c2](https://github.com/Shchebyvovk/huligan/commit/e3505c22a3bd7b5f5060099ecbd02e783780aabb))


### Features

* latency SVG chart and detailed error breakdown per step ([58128e3](https://github.com/Shchebyvovk/huligan/commit/58128e3232e0dad8d05f4842c299393686e5bc80))
* live run progress bar ([24cbdd2](https://github.com/Shchebyvovk/huligan/commit/24cbdd2bf0a7e5decd28f59e5fc9745e3ca9f26f))
* persist scenarios in PostgreSQL instead of ephemeral filesystem ([513a02a](https://github.com/Shchebyvovk/huligan/commit/513a02a2466b4160daed54eca1f7e3afa9d33cc4))
* show error messages per step in run card ([dfb919c](https://github.com/Shchebyvovk/huligan/commit/dfb919c796616197171a357bf03ae6cc0938453e))

# [1.23.0](https://github.com/Shchebyvovk/huligan/compare/v1.22.0...v1.23.0) (2026-07-01)


### Features

* show invite link in UI with copy button ([2d55528](https://github.com/Shchebyvovk/huligan/commit/2d5552887f86d10387fe05f355e356364157489c))

# [1.22.0](https://github.com/Shchebyvovk/huligan/compare/v1.21.3...v1.22.0) (2026-07-01)


### Features

* send invite via mailto instead of SMTP ([9d6b948](https://github.com/Shchebyvovk/huligan/commit/9d6b9489dbf9587283ac20a68f92b2760fbedb42))

## [1.21.3](https://github.com/Shchebyvovk/huligan/compare/v1.21.2...v1.21.3) (2026-07-01)


### Bug Fixes

* fire-and-forget email, add SMTP timeouts ([e10b27f](https://github.com/Shchebyvovk/huligan/commit/e10b27f13a8a6fa80190b7044fc83c60d910d79e))

## [1.21.2](https://github.com/Shchebyvovk/huligan/compare/v1.21.1...v1.21.2) (2026-07-01)


### Bug Fixes

* switch mailer to nodemailer SMTP (Gmail compatible) ([74203b8](https://github.com/Shchebyvovk/huligan/commit/74203b833e7be13a4af8994b21b566168e8a94d3))

## [1.21.1](https://github.com/Shchebyvovk/huligan/compare/v1.21.0...v1.21.1) (2026-07-01)


### Bug Fixes

* log Resend errors in mailer ([38b2ea6](https://github.com/Shchebyvovk/huligan/commit/38b2ea6f15b4138d8f6fa1747cf6830f9bd148dd))

# [1.21.0](https://github.com/Shchebyvovk/huligan/compare/v1.20.3...v1.21.0) (2026-07-01)


### Features

* admin invite system with email flow ([55f2e78](https://github.com/Shchebyvovk/huligan/commit/55f2e7812406a27245d98dda59b1fdd527b2ca93))

## [1.20.3](https://github.com/Shchebyvovk/huligan/compare/v1.20.2...v1.20.3) (2026-06-30)


### Bug Fixes

* alter test_users to add missing columns ([8091504](https://github.com/Shchebyvovk/huligan/commit/8091504426110db942464a731f335a8ad65e0107))

## [1.20.2](https://github.com/Shchebyvovk/huligan/compare/v1.20.1...v1.20.2) (2026-06-30)


### Bug Fixes

* run migrations automatically on server start ([5f53efb](https://github.com/Shchebyvovk/huligan/commit/5f53efb2885bcd3e5fd313df14d4ba89eb0393ae))

## [1.20.1](https://github.com/Shchebyvovk/huligan/compare/v1.20.0...v1.20.1) (2026-06-30)


### Bug Fixes

* **frontend:** guard against undefined data in UsersPage ([8c737cd](https://github.com/Shchebyvovk/huligan/commit/8c737cd17d6f21e59570b3baf6c3375c22d02f8b))

# [1.20.0](https://github.com/Shchebyvovk/huligan/compare/v1.19.0...v1.20.0) (2026-06-30)


### Features

* users pool page with filter and generate ([f16f0b8](https://github.com/Shchebyvovk/huligan/commit/f16f0b89c3e09813b47f35fa1c3f2dd9125fcff2))

# [1.19.0](https://github.com/Shchebyvovk/huligan/compare/v1.18.0...v1.19.0) (2026-06-30)


### Features

* test user registry with DB pool ([5adf9a1](https://github.com/Shchebyvovk/huligan/commit/5adf9a1d580bc22c30056f911ba12b56fb188cde))

# [1.18.0](https://github.com/Shchebyvovk/huligan/compare/v1.17.0...v1.18.0) (2026-06-30)


### Features

* add real HTTP worker client and targetUrl field ([61bbefa](https://github.com/Shchebyvovk/huligan/commit/61bbefa86a0801d60f4b1e5176cf2c90bfdb9659))
* add target-server (load test victim) ([fbad5f8](https://github.com/Shchebyvovk/huligan/commit/fbad5f8de18e9c321c9310d39139577c104e7a45))
* run stats and target-server metrics ([a71548e](https://github.com/Shchebyvovk/huligan/commit/a71548e934cc0923373d9f266ee5e1973a3bbf10))
* user pool support in scenarios ([a8c0c63](https://github.com/Shchebyvovk/huligan/commit/a8c0c632e0f29c12c4317b03da60320b05d45058))

# [1.17.0](https://github.com/Shchebyvovk/huligan/compare/v1.16.0...v1.17.0) (2026-06-30)


### Features

* **frontend:** add CSS-variable theme system with 3 themes ([01c0d41](https://github.com/Shchebyvovk/huligan/commit/01c0d410437a3afdf4213d48bde2e44e93c93146))

# [1.16.0](https://github.com/Shchebyvovk/huligan/compare/v1.15.0...v1.16.0) (2026-06-30)


### Features

* **i18n:** динамічний список мов через import.meta.glob ([b8fe480](https://github.com/Shchebyvovk/huligan/commit/b8fe480135fab0cf744a6c361453f688a7012c94))

# [1.15.0](https://github.com/Shchebyvovk/huligan/compare/v1.14.0...v1.15.0) (2026-06-30)


### Features

* **i18n:** додати англійську мову, кнопку перемикання в Налаштуваннях ([6aa801a](https://github.com/Shchebyvovk/huligan/commit/6aa801a129c3b9766ca50649e92ccea6a29e2672))

# [1.14.0](https://github.com/Shchebyvovk/huligan/compare/v1.13.2...v1.14.0) (2026-06-30)


### Features

* **frontend:** редактор сценаріїв з AI-генератором (stub) і налаштуваннями ([1955879](https://github.com/Shchebyvovk/huligan/commit/1955879a5b5e7a65312d94c626b66d6dc8a8110d))

## [1.13.2](https://github.com/Shchebyvovk/huligan/compare/v1.13.1...v1.13.2) (2026-06-30)


### Bug Fixes

* **cors:** явно дозволити DELETE в CORS preflight ([61eaad4](https://github.com/Shchebyvovk/huligan/commit/61eaad479fa4fd2bdf413f4f59c78bf4570b2410))

## [1.13.1](https://github.com/Shchebyvovk/huligan/compare/v1.13.0...v1.13.1) (2026-06-30)


### Bug Fixes

* **frontend:** select + кнопка видалити, inline підтвердження, перевірка res.ok ([db56620](https://github.com/Shchebyvovk/huligan/commit/db5662083fcd45a8c4af7e22da94d8332d3b639c))

# [1.13.0](https://github.com/Shchebyvovk/huligan/compare/v1.12.0...v1.13.0) (2026-06-30)


### Features

* **scenarios:** кнопка видалення і ліміт 10 останніх сценаріїв ([958a996](https://github.com/Shchebyvovk/huligan/commit/958a99641585f0cbcadc71e569cc359cc822f3dc))

# [1.12.0](https://github.com/Shchebyvovk/huligan/compare/v1.11.0...v1.12.0) (2026-06-30)


### Features

* **scenarios:** сценарії з файлів — список, завантаження, вибір у NewRunModal ([8b345cc](https://github.com/Shchebyvovk/huligan/commit/8b345cce074262a8cf403b5ed42203075e300160))

# [1.11.0](https://github.com/Shchebyvovk/huligan/compare/v1.10.0...v1.11.0) (2026-06-30)


### Features

* **orchestrator:** підключити orchestrate до POST /runs ([aa16998](https://github.com/Shchebyvovk/huligan/commit/aa1699864e91917ba809d96e3f64bc6b5dfb3098))

# [1.10.0](https://github.com/Shchebyvovk/huligan/compare/v1.9.2...v1.10.0) (2026-06-30)


### Features

* **frontend:** авто-оновлення статусу ранів кожні 3с поки є активні ([f12d593](https://github.com/Shchebyvovk/huligan/commit/f12d593842d3998278ae4287a70ac071cc3ccd5c))

## [1.9.2](https://github.com/Shchebyvovk/huligan/compare/v1.9.1...v1.9.2) (2026-06-30)


### Bug Fixes

* **auth:** sameSite=none + secure для крос-origin сесійних кук ([d2052b7](https://github.com/Shchebyvovk/huligan/commit/d2052b794da577d7f6098ab936db391315ad88a2))

## [1.9.1](https://github.com/Shchebyvovk/huligan/compare/v1.9.0...v1.9.1) (2026-06-30)


### Bug Fixes

* **frontend:** SPA fallback _redirects для Render ([441dae7](https://github.com/Shchebyvovk/huligan/commit/441dae7a7d15401c123365e5f2abc8691f58326c))

# [1.9.0](https://github.com/Shchebyvovk/huligan/compare/v1.8.0...v1.9.0) (2026-06-30)


### Features

* **frontend:** підключення до реального API ([72d7f44](https://github.com/Shchebyvovk/huligan/commit/72d7f44a0da9dc57ea0638659c1d52bec0ea4319))

# [1.8.0](https://github.com/Shchebyvovk/huligan/compare/v1.7.0...v1.8.0) (2026-06-30)


### Features

* **db:** pg-адаптер, міграції Neon, /health endpoint ([e6d2b97](https://github.com/Shchebyvovk/huligan/commit/e6d2b97cb244c8511c107daf13a4c96080899496))

# [1.7.0](https://github.com/Shchebyvovk/huligan/compare/v1.6.0...v1.7.0) (2026-06-30)


### Features

* **server:** HTTP API — auth і runs роути на Fastify ([cccf543](https://github.com/Shchebyvovk/huligan/commit/cccf543508a82ed5fe82babe8232ae432a47b0b6))

# [1.6.0](https://github.com/Shchebyvovk/huligan/compare/v1.5.0...v1.6.0) (2026-06-30)


### Features

* **structure:** монорепо backend/ + frontend/ (React + Vite + Tailwind) ([68c3373](https://github.com/Shchebyvovk/huligan/commit/68c33734635f08e87711787f3ff66631670c3d0b))
