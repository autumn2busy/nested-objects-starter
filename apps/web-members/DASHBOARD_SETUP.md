# Dashboard Setup Instructions

## What We're Building

A personalized member dashboard that users see immediately after:
- Signing up and setting password
- Logging in
- Any successful authentication

---

## Installation Steps

### 1. Create the Dashboard Page

**Download:** [dashboard-page.tsx](computer:///mnt/user-data/outputs/dashboard-page.tsx)

**Save to:** `apps/web-members/app/dashboard/page.tsx`

```bash
# Create the folder
cd apps/web-members/app
mkdir dashboard

# Save the downloaded file as page.tsx inside dashboard/
```

---

### 2. Update Outseta Post Login URL

Go to: **Outseta â†’ AUTH â†’ SIGN UP AND LOGIN**

**Change Post Login URL to:**
```
https://members.nestedobjects.com/dashboard
```

**Click Save**

---

### 3. Update Your layout.tsx Configuration

Replace the `authenticationCallbackUrl` in your Outseta config:

**Find this in `app/layout.tsx`:**
```javascript
auth: {
  authenticationCallbackUrl: window.location.origin,
  registrationConfirmationUrl: window.location.origin
}
```

**Change to:**
```javascript
auth: {
  authenticationCallbackUrl: window.location.origin + '/dashboard',
  registrationConfirmationUrl: window.location.origin
}
```

---

### 4. Deploy

```bash
git add app/dashboard/page.tsx app/layout.tsx
git commit -m "feat: add member dashboard with post-login redirect"
git push origin main
```

---

## What the Dashboard Shows

âœ… **Welcome message** with user's first name
âœ… **Account overview** with current plan, email, member since date
âœ… **Quick actions** - Directory, AI Chatbot, Job Intel
âœ… **Feature access indicators** - Shows which features are available based on plan
âœ… **Upgrade prompts** - For locked features
âœ… **Recent activity** - Placeholder for future activity tracking

---

## Expected User Flow

```
1. User signs up on membership page
   â†“
2. Redirected to Outseta for form
   â†“
3. Fills email, name, password
   â†“
4. Gets confirmation email
   â†“
5. Clicks email link to confirm
   â†“
6. Redirected to: /dashboard?access_token=...
   â†“
7. Dashboard loads, shows welcome message
   â†“
8. User sees their plan and available features
```

---

## Dashboard Features

### Personalization:
- Shows user's first name in welcome message
- Displays current plan with color coding
- Shows email and join date

### Feature Access:
- Directory - Always accessible (all plans)
- AI Chatbot - Shows "Upgrade" for Starter users, link for Pro+
- Job Intel - Shows "Upgrade" for Starter users, link for Pro+

### Navigation:
- Logout button (top right)
- Links to home and directory (bottom)

---

## Testing Checklist

After deployment:

- [ ] Visit `/dashboard` while logged out â†’ Redirects to home
- [ ] Sign up new account â†’ Lands on dashboard after email confirmation
- [ ] Dashboard shows correct name and email
- [ ] Current plan displays correctly
- [ ] Feature cards show correct access (locked vs unlocked)
- [ ] Upgrade links work
- [ ] Logout button works
- [ ] Navigation links work

---

## Future Enhancements

Phase 2 additions:
- Recent activity feed (from Supabase `user_activity` table)
- Saved firms list
- Job application tracking
- AI chat history
- Usage statistics

---

**Follow these steps to complete the dashboard setup!**