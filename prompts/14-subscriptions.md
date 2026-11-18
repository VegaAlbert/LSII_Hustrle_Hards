# Subscribe to other users' channels (US-13)

**Approved on:** PENDING — proposed in the PR of branch `task/subscriptions`
**Approved by:** PENDING team review
**Used for:** implementing US-13 (subscriptions, a README improvement) end to end: subscription endpoints, a
subscribe button on the video detail page, a `/subscriptions` page and the subscriber count for Analytics

## Prompt

Implement the "Subscriptions to users" task (US-13 in `REQUIREMENT.md`, add it there) following `AGENTS.md`,
`backend/AGENTS.md`, `frontend/AGENTS.md`, `e2e/AGENTS.md` and the `create-rest-endpoint` skill. Work only on the
branch `task/subscriptions`, created from an up-to-date `develop`. Use the favourites feature (US-12) as the model for
the code and the tests.

Context: a channel is a user and its videos are the ones that user uploaded (`Video.uploader`; imported videos have
no uploader, so they belong to no channel). The profile page (US-03) does not exist yet, so the button goes on the
video detail page only. The Analytics page (US-11) is still in an open PR, so do not touch its files: expose the
count in its own endpoint and component, to be placed on the Analytics page once that PR is merged.

Backend:

* New `Subscription` entity (subscriber user + channel user + date, unique pair, removed by the database with either
  user) and `SubscriptionRepository`, including a paged query of the videos of the subscribed channels.
* New `SubscriptionService` and `SubscriptionsController`:
  * `GET /api/channels/{channel}/subscription` (public): `SubscriptionResponse(channel, subscribed, subscribers)`;
    `subscribed` is false for anonymous visitors.
  * `PUT` / `DELETE /api/channels/{channel}/subscription` (logged-in): subscribe / unsubscribe, idempotent.
  * `GET /api/subscriptions/videos?page&size` (logged-in): videos of the subscribed channels, newest first, as
    `PageResponse<VideoSummaryResponse>` (same validation as the video list).
  * `GET /api/subscriptions/subscribers` (logged-in): `SubscriberCountResponse(subscribers)` of the user's channel.
  * 400 when subscribing to the own channel, 401 without a valid token or for a user that no longer exists, 404 for
    an unknown channel (new exceptions mapped in `ApiExceptionHandler`). Protect the routes in `SecurityConfig`.
* Tests: service unit tests with Mockito and endpoint tests with MockMvc on the in-memory database (state persists,
  anonymous state, twice, own channel, list order and filtering, empty list, bad page size, count, 401, 404, CORS
  preflight).

Frontend:

* `src/subscriptions/subscriptionsApi.ts` and a `useSubscriptionVideos` hook like `useFavourites`.
* `SubscribeButton` next to the author on the video detail page, only for videos with an uploader: the number of
  subscribers and a toggle with `aria-pressed` ("Subscribe" / "Subscribed"), hidden on the user's own channel,
  disabled while sending, an error in a `role="alert"`, and anonymous visitors sent to `/login` and back.
* `SubscriptionsPage` at `/subscriptions` like `FavouritesPage` (redirect, list, empty state, error with retry, load
  more) and a "Subscriptions" item in the user menu.
* `SubscriberCount` component for the Analytics page.
* Styles with the `--pt-*` tokens and the design system buttons only.
* Tests with Testing Library and `user-event`, mocking the API module, plus a Playwright spec in
  `e2e/tests/subscriptions.spec.ts` (golden path and the anonymous case).

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* When the Analytics PR (US-11) is merged, add `<SubscriberCount />` to the Analytics page.
* When US-03 adds the profile page, add the `SubscribeButton` there too.
