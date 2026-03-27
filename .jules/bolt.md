## 2026-02-28 - Optimizing Patient Appointment Average
**Learning:** Calculating averages using correlated subqueries in SQLAlchemy (e.g. counting appointments per patient and then averaging the counts) results in terrible O(N^2) or O(N log N) database performance because it evaluates the subquery for every row.
**Action:** When calculating a global average of related entities (like average appointments per patient), compute the total counts independently (`total_appointments / total_patients`) in O(N) time instead of using complex nested SQL aggregates.
