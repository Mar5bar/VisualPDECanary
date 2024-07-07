---
layout: page
title: Chemical Basis of Morphogenesis
lesson_number: 30
thumbnail: /assets/images/chemicalBasis.webp
extract: A transformative text
equation: $\pd{u}{t}=\nabla^2 u+a-u+u^2v$, $\pd{v}{t}=D\nabla^2v+ b-u^2v$
categories: [art, patterns]
---
This is the first page of Alan Turing's [The Chemical Basis of Morphogenesis](https://en.wikipedia.org/wiki/The_Chemical_Basis_of_Morphogenesis) paper undergoing pattern formation. The kinetics are exactly from the [Schnakenberg example](/mathematical-biology/schnakenberg):

$$\begin{aligned}\pd{u}{t}&=\nabla^2 u+a-u+u^2v,\\ \pd{v}{t}&=D\nabla^2v+ b-u^2v,\end{aligned}$$

but we have taken an initial condition from an image of the first page of Turing's text.

* Load the [interactive simulation](/sim/?preset=chemicalBasisOfMorphogenesis).

* Press {{ layout.play }} to see this evolve! You can pause the simulation and press {{ layout.erase }} to reset the text. 

* Modifying different parameters (particularly $b$) can lead to qualitatively different solutions. Try $b=0.6$ for example. Try decreasing $b$ very slowly with the slider to see the pattern change.
