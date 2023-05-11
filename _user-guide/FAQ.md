---
layout: page
title: FAQs
lesson_number: 15
thumbnail: /assets/images/question-marks.png
extract: Unsure about something? Help is at hand
---

## Sharing and citing

### Am I allowed to make and share content using VisualPDE.com?
Yes! We would love to see you making and sharing content using VisualPDE. We ask that any content you create somehow points back to [VisualPDE.com](https://visualpde.com) – a great way to do this is to share a link directly to your simulation! Feel free to use VisualPDE in articles, images, videos, scientific works, social media posts, etc.

### I want to share my cool simulation – how do I do this? <a id="linkSharing">
VisualPDE is designed for sharing. Whether you've fallen in love with one of our examples or you've crafted your own using the VisualPDE interface, you can share the current simulation using a link. Simply open the share sheet by clicking {{ layout.share }} and click 'Copy link' to put a URL on your clipboard that you can share anywhere by pasting! It's that easy!

These links can be quite long, so we recommend using a (free) shortening service like [tinyURL.com](https://tinyurl.com/app) if you want a concise link for sharing.

### How do I take a pretty screenshot without all the user interface showing up?
Screenshots are simple in VisualPDE. Simply open the share sheet by clicking {{ layout.share }} and click 'Save image' to download a screenshot to your device.

### How do I cite VisualPDE in my article?
We're currently preparing a manuscript that you'll be able to cite – watch this space!

## Dealing with errors

### An error message has popped up – what do I do!?
Sometimes, mistakes happen. If something has gone wrong, VisualPDE will try its best to describe the error in a helpful way via a pop-up. We try to display a helpful error message to help you identify the problem. Most error messages look something like this:

```
ERROR: 0:87: 'k' : undeclared identifier
```

Here, the quantity 'k' has been used somewhere in one of the many free-text inputs in VisualPDE, but it hasn't been defined. The most common cause of this is using a parameter in the **Definitions** tab without defining it in the **Parameters** tab. Check your definitions and parameters to resolve this. Be careful to define parameters as constant numbers – dependence on other parameters, space, time, or species is not (yet) supported!

Sometimes, errors won't look anything like this example. If this is the case and the error message doesn't help you in resolving it, please follows the steps outlined [below](#error) and help make VisualPDE as stable as possible!

NOTE: VisualPDE is not able to warn you about multiple errors that involve the same error message (we're working on it). So, if you fix an error involving 'k', you won't be warned about later errors involving 'k' in the same session. Reloading the page (making sure to have copied your configuration URL first!) is a good way of getting around this for now.

### The buttons don't work, but I want to keep playing!
Very rarely, the simulation and the user interface may become unresponsive. If this happens: 
1. Click {{ layout.help }} to bring up the user guide to try to solve your problem.
1. Reload the page. Sadly, this won't preserve the configuration beyond that specified in the URL.
If the issue is persistent and you're confident that you've followed all the steps outlined in this guide, please report your issue as described [below](#error). 

### How do I report an issue? <a id='error'>
Sometimes, something might go wrong (e.g. a part of the user interface is doing something strange, or the simulations are not working on your device). If you encounter an issue that can't be resolved using the [User Guide](/user-guide), we'd love to hear from you at [bugs@visualpde.com](mailto:bugs@visualpde.com).

If you can, it will help us a lot if you could click <span class='click_sequence'>{{ layout.settings }} → **Misc.** → **Debug** → **Copy debug**</span> and paste the contents into your email. This will contain information about your current configuration that will help us resolve the problem.

## Extending

### I want to use VisualPDE in my teaching/research/outreach – what do I do?
VisualPDE is designed for customising and sharing. If you're new to the site, we recommend that you play around and work through the examples found in [Basic PDEs](/basic-pdes/) to get an idea of how to craft your own simulation, and make use of [link sharing](#linkSharing) to permanently save customised simulations.

For instance, a popular way to create custom teaching materials is to simply include links to customised VisualPDE simulations in more traditional teaching materials, similar to the [examples](/basic-pdes/) on the site.

If you want to do more than this allows, we'd love to hear from you at [hello@visualpde.com](mailto:hello@visualpde.com) so that we can help bring VisualPDE into your teaching, research, or outreach activities.

### I've got a feature request – who do I contact?
We're always looking to improve VisualPDE and would love to hear from you at [hello@visualpde.com](mailto:hello@visualpde.com) if you think we can improve something about the experience. If you'd like to suggest a brand new PDE for the website, we're looking for examples that are qualitatively different to what is already on the site. That being said, if you've found a cool parameter set for a system that we haven't noted already, do let us know!

If you can't seem to cast your PDE in a form that VisualPDE can solve, we encourage you to look at the examples in [Basic PDEs](/basic-pdes/) to see how various types of PDE can be thrown into VisualPDE, which might provide some inspiration. If you still can't get VisualPDE to solve your system but you think it should/could be possible, we'd love to hear from you.

### Can I modify the source code of VisualPDE and host my own version?
In short: yes! We've made VisualPDE open source for a reason and want to see as many people using it as possible. If you want to ship your own version of the source code, we ask that you follow the licences found in our [repository](https://github.com/Pecnut/visual-pde) and provide due credit to [VisualPDE.com](https://visualpde.com). If you're in any doubt about your specific case, do send us an email at [hello@visualpde.com](mailto:hello@visualpde.com) and we'll happily chat with you! We're all about making VisualPDE accessible to as many people as possible.