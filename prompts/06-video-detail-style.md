# Video detail page design (US-05 follow-up)

**Approved on:** PENDING — proposed in the PR of branch `task/5-video-detail-style`
**Approved by:** PENDING team review
**Used for:** improving the look of a page (layout, cards, colours) without changing its behaviour

## Prompt

Make the video detail page (`frontend/src/pages/VideoDetailPage.tsx` and `CommentList`) look polished and
original, following `frontend/AGENTS.md`:

* Use the ProTube logo colours (indigo to sky blue gradient) as the visual signature: a soft glow around the
  player, gradient section labels and the comment counter.
* Header under the player: channel avatar, channel name, publication date and duration.
* Description in a card ("About this video") that starts collapsed with an accessible "Show more / Show less"
  toggle (`aria-expanded`, `aria-controls`) when it is long.
* Comments as cards: avatar with the user's initial and a colour derived from the name (same user, same colour),
  `@author`, relative time ("3 days ago") in a `<time>` element, text with `dir="auto"` for right-to-left
  languages, and the likes in a pill with an icon and an accessible label.
* Responsive on mobile, respects `prefers-reduced-motion`, keeps Bootstrap and plain CSS in `App.css`.
* Tests with Testing Library for the new components and utilities; keep coverage, lint, Prettier and build green.
  Check the result in the browser on desktop and mobile widths.

## Notes

* Pure presentation: no API or backend changes.
