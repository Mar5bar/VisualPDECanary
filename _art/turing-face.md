---
layout: page
title: Turing on Turing
lesson_number: 10
thumbnail: /assets/images/Alan.PNG
extract: Even your own image!
equation: $\pd{u}{t}=\nabla^2 u+(1-T(x,y)) - u + u^2*v$, $\pd{v}{t}=D\nabla^2v+ 1 - u^2*v$
---
Functions of space can allow us to change how a PDE solution varies in space and time. Here is an example using such a function, given by $T(x,y)$, where this function represents a picture. The equations are based on the [Schnakenberg](/mathematical-biology/schnakenberg) model.

* Load the [interactive simulation](/sim/?preset=Alan). 

* You can upload your own image by clicking on {{ layout.settings }}→**Misc** and click on the image of Turing's face. The image will be effectively treated as grayscale function $T(x,y)$ will be approximately $1$ when the image is close to white, and approximately $0$ when the image is close to black.
