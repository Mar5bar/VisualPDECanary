---
layout: page
title: A-maze-ing PDEs
lesson_number: 50
thumbnail: /assets/images/maze.webp
extract: Searching for love in all the wrong places
equation: $\pd{🐀}{t}=D_🐀\vnabla\cdot (\vnabla 🐀-g(🐀)\vnabla🧀)+f(🐀,🧀),$ $\pd{🧀}{t}=D_🧀 \nabla^2🧀+g(🐀,🧀)$
categories: [art]
---

This is a simulation of a chemotaxis-like system which tries to solve a maze by gobbling up all the food as it goes. There is a source of food at the edge of the maze, and some initial (but slowly decaying) food spread throughout the maze. Will the population make it to the end? Can a web-based PDE solver help complete such puzzles?

Find out in the [interactive simulation](/sim/?preset=maze)!

$$
\begin{aligned}\pd{🐀}{t}&=D_🐀\vnabla\cdot (\vnabla 🐀-g(🐀)\vnabla🧀)+f(🐀,🧀),\\ \pd{🧀 }{t}&=D_🧀 \nabla^2🧀 +g(🐀,🧀)\end{aligned}
$$
