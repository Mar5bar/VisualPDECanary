---
layout: page
title: Turing on Turing
lesson_number: 10
thumbnail: /assets/images/alan4.webp
extract: Turing patterns in Turing's image
equation: $\pd{u}{t}=\nabla^2 u+(1-T(x,y)) - u + u^2v$, $\pd{v}{t}=D\nabla^2v+ 1 - u^2v$
---
Functions of space can allow us to change how a PDE solution varies in space and time. Here is an example using such a function, given by $I_T(x,y)$, where this function represents a picture. The equations are based on the [Schnakenberg](/mathematical-biology/schnakenberg) model.

* Load the interactive [Turing simulation](/sim/?preset=Alan). 

* You can upload your own image by clicking on <span class='click_sequence'>{{ layout.settings }} → **Images** </span> and then clicking on the image of [Alan Turing](https://en.wikipedia.org/wiki/Alan_Turing)'s face next to $I_T(x,y)$. The image will be effectively treated as a greyscale function $I_T(x,y)$, which will be approximately 1 when the image is close to white and approximately 0 when the image is close to black.

* Change $I_T$ to $I_S$ in <span class='click_sequence'>{{ layout.equations }} → **Definitions** </span> to see another famous mathematical face. [Sofya Kovalevskaya](https://en.wikipedia.org/wiki/Sofya_Kovalevskaya) also has her own interactive [Sofya simulation](/sim/?preset=Sofya).

# Other images

You can upload a replacement for either of these images under <span class='click_sequence'>{{ layout.settings }} → **Images**.</span> They can each be used as heterogeneities in many parts of VisualPDE. Some examples include:

* [a Halloween design](/sim/?preset=Jack)
* [a VisualPDE QR code](/sim/?preset=QR)
* [a spiralling shell](/sim/?preset=shell)
