let animationsData = 

{
  "beating": {
    "params": { 
      "amplitude": 1.2 
    },
    "paramConfig": {
      "amplitude": {
        "min": 0.1,
        "max": 3.0,
        "step": 0.1,
        "default": 1.2
      }
    },
    "defaultSpeed": "1.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      return {
        "0%": {
          "animation-timing-function": "cubic-bezier(0.1028,0.2484,0.1372,0.849)",
          "transform": "scale(1)"
        },
        "34%": {
          "animation-timing-function": "cubic-bezier(0.7116,0.2095,0.8159,0.6876)",
          "transform": `scale(${p.amplitude})`
        },
        "68%": {
          "animation-timing-function": "cubic-bezier(0.1475,0.2888,0.294,0.883)",
          "transform": `scale(${1 + (p.amplitude - 1) * 0.2})`
        },
        "84%": {
          "animation-timing-function": "cubic-bezier(0.8176,0.2193,0.867,0.6889)",
          "transform": `scale(${1 + (p.amplitude - 1) * 0.1})`
        },
        "100%": {
          "transform": "scale(1)"
        }
      };
    }
  },
  "fade": {
    "keyframes": {
        "0%": {
            "animation-timing-function": "cubic-bezier(0.2057,0.573,0.3723,0.9184)",
            "opacity": "1"
        },
        "100%": {
            "opacity": "0"
        }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

  "tremble": {
    "params": { 
      "intensity": 1.5 
    },
    "paramConfig": {
      "intensity": {
        "min": 0.1,
        "max": 3.0,
        "step": 0.1,
        "default": 1.5
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      const intensity = p.intensity;
      return {
        "0%": { "transform": "translate(0px,0px) rotate(0deg) scale(1)" },
        "3.33333%": { "transform": `translate(${-0.18923 * intensity}px,${1.45485 * intensity}px) rotate(0deg) scale(1)` },
        "6.66667%": { "transform": `translate(${-0.84296 * intensity}px,${-1.32524 * intensity}px) rotate(0deg) scale(1)` },
        "10%": { "transform": `translate(${0.67971 * intensity}px,${1.00422 * intensity}px) rotate(0deg) scale(1)` },
        "13.33333%": { "transform": `translate(${-0.5056 * intensity}px,${0.83616 * intensity}px) rotate(0deg) scale(1)` },
        "16.66667%": { "transform": `translate(${1.31368 * intensity}px,${-0.51401 * intensity}px) rotate(0deg) scale(1)` },
        "20%": { "transform": `translate(${-1.21184 * intensity}px,${1.49193 * intensity}px) rotate(0deg) scale(1)` },
        "23.33333%": { "transform": `translate(${1.09065 * intensity}px,${-0.21259 * intensity}px) rotate(0deg) scale(1)` },
        "26.66667%": { "transform": `translate(${-1.49916 * intensity}px,${0.56159 * intensity}px) rotate(0deg) scale(1)` },
        "30%": { "transform": `translate(${1.48086 * intensity}px,${1.21228 * intensity}px) rotate(0deg) scale(1)` },
        "33.33333%": { "transform": `translate(${-1.43889 * intensity}px,${-1.152 * intensity}px) rotate(0deg) scale(1)` },
        "36.66667%": { "transform": `translate(${1.35914 * intensity}px,${1.34835 * intensity}px) rotate(0deg) scale(1)` },
        "40%": { "transform": `translate(${-1.42834 * intensity}px,${0.3091 * intensity}px) rotate(0deg) scale(1)` },
        "43.33333%": { "transform": `translate(${1.47472 * intensity}px,${-1.49889 * intensity}px) rotate(0deg) scale(1)` },
        "46.66667%": { "transform": `translate(${-0.92402 * intensity}px,${1.4416 * intensity}px) rotate(0deg) scale(1)` },
        "50%": { "transform": `translate(${1.0657 * intensity}px,${-0.75306 * intensity}px) rotate(0deg) scale(1)` },
        "53.33333%": { "transform": `translate(${-1.19035 * intensity}px,${-1.07484 * intensity}px) rotate(0deg) scale(1)` },
        "56.66667%": { "transform": `translate(${0.28828 * intensity}px,${0.79337 * intensity}px) rotate(0deg) scale(1)` },
        "60%": { "transform": `translate(${-0.47167 * intensity}px,${-1.42789 * intensity}px) rotate(0deg) scale(1)` },
        "63.33333%": { "transform": `translate(${0.64753 * intensity}px,${-0.09795 * intensity}px) rotate(0deg) scale(1)` },
        "66.66667%": { "transform": `translate(${0.41006 * intensity}px,${-0.26292 * intensity}px) rotate(0deg) scale(1)` },
        "70%": { "transform": `translate(${-0.22477 * intensity}px,${-1.3683 * intensity}px) rotate(0deg) scale(1)` },
        "73.33333%": { "transform": `translate(${0.03588 * intensity}px,${0.92931 * intensity}px) rotate(0deg) scale(1)` },
        "76.66667%": { "transform": `translate(${-1.01937 * intensity}px,${-1.18398 * intensity}px) rotate(0deg) scale(1)` },
        "80%": { "transform": `translate(${0.8724 * intensity}px,${-0.60494 * intensity}px) rotate(0deg) scale(1)` },
        "83.33333%": { "transform": `translate(${-0.71151 * intensity}px,${1.4786 * intensity}px) rotate(0deg) scale(1)` },
        "86.66667%": { "transform": `translate(${1.40734 * intensity}px,${-1.49607 * intensity}px) rotate(0deg) scale(1)` },
        "90%": { "transform": `translate(${-1.33062 * intensity}px,${0.46957 * intensity}px) rotate(0deg) scale(1)` },
        "93.33333%": { "transform": `translate(${1.23264 * intensity}px,${1.26738 * intensity}px) rotate(0deg) scale(1)` },
        "96.66667%": { "transform": `translate(${-1.48975 * intensity}px,${-1.03867 * intensity}px) rotate(0deg) scale(1)` },
        "100%": { "transform": "translate(0,0) rotate(0) scale(1)" }
      };
    }
  },
  "blink": {
    "keyframes": {
        "0%": { "opacity": "1" },
        "49.75%": { "opacity": "1" },
        "50.25%": { "opacity": "0" },
        "99.5%": { "opacity": "0" },
        "100%": { "opacity": "1" }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

  "bounce": {
    "keyframes": {
    "0%": {
            "animation-timing-function": "cubic-bezier(0.1361,0.2514,0.2175,0.8786)",
            "transform": "translate(0,0px) scaleY(1)"
        },
        "37%": {
            "animation-timing-function": "cubic-bezier(0.7674,0.1844,0.8382,0.7157)",
            "transform": "translate(0,-39.96px) scaleY(1)"
        },
        "72%": {
            "animation-timing-function": "cubic-bezier(0.1118,0.2149,0.2172,0.941)",
            "transform": "translate(0,0px) scaleY(1)"
        },
        "87%": {
            "animation-timing-function": "cubic-bezier(0.7494,0.2259,0.8209,0.6963)",
            "transform": "translate(0,19.900000000000002px) scaleY(0.602)"
        },
        "100%": {
            "transform": "translate(0,0px) scaleY(1)"
        }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },


  "breath": {
    "keyframes": {
        "0%": {
            "animation-timing-function": "cubic-bezier(0.9647,0.2413,-0.0705,0.7911)",
            "transform": "scale(0.9099999999999999)"
        },
        "51%": {
            "animation-timing-function": "cubic-bezier(0.9226,0.2631,-0.0308,0.7628)",
            "transform": "scale(1.02994)"
        },
        "100%": {
            "transform": "scale(0.9099999999999999)"
        }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

  "spin": {
    "params": { 
      "direction": 1 
    },
    "paramConfig": {
      "direction": {
        "min": -1,
        "max": 1,
        "step": 2,
        "default": 1
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      const direction = p.direction || 1;
      const endRotation = direction >= 0 ? 360 : -360;
      return {
        "0%": {
            "animation-timing-function": "cubic-bezier(0.5856,0.0703,0.4143,0.9297)",
            "transform": "rotate(0deg)"
        },
        "100%": {
            "transform": `rotate(${endRotation}deg)`
        }
      };
    }
  },

  "flip-horizontal" : {
    "keyframes":  {
        "0%": {
            "animation-timing-function": "cubic-bezier(0.1909,0.4373,0.4509,0.7454)",
            "transform": "rotateY(0deg)"
        },
        "30%": {
            "animation-timing-function": "cubic-bezier(0.128,0.2315,0.9704,0.8632)",
            "transform": "rotateY(153.72deg)"
        },
        "50%": {
            "animation-timing-function": "cubic-bezier(0.5788,0.3001,0.5613,0.6784)",
            "transform": "rotateY(180deg)"
        },
        "55%": {
            "animation-timing-function": "cubic-bezier(0.1545,0.4929,0.6089,0.9373)",
            "transform": "rotateY(238.68deg)"
        },
        "100%": {
            "transform": "rotateY(360deg)"
        }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

  "blur" : {
    "params": { 
      "blurAmount": 10 
    },
    "paramConfig": {
      "blurAmount": {
        "min": 0,
        "max": 20,
        "step": 1,
        "default": 10
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      return {
        "0%": { "filter": "blur(0)" },
        "50%": { "filter": `blur(${p.blurAmount}px)` },
        "100%": { "filter": "blur(0)" }
      };
    }
  },

  "bounce-alt" : {
    "keyframes":  {
        "0%": {
            "animation-timing-function": "cubic-bezier(0.1348,0.3256,0.2495,0.8687)",
            "transform": "translate(0, 0px)"
        },
        "51%": {
            "animation-timing-function": "cubic-bezier(0.7426,0.1782,0.8523,0.6514)",
            "transform": "translate(0, -14px)"
        },
        "100%": {
            "transform": "translate(0, 0px)"
        }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

    "clock" : {
    "params": { 
      "direction": 1 
    },
    "paramConfig": {
      "direction": {
        "min": -1,
        "max": 1,
        "step": 2,
        "default": 1
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      const direction = p.direction || 1;
      const rotationValues = direction >= 0 ? 
        [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360] :
        [0, -30, -60, -90, -120, -150, -180, -210, -240, -270, -300, -330, -360];
      
      return {
        "0%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[0]}deg)`
        },
        "8.33333%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[1]}deg)`
        },
        "16.66667%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[2]}deg)`
        },
        "25%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[3]}deg)`
        },
        "33.33333%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[4]}deg)`
        },
        "41.66667%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[5]}deg)`
        },
        "50%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[6]}deg)`
        },
        "58.33333%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[7]}deg)`
        },
        "66.66667%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[8]}deg)`
        },
        "75%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[9]}deg)`
        },
        "83.33333%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[10]}deg)`
        },
        "91.66667%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[11]}deg)`
        },
        "100%": {
            "animation-timing-function": "cubic-bezier(0,0.7,0.3,1)",
            "transform": `rotate(${rotationValues[12]}deg)`
        }
      };
    }
  },

    "metronome" : {
    "keyframes": {
      "0%": {
        "animation-timing-function": "cubic-bezier(0.7806,0.0715,0.8998,0.731)",
        "transform": "translate(-10px) rotate(-20deg)"
      },
      "17.5%": {
        "animation-timing-function": "cubic-bezier(0.484,0.3308,0.6853,0.6667)",
        "transform": "translate(-6.18px) rotate(-12.36deg)"
      },
      "27.6%": {
        "animation-timing-function": "cubic-bezier(0.0676,0.1836,0.0518,0.9433)",
        "transform": "translate(2.48px) rotate(4.96deg)"
      },
      "50.1%": {
        "animation-timing-function": "cubic-bezier(0.7773,0.0708,0.9008,0.735)",
        "transform": "translate(10px) rotate(20deg)"
      },
      "67.6%": {
        "animation-timing-function": "cubic-bezier(0.4888,0.331,0.6153,0.6674)",
        "transform": "translate(6.16px) rotate(12.32deg)"
      },
      "80%": {
        "animation-timing-function": "cubic-bezier(0.0801,0.2206,0.1357,0.9363)",
        "transform": "translate(-4.57px) rotate(-9.14deg)"
      },
      "100%": {
        "transform": "translate(-10px) rotate(-20deg)"
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": false
  },

    "swim" : {
    "keyframes": {
      "0%": { "transform": "translate(0px,0px) rotate(0deg) scale(1)" },
      "8.33333%": { "transform": "translate(-5.96462px,4.90845px) rotate(-13.66821deg) scale(1)" },
      "16.66667%": { "transform": "translate(5.25471px,-2.05606px) rotate(0.47337deg) scale(1)" },
      "25%": { "transform": "translate(2.30929px,5.79372px) rotate(13.8564deg) scale(1)" },
      "33.33333%": { "transform": "translate(-5.75556px,-4.60802px) rotate(10.94246deg) scale(1)" },
      "41.66667%": { "transform": "translate(3.73522px,5.97742px) rotate(-14.03079deg) scale(1)" },
      "50%": { "transform": "translate(4.2628px,-3.01222px) rotate(-10.61323deg) scale(1)" },
      "58.33333%": { "transform": "translate(-4.65975px,-2.51269px) rotate(5.2869deg) scale(1)" },
      "66.66667%": { "transform": "translate(1.64024px,-1.05167px) rotate(10.27343deg) scale(1)" },
      "75%": { "transform": "translate(5.55954px,-4.22763px) rotate(-5.72726deg) scale(1)" },
      "83.33333%": { "transform": "translate(-2.84602px,5.91439px) rotate(-14.99193deg) scale(1)" },
      "91.66667%": { "transform": "translate(-0.70744px,-5.43063px) rotate(6.16192deg) scale(1)" },
      "100%": { "transform": "translate(0,0) rotate(0) scale(1)" }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

    "squeeze" : {
    "keyframes": {
          "0%": {
            "animation-timing-function": "cubic-bezier(0.1685,0.4459,0.3641,0.7833)",
            "transform": "scale(0.5,1)"
          },
          "30%": {
            "animation-timing-function": "cubic-bezier(0.0995,0.199,0.9948,0.959)",
            "transform": "scale(0.9490000000000001,0.5509999999999999)"
          },
          "50%": {
            "animation-timing-function": "cubic-bezier(0.6064,0.3078,0.5406,0.6764)",
            "transform": "scale(1,0.5)"
          },
          "55%": {
            "animation-timing-function": "cubic-bezier(0.1401,0.5826,0.6091,0.9651)",
            "transform": "scale(0.8019999999999999,0.6980000000000001)"
          },
          "100%": {
            "transform": "scale(0.5,1)"
          }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

  "pulse" : {
    "keyframes": {
          "0%": {
            "animation-timing-function": "cubic-bezier(0.3333,0.3333,0.3124,0.6668)",
            "transform": "scale(0.85)"
          },
          "0.5%": {
            "animation-timing-function": "cubic-bezier(0.0233,-0.3865,0.6667,0.6667)",
            "transform": "scale(1.141)"
          },
          "1.5%": {
            "animation-timing-function": "cubic-bezier(0.2893,0.354,0.6158,0.6958)",
            "transform": "scale(1.124)"
          },
          "11%": {
            "animation-timing-function": "cubic-bezier(0.2861,0.4196,0.6215,0.7476)",
            "transform": "scale(0.992)"
          },
          "25%": {
            "animation-timing-function": "cubic-bezier(0.0793,0.2627,0.9972,1.5511)",
            "transform": "scale(0.887)"
          },
          "49.5%": {
            "animation-timing-function": "cubic-bezier(0.6664,0.3332,0.6667,0.6667)",
            "transform": "scale(0.85)"
          },
          "50%": {
            "animation-timing-function": "cubic-bezier(0,0.3522,1,0.6686)",
            "transform": "scale(1.1500000000000001)"
          },
          "51%": {
            "animation-timing-function": "cubic-bezier(0.2668,0.4036,0.554,0.7657)",
            "transform": "scale(1.1320000000000001)"
          },
          "73.5%": {
            "animation-timing-function": "cubic-bezier(0.2997,1.0028,0.6671,1)",
            "transform": "scale(0.894)"
          },
          "100%": {
            "transform": "scale(0.85)"
          }
        },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true
  },

    "skew" : {
    "params": { 
      "skewAmount": 20 
    },
    "paramConfig": {
      "skewAmount": {
        "min": 5,
        "max": 45,
        "step": 1,
        "default": 20
      }
    },
    "defaultSpeed": "0.5",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      return {
        "0%, 50%, 100%": {
          "animation-timing-function": "cubic-bezier(0.4,0,1,0.6)"
        },
        "25%, 75%": {
          "animation-timing-function": "cubic-bezier(0,0.4,0.6,1)"
        },
        "0%": {
          "transform": `skewY(${p.skewAmount}deg) scale(1)`
        },
        "25%": {
          "transform": "skewY(0deg) scale(0.9)"
        },
        "50%": {
          "transform": `skewY(${-p.skewAmount}deg) scale(1)`
        },
        "75%": {
          "transform": "skewY(0deg) scale(0.9)"
        },
        "100%": {
          "transform": `skewY(${p.skewAmount}deg) scale(1)`
        }
      };
    }
  },

  "stroke-dash": {
    "params": { 
      "dashLength": 10,
      "gapLength": 5
    },
    "paramConfig": {
      "dashLength": {
        "min": 1,
        "max": 50,
        "step": 1,
        "default": 10
      },
      "gapLength": {
        "min": 1,
        "max": 30,
        "step": 1,
        "default": 5
      }
    },
    "defaultSpeed": "2.0",
    "defaultSpeedSlider": true,
    "generateKeyframes": function(p) {
      const totalLength = p.dashLength + p.gapLength;
      return {
        "0%": {
          "animation-timing-function": "linear",
          "stroke-dasharray": `${p.dashLength} ${p.gapLength}`,
          "stroke-dashoffset": "0"
        },
        "50%": {
          "animation-timing-function": "linear",
          "stroke-dasharray": `${p.dashLength} ${p.gapLength}`,
          "stroke-dashoffset": `-${totalLength}`
        },
        "100%": {
          "animation-timing-function": "linear",
          "stroke-dasharray": `${p.dashLength} ${p.gapLength}`,
          "stroke-dashoffset": `-${totalLength * 2}`
        }
      };
    }
  },

"boiled": {
  params: { 
    intensity: 4, 
    frequency: 0.02, 
    speed: 5, 
    to: 60 
  },
  paramConfig: {
    intensity: {
      min: 1,
      max: 10,
      step: 0.5,
      default: 4
    },
    frequency: {
      min: 0.01,
      max: 0.1,
      step: 0.01,
      default: 0.02
    },
    speed: {
      min: 1,
      max: 10,
      step: 0.5,
      default: 5
    },
    to: {
      min: 10,
      max: 100,
      step: 5,
      default: 60
    }
  },
  defaultSpeed: "5.0",
  defaultSpeedSlider: false,
  apply: function (element, p) {
    let defs = document.querySelector("svg defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      document.querySelector("svg").prepend(defs);
    }

    // Unique filter per element
    const filterId = "boilEffect-" + element.id;
    let filter = document.getElementById(filterId);
    if (filter) filter.remove();

    filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const turbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence");
    turbulence.setAttribute("type", "turbulence");
    turbulence.setAttribute("baseFrequency", p.frequency ?? 0.02);
    turbulence.setAttribute("numOctaves", "1");
    turbulence.setAttribute("result", "turbulence");

    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animate.setAttribute("attributeName", "seed");
    animate.setAttribute("from", "1");
    animate.setAttribute("to", p.to ?? 60);
    animate.setAttribute("dur", (p.speed ?? 5) + "s");
    animate.setAttribute("repeatCount", "indefinite");
    turbulence.appendChild(animate);

    const displacement = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
    displacement.setAttribute("in", "SourceGraphic");
    displacement.setAttribute("in2", "turbulence");
    displacement.setAttribute("scale", p.intensity ?? 4);
    displacement.setAttribute("xChannelSelector", "R");
    displacement.setAttribute("yChannelSelector", "G");

    filter.appendChild(turbulence);
    filter.appendChild(displacement);
    defs.appendChild(filter);

    element.setAttribute("filter", `url(#${filterId})`);
  }
},

"scroll-vertical": {
  "params": {
    "distance": 100 // pixels
  },
  "paramConfig": {
    "distance": {
      "min": 10,
      "max": 1000,
      "step": 10,
      "default": 100
    }
  },
  "defaultSpeed": "2.0",
  "defaultSpeedSlider": true,
  "generateKeyframes": function(p) {
    const d = p.distance || 100;
    return {
      "0%": {
        "transform": "translateY(0)"
      },
      "100%": {
        "transform": `translateY(${d}px)`
      }
    };
  }
}

}

// Make animationsData available globally
window.animationsData = animationsData;
