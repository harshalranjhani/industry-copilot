# Asset Intelligence Copilot

A chat copilot that answers oil-field operators' questions about their wells, grounded in inspections, repairs, regulator events, human notes and the manuals/SOPs, with shared and private memory.

## Assets and ownership

**Well**:
One oil well, identified by its asset ID (e.g. WELL-0001). Its well type selects the manual and rules that apply to it.
_Avoid_: Asset (except in field names), site

**Well Type**:
The class of a well (e.g. T200, T350). It decides the producing threshold, temperature alarm and escalation rules.

**Area**:
A geographic block of land holding a set of wells and owned by one team (e.g. Northeast Block 8). Always refer to it by name, not ID.
_Avoid_: Block ID, region, field

**Team**:
A production group that owns one or more areas.

## Observations

**Inspection**:
One weekly check of a well. It records wellhead and ambient temperature and any spill detection. The inspection is the source of truth for a well's state at that time.

**Latest Inspection**:
The most recent inspection of a well. "Right now" in a question means the latest inspection, not today's date.

**Recorded Status**:
The active/down value in the system of record. It is refreshed monthly and may be stale, so it never overrides the latest inspection.
_Avoid_: Status (unqualified)

**Producing**:
A well is producing oil at an inspection when the wellhead is at least the well type's threshold above ambient. It is never judged by absolute wellhead temperature.
_Avoid_: Active, running, online

**Shut-in**:
A well deliberately stopped by people, as opposed to stopped by a failure.

**Downtime**:
Seven days for each inspection that finds the well not producing. A missed inspection adds nothing.
_Avoid_: Repair downtime (that is a single job's duration)

**Detection**:
An inspection that flagged a possible spill, with an AI-estimated volume and pad area.

**Spill**:
A detection that has not been overridden by a correction. Only spills count for statistics, reporting and compliance.
_Avoid_: Leak, release (in counts)

**Spill Class**:
Minor, Moderate, Reportable or Major, decided by a spill's effective volume under the Spill Response SOP.

## Records and rules

**Repair**:
One maintenance job, either scheduled or corrective. It belongs to a period by its start date.
_Avoid_: Maintenance event, work order

**Repair Report**:
The free-text write-up of a corrective repair. Some facts exist only here, such as containment time and the compliance check.

**Regulator Event**:
An agency action or filing tied to a well: spill report, notice of violation, site inspection or response.

**Protocol**:
A numbered rule in an SOP (e.g. SR-01, RC-04, WS-02) with a requirement and usually a deadline.

**Breach**:
A protocol whose deadline has passed without the requirement being met.
_Avoid_: Violation (reserve that for the regulator's notice of violation)

**Open Action**:
A requirement that is not yet met but whose deadline has not passed, or whose work is still under way.

**Root-Cause Analysis (RCA)**:
A review required when a well reaches the escalation count of corrective repairs on one equipment kind within 12 months.

## Knowledge and memory

**Note**:
A human statement about a well, valid over a period. It comes either from the dataset or from a user in chat.

**Correction**:
A note that overrides one field of one inspection, for example "not a spill", a re-measured temperature or a measured volume. The original value is kept and the correction is attributed.

**Rule Override**:
A team instruction that changes a manual rule for every well of a type. It is applied only at that scope and is cited as the user's rule, not the manual's.

**Claim**:
A user statement about a well's state that is recorded but is not a correction. It is either consistent with the data, or unconfirmed when the data contradicts it.

**Dispute**:
Two or more notes that disagree about the same inspection, none of them a formal correction. The copilot shows both sides and does not pick one.

**Shared Knowledge**:
Notes, corrections, claims and rule overrides. Every user sees them.

**Private Memory**:
One user's own conversation history. No other user can see it.
