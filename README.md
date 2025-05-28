📦 Three.js Cube Animation with Lenis & GSAP
This project is a visually engaging 3D animation built using Three.js, GSAP, and Lenis. It features a dynamic cube formation that transitions from a scattered layout to a circular display and interacts smoothly with scrolling and mouse movements.

✨ Features
Smooth 3D animations powered by GSAP Timeline

Scroll-driven transitions using Lenis

Responsive mouse-based interactions with raycasting

High-performance rendering with Three.js

Lazy loading of 24 texture images in .avif format

Fully responsive and optimized for modern browsers

📁 Project Structure
swift
/public
  /img1.avif to /img24.avif       // Texture images
/src
  index.html                      // Canvas & layout setup
  main.js                         // Full JavaScript source
  style.css                       // (Optional) CSS styles
🚀 Getting Started
1. Clone the Repo
bash
git clone https://github.com/your-username/three-cube-animation.git
cd three-cube-animation
2. Install Dependencies
bash
npm install
This project uses:

three

gsap

@studio-freight/lenis

vite (or any bundler of your choice)

3. Run the Project
bash
npm run dev
Your browser should open automatically at http://localhost:5173.

🧱 Key Technologies
Library	Purpose
three	3D rendering engine
gsap	Timeline-based animation
ScrollTrigger	Scroll control for GSAP animations
@studio-freight/lenis	Smooth scrolling & scroll handling

🖱️ Interaction Behavior
On Load: Cubes animate into a line, fold into a side-circle, then expand to a front-facing circle.

Mouse Hover: Cubes tilt and lift based on proximity to cursor.

Cube Click: Smooth auto-scroll to bottom of page.

Scroll: Layout rotates and elevates as you scroll.

🧹 Cleanup & Resize
resize event listener ensures proper aspect ratio and resolution.

beforeunload listener cleans up the Lenis instance.

📄 License

🙌 Acknowledgements
Three.js

GSAP

Lenis
