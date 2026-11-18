# Subscribe to the channel of any video (US-13, follow-up)

**Approved on:** PENDING — proposed in the PR of branch `task/subscribe-any-channel`
**Approved by:** PENDING team review
**Used for:** changing what a channel is in US-13 so imported videos can be followed too, and showing the subscriber
count on the Analytics page

## Prompt

US-13 is merged (see `prompts/14-subscriptions.md`), but a channel is a registered user, so imported videos (most of
the catalog, they have no uploader) show no "Subscribe" button. Change it so the channel of a video is its author
(`Video.author`): uploads already take the username of the uploader as author, so users keep working as channels.
Work on the branch `task/subscribe-any-channel` from an up-to-date `develop`, following `AGENTS.md` and the nested
rules.

Backend:

* `Subscription` stores the channel name instead of a user, in a new table (`channel_subscriptions`) because
  `ddl-auto=update` cannot reshape the old one in PostgreSQL.
* A channel exists when a video has it as author or a user has it as username; otherwise 404.
* The channel name travels as the `name` query parameter of `GET` / `PUT` / `DELETE /api/subscriptions/channel`,
  because author names may hold spaces and slashes ("AC/DC"). Only the `GET` is public.
* The feed lists the videos whose author is a subscribed channel; the subscriber count of a user counts the
  subscriptions to their username.
* Update the unit and endpoint tests (imported channel, user without videos, blank name, missing name).

Frontend:

* `subscriptionsApi` uses the new route; the `SubscribeButton` uses `video.author`.
* The Analytics page (now merged) shows a "Subscribers" card next to the other totals.
* Update the tests and add an E2E case that subscribes to the channel of a seed (imported) video.

Finally run `mvn clean verify` in `backend/` and `npm run test`, `npm run lint`, `npm run build` in `frontend/`.

## Notes

* Two authors with the same name are the same channel; the catalog has no channel ids to tell them apart.
