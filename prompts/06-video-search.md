# Video search (US-08)

**Approved on:** PENDING — proposed in the PR of branch `task/8-video-search`
**Approved by:** PENDING team review
**Used for:** implementing US-08 (search videos) end to end: ranked search query, optional `q` parameter on the
video list API, search box on the home page

## Prompt

Implement US-08 (Search videos) from `REQUIREMENT.md`, issue #8, following `AGENTS.md`, `backend/AGENTS.md`,
`frontend/AGENTS.md` and the `create-rest-endpoint` skill. Work only on the branch `task/8-video-search`, created from
an up-to-date `develop`.

Context: US-04 already provides the `Video` entity (`title`, `author`, `description` mapped as a long text column),
`VideoRepository`, `VideoService.getVideos(page, size)` and the public `GET /api/videos?page&size` returning a
`PageResponse<VideoSummaryResponse>`. The home page shows a `VideoGrid` with "Load more", fed by `useVideoList` and
`fetchVideos` in `src/videos/videosApi.ts`. There is no router yet (US-05 adds it in another branch), so keep the
changes to `App.tsx` small. If US-05 is merged first, the home page is the index route of its router.

Backend:

* Add an optional `q` parameter to `GET /api/videos` (max 100 characters, 400 with a field error otherwise) instead of
  a new route, so the list and the search share pagination and the same response.
* Team decision for the empty search: a missing or blank `q` returns the normal list (newest first), never an error.
* With a non-blank `q`, return the videos whose title, author or description contain it (case-insensitive, trimmed),
  ranked by relevance with one JPQL query in `VideoRepository`: exact title, title starting with the text, title
  containing it, author containing it, only the description; ties newest first. It must work on H2 now and on
  PostgreSQL later (NFR-01), so no native SQL. Escape `%`, `_` and `\` typed by the user so they match literally.
* The logic lives in `VideoService.searchVideos(query, page, size)`; the controller only delegates.
* Tests: service unit tests with Mockito (patterns sent to the repository, escaping, blank query), endpoint tests with
  MockMvc on the in-memory database (ranking order, case, pagination, no matches, wildcards, blank query, 400).

Frontend:

* `fetchVideos(page, size, query)` sends `q` only when the trimmed query is not empty.
* `useVideoList(query)` starts again from the first page when the query changes, without showing the old results.
* New `SearchBar` component (`role="search"` form, controlled input with a label, "Search" button, submit with Enter)
  above the grid on the home page. With the router of US-05, keep the search in the URL (`/?q=cats`) in a `HomePage`
  page, so the back button and shared links work.
* `VideoGrid` receives the query: the list is labelled `Results for "<query>"` and, with no matches, shows
  `No videos match "<query>".` instead of an error.
* Tests with Testing Library and `user-event`, mocking the API module: `SearchBar`, the new `VideoGrid` states,
  `videosApi` parameters and the search flow in `App`. Update the existing expectations of `fetchVideos`.

Finally run `mvn clean verify -Pcoverage` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in
`frontend/`, fix anything that fails, and summarise the changes so I can explain every part.

### Follow-up: suggestions while typing

Like YouTube, show a dropdown with the matching videos while the user types in the search box. Reuse
`GET /api/videos?q=<text>&size=5` (already ranked by relevance), so the backend does not change. Put the logic in a
`useVideoSuggestions(text, enabled)` hook: wait 300 ms after the last key, ask only for 2 or more characters, ignore
late answers for an old text and show nothing if the request fails. In `SearchBar`, follow the ARIA combobox pattern
(`role="combobox"` input, `role="listbox"` list labelled "Suggestions", `role="option"` items with
`aria-selected` and `aria-activedescendant`): arrow keys move, Enter or a click searches that title, Escape and blur
close the list, and it does not open for the initial query. Test it with Testing Library and `user-event`
(suggestions, one request per pause, click, keyboard, Escape, blur, failed request).

## Notes

* `lower()` cannot be used on `description`: H2 stores `Length.LONG32` as a CLOB and Hibernate rejects it. The query
  uses Hibernate's `ilike`, which works on H2 and PostgreSQL.
* The search matches the whole text as one phrase ("city walls"), not each word separately.
* Rebased on `develop` after US-05 (#27): the search moved from `App` state to the `?q=` URL parameter in `HomePage`.
* The search box could move to the navbar (as on YouTube) in a later story.
