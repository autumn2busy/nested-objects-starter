# Elite Plan — Sole Operator Scaling Playbook

## Call Quotas: How Many Should They Get?

| Call Type | Quota per Elite Member | Your Time Cost |
|---|---|---|
| **Strategy gaming session** | 1 per quarter (4/year) | ~30 min each = 2 hrs/year per member |
| **Concierge tactical call** | 2 per month | ~15 min each = 6 hrs/year per member |

**Total time per Elite member: ~8 hrs/year = ~40 min/month.**

At 10 Elite members, that's ~7 hrs/month. At 25, that's ~17 hrs/month. That's the ceiling where you'd need to restructure.

> [!TIP]
> **Don't advertise exact quotas publicly.** On the pricing page say "Concierge calls" and "1-to-1 gaming sessions" without numbers. Internally, enforce the limits. If a member is booking a strategy call every week, you redirect: *"Let's focus on executing the plan from our last session. Book a concierge call if something specific comes up."*

---

## Tracking: Keep It Simple

**Use a Google Sheet with one tab.** Don't over-engineer this.

| Column | Purpose |
|---|---|
| Member Name | Who |
| Email | Contact |
| Elite Since | When they upgraded |
| Strategy Calls Used / Quota | e.g. `1/1` for Q1 |
| Last Call Date | When you last spoke |
| Vetting Status | `Not Yet` / `In Progress` / `Vetted` |
| Partner Intros Made | `Asteroom (3/15/26)` |
| Notes | Key takeaways, next action |

> [!NOTE]
> **Future upgrade path:** When volume justifies it, build this into Supabase as an admin table. For now, a sheet you update after each call is faster and flexible.

---

## Post-Call Follow-Up: Templated, Not Automated (Yet)

After each call, send a follow-up email within 24 hours. Use these templates:

### After a Strategy / Gaming Session

> **Subject:** Your gaming session recap — next steps inside
>
> Hey [Name],
>
> Great session today. Here's your action plan:
>
> **✅ Your next steps:**
> 1. [Specific action from the call, e.g. "Complete Module 5 by end of month"]
> 2. [Specific action, e.g. "Submit background check via the profile page"]
> 3. [Specific action, e.g. "Apply to Acuity Field Services — you match their coverage area perfectly"]
>
> **🔜 What happens next on my end:**
> - [e.g. "Once your background check clears, I'll queue your intro to Asteroom"]
> - [e.g. "I'll check in with you in 2 weeks if I haven't heard back"]
>
> **📅 Your next gaming session:** Available to book starting [next quarter date]. Use your dashboard link anytime for concierge calls in the meantime.
>
> Keep pushing,
> [Your Name]

### After a Concierge Call

> **Subject:** Quick recap from our call
>
> Hey [Name],
>
> To follow up on what we discussed:
>
> - [Summary of what they asked]
> - [Your answer / action taken]
> - [Next step for them, if any]
>
> Reach out anytime or book another concierge call from your dashboard.
>
> [Your Name]

### After a Partner Intro

> **Subject:** Introduction — [Member Name] ↔ [Partner Name]
>
> Hi [Partner Contact],
>
> Meet [Member Name] — one of our vetted Elite members. They've completed [X] training modules, passed their background check, and are ready to take on work in [their coverage area].
>
> [Member Name], meet [Partner Contact] from [Partner Company]. They [brief description of what the partner offers].
>
> I'll let you two take it from here. [Member], let me know how it goes on our next concierge call.
>
> Best,
> [Your Name]

---

## Scaling Without More Calls: 8 Leverage Strategies

These deliver Elite value without adding to your call calendar.

### 1. Monthly Elite Email Briefing (30 min to write, reaches all Elite members)
A short email sent to all Elite members monthly:
- 1 partner update ("Here's what's new with Asteroom")
- 1 industry tip or trend
- 1 member spotlight (builds community, costs you nothing)
- Link to book their next call

**This is your highest-leverage move.** 30 minutes of writing replaces dozens of individual calls.

### 2. Loom Videos Instead of Repeat Calls (5 min each)
When you notice multiple members asking the same question, record a 3–5 min Loom and share it. Examples:
- "How to fill out the Acuity onboarding form"
- "Route optimization 101 for new inspectors"
- "What to say on your first call with a firm"

Post these in an Elite-only resource section or send via email.

### 3. The AI Concierge Handles the Easy Stuff
Your AI concierge already exists for Pro+. For Elite members, the AI should be positioned as the *first line* — the concierge call is for what the AI *can't* solve. This reduces call demand naturally.

### 4. Post-Call Action Checklists (automated via template)
Instead of custom follow-ups every time, build 3–4 standard checklists:
- **"Just upgraded" checklist** — complete profile, background check, first training module, book gaming session
- **"Pre-partner intro" checklist** — training 50%+, trust score 60+, background check cleared
- **"Post-partner intro" checklist** — create partner account, complete their onboarding, report back

Send the right checklist based on where they are. This is follow-up without being custom every time.

### 5. Group Gaming Sessions (when you hit 15+ Elite members)
Run a monthly 45-min group call for Elite members. Format:
- 10 min: You share updates (new partners, new tools, industry news)
- 20 min: Hot seat — 2–3 members share their situation, you coach live
- 15 min: Open Q&A

This replaces 15 individual calls with 1 group call. Members still get the 1-to-1 quarterly session, but the group call covers the in-between months.

### 6. Elite Slack/Discord Channel (zero time cost once set up)
A private channel for Elite members to ask questions, share wins, and help each other. You pop in a few times a week. Peer support reduces your direct load.

### 7. Partner Self-Service Intros (future state)
Once you have 3+ partners, build a partner page in the hub where vetted Elite members can view partners and request intros themselves. You review and approve the request instead of manually orchestrating every intro.

### 8. Delegate the Calls (when revenue justifies it)
At ~$2,500/mo in Elite revenue (~25 members), hire a part-time VA or community manager to handle concierge calls. You keep the strategy sessions — that's your high-value time. Everything else can be trained and delegated.

---

## Capacity Planning

| Elite Members | Your Monthly Time | Sustainable? |
|---|---|---|
| 5 | ~3.5 hrs | ✅ Easy |
| 10 | ~7 hrs | ✅ Manageable |
| 15 | ~10 hrs | ⚠️ Add group calls |
| 25 | ~17 hrs | ⚠️ Need VA or restructure |
| 50+ | ~34 hrs | ❌ Must delegate calls |

**The breakpoint is ~15 members.** At that point, introduce group gaming sessions and lean harder on email briefings + Loom videos. The 1-to-1 strategy session stays quarterly, concierge calls stay available, but you're not doing custom work for every member every month.

---

## Immediate Action Items

1. ~~Update calendar links in code~~ ✅ Done
2. Create the Google Sheet tracker (5 min)
3. Save the email templates above as Gmail templates or Notion blocks
4. Draft your first monthly Elite briefing email
5. Set a calendar reminder: "When I hit 15 Elite members → launch group calls"
