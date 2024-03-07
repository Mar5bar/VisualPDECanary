---
layout: demo
lesson_number: 50
title: Virus transmission - airflow
thumbnail: /assets/images/VirusTransmission.webp
---

<!-- Simulation -->
<iframe class="sim" id="simA" src="/sim/?options=N4IghgagliBcCMAaEAjAqnEBjA9gWxRxGRQk1wKJICdN5iQAXFcgVwGdH8GUA3TAEKs8ABwAUADwGIAntIAyAengAmAJQMsLWI2qsApsiyYANmF5gAZiZwB3TewywQAFRwjYAAgBy+4WAA7AM8AXk8ABgBuTwEcRi48L19-INCI6Pl9S0YvAHEACxxONIBhAH1WEWiAJSgAc3yczwKixlKKqocyZzcPHz88QOCwqJi4hKSBobTRzOy8wuKw8ptbGvrGhdb21cjNABE4XQNkABM0JxB6M4huq4ZTgHVHzHCH9joAVjezxjhwgB04XCSGwlx+2AAioJhOJ5GUJIoVIh4TIkSjlOoGABrTAQNIAFnCnigwQA2gBaImIIkAXUiAA0ZgDPiTyeFEPB6Z4AJrM1mkzxkjlcyLVNLwYmC4WIFThelmAinMD8yIofSMFUjSLseqDGaRDVgMrsDjM+BsoUi+nUQoms0jAEW6XWyIASQle2Qg0wnwYATgBOQARccDlyBEmBKHASDGol2qACpSacxAAFAB84TUibTFLEipQyoA1OrNcXdXVBjmVnYKRBE7XbAi43d84WS2WwBW9WAax1iw3ypUW8hqC9nGJ4BSjfb2DnbTg54mxE3PMXPMORGokQx2JHnNcQOwA8411vPKdPGm96wjnpDCB+LAyaAwNRqHYSjgbKxaLAADZPk+ABmT5kHfT9bH2fQAl1RgZH+FkII-OxMgCOpGHyABZMAJDoBhILsABlLAwBMfRMDAVguEI1DbAZTB4URFRPApTx8JQqCeSYso0VY9jEIgmicGIjVv1-ahqkCOpKNgSxyPYR8yLwfRqDAFx8iNOAQI5bAwFU9S03yGBYF0owDLUsAAC0cG4WBAQADiMH8cD-QYDxAOpqH0GR2DIijNFcv8UHfe8TmwHAAi4P8PnkxTlKimLqAktz-z03BorSgBRERdRsU9ARBFysr-bxhDgcDsBjfBiL-BSsDkhSTCU5B9Eodg4ua1qQHawhOoAQQIKBYL+BzkN6jr2H2KBLEsDg5MBAC2qm4zTPgFkAHZwmcyb+vYYiTICRCED0vqigOvA7KwgJ9E6pDkT2i7iJEfQsFYMx0oBR7zs6zTtPGzbHM+IMQGsKARFe05UvcsAD26x8TFJfRHigU4sOwj64FBQYJBh6gIHIgw6CBBg8FJfHCZMYnnCKhgcF4NSzBOhHkAZpmwBkfH-jZxnqGZ3L8qipDgSq9n+c57KJBEf97l5jmZHkZHUfRnCsYQCMbEYFwZFezARDMW7b2oBr9AAMVYU8QAhLCfP0fYAAl9A2RhSPIxaAU25BGawLhqDNkaTFOOBWZAWx8jAbWcDTLXMBvYNLLjz9QpQKAkYQkAAF9EDfejucA4CwK4uwYLgqAM-GqqiNsdDMJwvCCOL2w3cC5xqNopvGOcZikTYji6O43j+L7oTwBEsTGHx6SMKahKLMMjStM1HSMssoyTJX+erNs+ynJcySPNMcwrFWILJNC-9jkS0rqC6ufIpv-OMqSnK8rT4XxuKh-kvKvBKqMGqeA6omzAI1EO99fp3xao+SBQ1U6jSQlVSBM05oLSQstJ6nU1rYy2jtFa+1DqkhOpKfBz0rpxHyLde640fpTRem9D6YUaGkL+kvMASEgYg2QODSG+hobBWoIfeK0DkBI1uirDG6scZ4UpkTOSIA-TegpgIqmNNrak3lhLFm99xbMyfpogWb8Coi3CGLPmAtpayyPLozmStxFo0kSYbGms4g6z1s4A2gRKLIFNCAxqFsrY23yHbR2zsGiuwCh7L2T43p+wDvoIO4CRFhwjlHGOcQoxlFWOuTcHR-SJzPFFRq0V1KMCgMLTOtJkC2GDs4eOYdPJrg3FuPchRbAtE4AIEocUr4+KgHgFw5dW4gAGlAaghBqC3U8LwMZZpdCBHYOTTq5SAyZyAA&story&nomathjax&sf=1&reset_only&colourbar=true" frameborder="0" loading="lazy"></iframe>

<!-- Sliders -->
<div style="display:flex;flex-direction:column;row-gap:10dvh;">
<div>
    <h1>Airborne virus transmission</h1>
    <h3>Click to move the source of virus</h3>
</div>
<p style="text-align:center;margin-top:0;"><vpde-slider
    iframe="simA"
    name="V"
    label="Airflow"
    min="-40"
    max="40"
    value="40"
    step="1"
    min-label="Left"
    max-label="Right"
    label-position="above"
></vpde-slider></p>
</div>
