// 자동 생성 파일 - 직접 고치지 말 것 (tools/update_json_bundle.ps1 로 다시 만든다)
window.ASSET_JSON_BUNDLE = {
  "assets/effects/effects.json": {
  "note": "sizes in px (w,h). slash_1..3 = player sword slash growth frames; heart_1..2 = heal pickup blink; mob_slash = ladybug attack arc; hit_star = common hit spark; spit_projectile = fly projectile",
  "sizes": {
    "slash_1": [
      54,
      59
    ],
    "slash_2": [
      73,
      83
    ],
    "slash_3": [
      96,
      103
    ],
    "heart_1": [
      24,
      21
    ],
    "heart_2": [
      24,
      21
    ],
    "mob_slash": [
      39,
      40
    ],
    "hit_star": [
      24,
      25
    ],
    "spit_projectile": [
      24,
      21
    ]
  }
},
  "assets/effects/zone2_fx.json": {
  "note": "Zone 2 spider effects at 0.5x. fx_web_shot = ranger projectile, fx_web_trap = boss ground web trap (slows/roots player), fx_web_beam = boss web stream.",
  "effects": {
    "fx_web_shot": {
      "frameSize": [
        199,
        72
      ],
      "anchor": [
        99,
        36
      ],
      "anchorType": "center",
      "sheet": {
        "file": "fx_web_shot_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_web_trap": {
      "frameSize": [
        204,
        184
      ],
      "anchor": [
        102,
        92
      ],
      "anchorType": "center",
      "sheet": {
        "file": "fx_web_trap_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_web_beam": {
      "frameSize": [
        254,
        114
      ],
      "anchor": [
        2,
        55
      ],
      "anchorType": "left tip, vertical centre; extends to the right (rotate toward aim)",
      "sheet": {
        "file": "fx_web_beam_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    }
  }
},
  "assets/sprites/z01/ant_alt/ant_alt.json": {
  "name": "ant_alt",
  "facing": "right",
  "frameSize": [
    84,
    64
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "ant_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/ant/ant.json": {
  "name": "ant",
  "facing": "right",
  "frameSize": [
    84,
    64
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "ant_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/boss_bee/boss_bee.json": {
  "name": "boss_bee",
  "facing": "right",
  "frameSize": [
    194,
    162
  ],
  "pivot": "center",
  "bodySizePx": 160,
  "sheet": {
    "file": "boss_bee_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/fly_alt/fly_alt.json": {
  "name": "fly_alt",
  "facing": "right",
  "frameSize": [
    78,
    74
  ],
  "pivot": "center",
  "bodySizePx": 60,
  "sheet": {
    "file": "fly_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/fly/fly.json": {
  "name": "fly",
  "facing": "right",
  "frameSize": [
    78,
    74
  ],
  "pivot": "center",
  "bodySizePx": 60,
  "sheet": {
    "file": "fly_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/ladybug_alt/ladybug_alt.json": {
  "name": "ladybug_alt",
  "facing": "right",
  "frameSize": [
    70,
    58
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "ladybug_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/ladybug/ladybug.json": {
  "name": "ladybug",
  "facing": "right",
  "frameSize": [
    70,
    58
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "ladybug_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z01/player/player.json": {
  "name": "player",
  "facing": "right",
  "frameSize": [
    136,
    76
  ],
  "pivot": "bottom-center",
  "bodySizePx": 64,
  "sheet": {
    "file": "player_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/boss_spider/boss_spider.json": {
  "name": "boss_spider",
  "facing": "right",
  "frameSize": [
    172,
    124
  ],
  "pivot": "bottom-center",
  "bodySizePx": 160,
  "sheet": {
    "file": "boss_spider_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_jumper_alt/spider_jumper_alt.json": {
  "name": "spider_jumper_alt",
  "facing": "right",
  "frameSize": [
    74,
    56
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_jumper_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_jumper/spider_jumper.json": {
  "name": "spider_jumper",
  "facing": "right",
  "frameSize": [
    74,
    56
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_jumper_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_ranger_alt/spider_ranger_alt.json": {
  "name": "spider_ranger_alt",
  "facing": "right",
  "frameSize": [
    78,
    58
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_ranger_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_ranger/spider_ranger.json": {
  "name": "spider_ranger",
  "facing": "right",
  "frameSize": [
    78,
    58
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_ranger_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 2,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_tank_alt/spider_tank_alt.json": {
  "name": "spider_tank_alt",
  "facing": "right",
  "frameSize": [
    74,
    50
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_tank_alt_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/sprites/z02/spider_tank/spider_tank.json": {
  "name": "spider_tank",
  "facing": "right",
  "frameSize": [
    74,
    50
  ],
  "pivot": "bottom-center",
  "bodySizePx": 60,
  "sheet": {
    "file": "spider_tank_sheet.png",
    "columns": 3,
    "rows": 4
  },
  "anims": {
    "move": {
      "row": 0,
      "frames": 3,
      "fps": 8,
      "loop": true
    },
    "atk": {
      "row": 1,
      "frames": 1,
      "fps": 10,
      "loop": false
    },
    "hit": {
      "row": 2,
      "frames": 1,
      "fps": 6,
      "loop": false
    },
    "die": {
      "row": 3,
      "frames": 3,
      "fps": 6,
      "loop": false
    }
  }
},
  "assets/weapons/fx/weapon_fx.json": {
  "note": "Weapon effect animations at 0.5x of the generated sheet. anchor = point to place on the player/target. Scale up/down in code for upgrades.",
  "effects": {
    "fx_spray": {
      "frameSize": [
        244,
        184
      ],
      "anchor": [
        2,
        97
      ],
      "anchorType": "origin at left tip, vertical centre; effect extends to the right (rotate toward aim)",
      "sheet": {
        "file": "fx_spray_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    },
    "fx_watergun": {
      "frameSize": [
        252,
        92
      ],
      "anchor": [
        2,
        42
      ],
      "anchorType": "origin at left tip, vertical centre; effect extends to the right (rotate toward aim)",
      "sheet": {
        "file": "fx_watergun_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    },
    "fx_magnifier": {
      "frameSize": [
        246,
        126
      ],
      "anchor": [
        2,
        60
      ],
      "anchorType": "origin at left tip, vertical centre; effect extends to the right (rotate toward aim)",
      "sheet": {
        "file": "fx_magnifier_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    },
    "fx_homemat": {
      "frameSize": [
        208,
        166
      ],
      "anchor": [
        104,
        82
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_homemat_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_fan": {
      "frameSize": [
        196,
        160
      ],
      "anchor": [
        98,
        80
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_fan_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_vacuum": {
      "frameSize": [
        176,
        173
      ],
      "anchor": [
        88,
        86
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_vacuum_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_slipper": {
      "frameSize": [
        129,
        142
      ],
      "anchor": [
        64,
        71
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_slipper_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_coil": {
      "frameSize": [
        162,
        156
      ],
      "anchor": [
        62,
        154
      ],
      "anchorType": "bottom centre of the base",
      "sheet": {
        "file": "fx_coil_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_glue": {
      "frameSize": [
        207,
        113
      ],
      "anchor": [
        95,
        110
      ],
      "anchorType": "bottom centre of the base",
      "sheet": {
        "file": "fx_glue_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    },
    "fx_zapper": {
      "frameSize": [
        215,
        126
      ],
      "anchor": [
        2,
        70
      ],
      "anchorType": "origin at left tip, vertical centre; effect extends to the right (rotate toward aim)",
      "sheet": {
        "file": "fx_zapper_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    },
    "fx_smoke": {
      "frameSize": [
        222,
        159
      ],
      "anchor": [
        111,
        79
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_smoke_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": false
    },
    "fx_net": {
      "frameSize": [
        217,
        175
      ],
      "anchor": [
        108,
        87
      ],
      "anchorType": "centre",
      "sheet": {
        "file": "fx_net_sheet.png",
        "columns": 3,
        "rows": 1
      },
      "fps": 8,
      "frames": 3,
      "loop": true
    }
  }
},
  "assets/weapons/icons.json": {
  "note": "Icons 128px (cards) and 64px (HUD). Order/ids below.",
  "weapons": [
    "sword",
    "fkiller",
    "homemat",
    "slipper",
    "mosquito_coil",
    "glue_trap",
    "zapper",
    "smoke_bomb",
    "magnifier",
    "watergun",
    "fan",
    "vacuum",
    "mosquito_net"
  ],
  "stats": [
    "stat_damage",
    "stat_range",
    "stat_speed"
  ]
},
};
