/**
 * Charlotte's Moto Cat Rush - Main Game Controller & Logic
 * Integrates Player, City Dodge, Grand Prix Racing, Shop, Upgrades & LocalStorage.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.renderer = new Renderer(this.canvas);
    this.city = new CityManager();
    this.race = new RaceManager();

    this.mode = 'city'; // 'city' or 'race'
    this.isPaused = false;

    // Keys State
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      nitro: false
    };

    // Load or initialize Player Progress
    this.playerData = this.loadProgress();

    // Active Player Entity
    this.player = {
      x: this.city.vRoads[2],
      y: this.city.hRoads[2] + 35,
      radius: 18,
      speed: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      steerVisual: 0,
      lives: 3,
      maxLives: 3,
      points: this.playerData.points || 0,
      cash: this.playerData.cash || 0,
      nitro: 100,
      isNitroActive: false,
      invincibleTimer: 0,
      hasActiveShield: false,
      pickupRadius: 36,
      totalProgress: 0,
      vehicle: null,
      pet: null,
      engine: null,
      rpm: 850,
      maxRpm: 6800,
      boostPsi: 0,
      horsePower: 175,
      petBounce: 0,
      magneticTethers: []
    };

    this.wasAccelerating = false;
    this.namingPet = null;

    this.initCatalog();
    this.applyUpgrades();

    // Setup input listeners & UI
    this.setupInputs();
    this.setupUI();

    // Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  // ========================================================
  // CATALOG: VARIETIES OF CARS & UPGRADES
  // ========================================================
  initCatalog() {
    this.vehicles = [
      {
        id: 'veh_moto',
        name: 'Street Moto Cruiser',
        type: 'motorcycle',
        variant: 'moto',
        title: 'Starting Motorcycle',
        desc: 'Your trusty agile motorcycle! Perfect for weaving through tight city traffic and grabbing yellow orbs.',
        color: '#ff477e',
        cost: 0,
        unlocked: true,
        icon: '🏍️',
        perk: 'Agile & Nimble Handling',
        speedMult: 1.0
      },
      {
        id: 'veh_coupe',
        name: 'Neon Drift Coupe',
        type: 'car',
        variant: 'coupe',
        title: 'Street Tuner',
        desc: 'Sleek sports car with custom tuned drift suspension and +15% top speed.',
        color: '#00f076',
        cost: 45,
        unlocked: false,
        icon: '🚗',
        perk: '+15% Top Speed & Sharp Turning',
        speedMult: 1.15
      },
      {
        id: 'veh_muscle',
        name: 'Armored Muscle Car',
        type: 'car',
        variant: 'muscle',
        title: 'Heavy Duty Cruiser',
        desc: 'Heavy reinforced steel bumper! Automatically gives you a protective shield that absorbs 1 crash per life!',
        color: '#3a86ff',
        cost: 85,
        unlocked: false,
        icon: '🚙',
        perk: '🛡️ Crash Shield Every Life',
        speedMult: 1.18,
        hasShield: true
      },
      {
        id: 'veh_gt',
        name: "Charlotte's Turbo GT",
        type: 'car',
        variant: 'gt',
        title: 'Grand Prix Beast',
        desc: "Charlotte's signature high-speed race car! Twin-turbo engine with +35% speed and rapid nitro recharge to dominate races!",
        color: '#ff0055',
        cost: 140,
        unlocked: false,
        icon: '🏎️',
        perk: '🚀 +35% Speed & Rapid Turbo Recharge',
        speedMult: 1.35
      },
      {
        id: 'veh_formula',
        name: 'Formula 1 Lightning',
        type: 'car',
        variant: 'formula',
        title: 'Circuit Champion',
        desc: 'The ultimate Grand Prix race car! Extreme aerodynamic downforce and +50% top speed to easily win 1st place in races!',
        color: '#05d9e8',
        cost: 220,
        unlocked: false,
        icon: '🏁',
        perk: '⚡ +50% Speed & Superior Race Grip',
        speedMult: 1.50
      },
      {
        id: 'veh_golden',
        name: 'Golden Hypercar',
        type: 'car',
        variant: 'golden',
        title: 'Legendary Exotic',
        desc: 'Forged in solid gold! Features an ultra-powerful orb vacuum magnet and doubles your cash per orb to $4!',
        color: '#ffbe0b',
        cost: 320,
        unlocked: false,
        icon: '👑',
        perk: '🟡 Orb Magnet Vacuum & Double Cash ($4/orb!)',
        speedMult: 1.40,
        doubleCash: true,
        superMagnet: true
      }
    ];

    this.upgrades = [
      {
        id: 'upgrade_engine',
        name: 'Engine Tune-Up',
        desc: 'Supercharges acceleration and top speed for city dodging and winning races!',
        level: 1,
        maxLevel: 5,
        baseCost: 30,
        costMult: 1.6,
        icon: '🚀'
      },
      {
        id: 'upgrade_tires',
        name: 'Racing Grip Tires',
        desc: 'Equips sticky racing slicks for tighter cornering and precise dodging around cars.',
        level: 1,
        maxLevel: 4,
        baseCost: 35,
        costMult: 1.7,
        icon: '🛞'
      },
      {
        id: 'upgrade_hearts',
        name: 'Extra Heart Container',
        desc: 'Increases your maximum lives so you can survive more crashes with the 5 cars!',
        level: 1,
        maxLevel: 3, // Gives up to 5 lives
        baseCost: 80,
        costMult: 1.8,
        icon: '❤️'
      },
      {
        id: 'upgrade_nitro',
        name: 'Nitro Boost Tank',
        desc: 'Expands your nitro turbo tank and makes boost recharge even faster!',
        level: 1,
        maxLevel: 4,
        baseCost: 45,
        costMult: 1.6,
        icon: '💨'
      },
      {
        id: 'upgrade_magnet',
        name: 'Golden Orb Magnet',
        desc: 'Supercharges orb collection reach so you pull yellow orbs in effortlessly!',
        level: 1,
        maxLevel: 4,
        baseCost: 40,
        costMult: 1.6,
        icon: '🧲'
      }
    ];

    // ========================================================
    // CHARLOTTE'S 8 PET RARITIES & EGG HATCHERY SYSTEM
    // ========================================================
    this.rarityList = [
      'Common',
      'Uncommon',
      'Rare',
      'Ultra Rare',
      'Legendary',
      'Ultra Legendary',
      'Mythic',
      'Ultra Mythic'
    ];

    this.rarityMeta = {
      'Common': { color: '#b0bec5', weight: 46 },
      'Uncommon': { color: '#00f076', weight: 26 },
      'Rare': { color: '#05d9e8', weight: 14 },
      'Ultra Rare': { color: '#d084fc', weight: 7.5 },
      'Legendary': { color: '#ffc837', weight: 3.8 },
      'Ultra Legendary': { color: '#ff3366', weight: 1.8 },
      'Mythic': { color: '#ff00cc', weight: 0.7 },
      'Ultra Mythic': { color: '#ffe600', weight: 0.2 }
    };

    // Eggs to Buy and Hatch!
    this.eggs = [
      {
        id: 'egg_forest',
        name: 'Forest Egg',
        icon: '🌲',
        eggIcon: '🥚',
        cost: 45,
        cssClass: 'egg-forest',
        desc: 'Enchanted woodland egg! Hatches forest creatures from Squirrels and Owls up to the Spirit Moon Wolf and Ancient Forest Dragon!',
        theme: 'Woodland & Nature'
      },
      {
        id: 'egg_circus',
        name: 'Circus Egg',
        icon: '🎪',
        eggIcon: '🥚',
        cost: 65,
        cssClass: 'egg-circus',
        desc: 'Big top carnival spectacle! Hatches acrobat performers, Jumbo Elephants, Fiery Lions, and the Star Pegasus Unicorn!',
        theme: 'Carnival & Spectacle'
      },
      {
        id: 'egg_city',
        name: 'City Companion Egg',
        icon: '🏙️',
        eggIcon: '🥚',
        cost: 30,
        cssClass: 'egg-city',
        desc: 'Sleek metropolitan pet egg! Hatches trusty dogs, cats, bunnies, and cyber champions including the Solid Gold Robo-Cat!',
        theme: 'Urban Companions'
      },
      {
        id: 'egg_cosmic',
        name: 'Cosmic Galaxy Egg',
        icon: '🌌',
        eggIcon: '🥚',
        cost: 125,
        cssClass: 'egg-cosmic',
        desc: 'Forged from deep space stardust! Hatches celestial astral pets up to the Nebula Phoenix and Infinity Chrono-Dragon!',
        theme: 'Celestial & Galactic'
      }
    ];

    // All Pets across the 4 Eggs and 8 Rarities
    this.pets = [
      // ----------------------------------------------------
      // 🏙️ CITY COMPANION EGG PETS
      // ----------------------------------------------------
      {
        id: 'pet_cat',
        egg: 'egg_city',
        rarity: 'Common',
        name: 'Fluffy Kitty',
        defaultName: 'Mochi',
        customName: 'Mochi',
        icon: '🐱',
        unlocked: true, // Charlotte's free starter companion!
        magnetMult: 1.6,
        color: '#ff758f',
        perk: '🧲 +60% Magnet Pull',
        desc: "Charlotte's adorable fluffy kitten! Rides in your motorcycle sidecar or alongside your car."
      },
      {
        id: 'pet_dog',
        egg: 'egg_city',
        rarity: 'Uncommon',
        name: 'Golden Pup',
        defaultName: 'Daisy',
        customName: 'Daisy',
        icon: '🐶',
        unlocked: false,
        magnetMult: 2.2,
        bonusCashPerOrb: 1,
        color: '#ffc837',
        perk: '🎾 Super Magnet (+120%) & +$1 Cash/Orb',
        desc: 'Loyal puppy! Fetches distant yellow orbs with lightning speed and finds +$1 bonus cash.'
      },
      {
        id: 'pet_bunny',
        egg: 'egg_city',
        rarity: 'Rare',
        name: 'Cosmic Bunny',
        defaultName: 'Starhop',
        customName: 'Starhop',
        icon: '🐰',
        unlocked: false,
        magnetMult: 2.8,
        nitroBonus: 1.35,
        color: '#c77dff',
        perk: '🌟 Gravity Vacuum (+180%) & Fast Nitro',
        desc: 'Starry bunny that vacuums in yellow orbs and recharges your nitro boost 35% faster!'
      },
      {
        id: 'pet_raccoon',
        egg: 'egg_city',
        rarity: 'Ultra Rare',
        name: 'Bandit Raccoon',
        defaultName: 'Sly',
        customName: 'Sly',
        icon: '🦝',
        unlocked: false,
        magnetMult: 3.3,
        bonusCashPerOrb: 1,
        color: '#718096',
        perk: '💰 Coin Swiper (+230%) & +$1 Cash/Orb',
        desc: 'Sneaky urban raccoon with lightning paws that swipes yellow orbs and extra cash!'
      },
      {
        id: 'pet_fox',
        egg: 'egg_city',
        rarity: 'Legendary',
        name: 'Cyber Fox',
        defaultName: 'Flash',
        customName: 'Flash',
        icon: '🦊',
        unlocked: false,
        magnetMult: 4.0,
        speedBonus: 1.10,
        color: '#ff6b35',
        perk: '⚡ Cyber Radar (+300%) & +10% Speed',
        desc: 'High-tech robotic speed fox with a glowing visor! Pulls entire avenues of orbs.'
      },
      {
        id: 'pet_cheetah',
        egg: 'egg_city',
        rarity: 'Ultra Legendary',
        name: 'Neon Cheetah',
        defaultName: 'Dash',
        customName: 'Dash',
        icon: '🐆',
        unlocked: false,
        magnetMult: 4.8,
        speedBonus: 1.18,
        color: '#ffd166',
        perk: '🏎️ Hypersonic Magnet (+380%) & +18% Speed',
        desc: 'The fastest land mammal, tuned with neon street cybernetics for hyper-speed collection!'
      },
      {
        id: 'pet_dragon',
        egg: 'egg_city',
        rarity: 'Mythic',
        name: 'Spark Dragon',
        defaultName: 'Sparky',
        customName: 'Sparky',
        icon: '🐲',
        unlocked: false,
        magnetMult: 5.6,
        shieldSave: true,
        color: '#06d6a0',
        perk: '🔥 Flame Vortex (+460%) & Dragon Shield',
        desc: 'Mythical baby dragon that hovers alongside you, generating an orb vortex and granting a protective crash shield!'
      },
      {
        id: 'pet_goldcat',
        egg: 'egg_city',
        rarity: 'Ultra Mythic',
        name: 'Solid Gold Robo-Cat',
        defaultName: 'Midas',
        customName: 'Midas',
        icon: '👑',
        unlocked: false,
        magnetMult: 6.8,
        doublePoints: true,
        doubleCash: true,
        color: '#ffe600',
        perk: '👑 King Midas Vortex (+580%), 2x PTS & Double Cash!',
        desc: 'Forged from pure golden nanotech! Sucks in all yellow orbs across the screen and multiplies points & money!'
      },

      // ----------------------------------------------------
      // 🌲 FOREST EGG PETS (Charlotte's Forest Egg!)
      // ----------------------------------------------------
      {
        id: 'pet_for_squirrel',
        egg: 'egg_forest',
        rarity: 'Common',
        name: 'Nutty Squirrel',
        defaultName: 'Peanut',
        customName: 'Peanut',
        icon: '🐿️',
        unlocked: false,
        magnetMult: 1.55,
        color: '#c08552',
        perk: '🌰 Acorn Magnet (+55% Reach)',
        desc: 'Cheerful woodland squirrel with a fluffy tail that sniffs out yellow orbs like acorns!'
      },
      {
        id: 'pet_for_hedgehog',
        egg: 'egg_forest',
        rarity: 'Uncommon',
        name: 'Spiky Hedgehog',
        defaultName: 'Pip',
        customName: 'Pip',
        icon: '🦔',
        unlocked: false,
        magnetMult: 2.1,
        color: '#a98467',
        perk: '🦔 Spiky Pull (+110% Reach)',
        desc: 'Cute little spiky critter that curls into a ball and rolls alongside you gathering orbs!'
      },
      {
        id: 'pet_for_owl',
        egg: 'egg_forest',
        rarity: 'Rare',
        name: 'Wise Barn Owl',
        defaultName: 'Hootie',
        customName: 'Hootie',
        icon: '🦉',
        unlocked: false,
        magnetMult: 2.7,
        color: '#6c584c',
        perk: '🦉 Night Vision Magnet (+170% Reach)',
        desc: 'Wide-eyed nocturnal owl that spots yellow orbs from far away with glowing starry vision.'
      },
      {
        id: 'pet_for_fox',
        egg: 'egg_forest',
        rarity: 'Ultra Rare',
        name: 'Amber Forest Fox',
        defaultName: 'Rusty',
        customName: 'Rusty',
        icon: '🦊',
        unlocked: false,
        magnetMult: 3.4,
        speedBonus: 1.06,
        color: '#e76f51',
        perk: '🍂 Woodland Prowler (+240%) & +6% Speed',
        desc: 'Graceful red forest fox that darts between cars and avenues pulling all orbs in its path.'
      },
      {
        id: 'pet_for_stag',
        egg: 'egg_forest',
        rarity: 'Legendary',
        name: 'Golden Forest Stag',
        defaultName: 'Bambi',
        customName: 'Bambi',
        icon: '🦌',
        unlocked: false,
        magnetMult: 4.1,
        bonusCashPerOrb: 1,
        color: '#f4a261',
        perk: '🦌 Majestic Antlers (+310%) & +$1 Cash/Orb',
        desc: 'Magnificent forest stag with glowing golden antlers that channel magnetic forest energy!'
      },
      {
        id: 'pet_for_bear',
        egg: 'egg_forest',
        rarity: 'Ultra Legendary',
        name: 'Grizzly King',
        defaultName: 'Barnaby',
        customName: 'Barnaby',
        icon: '🐻',
        unlocked: false,
        magnetMult: 4.9,
        shieldSave: true,
        color: '#582f0e',
        perk: '🛡️ Grizzly Armor (+390%) & Bear Crash Shield',
        desc: 'Mighty forest guardian bear that vacuums orbs with immense paws and protects you with a crash shield!'
      },
      {
        id: 'pet_for_wolf',
        egg: 'egg_forest',
        rarity: 'Mythic',
        name: 'Spirit Moon Wolf',
        defaultName: 'Luna',
        customName: 'Luna',
        icon: '🐺',
        unlocked: false,
        magnetMult: 5.8,
        doublePoints: true,
        color: '#80ed99',
        perk: '🌕 Lunar Spirit (+480% Reach) & 2x Points/Orb',
        desc: 'Ethereal spirit wolf that howls at the full moon, bending gravity to vacuum orbs and double your points!'
      },
      {
        id: 'pet_for_dragon',
        egg: 'egg_forest',
        rarity: 'Ultra Mythic',
        name: 'Ancient Forest Dragon',
        defaultName: 'Verdant',
        customName: 'Verdant',
        icon: '🌿',
        unlocked: false,
        magnetMult: 7.0,
        doublePoints: true,
        shieldSave: true,
        color: '#38b000',
        perk: '🍃 Ancient Nature Vortex (+600%), 2x PTS & Crash Shield',
        desc: 'The legendary heart of the ancient forest! Enormous swirling nature vortex sweeps all orbs across the screen!'
      },

      // ----------------------------------------------------
      // 🎪 CIRCUS EGG PETS (Charlotte's Circus Egg!)
      // ----------------------------------------------------
      {
        id: 'pet_cir_monkey',
        egg: 'egg_circus',
        rarity: 'Common',
        name: 'Juggling Monkey',
        defaultName: 'Coco',
        customName: 'Coco',
        icon: '🐵',
        unlocked: false,
        magnetMult: 1.6,
        color: '#ffb703',
        perk: '🎪 Juggler Grab (+60% Reach)',
        desc: 'Nimble little circus monkey that juggles colorful rings and snatches nearby yellow orbs!'
      },
      {
        id: 'pet_cir_poodle',
        egg: 'egg_circus',
        rarity: 'Uncommon',
        name: 'Poodle Acrobat',
        defaultName: 'Bella',
        customName: 'Bella',
        icon: '🐩',
        unlocked: false,
        magnetMult: 2.15,
        color: '#ff758f',
        perk: '🎀 Ribbon Twirl (+115% Reach)',
        desc: 'Fashionable circus poodle with pink pom-poms that leaps and twirls to attract orbs!'
      },
      {
        id: 'pet_cir_seal',
        egg: 'egg_circus',
        rarity: 'Rare',
        name: 'Balancing Seal',
        defaultName: 'Flipper',
        customName: 'Flipper',
        icon: '🦭',
        unlocked: false,
        magnetMult: 2.75,
        color: '#00b4d8',
        perk: '🤹 Balance Ball (+175% Reach)',
        desc: 'Playful circus seal balancing a spinning beach ball that magnetically pulls yellow orbs!'
      },
      {
        id: 'pet_cir_tiger',
        egg: 'egg_circus',
        rarity: 'Ultra Rare',
        name: 'Ringmaster Tiger',
        defaultName: 'Rajah',
        customName: 'Rajah',
        icon: '🐯',
        unlocked: false,
        magnetMult: 3.45,
        speedBonus: 1.08,
        color: '#fb8500',
        perk: '🎪 Big Top Prowl (+245%) & +8% Speed',
        desc: 'Majestic Bengal tiger in a circus top hat that roars to pull whole avenues of orbs!'
      },
      {
        id: 'pet_cir_elephant',
        egg: 'egg_circus',
        rarity: 'Legendary',
        name: 'Carnival Jumbo Elephant',
        defaultName: 'Dumbo',
        customName: 'Dumbo',
        icon: '🐘',
        unlocked: false,
        magnetMult: 4.2,
        bonusCashPerOrb: 2,
        color: '#90e0ef',
        perk: '🎺 Trunk Vacuum (+320%) & +$2 Cash/Orb',
        desc: 'Grand circus elephant with a mighty trunk that vacuums yellow orbs from far away and awards +$2 cash per orb!'
      },
      {
        id: 'pet_cir_lion',
        egg: 'egg_circus',
        rarity: 'Ultra Legendary',
        name: 'Fiery Circus Lion',
        defaultName: 'Simba',
        customName: 'Simba',
        icon: '🦁',
        unlocked: false,
        magnetMult: 5.0,
        color: '#e63946',
        perk: '🔥 Ring of Fire (+400% Reach) & Fire Trail',
        desc: 'Leaps through flaming circus rings, igniting a fiery magnetic aura that draws all orbs in a blazing vortex!'
      },
      {
        id: 'pet_cir_harlequin',
        egg: 'egg_circus',
        rarity: 'Mythic',
        name: 'Cosmic Harlequin Cat',
        defaultName: 'Jester',
        customName: 'Jester',
        icon: '🤹',
        unlocked: false,
        magnetMult: 6.0,
        doublePoints: true,
        color: '#9d4edd',
        perk: '🎭 Jester Magic (+500% Reach) & 2x Points/Orb',
        desc: 'Mystical carnival sorcerer cat that juggles glowing cosmic orbs and doubles your score on every pickup!'
      },
      {
        id: 'pet_unicorn',
        egg: 'egg_circus',
        rarity: 'Ultra Mythic',
        name: 'Star Pegasus Unicorn',
        defaultName: 'Twinkle',
        customName: 'Twinkle',
        icon: '🦄',
        unlocked: false,
        magnetMult: 7.2,
        doublePoints: true,
        doubleCash: true,
        color: '#ff477e',
        perk: '🌈 Rainbow Grand Finale (+620%), 2x PTS & Double Cash!',
        desc: 'The magnificent circus grand finale! Winged pegasus unicorn with a radiant rainbow horn that draws orbs across the city!'
      },

      // ----------------------------------------------------
      // 🌌 COSMIC GALAXY EGG PETS
      // ----------------------------------------------------
      {
        id: 'pet_cos_alien',
        egg: 'egg_cosmic',
        rarity: 'Common',
        name: 'Alien Bob',
        defaultName: 'Zorp',
        customName: 'Zorp',
        icon: '👽',
        unlocked: false,
        magnetMult: 1.7,
        color: '#57cc99',
        perk: '🛸 Tractor Beam (+70% Reach)',
        desc: 'Friendly little green alien with an antigravity tractor beam that floats orbs to you.'
      },
      {
        id: 'pet_cos_hamster',
        egg: 'egg_cosmic',
        rarity: 'Uncommon',
        name: 'Cosmo Hamster',
        defaultName: 'Nibbles',
        customName: 'Nibbles',
        icon: '🐹',
        unlocked: false,
        magnetMult: 2.3,
        color: '#ffbe0b',
        perk: '🌌 Gravity Wheel (+130% Reach)',
        desc: 'Runs in an astral hamster wheel that generates a localized gravity pull for yellow orbs.'
      },
      {
        id: 'pet_cos_starbunny',
        egg: 'egg_cosmic',
        rarity: 'Rare',
        name: 'Astro Orbit Bunny',
        defaultName: 'Orbit',
        customName: 'Orbit',
        icon: '🪐',
        unlocked: false,
        magnetMult: 2.9,
        nitroBonus: 1.4,
        color: '#b5179e',
        perk: '🪐 Planetary Rings (+190%) & +40% Nitro',
        desc: 'Rides in a personal planetary orbit ring, vacuuming orbs and rapidly recharging turbo boost.'
      },
      {
        id: 'pet_cos_fox',
        egg: 'egg_cosmic',
        rarity: 'Ultra Rare',
        name: 'Comet Fox',
        defaultName: 'Nova',
        customName: 'Nova',
        icon: '☄️',
        unlocked: false,
        magnetMult: 3.6,
        speedBonus: 1.10,
        color: '#3a0ca3',
        perk: '☄️ Meteor Trail (+260%) & +10% Speed',
        desc: 'Blazing interstellar fox with a trail of stardust that pulls orbs at hypersonic speeds.'
      },
      {
        id: 'pet_cos_pup',
        egg: 'egg_cosmic',
        rarity: 'Legendary',
        name: 'Galactic Rocket Pup',
        defaultName: 'Astro',
        customName: 'Astro',
        icon: '🚀',
        unlocked: false,
        magnetMult: 4.3,
        bonusCashPerOrb: 2,
        color: '#4cc9f0',
        perk: '🚀 Rocket Booster (+330%) & +$2 Cash/Orb',
        desc: 'Astronaut puppy with twin jet thrusters that fetches orbs at rocket speed and digs up galactic cash!'
      },
      {
        id: 'pet_cos_dragon',
        egg: 'egg_cosmic',
        rarity: 'Ultra Legendary',
        name: 'Saturn Rings Dragon',
        defaultName: 'Cosmo',
        customName: 'Cosmo',
        icon: '💫',
        unlocked: false,
        magnetMult: 5.2,
        shieldSave: true,
        color: '#7209b7',
        perk: '🪐 Cosmic Ward (+420%) & Space Dragon Shield',
        desc: "Majestic space dragon crowned with Saturn's rings that bends gravitational fields to vacuum orbs and protect your car!"
      },
      {
        id: 'pet_cos_phoenix',
        egg: 'egg_cosmic',
        rarity: 'Mythic',
        name: 'Nebula Phoenix',
        defaultName: 'Solaria',
        customName: 'Solaria',
        icon: '🌌',
        unlocked: false,
        magnetMult: 6.2,
        doublePoints: true,
        color: '#f72585',
        perk: '✨ Supernova Vortex (+520% Reach) & 2x Points/Orb',
        desc: 'Blazing cosmic firebird born from a dying star that creates a magnetic gravitational vortex and doubles your score!'
      },
      {
        id: 'pet_cos_chrono',
        egg: 'egg_cosmic',
        rarity: 'Ultra Mythic',
        name: 'Infinity Chrono-Dragon',
        defaultName: 'Chronos',
        customName: 'Chronos',
        icon: '🔮',
        unlocked: false,
        magnetMult: 7.5,
        doublePoints: true,
        doubleCash: true,
        shieldSave: true,
        color: '#ffe600',
        perk: '⌛ Omnipotent Time Vortex (+650%), 2x PTS, 2x Cash & Shield!',
        desc: 'The ultimate cosmic time lord dragon! Bends space and time so all yellow orbs across the entire universe instantly teleport to Charlotte!'
      }
    ];

    // Assign rarityColor to each pet
    this.pets.forEach(p => {
      p.rarityColor = this.rarityMeta[p.rarity] ? this.rarityMeta[p.rarity].color : '#ffc837';
    });

    // ========================================================
    // COMPLEX ENGINES CATALOG (Charlotte's Engine Bay!)
    // ========================================================
    this.engines = [
      {
        id: 'eng_stock',
        name: 'Eco Twin-Cam 4-Cylinder',
        type: 'Inline-4 DOHC',
        hp: 175,
        rpmMax: 6800,
        boostPsi: 0,
        soundType: 'stock',
        cost: 0,
        unlocked: true,
        accelMult: 1.0,
        topSpeedMult: 1.0,
        icon: '⚙️',
        perk: 'Smooth & Reliable Cruiser',
        desc: 'The stock factory engine. Reliable, smooth, and lightweight for everyday city cruising and orb gathering.'
      },
      {
        id: 'eng_turbo_boxer',
        name: 'Twin-Scroll Turbo Boxer',
        type: 'Flat-4 Turbocharged',
        hp: 380,
        rpmMax: 8200,
        boostPsi: 14,
        soundType: 'turbo',
        cost: 85,
        unlocked: false,
        accelMult: 1.25,
        topSpeedMult: 1.15,
        icon: '🌪️',
        perk: '+25% Accel & Whistling Blow-Off Valve',
        desc: 'High-revving horizontally opposed turbo engine! Spools boost quickly with a crisp blow-off valve release on throttle lift.'
      },
      {
        id: 'eng_v8_muscle',
        name: 'Supercharged 6.2L V8 Monster',
        type: 'V8 Supercharged Crossplane',
        hp: 680,
        rpmMax: 7600,
        boostPsi: 18,
        soundType: 'v8',
        cost: 175,
        unlocked: false,
        accelMult: 1.50,
        topSpeedMult: 1.25,
        icon: '💥',
        perk: '+50% Accel & Roaring V8 Rumble',
        desc: 'Massive American displacement! Unlocks immense low-end torque, fiery exhaust pulses, and tire-smoking burnout launches.'
      },
      {
        id: 'eng_electric_quantum',
        name: 'Quantum Dual-Drive Hyper-Electric',
        type: 'Dual High-Flux Plasma Motors',
        hp: 950,
        rpmMax: 18000,
        boostPsi: 24,
        soundType: 'electric',
        cost: 290,
        unlocked: false,
        accelMult: 1.70,
        topSpeedMult: 1.35,
        icon: '⚡',
        perk: '+70% Accel & Instant Zero-Lag Launch',
        desc: 'Instant zero-lag electromagnetic torque! High-frequency sci-fi turbine whine that catapults you instantly past competitors.'
      },
      {
        id: 'eng_v12_grandprix',
        name: "Charlotte's V12 Grand Prix Beast",
        type: '6.0L Quad-Cam Twin-Turbo V12',
        hp: 1350,
        rpmMax: 12500,
        boostPsi: 32,
        soundType: 'v12',
        cost: 460,
        unlocked: false,
        accelMult: 1.95,
        topSpeedMult: 1.50,
        icon: '🚀',
        perk: '+95% Accel, +50% Speed & Spits Flames!',
        desc: 'The pinnacle of motorsport engineering! Screaming F1 exhaust acoustics, spitting backfire exhaust flames, and pure race dominance.'
      }
    ];

    // ========================================================
    // ENGINE COMPONENT TUNING MODULES
    // ========================================================
    this.engineParts = [
      {
        id: 'part_turbo',
        name: 'Wastegate & Boost PSI',
        icon: '🌀',
        desc: 'Upgrades turbine compressor wheels to pack high manifold boost pressure for extreme top speeds!',
        level: 1,
        maxLevel: 5,
        baseCost: 35,
        costMult: 1.6,
        statName: 'Boost',
        statGain: '+3 PSI'
      },
      {
        id: 'part_intercooler',
        name: 'Cryogenic Intercooler',
        icon: '❄️',
        desc: 'Chills compressed air for a denser fuel charge, increasing nitro capacity and recharging turbo boost +30% faster!',
        level: 1,
        maxLevel: 4,
        baseCost: 30,
        costMult: 1.6,
        statName: 'Cooling',
        statGain: '+30% Nitro'
      },
      {
        id: 'part_ecu',
        name: 'Pro Racing ECU Chip',
        icon: '💻',
        desc: 'Custom ignition timing remap that raises redline rev limit by +500 RPM per level and sharpens throttle response!',
        level: 1,
        maxLevel: 4,
        baseCost: 45,
        costMult: 1.7,
        statName: 'Rev Limit',
        statGain: '+500 RPM'
      },
      {
        id: 'part_exhaust',
        name: 'Titanium Quad Exhaust',
        icon: '🔥',
        desc: 'Lightweight titanium exhaust headers that eliminate backpressure and add +45 Horsepower!',
        level: 1,
        maxLevel: 4,
        baseCost: 40,
        costMult: 1.6,
        statName: 'Power',
        statGain: '+45 HP'
      }
    ];

    // Restore saved unlocks & levels
    if (this.playerData.unlockedVehicles) {
      this.vehicles.forEach(v => {
        if (this.playerData.unlockedVehicles.includes(v.id)) v.unlocked = true;
      });
    }
    if (this.playerData.upgradeLevels) {
      this.upgrades.forEach(u => {
        if (this.playerData.upgradeLevels[u.id]) u.level = this.playerData.upgradeLevels[u.id];
      });
    }

    // Restore Pets & Custom Names
    if (this.playerData.unlockedPets) {
      this.pets.forEach(p => {
        if (this.playerData.unlockedPets.includes(p.id)) p.unlocked = true;
      });
    }
    if (this.playerData.petNames) {
      this.pets.forEach(p => {
        if (this.playerData.petNames[p.id]) p.customName = this.playerData.petNames[p.id];
      });
    }

    // Restore Engines & Part Levels
    if (this.playerData.unlockedEngines) {
      this.engines.forEach(e => {
        if (this.playerData.unlockedEngines.includes(e.id)) e.unlocked = true;
      });
    }
    if (this.playerData.enginePartLevels) {
      this.engineParts.forEach(ep => {
        if (this.playerData.enginePartLevels[ep.id]) ep.level = this.playerData.enginePartLevels[ep.id];
      });
    }

    // Set active Vehicle, Pet, and Engine
    const activeVehId = this.playerData.activeVehId || 'veh_moto';
    this.player.vehicle = this.vehicles.find(v => v.id === activeVehId) || this.vehicles[0];

    const activePetId = this.playerData.activePetId || 'pet_cat';
    this.player.pet = this.pets.find(p => p.id === activePetId) || this.pets[0];

    const activeEngineId = this.playerData.activeEngineId || 'eng_stock';
    this.player.engine = this.engines.find(e => e.id === activeEngineId) || this.engines[0];
  }

  applyUpgrades() {
    const engineLvl = this.getUpgradeLevel('upgrade_engine');
    const tireLvl = this.getUpgradeLevel('upgrade_tires');
    const heartLvl = this.getUpgradeLevel('upgrade_hearts');
    const magnetLvl = this.getUpgradeLevel('upgrade_magnet');

    // Engine Component Tuning Levels
    const turboLvl = this.getEnginePartLevel('part_turbo');
    const intercoolerLvl = this.getEnginePartLevel('part_intercooler');
    const ecuLvl = this.getEnginePartLevel('part_ecu');
    const exhaustLvl = this.getEnginePartLevel('part_exhaust');

    // Max Lives: 3 base + (heartLvl - 1)
    this.player.maxLives = 3 + (heartLvl - 1);
    this.player.lives = this.player.maxLives;

    // Complex Engine & Tuning Stats
    const eng = this.player.engine || this.engines[0];
    const baseHp = eng.hp || 175;
    const hpBonus = (turboLvl - 1) * 25 + (ecuLvl - 1) * 30 + (exhaustLvl - 1) * 45;
    this.player.horsePower = baseHp + hpBonus;

    this.player.maxRpm = (eng.rpmMax || 6800) + (ecuLvl - 1) * 500;
    this.player.boostPsi = (eng.boostPsi || 0) + (turboLvl - 1) * 3;

    // Multipliers
    const vehSpeedMult = this.player.vehicle ? (this.player.vehicle.speedMult || 1.0) : 1.0;
    const engSpeedMult = eng.topSpeedMult || 1.0;
    const engAccelMult = eng.accelMult || 1.0;

    // Pet Perks
    const pet = this.player.pet;
    const petSpeedMult = (pet && pet.speedBonus) ? pet.speedBonus : 1.0;
    const petMagnetMult = pet ? (pet.magnetMult || 1.0) : 1.0;

    // Top Speed & Acceleration adjusted by selected vehicle, complex engine & tuning
    this.player.topSpeed = (6.0 + (engineLvl - 1) * 1.1) * vehSpeedMult * engSpeedMult * petSpeedMult;
    this.player.accel = (0.28 + (engineLvl - 1) * 0.06) * engAccelMult;

    // Handling & Grippiness
    this.player.turnSpeed = 0.058 + (tireLvl - 1) * 0.012;

    // Magnet Reach (enhanced if Golden Hypercar equipped and boosted by Charlotte's Pets!)
    const vehMagnetBonus = (this.player.vehicle && this.player.vehicle.superMagnet) ? 95 : 0;
    this.player.pickupRadius = (38 + (magnetLvl - 1) * 22 + vehMagnetBonus) * petMagnetMult;

    // Protective Shield Check (Armored Car OR Spark Dragon Pet!)
    if ((this.player.vehicle && this.player.vehicle.hasShield) || (pet && pet.shieldSave)) {
      this.player.hasActiveShield = true;
    } else {
      this.player.hasActiveShield = false;
    }
  }

  getUpgradeLevel(id) {
    const u = this.upgrades.find(up => up.id === id);
    return u ? u.level : 1;
  }

  getEnginePartLevel(id) {
    const p = this.engineParts.find(part => part.id === id);
    return p ? p.level : 1;
  }

  // ========================================================
  // INPUT SYSTEM (KEYBOARD & TOUCH)
  // ========================================================
  setupInputs() {
    window.addEventListener('keydown', e => {
      audio.init();

      // Hotkeys
      if (e.code === 'KeyS' && !this.isModalOpen()) {
        this.openShopModal();
        return;
      }
      if (e.code === 'KeyR' && !this.isModalOpen()) {
        this.openRaceModal();
        return;
      }
      if (e.code === 'KeyM') {
        const isMuted = audio.toggleMute();
        this.updateSoundIcon(isMuted);
        return;
      }
      if (e.code === 'KeyF' && this.mode === 'race') {
        this.race.resetPlayerToTrack(this.player);
        this.showToast('🏎️ Reset to Track!');
        return;
      }
      if (e.code === 'Escape') {
        this.closeAllModals();
        return;
      }

      // Movement
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') {
        this.keys.nitro = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'Space') this.keys.nitro = false;
    });

    // Touch controls setup (mobile / tablet friendly)
    const touchUp = document.getElementById('btn-touch-up');
    const touchDown = document.getElementById('btn-touch-down');
    const touchLeft = document.getElementById('btn-touch-left');
    const touchRight = document.getElementById('btn-touch-right');
    const touchNitro = document.getElementById('btn-touch-nitro');

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const touchContainer = document.getElementById('touch-controls');
      if (touchContainer) touchContainer.style.display = 'flex';
    }

    const bindTouch = (el, key) => {
      if (!el) return;
      el.addEventListener('pointerdown', e => {
        audio.init();
        this.keys[key] = true;
        e.preventDefault();
      });
      el.addEventListener('pointerup', () => { this.keys[key] = false; });
      el.addEventListener('pointercancel', () => { this.keys[key] = false; });
      el.addEventListener('pointerleave', () => { this.keys[key] = false; });
    };

    bindTouch(touchUp, 'up');
    bindTouch(touchDown, 'down');
    bindTouch(touchLeft, 'left');
    bindTouch(touchRight, 'right');
    bindTouch(touchNitro, 'nitro');
  }

  // ========================================================
  // UI & MODALS INTERACTION
  // ========================================================
  setupUI() {
    // Sound Button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        audio.init();
        const isMuted = audio.toggleMute();
        this.updateSoundIcon(isMuted);
      });
    }
    this.updateSoundIcon(audio.muted);

    // Help Button & Modal
    const btnHelp = document.getElementById('btn-help');
    const helpModal = document.getElementById('help-modal');
    const btnCloseHelp = document.getElementById('btn-close-help');
    const btnGotIt = document.getElementById('btn-got-it');

    btnHelp.addEventListener('click', () => {
      audio.init();
      helpModal.classList.add('active');
      this.isPaused = true;
    });
    btnCloseHelp.addEventListener('click', () => {
      helpModal.classList.remove('active');
      this.isPaused = false;
    });
    btnGotIt.addEventListener('click', () => {
      helpModal.classList.remove('active');
      this.isPaused = false;
    });

    // Shop Button & Modal
    const btnOpenShop = document.getElementById('btn-open-shop');
    const shopModal = document.getElementById('shop-modal');
    const btnCloseShop = document.getElementById('btn-close-shop');
    const hudCarBtn = document.getElementById('hud-car-btn');
    const hudPetBtn = document.getElementById('hud-pet-btn');
    const hudEngineBtn = document.getElementById('hud-engine-btn');

    btnOpenShop.addEventListener('click', () => {
      audio.init();
      this.openShopModal();
    });
    if (hudCarBtn) {
      hudCarBtn.addEventListener('click', () => {
        audio.init();
        this.openShopModal('tab-cars');
      });
    }
    if (hudPetBtn) {
      hudPetBtn.addEventListener('click', () => {
        audio.init();
        this.openShopModal('tab-pets');
      });
    }
    if (hudEngineBtn) {
      hudEngineBtn.addEventListener('click', () => {
        audio.init();
        this.openShopModal('tab-engines');
      });
    }
    btnCloseShop.addEventListener('click', () => {
      shopModal.classList.remove('active');
      this.isPaused = false;
    });

    // Points to Money Converter Button (1 Point = $2)
    const btnConvert = document.getElementById('btn-convert-points');
    btnConvert.addEventListener('click', () => {
      if (this.player.points > 0) {
        audio.playPurchase();
        const addedCash = this.player.points * 2;
        this.player.cash += addedCash;
        this.showToast(`Converted ${this.player.points} Points into +$${addedCash} Cash! 💰`);
        this.player.points = 0;
        this.saveProgress();
        this.updateHUD();
        this.renderShop();
      } else {
        this.showToast("Collect more yellow orbs to get points! 🟡");
      }
    });

    // Shop Tabs (Car Dealership, Pets & Naming, Complex Engines, Upgrades)
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');

        document.querySelectorAll('.tab-content').forEach(tc => {
          if (tc.id === targetTab) {
            tc.style.display = (targetTab === 'tab-engines' || targetTab === 'tab-pets') ? 'block' : 'grid';
          } else {
            tc.style.display = 'none';
          }
        });
      });
    });

    // Pet Sub-Navigation (Egg Hatchery vs My Pet Collection)
    const btnSubEggs = document.getElementById('btn-subnav-eggs');
    const btnSubPets = document.getElementById('btn-subnav-pets');
    const viewEggs = document.getElementById('pets-view-eggs');
    const viewCollection = document.getElementById('pets-view-collection');

    if (btnSubEggs && btnSubPets) {
      btnSubEggs.addEventListener('click', () => {
        btnSubEggs.classList.add('active');
        btnSubPets.classList.remove('active');
        if (viewEggs) viewEggs.style.display = 'grid';
        if (viewCollection) viewCollection.style.display = 'none';
      });
      btnSubPets.addEventListener('click', () => {
        btnSubPets.classList.add('active');
        btnSubEggs.classList.remove('active');
        if (viewEggs) viewEggs.style.display = 'none';
        if (viewCollection) viewCollection.style.display = 'grid';
      });
    }

    // Egg Hatching Modal Listeners (Charlotte's Egg Cracking Ceremony!)
    const btnCloseHatchModal = document.getElementById('btn-close-hatch-modal');
    const btnTapCrack = document.getElementById('btn-tap-crack');
    const eggContainer = document.getElementById('hatch-egg-container');
    const btnHatchRandomName = document.getElementById('btn-hatch-random-name');
    const inputHatchName = document.getElementById('input-hatch-name');
    const btnConfirmHatch = document.getElementById('btn-confirm-hatch');
    const eggHatchModal = document.getElementById('egg-hatch-modal');

    if (btnCloseHatchModal) {
      btnCloseHatchModal.addEventListener('click', () => {
        eggHatchModal.classList.remove('active');
      });
    }
    if (btnTapCrack) {
      btnTapCrack.addEventListener('click', () => {
        this.crackEggStep();
      });
    }
    if (eggContainer) {
      eggContainer.addEventListener('click', () => {
        this.crackEggStep();
      });
    }
    if (btnHatchRandomName) {
      btnHatchRandomName.addEventListener('click', () => {
        if (inputHatchName) inputHatchName.value = this.getRandomPetName();
      });
    }
    if (btnConfirmHatch) {
      btnConfirmHatch.addEventListener('click', () => {
        this.confirmHatchedPet();
      });
    }
    if (inputHatchName) {
      inputHatchName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.confirmHatchedPet();
        }
      });
    }

    // Pet Naming Modal Buttons (Charlotte can name her pets!)
    const btnCloseNameModal = document.getElementById('btn-close-name-modal');
    const btnCancelPetName = document.getElementById('btn-cancel-pet-name');
    const btnSavePetName = document.getElementById('btn-save-pet-name');
    const btnRandomName = document.getElementById('btn-random-name');
    const inputPetName = document.getElementById('input-pet-name');
    const petNameModal = document.getElementById('pet-name-modal');

    if (btnCloseNameModal) {
      btnCloseNameModal.addEventListener('click', () => {
        petNameModal.classList.remove('active');
      });
    }
    if (btnCancelPetName) {
      btnCancelPetName.addEventListener('click', () => {
        petNameModal.classList.remove('active');
      });
    }
    if (btnSavePetName) {
      btnSavePetName.addEventListener('click', () => {
        this.savePetName();
      });
    }
    if (btnRandomName) {
      btnRandomName.addEventListener('click', () => {
        if (inputPetName) inputPetName.value = this.getRandomPetName();
      });
    }
    if (inputPetName) {
      inputPetName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.savePetName();
        }
      });
    }

    // Grand Prix Race Modal
    const btnToggleRace = document.getElementById('btn-toggle-race');
    const raceModal = document.getElementById('race-modal');
    const btnCloseRace = document.getElementById('btn-close-race');
    const btnStartRace = document.getElementById('btn-start-race');
    const btnCancelRace = document.getElementById('btn-cancel-race');

    btnToggleRace.addEventListener('click', () => {
      audio.init();
      if (this.mode === 'race') {
        this.switchMode('city');
      } else {
        this.openRaceModal();
      }
    });
    btnCloseRace.addEventListener('click', () => {
      raceModal.classList.remove('active');
      this.isPaused = false;
    });
    btnCancelRace.addEventListener('click', () => {
      raceModal.classList.remove('active');
      this.isPaused = false;
    });
    btnStartRace.addEventListener('click', () => {
      raceModal.classList.remove('active');
      this.isPaused = false;
      this.switchMode('race');
    });

    // Reset to Track button during Grand Prix
    const btnResetTrack = document.getElementById('btn-reset-track');
    if (btnResetTrack) {
      btnResetTrack.addEventListener('click', () => {
        if (this.mode === 'race') {
          audio.init();
          this.race.resetPlayerToTrack(this.player);
          this.showToast('🏎️ Reset to Track!');
        }
      });
    }

    // Race Results Modal Buttons
    const btnRaceAgain = document.getElementById('btn-race-again');
    const btnRaceToCity = document.getElementById('btn-race-to-city');
    const resultsModal = document.getElementById('results-modal');

    btnRaceAgain.addEventListener('click', () => {
      resultsModal.classList.remove('active');
      this.race.startRace(this.player);
    });
    btnRaceToCity.addEventListener('click', () => {
      resultsModal.classList.remove('active');
      this.switchMode('city');
    });

    // Game Over Modal Buttons
    const btnRespawn = document.getElementById('btn-respawn');
    const btnGameOverShop = document.getElementById('btn-gameover-shop');
    const gameoverModal = document.getElementById('gameover-modal');

    btnRespawn.addEventListener('click', () => {
      gameoverModal.classList.remove('active');
      this.respawnPlayer();
    });
    btnGameOverShop.addEventListener('click', () => {
      gameoverModal.classList.remove('active');
      this.openShopModal();
    });

    this.updateHUD();
  }

  openShopModal(tabId = null) {
    this.isPaused = true;
    this.renderShop();
    const modal = document.getElementById('shop-modal');
    modal.classList.add('active');

    if (tabId) {
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      if (tabBtn) tabBtn.click();
    }
  }

  openRaceModal() {
    this.isPaused = true;
    const modal = document.getElementById('race-modal');
    modal.classList.add('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    this.isPaused = false;
  }

  isModalOpen() {
    return document.querySelector('.modal-overlay.active') !== null;
  }

  switchMode(newMode) {
    this.mode = newMode;
    const raceHud = document.getElementById('race-hud');
    const btnRace = document.getElementById('btn-toggle-race');

    if (newMode === 'race') {
      this.race.startRace(this.player);
      if (raceHud) raceHud.style.display = 'flex';
      if (btnRace) btnRace.innerHTML = '<span>🏙️</span> CITY DODGE';
      this.showToast('🏁 Grand Prix Race Started! Beat the 5 Cars!');
    } else {
      this.race.active = false;
      this.player.x = this.city.vRoads[2];
      this.player.y = this.city.hRoads[2] + 35;
      this.player.speed = 0;
      this.player.angle = 0;
      if (raceHud) raceHud.style.display = 'none';
      if (btnRace) btnRace.innerHTML = '<span>🏁</span> GRAND PRIX';
      this.showToast('🏙️ Back in the City! Dodge cars and grab yellow orbs!');
    }
    this.updateHUD();
  }

  // ========================================================
  // RENDER SHOP ITEMS & HANDLERS
  // ========================================================
  renderShop() {
    document.getElementById('shop-points-display').textContent = this.player.points;
    document.getElementById('shop-cash-display').textContent = `$${this.player.cash}`;

    // Render Tab 1: Varieties of Cars
    const carsContainer = document.getElementById('tab-cars');
    if (carsContainer) {
      carsContainer.innerHTML = '';
      this.vehicles.forEach(veh => {
        const isEquipped = this.player.vehicle && this.player.vehicle.id === veh.id;
        const card = document.createElement('div');
        card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;

        card.innerHTML = `
          ${isEquipped ? '<div class="shop-card-badge">Selected</div>' : (veh.unlocked ? '<div class="shop-card-badge" style="background:#05d9e8;">Owned</div>' : '')}
          <div class="shop-card-icon">${veh.icon}</div>
          <div class="shop-card-title">${veh.name}</div>
          <div style="font-size:0.75rem; color:#ffc837; text-align:center; font-weight:700;">${veh.perk}</div>
          <div class="shop-card-desc">${veh.desc}</div>
          ${
            isEquipped
              ? `<button class="btn-equip active" disabled>Currently Driving 🏎️</button>`
              : veh.unlocked
              ? `<button class="btn-equip" data-equip-veh="${veh.id}">Drive Vehicle 🔑</button>`
              : `<button class="btn-buy" data-buy-veh="${veh.id}" ${this.player.cash < veh.cost ? 'disabled' : ''}>Buy for $${veh.cost} 💵</button>`
          }
        `;
        carsContainer.appendChild(card);
      });

      carsContainer.querySelectorAll('[data-buy-veh]').forEach(btn => {
        btn.addEventListener('click', e => {
          const vehId = e.currentTarget.getAttribute('data-buy-veh');
          this.buyVehicle(vehId);
        });
      });
      carsContainer.querySelectorAll('[data-equip-veh]').forEach(btn => {
        btn.addEventListener('click', e => {
          const vehId = e.currentTarget.getAttribute('data-equip-veh');
          this.equipVehicle(vehId);
        });
      });
    }

    // Render Tab 2: Charlotte's Pets & Naming
    this.renderShopPets();

    // Render Tab 3: Complex Engines & Tuning Bay
    this.renderShopEngines();

    // Render Tab 4: Performance Upgrades
    const upgradesContainer = document.getElementById('tab-upgrades');
    if (upgradesContainer) {
      upgradesContainer.innerHTML = '';
      this.upgrades.forEach(up => {
        const isMax = up.level >= up.maxLevel;
        const nextCost = Math.round(up.baseCost * Math.pow(up.costMult, up.level - 1));
        const card = document.createElement('div');
        card.className = 'shop-card';

        card.innerHTML = `
          <div class="shop-card-icon">${up.icon}</div>
          <div class="shop-card-title">${up.name}</div>
          <div class="shop-card-level">Level ${up.level} / ${up.maxLevel}</div>
          <div class="shop-card-desc">${up.desc}</div>
          ${
            isMax
              ? `<button class="btn-buy" disabled style="background:rgba(255,255,255,0.1); color:#ffc837;">MAX LEVEL 🏆</button>`
              : `<button class="btn-buy" data-buy-upgrade="${up.id}" ${this.player.cash < nextCost ? 'disabled' : ''}>Upgrade ($${nextCost}) ⚡</button>`
          }
        `;
        upgradesContainer.appendChild(card);
      });

      upgradesContainer.querySelectorAll('[data-buy-upgrade]').forEach(btn => {
        btn.addEventListener('click', e => {
          const upId = e.currentTarget.getAttribute('data-buy-upgrade');
          this.buyUpgrade(upId);
        });
      });
    }
  }

  // Render Charlotte's Pets & Naming Tab
  renderShopPets() {
    // 1. Render Egg Hatchery View
    const eggsGrid = document.getElementById('pets-view-eggs');
    if (eggsGrid) {
      eggsGrid.innerHTML = '';
      this.eggs.forEach(egg => {
        const eggPets = this.pets.filter(p => p.egg === egg.id);
        const card = document.createElement('div');
        card.className = 'shop-card';

        // Build preview of rarities inside this egg
        let previewHtml = '<div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin:6px 0;">';
        this.rarityList.forEach(r => {
          const count = eggPets.filter(p => p.rarity === r).length;
          if (count > 0) {
            const rClass = `rarity-${r.replace(/\s+/g, '')}`;
            previewHtml += `<span class="rarity-pill ${rClass}">${r}</span>`;
          }
        });
        previewHtml += '</div>';

        card.innerHTML = `
          <div class="egg-shell-icon ${egg.cssClass}">${egg.icon}</div>
          <div class="shop-card-title">${egg.name}</div>
          <div style="font-size:0.75rem; color:#ffc837; text-align:center; font-weight:700;">${egg.theme}</div>
          ${previewHtml}
          <div class="shop-card-desc">${egg.desc}</div>
          <button class="btn-buy" data-hatch-egg="${egg.id}" ${this.player.cash < egg.cost ? 'disabled' : ''}>
            Hatch Egg for $${egg.cost} 🥚
          </button>
        `;
        eggsGrid.appendChild(card);
      });

      eggsGrid.querySelectorAll('[data-hatch-egg]').forEach(btn => {
        btn.addEventListener('click', e => {
          const eggId = e.currentTarget.getAttribute('data-hatch-egg');
          this.startHatchEgg(eggId);
        });
      });
    }

    // 2. Render Pet Collection View
    const collectionGrid = document.getElementById('pets-view-collection');
    const petCountDisplay = document.getElementById('pet-count-display');
    const unlockedPets = this.pets.filter(p => p.unlocked);

    if (petCountDisplay) petCountDisplay.textContent = unlockedPets.length;

    if (collectionGrid) {
      collectionGrid.innerHTML = '';
      if (unlockedPets.length === 0) {
        collectionGrid.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">
            <h3>No pets hatched yet!</h3>
            <p>Go to the <strong>🥚 Egg Hatchery</strong> tab to hatch your first egg!</p>
          </div>
        `;
      } else {
        unlockedPets.forEach(pet => {
          const isEquipped = this.player.pet && this.player.pet.id === pet.id;
          const petName = pet.customName || pet.defaultName || pet.name;
          const rClass = `rarity-${pet.rarity.replace(/\s+/g, '')}`;
          const card = document.createElement('div');
          card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;

          card.innerHTML = `
            ${isEquipped ? '<div class="shop-card-badge">Accompanying 🐾</div>' : ''}
            <div style="text-align:center; margin-bottom:4px;"><span class="rarity-pill ${rClass}">${pet.rarity}</span></div>
            <div class="shop-card-icon" style="box-shadow:0 0 16px ${pet.color}35; border-color:${pet.color}60;">${pet.icon}</div>
            <div class="shop-card-title">${petName}</div>
            <div style="font-size:0.75rem; color:#d084fc; text-align:center; font-weight:700;">${pet.name} (${pet.perk})</div>
            <div class="shop-card-desc">${pet.desc}</div>
            <div class="pet-card-actions">
              ${
                isEquipped
                  ? `<button class="btn-equip active" disabled>With You ❤️</button>`
                  : `<button class="btn-equip" data-equip-pet="${pet.id}">Accompany Me 🐾</button>`
              }
              <button class="btn-rename" data-rename-pet="${pet.id}" title="Rename this Pet!">✏️ Name</button>
            </div>
          `;
          collectionGrid.appendChild(card);
        });

        collectionGrid.querySelectorAll('[data-equip-pet]').forEach(btn => {
          btn.addEventListener('click', e => {
            const petId = e.currentTarget.getAttribute('data-equip-pet');
            this.equipPet(petId);
          });
        });
        collectionGrid.querySelectorAll('[data-rename-pet]').forEach(btn => {
          btn.addEventListener('click', e => {
            const petId = e.currentTarget.getAttribute('data-rename-pet');
            this.openPetNameModal(petId);
          });
        });
      }
    }
  }

  // ========================================================
  // EGG HATCHING CEREMONY (Charlotte's Egg Cracking!)
  // ========================================================
  startHatchEgg(eggId) {
    const egg = this.eggs.find(e => e.id === eggId);
    if (!egg) return;

    if (this.player.cash < egg.cost) {
      this.showToast(`You need $${egg.cost} to hatch this egg! Collect orbs to earn cash! 🟡💵`);
      return;
    }

    // Deduct cash and play purchase sound
    this.player.cash -= egg.cost;
    audio.playPurchase();
    this.saveProgress();
    this.updateHUD();
    this.renderShop();

    // Select random pet based on Charlotte's 8 Rarities!
    const hatchedPet = this.selectRandomPetFromEgg(egg.id);
    this.hatchingPet = hatchedPet;
    this.hatchingEgg = egg;
    this.hatchCracksLeft = 3;

    // Open Egg Hatch Modal in Stage 1 (Cracking)
    const modal = document.getElementById('egg-hatch-modal');
    const stageEgg = document.getElementById('hatch-stage-egg');
    const stageReveal = document.getElementById('hatch-stage-reveal');
    const eggNameEl = document.getElementById('hatch-egg-name');
    const eggDisplay = document.getElementById('hatch-egg-display');
    const crackCountEl = document.getElementById('crack-count-display');
    const eggContainer = document.getElementById('hatch-egg-container');

    if (eggNameEl) eggNameEl.textContent = `${egg.icon} ${egg.name}`;
    if (eggDisplay) {
      eggDisplay.textContent = egg.icon;
    }
    if (crackCountEl) crackCountEl.textContent = '3';
    if (eggContainer) {
      eggContainer.className = `egg-wobble-box wobbling ${egg.cssClass}`;
    }

    if (stageEgg) stageEgg.style.display = 'flex';
    if (stageReveal) stageReveal.style.display = 'none';

    if (modal) modal.classList.add('active');
  }

  crackEggStep() {
    if (!this.hatchingPet || this.hatchCracksLeft <= 0) return;

    this.hatchCracksLeft--;
    const crackCountEl = document.getElementById('crack-count-display');
    const eggContainer = document.getElementById('hatch-egg-container');

    if (crackCountEl) crackCountEl.textContent = this.hatchCracksLeft;

    audio.playEggCrack();

    // Visual crack burst
    if (eggContainer) {
      eggContainer.style.transform = `scale(1.15) rotate(${(Math.random() - 0.5) * 20}deg)`;
      setTimeout(() => {
        eggContainer.style.transform = '';
      }, 140);
    }

    if (this.hatchCracksLeft <= 0) {
      setTimeout(() => this.finishHatchReveal(), 240);
    }
  }

  finishHatchReveal() {
    const pet = this.hatchingPet;
    if (!pet) return;

    pet.unlocked = true;

    // Victory sound & Confetti
    audio.playEggHatch(pet.rarity);
    if (this.renderer && this.renderer.particles) {
      this.renderer.particles.createVictoryConfetti(this.player.x, this.player.y);
    }

    const stageEgg = document.getElementById('hatch-stage-egg');
    const stageReveal = document.getElementById('hatch-stage-reveal');
    const bannerEl = document.getElementById('reveal-rarity-banner');
    const iconEl = document.getElementById('reveal-pet-icon');
    const speciesEl = document.getElementById('reveal-pet-species');
    const perkEl = document.getElementById('reveal-pet-perk');
    const descEl = document.getElementById('reveal-pet-desc');
    const nameInput = document.getElementById('input-hatch-name');

    const rarityClass = `rarity-${pet.rarity.replace(/\s+/g, '')}`;
    if (bannerEl) {
      bannerEl.textContent = `★ ${pet.rarity.toUpperCase()} ★`;
      bannerEl.className = `rarity-banner ${rarityClass}`;
    }
    if (iconEl) iconEl.textContent = pet.icon;
    if (speciesEl) speciesEl.textContent = pet.name;
    if (perkEl) perkEl.textContent = pet.perk;
    if (descEl) descEl.textContent = pet.desc;
    if (nameInput) {
      nameInput.value = pet.customName || pet.defaultName || pet.name;
      setTimeout(() => nameInput.focus(), 150);
    }

    if (stageEgg) stageEgg.style.display = 'none';
    if (stageReveal) stageReveal.style.display = 'flex';
  }

  confirmHatchedPet() {
    if (!this.hatchingPet) return;
    const nameInput = document.getElementById('input-hatch-name');
    const chosenName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : this.hatchingPet.defaultName;

    this.hatchingPet.customName = chosenName;
    this.player.pet = this.hatchingPet;
    this.applyUpgrades();
    this.saveProgress();
    this.updateHUD();
    this.renderShop();
    audio.playPetCheer();

    this.showToast(`🎉 Hatched ${this.hatchingPet.rarity} ${this.hatchingPet.icon} "${chosenName}"! Accompanied! 🐾❤️`);

    const modal = document.getElementById('egg-hatch-modal');
    if (modal) modal.classList.remove('active');
    this.hatchingPet = null;
  }

  selectRandomPetFromEgg(eggId) {
    const eggPets = this.pets.filter(p => p.egg === eggId);
    if (!eggPets.length) return this.pets[0];

    // Calculate total weight
    const totalWeight = eggPets.reduce((sum, p) => sum + (this.rarityMeta[p.rarity] ? this.rarityMeta[p.rarity].weight : 10), 0);
    let rand = Math.random() * totalWeight;

    for (const pet of eggPets) {
      const w = this.rarityMeta[pet.rarity] ? this.rarityMeta[pet.rarity].weight : 10;
      if (rand <= w) {
        return pet;
      }
      rand -= w;
    }
    return eggPets[0];
  }

  // Render Complex Engines & Tuning Bay Tab
  renderShopEngines() {
    const enginesContainer = document.getElementById('tab-engines');
    if (!enginesContainer) return;

    const eng = this.player.engine || this.engines[0];

    enginesContainer.innerHTML = `
      <!-- Live Engine Bay Telemetry Dashboard -->
      <div class="engine-bay-dashboard">
        <div class="engine-telemetry-item">
          <span class="engine-telemetry-label">Active Powertrain</span>
          <span class="engine-telemetry-val" style="color:#ffffff; font-size:1.15rem;">${eng.name}</span>
        </div>
        <div class="engine-telemetry-item">
          <span class="engine-telemetry-label">Total Horsepower</span>
          <span class="engine-telemetry-val" style="color:#00f076;">${this.player.horsePower} HP</span>
        </div>
        <div class="engine-telemetry-item">
          <span class="engine-telemetry-label">Max Redline</span>
          <span class="engine-telemetry-val" style="color:#ffc837;">${this.player.maxRpm.toLocaleString()} RPM</span>
        </div>
        <div class="engine-telemetry-item">
          <span class="engine-telemetry-label">Turbo Boost</span>
          <span class="engine-telemetry-val" style="color:#05d9e8;">${this.player.boostPsi} PSI</span>
        </div>
      </div>

      <!-- Section 1: Complex Engine Swaps -->
      <div class="engine-section-header">
        <span>⚙️</span> Modular Powertrain Swaps
      </div>
      <div class="shop-grid" id="grid-engine-swaps"></div>

      <!-- Section 2: Engine Component Tuning Modules -->
      <div class="engine-section-header" style="margin-top:20px;">
        <span>🔧</span> Component Tuning & Performance Modules
      </div>
      <div class="shop-grid" id="grid-engine-parts"></div>
    `;

    // Render Modular Engine Swaps
    const swapsGrid = document.getElementById('grid-engine-swaps');
    this.engines.forEach(e => {
      const isEquipped = this.player.engine && this.player.engine.id === e.id;
      const card = document.createElement('div');
      card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;

      card.innerHTML = `
        ${isEquipped ? '<div class="shop-card-badge">Installed 🔧</div>' : (e.unlocked ? '<div class="shop-card-badge" style="background:#05d9e8;">Owned</div>' : '')}
        <div class="shop-card-icon">${e.icon}</div>
        <div class="shop-card-title">${e.name}</div>
        <div style="font-size:0.75rem; color:#05d9e8; text-align:center; font-weight:700;">${e.hp} HP • ${e.rpmMax.toLocaleString()} RPM • ${e.boostPsi} PSI</div>
        <div style="font-size:0.75rem; color:#ffc837; text-align:center; font-weight:700;">${e.perk}</div>
        <div class="shop-card-desc">${e.desc}</div>
        ${
          isEquipped
            ? `<button class="btn-equip active" disabled>Installed in Vehicle 🏎️</button>`
            : e.unlocked
            ? `<button class="btn-equip" data-equip-engine="${e.id}">Install Engine 🔧</button>`
            : `<button class="btn-buy" data-buy-engine="${e.id}" ${this.player.cash < e.cost ? 'disabled' : ''}>Build & Swap ($${e.cost}) 💵</button>`
        }
      `;
      swapsGrid.appendChild(card);
    });

    // Render Component Tuning Modules
    const partsGrid = document.getElementById('grid-engine-parts');
    this.engineParts.forEach(part => {
      const isMax = part.level >= part.maxLevel;
      const nextCost = Math.round(part.baseCost * Math.pow(part.costMult, part.level - 1));
      const card = document.createElement('div');
      card.className = 'shop-card';

      card.innerHTML = `
        <div class="shop-card-icon">${part.icon}</div>
        <div class="shop-card-title">${part.name}</div>
        <div class="shop-card-level">Level ${part.level} / ${part.maxLevel} (${part.statName}: ${part.statGain})</div>
        <div class="shop-card-desc">${part.desc}</div>
        ${
          isMax
            ? `<button class="btn-buy" disabled style="background:rgba(255,255,255,0.1); color:#ffc837;">MAX TUNED 🏆</button>`
            : `<button class="btn-buy" data-buy-engine-part="${part.id}" ${this.player.cash < nextCost ? 'disabled' : ''}>Tune Part ($${nextCost}) ⚡</button>`
        }
      `;
      partsGrid.appendChild(card);
    });

    // Attach Event Listeners
    swapsGrid.querySelectorAll('[data-buy-engine]').forEach(btn => {
      btn.addEventListener('click', ev => {
        const engId = ev.currentTarget.getAttribute('data-buy-engine');
        this.buyEngine(engId);
      });
    });
    swapsGrid.querySelectorAll('[data-equip-engine]').forEach(btn => {
      btn.addEventListener('click', ev => {
        const engId = ev.currentTarget.getAttribute('data-equip-engine');
        this.equipEngine(engId);
      });
    });
    partsGrid.querySelectorAll('[data-buy-engine-part]').forEach(btn => {
      btn.addEventListener('click', ev => {
        const partId = ev.currentTarget.getAttribute('data-buy-engine-part');
        this.buyEnginePart(partId);
      });
    });
  }

  buyVehicle(vehId) {
    const veh = this.vehicles.find(v => v.id === vehId);
    if (veh && this.player.cash >= veh.cost) {
      audio.playPurchase();
      this.player.cash -= veh.cost;
      veh.unlocked = true;
      this.player.vehicle = veh;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Unlocked ${veh.name}! 🔑`);
      this.renderShop();
      this.updateHUD();
    }
  }

  equipVehicle(vehId) {
    const veh = this.vehicles.find(v => v.id === vehId);
    if (veh && veh.unlocked) {
      this.player.vehicle = veh;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Driving ${veh.name}! 🏎️`);
      this.renderShop();
      this.updateHUD();
    }
  }

  equipPet(petId) {
    const pet = this.pets.find(p => p.id === petId);
    if (pet && pet.unlocked) {
      this.player.pet = pet;
      this.applyUpgrades();
      this.saveProgress();
      const petName = pet.customName || pet.name;
      this.showToast(`${petName} is accompanying you! 🐾❤️`);
      this.renderShop();
      this.updateHUD();
    }
  }

  openPetNameModal(petId) {
    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    this.namingPet = pet;
    const modal = document.getElementById('pet-name-modal');
    const iconEl = document.getElementById('name-modal-pet-icon');
    const speciesEl = document.getElementById('name-modal-pet-species');
    const inputEl = document.getElementById('input-pet-name');

    if (iconEl) iconEl.textContent = pet.icon;
    if (speciesEl) speciesEl.textContent = pet.name;
    if (inputEl) {
      inputEl.value = pet.customName || pet.defaultName || pet.name;
      setTimeout(() => inputEl.focus(), 100);
    }

    if (modal) modal.classList.add('active');
  }

  savePetName() {
    if (!this.namingPet) return;
    const inputEl = document.getElementById('input-pet-name');
    const newName = (inputEl && inputEl.value.trim()) ? inputEl.value.trim() : this.namingPet.defaultName;

    this.namingPet.customName = newName;
    this.saveProgress();
    this.updateHUD();
    this.renderShop();
    audio.playPetCheer();
    this.showToast(`🐾 Named your ${this.namingPet.name} "${newName}"! ❤️`);

    const modal = document.getElementById('pet-name-modal');
    if (modal) modal.classList.remove('active');
  }

  getRandomPetName() {
    const names = [
      'Sprinkles', 'Daisy', 'Mochi', 'Sparky', 'Starhop', 'Twinkle', 'Flash',
      'Biscuit', 'Peanut', 'Coco', 'Luna', 'Ziggy', 'Bubbles', 'Bella',
      'Pepper', 'Rocky', 'Turbo', 'Cupcake', 'Nugget', 'Waffles', 'Cookie'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  buyEngine(engId) {
    const eng = this.engines.find(e => e.id === engId);
    if (eng && this.player.cash >= eng.cost) {
      audio.playPurchase();
      this.player.cash -= eng.cost;
      eng.unlocked = true;
      this.player.engine = eng;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Swapped to ${eng.name}! 🔧⚡`);
      this.renderShop();
      this.updateHUD();
    }
  }

  equipEngine(engId) {
    const eng = this.engines.find(e => e.id === engId);
    if (eng && eng.unlocked) {
      this.player.engine = eng;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Installed ${eng.name}! 🏎️🔧`);
      this.renderShop();
      this.updateHUD();
    }
  }

  buyEnginePart(partId) {
    const part = this.engineParts.find(p => p.id === partId);
    if (!part || part.level >= part.maxLevel) return;

    const cost = Math.round(part.baseCost * Math.pow(part.costMult, part.level - 1));
    if (this.player.cash >= cost) {
      audio.playPurchase();
      this.player.cash -= cost;
      part.level++;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Tuned ${part.name} to Level ${part.level}! 🔧⚡`);
      this.renderShop();
      this.updateHUD();
    }
  }

  buyUpgrade(upId) {
    const up = this.upgrades.find(u => u.id === upId);
    if (!up || up.level >= up.maxLevel) return;

    const cost = Math.round(up.baseCost * Math.pow(up.costMult, up.level - 1));
    if (this.player.cash >= cost) {
      audio.playPurchase();
      this.player.cash -= cost;
      up.level++;
      this.applyUpgrades();
      this.saveProgress();
      this.showToast(`Upgraded ${up.name} to Level ${up.level}! ⚡`);
      this.renderShop();
      this.updateHUD();
    }
  }

  // ========================================================
  // PLAYER PHYSICS & MOVEMENT
  // ========================================================
  updatePlayer(dt) {
    // Pet bounce animation decay
    if (this.player.petBounce > 0) {
      this.player.petBounce = Math.max(0, this.player.petBounce - dt * 2.5);
    }

    // Countdown freeze during race start
    if (this.mode === 'race' && this.race.state === 'countdown') {
      this.player.speed = 0;
      this.player.vx = 0;
      this.player.vy = 0;
      if (this.keys.up) {
        audio.updateEngine(0.8, true, this.player.engine ? this.player.engine.soundType : 'stock');
        this.renderer.particles.createSmoke(
          this.player.x - Math.cos(this.player.angle) * 20,
          this.player.y - Math.sin(this.player.angle) * 20,
          -Math.cos(this.player.angle) * 3,
          -Math.sin(this.player.angle) * 3
        );
      } else {
        audio.updateEngine(0.2, false, this.player.engine ? this.player.engine.soundType : 'stock');
      }
      return;
    }

    // Nitro Boost
    const nitroTankLvl = this.getUpgradeLevel('upgrade_nitro');
    const intercoolerLvl = this.getEnginePartLevel('part_intercooler');
    const bunnyBonus = (this.player.pet && this.player.pet.nitroBonus) ? this.player.pet.nitroBonus : 1.0;
    const isTurboVeh = this.player.vehicle && (this.player.vehicle.id === 'veh_gt' || this.player.vehicle.id === 'veh_formula');

    if (this.keys.nitro && this.player.nitro > 5) {
      this.player.isNitroActive = true;
      this.player.nitro = Math.max(0, this.player.nitro - 28 * dt);
      this.renderer.particles.createNitroFlame(this.player.x, this.player.y, this.player.angle);
      if (Math.random() < 0.2) audio.playNitro();
    } else {
      this.player.isNitroActive = false;
      // Nitro recharge enhanced by intercooler & cosmic bunny
      const rechargeRate = (12 + (nitroTankLvl - 1) * 6 + (intercoolerLvl - 1) * 6) * (isTurboVeh ? 1.6 : 1.0) * bunnyBonus;
      this.player.nitro = Math.min(100, this.player.nitro + rechargeRate * dt);
    }

    // Steering
    let steerDir = 0;
    if (this.keys.left) steerDir -= 1;
    if (this.keys.right) steerDir += 1;

    // Turn faster if moving
    const speedRatio = Math.abs(this.player.speed) / this.player.topSpeed;
    if (Math.abs(this.player.speed) > 0.2) {
      this.player.angle += steerDir * this.player.turnSpeed * Math.sign(this.player.speed);
    }
    this.player.steerVisual += (steerDir - this.player.steerVisual) * 0.2;

    // Acceleration & Braking
    const maxSpeed = this.player.isNitroActive ? this.player.topSpeed * 1.5 : this.player.topSpeed;

    if (this.keys.up) {
      this.player.speed += this.player.accel;
      if (this.player.speed > maxSpeed) this.player.speed = maxSpeed;
      // Exhaust smoke
      if (Math.random() < 0.3) {
        this.renderer.particles.createSmoke(
          this.player.x - Math.cos(this.player.angle) * 20,
          this.player.y - Math.sin(this.player.angle) * 20,
          -Math.cos(this.player.angle) * 2,
          -Math.sin(this.player.angle) * 2
        );
      }
    } else if (this.keys.down) {
      // Reverse / brake
      this.player.speed -= this.player.accel * 0.8;
      if (this.player.speed < -maxSpeed * 0.4) this.player.speed = -maxSpeed * 0.4;
    } else {
      // Coasting friction
      this.player.speed *= 0.96;
      if (Math.abs(this.player.speed) < 0.05) this.player.speed = 0;
    }

    // Tire skid marks during sharp high-speed cornering
    if (Math.abs(steerDir) > 0 && Math.abs(this.player.speed) > 4.5) {
      this.renderer.particles.addSkid(this.player.x, this.player.y, this.player.angle);
    }

    // Complex Engine RPM Simulation & Turbo Blow-Off Valve Detection
    let targetRpm = 850;
    if (this.keys.up) {
      targetRpm = 850 + (this.player.maxRpm - 850) * Math.max(0.35, speedRatio);
      if (this.player.isNitroActive) targetRpm = this.player.maxRpm;
    } else if (this.keys.down) {
      targetRpm = 850 + (this.player.maxRpm - 850) * 0.3;
    } else {
      targetRpm = 850 + (this.player.maxRpm - 850) * speedRatio * 0.4;
    }
    this.player.rpm += (targetRpm - this.player.rpm) * 0.14;

    // Trigger crisp blow-off valve release when letting off throttle from high boost/RPM
    if (this.wasAccelerating && !this.keys.up && this.player.boostPsi > 0 && this.player.rpm > 3400) {
      audio.playBlowoffValve();
      this.renderer.particles.createSmoke(
        this.player.x - Math.cos(this.player.angle) * 16,
        this.player.y - Math.sin(this.player.angle) * 16,
        -Math.cos(this.player.angle) * 3,
        -Math.sin(this.player.angle) * 3,
        'rgba(255, 255, 255, 0.6)'
      );
    }
    this.wasAccelerating = this.keys.up;

    // Velocity update
    this.player.vx = Math.cos(this.player.angle) * this.player.speed;
    this.player.vy = Math.sin(this.player.angle) * this.player.speed;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Invincibility flashing timer
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // Engine sound modulation with custom complex engine timbre!
    audio.updateEngine(speedRatio, this.keys.up || this.player.isNitroActive, this.player.engine ? this.player.engine.soundType : 'stock');

    // World clamps for both City and Race modes (cannot ride off map!)
    if (this.mode === 'city') {
      this.player.x = Math.max(40, Math.min(this.city.worldWidth - 40, this.player.x));
      this.player.y = Math.max(40, Math.min(this.city.worldHeight - 40, this.player.y));
    } else if (this.mode === 'race') {
      this.player.x = Math.max(60, Math.min(2540, this.player.x));
      this.player.y = Math.max(60, Math.min(2140, this.player.y));
    }
  }

  // ========================================================
  // COLLISION & LIVES HANDLING
  // ========================================================
  handleCollisions() {
    if (this.player.invincibleTimer > 0) return;

    // Check hit against the 5 cars
    const hitCar = this.city.checkCarCollisions(this.player);
    if (hitCar) {
      // If player has Persian Cat Shield
      if (this.player.hasActiveShield) {
        this.player.hasActiveShield = false;
        audio.playCrash();
        this.renderer.triggerScreenShake(12);
        this.renderer.particles.createCrashSparks(this.player.x, this.player.y);

        // Pushback
        this.player.speed = -this.player.speed * 0.6;
        this.player.invincibleTimer = 1.2;
        this.showToast('🛡️ Armored Bumper Shield absorbed the crash!');
        this.updateHUD();
        return;
      }

      // Normal crash: lose 1 life!
      this.player.lives--;
      audio.playCrash();
      this.renderer.triggerScreenShake(22);
      this.renderer.particles.createCrashSparks(this.player.x, this.player.y);

      // Bounce player away
      this.player.speed = -this.player.speed * 0.8;
      this.player.invincibleTimer = 2.0;

      this.updateHUD();

      if (this.player.lives <= 0) {
        this.triggerGameOver();
      } else {
        this.showToast(`💥 Hit by ${hitCar.name}! Lives left: ${this.player.lives}`);
      }
    }
  }

  triggerGameOver() {
    audio.stopEngine();
    this.isPaused = true;
    this.saveProgress();

    const modal = document.getElementById('gameover-modal');
    const ptsText = document.getElementById('gameover-points');
    const cashText = document.getElementById('gameover-cash');

    if (ptsText) ptsText.textContent = this.player.points;
    if (cashText) cashText.textContent = `$${this.player.cash}`;
    if (modal) modal.classList.add('active');
  }

  respawnPlayer() {
    this.player.lives = this.player.maxLives;
    this.player.x = this.city.vRoads[2];
    this.player.y = this.city.hRoads[2] + 35;
    this.player.speed = 0;
    this.player.invincibleTimer = 2.0;
    if (this.player.vehicle && this.player.vehicle.hasShield) {
      this.player.hasActiveShield = true;
    }
    this.isPaused = false;
    this.updateHUD();
    this.showToast('❤️ Back on the road! Dodge those 5 cars!');
  }

  // ========================================================
  // MAIN GAME LOOP
  // ========================================================
  loop(currentTime) {
    requestAnimationFrame(t => this.loop(t));

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      // 1. Update Player
      this.updatePlayer(dt);

      // 2. Update Particles
      this.renderer.particles.update();

      // 3. Mode Specific Updates
      if (this.mode === 'city') {
        this.city.updateTraffic(this.player, dt);
        this.city.updateOrbs(this.player, this.player.pickupRadius, this.renderer.particles);
        this.city.updateFloatingTexts();
        this.handleCollisions();
      } else if (this.mode === 'race') {
        this.race.update(this.player, dt, this.renderer.particles);
        this.updateRaceHUD();
      }

      this.updateHUD();
    }

    // 4. Render Everything
    this.renderer.clear();
    this.renderer.updateCamera(this.player.x, this.player.y);

    if (this.mode === 'city') {
      this.renderer.drawCity(this.city);
    } else {
      this.renderer.drawRaceTrack(this.race);
    }

    // Draw Player
    this.renderer.drawPlayer(this.player);

    // Draw Minimap
    this.renderer.drawMinimap(
      this.minimapCanvas,
      this.city,
      this.race,
      this.player,
      this.mode === 'race'
    );
  }

  // ========================================================
  // HUD UPDATES
  // ========================================================
  updateHUD() {
    // Lives Hearts
    const livesContainer = document.getElementById('lives-container');
    if (livesContainer) {
      let heartsHtml = '';
      for (let i = 0; i < this.player.maxLives; i++) {
        const isFilled = i < this.player.lives;
        const isShielded = this.player.hasActiveShield && i === this.player.lives - 1;
        heartsHtml += `<span class="heart-icon ${!isFilled ? 'lost' : ''} ${isShielded ? 'shielded' : ''}">❤️</span>`;
      }
      livesContainer.innerHTML = heartsHtml;
    }

    // Points & Cash
    const ptsEl = document.getElementById('display-points');
    const cashEl = document.getElementById('display-cash');
    if (ptsEl) ptsEl.textContent = this.player.points;
    if (cashEl) cashEl.textContent = this.player.cash;

    // Selected Car / Vehicle
    const carNameEl = document.getElementById('display-car-name');
    const carIconEl = document.getElementById('display-car-icon');
    if (this.player.vehicle) {
      if (carNameEl) carNameEl.textContent = this.player.vehicle.name;
      if (carIconEl) carIconEl.textContent = this.player.vehicle.icon;
    }

    // Selected Pet Companion (Charlotte's Pets!)
    const petNameEl = document.getElementById('display-pet-name');
    const petIconEl = document.getElementById('display-pet-icon');
    if (this.player.pet) {
      if (petNameEl) petNameEl.textContent = this.player.pet.customName || this.player.pet.defaultName || this.player.pet.name;
      if (petIconEl) petIconEl.textContent = this.player.pet.icon;
    }

    // Engine Telemetry (Complex Engines!)
    const engineHpEl = document.getElementById('display-engine-hp');
    const engineRpmEl = document.getElementById('display-engine-rpm');
    if (engineHpEl) engineHpEl.textContent = `${this.player.horsePower} HP`;
    if (engineRpmEl) engineRpmEl.textContent = `${Math.round(this.player.rpm).toLocaleString()} RPM`;

    // Nitro Bar
    const nitroFill = document.getElementById('nitro-fill');
    const nitroText = document.getElementById('display-nitro-text');
    if (nitroFill) nitroFill.style.width = `${Math.round(this.player.nitro)}%`;
    if (nitroText) nitroText.textContent = `${Math.round(this.player.nitro)}%`;
  }

  updateRaceHUD() {
    const posText = document.getElementById('race-pos-text');
    const lapText = document.getElementById('race-lap-text');

    const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th'];
    const p = this.race.playerPlace;
    const suffix = suffixes[p] || 'th';

    if (posText) posText.textContent = `${p}${suffix}`;
    if (lapText) lapText.textContent = `${Math.min(this.race.totalLaps, this.race.playerLap)}/${this.race.totalLaps}`;
  }

  updateSoundIcon(isMuted) {
    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ========================================================
  // PERSISTENCE (LOCAL STORAGE)
  // ========================================================
  saveProgress() {
    const data = {
      points: this.player.points,
      cash: this.player.cash,
      activeVehId: this.player.vehicle ? this.player.vehicle.id : 'veh_moto',
      unlockedVehicles: this.vehicles.filter(v => v.unlocked).map(v => v.id),
      upgradeLevels: {},
      // Charlotte's Pets
      activePetId: this.player.pet ? this.player.pet.id : 'pet_cat',
      unlockedPets: this.pets.filter(p => p.unlocked).map(p => p.id),
      petNames: {},
      // Complex Engines & Tuning
      activeEngineId: this.player.engine ? this.player.engine.id : 'eng_stock',
      unlockedEngines: this.engines.filter(e => e.unlocked).map(e => e.id),
      enginePartLevels: {}
    };
    this.upgrades.forEach(u => {
      data.upgradeLevels[u.id] = u.level;
    });
    this.pets.forEach(p => {
      if (p.customName) data.petNames[p.id] = p.customName;
    });
    this.engineParts.forEach(ep => {
      data.enginePartLevels[ep.id] = ep.level;
    });

    try {
      localStorage.setItem('charlotte_game_save', JSON.stringify(data));
    } catch (e) {
      console.warn("Save error:", e);
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('charlotte_game_save');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Load error:", e);
    }
    return {};
  }
}

// Instantiate and start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
