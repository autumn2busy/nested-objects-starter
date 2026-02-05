# GitHub Project Setup Instructions

Follow these steps to configure your "Launch Readiness" project as the single source of truth.

## 1. Create Project
1.  Go to your GitHub Repository -> **Projects**.
2.  Click **New Project**.
3.  Choose **Board** template (or start from scratch).
4.  Title: **Launch Readiness**.

## 2. Configure Custom Fields
Go to **Settings** (top right of project view) -> **Custom fields**.
Create the following fields:

| Field Name | Type | Options / Notes |
| :--- | :--- | :--- |
| **Phase** | Single Select | `0`, `1`, `2`, `3`, `4`, `5` |
| **Severity** | Single Select | `Critical`, `High`, `Medium`, `Low` |
| **Category** | Single Select | `Security`, `Data`, `SEO`, `UX`, `Performance`, `QA`, `Reliability`, `Billing`, `Compliance`, `Analytics` |
| **Component** | Single Select | `Directory`, `Auth`, `Webhooks`, `App config`, `Marketing pages`, `Tools`, `Infra SQL` |
| **Effort** | Single Select | `S`, `M`, `L` |

## 3. Create Views
Click the `+` next to the first tab title to add views.

### View 1: Board (Kanban)
- **Layout**: Board
- **Column by**: Status (Todo, In Progress, Done)
- **Filter**: No filter (shows everything)

### View 2: Table (Backlog)
- **Layout**: Table
- **Group by**: Phase
- **Sort by**: Severity (Ascending/Critical top)

### View 3: Timeline (Roadmap)
- **Layout**: Roadmap
- **Start date**: *Leave Release Date blank for now*
- **Group by**: Phase

## 4. Import Issues
1.  Ensure you have run `import_issues.bat` to create the Issues in the repo.
2.  In the Project View (Table), click **Add item** (bottom) -> **Add from repository**.
3.  Select all open issues and add them.
4.  Bulk edit the "Phase" field for items to match the **Phased Roadmap**.

## 5. Milestones
Go to **Issues** -> **Milestones** in the repo.
Create the following:
- **Phase 0**: Safety and Observability
- **Phase 1**: Data and Billing Correctness
- **Phase 2**: Ads Readiness
- **Phase 3**: Directory Scale
- **Phase 4**: Polish & QA
- **Phase 5**: Launch

Assign issues to these milestones.
