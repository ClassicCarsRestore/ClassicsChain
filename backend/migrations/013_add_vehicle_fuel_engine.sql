ALTER TABLE vehicles ADD COLUMN fuel TEXT NOT NULL DEFAULT '';
ALTER TABLE vehicles ADD COLUMN engine_cc INT NULL;
ALTER TABLE vehicles ADD COLUMN engine_cylinders INT NULL;
ALTER TABLE vehicles ADD COLUMN engine_power_hp INT NULL;

---- create above / drop below ----

ALTER TABLE vehicles DROP COLUMN engine_power_hp;
ALTER TABLE vehicles DROP COLUMN engine_cylinders;
ALTER TABLE vehicles DROP COLUMN engine_cc;
ALTER TABLE vehicles DROP COLUMN fuel;
