/**
 * Charlotte's Moto Cat Rush - Grand Prix Racing Mode
 * Manages the race track circuit, AI racers (5 cars), laps, checkpoints, and rewards!
 */

class RaceManager {
  constructor() {
    this.trackWidth = 200; // Wide race track for easy passing
    this.totalLaps = 3;

    // Track Waypoints defining a looping circuit
    this.waypoints = [
      { x: 400, y: 350 },
      { x: 900, y: 350 },
      { x: 1400, y: 350 },
      { x: 1800, y: 450 },
      { x: 2050, y: 750 },
      { x: 2050, y: 1200 },
      { x: 1850, y: 1550 },
      { x: 1450, y: 1400 },
      { x: 1150, y: 1650 },
      { x: 850, y: 1750 },
      { x: 500, y: 1600 },
      { x: 300, y: 1200 },
      { x: 300, y: 700 }
    ];

    this.checkpoints = this.waypoints.map((wp, idx) => ({
      index: idx,
      x: wp.x,
      y: wp.y
    }));

    // Race State
    this.active = false;
    this.state = 'countdown'; // 'countdown', 'racing', 'finished'
    this.countdownTimer = 3.5; // 3, 2, 1, GO!
    this.lastBeepInt = 4;
    this.playerLap = 1;
    this.playerNextCp = 1;
    this.playerPlace = 6;
    this.raceTime = 0;
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.bumpCooldown = 0;

    // AI Racers (The 5 Cars)
    this.aiRacers = [];
  }

  startRace(player) {
    this.active = true;
    this.state = 'countdown';
    this.countdownTimer = 3.5;
    this.lastBeepInt = 4;
    this.playerLap = 1;
    this.playerNextCp = 1;
    this.raceTime = 0;
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
    this.bumpCooldown = 0;

    // Position player on start grid (Row 3, right column)
    const startX = 450;
    const startY = 380;
    player.x = startX;
    player.y = startY;
    player.angle = 0; // Pointing forward along the straight
    player.speed = 0;
    player.vx = 0;
    player.vy = 0;

    // Starting positions for the 5 AI cars on the grid
    const carConfigs = [
      { name: 'Red Speeder', color: '#ff2a6d', roof: '#b81446', x: 750, y: 320, baseSpeed: 5.2, laneOffset: -20 },
      { name: 'Black Muscle', color: '#1a1c23', roof: '#0d0e12', x: 750, y: 380, baseSpeed: 5.0, laneOffset: 20 },
      { name: 'Blue Cruiser', color: '#2575fc', roof: '#1a54b8', x: 600, y: 320, baseSpeed: 4.8, laneOffset: -15 },
      { name: 'Yellow Taxi', color: '#ffc837', roof: '#d69e00', x: 600, y: 380, baseSpeed: 4.7, laneOffset: 15 },
      { name: 'Green Hatch', color: '#00f076', roof: '#00aa53', x: 450, y: 320, baseSpeed: 4.6, laneOffset: -10 }
    ];

    this.aiRacers = carConfigs.map((cfg, idx) => ({
      id: idx,
      name: cfg.name,
      color: cfg.color,
      roofColor: cfg.roof,
      x: cfg.x,
      y: cfg.y,
      angle: 0,
      width: 42,
      length: 80,
      baseSpeed: cfg.baseSpeed,
      speed: 0,
      targetSpeed: cfg.baseSpeed,
      currentCp: 1,
      lap: 1,
      totalProgress: 0,
      laneOffset: cfg.laneOffset,
      steerSkill: 0.12 + Math.random() * 0.04
    }));
  }

  update(player, dt, particles) {
    if (!this.active) return;

    if (this.state === 'countdown') {
      this.countdownTimer -= dt;
      const currentSec = Math.ceil(this.countdownTimer);

      if (currentSec !== this.lastBeepInt && currentSec > 0 && currentSec <= 3) {
        audio.playCountBeep(false);
        this.lastBeepInt = currentSec;
      }

      if (this.countdownTimer <= 0) {
        this.state = 'racing';
        audio.playCountBeep(true); // "GO!" beep
        this.lastBeepInt = 0;
      }
      return;
    }

    if (this.state === 'racing') {
      this.raceTime += dt;
      if (this.bumpCooldown > 0) this.bumpCooldown -= dt;

      // 1. Keep Player inside Track with Guardrails & Tire Barriers (no riding off map!)
      this.enforceTrackBounds(player, dt, particles);

      // 2. Interactive Bumping with AI Cars
      this.checkRaceCarCollisions(player, particles);

      // 3. Update AI Racers
      this.updateAIRacers(dt);

      // 4. Track Player Checkpoint & Lap Progress
      this.updatePlayerProgress(player);

      // 5. Calculate Positions (1st through 6th)
      this.updateLeaderboard(player);

      // 6. Check if Player finished all 3 laps!
      if (this.playerLap > this.totalLaps) {
        this.finishRace(player, particles);
      }
    }
  }

  updateAIRacers(dt) {
    this.aiRacers.forEach(ai => {
      // Find target waypoint
      const targetWp = this.waypoints[ai.currentCp];
      const nextWp = this.waypoints[(ai.currentCp + 1) % this.waypoints.length];

      // Calculate tangent for lane offset
      const wpAngle = Math.atan2(nextWp.y - targetWp.y, nextWp.x - targetWp.x);
      const perpAngle = wpAngle + Math.PI / 2;

      const targetX = targetWp.x + Math.cos(perpAngle) * ai.laneOffset;
      const targetY = targetWp.y + Math.sin(perpAngle) * ai.laneOffset;

      const dist = Math.hypot(targetX - ai.x, targetY - ai.y);
      const angleToTarget = Math.atan2(targetY - ai.y, targetX - ai.x);

      // Smooth steering toward waypoint
      const angleDiff = this.normalizeAngle(angleToTarget - ai.angle);
      ai.angle += angleDiff * ai.steerSkill;

      // Accelerate / slow down on sharp turns
      const turnSeverity = Math.abs(angleDiff);
      const speedMult = Math.max(0.65, 1.0 - turnSeverity * 0.4);
      ai.targetSpeed = ai.baseSpeed * speedMult;
      ai.speed += (ai.targetSpeed - ai.speed) * 0.08;

      // Move AI car
      ai.x += Math.cos(ai.angle) * ai.speed;
      ai.y += Math.sin(ai.angle) * ai.speed;

      // Checkpoint reached
      if (dist < 180) {
        ai.currentCp = (ai.currentCp + 1) % this.waypoints.length;
        if (ai.currentCp === 0) {
          ai.lap++;
        }
      }

      // Calculate continuous progress metric: lap * waypoints + currentCp + progress to next
      ai.totalProgress = (ai.lap - 1) * this.waypoints.length + ai.currentCp + (1 - Math.min(1, dist / 300));
    });
  }

  // Track boundary enforcement: solid tire barriers and guardrails prevent riding off map!
  enforceTrackBounds(player, dt, particles) {
    const closest = this.getClosestTrackPoint(player.x, player.y);
    const trackHalfWidth = this.trackWidth / 2;
    const barrierDist = trackHalfWidth + 30; // 130px from centerline

    // 1. Solid Outer & Inner Tire Barriers (Cannot drive off the track!)
    if (closest.dist > barrierDist) {
      const pushAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
      player.x = closest.x - Math.cos(pushAngle) * (barrierDist - 4);
      player.y = closest.y - Math.sin(pushAngle) * (barrierDist - 4);

      // Bounce off the barrier
      player.speed = -player.speed * 0.35;
      if (Math.abs(player.speed) < 0.5) player.speed = 0;

      // Sparks & sound
      if (particles) {
        particles.createCrashSparks(player.x, player.y);
      }
      if (this.bumpCooldown <= 0) {
        audio.playWallBump();
        this.bumpCooldown = 0.25;
      }
    } else if (closest.dist > trackHalfWidth) {
      // 2. Off-road Grass Slowdown (encourages staying on the asphalt)
      player.speed *= 0.95;
      if (particles && Math.random() < 0.25) {
        particles.createSmoke(player.x, player.y, 0, 0, 'rgba(46, 139, 87, 0.4)');
      }
    }

    // 3. Absolute Arena Clamp (prevents leaving the 2600x2200 stadium)
    player.x = Math.max(60, Math.min(2540, player.x));
    player.y = Math.max(60, Math.min(2140, player.y));

    // 4. Wrong-Way Warning Detection
    if (Math.abs(player.speed) > 1.2) {
      const headingDiff = Math.abs(this.normalizeAngle(player.angle - closest.dirAngle));
      if (headingDiff > 2.0) { // Facing wrong direction (>115 degrees off)
        this.wrongWayTimer += dt;
        if (this.wrongWayTimer > 0.8) {
          this.isWrongWay = true;
        }
      } else {
        this.wrongWayTimer = 0;
        this.isWrongWay = false;
      }
    } else {
      this.wrongWayTimer = 0;
      this.isWrongWay = false;
    }
  }

  // Find exact closest point and tangent angle on track centerline
  getClosestTrackPoint(x, y) {
    let minChildDist = Infinity;
    let bestPoint = { x: this.waypoints[0].x, y: this.waypoints[0].y, dist: 0, dirAngle: 0 };

    for (let i = 0; i < this.waypoints.length; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[(i + 1) % this.waypoints.length];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) continue;

      let t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const d = Math.hypot(x - projX, y - projY);

      if (d < minChildDist) {
        minChildDist = d;
        bestPoint = {
          x: projX,
          y: projY,
          dist: d,
          dirAngle: Math.atan2(dy, dx),
          segmentIndex: i
        };
      }
    }

    return bestPoint;
  }

  // Friendly bumper-car collisions with AI cars in race mode
  checkRaceCarCollisions(player, particles) {
    this.aiRacers.forEach(ai => {
      const dist = Math.hypot(player.x - ai.x, player.y - ai.y);
      if (dist < 44) {
        // Nudge apart
        const angle = Math.atan2(player.y - ai.y, player.x - ai.x);
        player.x += Math.cos(angle) * 4;
        player.y += Math.sin(angle) * 4;
        ai.x -= Math.cos(angle) * 4;
        ai.y -= Math.sin(angle) * 4;

        player.speed *= 0.88;

        if (this.bumpCooldown <= 0) {
          audio.playWallBump();
          this.bumpCooldown = 0.25;
        }

        if (particles) {
          particles.createCrashSparks((player.x + ai.x) / 2, (player.y + ai.y) / 2);
        }
      }
    });
  }

  // Instant Reset to Track (if Charlotte ever gets turned around)
  resetPlayerToTrack(player) {
    const closest = this.getClosestTrackPoint(player.x, player.y);
    player.x = closest.x;
    player.y = closest.y;
    player.angle = closest.dirAngle;
    player.speed = 2.0;
    player.vx = Math.cos(player.angle) * 2.0;
    player.vy = Math.sin(player.angle) * 2.0;
    player.invincibleTimer = 1.0;
    this.isWrongWay = false;
    this.wrongWayTimer = 0;
  }

  updatePlayerProgress(player) {
    const targetWp = this.waypoints[this.playerNextCp];
    const dist = Math.hypot(targetWp.x - player.x, targetWp.y - player.y);

    const nextIndex = (this.playerNextCp + 1) % this.waypoints.length;
    const nextWp = this.waypoints[nextIndex];
    const distNext = Math.hypot(nextWp.x - player.x, nextWp.y - player.y);

    // Advanced checkpoint trigger: reached current OR clipped into next
    if (dist < 220 || distNext < 200) {
      this.playerNextCp = nextIndex;

      // Completed a full lap!
      if (this.playerNextCp === 1) {
        this.playerLap++;
        if (this.playerLap <= this.totalLaps) {
          audio.playCollectOrb(); // Lap chime
        }
      }
    }

    // Player continuous progress metric
    player.totalProgress = (this.playerLap - 1) * this.waypoints.length + this.playerNextCp + (1 - Math.min(1, dist / 300));
  }

  updateLeaderboard(player) {
    // Sort all 6 racers by totalProgress descending
    const racers = [
      { isPlayer: true, progress: player.totalProgress },
      ...this.aiRacers.map(ai => ({ isPlayer: false, progress: ai.totalProgress }))
    ];

    racers.sort((a, b) => b.progress - a.progress);

    const playerIndex = racers.findIndex(r => r.isPlayer);
    this.playerPlace = playerIndex + 1; // 1 to 6
  }

  finishRace(player, particles) {
    this.state = 'finished';
    audio.playVictory();

    // Create massive victory confetti
    if (particles) {
      particles.createVictoryConfetti(player.x, player.y);
    }

    // Calculate rewards
    let cashReward = 20;
    let ptsReward = 10;
    let placeTitle = `${this.playerPlace}th Place`;
    let placeIcon = '🏁';

    if (this.playerPlace === 1) {
      cashReward = 150;
      ptsReward = 50;
      placeTitle = '🥇 1st Place Champion!';
      placeIcon = '🏆';
    } else if (this.playerPlace === 2) {
      cashReward = 75;
      ptsReward = 25;
      placeTitle = '🥈 2nd Place Silver!';
      placeIcon = '🥈';
    } else if (this.playerPlace === 3) {
      cashReward = 40;
      ptsReward = 15;
      placeTitle = '🥉 3rd Place Bronze!';
      placeIcon = '🥉';
    }

    // Award player
    player.cash += cashReward;
    player.points += ptsReward;

    // Show Results Modal
    setTimeout(() => {
      const resultsModal = document.getElementById('results-modal');
      const placeText = document.getElementById('race-results-place');
      const iconText = document.getElementById('race-results-icon');
      const cashText = document.getElementById('race-prize-cash');
      const ptsText = document.getElementById('race-prize-pts');

      if (placeText) placeText.textContent = placeTitle;
      if (iconText) iconText.textContent = placeIcon;
      if (cashText) cashText.textContent = `+$${cashReward}`;
      if (ptsText) ptsText.textContent = `+${ptsReward} PTS`;
      if (resultsModal) resultsModal.classList.add('active');
    }, 1200);
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }
}
