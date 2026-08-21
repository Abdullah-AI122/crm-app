# reference: crm ui patterns
Sources cached offline — do not re-search. See backend/.claude/reference.md for schema/permissions/automation.
Term map ours->monday: Workspace=Workspace, Module=Board, Collection=Group, Record=Item, Column=Column, RecordValue=Cell. Missing on our side: Folder, Subitem, View, Dashboard, Update/Activity feed, Automation.
## board anatomy (top->bottom)
Board header: name(inline-edit), description, star/fav, board menu(...), Integrate, Automate, Invite/avatars stack, Search, Person filter, Filter, Sort, Hide columns, Group by.
View tabs row: Main Table + added views + "+" add view.
Group block: colored collapse caret, group name(inline-edit), item count, group menu(...), "+ Add item" row at bottom.
Row: checkbox(bulk select) | color bar | item name + open-item chevron + updates-count bubble | cells | "+" add column.
Group footer: per-column aggregate (sum/avg/count/median/min/max, "Show summary on collapse").
Item panel (right drawer/modal): tabs Updates | Files | Activity Log | Info Boxes. Update composer with @mention, like, reply.
Batch action bar (appears on multi-select): "N items selected" + Duplicate, Export, Archive, Delete, Move to, Convert.
## views to support
Table(default grid) | Kanban(group by status col, drag between lanes) | Calendar(date col) | Timeline/Gantt(timeline col + dependencies) | Chart(bar/pie/line/stacked over any col) | Form(public submit -> creates record) | Files(gallery of file cells) | Map(location col) | Workload(capacity per person) | Cards.
View state persists per view: filters, sort, hidden cols, group-by, col order/width.
## ui copy (reuse verbatim-style)
Empty board: "This board is empty" / "Add your first item".
Add: "+ Add item", "+ Add group", "+ Add column", "+ New board", "+ New workspace".
Menus: Rename, Duplicate, Move to, Change color, Archive, Delete, Collapse all, Export to Excel, Copy link.
Column menu: Rename, Column settings, Filter by this column, Sort ascending/descending, Collapse, Duplicate, Move left/right, Change type, Delete.
Filter: "Filter this board", "Show items where", + And/Or, "Clear all".
Confirm delete: "Delete <name>? This can't be undone." Buttons: Cancel / Delete.
Toast: "Item deleted" + "Undo".
Search: "Search this board", "Search everything".
Invite: "Invite members", "Invite by email", role select, "Send invitation".
## interaction rules
Inline edit everywhere: single click cell -> editor popover, Esc cancel, Enter commit, Tab next cell.
Optimistic UI on cell write; revert + toast on API error.
Drag: reorder rows within/between groups, reorder groups, reorder+resize columns (resizeHandle.tsx exists).
Keyboard: Enter=open item, Space=select row, Cmd/Ctrl+K=command palette, Esc=close panel.
Colors: group color + status label colors drive row/cell tint (getCollectionColor.tsx, tint.tsx exist).
Density: row height compact/medium/tall toggle.
## our gaps (build order)
1 views layer (Table exists implicitly; add Kanban+Calendar) 2 item detail panel + updates 3 filters/sort/hide/group-by toolbar 4 activity log 5 notifications feed 6 automations UI 7 dashboards/widgets 8 form view 9 subitems.
src: developer.monday.com/api-reference/reference/column-types-reference; support.monday.com (hierarchy, board basics, kanban, permissions); airtable.com/developers/web/api/field-model; monday.com/crm/marketplace/template/*; simonsezit.com types-of-views-on-monday-com.
