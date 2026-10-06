# IssueRow

One work item in a list: priority, ID, status, title, label and assignee.

- Wrap rows in `IssueList`. Titles truncate with an ellipsis; nothing else wraps.
- In narrow containers (under 520px) the priority and label hide automatically.
- `flash` highlights a row once in `hy-signal-soft` right after it is created.
