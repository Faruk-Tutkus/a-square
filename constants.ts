
import { GameConfig } from './types';

export const GAME_DATA: GameConfig = {
  "meta": {
    "gameId": "a_squares_life",
    "build": "4.0.0-reset"
  },
  "presentation": {
    "visualStyle": {
      "palette": {
        "background": "#E8E8E8",
        "foreground": "#111111",
        "accent": "#555555"
      }
    }
  },
  "player": {
    "physics": {
      "gravity": 1400,
      "speed": 300,
      "jumpForce": 580
    },
    "health": {
      "max": 1
    },
    "combat": {
      "defaultAmmo": 25
    }
  },
  "levels": [
    {
      "id": 0,
      "name": "Null Point",
      "map": {
        "size": {
          "w": 50,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 20,
            "h": 1
          },
          {
            "x": 25,
            "y": 14,
            "w": 25,
            "h": 1
          }
        ]
      },
      "enemies": [],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 2,
          "w": 9,
          "text": "Use ARROW KEYS to move."
        },
        {
          "x": 16,
          "w": 10,
          "text": "Hold JUMP for height."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 13
        }
      ],
      "exit": {
        "to": 1
      }
    },
    {
      "id": 1,
      "name": "The Gap",
      "map": {
        "size": {
          "w": 60,
          "h": 22
        },
        "platforms": [
          {
            "x": -5,
            "y": 16,
            "w": 20,
            "h": 1
          },
          {
            "x": 22,
            "y": 14,
            "w": 5,
            "h": 1
          },
          {
            "x": 33,
            "y": 12,
            "w": 5,
            "h": 1
          },
          {
            "x": 43,
            "y": 16,
            "w": 17,
            "h": 1
          }
        ]
      },
      "enemies": [],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 7,
          "w": 20,
          "text": "Press JUMP again in mid-air to Double Jump."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 14
        }
      ],
      "exit": {
        "to": 2
      }
    },
    {
      "id": 2,
      "name": "Acquisition",
      "map": {
        "size": {
          "w": 70,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 21,
            "h": 1
          },
          {
            "x": 30,
            "y": 15,
            "w": 40,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_basic",
          "x": 51,
          "y": 11
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 7,
          "w": 15,
          "text": "Acquire weapon. Press FIRE to shoot."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 3
      }
    },
    {
      "id": 3,
      "name": "Weight",
      "map": {
        "size": {
          "w": 60,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 60,
            "h": 1
          }
        ]
      },
      "enemies": [],
      "boxes": [
        {
          "x": 15,
          "y": 13
        }
      ],
      "doors": [
        {
          "x": 45,
          "y": 14,
          "h": 7,
          "id": "d1"
        }
      ],
      "buttons": [
        {
          "x": 35,
          "y": 14,
          "id": "b1",
          "linkToDoorId": "d1",
          "behavior": "hold"
        }
      ],
      "infoPoints": [
        {
          "x": 5,
          "w": 20,
          "text": "Push the box onto the pressure plate."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 4
      }
    },
    {
      "id": 4,
      "name": "Locked Out",
      "map": {
        "size": {
          "w": 60,
          "h": 25
        },
        "platforms": [
          {
            "x": 0,
            "y": 16,
            "w": 60,
            "h": 1
          },
          {
            "x": 10,
            "y": 10,
            "w": 9,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_basic",
          "x": 42,
          "y": 15
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 5,
          "w": 20,
          "text": "The Portal is locked. Find the Key."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": true,
      "keyPos": {
        "x": 14,
        "y": 8
      },
      "portalPos": {
        "x": 57,
        "y": 14
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 5
      }
    },
    {
      "id": 5,
      "name": "Predator",
      "map": {
        "size": {
          "w": 80,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 20,
            "h": 1
          },
          {
            "x": 25,
            "y": 12,
            "w": 10,
            "h": 1
          },
          {
            "x": 45,
            "y": 15,
            "w": 35,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_hunter",
          "x": 61,
          "y": 11
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 10,
          "w": 20,
          "text": "Caution: Hostiles can jump."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 6
      }
    },
    {
      "id": 6,
      "name": "Sniper Alley",
      "map": {
        "size": {
          "w": 100,
          "h": 20
        },
        "platforms": [
          {
            "x": -5,
            "y": 15,
            "w": 105,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_ranged",
          "x": 41,
          "y": 14
        },
        {
          "type": "triangle_ranged",
          "x": 79,
          "y": 14
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 10,
          "w": 20,
          "text": "Dodge the projectiles."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 7
      }
    },
    {
      "id": 7,
      "name": "Rapid Fire",
      "map": {
        "size": {
          "w": 80,
          "h": 25
        },
        "platforms": [
          {
            "x": -5,
            "y": 20,
            "w": 20,
            "h": 1
          },
          {
            "x": 20,
            "y": 17,
            "w": 5,
            "h": 1
          },
          {
            "x": 30,
            "y": 14,
            "w": 5,
            "h": 1
          },
          {
            "x": 40,
            "y": 20,
            "w": 40,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_rapid",
          "x": 60,
          "y": 0
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 8
      }
    },
    {
      "id": 8,
      "name": "The Tank",
      "map": {
        "size": {
          "w": 60,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 60,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_heavy",
          "x": 45,
          "y": 14,
          "hp": 5
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [
        {
          "x": 10,
          "w": 20,
          "text": "Heavy units require sustained fire."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 9
      }
    },
    {
      "id": 9,
      "name": "Escort Duty",
      "map": {
        "size": {
          "w": 100,
          "h": 22
        },
        "platforms": [
          {
            "x": 0,
            "y": 18,
            "w": 68,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_ranged",
          "x": 52,
          "y": 16
        }
      ],
      "boxes": [
        {
          "x": 18,
          "y": 17
        }
      ],
      "doors": [
        {
          "x": 47,
          "y": 17,
          "h": 8,
          "id": "d9"
        }
      ],
      "buttons": [
        {
          "x": 41,
          "y": 17,
          "id": "b9",
          "linkToDoorId": "d9",
          "behavior": "hold"
        }
      ],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "portalPos": {
        "x": 65,
        "y": 16
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 10
      }
    },
    {
      "id": 10,
      "name": "Ascension",
      "map": {
        "size": {
          "w": 40,
          "h": 50
        },
        "platforms": [
          {
            "x": 0,
            "y": 48,
            "w": 40,
            "h": 2
          },
          {
            "x": 10,
            "y": 43,
            "w": 8,
            "h": 1
          },
          {
            "x": 22,
            "y": 37,
            "w": 8,
            "h": 1
          },
          {
            "x": 5,
            "y": 33,
            "w": 8,
            "h": 1
          },
          {
            "x": 17,
            "y": 29,
            "w": 15,
            "h": 1
          },
          {
            "x": 4,
            "y": 24,
            "w": 10,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_basic",
          "x": 24,
          "y": 27
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "portalPos": {
        "x": 8,
        "y": 22
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 47
        }
      ],
      "exit": {
        "to": 11
      }
    },
    {
      "id": 11,
      "name": "The Sprint",
      "map": {
        "size": {
          "w": 120,
          "h": 20
        },
        "platforms": [
          {
            "x": 0,
            "y": 15,
            "w": 74,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_hunter",
          "x": 47,
          "y": 14,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 55,
          "y": 14,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 34,
          "y": 14,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 42,
          "y": 14,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 69,
          "y": 14,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 62,
          "y": 14,
          "hp": 1,
          "speed": 100
        }
      ],
      "boxes": [],
      "doors": [
        {
          "x": 27,
          "y": 14,
          "h": 8,
          "id": "d11"
        }
      ],
      "buttons": [
        {
          "x": 15,
          "y": 14,
          "id": "b11",
          "linkToDoorId": "d11",
          "behavior": "once"
        }
      ],
      "infoPoints": [
        {
          "x": 5,
          "w": 10,
          "text": "Run."
        }
      ],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "portalPos": {
        "x": 71,
        "y": 13
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 10
        }
      ],
      "exit": {
        "to": 12
      }
    },
    {
      "id": 12,
      "name": "Divide",
      "map": {
        "size": {
          "w": 80,
          "h": 30
        },
        "platforms": [
          {
            "x": 0,
            "y": 25,
            "w": 23,
            "h": 1
          },
          {
            "x": 30,
            "y": 25,
            "w": 20,
            "h": 1
          },
          {
            "x": 30,
            "y": 13,
            "w": 20,
            "h": 1
          },
          {
            "x": 60,
            "y": 25,
            "w": 20,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_ranged",
          "x": 39,
          "y": 12
        },
        {
          "type": "triangle_heavy",
          "x": 70,
          "y": 24,
          "hp": 5
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": true,
      "keyPos": {
        "x": 40,
        "y": 23
      },
      "portalPos": {
        "x": 75,
        "y": 23
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 24
        }
      ],
      "exit": {
        "to": 13
      }
    },
    {
      "id": 13,
      "name": "Precarious",
      "map": {
        "size": {
          "w": 100,
          "h": 30
        },
        "platforms": [
          {
            "x": 0,
            "y": 20,
            "w": 10,
            "h": 1
          },
          {
            "x": 20,
            "y": 18,
            "w": 4,
            "h": 1
          },
          {
            "x": 35,
            "y": 16,
            "w": 4,
            "h": 1
          },
          {
            "x": 50,
            "y": 14,
            "w": 4,
            "h": 1
          },
          {
            "x": 65,
            "y": 12,
            "w": 10,
            "h": 1
          },
          {
            "x": 85,
            "y": 10,
            "w": 15,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_ranged",
          "x": 90,
          "y": 9
        },
        {
          "type": "triangle_basic",
          "x": 21,
          "y": 17,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_basic",
          "x": 36,
          "y": 15,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_hunter",
          "x": 51,
          "y": 13,
          "hp": 1,
          "speed": 100
        },
        {
          "type": "triangle_ranged",
          "x": 68,
          "y": 11,
          "hp": 1,
          "speed": 100
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "portalPos": {
        "x": 96,
        "y": 8
      },
      "checkpoints": [
        {
          "x": 2,
          "y": 19
        }
      ],
      "exit": {
        "to": 14
      }
    },
    {
      "id": 14,
      "name": "Final Test",
      "map": {
        "size": {
          "w": 140,
          "h": 25
        },
        "platforms": [
          {
            "x": 0,
            "y": 20,
            "w": 26,
            "h": 1
          },
          {
            "x": 35,
            "y": 20,
            "w": 30,
            "h": 1
          },
          {
            "x": 75,
            "y": 20,
            "w": 30,
            "h": 1
          },
          {
            "x": 115,
            "y": 20,
            "w": 25,
            "h": 1
          }
        ]
      },
      "enemies": [
        {
          "type": "triangle_hunter",
          "x": 47,
          "y": 19
        },
        {
          "type": "triangle_rapid",
          "x": 85,
          "y": 19
        },
        {
          "type": "triangle_heavy",
          "x": 129,
          "y": 19
        }
      ],
      "boxes": [],
      "doors": [],
      "buttons": [],
      "infoPoints": [],
      "items": [
        {
          "weapon": "light_gun"
        }
      ],
      "hasKey": false,
      "checkpoints": [
        {
          "x": 2,
          "y": 18
        }
      ],
      "exit": {
        "to": 15
      }
    }
  ]
};
