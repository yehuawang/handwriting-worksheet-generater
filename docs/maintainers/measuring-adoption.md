# Measuring Project Adoption

Open-source usage cannot be measured completely. Git clones, source archives, copied code, release downloads, and offline application use may be anonymous. The project must not claim that GitHub statistics equal active users.

## Available Signals

Maintainers can use:

- GitHub stars and watchers as signs of interest.
- Public forks and the repository network as signs of experimentation or development.
- Public issues, pull requests, and discussions as signs of engagement.
- GitHub Insights → Traffic for aggregate visitors, referrers, popular content, and full clones over GitHub's limited reporting window.
- GitHub release download counts as cumulative artifact-download events, not unique people or active installations.
- Voluntary entries in [USERS.md](../../USERS.md) as attributable adoption examples.
- Testimonials shared with explicit permission.

## Important Limitations

- A clone is not necessarily a user.
- One person may clone or download more than once.
- A download does not prove installation or continued use.
- Source copied outside GitHub may not be visible.
- Private forks, private integrations, and offline sharing may not be identifiable.
- GitHub's “Used by” dependency information is most relevant when a project is published as a recognized package dependency. This application should not be packaged as a library merely to obtain that metric.

## Portfolio Reporting

Use precise wording:

- “Received 25 GitHub stars” rather than “25 users.”
- “Downloaded 100 times from GitHub Releases” rather than “100 installations.”
- “Used voluntarily by three educators listed in the project registry” when those entries are public.
- “Maintained an open-source project with external contributors” only after outside contributions exist.

Never inflate metrics or disclose private reporters. Favor concrete engineering outcomes, usability feedback, and accepted contributions over vanity metrics.

## Telemetry

The project currently includes no telemetry. Any future proposal must follow [PRIVACY.md](../../PRIVACY.md), remain disabled by default, and never collect worksheet contents or identifying document metadata.
