-- Plate — seed data (spec section 7). Run AFTER schema.sql + policies.sql.
-- Idempotent: recipes upsert by name; plan/slots/grocery rebuilt each run.
-- NOTE: per-user supplements are seeded by the signup trigger, not here.
-- ACTION REQUIRED: replace the owner_email placeholder below with Luke's email.

begin;

-- ---------------------------------------------------------------------------
-- Household + config
-- ---------------------------------------------------------------------------
-- Exactly ONE household. Keyed by "the oldest row", never by name, so a
-- later rename can't spawn a second household and orphan the plan.
insert into public.households (name)
select 'The Reilly Household'
where not exists (select 1 from public.households);

update public.households
  set name = 'The Reilly Household'
  where id = (select id from public.households order by created_at limit 1);

insert into public.app_config (id, household_id, owner_email)
values (
  true,
  (select id from public.households order by created_at limit 1),
  'l.r.k.reilly@gmail.com'
)
on conflict (id) do update
  set household_id = excluded.household_id,
      owner_email  = excluded.owner_email;

-- ---------------------------------------------------------------------------
-- Recipes (upsert by name)
-- ---------------------------------------------------------------------------
insert into public.recipes
  (name, protein_tag, prep_time, cooking_method, ingredients, notes, steps,
   image_search_term, cook_double, default_servings)
values
-- Breakfasts -----------------------------------------------------------------
('Greek Yogurt Bowl', null, '2 min', 'no_cook',
 '["Full-fat Greek yogurt 1 cup","Walnuts handful","Berries (fresh or frozen) ½ cup","Honey drizzle"]'::jsonb,
 'Take daily supplement stack with breakfast — see Settings.',
 '[{"title":"Scoop and serve.","content":"Spoon yogurt into a bowl. Top with walnuts, scatter berries, drizzle honey. Eat."}]'::jsonb,
 'greek yogurt berries walnuts honey bowl', false, 5),

('Power Oats', null, '5 min', 'stovetop',
 '["Rolled oats ½ cup","Milk or water 1 cup","Peanut or almond butter 1 heaped tbsp","Cinnamon pinch","Apple ½, sliced (or berries)"]'::jsonb,
 null,
 '[{"title":"Cook the oats.","content":"Combine oats and milk in a microwave-safe bowl. Microwave 2 minutes, stir, microwave 30 seconds more.","timer_seconds":120},{"title":"Top and serve.","content":"Stir in peanut butter, sprinkle cinnamon, top with sliced apple."}]'::jsonb,
 'oatmeal porridge apple cinnamon peanut butter', false, 5),

('Spinach Scramble + Toast', null, '10 min', 'stovetop',
 '["Eggs 4","Spinach 2 handfuls","Olive oil 1 tbsp","Whole-grain sourdough 2 slices","Salt and pepper"]'::jsonb,
 null,
 '[{"title":"Toast the bread.","content":"Drop sourdough in the toaster."},{"title":"Heat the pan.","content":"Olive oil in a non-stick pan over medium heat."},{"title":"Cook the eggs.","content":"Crack eggs into the pan. Stir gently and slowly with a spatula. Don''t rush — low and slow makes them creamy."},{"title":"Add spinach last.","content":"When the eggs are mostly set but still slightly wet, add the spinach. Fold through for 20 seconds — just enough to wilt."},{"title":"Plate.","content":"Eggs alongside toast. Season with salt and pepper."}]'::jsonb,
 'spinach eggs scramble sourdough toast', false, 5),

-- Lunches --------------------------------------------------------------------
('60-Second Salad', null, '5 min', 'no_cook',
 '["Mixed greens 2 handfuls","Chickpeas ½ can, rinsed","Cherry tomatoes handful","Feta 50g, crumbled","Olive oil 2 tbsp","Lemon juice from ½","Salt and pepper"]'::jsonb,
 null,
 '[{"title":"Throw it in a bowl.","content":"Greens, chickpeas, tomatoes, feta."},{"title":"Dress aggressively.","content":"Olive oil, lemon, salt, pepper. Toss. Done."}]'::jsonb,
 'chickpea greens feta tomato salad olive oil', false, 5),

('Steak Lunch Bowl', null, '3 min', 'no_cook',
 '["Leftover rump steak, sliced","Rocket handful","Leftover sweet potato wedges","Olive oil","Lemon"]'::jsonb,
 null,
 '[{"title":"Assemble.","content":"Pile rocket on a plate. Add wedges. Top with steak slices. Drizzle olive oil and squeeze of lemon. Eat cold or microwave 60s."}]'::jsonb,
 'sliced steak rocket sweet potato bowl', false, 5),

('Grown-Up Lunchable', null, '5 min', 'no_cook',
 '["Whole wheat pita 1, cut into wedges","Hummus 3 tbsp","Cucumber ½, sliced","Tinned tuna 1 can, drained"]'::jsonb,
 null,
 '[{"title":"Plate it up.","content":"Pita wedges, scoop of hummus, cucumber slices, tuna. Pack in a tupperware for the office."}]'::jsonb,
 'pita hummus cucumber tuna meze plate', false, 5),

('Salmon Bowl', null, '2 min', 'no_cook',
 '["Leftover salmon, flaked","Leftover quinoa","Fresh herbs (dill, parsley)","Olive oil","Lemon"]'::jsonb,
 null,
 '[{"title":"Combine.","content":"Quinoa in a bowl, top with flaked salmon, scatter herbs, drizzle olive oil and lemon."}]'::jsonb,
 'salmon quinoa lemon herbs bowl', false, 5),

('Souvlaki Lunch Wrap', null, '3 min', 'no_cook',
 '["Leftover diced chicken","Whole wheat pita 1","Tzatziki 2 tbsp","Cucumber","Feta"]'::jsonb,
 null,
 '[{"title":"Warm the pita.","content":"20 seconds in a dry pan or microwave."},{"title":"Build.","content":"Tzatziki down the middle, chicken, cucumber, feta. Roll up."}]'::jsonb,
 'chicken pita wrap tzatziki greek', false, 5),

('Lemon Chicken & Beans Bowl', null, '2 min', 'no_cook',
 '["Leftover slow-cooker chicken","Leftover cannellini beans (from the slow cooker)","Rocket or salad greens","Fresh lemon"]'::jsonb,
 null,
 '[{"title":"Assemble.","content":"Greens on the plate. Chicken and beans on top (cold or warmed). Fresh squeeze of lemon. Done."}]'::jsonb,
 'lemon chicken cannellini beans bowl rocket', false, 5),

('Greek Steak Salad', null, '3 min', 'no_cook',
 '["Leftover rump steak, sliced","Rocket","Leftover lemon potatoes","Cherry tomato halves","Feta crumbled","Olive oil"]'::jsonb,
 null,
 '[{"title":"Build.","content":"Greens base. Add potatoes, tomatoes, feta. Pile steak slices on top. Drizzle olive oil."}]'::jsonb,
 'steak salad lemon potato feta greek', false, 5),

('Mediterranean Salmon Salad', null, '2 min', 'no_cook',
 '["Leftover salmon, flaked","Leftover white beans (from the tray bake)","Mixed greens","Olive oil","Lemon"]'::jsonb,
 null,
 '[{"title":"Combine.","content":"Greens, beans, salmon. Olive oil, lemon. Eat."}]'::jsonb,
 'salmon white beans greens lemon olive oil', false, 5),

('Honey-Mustard Chicken Wrap', null, '3 min', 'no_cook',
 '["Leftover honey-mustard chicken","Whole wheat pita 1","Greens","Dijon mustard (optional smear)"]'::jsonb,
 null,
 '[{"title":"Warm pita, fill, roll.","content":"20s in a dry pan. Mustard smear, greens, chicken, roll."}]'::jsonb,
 'chicken wrap pita honey mustard greens', false, 5),

-- Dinners --------------------------------------------------------------------
('Pan-Seared Rump with Sweet Potato Wedges & Greens', 'steak', '25 min', 'stovetop',
 '["Rump steak 600g","Sweet potatoes 4-5 large","Rocket or spinach 2 handfuls","Lemon 1","Olive oil","Garlic 2 cloves, minced","Salt and pepper"]'::jsonb,
 'COOK DOUBLE — sear an extra portion for Tuesday''s lunch.',
 '[{"title":"Preheat oven.","content":"200°C fan-forced."},{"title":"Prep wedges.","content":"Cut sweet potatoes into thick wedges. Toss with olive oil, salt, pepper. Spread on a baking tray."},{"title":"Wedges in.","content":"Bake 25 minutes, turn once halfway.","timer_seconds":1500},{"title":"Rest the steak.","content":"Take rump out of fridge 15 minutes before cooking. Pat dry. Season generously."},{"title":"Sear.","content":"Pan over high heat. Glug of olive oil. Sear steak 3–4 min per side for medium. Press with tongs — firm but with give.","timer_seconds":240},{"title":"Rest.","content":"Transfer steak to a plate, cover loosely with foil, rest 5 minutes. Non-negotiable.","timer_seconds":300},{"title":"Plate.","content":"Slice steak against the grain. Rocket on plates, olive oil + lemon. Wedges. Steak on top. Serve."}]'::jsonb,
 'steak sweet potato wedges rocket plated', true, 5),

('Slow Cooker Mediterranean Chicken over Whole Wheat Pasta', 'chicken', '10 min prep + 4–6 hr', 'slow_cooker',
 '["Chicken breasts 800g","Canned diced tomatoes 1 can","Garlic 3 cloves, minced","Dried oregano 1 tsp","Capers 2 tbsp","Fresh basil to serve","Whole wheat pasta 400g"]'::jsonb,
 'Capers replace olives — same briny hit. Kids love it over pasta.',
 '[{"title":"Set the slow cooker.","content":"Chicken, tomatoes, garlic, oregano, capers all in the pot. Stir. Lid on. Low for 6 hours or high for 4."},{"title":"Shred when done.","content":"Two forks. Stir back through the sauce."},{"title":"Cook pasta.","content":"10 minutes before serving, drop pasta in boiling salted water.","timer_seconds":600},{"title":"Plate.","content":"Pasta in bowls, sauce ladled over, tear basil on top."}]'::jsonb,
 'slow cooker chicken tomato pasta italian', false, 5),

('Sheet Pan Salmon with Asparagus & Cherry Tomatoes', 'salmon', '25 min', 'sheet_pan',
 '["Salmon fillets (enough for 2 dinners + lunch)","Asparagus or green beans 1 bunch","Cherry tomatoes 1 punnet","Olive oil","Lemon 1","Salt and pepper","Microwave quinoa 2 pouches"]'::jsonb,
 'COOK DOUBLE SALMON — Thursday''s lunch.',
 '[{"title":"Preheat.","content":"Oven 200°C fan."},{"title":"Prep the tray.","content":"Salmon, asparagus, tomatoes on a tray. Olive oil, salt, pepper. Lemon halves alongside."},{"title":"Bake.","content":"15 minutes. Salmon should flake but stay moist.","timer_seconds":900},{"title":"Quinoa.","content":"Microwave pouches for 90 seconds while salmon rests.","timer_seconds":90},{"title":"Plate.","content":"Quinoa, salmon, veg. Squeeze the roasted lemons over."}]'::jsonb,
 'salmon asparagus tomato sheet pan lemon', true, 5),

('Souvlaki Bowls (Build-Your-Own)', 'chicken', '20 min', 'stovetop',
 '["Diced chicken 800g","Olive oil","Dried oregano 2 tsp","Brown rice (microwave pouches) 2","Cucumber 1, diced","Cherry tomatoes, halved","Tzatziki 1 tub","Feta to serve"]'::jsonb,
 'Kids wrap theirs in pita. COOK DOUBLE CHICKEN — Friday''s lunch.',
 '[{"title":"Heat the pan.","content":"Big drizzle of olive oil, medium-high heat."},{"title":"Cook the chicken.","content":"Add chicken with oregano, salt and pepper. Cook 8–10 minutes until golden and cooked through.","timer_seconds":540},{"title":"Microwave rice.","content":"90 seconds.","timer_seconds":90},{"title":"Set up the bar.","content":"Bowls of rice, chicken, cucumber, tomato, tzatziki, feta on the table. Everyone builds their own."}]'::jsonb,
 'greek souvlaki chicken bowl tzatziki rice', true, 5),

('Sardinian Lentil & White Bean Minestrone (Slow Cooker)', 'legume', '10 min prep + 6–8 hr', 'slow_cooker',
 '["Dried brown or green lentils 1 cup, rinsed","Cannellini beans 1 can, drained","Canned diced tomatoes 1 can","Tomato paste 2 tbsp","Carrots 2, diced","Celery 2 stalks, diced","Red onion 1, diced","Garlic 3 cloves, minced","Dried oregano 1 tsp","Bay leaves 2","Chicken or vegetable stock 1 L","Olive oil","Parmesan rind (if you have one)","Ditalini pasta 1 cup","Parmesan to serve"]'::jsonb,
 'THE Blue Zones meal. Set in slow cooker before work. Tastes even better as Saturday leftovers.',
 '[{"title":"All in the pot.","content":"Lentils, beans, tomatoes, tomato paste, vegetables, garlic, oregano, bay leaves, stock, parmesan rind. Lid on. Low for 7 hours or high for 4."},{"title":"Last 20 minutes — add pasta.","content":"Stir in the ditalini. Lid back on. Cook 20 minutes more until pasta is tender.","timer_seconds":1200},{"title":"Finish.","content":"Remove bay leaves and parmesan rind. Taste — add salt if needed."},{"title":"Serve.","content":"Bowls. Generous grating of parmesan. Drizzle of olive oil on top."}]'::jsonb,
 'minestrone soup lentils beans pasta italian', false, 5),

('Slow Cooker Lemon Rosemary Chicken with White Beans', 'chicken', '10 min prep + 4–6 hr', 'slow_cooker',
 '["Chicken thighs (boneless) 1 kg","Cannellini beans 1 can, drained","Lemon 1, half juiced + half sliced","Garlic 4 cloves, smashed","Fresh rosemary 2 sprigs","Chicken stock 250 ml","Olive oil","Salt and pepper","Crusty bread or microwave rice to serve"]'::jsonb,
 'Thighs stay juicy. Beans soak up the lemon-garlic. Leftovers cover Tuesday''s lunch.',
 '[{"title":"Layer it up.","content":"Chicken thighs in slow cooker. Add beans, garlic, rosemary sprigs, lemon slices and juice, stock. Drizzle of olive oil."},{"title":"Cook.","content":"Lid on. Low for 6 hours or high for 4."},{"title":"Serve.","content":"Pull rosemary stems. Ladle into bowls with the broth. Bread on the side for dunking."}]'::jsonb,
 'lemon rosemary chicken white beans slow cooker', true, 5),

('Greek-Style Rump with Lemon Roast Potatoes', 'steak', '30 min', 'oven',
 '["Rump steak 1 kg","Baby potatoes 1 kg, halved","Lemon 1, juiced","Garlic 3 cloves, minced","Dried oregano 1 tbsp","Olive oil","Cucumber 1, sliced","Cherry tomatoes 1 punnet","Feta 100g, crumbled"]'::jsonb,
 'Potatoes do the work in the oven. Sear steak last 8 minutes. COOK DOUBLE STEAK.',
 '[{"title":"Preheat oven.","content":"200°C fan."},{"title":"Lemon potatoes in.","content":"Halved potatoes on a tray. Olive oil, lemon juice, half the garlic, half the oregano, salt and pepper. Toss. Spread out. Roast 25 minutes.","timer_seconds":1500},{"title":"Rub the steak.","content":"While potatoes cook: rub rump with remaining garlic, oregano, salt, pepper, olive oil. Bring to room temperature."},{"title":"Sear, rest.","content":"Heat a pan over high heat. Sear steak 3–4 minutes per side. Rest 5 minutes covered.","timer_seconds":540},{"title":"Greek salad.","content":"While steak rests: cucumber, tomatoes, feta in a bowl. Drizzle olive oil, pinch of oregano."},{"title":"Plate.","content":"Slice steak against the grain. Potatoes alongside. Greek salad on the plate."}]'::jsonb,
 'greek lemon potatoes steak rump plated', true, 5),

('Mediterranean Salmon Tray Bake with White Beans & Tomatoes', 'salmon', '20 min', 'sheet_pan',
 '["Salmon fillets (enough for 2 dinners + lunch)","Cannellini beans 1 can, drained","Cherry tomatoes 1 punnet","Capers 2 tbsp","Fresh dill, chopped","Olive oil","Lemon 1"]'::jsonb,
 'Beans absorb the salmon juices. COOK DOUBLE SALMON.',
 '[{"title":"Preheat.","content":"Oven 200°C fan."},{"title":"Build the tray.","content":"Beans on the tray first, scatter tomatoes and capers. Drizzle olive oil. Lay salmon fillets on top. Lemon slices and dill scattered over."},{"title":"Bake.","content":"15 minutes. Salmon flakes easily; beans warmed through.","timer_seconds":900},{"title":"Serve.","content":"Beans and tomatoes spooned alongside the salmon. Drizzle of olive oil and fresh lemon to finish."}]'::jsonb,
 'salmon white beans tomato capers tray bake', true, 5),

('Sheet Pan Honey-Mustard Chicken with Chickpeas & Capsicum', 'chicken', '30 min', 'sheet_pan',
 '["Chicken thighs 1 kg","Chickpeas 1 can, drained","Capsicum (red and yellow) 2, sliced","Red onion 1, sliced into wedges","Honey 2 tbsp","Dijon mustard 2 tbsp","Olive oil 2 tbsp","Salt and pepper"]'::jsonb,
 'Kid-friendly: honey-mustard glaze, no spice. COOK DOUBLE.',
 '[{"title":"Preheat.","content":"Oven 200°C fan."},{"title":"Mix the glaze.","content":"Honey, mustard, olive oil, salt and pepper in a small bowl. Stir."},{"title":"Build the tray.","content":"Chicken, chickpeas, capsicum, onion on the tray. Pour glaze over. Toss to coat."},{"title":"Roast.","content":"25–30 minutes until chicken is golden and cooked through.","timer_seconds":1620},{"title":"Serve.","content":"Straight from the tray to plates."}]'::jsonb,
 'honey mustard chicken thigh chickpeas peppers sheet pan', true, 5),

('Steak & Rocket Open Sandwich on Sourdough', 'steak', '15 min', 'stovetop',
 '["Rump steak 800g","Sourdough 4 thick slices","Rocket 2 handfuls","Cherry tomatoes, halved","Dijon mustard or horseradish","Olive oil","Salt and pepper"]'::jsonb,
 'Friday handled. Fast and satisfying.',
 '[{"title":"Toast.","content":"Sourdough in the toaster."},{"title":"Sear the steak.","content":"Hot pan, olive oil. Steak 3 minutes per side. Rest 5 minutes.","timer_seconds":360},{"title":"Slice thin.","content":"Against the grain."},{"title":"Build.","content":"Toast on plate. Smear of Dijon. Rocket. Tomato halves. Steak slices piled on. Drizzle olive oil, cracked pepper."}]'::jsonb,
 'steak open sandwich sourdough rocket tomato', false, 5)

on conflict (name) do update set
  protein_tag       = excluded.protein_tag,
  prep_time         = excluded.prep_time,
  cooking_method    = excluded.cooking_method,
  ingredients       = excluded.ingredients,
  notes             = excluded.notes,
  steps             = excluded.steps,
  image_search_term = excluded.image_search_term,
  cook_double       = excluded.cook_double,
  default_servings  = excluded.default_servings,
  updated_at        = now();

-- ---------------------------------------------------------------------------
-- Plan (single active plan; week_started_on = Monday of the current ISO week)
-- ---------------------------------------------------------------------------
insert into public.plans (household_id, name, current_week, week_started_on, active)
select
  (select id from public.households order by created_at limit 1),
  'Mediterranean Rotation v1',
  1,
  (date_trunc('week', current_date))::date,
  true
where not exists (
  select 1 from public.plans where name = 'Mediterranean Rotation v1'
);

-- Re-point an existing plan at the canonical household (heals prior drift).
update public.plans
  set household_id = (select id from public.households order by created_at limit 1)
  where name = 'Mediterranean Rotation v1';

-- Rebuild slots + grocery for an idempotent re-seed.
delete from public.meal_slots
where plan_id = (select id from public.plans where name = 'Mediterranean Rotation v1');
delete from public.grocery_items
where plan_id = (select id from public.plans where name = 'Mediterranean Rotation v1');

-- ---------------------------------------------------------------------------
-- Meal slots (spec section 7 full mapping). day_of_week ISO Mon=1..Fri=5.
-- ---------------------------------------------------------------------------
with p as (
  select id as plan_id from public.plans where name = 'Mediterranean Rotation v1'
),
m (week, day_of_week, meal_type, recipe_name) as (
  values
    -- Week 1
    (1,1,'breakfast','Greek Yogurt Bowl'),
    (1,1,'lunch','60-Second Salad'),
    (1,1,'dinner','Pan-Seared Rump with Sweet Potato Wedges & Greens'),
    (1,2,'breakfast','Power Oats'),
    (1,2,'lunch','Steak Lunch Bowl'),
    (1,2,'dinner','Slow Cooker Mediterranean Chicken over Whole Wheat Pasta'),
    (1,3,'breakfast','Spinach Scramble + Toast'),
    (1,3,'lunch','Grown-Up Lunchable'),
    (1,3,'dinner','Sheet Pan Salmon with Asparagus & Cherry Tomatoes'),
    (1,4,'breakfast','Greek Yogurt Bowl'),
    (1,4,'lunch','Salmon Bowl'),
    (1,4,'dinner','Souvlaki Bowls (Build-Your-Own)'),
    (1,5,'breakfast','Power Oats'),
    (1,5,'lunch','Souvlaki Lunch Wrap'),
    (1,5,'dinner','Sardinian Lentil & White Bean Minestrone (Slow Cooker)'),
    -- Week 2
    (2,1,'breakfast','Greek Yogurt Bowl'),
    (2,1,'lunch','60-Second Salad'),
    (2,1,'dinner','Slow Cooker Lemon Rosemary Chicken with White Beans'),
    (2,2,'breakfast','Power Oats'),
    (2,2,'lunch','Lemon Chicken & Beans Bowl'),
    (2,2,'dinner','Greek-Style Rump with Lemon Roast Potatoes'),
    (2,3,'breakfast','Spinach Scramble + Toast'),
    (2,3,'lunch','Greek Steak Salad'),
    (2,3,'dinner','Mediterranean Salmon Tray Bake with White Beans & Tomatoes'),
    (2,4,'breakfast','Greek Yogurt Bowl'),
    (2,4,'lunch','Mediterranean Salmon Salad'),
    (2,4,'dinner','Sheet Pan Honey-Mustard Chicken with Chickpeas & Capsicum'),
    (2,5,'breakfast','Power Oats'),
    (2,5,'lunch','Honey-Mustard Chicken Wrap'),
    (2,5,'dinner','Steak & Rocket Open Sandwich on Sourdough')
)
insert into public.meal_slots (plan_id, week, day_of_week, meal_type, recipe_id)
select p.plan_id, m.week, m.day_of_week, m.meal_type, r.id
from m
cross join p
join public.recipes r on r.name = m.recipe_name;

-- ---------------------------------------------------------------------------
-- Grocery items — Week 1 (spec section 7)
-- ---------------------------------------------------------------------------
with p as (
  select id as plan_id from public.plans where name = 'Mediterranean Rotation v1'
),
g (week, category, display_order, name, quantity) as (
  values
    -- Week 1 protein
    (1,'protein',1,'Rump steak','~600g (Mon only, cook double)'),
    (1,'protein',2,'Chicken breasts','~800g (slow cooker Tue)'),
    (1,'protein',3,'Diced chicken or thighs','~800g (Thu souvlaki, cook double)'),
    (1,'protein',4,'Salmon fillets','enough for 2 dinners + lunch (cook double Wed)'),
    (1,'protein',5,'Canned wild tuna','1 can'),
    -- Week 1 produce
    (1,'produce',1,'Mixed salad greens / rocket','2 large bags'),
    (1,'produce',2,'Cherry tomatoes','3 punnets'),
    (1,'produce',3,'Cucumber','2'),
    (1,'produce',4,'Sweet potatoes','4-5 large'),
    (1,'produce',5,'Asparagus or green beans','1 bunch'),
    (1,'produce',6,'Carrots','1 large bag'),
    (1,'produce',7,'Celery','1 bunch'),
    (1,'produce',8,'Red onion','2'),
    (1,'produce',9,'Lemons','3'),
    (1,'produce',10,'Apples','3'),
    (1,'produce',11,'Berries','1 punnet'),
    (1,'produce',12,'Spinach','1 bag'),
    (1,'produce',13,'Fresh basil','1 bunch'),
    (1,'produce',14,'Garlic','1 head'),
    -- Week 1 pantry
    (1,'pantry',1,'Extra virgin olive oil','keep stocked'),
    (1,'pantry',2,'Dried brown/green lentils','1 cup'),
    (1,'pantry',3,'Canned cannellini beans','1 can'),
    (1,'pantry',4,'Canned chickpeas','1 can'),
    (1,'pantry',5,'Canned diced tomatoes','2 cans'),
    (1,'pantry',6,'Tomato paste','small jar/tube'),
    (1,'pantry',7,'Capers','1 small jar'),
    (1,'pantry',8,'Bay leaves','1 jar'),
    (1,'pantry',9,'Ditalini pasta','1 box'),
    (1,'pantry',10,'Whole wheat pasta','1 box'),
    (1,'pantry',11,'Whole wheat pita','1 pack'),
    (1,'pantry',12,'Microwave rice/quinoa pouches','4 pouches'),
    (1,'pantry',13,'Plain rolled oats','1 bag'),
    (1,'pantry',14,'Peanut/almond butter','1 jar'),
    (1,'pantry',15,'Honey','1 jar'),
    (1,'pantry',16,'Hummus','1 large tub'),
    (1,'pantry',17,'Dried oregano','1 jar'),
    (1,'pantry',18,'Tinned sardines in olive oil','2 tins'),
    (1,'pantry',19,'Walnuts','1 bag'),
    (1,'pantry',20,'Almonds or pistachios','1 bag'),
    -- Week 1 dairy
    (1,'dairy',1,'Full-fat Greek yogurt','large tub'),
    (1,'dairy',2,'Feta','1 block'),
    (1,'dairy',3,'Tzatziki','1 tub'),
    (1,'dairy',4,'Parmesan','1 wedge'),
    (1,'dairy',5,'Eggs','1 dozen'),
    -- Week 2 protein
    (2,'protein',1,'Rump steak','~1.2 kg total (Tue + Fri, cook double Tue)'),
    (2,'protein',2,'Chicken thighs (boneless)','~2 kg total (Mon slow cooker + Thu sheet pan, both cook double)'),
    (2,'protein',3,'Salmon fillets','enough for 2 dinners + lunch (cook double Wed)'),
    -- Week 2 produce
    (2,'produce',1,'Mixed salad greens / rocket','2 large bags'),
    (2,'produce',2,'Cherry tomatoes','3 punnets'),
    (2,'produce',3,'Cucumber','2'),
    (2,'produce',4,'Baby potatoes','1 kg'),
    (2,'produce',5,'Capsicum (red & yellow)','3'),
    (2,'produce',6,'Red onion','2'),
    (2,'produce',7,'Lemons','4'),
    (2,'produce',8,'Apples','3'),
    (2,'produce',9,'Berries','1 punnet'),
    (2,'produce',10,'Spinach','1 bag'),
    (2,'produce',11,'Carrots','1 bag'),
    (2,'produce',12,'Fresh rosemary','1 sprig pack'),
    (2,'produce',13,'Fresh dill','1 bunch'),
    (2,'produce',14,'Garlic','1 head'),
    -- Week 2 pantry
    (2,'pantry',1,'Extra virgin olive oil','keep stocked'),
    (2,'pantry',2,'Canned cannellini beans','2 cans'),
    (2,'pantry',3,'Canned chickpeas','1 can'),
    (2,'pantry',4,'Capers','restock if needed'),
    (2,'pantry',5,'Whole wheat pita','1 pack'),
    (2,'pantry',6,'Whole-grain sourdough','1 loaf'),
    (2,'pantry',7,'Microwave brown rice pouches','3 pouches'),
    (2,'pantry',8,'Chicken stock','1 small carton'),
    (2,'pantry',9,'Plain rolled oats','restock if needed'),
    (2,'pantry',10,'Peanut/almond butter','restock if needed'),
    (2,'pantry',11,'Hummus','1 large tub'),
    (2,'pantry',12,'Dijon mustard','1 jar'),
    (2,'pantry',13,'Honey','restock if needed'),
    (2,'pantry',14,'Dried oregano','restock if needed'),
    (2,'pantry',15,'Tinned sardines in olive oil','2 tins'),
    (2,'pantry',16,'Walnuts','restock if needed'),
    (2,'pantry',17,'Almonds or pistachios','restock if needed'),
    -- Week 2 dairy
    (2,'dairy',1,'Full-fat Greek yogurt','large tub'),
    (2,'dairy',2,'Feta','1 block'),
    (2,'dairy',3,'Eggs','1 dozen')
)
insert into public.grocery_items (plan_id, week, category, display_order, name, quantity)
select p.plan_id, g.week, g.category, g.display_order, g.name, g.quantity
from g cross join p;

-- ---------------------------------------------------------------------------
-- Backfill / self-heal: the signup trigger only fires for NEW auth users, so
-- anyone who signed in before app_config existed is missing from public.users
-- / household_members and RLS hides everything from them. Re-running this seed
-- reconciles them. Idempotent.
-- ---------------------------------------------------------------------------
insert into public.users (id, email, display_name)
select au.id, au.email,
       coalesce(au.raw_user_meta_data ->> 'display_name',
                split_part(au.email, '@', 1))
from auth.users au
on conflict (id) do nothing;

insert into public.household_members (household_id, user_id, role)
select cfg.household_id,
       u.id,
       case
         when cfg.owner_email is not null
              and lower(cfg.owner_email) = lower(u.email)
         then 'owner' else 'member'
       end
from public.users u
cross join public.app_config cfg
where cfg.household_id is not null
on conflict (household_id, user_id) do nothing;

-- Drop any orphan duplicate households left by an earlier name-keyed seed
-- (none of these are referenced once the plan is repointed above).
delete from public.households h
where h.id <> (select id from public.households order by created_at limit 1)
  and not exists (select 1 from public.plans p where p.household_id = h.id)
  and not exists (
    select 1 from public.household_members m where m.household_id = h.id
  );

commit;
