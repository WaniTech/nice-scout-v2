# Nice Scout

Nice Scout is a React Native Expo app for football players who want to manage a scout-facing profile, track trial opportunities, organize media clips, and respond to club messages. The app includes a small Express backend that stores opportunities, applications, media clips, profile updates, preferences, availability, and message replies.

Version: 2.0

## Live Demo

Expo public link: [https://expo.dev/@wanitech/nice-scout](https://nice-scout.expo.app)

## What You Can Do

Right now you can use the app to:

- Log in with the demo account shown on the login page
- Create a player account
- See the dashboard
- View profile
- Edit profile, CV, preferences, and availability
- Browse trials and jobs
- Save or update job applications
- Read messages, reply, and archive them

## New Features in Version 2

- **Real-Time Gateway & WebSocket Subsystem**: Lightweight RFC 6455 WebSocket server with authenticated handshakes, room routing (`user:<id>`, `chat:<id>`, `global`), heartbeat monitoring, and live messaging support.
- **Client Socket Lifecycle & Real-Time Sync Engine**: React Native `SocketContext` provider with auto-reconnection on network/app focus events, live `SocketStatusBadge` indicator, and real-time event subscription hooks.
- **Multi-Criteria Player-Club Matching Engine**: Algorithmic fit calculator evaluating tactical requirements, positional versatility, geographic preferences, and compensation targets with interactive threshold filters in `app/PlayerMatch.tsx`.
- **Live Scout Chat & Direct Negotiation Channel**: Upgraded `app/MessageDetail.tsx` with instant WebSocket message dispatch, live typing indicators, and quick attachment drawers for video clips and availability windows.
- **Trial Application Pipeline & Recruitment Lifecycle Tracker**: Interactive scouting pipeline in `app/(tabs)/Myjobs.tsx` and `app/JobDetail.tsx` with multi-stage status management (Saved, Applied, Trial Booked, Offer Talks), urgency indicators, and recruitment milestone tracking.
- **Scout Video Reel & Performance Media Portfolio**: Dedicated recruitment video asset manager in `app/(tabs)/MediaRoom.tsx` with pipeline status tracking (`Draft`, `Scout-ready`, `Sent`), scout view metrics, tagging taxonomy, and REST API sync.
- **Offline Sync Queue & Data Resilience Engine**: Mutation queuing and replay engine in `services/api.ts` with exponential backoff retry logic, offline status indicator banners, and optimistic local state reconciliation.
- **CI Pipeline Hardening & Type Safety Architecture**: Strict TypeScript compilation and lint validation across all Expo Router screens and contexts, eliminating runtime type discrepancies and hardening WebSocket payload narrowing.
- **Scout Analytics Radar & Performance Intelligence Hub**: Dynamic 4-pillar attribute evaluation (Physical, Technical, Tactical, Mental), academy benchmark comparisons against European development leagues, and real-time scout engagement metrics in `app/(tabs)/PlayerDashboard.tsx`.
- **Interactive Trial Scheduling & Scout RSVP Engine**: Full-stack trial slot booking and logistics manager in `app/JobDetail.tsx` with RSVP status transitions (`Confirmed`, `Rescheduled`, `Declined`), interactive time slot pickers, and required preparation checklists.
- **Player Career Passport & Verified Scout CV Engine**: Digital scouting passport in `app/(tabs)/Profile.tsx` featuring verification tier scoring, FIFA Talent ID tracking, EU work permit validation, verified career milestone timelines, and shareable scout credentials.
- **Contract Offer Terms & Deal Negotiation Room Engine**: Dedicated contract negotiation deal room in `app/JobDetail.tsx` with monthly base wage breakdowns, signing and performance bonus projections, negotiation audit trail, structured counter-proposal submission, and digital contract execution.
- **Scout Watchlist & Talent Shortlist Network Engine**: Scout watchlist intelligence in `app/(tabs)/PlayerDashboard.tsx` with tier classifications (Priority Target, Monitored, Extended List), recruitment interest score index, scout inquiries feed, and real-time shortlist updates.
- **Video Annotation & Tactical Telestration Clip Engine**: Interactive tactical video markup studio in `app/(tabs)/MediaRoom.tsx` featuring timestamped telestration arrows, freeze-frame coaching tags, tactical category taxonomy, and verified scout analysis exports.

## Work Hours

Work hours are listed in [docs/work-hours.md](docs/work-hours.md).


## Use of Generative Language Models

Generative AI assistance was used during development for code cleanup, debugging, documentation drafting, and checking project structure. AI-generated suggestions were reviewed before being applied. The project was verified with type checking, linting, frontend tests, and backend tests after the changes.
