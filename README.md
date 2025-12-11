# Pulse WiFi App

Seamless public WiFi with Passpoint 2.0 technology.

## Features

- **Passpoint Profile Generation** - Automatic iOS/macOS and Android WiFi profile provisioning
- **Venue WiFi** - Connect at partner venues with seamless authentication
- **Home WiFi** - Premium home internet service with mesh coverage
- **Speed Tests** - Built-in network speed and coverage testing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **WiFi Management**: GWN Cloud API (Grandstream)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GWN Cloud API
GWN_APP_ID=
GWN_SECRET_KEY=
GWN_API_BASE=https://www.gwn.cloud/api

# Passpoint Configuration
PASSPOINT_REALM=pulsewifi.co.uk
PASSPOINT_OPERATOR_FQDN=pulsewifi.co.uk
PASSPOINT_RADIUS_HOST=radius.pulsewifi.co.uk
PASSPOINT_HS_FRIENDLY_NAME=Pulse WiFi
PASSPOINT_SSID=Pulse-WiFi
PASSPOINT_ORG_ID=uk.co.pulsewifi
```

## Routes

- `/` - Landing page
- `/auth/login` - User login
- `/auth/register` - User registration
- `/dashboard` - User dashboard
- `/onboarding/passpoint` - Passpoint profile setup

## Deeplink Support

The app supports deeplinks for onboarding:

- `/onboarding?type=venue&venue_id=xxx` - Venue user onboarding
- `/onboarding?type=home` - Home user onboarding
- `/check` - Speed/coverage check

## License

Copyright © 2024 We Are One 1 Ltd. All rights reserved.
