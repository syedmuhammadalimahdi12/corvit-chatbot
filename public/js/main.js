document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle) {
  navToggle.addEventListener("click", () => {
    navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
    navLinks.style.flexDirection = "column";
    navLinks.style.position = "absolute";
    navLinks.style.top = "68px";
    navLinks.style.left = "0";
    navLinks.style.right = "0";
    navLinks.style.background = "#0d1321";
    navLinks.style.padding = "16px 24px";
  });
}

// Course cards — mirrors data/knowledge_base.json course entries.
// Kept as a small static list here so the landing page has no
// server round-trip; the chatbot consults the full knowledge base.
const COURSES = [
  { title: "Networking", tag: "CCNA · CCNP · Huawei · Juniper", img: "course-networking.svg",
    desc: "Routing, switching, wireless & data-centre skills for telecom and enterprise-IT careers." },
  { title: "Web Development", tag: "HTML · CSS · JS · React", img: "course-webdev.svg",
    desc: "Build sites and apps end to end — great if you want to freelance or build products." },
  { title: "Cyber Security", tag: "Ethical Hacking · CEH · CHFI", img: "course-cyber.svg",
    desc: "Learn to find and fix vulnerabilities — a fit for security-minded problem solvers." },
  { title: "Data Science & AI", tag: "Python · ML · AI", img: "course-datasci.svg",
    desc: "Statistics, machine learning and applied AI for analytics-driven roles." },
  { title: "Cloud & DevOps", tag: "AWS · Azure · CI/CD", img: "course-cloud.svg",
    desc: "Cloud infrastructure and deployment pipelines for ops-focused careers." },
  { title: "Graphic Design", tag: "Print Media · UI Basics", img: "course-graphic.svg",
    desc: "Design tools and visual fundamentals for creative, brand-facing work." },
];

const grid = document.getElementById("course-grid");
if (grid) {
  grid.innerHTML = COURSES.map(
    (c) => `
    <div class="card course-card">
      <img src="assets/images/${c.img}" alt="" />
      <div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <span class="course-tag">${c.tag}</span>
      </div>
    </div>`
  ).join("");
}
