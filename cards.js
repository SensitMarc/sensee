/* Built-in cards and the daily schedule. Shared by index.html (what clients see) and admin.html (how many fresh days are left).
   Edit cards here. The schedule steps through a fixed shuffle of each deck's built-in cards, then through the cards the admin has
   approved, in the order they were approved. A card does not repeat until the whole sequence has been used. */
window.SENSEE_CARDS = {
  everyday: [
  ["Do", "Text someone one specific thing you remember fondly about them. No question attached."],
  ["Do", "Leave the closest parking spot or the first seat for someone else."],
  ["Do", "Open a window for one minute and let the outside in."],
  ["Do", "Drink a full glass of water, slowly, like it's the best thing you've had all day."],
  ["Do", "Put on one song you love and move around for its whole length. Nobody is grading."],
  ["Do", "Leave a kind, specific review for a small business you like."],
  ["Do", "Tidy exactly one surface. Stop when it's done."],
  ["Do", "Ask the next person you talk to what the best part of their day was, then listen to the answer."],
  ["Do", "Hold the door a little longer than necessary and smile at whoever comes through."],
  ["Do", "Pay someone a compliment about a choice they made, not how they look."],
  ["Do", "Write down three things that went okay today. Okay counts."],
  ["Do", "Pet a dog, after asking its person first."],
  ["Do", "Unclench your jaw and drop your shoulders. Now do it again."],
  ["Notice", "Find something yellow within sight. Look at it for ten full seconds."],
  ["Notice", "Listen for the farthest sound you can hear, then the closest."],
  ["Notice", "Look at the sky for thirty seconds. What is it doing right now?"],
  ["Notice", "Find the oldest object in the room. Think about everything it has seen."],
  ["Notice", "Feel the temperature of the air on your hands. Is it warm, cool, or somewhere nice in between?"],
  ["Notice", "Pick one thing near you that someone else designed carefully, like a hinge, a handle or a font."],
  ["Notice", "Notice one person nearby doing something small and kind. Most of it goes unseen."],
  ["Thank", "Think of a teacher who changed how you see something. Send them a short thank-you."],
  ["Thank", "Name someone who made your week easier. Tell them today."],
  ["Thank", "Thank a person who does work you usually don't notice: the cleaner, the driver, the person who restocks the shelves."],
  ["Thank", "Think of a friend who stayed in touch when you didn't. Reach out and say so."],
  ["Thank", "Thank your past self for one thing they did that you're benefiting from today."],
  ["Thank", "Call or message a relative and thank them for one thing they taught you."],
  ["Fact", "Sea otters sometimes hold hands while they sleep so they don't drift apart."],
  ["Fact", "Octopuses have three hearts."],
  ["Fact", "A group of flamingos is called a flamboyance."],
  ["Fact", "Wombats produce cube-shaped droppings, which helps them stay put when used as markers."],
  ["Fact", "Botanically, a banana is a berry. A strawberry is not."],
  ["Fact", "Sunlight takes a little over eight minutes to reach Earth. Today's warmth left the Sun before you finished your morning."],
  ["Fact", "Cows form close friendships and show lower stress when they're with their favorite companions."],
  ["Fact", "Honey found in ancient Egyptian tombs was still edible. Properly stored honey barely spoils."],
  ["Fact", "Bumblebees can learn by watching other bees, and have been taught to roll a ball for a sugary reward."]
],
  movement: [
      ["Move", "Stand up and roll your shoulders back ten times, slowly."],
      ["Move", "Take a two-minute walk, even if it is just around the room."],
      ["Move", "Do five slow sit-to-stands from a chair, taking your time on the way down."],
      ["Move", "Stretch whatever feels tightest for thirty seconds, breathing out as you ease in."],
      ["Move", "Stand on one foot while you brush your teeth, then switch."],
      ["Move", "Take the longer route to your next destination."],
      ["Move", "Do ten slow calf raises while you wait for the kettle."],
      ["Move", "March in place for one minute."],
      ["Mindset", "Five minutes is a real session. Showing up counts."],
      ["Mindset", "Progress is rarely a straight line. A flat week is still part of the trend."],
      ["Mindset", "Compare today's effort to your own last month, not to anyone else."],
      ["Mindset", "A smaller version of the plan, done, beats a perfect version skipped."],
      ["Mindset", "Strong is a skill you build one ordinary day at a time."],
      ["Mindset", "You do not have to feel motivated to start. Start, and motivation often follows."],
      ["Habit", "Attach one exercise to something you already do every day, like coffee or brushing your teeth."],
      ["Habit", "Lay out your workout clothes tonight so tomorrow's start is easier."],
      ["Habit", "Put your next session in your calendar now, with a time and a place."],
      ["Habit", "Pick the easiest version of your exercise and do just that tomorrow."],
      ["Habit", "Tell one person when you plan to move today."],
      ["Habit", "Mark a calendar after each session and watch the chain grow."],
      ["Reflect", "What is one thing your body did for you today that you usually take for granted?"],
      ["Reflect", "When did movement last leave you feeling better than when you started? What was it?"],
      ["Reflect", "What is getting in the way this week, and what is the smallest way around it?"],
      ["Reflect", "What would future you thank you for doing in the next ten minutes?"],
      ["Reflect", "Which part of your routine feels easy now that felt hard a month ago?"],
      ["Reflect", "Who or what helps you keep going? How could you lean on it more?"]
    ],
  calm: [
      ["Breathe", "Breathe in for four, out for six. Repeat three times."],
      ["Breathe", "Make your exhale a little slower than your inhale for one minute."],
      ["Breathe", "Rest a hand on your belly and feel it rise and fall for five breaths."],
      ["Ground", "Name five things you can see, four you can touch and three you can hear."],
      ["Ground", "Press your feet into the floor and notice the support under you."],
      ["Ground", "Look at the farthest thing you can see for ten seconds."],
      ["Soften", "Unclench your jaw, drop your shoulders and let your hands go loose."],
      ["Soften", "Tell yourself: this moment will pass, and I can take it one breath at a time."],
      ["Soften", "Take a sip of something warm and notice it all the way down."],
      ["Reset", "Step away from the screen for two minutes."],
      ["Reset", "Write down the one thing that matters most today and set the rest aside."],
      ["Reset", "Open a window and take three slow breaths of fresh air."],
      ["Reset", "Do one thing, then the next. Only the next thing."]
    ],
  nourish: [
      ["Add", "Add one extra vegetable to your next meal, any kind, any way you like it."],
      ["Add", "Put a piece of fruit where you will see it first today."],
      ["Add", "Add something crunchy and fresh to your lunch, like carrot, cucumber or apple."],
      ["Add", "Stir a handful of leafy greens into whatever you are already cooking."],
      ["Add", "Add a protein you enjoy to your next snack, like yogurt, nuts, an egg or hummus."],
      ["Add", "Pick a colour you have not eaten yet today and add it to your plate."],
      ["Add", "Add herbs, a squeeze of lemon or a pinch of spice to something plain. Flavour counts."],
      ["Sip", "Pour a full glass of water and drink it slowly."],
      ["Sip", "Keep a glass or bottle of water within reach for the next hour."],
      ["Sip", "Make a warm herbal tea and drink it while it is still hot."],
      ["Sip", "Drop a slice of lemon, cucumber or a few berries into your water, just for fun."],
      ["Sip", "Finish a glass of water, then notice if anything feels different. Even a little."],
      ["Savour", "Take your first three bites slowly. Notice the taste, the texture, the temperature."],
      ["Savour", "Eat your next meal away from screens, even if only for the first five minutes."],
      ["Savour", "Put your fork down between a few bites and take one slow breath."],
      ["Savour", "Before you eat, pause and ask: what would feel good right now?"],
      ["Savour", "Eat one thing you truly enjoy today, and enjoy it without apology."],
      ["Prep", "Wash and cut some fruit or vegetables today so they are ready to grab."],
      ["Prep", "Pack a snack you like for tomorrow so hunger never catches you off guard."],
      ["Prep", "Plan one meal for tomorrow and write it on a sticky note."],
      ["Prep", "Fill a water bottle tonight and leave it where you will see it in the morning."],
      ["Prep", "Cook a little extra tonight so tomorrow's meal is already done."],
      ["Prep", "Write down three meals you enjoy that you could make with what is at home."],
      ["Feel", "Halfway through your meal, pause and check in. How does your body feel right now?"],
      ["Feel", "An hour after eating, notice your energy and mood. No judging, just noticing."],
      ["Feel", "Think of a meal that left you feeling good. What made it work?"],
      ["Cook", "Yogurt, berries and oats in a bowl. Two minutes.", { time: "2 min", items: ["Plain yogurt", "A handful of berries, fresh or frozen", "A spoonful of oats or granola", "Honey or cinnamon, if you like"], steps: ["Spoon the yogurt into a bowl.", "Top with the berries and oats.", "Finish with honey or cinnamon."] }],
      ["Cook", "Banana toast with peanut butter. Three minutes.", { time: "3 min", items: ["Bread", "Peanut butter, or any nut or seed butter", "A banana", "A pinch of cinnamon"], steps: ["Toast the bread.", "Spread on the peanut butter.", "Slice the banana on top and add cinnamon."] }],
      ["Cook", "A veggie omelette. Ten minutes.", { time: "10 min", items: ["2 eggs", "A handful of chopped vegetables, like peppers, spinach or tomato", "A little oil or butter", "Salt and pepper"], steps: ["Warm the oil in a pan over medium heat and cook the vegetables for 2 minutes.", "Beat the eggs with salt and pepper and pour them over the vegetables.", "Cook until the eggs are fully set, then fold and serve."] }],
      ["Cook", "Chickpea and tomato salad. Five minutes.", { time: "5 min", items: ["1 can of chickpeas, drained and rinsed", "2 tomatoes, chopped", "Half a cucumber, chopped", "Olive oil and lemon juice", "Salt and pepper"], steps: ["Put the chickpeas, tomatoes and cucumber in a bowl.", "Add a drizzle of olive oil, a squeeze of lemon, salt and pepper.", "Toss and eat."] }],
      ["Cook", "Overnight oats. Five minutes tonight, ready tomorrow.", { time: "5 min tonight", items: ["Half a cup of oats", "Half a cup of milk or plant milk", "A spoonful of yogurt", "Fruit to top"], steps: ["Stir the oats, milk and yogurt together in a jar.", "Cover and keep it in the fridge overnight.", "In the morning, add your fruit."] }],
      ["Cook", "Easy soup with extra greens. Ten minutes.", { time: "10 min", items: ["1 carton or can of vegetable soup", "A handful of spinach or kale", "A squeeze of lemon", "Bread, for dipping"], steps: ["Heat the soup in a pot until it is steaming hot.", "Stir in the greens and cook for 1 more minute.", "Add a squeeze of lemon and serve with bread."] }],
      ["Cook", "Hummus and veggie plate. Five minutes.", { time: "5 min", items: ["Hummus", "Carrots, cucumber and peppers", "Crackers or pita"], steps: ["Cut the vegetables into sticks.", "Spoon the hummus onto a plate.", "Dip and enjoy."] }],
      ["Cook", "Beans on toast with greens. Eight minutes.", { time: "8 min", items: ["1 can of beans in tomato sauce", "Bread", "A handful of spinach or other greens", "Black pepper"], steps: ["Heat the beans in a pot or the microwave until steaming hot.", "Toast the bread.", "Pile the beans and greens on the toast and add pepper."] }],
      ["Feel", "Notice what you reach for when you are tired, bored or stressed. Just notice."]
    ],
};
window.SENSEE_DAILY = (function () {
  const IDS = ["everyday", "movement", "calm", "nourish"];
  const EPOCH = Math.floor(Date.UTC(2026, 10, 23) / 864e5);   // first day of the daily feed (23 Nov 2026)
  const plain = c => Array.isArray(c) && typeof c[0] === "string" && typeof c[1] === "string" && !(c[2] && typeof c[2] === "object");
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function base(id) {
    const pool = window.SENSEE_CARDS[id].filter(plain), r = rng(104729 * (IDS.indexOf(id) + 1)), order = pool.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order.map(i => pool[i]);
  }
  const have = {};
  function sequence(id, extras) {
    if (!have[id]) have[id] = base(id);
    const seen = new Set(have[id].map(c => c[1]));
    return have[id].concat((extras || []).filter(c => plain(c) && !seen.has(c[1]) && seen.add(c[1])));
  }
  const dayNumber = date => { const d = date || new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  function cardFor(id, extras, date) { const seq = sequence(id, extras), n = seq.length, k = dayNumber(date) - EPOCH; return seq[((k % n) + n) % n]; }
  /* Fresh days still to come after today, before cards start to repeat. 0 means they already repeat. */
  function daysLeft(id, extras, date) { return Math.max(0, sequence(id, extras).length - 1 - (dayNumber(date) - EPOCH)); }
  return { IDS, cardFor, daysLeft, sequence };
})();
