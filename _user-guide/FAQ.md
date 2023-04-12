---
layout: page
title: FAQs
lesson_number: 15
thumbnail: /assets/images/question-marks.png
extract: Having issues? Help is at hand
---

### An error message has popped up - what do I do!?
Sometimes, mistakes happen. If something has gone wrong, VisualPDE will try its best to describe the error in a helpful way via a pop-up. Often, the bottom of this pop-up contains an error message, which will hopefully help you identify the problem. We've found that most of these messages look something like this:

```
ERROR: 0:87: 'k' : undeclared identifier
```

Here, VisualPDE is trying to tell us that a quantity (here 'k') has been used somewhere in one of the many free-text inputs in VisualPDE, but that it hasn't been defined. The most common cause of this is using a parameter in the **Definitions** tab without defining it in the **Parameters** tab. Check your definitions and parameters to resolve this. Be careful of defining parameters in terms of other parameters - this is not (yet) supported!

NOTE: VisualPDE is not able to warn you about multiple errors that involve the same error message (we're working on it). So, if you fix an error involving 'k', you won't be warned about later errors involving 'k' in the same session. Reloading the page (making sure to have copied your configuration URL first!) is a good way of getting around this for now.

Sometimes, errors won't look anything like this example. If this is the case and the error message doesn't help you in resolving it, please get in touch at [hello@visualpde.com](mailto:hello@visualpde.com) and help make VisualPDE as stable as possible!

### The buttons don't work, but I want to keep playing!

### How do I report an issue? <a id='error'>

### I've got a feature request - 

