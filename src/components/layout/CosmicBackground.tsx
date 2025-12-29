import React, { useEffect, useRef } from 'react';

const CosmicBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        let planets: Planet[] = [];

        // --- CLASSES ---

        // Geometry Helper for Stars
        function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        }

        class Star {
            x: number;
            y: number;
            size: number;
            maxSize: number;
            color: string;
            alpha: number;
            twinkleSpeed: number;
            opacity: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 2 + 1;
                this.maxSize = this.size + Math.random() * 2;

                const starColors = ['#ffffff', '#ffffff', '#e0e7ff', '#f5d5e0', '#22d3ee', '#d946ef'];
                this.color = starColors[Math.floor(Math.random() * starColors.length)];

                this.alpha = Math.random();
                this.twinkleSpeed = Math.random() * 0.1 + 0.02;
                this.opacity = 1;
            }

            update() {
                this.alpha += this.twinkleSpeed;
                this.opacity = (Math.sin(this.alpha) + 1) / 2 * 0.8 + 0.2;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                drawStar(ctx, this.x, this.y, 4, this.size * 2, this.size / 2);
                ctx.globalAlpha = 1.0;
            }
        }

        const planetTypes = [
            { name: 'Mars', color: '#ff4500', size: 20, ring: false },
            { name: 'Venus', color: '#f5deb3', size: 25, ring: false },
            { name: 'Earth', color: '#4169e1', size: 28, ring: false },
            { name: 'Jupiter', color: '#deb887', size: 60, ring: true },
            { name: 'Saturn', color: '#f4a460', size: 55, ring: true },
            { name: 'Uranus', color: '#7fffd4', size: 45, ring: true },
            { name: 'Neptune', color: '#1e90ff', size: 42, ring: false },
            { name: 'Mercury', color: '#a9a9a9', size: 15, ring: false },
            { name: 'Pluto', color: '#dda0dd', size: 12, ring: false },
            // DUPLICATES to bias selection
            { name: 'Venus', color: '#f5deb3', size: 25, ring: false },
            { name: 'Mars', color: '#ff4500', size: 20, ring: false },
            { name: 'BlueGiant', color: '#4b0082', size: 35, ring: false }
        ];

        class Planet {
            x: number;
            y: number;
            radius: number;
            color: string;
            hasRing: boolean;
            speedX: number;
            speedY: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;

                const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
                this.radius = type.size;
                this.color = type.color;
                this.hasRing = type.ring;

                this.speedX = Math.random() * 0.8 - 0.4;
                this.speedY = Math.random() * 0.8 - 0.4;
            }

            update(w: number, h: number) {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > w + 50) this.x = -50;
                else if (this.x < -50) this.x = w + 50;
                if (this.y > h + 50) this.y = -50;
                else if (this.y < -50) this.y = h + 50;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.beginPath();
                let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = gradient;
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                if (this.hasRing) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 2;
                    ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius * 0.6, Math.PI / 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // --- INIT ---

        const initParticles = () => {
            stars = [];
            planets = [];
            const w = canvas.width;
            const h = canvas.height;

            // Reduced Stars (Less cluttered)
            let numberOfStars = (w * h) / 10000;
            for (let i = 0; i < numberOfStars; i++) {
                stars.push(new Star(w, h));
            }

            // Increased Planets (More diversity)
            for (let i = 0; i < 9; i++) {
                planets.push(new Planet(w, h));
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // --- ANIMATION ---

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Planets First (Background)
            for (const p of planets) {
                p.update(canvas.width, canvas.height);
                p.draw(ctx);
            }

            // Draw Stars (Static position, Twinkle alpha)
            for (const s of stars) {
                s.update();
                s.draw(ctx);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div className="stars-bg" /> {/* The gradient background */}
            <canvas
                ref={canvasRef}
                id="bg-canvas"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -2,
                    pointerEvents: 'none',
                }}
            />
        </>
    );
};

export default CosmicBackground;
