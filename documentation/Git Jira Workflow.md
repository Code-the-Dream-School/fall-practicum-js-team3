# Team 3 Git & Jira Workflow

_How code gets from your laptop to production. Questions are always welcome in the team Slack channel._

Table of contents

0. [Purpose](#0-purpose)
1. [The Big Picture](#1-the-big-picture)
2. [Branch Names](#2-branch-names)
3. [Working on a Ticket](#3-working-on-a-ticket)
4. [Opening a Pull Request](#4-opening-a-pull-request)
5. [Reviewing Pull Requests](#5-reviewing-pull-requests)
6. [Merging](#6-merging)
7. [Merge Conflicts](#7-merge-conflicts)
8. [Releasing `dev` to `main`](#8-releasing-dev-to-main)
9. [Jira and GitHub](#9-jira-and-github)
10. [Quick Reference](#10-quick-reference)

## 0. Purpose

_This document explains how our team works with Git, GitHub and Jira: how to start a ticket, get your code reviewed, merge it, and release it. Following one shared process keeps everyone's work from colliding, keeps `main` safe, and gives you the same habits professional dev teams use. Read it before you write your first line of code, and come back to it whenever you're unsure what to do next._

## 1. The Big Picture

| Branch         | What it is                                         | Rules                                                                 |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| `main`         | Production                                         | Only `dev` is ever merged into it. Nobody works on it directly.       |
| `dev`          | Where finished work comes together and gets tested | Changes arrive only through Pull Requests (PRs) from ticket branches. |
| `TEAM3-12-...` | Your workspace for one Jira ticket                 | Created from `dev`, merged back into `dev`, then deleted.             |

Example

```
TEAM3-12-user-login  →  dev  →  main
```

### Who's Who

| Role                | Who                       | What they do                                                             |
| ------------------- | ------------------------- | ------------------------------------------------------------------------ |
| **Dev team member** | Everyone building the app | Works tickets, opens PRs, gives the first review on a teammate's PR      |
| **Mentors**         | Olena and Angel           | Give the second review, and approve release PRs into `main`              |
| **Team lead**       | Our PM and scrum master   | Tracks tickets and PRs, and is the escalation point when a review stalls |

### Ground rules

1. One ticket = one branch = one PR.
2. Always start a branch from an up-to-date `dev`.
3. Never push directly to `main` or `dev`. GitHub blocks it on purpose.
4. Keep PRs small. They get reviewed faster and cause fewer conflicts.
5. Never force-push (`git push --force`).
6. If you are unsure, ask. Guessing is how work gets lost.

## 2. Branch Names

**Get your branch name from the Jira ticket.** Jira builds it for you, so the ticket number is always in it and the name always matches the ticket.

Do not rename or invent your own branch name. No ticket yet? Ask the team lead to create one first: every branch needs a ticket.

Every ticket follows the same steps, whatever its type (feature, bug, hotfix, chore, docs).

## 3. Working on a Ticket

### Start working on the Jira ticket in your local repo

**Update your local `dev` branch with the latest changes from `origin/dev`.**

1. In your terminal/shell window run the following

   ```
    git switch dev
    git pull
   ```

**Create branch from Jira ticket**

1. In [Jira](https://fall-practicum-team3.atlassian.net/jira/software/projects/TEAM3/boards/1/backlog?epics=visible), open the Task ticket.
2. Assign the ticket to yourself and move it to **In Progress**.
3. Scroll down to the `Development` dropdown menu (as seen on the right of the screen). See screenshot:

   <img src="./images/Development Drop-down Menu.png" width="20%" height="20%">

4. Select the `Create branch` button. See same screenshot above.

5. A window will pop up with a Git command ready to be copied. See screenshot:

   <img src="./images/Create%20branch%20pop-up%20window.png" width="20%" height="20%">

   Copy the Git command.

6. Paste the Git command into your terminal/shell window and run it.

You're now ready to start working on the ticket.

### Doing the actual work

Before writing any code or editing any files, first do the following

(per the [Best Practices for Reviewing Pull Requests](https://codethedream.slack.com/docs/T07EHJ738/F0CAWRXUBHN) Slack Canvas)

- Read the Jira ticket first. You can't judge whether the change is right without knowing what it was supposed to do.
- Read the PR description. Check the "What changed" and "How to test" sections, and note anything the author flagged as tricky.
- Look at the size. If the PR is too large to review properly, say so and ask the author to split it. Do not approve what you cannot review.
- Block out time. A real review takes 15-30 minutes. Don't skim it between other tasks.

### Commit and push

Start each commit message with the ticket key, then say what changed:

```
git add .
git commit -m "TEAM3-12 Add login form"
git push -u origin <name-of-branch-copied-from-Jira-in-step-5-above>
```

After the first push, plain `git push` is enough. Commit and push at logical stopping points, not just at the end of the day.

See also [Best Practices for Git Commits and Commit Messages](https://codethedream.slack.com/docs/T07EHJ738/F0CA4M5BS3T) Slack Canvas.

### Stay current with `dev` / How to handle `This branch is out-of-date with the base branch` messages at the bottom of the PR

You do not need to update every morning. Update your branch when:

- A teammate tells you they merged something into `dev` that touches your area
- Your branch has been open for several days
- You are about to open a PR
- GitHub says your PR has conflicts

```
git switch <name-of-branch-copied-from-Jira-in-step-5-above>
git fetch origin
git merge origin/dev
```

If Git reports conflicts, see section 7 ([Merge Conflicts](#7-merge-conflicts)). Then run the app and tests before continuing.

**When to run `git pull` on `dev`:** every time you switch back to `dev` to start a new branch, and whenever a teammate announces they merged into `dev`.

## 4. Opening a Pull Request

4a. Before you open it, check:

- [ ] My branch is up to date with `dev`
- [ ] The app runs and the tests pass
- [ ] The PR contains only this ticket's work, and is small enough to review comfortably
- [ ] No secrets, passwords, or `.env` files are included

4b. Then open the PR on GitHub:

- **Base branch:** `dev` (never `main`)
- **Title:** `TEAMS3-<Jira-ticket-number> <Text from jira ticket title>`
  - Use Jira ticket _number_,m the _text between the two pipes_ (`|`) and the discipline(s).

  - For example, given this https://fall-practicum-team3.atlassian.net/browse/TEAM3-34 Jira ticket,
    - the number is `34`

    - and the text from _E1-T4 | Log in and log out | FE_ is `Log in and log out`,

    - the discipline is `FE`.

  - Therefore, use this PR title: `TEAM3-34 Log in and log out (FE)`

- **Description:**:
  - The body of the PR is now auto-populated using a Pull Request template.
  - Follow the prompts in the template to fill it out.
  - For more on writing a good PR, see [Best Practices for Creating Pull Requests](https://codethedream.slack.com/docs/T07EHJ738/F0C9X5HDBE1) Slack Canvas.

4c. Finally,

- request reviewers on the PR - start with fellow developers,
- move the Jira ticket to **In Review**,
- and post the PR link in the team channel.

## 5. Reviewing Pull Requests

- Every PR needs **2 approving reviews**: one from the team lead (or a mentor) and one from a fellow dev team member. You cannot approve your own PR.
- Reviews should normally happen within **24-48 hours**. If you cannot get to one, say so in the channel so someone else can.
- **Everyone reviews, not just the most experienced coders.** Reading someone else's code is one of the fastest ways to learn and a real contribution to the team.

**What to check**

- Does it do what the Jira ticket asks?
- Did you run it, following the author's test steps?
- Is the code readable, and does it fit the rest of the project?
- Any potential bugs, missing error handling, missing tests, or leftover secrets?

**How to review**

- Ask questions when something is unclear, and explain the reasoning behind significant suggestions.
- Be respectful and constructive. Review the code, not the person.
- Do not approve code you have not read or do not understand.
- Approving does not mean finding something wrong. It means you examined the changes and believe they are ready to merge.

**If you are the author**

- Respond to every comment. Make fixes on the same branch and push; the PR updates itself.
- Mark a conversation resolved only after the concern is actually addressed, never just to clear it.
- If you disagree with a suggestion, explain your reasoning and discuss it with the reviewer. Ask the team lead if you cannot agree.
- **New commits after an approval reset it.** Ask for fresh reviews after you push changes.

Code review is how we maintain quality and learn from each other. Treat questions, suggestions, and mistakes as chances to improve the project and everyone's skills.

### Who Reviews, and in What Order

Every PR into `dev` needs 2 approvals: **first a dev team member, then a mentor (Olena or Angel)**. GitHub doesn't enforce the order or who the reviewers are yet, so we do it by habit.

### Keeping Reviews Moving

1. **Open:** the author moves the Jira ticket to **In Review**, and posts the PR link in the team channel.
2. **Claim:** a reviewer replies to the slack message with "I'll review this" and assigns their git handle under the "Reviewers" section of the PR.
3. **First review done:** the reviewer submits the review, then:

- requests a review from **both mentors** in the PR's **Reviewers** list, and
- replies in the Slack thread tagging the author and both mentors ("First review done @Olena @Angel, ready for a second review").

  _Aim for a claim and review within **1 day**._

4. **Second review:** a mentor reviews within **48 hours** of the handoff. If neither has, the PR author and/or a mentor tags Jamie in the thread. (I prefer to have several people tag me rather than none.)
5. **Both approved:** the author merges (section 6: see [Merging](#6-merging)) and moves the Jira ticket to **Done**.
6. **Changes requested:** the author pushes fixes and re-requests review. The ticket stays **In Review**.

See also [Best Practices for Reviewing Pull Requests](https://codethedream.slack.com/docs/T07EHJ738/F0CAWRXUBHN) Slack Canvas.

## 6. Merging a Pull Request

This one procedure covers **every** merge: a ticket branch into `dev`, and `dev` into `main`. Only `dev` is ever merged into `main`.

**Who merges:** the person who opened the PR, once it is ready. For a release PR (`dev` into `main`), the team lead opens and merges it. Never merge a PR you have not seen approved.

### Step 1: Confirm the PR is ready to merge

All of these must be true:

- [ ] It has the required approving reviews (2 for dev, 1 for main), and both are on the **latest commit**. New commits reset approvals ([Reviewing Pull Requests](#5-reviewing-pull-requests)).
- [ ] Every review conversation is **resolved**, with the concern actually addressed.
- [ ] No reviewer has an open **Changes requested**.
- [ ] GitHub shows **no conflicts**. If it does, see section 7 ([Merge Conflicts](#7-merge-conflicts)).
- [ ] The branch is **current with its base branch**. If GitHub says it is behind, merge the base into your branch first (see section 3: [Working on a Ticket](#3-working-on-a-ticket)), push, and get fresh approvals. Do this _before_ asking for final reviews so you don't invalidate them.
- [ ] You ran the app and the tests on the final version, and they pass.
- [ ] The PR title and description are accurate, with the ticket key and a clear summary.

If any box is unchecked, do not merge. Fix it first, or ask the team lead.

### Step 2: Check the target

Look at the line near the top of the PR: **base: `dev`** or **base: `main`**.

- A ticket branch must target `dev`.
- Only `dev` may target `main`.
- If the base is wrong, stop and ask. Do not merge.

### Step 3: Merge

Ideally the PR author merges their own changes.

Click **Merge pull request**, then **Confirm merge**. We use merge commits: it is the only option GitHub offers, and it keeps the history of what was merged and when. Never merge with any bypass or override. If the button is disabled, see the table below.

### Step 4: Clean up and tell the team

|           | Ticket branch → `dev`                                            | `dev` → `main`                            |
| --------- | ---------------------------------------------------------------- | ----------------------------------------- |
| On GitHub | Click **Delete branch**                                          | **Do not delete `dev`**                   |
| Locally   | `git switch dev`, `git pull`, then `git branch -d <your-branch>` | `git switch main`, `git pull`             |
| Jira      | Move the ticket to **Done**                                      | Confirm every included ticket is **Done** |
| Verify    | Run the app on the updated `dev`                                 | Run the app on the updated `main`         |
| Announce  | Post in the team channel                                         | Post in the team channel                  |

**Announcement templates**

```
Merged TEAM3-12 (user login) into dev. Please pull dev. It touches the nav and routes files.
```

```
Released dev to main (<date>): TEAM3-12 user login, TEAM3-15 profile page. main is up to date.
```

### If something breaks after merging

Tell the team right away, in the channel. Do not quietly patch it. The team lead decides whether to revert the merge or fix it forward. Either way, the fix goes through a ticket and a PR like any other change.

### If the merge button is disabled

| What GitHub shows                       | What it means                                          | What to do                                                          |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Review required / waiting for approvals | Fewer than 2 approvals on the latest commit            | Request reviews, or re-request after new commits                    |
| Changes requested                       | A reviewer is blocking                                 | Address the comments, then ask them to re-review                    |
| Conversations unresolved                | Open review threads                                    | Address each, then resolve it                                       |
| This branch has conflicts               | Your branch and the base disagree                      | Resolve them (see section 7: [Merge Conflicts](#7-merge-conflicts)) |
| Can't approve your own / last pusher    | The person who pushed last cannot count as an approver | Ask someone else to review                                          |

## 7. Merge Conflicts

Conflicts will happen. They are normal, not a sign you did something wrong.

**Prevent them**

- Update your branch from `dev` often and keep branches short-lived.
- If two tickets touch the same files (shared components, routes, `package.json`), the two dev team members should talk **before** they start.

**Resolve them**

Whoever opens the PR resolves the conflict. On your ticket branch:

1. `git fetch origin`, then `git merge origin/dev`. Git lists the conflicted files.
2. Open each file and find the markers: `<<<<<<<`, `=======`, `>>>>>>>`. The top part is your version, the bottom part is `dev`'s.
3. Decide what the code should be, keep that, and delete all three marker lines.
4. `git add <file>` for each fixed file, then `git commit`.
5. Run the app and tests again.
6. `git push`

If it is not clear which change should win, ask the dev team member who wrote the other change. If you are still stuck, ask the team lead or a mentor. Do not guess.

We will practice creating and resolving a conflict together in a team meeting so it is less scary when it happens for real.

## 8. Releasing `dev` to `main`

**Only `dev` is merged into `main`.** No other branch goes to `main`.

Release when `dev` is stable and passing tests, and the team agrees (usually at the weekly meeting).

1. Confirm all the PRs meant for this release are merged into `dev`.
2. Everyone pulls `dev`. Run the app and the project's tests.
3. Open a PR from `dev` to `main`, titled `Release: <date>`, listing the tickets included.
4. Get 1 approval from a mentor, then merge it following section 6 ([Merging](#6-merging)).
5. Announce the release in the team channel.

## 9. Jira and GitHub

**Jira is the source of truth for who is working on what.** Each ticket moves through:

`To Do` → `In Progress` → `In Review` → `Done`

**Today, you do it by hand.** Put the ticket key in your branch name (copied from Jira), commit messages, and PR title, link the ticket in the PR description, and update the ticket status yourself.

**Once the Jira-GitHub integration is fully connected**, the same key becomes the link. Jira will show each ticket's branches, commits, and PRs on the ticket itself, so the team can see progress without asking, and Jira can be set up to move tickets automatically when a PR is opened or merged. Nothing changes for you except that the status updates get easier. Using the ticket key consistently from the start is what makes it work.

### Keeping Jira in Sync

Until the Jira-GitHub integration is connected, the ticket owner moves the ticket by hand:

| When                                      | Move the ticket to                             |
| ----------------------------------------- | ---------------------------------------------- |
| You start work                            | **In Progress**                                |
| You open a Draft PR                       | stays **In Progress**                          |
| Your PR is ready for review (not a draft) | **In Review**                                  |
| Reviewers request changes                 | stays **In Review**                            |
| Your PR is merged                         | **Done**                                       |
| Your PR is closed without merging         | Tell the team lead, who decides the new status |

## 10. Quick Reference

```
git switch dev && git pull                                                  # update dev
git switch -c <name-of-branch-copied-from-Jira-in-step-5-above>             # new branch (name copied from Jira)
git add . && git commit -m "TEAM3-12 message"                               # save work
git push -u origin <name-of-branch-copied-from-Jira-in-step-5-above>        # first push
git fetch origin && git merge origin/dev                                    # update my branch
git status                                                                  # where am I?
```

**Never**

- Push directly to `main` or `dev`
- Force-push
- Merge your own PR before it has its approvals
- Commit secrets or `.env` files
- Leave a PR waiting without saying anything

**Stuck?** Post in the team channel. Asking early is always the right call.
