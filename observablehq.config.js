// Observable Framework configuration file
// https://observablehq.com/framework/config

export default {
  // The project title, appearing in the sidebar and navigation.
  title: "Fluid Light Transport",

  // The directory where source markdown pages reside.
  root: "src",

  // The output directory for static builds.
  output: "dist",




  // Pages structure in the sidebar.
  pages: [
    {
      name: "Guided Walkthrough",
      path: "/introduction"
    },
    {
      name: "Tutorial",
      pages: [
        {name: "1. The Digital Canvas", path: "/tutorial/01-canvas"},
        {name: "2. The Language of Logic", path: "/tutorial/02-logic"},
        {name: "3. Memory & Data", path: "/tutorial/03-memory"},
        {name: "4. The Maths of Space", path: "/tutorial/04-math"},
        {name: "5. Casting Rays", path: "/tutorial/05-raytracing"},
        {name: "6. Simulating Fluids", path: "/tutorial/06-fluids"},
        {name: "7. The Main Loop", path: "/tutorial/07-mainloop"},
      ]
    },
    {
      name: "Reference",
      pages: [
        {name: "API Reference", path: "/reference/api"},
        {name: "Performance Benchmarking", path: "/reference/performance"},
        {name: "Engineering Quality", path: "/reference/quality"},
        {name: "Troubleshooting & FAQ", path: "/reference/troubleshooting"},
        {name: "References", path: "/reference/references"},
      ]
    }
  ],

  // Theme settings (uses dark dashboard layout with responsive dark/light styling)
  theme: "dashboard",

  // Table of contents configuration
  toc: true,

  // Search feature in the sidebar
  search: true,
};
