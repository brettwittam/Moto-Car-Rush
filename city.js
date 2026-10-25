/**
 * Charlotte's Moto Cat Rush - City Environment & Traffic AI
 * Manages the city grid, buildings, parks, the 5 cars, and yellow orbs.
 */

class CityManager {
  constructor() {
    this.worldWidth = 3200;
    this.worldHeight = 3200;

    // Road grid configuration
    this.roadWidth = 140; // Two-lane road
    this.hRoads = [300, 950, 1600, 2250, 2900];
    this.vRoads = [300, 950, 1600, 2250, 2900];

    // Buildings & scenery blocks
    this.blocks = [];
    this.trees = [];
    this.streetLamps = [];
    this.initCityScenery();

    // The 5 Cars (Blue, Red, Green, Yellow, Black)
    this.cars = [];
    this.initFiveCars();

    // Yellow Orbs
    this.orbs = [];
    this.maxOrbs = 30;
    this.initOrbs();

    // Floating text popups (e.g. "+1 Point", "+$2")
    this.floatingTexts = [];
  }

  initCityScenery() {
    this.blocks = [];
    this.trees = [];
    this.streetLamps = [];

    // Build city blocks between the roads
    for (let r = 0; r < this.hRoads.length - 1; r++) {
      for (let c = 0; c < this.vRoads.length - 1; c++) {
        const x1 = this.vRoads[c] + this.roadWidth / 2 + 20;
        const y1 = this.hRoads[r] + this.roadWidth / 2 + 20;
        const x2 = this.vRoads[c + 1] - this.roadWidth / 2 - 20;
        const y2 = this.hRoads[r + 1] - this.roadWidth / 2 - 20;
        const w = x2 - x1;
        const h = y2 - y1;

        // Central block is the Grand City Park!
        const isCenterPark = (r === 1 && c === 1);

        if (isCenterPark) {
          this.blocks.push({
            type: 'park',
            x: x1,
            y: y1,
            w: w,
            h: h
          });

          // Trees and paths in park
          for (let tx = x1 + 40; tx < x2 - 40; tx += 90) {
            for (let ty = y1 + 40; ty < y2 - 40; ty += 90) {
              // Avoid center fountain
              const distFromCenter = Math.hypot(tx - (x1 + w / 2), ty - (y1 + h / 2));
              if (distFromCenter > 110) {
                this.trees.push({
                  x: tx + (Math.random() * 20 - 10),
                  y: ty + (Math.random() * 20 - 10),
                  radius: 20 + Math.random() * 10,
                  variant: Math.floor(Math.random() * 3)
                });
              }
            }
          }
        } else {
          // City Building block with multiple buildings
          const buildingTypes = ['modern', 'glass', 'brick', 'plaza', 'rooftop_pool'];
          const bType = buildingTypes[(r * 3 + c) % buildingTypes.length];

          this.blocks.push({
            type: 'building',
            x: x1,
            y: y1,
            w: w,
            h: h,
            style: bType,
            roofColor: this.getBlockColor(r, c)
          });

          // Sidewalk trees along block perimeter
          this.trees.push({ x: x1 - 12, y: y1 + h / 2, radius: 14, variant: 0 });
          this.trees.push({ x: x2 + 12, y: y1 + h / 2, radius: 14, variant: 0 });
          this.trees.push({ x: x1 + w / 2, y: y1 - 12, radius: 14, variant: 1 });
          this.trees.push({ x: x1 + w / 2, y: y2 + 12, radius: 14, variant: 1 });
        }
      }
    }

    // Street lamps at sidewalk corners
    this.hRoads.forEach(ry => {
      this.vRoads.forEach(rx => {
        const offset = this.roadWidth / 2 + 14;
        this.streetLamps.push({ x: rx - offset, y: ry - offset });
        this.streetLamps.push({ x: rx + offset, y: ry - offset });
        this.streetLamps.push({ x: rx - offset, y: ry + offset });
        this.streetLamps.push({ x: rx + offset, y: ry + offset });
      });
    });
  }

  getBlockColor(r, c) {
    const colors = [
      '#242b42', '#1e2438', '#2b3350', '#21283d',
      '#1b2838', '#2a2238', '#203038', '#2c2936'
    ];
    return colors[(r * 4 + c) % colors.length];
  }

  // Exactly the 5 cars requested by Charlotte:
  // "one blue, one red, one green, one yellow, one black"
  initFiveCars() {
    const carConfigs = [
      {
        name: 'Blue Cruiser',
        color: '#2575fc',
        roofColor: '#1a54b8',
        accentColor: '#ffffff',
        baseSpeed: 4.2,
        startX: this.vRoads[0],
        startY: this.hRoads[1] + 35, // Right-hand lane
        dir: { x: 1, y: 0 },
        angle: 0
      },
      {
        name: 'Red Speeder',
        color: '#ff2a6d',
        roofColor: '#b81446',
        accentColor: '#ffde59',
        baseSpeed: 5.6,
        startX: this.vRoads[2] + 35,
        startY: this.hRoads[0],
        dir: { x: 0, y: 1 },
        angle: Math.PI / 2
      },
      {
        name: 'Green Hatch',
        color: '#00f076',
        roofColor: '#00aa53',
        accentColor: '#111111',
        baseSpeed: 4.4,
        startX: this.vRoads[4],
        startY: this.hRoads[3] - 35,
        dir: { x: -1, y: 0 },
        angle: Math.PI
      },
      {
        name: 'Yellow Taxi',
        color: '#ffc837',
        roofColor: '#d69e00',
        accentColor: '#222222',
        baseSpeed: 4.8,
        startX: this.vRoads[1] - 35,
        startY: this.hRoads[4],
        dir: { x: 0, y: -1 },
        angle: -Math.PI / 2
      },
      {
        name: 'Black Muscle',
        color: '#1a1c23',
        roofColor: '#0d0e12',
        accentColor: '#ff3366',
        baseSpeed: 5.2,
        startX: this.vRoads[3],
        startY: this.hRoads[2] + 35,
        dir: { x: 1, y: 0 },
        angle: 0
      }
    ];

    this.cars = carConfigs.map((cfg, index) => ({
      id: index,
      name: cfg.name,
      color: cfg.color,
      roofColor: cfg.roofColor,
      accentColor: cfg.accentColor,
      x: cfg.startX,
      y: cfg.startY,
      width: 44,
      length: 82,
      speed: cfg.baseSpeed,
      baseSpeed: cfg.baseSpeed,
      targetSpeed: cfg.baseSpeed,
      angle: cfg.angle,
      targetAngle: cfg.angle,
      vx: cfg.dir.x * cfg.baseSpeed,
      vy: cfg.dir.y * cfg.baseSpeed,
      currentRoadType: cfg.dir.x !== 0 ? 'horizontal' : 'vertical',
      roadIndex: 1,
      isBraking: false,
      honkCooldown: 0,
      turnCooldown: 0
    }));
  }

  // Generate Yellow Orbs around the city roads and park
  initOrbs() {
    this.orbs = [];
    for (let i = 0; i < this.maxOrbs; i++) {
      this.spawnOrb();
    }
  }

  spawnOrb() {
    let x, y;
    const spawnInPark = Math.random() < 0.25;

    if (spawnInPark) {
      // Park area
      const minX = this.vRoads[1] + this.roadWidth / 2 + 40;
      const maxX = this.vRoads[2] - this.roadWidth / 2 - 40;
      const minY = this.hRoads[1] + this.roadWidth / 2 + 40;
      const maxY = this.hRoads[2] - this.roadWidth / 2 - 40;
      x = minX + Math.random() * (maxX - minX);
      y = minY + Math.random() * (maxY - minY);
    } else {
      // Spawn on one of the roads
      const isHorizontal = Math.random() < 0.5;
      if (isHorizontal) {
        const roadY = this.hRoads[Math.floor(Math.random() * this.hRoads.length)];
        y = roadY + (Math.random() * 80 - 40);
        x = 100 + Math.random() * (this.worldWidth - 200);
      } else {
        const roadX = this.vRoads[Math.floor(Math.random() * this.vRoads.length)];
        x = roadX + (Math.random() * 80 - 40);
        y = 100 + Math.random() * (this.worldHeight - 200);
      }
    }

    this.orbs.push({
      x: x,
      y: y,
      radius: 14,
      bobOffset: Math.random() * Math.PI * 2,
      pulse: 0
    });
  }

  // Update the 5 traffic cars: pathfinding, intersection turns, collision avoidance, honking
  updateTraffic(player, dt) {
    this.cars.forEach(car => {
      // Honk cooldown
      if (car.honkCooldown > 0) car.honkCooldown -= dt;
      if (car.turnCooldown > 0) car.turnCooldown -= dt;

      // Check distance to player
      const distToPlayer = Math.hypot(car.x - player.x, car.y - player.y);
      const angleToPlayer = Math.atan2(player.y - car.y, player.x - car.x);
      const angleDiff = Math.abs(this.normalizeAngle(angleToPlayer - car.angle));

      // Car sees player directly in front!
      if (distToPlayer < 120 && angleDiff < 0.6) {
        car.targetSpeed = 0; // Brake to avoid hitting if player stops
        car.isBraking = true;
        if (car.honkCooldown <= 0) {
          audio.playHonk();
          car.honkCooldown = 3.0; // Don't spam honk
        }
      } else {
        car.targetSpeed = car.baseSpeed;
        car.isBraking = false;
      }

      // Check for intersections to turn
      if (car.turnCooldown <= 0) {
        this.checkIntersectionTurn(car);
      }

      // Smooth steering toward targetAngle
      const angleDelta = this.normalizeAngle(car.targetAngle - car.angle);
      car.angle += angleDelta * 0.12;

      // Speed acceleration/deceleration
      car.speed += (car.targetSpeed - car.speed) * 0.1;

      // Move car
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      // Wrap around world edges seamlessly
      if (car.x < -100) car.x = this.worldWidth + 50;
      if (car.x > this.worldWidth + 100) car.x = -50;
      if (car.y < -100) car.y = this.worldHeight + 50;
      if (car.y > this.worldHeight + 100) car.y = -50;
    });
  }

  checkIntersectionTurn(car) {
    // Find closest intersection
    for (let r = 0; r < this.hRoads.length; r++) {
      for (let c = 0; c < this.vRoads.length; c++) {
        const ix = this.vRoads[c];
        const iy = this.hRoads[r];
        const dist = Math.hypot(car.x - ix, car.y - iy);

        // Within intersection center zone
        if (dist < 40) {
          // 40% chance to turn at intersection, 60% continue straight
          if (Math.random() < 0.45) {
            const possibleAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            // Filter out 180-degree u-turn
            const validAngles = possibleAngles.filter(ang => {
              const diff = Math.abs(this.normalizeAngle(ang - car.angle));
              return diff > 0.2 && diff < Math.PI - 0.2;
            });

            if (validAngles.length > 0) {
              const chosenAngle = validAngles[Math.floor(Math.random() * validAngles.length)];
              car.targetAngle = chosenAngle;
              car.turnCooldown = 2.5; // Don't turn again immediately
            }
          }
          return;
        }
      }
    }
  }

  // Update Yellow Orbs & Handle Collection with Magnet (Boosted by Charlotte's Pets!)
  updateOrbs(player, baseMagnetRadius, particles) {
    let collectedCount = 0;
    player.magneticTethers = []; // Track active magnetic pulls for visual magic beams

    // Pet magnetic power multiplier
    const pet = player.pet;
    const petMult = pet ? (pet.magnetMult || 1.0) : 1.0;
    const effectiveRadius = baseMagnetRadius * petMult;

    // Pet position in world
    const petOffsetDist = 34;
    const petAngle = player.angle - Math.PI * 0.45;
    const petX = player.x + Math.cos(petAngle) * petOffsetDist;
    const petY = player.y + Math.sin(petAngle) * petOffsetDist;

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.bobOffset += 0.05;

      const distPlayer = Math.hypot(player.x - orb.x, player.y - orb.y);
      const distPet = Math.hypot(petX - orb.x, petY - orb.y);
      const dist = Math.min(distPlayer, distPet);

      // Magnet effect: pull orb toward player/pet if within magnetic reach!
      if (dist < effectiveRadius && dist > 20) {
        const pullTargetX = pet ? petX : player.x;
        const pullTargetY = pet ? petY : player.y;

        const pullStrength = 11 * (1 - dist / effectiveRadius) + 5;
        const angle = Math.atan2(pullTargetY - orb.y, pullTargetX - orb.x);
        orb.x += Math.cos(angle) * pullStrength;
        orb.y += Math.sin(angle) * pullStrength;

        // Add magnetic energy tether for visual rendering
        if (player.magneticTethers.length < 8) {
          player.magneticTethers.push({
            fromX: pet ? petX : player.x,
            fromY: pet ? petY : player.y,
            toX: orb.x,
            toY: orb.y,
            color: pet ? (pet.color || '#ffc837') : '#ffc837'
          });
        }

        // Tiny sparkle trail as orb flies towards Charlotte & pet
        if (Math.random() < 0.25) {
          particles.particles.push({
            type: 'sparkle',
            x: orb.x + (Math.random() - 0.5) * 8,
            y: orb.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 2 + Math.random() * 2,
            alpha: 0.8,
            decay: 0.04,
            color: pet ? pet.color : '#ffe066'
          });
        }
      }

      // Collect orb when close
      if (distPlayer < player.pickupRadius + orb.radius || distPet < (player.pickupRadius * 0.9) + orb.radius) {
        // Collect!
        audio.playCollectOrb();
        if (pet) {
          audio.playPetCheer();
          player.petBounce = 1.0; // Trigger pet happy jump!
        }

        // Particles explosion
        particles.createOrbBurst(orb.x, orb.y);

        // Points & Cash logic
        // Charlotte's requirement: 1 point converts to 2 money
        // Pet bonuses:
        // - High-tier pets double points or double cash!
        // - Golden Pup gives bonus cash!
        // - Golden Hypercar doubles cash!
        const isDoubleCash = (player.vehicle && player.vehicle.doubleCash) || (pet && pet.doubleCash);
        let pointsGained = (pet && pet.doublePoints) ? 2 : 1;
        let cashGained = isDoubleCash ? (pointsGained * 4) : (pointsGained * 2);

        if (pet && pet.bonusCashPerOrb) {
          cashGained += pet.bonusCashPerOrb;
        }

        player.points += pointsGained;
        player.cash += cashGained;

        // Floating popup notification text
        const petPrefix = pet ? `${pet.icon} ` : '';
        this.addFloatingText(orb.x, orb.y - 20, `${petPrefix}+${pointsGained} Pt (+$${cashGained})`, pet ? pet.color : '#ffc837');

        // Remove and respawn
        this.orbs.splice(i, 1);
        this.spawnOrb();
        collectedCount++;

        // Occasional turbo screech / chime
        if (Math.random() < 0.15) {
          audio.playTurboScreech();
        }
      }
    }

    return collectedCount;
  }

  addFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      vy: -1.4,
      life: 50
    });
  }

  updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ft.alpha = ft.life / 50;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Check collision between player and any of the 5 cars
  checkCarCollisions(player) {
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      // Approximate with oriented bounding box distance
      const dx = player.x - car.x;
      const dy = player.y - car.y;

      // Project into car's local coordinate system
      const cos = Math.cos(-car.angle);
      const sin = Math.sin(-car.angle);
      const localX = Math.abs(dx * cos - dy * sin);
      const localY = Math.abs(dx * sin + dy * cos);

      const halfCarLength = car.length / 2 + player.radius * 0.7;
      const halfCarWidth = car.width / 2 + player.radius * 0.7;

      if (localX < halfCarLength && localY < halfCarWidth) {
        return car; // Hit this car!
      }
    }
    return null;
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }
}
