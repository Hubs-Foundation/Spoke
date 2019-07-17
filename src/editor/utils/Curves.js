import { camelPad } from "./camelPad";

// Extracted from Tween.js
// https://github.com/tweenjs/tween.js/blob/master/src/Tween.js#L473
// https://github.com/tweenjs/tween.js/blob/master/LICENSE
// Originally based on Robert Penner's Easing Functions
// http://robertpenner.com/easing/
// http://robertpenner.com/easing_terms_of_use.html

export const Curves = {
  Linear(k) {
    return k;
  },
  QuadraticIn(k) {
    return k * k;
  },
  QuadraticOut(k) {
    return k * (2 - k);
  },
  QuadraticInOut(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k;
    }

    return -0.5 * (--k * (k - 2) - 1);
  },
  CubicIn(k) {
    return k * k * k;
  },
  CubicOut(k) {
    return --k * k * k + 1;
  },
  CubicInOut(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k;
    }

    return 0.5 * ((k -= 2) * k * k + 2);
  },
  QuarticIn(k) {
    return k * k * k * k;
  },
  QuarticOut(k) {
    return 1 - --k * k * k * k;
  },
  QuarticInOut(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k;
    }

    return -0.5 * ((k -= 2) * k * k * k - 2);
  },
  QuinticIn(k) {
    return k * k * k * k * k;
  },
  QuinticOut(k) {
    return --k * k * k * k * k + 1;
  },
  QuinticInOut(k) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k * k;
    }

    return 0.5 * ((k -= 2) * k * k * k * k + 2);
  },
  SinusoidalIn(k) {
    return 1 - Math.cos((k * Math.PI) / 2);
  },
  SinusoidalOut(k) {
    return Math.sin((k * Math.PI) / 2);
  },
  SinusoidalInOut(k) {
    return 0.5 * (1 - Math.cos(Math.PI * k));
  },
  ExponentialIn(k) {
    return k === 0 ? 0 : Math.pow(1024, k - 1);
  },
  ExponentialOut(k) {
    return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
  },
  ExponentialInOut(k) {
    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    if ((k *= 2) < 1) {
      return 0.5 * Math.pow(1024, k - 1);
    }

    return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
  },
  CircularIn(k) {
    return 1 - Math.sqrt(1 - k * k);
  },
  CircularOut(k) {
    return Math.sqrt(1 - --k * k);
  },
  CircularInOut(k) {
    if ((k *= 2) < 1) {
      return -0.5 * (Math.sqrt(1 - k * k) - 1);
    }

    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
  },
  ElasticIn(k) {
    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
  },
  ElasticOut(k) {
    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
  },
  ElasticInOut(k) {
    if (k === 0) {
      return 0;
    }

    if (k === 1) {
      return 1;
    }

    k *= 2;

    if (k < 1) {
      return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
    }

    return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
  },
  BackIn(k) {
    const s = 1.70158;

    return k * k * ((s + 1) * k - s);
  },
  BackOut(k) {
    const s = 1.70158;

    return --k * k * ((s + 1) * k + s) + 1;
  },
  BackInOut(k) {
    const s = 1.70158 * 1.525;

    if ((k *= 2) < 1) {
      return 0.5 * (k * k * ((s + 1) * k - s));
    }

    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
  },
  BounceIn(k) {
    return 1 - Curves.BounceOut(1 - k);
  },
  BounceOut(k) {
    if (k < 1 / 2.75) {
      return 7.5625 * k * k;
    } else if (k < 2 / 2.75) {
      return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
    } else if (k < 2.5 / 2.75) {
      return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
    } else {
      return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
    }
  },
  BounceInOut(k) {
    if (k < 0.5) {
      return Curves.BounceIn(k * 2) * 0.5;
    }

    return Curves.BounceOut(k * 2 - 1) * 0.5 + 0.5;
  }
};

export const CurveOptions = Object.keys(Curves).map(name => ({
  label: camelPad(name),
  value: name
}));
