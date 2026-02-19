-- Seed skill definitions for Floor 1 weapons

INSERT INTO sao.skill_definitions (name, weapon_type, level_req, hits, damage_multiplier, mp_cost, cooldown_ms, range, pre_motion_ms, execution_ms, post_motion_ms) VALUES
-- One-Handed Sword skills (10)
('Horizontal', 'one_handed_sword', 1, 1, 1.2, 10, 2000, 2.5, 300, 200, 400),
('Vertical', 'one_handed_sword', 1, 1, 1.3, 12, 2500, 2.5, 350, 250, 450),
('Rage Spike', 'one_handed_sword', 3, 1, 1.5, 18, 3000, 3.0, 400, 300, 500),
('Sonic Leap', 'one_handed_sword', 5, 1, 1.8, 22, 4000, 3.5, 450, 350, 600),
('Vertical Arc', 'one_handed_sword', 8, 2, 2.2, 30, 5000, 2.5, 500, 400, 700),
('Horizontal Square', 'one_handed_sword', 10, 4, 2.5, 35, 6000, 2.5, 550, 450, 800),
('Sharp Nail', 'one_handed_sword', 13, 3, 3.0, 45, 7000, 2.0, 600, 500, 900),
('Vorpal Strike', 'one_handed_sword', 15, 1, 3.5, 55, 8000, 4.0, 650, 550, 1000),
('Howling Octave', 'one_handed_sword', 18, 8, 4.0, 80, 12000, 2.5, 800, 600, 1500),
('The Eclipse', 'one_handed_sword', 20, 16, 5.0, 120, 20000, 3.0, 1000, 800, 2000),

-- Rapier skills (8)
('Linear', 'rapier', 1, 1, 1.3, 10, 2000, 2.5, 250, 200, 350),
('Oblique', 'rapier', 3, 1, 1.5, 15, 2500, 2.5, 300, 250, 400),
('Parallel Sting', 'rapier', 5, 1, 1.8, 20, 3000, 2.5, 350, 300, 450),
('Triangular', 'rapier', 8, 3, 2.2, 28, 4500, 2.5, 400, 350, 600),
('Star Splash', 'rapier', 11, 5, 2.8, 40, 6000, 2.0, 500, 400, 750),
('Flashing Penetrator', 'rapier', 14, 1, 3.5, 50, 8000, 4.0, 600, 450, 900),
('Quadrilateral Pain', 'rapier', 17, 7, 4.2, 70, 10000, 2.5, 700, 500, 1200),
('Eleven Concatenated Hits', 'rapier', 20, 11, 5.0, 100, 15000, 2.5, 900, 700, 1800),

-- Dagger skills (6)
('Rapid Bite', 'dagger', 1, 2, 1.2, 8, 1500, 1.5, 200, 150, 300),
('Fad Edge', 'dagger', 3, 1, 1.4, 12, 2000, 1.5, 250, 200, 350),
('Criminal Brand', 'dagger', 6, 1, 1.8, 18, 3000, 1.5, 300, 250, 450),
('Sudden Strike', 'dagger', 9, 1, 2.2, 25, 4000, 2.0, 350, 300, 550),
('Shadow Pierce', 'dagger', 12, 1, 2.8, 35, 5000, 2.5, 400, 350, 650),
('Death Flash', 'dagger', 15, 5, 3.5, 55, 8000, 1.5, 500, 400, 900);
