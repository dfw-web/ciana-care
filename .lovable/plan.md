## What's going on

You're asking how an owner can log in when there's no email/signup option on the admin login page. Here's the actual state of your accounts:

| Email | Role |
|---|---|
| `nneamaka86@yahoo.com` | **owner** ✅ |
| `aaabswag@gmail.com` | staff |
| `noiserunny@gmail.com` | (no role — locked out) |

So an owner login already exists: **`nneamaka86@yahoo.com`**. The problem is just that the login page has no recovery path if you don't know its password, and there's no way for a locked-out account to fix itself.

## Plan

### 1. Add "Forgot password?" to the admin login
- Add a link on `/admin` that opens a small form to enter an email and call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/reset-password' })`.
- Create a new public page **`/admin/reset-password`** that detects the recovery link and lets the user set a new password via `supabase.auth.updateUser({ password })`.
- Register the new route in `src/App.tsx`.

This means any owner or staff can recover their own login through email — no more lockouts.

### 2. Show a clear message when a logged-in account has no role
Currently `noiserunny@gmail.com` can sign in but then hits an empty/locked dashboard. After login, if the user has no `owner`/`staff`/`admin` role, sign them out and show: *"Your account is not authorized. Ask an owner to grant access."*

### 3. (Optional, your call) Reset the existing owner's password now
If you don't know the password for `nneamaka86@yahoo.com`, I can set a new one for you directly from the backend — just tell me the password you want. Otherwise, once step 1 ships, you can use "Forgot password" yourself.

### What I will NOT do
- I will **not** add a public "create owner" form on the login page. That would let anyone on the internet make themselves an owner. Owners can only be created by an existing owner via Staff Management, or by a backend reset like step 3.

## Files

- `src/pages/AdminLogin.tsx` — add Forgot Password link + post-login role guard
- `src/pages/AdminResetPassword.tsx` — **new** public page for the recovery flow
- `src/App.tsx` — register `/admin/reset-password`

## One question before I build

Do you want me to also reset the password for `nneamaka86@yahoo.com` right now (tell me the new password), or will you use the new "Forgot password" flow yourself once it's live?
