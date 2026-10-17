# Corrections are an overlay applied in views, never written into source data

Source records (inspections, repairs, reports, regulator events) are loaded into a rebuildable data store and never modified. Everything people teach the copilot — corrections, claims, rule overrides, and the dataset's own notes (imported as `origin = dataset` entries, replaced on reload) — lives in a separate durable knowledge store, and the derived views (producing, effective spill volume, downtime, spill class) apply it at query time, scoped to one inspection field, one well, or one well type.

We chose this over mutating records in place because the brief requires keeping the original value with who corrected it and why, and because the test dataset is loaded mid-event: a rebuild of the data store must not erase what users taught. The cost is that every query must go through the views rather than raw tables, and the tools must enforce that.
