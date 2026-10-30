/**
 * Charlotte's Moto Cat Rush - Procedural Graphics Renderer & Particle System
 * Draws high-detail canvas visuals for motorcycle, rider, sidecar, cats, cars, city, and track.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
  }

  addSkid(x, y, angle, width = 6) {
    if (this.skidMarks.length > 300) this.skidMarks.shift();
    this.skidMarks.push({
      x, y, angle, width, alpha: 0.35, life: 600
    });
  }

  createSmoke(x, y, vx, vy, color = 'rgba(200, 200, 200, 0.4)') {
    this.particles.push({
      type: 'smoke',
      x, y,
      vx: vx + (Math.random() - 0.5) * 1.5,
      vy: vy + (Math.random() - 0.5) * 1.5,
      size: 4 + Math.random() * 4,
      maxSize: 16 + Math.random() * 8,
      alpha: 0.5,
      decay: 0.02 + Math.random() * 0.01,
      color: color
    });
  }

  createNitroFlame(x, y, angle) {
    const spread = (Math.random() - 0.5) * 0.4;
    const speed = -(8 + Math.random() * 6);
    this.particles.push({
      type: 'nitro',
      x, y,
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed,
      size: 6 + Math.random() * 5,
      alpha: 0.9,
      decay: 0.06,
      color: Math.random() < 0.5 ? '#00f0ff' : '#ff3366'
    });
  }

  createCrashSparks(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        color: Math.random() < 0.5 ? '#ffaa00' : '#ff3300'
      });
    }
  }

  createOrbBurst(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        type: 'sparkle',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        alpha: 1.0,
        decay: 0.025,
        color: '#ffdd00'
      });
    }
  }

  createVictoryConfetti(x, y) {
    const colors = ['#ff477e', '#05d9e8', '#ffc837', '#00f076', '#9d4edd', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 12;
      this.particles.push({
        type: 'confetti',
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 6,
        alpha: 1.0,
        decay: 0.012,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  update() {
    // Update Skid marks
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const sm = this.skidMarks[i];
      sm.life--;
      sm.alpha = (sm.life / 600) * 0.35;
      if (sm.life <= 0) this.skidMarks.splice(i, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= p.decay;

      if (p.type === 'smoke') {
        p.size += (p.maxSize - p.size) * 0.08;
      }
      if (p.type === 'confetti') {
        p.rot += p.rotSpeed;
        p.vy += 0.15; // Gravity
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw Skid marks
    this.skidMarks.forEach(sm => {
      ctx.save();
      ctx.translate(sm.x, sm.y);
      ctx.rotate(sm.angle);
      ctx.fillStyle = `rgba(15, 15, 20, ${sm.alpha})`;
      ctx.fillRect(-6, -sm.width / 2, 12, sm.width);
      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new ParticleSystem();

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      shake: 0
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  updateCamera(targetX, targetY) {
    // Smooth camera damping
    this.camera.x += (targetX - this.width / 2 - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.height / 2 - this.camera.y) * 0.1;

    // Apply screen shake
    if (this.camera.shake > 0) {
      this.camera.shake *= 0.9;
      if (this.camera.shake < 0.5) this.camera.shake = 0;
    }
  }

  triggerScreenShake(amount = 18) {
    this.camera.shake = amount;
  }

  clear() {
    this.ctx.fillStyle = '#0f121e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // ========================================================
  // RENDER CITY MODE
  // ========================================================
  drawCity(city) {
    const ctx = this.ctx;
    ctx.save();

    // Apply Camera transform with Shake
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 1. Draw Ground Base
    ctx.fillStyle = '#141829';
    ctx.fillRect(0, 0, city.worldWidth, city.worldHeight);

    // 2. Draw City Blocks (Buildings & Parks)
    city.blocks.forEach(b => {
      if (b.type === 'park') {
        // Lush green park
        ctx.fillStyle = '#1d4328';
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Park paths
        ctx.fillStyle = '#65737e';
        ctx.fillRect(b.x + b.w / 2 - 18, b.y, 36, b.h);
        ctx.fillRect(b.x, b.y + b.h / 2 - 18, b.w, 36);

        // Central fountain
        const fcX = b.x + b.w / 2;
        const fcY = b.y + b.h / 2;
        ctx.fillStyle = '#394b59';
        ctx.beginPath();
        ctx.arc(fcX, fcY, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#05d9e8';
        ctx.beginPath();
        ctx.arc(fcX, fcY, 48, 0, Math.PI * 2);
        ctx.fill();

        // Water ripple
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fcX, fcY, 32 + (Date.now() * 0.02) % 12, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Building Rooftop
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; // Drop shadow
        ctx.fillRect(b.x + 8, b.y + 12, b.w, b.h);

        ctx.fillStyle = b.roofColor;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Roof borders & details
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);

        // Rooftop AC units / Helipads
        ctx.fillStyle = '#353c52';
        ctx.fillRect(b.x + 30, b.y + 30, 45, 35);
        ctx.fillRect(b.x + b.w - 75, b.y + 30, 45, 35);

        // Helipad circle on some
        if (b.w > 200 && b.h > 200) {
          const hX = b.x + b.w / 2;
          const hY = b.y + b.h / 2;
          ctx.strokeStyle = '#ffc837';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hX, hY, 35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffc837';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', hX, hY);
        }
      }
    });

    // 3. Draw Roads (Asphalt + Markings)
    // Sidewalks
    ctx.fillStyle = '#404961';
    city.hRoads.forEach(ry => {
      ctx.fillRect(0, ry - city.roadWidth / 2 - 14, city.worldWidth, city.roadWidth + 28);
    });
    city.vRoads.forEach(rx => {
      ctx.fillRect(rx - city.roadWidth / 2 - 14, 0, city.roadWidth + 28, city.worldHeight);
    });

    // Dark Asphalt
    ctx.fillStyle = '#1c202d';
    city.hRoads.forEach(ry => {
      ctx.fillRect(0, ry - city.roadWidth / 2, city.worldWidth, city.roadWidth);
    });
    city.vRoads.forEach(rx => {
      ctx.fillRect(rx - city.roadWidth / 2, 0, city.roadWidth, city.worldHeight);
    });

    // Road markings: Yellow center lines
    ctx.strokeStyle = '#ffbe0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    city.hRoads.forEach(ry => {
      ctx.beginPath();
      ctx.moveTo(0, ry);
      ctx.lineTo(city.worldWidth, ry);
      ctx.stroke();
    });
    city.vRoads.forEach(rx => {
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, city.worldHeight);
      ctx.stroke();
    });
    ctx.setLineDash([]); // Reset line dash

    // Crosswalks at intersections
    city.hRoads.forEach(ry => {
      city.vRoads.forEach(rx => {
        const offset = city.roadWidth / 2;
        this.drawCrosswalk(ctx, rx - offset, ry, 'v');
        this.drawCrosswalk(ctx, rx + offset, ry, 'v');
        this.drawCrosswalk(ctx, rx, ry - offset, 'h');
        this.drawCrosswalk(ctx, rx, ry + offset, 'h');
      });
    });

    // 4. Draw Trees
    city.trees.forEach(t => {
      // Tree shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(t.x + 4, t.y + 6, t.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tree foliage layers
      ctx.fillStyle = t.variant === 0 ? '#1b5e20' : (t.variant === 1 ? '#2e7d32' : '#388e3c');
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(t.x - 3, t.y - 3, t.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Draw Street Lamps & ambient light cones
    city.streetLamps.forEach(lamp => {
      // Subtle light glow
      const grad = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, 42);
      grad.addColorStop(0, 'rgba(255, 235, 150, 0.25)');
      grad.addColorStop(1, 'rgba(255, 235, 150, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 42, 0, Math.PI * 2);
      ctx.fill();

      // Lamp post head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Skid marks & particles on ground
    this.particles.draw(ctx);

    // 7. Draw Yellow Orbs
    city.orbs.forEach(orb => {
      this.drawYellowOrb(ctx, orb);
    });

    // 8. Draw The 5 Cars
    city.cars.forEach(car => {
      this.drawCar(ctx, car);
    });

    // 9. Draw Floating texts
    city.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  drawCrosswalk(ctx, x, y, dir) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const count = 5;
    const stripeW = 6;
    const stripeL = 26;
    for (let i = -count / 2; i <= count / 2; i++) {
      if (dir === 'v') {
        ctx.fillRect(x - stripeL / 2, y + i * 14 - stripeW / 2, stripeL, stripeW);
      } else {
        ctx.fillRect(x + i * 14 - stripeW / 2, y - stripeL / 2, stripeW, stripeL);
      }
    }
  }

  // ========================================================
  // RENDER GRAND PRIX RACE TRACK
  // ========================================================
  drawRaceTrack(race) {
    const ctx = this.ctx;
    ctx.save();

    // Camera transform with Shake
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 1. Lush Green Grass Infield & Outfield
    ctx.fillStyle = '#163820';
    ctx.fillRect(0, 0, 2600, 2200);

    // Decorative grass stripes
    ctx.fillStyle = '#1c4527';
    for (let gy = 0; gy < 2200; gy += 120) {
      ctx.fillRect(0, gy, 2600, 60);
    }

    // 2. Outer Stadium Perimeter Wall & Safety Fences (Bounds of the Arena)
    ctx.strokeStyle = '#3d4b60';
    ctx.lineWidth = 18;
    ctx.strokeRect(30, 30, 2540, 2140);

    // Warning hazard stripes on arena perimeter wall
    ctx.strokeStyle = '#ffc837';
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 20]);
    ctx.strokeRect(30, 30, 2540, 2140);
    ctx.setLineDash([]);

    // 3. Continuous Outer Tire Barriers (Physical & Visual Track Enclosure)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer Tire Wall (Black & White Tire stack base)
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = race.trackWidth + 64;
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();

    // Red & White Safety Curbs / Rumble Strips
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = race.trackWidth + 34;
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();

    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = race.trackWidth + 34;
    ctx.setLineDash([24, 24]);
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Main Asphalt Racing Surface
    ctx.strokeStyle = '#191d28';
    ctx.lineWidth = race.trackWidth;
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();

    // White Outer Track Boundary Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();

    // 5. Track Directional Arrows & Lane Guides (Points Charlotte in the right direction!)
    ctx.strokeStyle = 'rgba(255, 200, 55, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 45]);
    this.drawTrackPath(ctx, race.waypoints);
    ctx.stroke();
    ctx.setLineDash([]);

    // Painted Neon Forward Arrows along track straightaways
    for (let i = 0; i < race.waypoints.length; i++) {
      const wp1 = race.waypoints[i];
      const wp2 = race.waypoints[(i + 1) % race.waypoints.length];
      const midX = (wp1.x + wp2.x) / 2;
      const midY = (wp1.y + wp2.y) / 2;
      const angle = Math.atan2(wp2.y - wp1.y, wp2.x - wp1.x);

      this.drawTrackArrow(ctx, midX, midY, angle);
    }

    // 6. Start / Finish Line & Overhead Gantry
    const startWp = race.waypoints[0];
    const nextWp = race.waypoints[1];
    const angle = Math.atan2(nextWp.y - startWp.y, nextWp.x - startWp.x);
    const perp = angle + Math.PI / 2;

    ctx.save();
    ctx.translate(startWp.x, startWp.y);
    ctx.rotate(perp);
    const lineLen = race.trackWidth;
    const sqSize = 14;
    for (let row = -1; row <= 1; row++) {
      for (let col = -lineLen / 2; col < lineLen / 2; col += sqSize) {
        ctx.fillStyle = (Math.floor(col / sqSize) + row) % 2 === 0 ? '#ffffff' : '#0a0d14';
        ctx.fillRect(col, row * sqSize - sqSize / 2, sqSize, sqSize);
      }
    }
    // Overhead Finish Gantry Posts
    ctx.fillStyle = '#ff477e';
    ctx.fillRect(-lineLen / 2 - 12, -18, 24, 36);
    ctx.fillRect(lineLen / 2 - 12, -18, 24, 36);
    ctx.restore();

    // 7. Cheering Grandstand with Spectators near start
    this.drawGrandstand(ctx, 650, 180, 500, 80);

    // 8. Skidmarks & particles
    this.particles.draw(ctx);

    // 9. AI Racers (5 cars)
    race.aiRacers.forEach(ai => {
      this.drawCar(ctx, ai);
    });

    ctx.restore();

    // 10. Countdown Overlay
    if (race.state === 'countdown') {
      this.drawRaceCountdown(race.countdownTimer);
    }

    // 11. "WRONG WAY!" Alert Banner if driving backwards
    if (race.isWrongWay && race.state === 'racing') {
      this.drawWrongWayAlert();
    }
  }

  // Draw forward neon chevron arrow on asphalt
  drawTrackArrow(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255, 230, 80, 0.45)';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -18);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-12, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw spectator grandstand
  drawGrandstand(ctx, x, y, w, h) {
    ctx.save();
    // Stand roof
    ctx.fillStyle = '#21283d';
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffc837';
    ctx.lineWidth = 3;
    ctx.stroke();

    // "GRAND PRIX" text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 CHARLOTTE GRAND PRIX ARENA 🏁', x + w / 2, y + 32);

    // Cheering crowd dots
    const colors = ['#ff477e', '#05d9e8', '#ffc837', '#00f076', '#e0aaff', '#ffffff'];
    for (let cx = x + 20; cx < x + w - 20; cx += 16) {
      ctx.fillStyle = colors[Math.floor((cx + Date.now() * 0.005) % colors.length)];
      ctx.beginPath();
      ctx.arc(cx, y + 58, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Flashing "WRONG WAY" warning
  drawWrongWayAlert() {
    const ctx = this.ctx;
    ctx.save();
    const flash = Math.sin(Date.now() * 0.015) > 0;
    const bgCol = flash ? 'rgba(230, 40, 60, 0.92)' : 'rgba(180, 20, 40, 0.85)';

    ctx.fillStyle = bgCol;
    this.roundRect(ctx, this.width / 2 - 190, 85, 380, 52, 16);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️ WRONG WAY! ↩️', this.width / 2, 111);
    ctx.restore();
  }

  drawTrackPath(ctx, waypoints) {
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    // Close loop back to start
    const last = waypoints[waypoints.length - 1];
    const first = waypoints[0];
    ctx.quadraticCurveTo(last.x, last.y, first.x, first.y);
    ctx.closePath();
  }

  drawRaceCountdown(timer) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 72px sans-serif';

    const sec = Math.ceil(timer);
    let text = sec.toString();
    let color = '#ff477e';

    if (timer <= 0.8 && timer > 0) {
      text = 'GO!';
      color = '#00f076';
    }

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText(text, this.width / 2 + 4, this.height / 2 - 80 + 4);

    ctx.fillStyle = color;
    ctx.fillText(text, this.width / 2, this.height / 2 - 80);
    ctx.restore();
  }

  // ========================================================
  // RENDER YELLOW ORB
  // ========================================================
  drawYellowOrb(ctx, orb) {
    ctx.save();
    const bobY = Math.sin(orb.bobOffset) * 4;
    const x = orb.x;
    const y = orb.y + bobY;

    // Glowing aura
    const glow = ctx.createRadialGradient(x, y, 4, x, y, orb.radius * 2.2);
    glow.addColorStop(0, 'rgba(255, 230, 80, 0.85)');
    glow.addColorStop(0.5, 'rgba(255, 180, 0, 0.45)');
    glow.addColorStop(1, 'rgba(255, 140, 0, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, orb.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Solid core
    ctx.fillStyle = '#ffde59';
    ctx.beginPath();
    ctx.arc(x, y, orb.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Center bright sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, orb.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Sparkling 4-point star
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    const starSize = 7;
    ctx.beginPath();
    ctx.moveTo(x - starSize, y);
    ctx.lineTo(x + starSize, y);
    ctx.moveTo(x, y - starSize);
    ctx.lineTo(x, y + starSize);
    ctx.stroke();

    ctx.restore();
  }

  // ========================================================
  // RENDER CAR (THE 5 CARS: RED, BLUE, GREEN, YELLOW, BLACK)
  // Vastly upgraded top-tier 2.5D arcade graphics!
  // ========================================================
  drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    const length = car.length || 84;
    const width = car.width || 44;
    const isTaxi = car.color === '#ffc837' || (car.name && car.name.toLowerCase().includes('taxi'));
    const isRed = car.color === '#ff2a6d' || (car.name && car.name.toLowerCase().includes('red'));
    const isBlue = car.color === '#2575fc' || (car.name && car.name.toLowerCase().includes('blue'));
    const isGreen = car.color === '#00f076' || (car.name && car.name.toLowerCase().includes('green'));
    const isBlack = car.color === '#111111' || car.color === '#1a1d24' || (car.name && car.name.toLowerCase().includes('black'));

    // 1. Dynamic Road Underglow
    let underglowCol = null;
    if (isGreen) underglowCol = 'rgba(0, 240, 118, 0.45)';
    else if (isBlack) underglowCol = 'rgba(157, 78, 221, 0.45)';
    else if (isRed) underglowCol = 'rgba(255, 42, 109, 0.4)';
    else if (isBlue) underglowCol = 'rgba(37, 117, 252, 0.4)';
    else if (isTaxi) underglowCol = 'rgba(255, 200, 55, 0.35)';

    if (underglowCol) {
      ctx.save();
      ctx.shadowColor = underglowCol;
      ctx.shadowBlur = 18;
      ctx.fillStyle = underglowCol;
      this.roundRect(ctx, -length * 0.42, -width * 0.42, length * 0.84, width * 0.84, 10);
      ctx.fill();
      ctx.restore();
    }

    // 2. Realistic Ground Shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.roundRect(ctx, -length / 2 + 3, -width / 2 + 4, length, width, 12);
    ctx.fill();

    // 3. Projector Headlight Beams (Forward road projection)
    const beamLen = 145;
    const beamSpread = width * 1.35;
    const beamGrad = ctx.createRadialGradient(length / 2, 0, 15, length / 2 + beamLen, 0, beamLen);
    const beamTint = isBlue ? 'rgba(180, 225, 255, 0.4)' : (isTaxi ? 'rgba(255, 240, 180, 0.4)' : 'rgba(255, 250, 225, 0.38)');
    beamGrad.addColorStop(0, beamTint);
    beamGrad.addColorStop(0.5, beamTint.replace('0.4', '0.14').replace('0.38', '0.12'));
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(length / 2 - 2, -width / 2 + 5);
    ctx.lineTo(length / 2 + beamLen, -beamSpread);
    ctx.lineTo(length / 2 + beamLen, beamSpread);
    ctx.lineTo(length / 2 - 2, width / 2 - 5);
    ctx.closePath();
    ctx.fill();

    // 4. Wheels & Alloy Rims with Dynamic Steering Camber
    const steerDelta = car.targetAngle ? Math.max(-0.4, Math.min(0.4, (car.targetAngle - car.angle))) : 0;
    const wheelW = 18;
    const wheelH = 8;
    const rimStyle = isBlue ? 'star_chrome' : (isGreen ? 'gold_mesh' : (isBlack ? 'sport_alloys' : 'star_chrome'));
    const caliperCol = isRed ? '#ff0033' : (isGreen ? '#00f076' : (isBlack ? '#9d4edd' : '#ffc837'));

    // Rear Wheels
    this.renderWheel(ctx, -length / 2 + 15, -width / 2 - 2, wheelW, wheelH, 0, rimStyle, caliperCol);
    this.renderWheel(ctx, -length / 2 + 15, width / 2 - 6, wheelW, wheelH, 0, rimStyle, caliperCol);

    // Front Wheels (Turn with steering angle!)
    this.renderWheel(ctx, length / 2 - 20, -width / 2 - 2, wheelW, wheelH, steerDelta, rimStyle, caliperCol);
    this.renderWheel(ctx, length / 2 - 20, width / 2 - 6, wheelW, wheelH, steerDelta, rimStyle, caliperCol);

    // 5. Sculpted Main Body & Metallic Clear Coat
    const bodyGrad = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
    if (isBlack) {
      bodyGrad.addColorStop(0, '#2e3542');
      bodyGrad.addColorStop(0.3, '#171b24');
      bodyGrad.addColorStop(0.7, '#0d0f14');
      bodyGrad.addColorStop(1, '#1c202a');
    } else if (isTaxi) {
      bodyGrad.addColorStop(0, '#ffe566');
      bodyGrad.addColorStop(0.3, '#ffc837');
      bodyGrad.addColorStop(0.8, '#e6a800');
      bodyGrad.addColorStop(1, '#ffc837');
    } else if (isRed) {
      bodyGrad.addColorStop(0, '#ff5c8a');
      bodyGrad.addColorStop(0.3, '#ff2a6d');
      bodyGrad.addColorStop(0.7, '#d90448');
      bodyGrad.addColorStop(1, '#ff2a6d');
    } else if (isBlue) {
      bodyGrad.addColorStop(0, '#5fa0ff');
      bodyGrad.addColorStop(0.3, '#2575fc');
      bodyGrad.addColorStop(0.8, '#1052c9');
      bodyGrad.addColorStop(1, '#2575fc');
    } else { // Green
      bodyGrad.addColorStop(0, '#38ef7d');
      bodyGrad.addColorStop(0.3, '#00f076');
      bodyGrad.addColorStop(0.8, '#08a855');
      bodyGrad.addColorStop(1, '#00f076');
    }

    // Chassis body
    ctx.fillStyle = bodyGrad;
    this.roundRect(ctx, -length / 2, -width / 2, length, width, 12);
    ctx.fill();

    // 3D Metallic Edge Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Front Splitter / Lip
    ctx.fillStyle = '#111319';
    this.roundRect(ctx, length / 2 - 4, -width / 2 + 4, 6, width - 8, 3);
    ctx.fill();

    // Rear Carbon Diffuser
    ctx.fillStyle = '#0f1116';
    this.roundRect(ctx, -length / 2 - 3, -width / 2 + 5, 5, width - 10, 2);
    ctx.fill();

    // 6. Distinctive Car Details & Liveries
    if (isTaxi) {
      // Checkerboard Racing / Cab pattern
      this.drawCheckeredFlanks(ctx, -length * 0.35, -width / 2, length * 0.7, width);
      // Heavy chrome bumper guards
      ctx.fillStyle = '#c5cdd8';
      ctx.fillRect(length / 2 - 2, -width * 0.3, 4, width * 0.6);
      ctx.fillRect(-length / 2 - 2, -width * 0.3, 4, width * 0.6);
      // 3D Illuminated Rooftop TAXI Dome
      this.drawTaxiDome(ctx, 0, 0);
    } else if (isBlue) {
      // Dual pearl white racing stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-length / 2, -8, length, 5);
      ctx.fillRect(-length / 2, 3, length, 5);
    } else if (isRed) {
      // Dual matte-black stripes + Carbon GT Wing
      ctx.fillStyle = 'rgba(20, 20, 25, 0.85)';
      ctx.fillRect(-length / 2, -7, length, 4);
      ctx.fillRect(-length / 2, 3, length, 4);
      // High-downforce Carbon GT Wing
      this.drawCarbonGTWing(ctx, -length / 2 - 6, -width / 2 + 2, 7, width - 4, '#ff2a6d');
    } else if (isGreen) {
      // Neon green cyber tuner side skirts & black accent roof
      ctx.fillStyle = '#003816';
      ctx.fillRect(-length * 0.25, -width / 2 - 1, length * 0.5, 3);
      ctx.fillRect(-length * 0.25, width / 2 - 2, length * 0.5, 3);
    } else if (isBlack) {
      // Stealth violet pinstripes
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-length * 0.35, -width * 0.35, length * 0.7, width * 0.7);
    }

    // 7. Glass Cockpit & Realistic Glare Reflections
    this.drawGlassCockpit(ctx, length, width, isBlack ? '#0d1117' : '#141c2b');

    // 8. Front Headlights & Xenon Projectors
    this.drawProjectorHeadlights(ctx, length, width, isBlue ? '#d0e8ff' : '#fff9d6');

    // 9. Rear LED Taillight Bar (Glow bright crimson if braking)
    this.drawTaillights(ctx, length, width, car.isBraking);

    // 10. Polished Dual / Quad Exhaust Tips
    this.drawExhaustTips(ctx, length, width, (isBlack || isRed) ? 4 : 2);

    ctx.restore();
  }

  // ========================================================
  // SHARED CAR RENDERING HELPERS (WHEELS, LIGHTS, GLASS, WINGS)
  // ========================================================
  renderWheel(ctx, x, y, w, h, steerAngle = 0, style = 'star_chrome', caliperColor = '#ff0033') {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (steerAngle !== 0) ctx.rotate(steerAngle);

    // Rubber Tire with tread grooves
    ctx.fillStyle = '#16181d';
    this.roundRect(ctx, -w / 2, -h / 2, w, h, 3);
    ctx.fill();

    // Tire tread lines
    ctx.fillStyle = '#0b0c0e';
    ctx.fillRect(-w / 2 + 3, -h / 2, 2, h);
    ctx.fillRect(-w / 2 + 7, -h / 2, 2, h);
    ctx.fillRect(-w / 2 + 11, -h / 2, 2, h);

    // Brake Rotor (Silver disc)
    ctx.fillStyle = '#8a94a6';
    ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.7);

    // Brake Caliper
    ctx.fillStyle = caliperColor;
    ctx.fillRect(w * 0.05, -h * 0.45, w * 0.25, h * 0.4);

    // Alloy Rim Design
    if (style === 'gold_mesh') {
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-w * 0.32, -h * 0.3, w * 0.64, h * 0.6);
      ctx.fillStyle = '#b38200';
      ctx.fillRect(-w * 0.15, -h * 0.2, w * 0.3, h * 0.4);
    } else if (style === 'neon_halo') {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.strokeRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.6);
      ctx.shadowBlur = 0;
    } else if (style === 'sport_alloys') {
      ctx.fillStyle = '#333945';
      ctx.fillRect(-w * 0.35, -h * 0.3, w * 0.7, h * 0.6);
    } else {
      // Star Chrome (Default)
      ctx.fillStyle = '#e8edf5';
      ctx.fillRect(-w * 0.35, -h * 0.25, w * 0.7, h * 0.5);
      // Spokes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -h * 0.35, 2, h * 0.7);
      ctx.fillRect(-w * 0.3, -1, w * 0.6, 2);
    }

    // Chrome Center Cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGlassCockpit(ctx, length, width, glassTint = '#141c2b', tintType = 'limo_dark') {
    // Glass Base Color
    let glassColor = glassTint;
    if (tintType === 'cyber_blue') glassColor = 'rgba(0, 180, 255, 0.45)';
    else if (tintType === 'sunset_gold') glassColor = 'rgba(255, 180, 50, 0.45)';
    else if (tintType === 'clear') glassColor = 'rgba(180, 210, 240, 0.35)';

    ctx.fillStyle = glassColor;

    // Windshield (Aero curve)
    ctx.beginPath();
    ctx.moveTo(length * 0.12, -width * 0.38);
    ctx.lineTo(length * 0.28, -width * 0.32);
    ctx.lineTo(length * 0.28, width * 0.32);
    ctx.lineTo(length * 0.12, width * 0.38);
    ctx.closePath();
    ctx.fill();

    // Rear Window
    this.roundRect(ctx, -length * 0.32, -width * 0.33, length * 0.14, width * 0.66, 3);
    ctx.fill();

    // Side Windows
    ctx.fillRect(-length * 0.18, -width * 0.41, length * 0.28, 4);
    ctx.fillRect(-length * 0.18, width * 0.41 - 4, length * 0.28, 4);

    // Roof Panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.roundRect(ctx, -length * 0.18, -width * 0.33, length * 0.34, width * 0.66, 4);
    ctx.fill();

    // Diagonal Glass Specular Reflection Glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.moveTo(length * 0.24, -width * 0.28);
    ctx.lineTo(length * 0.27, -width * 0.25);
    ctx.lineTo(length * 0.15, width * 0.32);
    ctx.lineTo(length * 0.12, width * 0.29);
    ctx.closePath();
    ctx.fill();

    // Twin Bucket Seat Headrests inside
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(-length * 0.06, -width * 0.24, 8, 8);
    ctx.fillRect(-length * 0.06, width * 0.24 - 8, 8, 8);
  }

  drawProjectorHeadlights(ctx, length, width, lightColor = '#fff9d6') {
    // Crystal Xenon Lenses
    ctx.fillStyle = lightColor;
    ctx.shadowColor = lightColor;
    ctx.shadowBlur = 8;

    // Left & Right Headlights
    this.roundRect(ctx, length / 2 - 3, -width / 2 + 4, 4, 9, 2);
    ctx.fill();
    this.roundRect(ctx, length / 2 - 3, width / 2 - 13, 4, 9, 2);
    ctx.fill();

    // Inner Xenon Core Dots
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(length / 2 - 1, -width / 2 + 7, 2, 3);
    ctx.fillRect(length / 2 - 1, width / 2 - 10, 2, 3);

    ctx.shadowBlur = 0;
  }

  drawTaillights(ctx, length, width, isBraking = false, isReversing = false) {
    if (isBraking) {
      // Intense Ruby LED Flare
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff0033';
      this.roundRect(ctx, -length / 2 - 2, -width / 2 + 4, 4, width - 8, 2);
      ctx.fill();

      // Taillight core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-length / 2 - 1, -width / 2 + 6, 2, 6);
      ctx.fillRect(-length / 2 - 1, width / 2 - 12, 2, 6);
      ctx.shadowBlur = 0;
    } else {
      // Modern Sleek LED Taillight Bar
      ctx.fillStyle = '#8a0a1a';
      this.roundRect(ctx, -length / 2 - 1, -width / 2 + 4, 3, width - 8, 2);
      ctx.fill();

      // Outer clusters
      ctx.fillStyle = '#ff1133';
      ctx.fillRect(-length / 2 - 1, -width / 2 + 5, 3, 7);
      ctx.fillRect(-length / 2 - 1, width / 2 - 12, 3, 7);
    }

    // Reversing Backup White LEDs
    if (isReversing) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-length / 2 - 1, -3, 3, 6);
      ctx.shadowBlur = 0;
    }
  }

  drawExhaustTips(ctx, length, width, tipCount = 2, isNitro = false) {
    ctx.fillStyle = '#bcc5d3'; // Polished titanium
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;

    const tipR = 2.5;
    const yOffsets = tipCount === 4
      ? [-width * 0.32, -width * 0.22, width * 0.22, width * 0.32]
      : [-width * 0.26, width * 0.26];

    yOffsets.forEach(yOff => {
      ctx.beginPath();
      ctx.arc(-length / 2 - 1.5, yOff, tipR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner bore
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.arc(-length / 2 - 1.5, yOff, tipR * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Nitro exhaust flame jets
      if (isNitro) {
        ctx.fillStyle = Math.random() < 0.5 ? '#00f0ff' : '#ff0055';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-length / 2 - 3, yOff - 2);
        ctx.lineTo(-length / 2 - 16 - Math.random() * 12, yOff);
        ctx.lineTo(-length / 2 - 3, yOff + 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  drawCarbonGTWing(ctx, x, y, depth, span, accentColor = '#ff2a6d') {
    // Mounting Struts
    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(x + 4, y + span * 0.25, 6, 3);
    ctx.fillRect(x + 4, y + span * 0.75 - 3, 6, 3);

    // Carbon Wing Main Blade
    const bladeGrad = ctx.createLinearGradient(x, 0, x + depth, 0);
    bladeGrad.addColorStop(0, '#101318');
    bladeGrad.addColorStop(0.5, '#262d3a');
    bladeGrad.addColorStop(1, '#0e1116');
    ctx.fillStyle = bladeGrad;
    this.roundRect(ctx, x, y, depth, span, 2);
    ctx.fill();

    // Aerodynamic Endplates with accent color
    ctx.fillStyle = accentColor;
    ctx.fillRect(x - 2, y - 2, depth + 3, 3);
    ctx.fillRect(x - 2, y + span - 1, depth + 3, 3);
  }

  drawCheckeredFlanks(ctx, x, y, len, w) {
    const squareSize = 5;
    const cols = Math.floor(len / squareSize);
    for (let c = 0; c < cols; c++) {
      const isWhite = c % 2 === 0;
      ctx.fillStyle = isWhite ? '#ffffff' : '#111111';
      // Top Flank
      ctx.fillRect(x + c * squareSize, y + 1, squareSize, squareSize);
      // Bottom Flank
      ctx.fillStyle = isWhite ? '#111111' : '#ffffff';
      ctx.fillRect(x + c * squareSize, y + w - squareSize - 1, squareSize, squareSize);
    }
  }

  drawTaxiDome(ctx, x, y) {
    ctx.save();
    // Glowing warm amber aura
    ctx.shadowColor = 'rgba(255, 200, 50, 0.8)';
    ctx.shadowBlur = 12;

    // Dome base
    ctx.fillStyle = '#fffdf0';
    this.roundRect(ctx, x - 7, y - 11, 14, 22, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#e6a800';
    ctx.lineWidth = 1;
    ctx.stroke();

    // "TAXI" lettering
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAXI', x, y);
    ctx.restore();
  }

  // ========================================================
  // RENDER PLAYER (MOTORCYCLE + RIDER + SIDECAR + CAT!)
  // ========================================================
  drawPlayer(player) {
    const ctx = this.ctx;
    ctx.save();

    // Camera transform with Shake
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    // 1. Draw Magnetic Beams from Pet / Charlotte to Attracted Orbs
    if (player.magneticTethers && player.magneticTethers.length > 0) {
      ctx.save();
      const beamTime = Date.now() * 0.01;
      player.magneticTethers.forEach(t => {
        ctx.strokeStyle = t.color || '#ffc837';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -beamTime * 12;
        ctx.shadowColor = t.color || '#ffc837';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(t.fromX, t.fromY);
        ctx.lineTo(t.toX, t.toY);
        ctx.stroke();

        // Magnetic energy spark along the tether
        const pulseRatio = (Math.sin(beamTime * 3) + 1) / 2;
        const sparkX = t.fromX + (t.toX - t.fromX) * pulseRatio;
        const sparkY = t.fromY + (t.toY - t.fromY) * pulseRatio;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // If flashing after collision
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Check if player is driving a car or motorcycle
    const isCarVehicle = player.vehicle && player.vehicle.type === 'car';

    if (isCarVehicle) {
      // Draw the selected variety of car!
      this.drawPlayerCar(ctx, player);
    } else {
      // Draw Charlotte's Man on the Motorcycle (with Sidecar for Pet!)
      this.drawMotorcycleRider(ctx, player);
    }

    // Draw Pet if accompanied in Car Mode (Cruising joyfully alongside)
    if (isCarVehicle && player.pet) {
      this.drawPetCompanion(ctx, player);
    }

    // Complex Engine Visuals: Exhaust Flames, Plasma, or V8 Smoke
    this.drawEngineEffects(ctx, player);

    // Reinforced Bumper Shield Bubble
    if (player.hasActiveShield) {
      ctx.save();
      const shieldPulse = Math.sin(Date.now() * 0.006) * 3;
      ctx.strokeStyle = 'rgba(5, 217, 232, 0.85)';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(5, 217, 232, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, 52 + shieldPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shield badge
      ctx.fillStyle = '#05d9e8';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', 0, -45);
      ctx.restore();
    }

    // Golden Hypercar Cosmic Aura
    if (player.vehicle && player.vehicle.id === 'veh_golden') {
      const goldPulse = Math.sin(Date.now() * 0.008) * 4;
      ctx.strokeStyle = 'rgba(255, 200, 55, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 54 + goldPulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Complex Engine Flame / Plasma / Smoke Exhaust Effects
  drawEngineEffects(ctx, player) {
    const engine = player.engine;
    if (!engine || Math.abs(player.speed) < 1.0) return;

    const isAccel = window.game && window.game.keys && window.game.keys.up;
    const isNitro = player.isNitroActive;
    if (!isAccel && !isNitro) return;

    ctx.save();
    const veh = player.vehicle || {};
    const rearX = (veh.type === 'car') ? -(veh.length || 88) / 2 : -28;

    if (engine.id === 'eng_v12_grandprix' || engine.id === 'eng_v8_muscle') {
      // Spitting orange/blue exhaust backfire flames
      const flameLength = isNitro ? 26 : 14 + Math.random() * 8;
      const flameGrad = ctx.createLinearGradient(rearX, 0, rearX - flameLength, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#ffaa00');
      flameGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');

      ctx.fillStyle = flameGrad;
      // Twin exhaust pipes
      [-12, 12].forEach(offsetY => {
        ctx.beginPath();
        ctx.moveTo(rearX, offsetY - 3);
        ctx.lineTo(rearX - flameLength, offsetY);
        ctx.lineTo(rearX, offsetY + 3);
        ctx.closePath();
        ctx.fill();
      });
    } else if (engine.id === 'eng_electric_quantum') {
      // Cyan Quantum Arc Glow
      const arcPulse = Math.sin(Date.now() * 0.03) * 6;
      ctx.strokeStyle = '#05d9e8';
      ctx.shadowColor = '#05d9e8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rearX, 0, 16 + arcPulse, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    } else if (engine.id === 'eng_turbo_boxer') {
      // Turbo spool blue flame tip
      ctx.fillStyle = 'rgba(5, 217, 232, 0.7)';
      [-8, 8].forEach(offsetY => {
        ctx.beginPath();
        ctx.arc(rearX - 6, offsetY, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  drawMotorcycleRider(ctx, player) {
    // 1. Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 32, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wheels
    ctx.fillStyle = '#111111';
    // Rear wheel
    ctx.fillRect(-26, -5, 18, 10);
    // Front wheel (steers dynamically)
    ctx.save();
    ctx.translate(22, 0);
    ctx.rotate(player.steerVisual * 0.4);
    ctx.fillRect(-8, -5, 18, 10);
    ctx.restore();

    // 3. Chassis & Chrome Exhaust
    ctx.fillStyle = '#718096';
    ctx.fillRect(-20, -8, 24, 3);
    ctx.fillRect(-20, 5, 24, 3);

    // Bike Frame
    ctx.fillStyle = player.vehicle ? player.vehicle.color : '#ff477e';
    this.roundRect(ctx, -14, -6, 32, 12, 4);
    ctx.fill();

    // Gas tank accent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, -4, 12, 8);

    // 4. Handlebars
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(12, -14, 4, 28);
    // Grips
    ctx.fillStyle = '#111';
    ctx.fillRect(11, -15, 6, 4);
    ctx.fillRect(11, 11, 6, 4);

    // 5. The Rider (Man on the motorcycle)
    ctx.fillStyle = '#1a202c'; // Leather riding jacket
    this.roundRect(ctx, -12, -7, 18, 14, 5);
    ctx.fill();

    // Arms gripping handlebars
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(12, -12);
    ctx.moveTo(-4, 6);
    ctx.lineTo(12, 12);
    ctx.stroke();

    // Rider's Helmet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Visor
    ctx.fillStyle = '#05d9e8';
    ctx.beginPath();
    ctx.arc(3, 0, 7, -Math.PI / 3, Math.PI / 3);
    ctx.fill();

    // Visor shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, -2, 3, 4);

    // 6. Front Headlight beam
    const headBeam = ctx.createRadialGradient(28, 0, 5, 130, 0, 110);
    headBeam.addColorStop(0, 'rgba(255, 255, 200, 0.45)');
    headBeam.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = headBeam;
    ctx.beginPath();
    ctx.moveTo(28, -6);
    ctx.lineTo(130, -50);
    ctx.lineTo(130, 50);
    ctx.lineTo(28, 6);
    ctx.closePath();
    ctx.fill();

    // 7. Motorcycle Sidecar for Charlotte's Equipped Pet!
    if (player.pet) {
      this.drawMotorcycleSidecar(ctx, player);
    }
  }

  // Draw Sidecar on Motorcycle holding Charlotte's Pet!
  drawMotorcycleSidecar(ctx, player) {
    const pet = player.pet;
    const bounce = (player.petBounce || 0);

    // Connecting chrome struts
    ctx.fillStyle = '#718096';
    ctx.fillRect(-10, 6, 4, 15);
    ctx.fillRect(8, 6, 4, 15);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-2, 23, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sidecar wheel on right
    ctx.fillStyle = '#111111';
    ctx.fillRect(-14, 33, 20, 7);
    ctx.fillStyle = '#cbd5e0';
    ctx.fillRect(-8, 34, 8, 5); // Wheel rim

    // Sidecar chassis body (matching bike colors)
    ctx.fillStyle = player.vehicle ? player.vehicle.color : '#ff477e';
    this.roundRect(ctx, -20, 13, 38, 20, 9);
    ctx.fill();

    // Sidecar aerodynamic interior
    ctx.fillStyle = '#1a202c';
    this.roundRect(ctx, -14, 15, 24, 16, 7);
    ctx.fill();

    // Little aero windshield
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 23, 7, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Draw the pet sitting inside the sidecar!
    this.drawPet(ctx, pet, -2, 23, true, bounce);
  }

  // Draw Pet Companion running / gliding alongside Car
  drawPetCompanion(ctx, player) {
    const pet = player.pet;
    const bounce = (player.petBounce || 0);
    const speed = Math.abs(player.speed);

    // Bobbing running gait
    const gait = Math.sin(Date.now() * 0.012 * (speed > 0.5 ? 1.5 : 0.8)) * 3;
    const petX = 6;
    const petY = 36 + gait;

    // Small running shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(petX, petY + 12, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pet
    this.drawPet(ctx, pet, petX, petY, false, bounce);
  }

  // Detailed Procedural Pet Visuals & Custom Name Tag!
  drawPet(ctx, pet, x, y, isSidecar, bounce = 0) {
    if (!pet) return;

    ctx.save();
    ctx.translate(x, y - bounce * 8);

    const now = Date.now();
    const earWiggle = Math.sin(now * 0.008) * 0.12;
    const tailWag = Math.sin(now * 0.016) * 0.35;

    // 1. Pet Body & Head rendering based on species
    if (pet.id === 'pet_cat') {
      // 🐱 Fluffy Kitty (Mochi)
      // Body
      ctx.fillStyle = '#ffb3c6';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, 4, 5, 0, Math.PI * 2);
      ctx.arc(3, 4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Pointy Ears
      ctx.fillStyle = '#ff758f';
      // Left ear
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.lineTo(-12, -15 + earWiggle * 10);
      ctx.lineTo(-3, -8);
      ctx.closePath();
      ctx.fill();
      // Right ear
      ctx.beginPath();
      ctx.moveTo(3, -8);
      ctx.lineTo(12, -15 - earWiggle * 10);
      ctx.lineTo(9, -4);
      ctx.closePath();
      ctx.fill();

      // Pink ear centers
      ctx.fillStyle = '#ff477e';
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(-11, -12);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(11, -12);
      ctx.lineTo(8, -5);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#06d6a0'; // Emerald green cat eyes
      ctx.beginPath();
      ctx.arc(-4, -1, 3, 0, Math.PI * 2);
      ctx.arc(4, -1, 3, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 1.2, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Pink Nose & Whiskers
      ctx.fillStyle = '#ff477e';
      ctx.beginPath();
      ctx.arc(0, 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Whiskers
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 2); ctx.lineTo(-11, 0);
      ctx.moveTo(-3, 3); ctx.lineTo(-11, 4);
      ctx.moveTo(3, 2); ctx.lineTo(11, 0);
      ctx.moveTo(3, 3); ctx.lineTo(11, 4);
      ctx.stroke();

      // Tail
      if (!isSidecar) {
        ctx.strokeStyle = '#ffb3c6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-9, 4);
        ctx.quadraticCurveTo(-16 + tailWag * 8, 6, -18, -4);
        ctx.stroke();
      }
    } else if (pet.id === 'pet_dog') {
      // 🐶 Golden Pup (Daisy)
      // Body
      ctx.fillStyle = '#ffc837';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Floppy Ears
      ctx.fillStyle = '#d49b14';
      ctx.beginPath();
      ctx.ellipse(-10, -2 + Math.abs(earWiggle) * 4, 5, 10, -0.2, 0, Math.PI * 2);
      ctx.ellipse(10, -2 + Math.abs(earWiggle) * 4, 5, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle
      ctx.fillStyle = '#ffe082';
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Black button nose
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Happy open tongue
      ctx.fillStyle = '#ff477e';
      ctx.beginPath();
      ctx.arc(0, 7, 2.5, 0, Math.PI);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#2d1b00';
      ctx.beginPath();
      ctx.arc(-4, -1, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 1, 0, Math.PI * 2);
      ctx.arc(3, -2, 1, 0, Math.PI * 2);
      ctx.fill();

      // Red Collar
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(-6, 8, 12, 3);
      // Gold Bell
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(0, 11, 2, 0, Math.PI * 2);
      ctx.fill();

      // Wagging tail
      if (!isSidecar) {
        ctx.strokeStyle = '#ffc837';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.quadraticCurveTo(-14 + tailWag * 12, 10, -17, 3);
        ctx.stroke();
      }
    } else if (pet.id === 'pet_bunny') {
      // 🐰 Cosmic Bunny (Starhop)
      // Body
      ctx.fillStyle = '#e0aaff';
      ctx.beginPath();
      ctx.arc(0, 2, 11, 0, Math.PI * 2);
      ctx.fill();

      // Long Tall Upright Ears
      ctx.fillStyle = '#c77dff';
      ctx.beginPath();
      ctx.ellipse(-5, -13, 3.5, 11, -0.15 + earWiggle, 0, Math.PI * 2);
      ctx.ellipse(5, -13, 3.5, 11, 0.15 - earWiggle, 0, Math.PI * 2);
      ctx.fill();

      // Pink ear glow
      ctx.fillStyle = '#ff9ebb';
      ctx.beginPath();
      ctx.ellipse(-5, -13, 2, 8, -0.15 + earWiggle, 0, Math.PI * 2);
      ctx.ellipse(5, -13, 2, 8, 0.15 - earWiggle, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, 5, 4, 0, Math.PI * 2);
      ctx.arc(3, 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cosmic Star Eyes
      ctx.fillStyle = '#5a189a';
      ctx.beginPath();
      ctx.arc(-4, 0, 2.5, 0, Math.PI * 2);
      ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -1, 1.2, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Pink Nose
      ctx.fillStyle = '#ff477e';
      ctx.beginPath();
      ctx.arc(0, 3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting Star Dust
      const starAng = now * 0.005;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(Math.cos(starAng) * 16, Math.sin(starAng) * 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pet.id === 'pet_fox') {
      // 🦊 Cyber Fox (Flash)
      // Body
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Pointy Fox Ears
      ctx.fillStyle = '#2b2d42';
      ctx.beginPath();
      ctx.moveTo(-8, -4); ctx.lineTo(-12, -16); ctx.lineTo(-3, -7); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3, -7); ctx.lineTo(12, -16); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();

      // White Cheek Fluffs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-11, 1); ctx.lineTo(-6, 7); ctx.lineTo(-1, 3); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(11, 1); ctx.lineTo(6, 7); ctx.lineTo(1, 3); ctx.closePath(); ctx.fill();

      // High-Tech Cyber Visor
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(-7, -3, 14, 5);
      ctx.shadowBlur = 0;

      // Bushy Neon Cyber Tail
      if (!isSidecar) {
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.ellipse(-14, 6 + tailWag * 4, 8, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(-19, 4 + tailWag * 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pet.id === 'pet_dragon') {
      // 🐲 Spark Dragon (Sparky)
      // Body
      ctx.fillStyle = '#06d6a0';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Gold Dragon Horns
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(-7, -6); ctx.lineTo(-11, -16); ctx.lineTo(-3, -9); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3, -9); ctx.lineTo(11, -16); ctx.lineTo(7, -6); ctx.closePath(); ctx.fill();

      // Cute Little Wings that flap!
      const wingFlap = Math.sin(now * 0.02) * 6;
      ctx.fillStyle = '#118ab2';
      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(-18, -12 + wingFlap); ctx.lineTo(-12, 3); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, 0); ctx.lineTo(18, -12 + wingFlap); ctx.lineTo(12, 3); ctx.closePath(); ctx.fill();

      // Big Sparkly Dragon Eyes
      ctx.fillStyle = '#8338ec';
      ctx.beginPath();
      ctx.arc(-4, -1, 3.2, 0, Math.PI * 2);
      ctx.arc(4, -1, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 1.4, 0, Math.PI * 2);
      ctx.arc(3, -2, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Little cute flame spark from snout
      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.arc(0, 7, 2.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (pet.id === 'pet_unicorn') {
      // 🦄 Magic Unicorn (Twinkle)
      // Body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 2, 12, 0, Math.PI * 2);
      ctx.fill();

      // Spiral Golden Rainbow Horn
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffc837';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-3, -7); ctx.lineTo(0, -21); ctx.lineTo(3, -7); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Rainbow Mane
      const rainbowColors = ['#ff477e', '#ffbe0b', '#00f076', '#05d9e8', '#9d4edd'];
      rainbowColors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(-8 + idx * 4, -9, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Eyes
      ctx.fillStyle = '#3a86ff';
      ctx.beginPath();
      ctx.arc(-4, 1, 3, 0, Math.PI * 2);
      ctx.arc(4, 1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, 0, 1.3, 0, Math.PI * 2);
      ctx.arc(3, 0, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Pink muzzle & sparkle
      ctx.fillStyle = '#ffb3c6';
      ctx.beginPath();
      ctx.arc(0, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Procedural Cute Pet Creature for Forest, Circus, and Cosmic Pets!
      const petColor = pet.color || '#ffc837';

      // Rarity Aura Shimmer for High Rarities
      if (pet.rarity === 'Mythic' || pet.rarity === 'Ultra Mythic' || pet.rarity === 'Ultra Legendary') {
        ctx.save();
        const auraPulse = Math.sin(now * 0.008) * 3;
        ctx.strokeStyle = (pet.rarity === 'Ultra Mythic') ? '#ffe600' : (pet.rarity === 'Mythic' ? '#ff00cc' : '#ff3366');
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + auraPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Creature Body
      ctx.fillStyle = petColor;
      ctx.beginPath();
      ctx.arc(0, 1, 12, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-5, 4, 3.5, 0, Math.PI * 2);
      ctx.arc(5, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Emoji Species Icon in center
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pet.icon || '🐾', 0, 1);

      // Cute Little Ears
      ctx.fillStyle = petColor;
      ctx.beginPath();
      ctx.arc(-8, -9 + earWiggle * 4, 4, 0, Math.PI * 2);
      ctx.arc(8, -9 - earWiggle * 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Pet Name Tag Bubble with Rarity Color Border!
    const petName = pet.customName || pet.defaultName || pet.name;
    const rarityColor = pet.rarityColor || '#ffc837';
    ctx.font = 'bold 10px system-ui, sans-serif';
    const tagWidth = ctx.measureText(petName).width + 18;
    const tagY = -24;

    // Tag background
    ctx.fillStyle = 'rgba(12, 16, 32, 0.9)';
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 2;
    this.roundRect(ctx, -tagWidth / 2, tagY - 7, tagWidth, 15, 7);
    ctx.fill();
    ctx.stroke();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(petName, 0, tagY);

    ctx.restore();
  }

  // ========================================================
  // RENDER PLAYER'S CAR (WITH CUSTOM STYLING & GRAPHICS OPTIONS)
  // ========================================================
  drawPlayerCar(ctx, player) {
    const veh = player.vehicle || { color: '#ff0055', variant: 'gt' };
    const carLength = veh.length || 88;
    const carWidth = veh.width || 46;

    // Get Active Customization Options (from player or game)
    const custom = (this.game && this.game.carCustomization) || player.customization || {
      paintColor: veh.color || '#ff007f',
      paintFinish: 'metallic',
      underglow: 'pink',
      livery: 'twin_stripes',
      spoiler: 'gt_wing',
      rimStyle: 'star_chrome',
      caliperColor: '#ff0033',
      windowTint: 'limo_dark',
      headlightGlow: 'xenon_white',
      graphicsQuality: 'ultra'
    };

    const isBraking = (this.game && this.game.keys && this.game.keys.down) || false;
    const isReversing = isBraking && player.speed < -0.2;
    const isNitro = player.isNitroActive || false;
    const steerAngle = (player.steerVisual || 0) * 0.45;

    // 1. Dynamic Road Underglow
    this.renderCarUnderglow(ctx, carLength, carWidth, custom.underglow, custom.paintColor);

    // 2. Drop Shadow & Ambient Ground Occlusion
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.roundRect(ctx, -carLength / 2 + 3, -carWidth / 2 + 4, carLength, carWidth, 12);
    ctx.fill();

    // 3. Projector Headlight Beams (Forward road projection)
    this.renderHeadlightBeams(ctx, carLength, carWidth, custom.headlightGlow);

    // 4. Wheels with Dynamic Steering Camber, Rims & Calipers
    const wheelW = 18;
    const wheelH = 8.5;
    const rimStyle = custom.rimStyle || 'star_chrome';
    const caliperCol = custom.caliperColor || '#ff0033';

    // Rear Wheels (fixed)
    this.renderWheel(ctx, -carLength / 2 + 15, -carWidth / 2 - 2, wheelW, wheelH, 0, rimStyle, caliperCol);
    this.renderWheel(ctx, -carLength / 2 + 15, carWidth / 2 - 6.5, wheelW, wheelH, 0, rimStyle, caliperCol);

    // Front Wheels (Physically angle with Charlotte's steering!)
    this.renderWheel(ctx, carLength / 2 - 20, -carWidth / 2 - 2, wheelW, wheelH, steerAngle, rimStyle, caliperCol);
    this.renderWheel(ctx, carLength / 2 - 20, carWidth / 2 - 6.5, wheelW, wheelH, steerAngle, rimStyle, caliperCol);

    // 5. Main Body by Variant (Formula, Golden Hypercar, Muscle, or Turbo GT / Drift Coupe)
    if (veh.variant === 'formula') {
      this.drawFormulaCarBody(ctx, carLength, carWidth, custom, steerAngle);
    } else if (veh.variant === 'muscle') {
      this.drawMuscleCarBody(ctx, carLength, carWidth, custom);
    } else if (veh.variant === 'golden') {
      this.drawGoldenHypercarBody(ctx, carLength, carWidth, custom, isBraking);
    } else {
      // GT Race Car & Drift Coupe
      this.drawGTCarBody(ctx, carLength, carWidth, custom);
    }

    // 6. Selected Racing Livery & Decals
    this.drawCarLivery(ctx, carLength, carWidth, custom.livery, veh.variant);

    // 7. Glass Cockpit with Selected Tint
    if (veh.variant !== 'formula') {
      this.drawGlassCockpit(ctx, carLength, carWidth, '#141c2b', custom.windowTint);
    }

    // 8. Selected Rear Spoiler & Aerodynamics
    if (veh.variant !== 'formula' && veh.variant !== 'golden') {
      this.drawSelectedSpoiler(ctx, carLength, carWidth, custom.spoiler, custom.paintColor);
    }

    // 9. Headlight Projectors
    let headColor = '#ffffff';
    if (custom.headlightGlow === 'cyber_cyan') headColor = '#00f0ff';
    else if (custom.headlightGlow === 'amber_gold') headColor = '#ffc837';
    else if (custom.headlightGlow === 'laser_pink') headColor = '#ff007f';
    this.drawProjectorHeadlights(ctx, carLength, carWidth, headColor);

    // 10. Rear Taillights (Intense glow on brake)
    this.drawTaillights(ctx, carLength, carWidth, isBraking, isReversing);

    // 11. Dual / Quad Exhaust Tips & Nitro Boost Flames
    const tipCount = (veh.variant === 'formula' || veh.variant === 'golden') ? 2 : 4;
    this.drawExhaustTips(ctx, carLength, carWidth, tipCount, isNitro);
  }

  // ========================================================
  // CAR BODY VARIANT RENDERERS
  // ========================================================
  drawGTCarBody(ctx, length, width, custom) {
    const baseColor = custom.paintColor || '#ff007f';

    // Body Gradient based on paint finish
    ctx.fillStyle = this.createPaintStyle(ctx, -width / 2, width / 2, baseColor, custom.paintFinish);
    this.roundRect(ctx, -length / 2, -width / 2, length, width, 11);
    ctx.fill();

    // 3D Clear Coat Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Front Aerodynamic Carbon Splitter
    ctx.fillStyle = '#0f1116';
    this.roundRect(ctx, length / 2 - 5, -width / 2 + 3, 7, width - 6, 3);
    ctx.fill();

    // Side Aero Skirts
    ctx.fillStyle = '#151922';
    ctx.fillRect(-length * 0.28, -width / 2 - 1, length * 0.56, 2.5);
    ctx.fillRect(-length * 0.28, width / 2 - 1.5, length * 0.56, 2.5);

    // Hood Heat Extractors / Louvers
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(length * 0.12, -8, 12, 3);
    ctx.fillRect(length * 0.12, 5, 12, 3);
    ctx.fillRect(length * 0.18, -7, 8, 2);
    ctx.fillRect(length * 0.18, 5, 8, 2);
  }

  drawMuscleCarBody(ctx, length, width, custom) {
    const baseColor = custom.paintColor || '#3a86ff';

    ctx.fillStyle = this.createPaintStyle(ctx, -width / 2, width / 2, baseColor, custom.paintFinish);
    this.roundRect(ctx, -length / 2, -width / 2, length, width, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Reinforced Steel Pushbar Bumper
    ctx.fillStyle = '#d0d7de';
    ctx.fillRect(length / 2 - 3, -width * 0.35, 5, width * 0.7);
    ctx.fillStyle = '#111';
    ctx.fillRect(length / 2 - 2, -width * 0.2, 4, width * 0.4);

    // Hood Supercharger Blower Scoop with Butterfly Valves
    ctx.fillStyle = '#222733';
    this.roundRect(ctx, length * 0.08, -8, 16, 16, 3);
    ctx.fill();

    ctx.fillStyle = '#ff0033'; // Red butterfly valves
    ctx.beginPath();
    ctx.arc(length * 0.08 + 12, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(length * 0.08 + 12, 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoldenHypercarBody(ctx, length, width, custom, isBraking) {
    // Liquid Gold Chrome Mirror Gradient
    const goldGrad = ctx.createLinearGradient(-length / 2, -width / 2, length / 2, width / 2);
    goldGrad.addColorStop(0, '#ffbe0b');
    goldGrad.addColorStop(0.3, '#fff4b8');
    goldGrad.addColorStop(0.6, '#fb5607');
    goldGrad.addColorStop(0.85, '#ffbe0b');
    goldGrad.addColorStop(1, '#ffeed0');

    ctx.fillStyle = goldGrad;
    this.roundRect(ctx, -length / 2, -width / 2, length, width, 14);
    ctx.fill();

    // Specular border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Exposed Carbon Inserts
    ctx.fillStyle = '#11141c';
    ctx.beginPath();
    ctx.moveTo(length * 0.15, -width * 0.4);
    ctx.lineTo(length * 0.32, -width * 0.3);
    ctx.lineTo(length * 0.32, width * 0.3);
    ctx.lineTo(length * 0.15, width * 0.4);
    ctx.closePath();
    ctx.fill();

    // Active Aero Golden Spoiler (Tilts when braking)
    const wingOffset = isBraking ? -length / 2 - 10 : -length / 2 - 6;
    ctx.fillStyle = '#ffbe0b';
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 8;
    this.roundRect(ctx, wingOffset, -width / 2 + 2, 7, width - 4, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawFormulaCarBody(ctx, length, width, custom, steerAngle) {
    const baseColor = custom.paintColor || '#05d9e8';

    // Multi-plane Front Aerodynamic Wing
    ctx.fillStyle = '#12151c';
    this.roundRect(ctx, length / 2 - 6, -width / 2 - 2, 10, width + 4, 2);
    ctx.fill();
    // Front wing flap in car color
    ctx.fillStyle = baseColor;
    ctx.fillRect(length / 2 - 4, -width / 2, 5, width);

    // Front Wing Endplates
    ctx.fillStyle = baseColor;
    ctx.fillRect(length / 2 - 7, -width / 2 - 3, 12, 2.5);
    ctx.fillRect(length / 2 - 7, width / 2 + 0.5, 12, 2.5);

    // Tapered Formula Monocoque Body Chassis
    ctx.fillStyle = this.createPaintStyle(ctx, -width / 2, width / 2, baseColor, custom.paintFinish);
    ctx.beginPath();
    ctx.moveTo(length / 2 + 8, 0); // Sharp nose cone
    ctx.lineTo(length * 0.15, -width * 0.32);
    ctx.lineTo(-length * 0.25, -width * 0.35); // Sidepods
    ctx.lineTo(-length / 2, -width * 0.3);
    ctx.lineTo(-length / 2, width * 0.3);
    ctx.lineTo(-length * 0.25, width * 0.35);
    ctx.lineTo(length * 0.15, width * 0.32);
    ctx.closePath();
    ctx.fill();

    // Sidepod Radiator Air Intakes
    ctx.fillStyle = '#0a0d13';
    ctx.fillRect(-length * 0.05, -width * 0.32, 14, 5);
    ctx.fillRect(-length * 0.05, width * 0.32 - 5, 14, 5);

    // Cockpit & Titanium Safety Halo
    ctx.fillStyle = '#080a0f';
    this.roundRect(ctx, -length * 0.08, -width * 0.2, 20, width * 0.4, 6);
    ctx.fill();

    // Driver Helmet (Charlotte's Racing Helmet!)
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(-2, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Helmet Visor reflection
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(2, 0, 4.5, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.fill();

    // Halo Structure
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-1, 0, 9.5, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    // Airbox Overhead Intake
    ctx.fillStyle = '#1a202c';
    this.roundRect(ctx, -length * 0.18, -4, 10, 8, 3);
    ctx.fill();

    // High-mount Dual-Deck Rear Wing
    ctx.fillStyle = '#12151c';
    this.roundRect(ctx, -length / 2 - 10, -width / 2 - 1, 10, width + 2, 2);
    ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.fillRect(-length / 2 - 8, -width / 2 + 1, 6, width - 2);

    // Rear Flashing Safety Rain / ERS LED
    const isFlashing = Math.floor(Date.now() / 250) % 2 === 0;
    if (isFlashing) {
      ctx.fillStyle = '#ff0033';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 10;
      ctx.fillRect(-length / 2 - 11, -3, 3, 6);
      ctx.shadowBlur = 0;
    }
  }

  createPaintStyle(ctx, y1, y2, color, finish) {
    if (finish === 'matte') {
      const g = ctx.createLinearGradient(0, y1, 0, y2);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color);
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      return g;
    } else if (finish === 'pearlescent') {
      const g = ctx.createLinearGradient(0, y1, 0, y2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.2, color);
      g.addColorStop(0.7, '#ff00d4'); // iridescent secondary shift
      g.addColorStop(1, color);
      return g;
    } else if (finish === 'gold') {
      const g = ctx.createLinearGradient(0, y1, 0, y2);
      g.addColorStop(0, '#fff4b8');
      g.addColorStop(0.35, '#ffbe0b');
      g.addColorStop(0.75, '#fb5607');
      g.addColorStop(1, '#ffbe0b');
      return g;
    } else {
      // Metallic Gloss
      const g = ctx.createLinearGradient(0, y1, 0, y2);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      g.addColorStop(0.25, color);
      g.addColorStop(0.75, color);
      g.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      return g;
    }
  }

  renderCarUnderglow(ctx, length, width, underglowType, customColor = '#ff007f') {
    if (!underglowType || underglowType === 'none') return;

    let glowColor = '#ff007f';
    if (underglowType === 'pink') glowColor = '#ff007f';
    else if (underglowType === 'cyan') glowColor = '#00f0ff';
    else if (underglowType === 'lime') glowColor = '#00f59b';
    else if (underglowType === 'gold') glowColor = '#ffb703';
    else if (underglowType === 'purple') glowColor = '#9d4edd';
    else if (underglowType === 'rainbow') glowColor = `hsl(${(Date.now() / 12) % 360}, 100%, 55%)`;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = glowColor;
    this.roundRect(ctx, -length * 0.42, -width * 0.42, length * 0.84, width * 0.84, 12);
    ctx.fill();

    // Hot inner core
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.roundRect(ctx, -length * 0.32, -width * 0.32, length * 0.64, width * 0.64, 8);
    ctx.fill();
    ctx.restore();
  }

  renderHeadlightBeams(ctx, length, width, glowType) {
    let beamTint = 'rgba(255, 255, 255, 0.4)';
    if (glowType === 'cyber_cyan') beamTint = 'rgba(0, 240, 255, 0.45)';
    else if (glowType === 'amber_gold') beamTint = 'rgba(255, 200, 50, 0.45)';
    else if (glowType === 'laser_pink') beamTint = 'rgba(255, 0, 127, 0.45)';

    const beamLen = 150;
    const beamSpread = width * 1.35;
    const beamGrad = ctx.createRadialGradient(length / 2, 0, 15, length / 2 + beamLen, 0, beamLen);
    beamGrad.addColorStop(0, beamTint);
    beamGrad.addColorStop(0.45, beamTint.replace('0.45', '0.15').replace('0.4', '0.12'));
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(length / 2 - 2, -width / 2 + 5);
    ctx.lineTo(length / 2 + beamLen, -beamSpread);
    ctx.lineTo(length / 2 + beamLen, beamSpread);
    ctx.lineTo(length / 2 - 2, width / 2 - 5);
    ctx.closePath();
    ctx.fill();
  }

  drawCarLivery(ctx, length, width, liveryType, variant) {
    if (!liveryType || liveryType === 'none' || variant === 'formula') return;

    if (liveryType === 'twin_stripes') {
      // Dual GT Racing Stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-length / 2, -8, length, 4.5);
      ctx.fillRect(-length / 2, 3.5, length, 4.5);
      // Thin black borders
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(-length / 2, -8.5, length, 0.8);
      ctx.fillRect(-length / 2, -3.5, length, 0.8);
      ctx.fillRect(-length / 2, 3, length, 0.8);
      ctx.fillRect(-length / 2, 8, length, 0.8);
    } else if (liveryType === 'gt_stripe') {
      // Single Bold Center Stripe
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-length / 2, -4.5, length, 9);
    } else if (liveryType === 'cyber_flames') {
      // Aerodynamic Cyber Flames
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(length * 0.35, -width * 0.3);
      ctx.lineTo(length * 0.1, -width * 0.38);
      ctx.lineTo(length * 0.18, -width * 0.2);
      ctx.lineTo(-length * 0.1, -width * 0.28);
      ctx.lineTo(length * 0.05, -width * 0.12);
      ctx.closePath();
      ctx.fill();

      // Mirror side
      ctx.beginPath();
      ctx.moveTo(length * 0.35, width * 0.3);
      ctx.lineTo(length * 0.1, width * 0.38);
      ctx.lineTo(length * 0.18, width * 0.2);
      ctx.lineTo(-length * 0.1, width * 0.28);
      ctx.lineTo(length * 0.05, width * 0.12);
      ctx.closePath();
      ctx.fill();
    } else if (liveryType === 'checkers') {
      this.drawCheckeredFlanks(ctx, -length * 0.35, -width / 2, length * 0.65, width);
    } else if (liveryType === 'stars') {
      ctx.fillStyle = '#ffffff';
      const starCoords = [
        { x: length * 0.2, y: -6 },
        { x: length * 0.1, y: 5 },
        { x: -length * 0.05, y: -7 },
        { x: -length * 0.2, y: 4 }
      ];
      starCoords.forEach(sc => {
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  drawSelectedSpoiler(ctx, length, width, spoilerType, accentColor) {
    if (!spoilerType || spoilerType === 'none') return;

    if (spoilerType === 'ducktail') {
      // Sleek Street Tuner Ducktail
      ctx.fillStyle = '#141822';
      this.roundRect(ctx, -length / 2 - 3, -width * 0.38, 4, width * 0.76, 2);
      ctx.fill();
    } else if (spoilerType === 'hyper_wing') {
      // Hypercar Dual-Deck Wing
      this.drawCarbonGTWing(ctx, -length / 2 - 8, -width / 2 + 1, 8, width - 2, accentColor);
      ctx.fillStyle = '#222';
      this.roundRect(ctx, -length / 2 - 4, -width * 0.35, 3, width * 0.7, 1);
      ctx.fill();
    } else {
      // Carbon GT Wing (Default)
      this.drawCarbonGTWing(ctx, -length / 2 - 7, -width / 2 + 2, 7, width - 4, accentColor);
    }
  }

  // ========================================================
  // LIVE 360 CAR PREVIEW RENDERER (FOR CHARLOTTE'S STYLING STUDIO)
  // ========================================================
  drawVehiclePreview(ctx, width, height, player, customization, previewAngle = 0, showLights = true) {
    ctx.clearRect(0, 0, width, height);

    // High-tech showroom floor grid
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, width, height);

    // Radial showroom spotlight
    const spotGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 180);
    spotGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    spotGrad.addColorStop(0.7, 'rgba(255, 0, 127, 0.05)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, width, height);

    // Floor reflection grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Save & center car
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1.25, 1.25);
    ctx.rotate(previewAngle);

    // Mock player with current customization
    const mockPlayer = {
      x: 0, y: 0,
      angle: 0,
      speed: 0,
      steerVisual: Math.sin(Date.now() * 0.003) * 0.3, // Gentle idle steering wobble
      vehicle: (player && player.vehicle) || { color: '#ff007f', variant: 'gt' },
      isNitroActive: false,
      customization: customization
    };

    if (mockPlayer.vehicle.type === 'car') {
      this.drawPlayerCar(ctx, mockPlayer);
    } else {
      this.drawMotorcycleRider(ctx, mockPlayer);
    }

    ctx.restore();
  }

  // ========================================================
  // MINIMAP RENDERER
  // ========================================================
  drawMinimap(minimapCanvas, city, race, player, isRaceMode) {
    const mctx = minimapCanvas.getContext('2d');
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;

    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = 'rgba(12, 16, 30, 0.9)';
    mctx.fillRect(0, 0, mw, mh);

    if (isRaceMode) {
      // Draw racetrack layout on minimap
      const scaleX = mw / 2600;
      const scaleY = mh / 2200;

      mctx.strokeStyle = '#445';
      mctx.lineWidth = 6;
      mctx.beginPath();
      race.waypoints.forEach((wp, idx) => {
        const mx = wp.x * scaleX;
        const my = wp.y * scaleY;
        if (idx === 0) mctx.moveTo(mx, my);
        else mctx.lineTo(mx, my);
      });
      mctx.closePath();
      mctx.stroke();

      // Draw AI racers
      race.aiRacers.forEach(ai => {
        mctx.fillStyle = ai.color;
        mctx.beginPath();
        mctx.arc(ai.x * scaleX, ai.y * scaleY, 3, 0, Math.PI * 2);
        mctx.fill();
      });

      // Draw Player
      mctx.fillStyle = '#00ffff';
      mctx.beginPath();
      mctx.arc(player.x * scaleX, player.y * scaleY, 5, 0, Math.PI * 2);
      mctx.fill();
    } else {
      // Draw City layout on minimap
      const scaleX = mw / city.worldWidth;
      const scaleY = mh / city.worldHeight;

      // Draw Roads
      mctx.fillStyle = '#333c52';
      city.hRoads.forEach(ry => {
        mctx.fillRect(0, (ry - city.roadWidth / 2) * scaleY, mw, city.roadWidth * scaleY);
      });
      city.vRoads.forEach(rx => {
        mctx.fillRect((rx - city.roadWidth / 2) * scaleX, 0, city.roadWidth * scaleX, mh);
      });

      // Draw Yellow Orbs
      mctx.fillStyle = '#ffc837';
      city.orbs.forEach(orb => {
        mctx.fillRect(orb.x * scaleX - 1, orb.y * scaleY - 1, 2, 2);
      });

      // Draw the 5 Cars
      city.cars.forEach(car => {
        mctx.fillStyle = car.color;
        mctx.beginPath();
        mctx.arc(car.x * scaleX, car.y * scaleY, 3.5, 0, Math.PI * 2);
        mctx.fill();
      });

      // Draw Player (Cyan Dot)
      mctx.fillStyle = '#00ffff';
      mctx.beginPath();
      mctx.arc(player.x * scaleX, player.y * scaleY, 5, 0, Math.PI * 2);
      mctx.fill();
    }
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
