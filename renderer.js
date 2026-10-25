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
  // RENDER CAR (THE 5 CARS)
  // ========================================================
  drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // 1. Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.roundRect(ctx, -car.length / 2 + 4, -car.width / 2 + 5, car.length, car.width, 10);
    ctx.fill();

    // 2. Headlight beams projecting forward
    const beamLen = 130;
    const beamGrad = ctx.createRadialGradient(car.length / 2, 0, 10, car.length / 2 + beamLen, 0, beamLen);
    beamGrad.addColorStop(0, 'rgba(255, 245, 170, 0.35)');
    beamGrad.addColorStop(1, 'rgba(255, 245, 170, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(car.length / 2, -car.width / 2 + 5);
    ctx.lineTo(car.length / 2 + beamLen, -car.width * 1.1);
    ctx.lineTo(car.length / 2 + beamLen, car.width * 1.1);
    ctx.lineTo(car.length / 2, car.width / 2 - 5);
    ctx.closePath();
    ctx.fill();

    // 3. Wheels (Tires)
    ctx.fillStyle = '#111111';
    const wheelW = 16;
    const wheelH = 7;
    // Rear wheels
    ctx.fillRect(-car.length / 2 + 10, -car.width / 2 - 3, wheelW, wheelH);
    ctx.fillRect(-car.length / 2 + 10, car.width / 2 - 4, wheelW, wheelH);
    // Front wheels (can angle slightly)
    ctx.fillRect(car.length / 2 - 24, -car.width / 2 - 3, wheelW, wheelH);
    ctx.fillRect(car.length / 2 - 24, car.width / 2 - 4, wheelW, wheelH);

    // 4. Car Body
    ctx.fillStyle = car.color;
    this.roundRect(ctx, -car.length / 2, -car.width / 2, car.length, car.width, 10);
    ctx.fill();

    // Outer highlight border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Windows & Windshield
    ctx.fillStyle = '#151e29'; // Dark tinted glass
    // Windshield
    ctx.beginPath();
    ctx.moveTo(car.length * 0.1, -car.width * 0.38);
    ctx.lineTo(car.length * 0.25, -car.width * 0.32);
    ctx.lineTo(car.length * 0.25, car.width * 0.32);
    ctx.lineTo(car.length * 0.1, car.width * 0.38);
    ctx.closePath();
    ctx.fill();

    // Rear window
    ctx.fillRect(-car.length * 0.28, -car.width * 0.34, car.length * 0.12, car.width * 0.68);

    // Side windows
    ctx.fillRect(-car.length * 0.14, -car.width * 0.42, car.length * 0.22, 4);
    ctx.fillRect(-car.length * 0.14, car.width * 0.42 - 4, car.length * 0.22, 4);

    // 6. Roof
    ctx.fillStyle = car.roofColor || car.color;
    this.roundRect(ctx, -car.length * 0.18, -car.width * 0.32, car.length * 0.36, car.width * 0.64, 4);
    ctx.fill();

    // 7. Special car details based on color
    if (car.color === '#ffc837') {
      // Yellow Taxi: Rooftop "TAXI" light
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -10, 12, 20);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('TAXI', -5, 3);
    } else if (car.color === '#ff2a6d') {
      // Red Speeder: Rear Spoiler
      ctx.fillStyle = '#b81446';
      ctx.fillRect(-car.length / 2 - 4, -car.width / 2 + 2, 6, car.width - 4);
    } else if (car.color === '#2575fc') {
      // Blue Cruiser: White Racing Stripe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-car.length / 2, -3, car.length, 6);
    }

    // 8. Front Headlights
    ctx.fillStyle = '#fff9a6';
    ctx.fillRect(car.length / 2 - 3, -car.width / 2 + 4, 4, 8);
    ctx.fillRect(car.length / 2 - 3, car.width / 2 - 12, 4, 8);

    // 9. Rear Brake Lights (Glow bright if braking)
    const brakeColor = car.isBraking ? '#ff0033' : '#880011';
    ctx.fillStyle = brakeColor;
    ctx.fillRect(-car.length / 2 - 1, -car.width / 2 + 4, 3, 8);
    ctx.fillRect(-car.length / 2 - 1, car.width / 2 - 12, 3, 8);

    if (car.isBraking) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 12;
      ctx.fillRect(-car.length / 2 - 1, -car.width / 2 + 4, 3, 8);
      ctx.fillRect(-car.length / 2 - 1, car.width / 2 - 12, 3, 8);
    }

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

  // Draw Player's selected Variety of Car!
  drawPlayerCar(ctx, player) {
    const veh = player.vehicle || { color: '#ff0055', variant: 'gt' };
    const carLength = veh.length || 88;
    const carWidth = veh.width || 46;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.roundRect(ctx, -carLength / 2 + 4, -carWidth / 2 + 5, carLength, carWidth, 8);
    ctx.fill();

    // Headlight beam
    const beamLen = 140;
    const beamGrad = ctx.createRadialGradient(carLength / 2, 0, 10, carLength / 2 + beamLen, 0, beamLen);
    beamGrad.addColorStop(0, 'rgba(255, 245, 170, 0.4)');
    beamGrad.addColorStop(1, 'rgba(255, 245, 170, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(carLength / 2, -carWidth / 2 + 4);
    ctx.lineTo(carLength / 2 + beamLen, -carWidth * 1.2);
    ctx.lineTo(carLength / 2 + beamLen, carWidth * 1.2);
    ctx.lineTo(carLength / 2, carWidth / 2 - 4);
    ctx.closePath();
    ctx.fill();

    // Tires
    ctx.fillStyle = '#111111';
    const wheelW = 16;
    const wheelH = 8;
    ctx.fillRect(-carLength / 2 + 10, -carWidth / 2 - 3, wheelW, wheelH);
    ctx.fillRect(-carLength / 2 + 10, carWidth / 2 - 5, wheelW, wheelH);

    // Front wheels turn with steering
    ctx.save();
    ctx.translate(carLength / 2 - 16, -carWidth / 2 + 1);
    ctx.rotate(player.steerVisual * 0.4);
    ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
    ctx.restore();

    ctx.save();
    ctx.translate(carLength / 2 - 16, carWidth / 2 - 1);
    ctx.rotate(player.steerVisual * 0.4);
    ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
    ctx.restore();

    // Body styling based on car variety
    if (veh.variant === 'formula') {
      // Formula 1 Race Car
      ctx.fillStyle = veh.color;
      ctx.beginPath();
      ctx.moveTo(carLength / 2 + 6, 0);
      ctx.lineTo(carLength * 0.15, -carWidth * 0.35);
      ctx.lineTo(-carLength / 2, -carWidth * 0.32);
      ctx.lineTo(-carLength / 2, carWidth * 0.32);
      ctx.lineTo(carLength * 0.15, carWidth * 0.35);
      ctx.closePath();
      ctx.fill();

      // Front Wing
      ctx.fillStyle = '#111';
      ctx.fillRect(carLength / 2 - 4, -carWidth / 2, 8, carWidth);

      // Rear Wing
      ctx.fillStyle = '#111';
      ctx.fillRect(-carLength / 2 - 8, -carWidth / 2, 8, carWidth);

      // Driver Helmet in Cockpit
      ctx.fillStyle = '#05d9e8';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (veh.variant === 'muscle') {
      // Heavy Muscle Car
      ctx.fillStyle = veh.color;
      this.roundRect(ctx, -carLength / 2, -carWidth / 2, carLength, carWidth, 6);
      ctx.fill();

      // Dual white racing stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-carLength / 2, -7, carLength, 4);
      ctx.fillRect(-carLength / 2, 3, carLength, 4);

      // Hood scoop blower
      ctx.fillStyle = '#222';
      ctx.fillRect(carLength * 0.1, -6, 14, 12);

      // Windshield & Roof
      ctx.fillStyle = '#141c2b';
      ctx.fillRect(-carLength * 0.2, -carWidth * 0.35, carLength * 0.35, carWidth * 0.7);
    } else if (veh.variant === 'golden') {
      // Golden Hypercar
      const goldGrad = ctx.createLinearGradient(-carLength / 2, 0, carLength / 2, 0);
      goldGrad.addColorStop(0, '#ffbe0b');
      goldGrad.addColorStop(0.5, '#fff3b0');
      goldGrad.addColorStop(1, '#fb5607');
      ctx.fillStyle = goldGrad;
      this.roundRect(ctx, -carLength / 2, -carWidth / 2, carLength, carWidth, 12);
      ctx.fill();

      // Carbon glass cockpit
      ctx.fillStyle = '#0d131f';
      this.roundRect(ctx, -carLength * 0.15, -carWidth * 0.32, carLength * 0.4, carWidth * 0.64, 6);
      ctx.fill();

      // Golden racing spoiler
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-carLength / 2 - 6, -carWidth / 2 + 2, 6, carWidth - 4);
    } else {
      // Charlotte's Turbo GT & Sports Coupe
      ctx.fillStyle = veh.color;
      this.roundRect(ctx, -carLength / 2, -carWidth / 2, carLength, carWidth, 10);
      ctx.fill();

      // Racing stripe
      ctx.fillStyle = '#ffc837';
      ctx.fillRect(-carLength / 2, -4, carLength, 8);

      // Windshield & roof
      ctx.fillStyle = '#101726';
      this.roundRect(ctx, -carLength * 0.18, -carWidth * 0.34, carLength * 0.36, carWidth * 0.68, 5);
      ctx.fill();

      // Rear GT Wing / Spoiler
      ctx.fillStyle = '#111';
      ctx.fillRect(-carLength / 2 - 6, -carWidth / 2 + 2, 6, carWidth - 4);
    }

    // Front Headlights
    ctx.fillStyle = '#fff9a6';
    ctx.fillRect(carLength / 2 - 3, -carWidth / 2 + 4, 4, 8);
    ctx.fillRect(carLength / 2 - 3, carWidth / 2 - 12, 4, 8);

    // Rear Brake Lights
    const brakeColor = '#ff0033';
    ctx.fillStyle = brakeColor;
    ctx.fillRect(-carLength / 2 - 1, -carWidth / 2 + 4, 3, 8);
    ctx.fillRect(-carLength / 2 - 1, carWidth / 2 - 12, 3, 8);
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
