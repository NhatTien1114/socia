-- Manual migration for the existing MySQL socia database.
-- Run only when SHOW CREATE TABLE conversation reports the legacy
-- conversation_chk_1 CHECK (conversation_type between 0 and 1).
-- Hibernate ddl-auto=update has already changed the column to ENUM('DIRECT','GROUP').
-- One ALTER replaces the obsolete ordinal check without changing rows.
ALTER TABLE conversation
    DROP CHECK conversation_chk_1,
    ADD CONSTRAINT conversation_type_check
        CHECK (conversation_type IN ('DIRECT', 'GROUP'));
