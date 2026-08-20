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

## Work Hours

Work hours are listed in [docs/work-hours.md](docs/work-hours.md).


## Use of Generative Language Models

Generative AI assistance was used during development for code cleanup, debugging, documentation drafting, and checking project structure. AI-generated suggestions were reviewed before being applied. The project was verified with type checking, linting, frontend tests, and backend tests after the changes.
