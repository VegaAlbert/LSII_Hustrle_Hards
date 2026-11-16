# Save videos as favourites (US-12)

**Approved on:** PENDING — proposed in the PR of branch `feature/favourite-videos`
**Approved by:** PENDING team review
**Used for:** implementing US-12 (favourite videos, a README improvement) end to end: favourite endpoints, a
favourite button on the video detail page and a `/favourites` page

## Prompt

Implement US-12 (Save videos as favourites) from `REQUIREMENT.md`, following `AGENTS.md`, `backend/AGENTS.md`,
`frontend/AGENTS.md` and the `create-rest-endpoint` skill. Work only on the branch `feature/favourite-videos`, created
from an up-to-date `develop`. The profile page (US-03) does not exist yet, so the list goes on its own `/favourites`
page, reachable from the user menu of the navbar.

Context: authentication is a JWT sent by `AuthProvider` in the axios default `Authorization` header; `useAuth()` gives
the logged-in user. `VideoSummaryResponse`, `PageResponse` and the `VideoCard` component already show videos in the
home grid.

Backend:

* New `Favourite` entity (user + video + date it was saved, unique pair, removed by the database with its user or
  video) and `FavouriteRepository`.
* New `FavouriteService` and `FavouritesController` under `/api/favourites`, all for logged-in users only (protect
  them in `SecurityConfig`; CORS must allow `PUT` and `DELETE`):
  * `GET /api/favourites?page&size`: the favourite videos of the user, last saved first, as
  `PageResponse<VideoSummaryResponse>` (same `page`/`size` validation as the video list).
  * `GET /api/favourites/{videoId}`: `FavouriteResponse(videoId, favourite)`, to show the button state.
  * `PUT /api/favourites/{videoId}` marks and `DELETE /api/favourites/{videoId}` unmarks it; both idempotent and
  answering `FavouriteResponse`.
  * 401 without a valid token or for a user that no longer exists, 404 if the video does not exist.
* The video detail response is not changed, so this branch does not conflict with other work on comments.
* Tests: service unit tests with Mockito (mark, mark twice, unmark, unmark when not saved, list, unknown video, unknown
  user) and endpoint tests with MockMvc on the in-memory database (state persists, list order, empty list, 400 for a
  bad page size, 401, 404, CORS preflight for PUT and DELETE).

Frontend:

* `src/favourites/favouritesApi.ts` with `fetchFavourites`, `fetchFavouriteState` and `setFavourite`.
* `FavouriteButton` on the video detail page next to "Share": a toggle with `aria-pressed` ("Save to favourites" /
  "Saved"), disabled while sending, an error in a `role="alert"` if it fails, and anonymous visitors sent to `/login`
  (coming back to the video).
* `FavouritesPage` at `/favourites`: anonymous visitors are redirected to log in; the list reuses `VideoCard` with
  "Load more", plus loading, error with retry and an empty state with a link to browse videos. A
  `useFavourites` hook loads it page by page.
* A "Favourites" item in the user menu of the navbar.
* Styles with the `--pt-*` tokens only.
* Tests with Testing Library and `user-event`, mocking the API module: `FavouriteButton`, `FavouritesPage`
  (redirect, list, empty, error, load more), `favouritesApi`, the navbar item and the detail page showing the button.

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

## Notes

* When US-03 adds the profile page, the favourites list can be moved into it or linked from it.
* The CORS change is the same one made for US-10 (likes), so both branches merge without conflicts.
