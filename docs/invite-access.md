# In-person invite access

LUMEN can require a one-use access code before showing the app. Codes are
created locally with the Firebase Admin service account and are stored as
SHA-256 hashes in Firestore; the readable codes are printed once for the
organizer to give out in person.

## Before deploying

1. Configure the Firebase public web settings and the Firebase Admin service
   account in the host's environment variables.
2. Set `NEXT_PUBLIC_REQUIRE_INVITE=true` in the production deployment.
3. Deploy the app and confirm the invite screen appears.
4. On a trusted computer with `.env.local` configured, create codes:

   ```powershell
   npm run invite:create -- --count=20 --days=30
   ```

The command prints each code once. Give one code to each student in person.
Each code activates one Firebase anonymous account on one device and expires
after the selected number of days. To create one code, omit `--count`; the
default expiry is 30 days. Do not commit or share the generated output.

Students need internet access the first time they activate a code. Afterward,
the activated device can open its previously cached study material offline.
If a student loses their device, create a replacement code.

Local development leaves the gate disabled unless
`NEXT_PUBLIC_REQUIRE_INVITE=true` is set in the environment.
