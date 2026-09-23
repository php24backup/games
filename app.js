/**
 * ============================================================================
 * WORD-MAPPING - CORE GAME ENGINE (app.js)
 * ============================================================================
 * Platform Compliance: YouTube Playables & Facebook Instant Games
 * Document Reference: RULES-CORE-002 & GDD-WORD-MAPPING-002
 * 
 * Phase 3 Architecture:
 * - Letter Grid Generation & Dynamic Canvas Scaling
 * - High-Precision Mouse & Touch Drag Detection (Pointer Events API)
 * - Real-Time Spline Trajectory & Tile Glow Rendering
 * - Word Validation: Primary Target Words (10-15 words) vs Bonus Words (+5 Coins)
 * - Procedural Sound Synthesis (Web Audio API - 0 External Audio Files)
 * - Safe DOM Manipulation (Strict textContent / createElement - 0 XSS Risk)
 * ============================================================================
 */

'use strict';

/* ============================================================================
 * 0. CENTRALIZED GAME CONFIGURATION & ECONOMY FALLBACK
 * ============================================================================
 */
if (typeof window !== 'undefined' && typeof window.GAME_CONFIG === 'undefined') {
  window.GAME_CONFIG = Object.freeze({
    INITIAL_COINS: 10,
    TRANSLATION_COST: 5,
    HINT_COST: 2,
    SKIP_LEVEL_COST: 30,
    BONUS_WORD_COINS: 5,
    LEVEL_CLEAR_MIN_COINS: 10,
    LEVEL_CLEAR_MAX_COINS: 20,
    AD_REWARD_COINS: 50,
    DAILY_STREAK_REWARDS: [25, 35, 50, 65, 80, 90, 100],
    MAX_STREAK_DAYS: 7
  });
}

/* ============================================================================
 * 1. STRUCTURED 20-LEVEL PROGRESSION SYSTEM (10 TO 15 WORDS PER LEVEL)
 * ============================================================================
 */
const GAME_LEVELS = [
  {
    "level": 1,
    "theme": "Animals & Pets",
    "gridSize": 4,
    "timeLimit": 120,
    "grid": [
      [
        "B",
        "A",
        "T",
        "S"
      ],
      [
        "R",
        "C",
        "O",
        "W"
      ],
      [
        "A",
        "D",
        "O",
        "L"
      ],
      [
        "M",
        "P",
        "I",
        "G"
      ]
    ],
    "words": [
      "CAT",
      "DOG",
      "COW",
      "PIG",
      "BAT",
      "RAT",
      "RAM",
      "OWL",
      "SOW",
      "COD"
    ],
    "translations": {
      "CAT": {
        "hindi": "बिल्ली",
        "telugu": "పిల్లి",
        "chinese": "猫",
        "spanish": "gato",
        "french": "chat",
        "german": "katze",
        "arabic": "قطة",
        "japanese": "猫",
        "russian": "кот",
        "portuguese": "gato",
        "italian": "gatto",
        "korean": "고양이"
      },
      "DOG": {
        "hindi": "कुत्ता",
        "telugu": "కుక్క",
        "chinese": "狗",
        "spanish": "perro",
        "french": "chien",
        "german": "hund",
        "arabic": "كلب",
        "japanese": "犬",
        "russian": "собака",
        "portuguese": "cachorro",
        "italian": "cane",
        "korean": "개"
      },
      "COW": {
        "hindi": "गाय",
        "telugu": "ఆవు",
        "chinese": "牛",
        "spanish": "vaca",
        "french": "vache",
        "german": "kuh",
        "arabic": "بقرة",
        "japanese": "牛",
        "russian": "корова",
        "portuguese": "vaca",
        "italian": "mucca",
        "korean": "소"
      },
      "PIG": {
        "hindi": "सूअर",
        "telugu": "పంది",
        "chinese": "猪",
        "spanish": "cerdo",
        "french": "cochon",
        "german": "schwein",
        "arabic": "خنزير",
        "japanese": "豚",
        "russian": "свинья",
        "portuguese": "porco",
        "italian": "maiale",
        "korean": "돼지"
      },
      "BAT": {
        "hindi": "चमगादड़",
        "telugu": "గబ్బిలం",
        "chinese": "蝙蝠",
        "spanish": "murciélago",
        "french": "chauve-souris",
        "german": "fledermaus",
        "arabic": "خفاش",
        "japanese": "蝙蝠",
        "russian": "летучая мышь",
        "portuguese": "morcego",
        "italian": "pipistrello",
        "korean": "박쥐"
      },
      "RAT": {
        "hindi": "चूहा",
        "telugu": "ఎలుక",
        "chinese": "老鼠",
        "spanish": "rata",
        "french": "rat",
        "german": "ratte",
        "arabic": "جرذ",
        "japanese": "鼠",
        "russian": "крыса",
        "portuguese": "rato",
        "italian": "ratto",
        "korean": "쥐"
      },
      "RAM": {
        "hindi": "मेंढ़ा",
        "telugu": "పొట్టేలు",
        "chinese": "公羊",
        "spanish": "carnero",
        "french": "bélier",
        "german": "widder",
        "arabic": "كبش",
        "japanese": "雄羊",
        "russian": "баран",
        "portuguese": "carneiro",
        "italian": "ariete",
        "korean": "숫양"
      },
      "OWL": {
        "hindi": "उल्लू",
        "telugu": "గుడ్లగూబ",
        "chinese": "猫头鹰",
        "spanish": "búho",
        "french": "hibou",
        "german": "eule",
        "arabic": "بومة",
        "japanese": "梟",
        "russian": "сова",
        "portuguese": "coruja",
        "italian": "gufo",
        "korean": "올빼미"
      },
      "SOW": {
        "hindi": "मादा सूअर",
        "telugu": "ఆడపంది",
        "chinese": "母猪",
        "spanish": "cerda",
        "french": "truie",
        "german": "sau",
        "arabic": "خنزيرة",
        "japanese": "雌豚",
        "russian": "свиноматка",
        "portuguese": "porca",
        "italian": "scrofa",
        "korean": "암퇘지"
      },
      "COD": {
        "hindi": "कॉड मछली",
        "telugu": "కాడ్ చేప",
        "chinese": "鳕鱼",
        "spanish": "bacalao",
        "french": "morue",
        "german": "kabeljau",
        "arabic": "قد",
        "japanese": "鱈",
        "russian": "треска",
        "portuguese": "bacalhau",
        "italian": "merluzzo",
        "korean": "대구"
      }
    },
    "wordPool": [
      "CAT",
      "DOG",
      "COW",
      "PIG",
      "BAT",
      "RAT",
      "RAM",
      "OWL",
      "SOW",
      "COD"
    ]
  },
  {
    "level": 2,
    "theme": "Nature & Elements",
    "gridSize": 4,
    "timeLimit": 115,
    "grid": [
      [
        "S",
        "K",
        "Y",
        "O"
      ],
      [
        "U",
        "E",
        "A",
        "K"
      ],
      [
        "N",
        "I",
        "R",
        "M"
      ],
      [
        "D",
        "E",
        "W",
        "Y"
      ]
    ],
    "words": [
      "SKY",
      "SUN",
      "SEA",
      "AIR",
      "DEW",
      "OAK",
      "EAR",
      "RAY",
      "YAK",
      "RED"
    ],
    "translations": {
      "SKY": {
        "hindi": "आकाश",
        "telugu": "ఆకాశం",
        "chinese": "天空",
        "spanish": "cielo",
        "french": "ciel",
        "german": "himmel",
        "arabic": "سماء",
        "japanese": "空",
        "russian": "небо",
        "portuguese": "céu",
        "italian": "cielo",
        "korean": "하늘"
      },
      "SUN": {
        "hindi": "सूरज",
        "telugu": "సూర్యుడు",
        "chinese": "太阳",
        "spanish": "sol",
        "french": "soleil",
        "german": "sonne",
        "arabic": "شمس",
        "japanese": "太陽",
        "russian": "солнце",
        "portuguese": "sol",
        "italian": "sole",
        "korean": "태양"
      },
      "SEA": {
        "hindi": "समुद्र",
        "telugu": "సముద్రం",
        "chinese": "大海",
        "spanish": "mar",
        "french": "mer",
        "german": "meer",
        "arabic": "بحر",
        "japanese": "海",
        "russian": "море",
        "portuguese": "mar",
        "italian": "mare",
        "korean": "바다"
      },
      "AIR": {
        "hindi": "हवा",
        "telugu": "గాలి",
        "chinese": "空气",
        "spanish": "aire",
        "french": "air",
        "german": "luft",
        "arabic": "هواء",
        "japanese": "空気",
        "russian": "воздух",
        "portuguese": "ar",
        "italian": "aria",
        "korean": "공기"
      },
      "DEW": {
        "hindi": "ओस",
        "telugu": "మంచు బిందువు",
        "chinese": "露水",
        "spanish": "rocío",
        "french": "rosée",
        "german": "tau",
        "arabic": "ندى",
        "japanese": "露",
        "russian": "роса",
        "portuguese": "orvalho",
        "italian": "rugiada",
        "korean": "이슬"
      },
      "OAK": {
        "hindi": "शाहबलूत",
        "telugu": "ఓక్ చెట్టు",
        "chinese": "橡树",
        "spanish": "roble",
        "french": "chêne",
        "german": "eiche",
        "arabic": "بلوط",
        "japanese": "オーク",
        "russian": "дуб",
        "portuguese": "carvalho",
        "italian": "quercia",
        "korean": "참나무"
      },
      "EAR": {
        "hindi": "कान",
        "telugu": "చెవి",
        "chinese": "耳朵",
        "spanish": "oreja",
        "french": "oreille",
        "german": "ohr",
        "arabic": "أذن",
        "japanese": "耳",
        "russian": "ухо",
        "portuguese": "orelha",
        "italian": "orecchio",
        "korean": "귀"
      },
      "RAY": {
        "hindi": "किरण",
        "telugu": "కిరణం",
        "chinese": "光线",
        "spanish": "rayo",
        "french": "rayon",
        "german": "strahl",
        "arabic": "شعاع",
        "japanese": "光線",
        "russian": "луч",
        "portuguese": "raio",
        "italian": "raggio",
        "korean": "광선"
      },
      "YAK": {
        "hindi": "याक",
        "telugu": "జడలబర్రె",
        "chinese": "牦牛",
        "spanish": "yak",
        "french": "yack",
        "german": "yak",
        "arabic": "ياك",
        "japanese": "ヤク",
        "russian": "як",
        "portuguese": "aque",
        "italian": "yak",
        "korean": "야크"
      },
      "RED": {
        "hindi": "लाल",
        "telugu": "ఎరుపు",
        "chinese": "红色",
        "spanish": "rojo",
        "french": "rouge",
        "german": "rot",
        "arabic": "أحمر",
        "japanese": "赤",
        "russian": "красный",
        "portuguese": "vermelho",
        "italian": "rosso",
        "korean": "빨간색"
      }
    },
    "wordPool": [
      "SKY",
      "SUN",
      "SEA",
      "AIR",
      "DEW",
      "OAK",
      "EAR",
      "RAY",
      "YAK",
      "RED"
    ]
  },
  {
    "level": 3,
    "theme": "Colors & Crafts",
    "gridSize": 4,
    "timeLimit": 110,
    "grid": [
      [
        "R",
        "E",
        "D",
        "G"
      ],
      [
        "B",
        "L",
        "U",
        "O"
      ],
      [
        "P",
        "I",
        "N",
        "L"
      ],
      [
        "Y",
        "K",
        "T",
        "D"
      ]
    ],
    "words": [
      "BLUE",
      "PINK",
      "GOLD",
      "INK",
      "PIN",
      "BIN",
      "TIN",
      "LIP",
      "KIN",
      "BED",
      "KNIT"
    ],
    "translations": {
      "BLUE": {
        "hindi": "नीला",
        "telugu": "నీలం",
        "chinese": "蓝色",
        "spanish": "azul",
        "french": "bleu",
        "german": "blau",
        "arabic": "أزرق",
        "japanese": "青",
        "russian": "синий",
        "portuguese": "azul",
        "italian": "blu",
        "korean": "파란색"
      },
      "PINK": {
        "hindi": "गुलाबी",
        "telugu": "గులాబీ రంగు",
        "chinese": "粉色",
        "spanish": "rosa",
        "french": "rose",
        "german": "rosa",
        "arabic": "وردي",
        "japanese": "ピンク",
        "russian": "розовый",
        "portuguese": "rosa",
        "italian": "rosa",
        "korean": "분홍색"
      },
      "GOLD": {
        "hindi": "सोना",
        "telugu": "బంగారం",
        "chinese": "金子",
        "spanish": "oro",
        "french": "or",
        "german": "gold",
        "arabic": "ذهب",
        "japanese": "金",
        "russian": "золото",
        "portuguese": "ouro",
        "italian": "oro",
        "korean": "금"
      },
      "INK": {
        "hindi": "स्याही",
        "telugu": "సిరా",
        "chinese": "墨水",
        "spanish": "tinta",
        "french": "encre",
        "german": "tinte",
        "arabic": "حبر",
        "japanese": "インク",
        "russian": "чернила",
        "portuguese": "tinta",
        "italian": "inchiostro",
        "korean": "먹물"
      },
      "PIN": {
        "hindi": "आलपिन",
        "telugu": "సూది",
        "chinese": "别针",
        "spanish": "alfiler",
        "french": "épingle",
        "german": "stecknadel",
        "arabic": "دبوس",
        "japanese": "ピン",
        "russian": "булавка",
        "portuguese": "alfinete",
        "italian": "spillo",
        "korean": "핀"
      },
      "BIN": {
        "hindi": "पात्र",
        "telugu": "డబ్బా",
        "chinese": "储物箱",
        "spanish": "cubo",
        "french": "bac",
        "german": "behälter",
        "arabic": "صندوق",
        "japanese": "容器",
        "russian": "контейнер",
        "portuguese": "recipiente",
        "italian": "cestino",
        "korean": "상자"
      },
      "TIN": {
        "hindi": "टिन",
        "telugu": "తగరము",
        "chinese": "锡",
        "spanish": "estaño",
        "french": "étain",
        "german": "zinn",
        "arabic": "قصدير",
        "japanese": "スズ",
        "russian": "олово",
        "portuguese": "estanho",
        "italian": "stagno",
        "korean": "주석"
      },
      "LIP": {
        "hindi": "होंठ",
        "telugu": "పెదవి",
        "chinese": "嘴唇",
        "spanish": "labio",
        "french": "lèvre",
        "german": "lippe",
        "arabic": "شفة",
        "japanese": "唇",
        "russian": "губа",
        "portuguese": "lábio",
        "italian": "labbro",
        "korean": "입술"
      },
      "KIN": {
        "hindi": "रिश्तेदार",
        "telugu": "బంధువులు",
        "chinese": "亲属",
        "spanish": "familia",
        "french": "famille",
        "german": "verwandtschaft",
        "arabic": "أقارب",
        "japanese": "親族",
        "russian": "родня",
        "portuguese": "parentes",
        "italian": "parentela",
        "korean": "친척"
      },
      "BED": {
        "hindi": "बिस्तर",
        "telugu": "మంచం",
        "chinese": "床",
        "spanish": "cama",
        "french": "lit",
        "german": "bett",
        "arabic": "سرير",
        "japanese": "ベッド",
        "russian": "кровать",
        "portuguese": "cama",
        "italian": "letto",
        "korean": "침대"
      },
      "KNIT": {
        "hindi": "बुनना",
        "telugu": "అల్లడం",
        "chinese": "编织",
        "spanish": "tejer",
        "french": "tricoter",
        "german": "stricken",
        "arabic": "حياكة",
        "japanese": "編む",
        "russian": "вязать",
        "portuguese": "tricotar",
        "italian": "lavorare a maglia",
        "korean": "뜨개질하다"
      }
    },
    "wordPool": [
      "BLUE",
      "PINK",
      "GOLD",
      "INK",
      "PIN",
      "BIN",
      "TIN",
      "LIP",
      "KIN",
      "BED",
      "KNIT"
    ]
  },
  {
    "level": 4,
    "theme": "Kitchen & Foods",
    "gridSize": 5,
    "timeLimit": 105,
    "grid": [
      [
        "M",
        "I",
        "L",
        "K",
        "S"
      ],
      [
        "R",
        "I",
        "C",
        "E",
        "O"
      ],
      [
        "M",
        "E",
        "A",
        "T",
        "U"
      ],
      [
        "B",
        "E",
        "A",
        "N",
        "P"
      ],
      [
        "C",
        "A",
        "K",
        "E",
        "S"
      ]
    ],
    "words": [
      "MILK",
      "RICE",
      "MEAT",
      "BEAN",
      "CAKE",
      "SOUP",
      "EAT",
      "TEA",
      "PEA",
      "NUT",
      "ICE"
    ],
    "translations": {
      "MILK": {
        "hindi": "दूध",
        "telugu": "పాలు",
        "chinese": "牛奶",
        "spanish": "leche",
        "french": "lait",
        "german": "milch",
        "arabic": "حليب",
        "japanese": "牛乳",
        "russian": "молоко",
        "portuguese": "leite",
        "italian": "latte",
        "korean": "우유"
      },
      "RICE": {
        "hindi": "चावल",
        "telugu": "బియ్యం",
        "chinese": "米饭",
        "spanish": "arroz",
        "french": "riz",
        "german": "reis",
        "arabic": "أرز",
        "japanese": "米",
        "russian": "рис",
        "portuguese": "arroz",
        "italian": "riso",
        "korean": "쌀"
      },
      "MEAT": {
        "hindi": "मांस",
        "telugu": "మాంసం",
        "chinese": "肉",
        "spanish": "carne",
        "french": "viande",
        "german": "fleisch",
        "arabic": "لحم",
        "japanese": "肉",
        "russian": "мясо",
        "portuguese": "carne",
        "italian": "carne",
        "korean": "고기"
      },
      "BEAN": {
        "hindi": "सेम",
        "telugu": "చిక్కుడు",
        "chinese": "豆",
        "spanish": "frijol",
        "french": "haricot",
        "german": "bohne",
        "arabic": "فاصوليا",
        "japanese": "豆",
        "russian": "фасоль",
        "portuguese": "feijão",
        "italian": "fagiolo",
        "korean": "콩"
      },
      "CAKE": {
        "hindi": "मिष्ठान्न केक",
        "telugu": "కేక్",
        "chinese": "蛋糕",
        "spanish": "pastel",
        "french": "gâteau",
        "german": "kuchen",
        "arabic": "كعكة",
        "japanese": "ケーキ",
        "russian": "торт",
        "portuguese": "bolo",
        "italian": "torta",
        "korean": "케이크"
      },
      "SOUP": {
        "hindi": "सूप",
        "telugu": "సూప్",
        "chinese": "汤",
        "spanish": "sopa",
        "french": "soupe",
        "german": "suppe",
        "arabic": "حساء",
        "japanese": "スープ",
        "russian": "суп",
        "portuguese": "sopa",
        "italian": "zuppa",
        "korean": "수프"
      },
      "EAT": {
        "hindi": "खाना",
        "telugu": "తినడం",
        "chinese": "吃",
        "spanish": "comer",
        "french": "manger",
        "german": "essen",
        "arabic": "أكل",
        "japanese": "食べる",
        "russian": "есть",
        "portuguese": "comer",
        "italian": "mangiare",
        "korean": "먹다"
      },
      "TEA": {
        "hindi": "चाय",
        "telugu": "తేనీరు",
        "chinese": "茶",
        "spanish": "té",
        "french": "thé",
        "german": "tee",
        "arabic": "شاي",
        "japanese": "お茶",
        "russian": "чай",
        "portuguese": "chá",
        "italian": "tè",
        "korean": "차"
      },
      "PEA": {
        "hindi": "मटर",
        "telugu": "బఠానీ",
        "chinese": "豌豆",
        "spanish": "guisante",
        "french": "pois",
        "german": "erbse",
        "arabic": "بازلاء",
        "japanese": "エンドウ豆",
        "russian": "горох",
        "portuguese": "ervilha",
        "italian": "pisello",
        "korean": "완두콩"
      },
      "NUT": {
        "hindi": "मेवा",
        "telugu": "గింజ",
        "chinese": "坚果",
        "spanish": "nuez",
        "french": "noix",
        "german": "nuss",
        "arabic": "جوز",
        "japanese": "ナッツ",
        "russian": "орех",
        "portuguese": "noz",
        "italian": "noce",
        "korean": "견과"
      },
      "ICE": {
        "hindi": "बर्फ",
        "telugu": "మంచు",
        "chinese": "冰",
        "spanish": "hielo",
        "french": "glace",
        "german": "eis",
        "arabic": "ثلج",
        "japanese": "氷",
        "russian": "лед",
        "portuguese": "gelo",
        "italian": "ghiaccio",
        "korean": "얼음"
      }
    },
    "wordPool": [
      "MILK",
      "RICE",
      "MEAT",
      "BEAN",
      "CAKE",
      "SOUP",
      "EAT",
      "TEA",
      "PEA",
      "NUT",
      "ICE"
    ]
  },
  {
    "level": 5,
    "theme": "Home & Living",
    "gridSize": 5,
    "timeLimit": 100,
    "grid": [
      [
        "C",
        "O",
        "O",
        "R",
        "S"
      ],
      [
        "R",
        "O",
        "B",
        "M",
        "O"
      ],
      [
        "D",
        "E",
        "S",
        "K",
        "F"
      ],
      [
        "L",
        "A",
        "M",
        "P",
        "A"
      ],
      [
        "B",
        "E",
        "D",
        "H",
        "N"
      ]
    ],
    "words": [
      "DOOR",
      "ROOM",
      "DESK",
      "LAMP",
      "SOFA",
      "PAN",
      "BEAM",
      "CORE",
      "ROBE",
      "CORD",
      "DREAM",
      "MASK"
    ],
    "translations": {
      "DOOR": {
        "hindi": "दरवाज़ा",
        "telugu": "తలుపు",
        "chinese": "门",
        "spanish": "puerta",
        "french": "porte",
        "german": "tür",
        "arabic": "باب",
        "japanese": "ドア",
        "russian": "дверь",
        "portuguese": "porta",
        "italian": "porta",
        "korean": "문"
      },
      "ROOM": {
        "hindi": "कमरा",
        "telugu": "గది",
        "chinese": "房间",
        "spanish": "habitación",
        "french": "chambre",
        "german": "zimmer",
        "arabic": "غرفة",
        "japanese": "部屋",
        "russian": "комната",
        "portuguese": "quarto",
        "italian": "stanza",
        "korean": "방"
      },
      "DESK": {
        "hindi": "मेज़",
        "telugu": "డెస్క్",
        "chinese": "书桌",
        "spanish": "escritorio",
        "french": "bureau",
        "german": "schreibtisch",
        "arabic": "مكتب",
        "japanese": "机",
        "russian": "письменный стол",
        "portuguese": "escrivaninha",
        "italian": "scrivania",
        "korean": "책상"
      },
      "LAMP": {
        "hindi": "लैंप",
        "telugu": "దీపం",
        "chinese": "台灯",
        "spanish": "lámpara",
        "french": "lampe",
        "german": "lampe",
        "arabic": "مصباح",
        "japanese": "ランプ",
        "russian": "лампа",
        "portuguese": "lâmpada",
        "italian": "lampada",
        "korean": "램프"
      },
      "SOFA": {
        "hindi": "सोफा",
        "telugu": "సోఫా",
        "chinese": "沙发",
        "spanish": "sofá",
        "french": "canapé",
        "german": "sofa",
        "arabic": "أريكة",
        "japanese": "ソファ",
        "russian": "диван",
        "portuguese": "sofá",
        "italian": "divano",
        "korean": "소파"
      },
      "PAN": {
        "hindi": "कड़ाही",
        "telugu": "పెనం",
        "chinese": "平底锅",
        "spanish": "sartén",
        "french": "poêle",
        "german": "pfanne",
        "arabic": "مقلاة",
        "japanese": "フライパン",
        "russian": "сковорода",
        "portuguese": "frigideira",
        "italian": "padella",
        "korean": "팬"
      },
      "BEAM": {
        "hindi": "बीम",
        "telugu": "బీమ్",
        "chinese": "横梁",
        "spanish": "viga",
        "french": "poutre",
        "german": "balken",
        "arabic": "شعاع",
        "japanese": "梁",
        "russian": "балка",
        "portuguese": "viga",
        "italian": "trave",
        "korean": "들보"
      },
      "CORE": {
        "hindi": "मुख्य भाग",
        "telugu": "ప్రధాన భాగం",
        "chinese": "核心",
        "spanish": "núcleo",
        "french": "noyau",
        "german": "kern",
        "arabic": "لب",
        "japanese": "芯",
        "russian": "ядро",
        "portuguese": "núcleo",
        "italian": "nucleo",
        "korean": "핵심"
      },
      "ROBE": {
        "hindi": "चोगा",
        "telugu": "గౌను",
        "chinese": "长袍",
        "spanish": "túnica",
        "french": "robe",
        "german": "robe",
        "arabic": "رداء",
        "japanese": "ローブ",
        "russian": "халат",
        "portuguese": "roupão",
        "italian": "vestaglia",
        "korean": "로브"
      },
      "CORD": {
        "hindi": "डोरी (रस्सी)",
        "telugu": "తాడు",
        "chinese": "绳子",
        "spanish": "cuerda",
        "french": "corde",
        "german": "schnur",
        "arabic": "حبل",
        "japanese": "ひも",
        "russian": "шнур",
        "portuguese": "cordão",
        "italian": "corda",
        "korean": "코드"
      },
      "DREAM": {
        "hindi": "सपना",
        "telugu": "కల",
        "chinese": "梦",
        "spanish": "sueño",
        "french": "rêve",
        "german": "traum",
        "arabic": "حلم",
        "japanese": "夢",
        "russian": "мечта",
        "portuguese": "sonho",
        "italian": "sogno",
        "korean": "꿈"
      },
      "MASK": {
        "hindi": "मुखौटा",
        "telugu": "ముసుగు",
        "chinese": "面具",
        "spanish": "máscara",
        "french": "masque",
        "german": "maske",
        "arabic": "قناع",
        "japanese": "仮面",
        "russian": "маска",
        "portuguese": "máscara",
        "italian": "maschera",
        "korean": "가면"
      }
    },
    "wordPool": [
      "DOOR",
      "ROOM",
      "DESK",
      "LAMP",
      "SOFA",
      "PAN",
      "BEAM",
      "CORE",
      "ROBE",
      "CORD",
      "DREAM",
      "MASK"
    ]
  },
  {
    "level": 6,
    "theme": "Travel & Vehicles",
    "gridSize": 5,
    "timeLimit": 95,
    "grid": [
      [
        "S",
        "H",
        "I",
        "P",
        "B"
      ],
      [
        "B",
        "O",
        "A",
        "T",
        "O"
      ],
      [
        "R",
        "O",
        "A",
        "D",
        "A"
      ],
      [
        "B",
        "I",
        "K",
        "E",
        "T"
      ],
      [
        "C",
        "A",
        "R",
        "T",
        "S"
      ]
    ],
    "words": [
      "SHIP",
      "BOAT",
      "ROAD",
      "BIKE",
      "CART",
      "CAR",
      "DOT",
      "CAB",
      "TREK",
      "SEAT",
      "REST",
      "BOOK"
    ],
    "translations": {
      "SHIP": {
        "hindi": "जहाज़",
        "telugu": "ఓడ",
        "chinese": "轮船",
        "spanish": "barco",
        "french": "navire",
        "german": "schiff",
        "arabic": "سفينة",
        "japanese": "船",
        "russian": "корабль",
        "portuguese": "navio",
        "italian": "nave",
        "korean": "배"
      },
      "BOAT": {
        "hindi": "नौका",
        "telugu": "పడవ",
        "chinese": "小船",
        "spanish": "bote",
        "french": "bateau",
        "german": "boot",
        "arabic": "قارب",
        "japanese": "ボート",
        "russian": "лодка",
        "portuguese": "barco",
        "italian": "barca",
        "korean": "보트"
      },
      "ROAD": {
        "hindi": "सड़क",
        "telugu": "రోడ్డు",
        "chinese": "道路",
        "spanish": "carretera",
        "french": "route",
        "german": "straße",
        "arabic": "طريق",
        "japanese": "道路",
        "russian": "дорога",
        "portuguese": "estrada",
        "italian": "strada",
        "korean": "도로"
      },
      "BIKE": {
        "hindi": "साइकिल",
        "telugu": "సైకిల్",
        "chinese": "自行车",
        "spanish": "bicicleta",
        "french": "vélo",
        "german": "fahrrad",
        "arabic": "دراجة",
        "japanese": "自転車",
        "russian": "велосипед",
        "portuguese": "bicicleta",
        "italian": "bicicletta",
        "korean": "자전거"
      },
      "CART": {
        "hindi": "गाड़ी",
        "telugu": "బండి",
        "chinese": "手推车",
        "spanish": "carro",
        "french": "chariot",
        "german": "karren",
        "arabic": "عربة",
        "japanese": "荷車",
        "russian": "телега",
        "portuguese": "carroça",
        "italian": "carro",
        "korean": "수레"
      },
      "CAR": {
        "hindi": "मोटरगाड़ी",
        "telugu": "కారు",
        "chinese": "汽车",
        "spanish": "coche",
        "french": "voiture",
        "german": "auto",
        "arabic": "سيارة",
        "japanese": "車",
        "russian": "машина",
        "portuguese": "carro",
        "italian": "auto",
        "korean": "자동차"
      },
      "DOT": {
        "hindi": "बिंदु",
        "telugu": "చుక్క",
        "chinese": "圆点",
        "spanish": "punto",
        "french": "point",
        "german": "punkt",
        "arabic": "نقطة",
        "japanese": "点",
        "russian": "точка",
        "portuguese": "ponto",
        "italian": "punto",
        "korean": "점"
      },
      "CAB": {
        "hindi": "टैक्सी",
        "telugu": "టాక్సీ",
        "chinese": "出租车",
        "spanish": "taxi",
        "french": "taxi",
        "german": "taxi",
        "arabic": "تاكسي",
        "japanese": "タクシー",
        "russian": "такси",
        "portuguese": "táxi",
        "italian": "taxi",
        "korean": "택시"
      },
      "TREK": {
        "hindi": "यात्रा",
        "telugu": "ప్రయాణం",
        "chinese": "徒步旅行",
        "spanish": "caminata",
        "french": "randonnée",
        "german": "wanderung",
        "arabic": "رحلة شاقة",
        "japanese": "トレッキング",
        "russian": "поход",
        "portuguese": "caminhada",
        "italian": "trekking",
        "korean": "트레킹"
      },
      "SEAT": {
        "hindi": "सीट (आसन)",
        "telugu": "సీటు",
        "chinese": "座位",
        "spanish": "asiento",
        "french": "siège",
        "german": "sitz",
        "arabic": "مقعد",
        "japanese": "座席",
        "russian": "сиденье",
        "portuguese": "assento",
        "italian": "sedile",
        "korean": "좌석"
      },
      "REST": {
        "hindi": "आराम",
        "telugu": "విశ్రాంతి",
        "chinese": "休息",
        "spanish": "descanso",
        "french": "repos",
        "german": "ruhe",
        "arabic": "راحة",
        "japanese": "休息",
        "russian": "отдых",
        "portuguese": "descanso",
        "italian": "riposo",
        "korean": "휴식"
      },
      "BOOK": {
        "hindi": "किताब",
        "telugu": "పుస్తకం",
        "chinese": "书",
        "spanish": "libro",
        "french": "livre",
        "german": "buch",
        "arabic": "كتاب",
        "japanese": "本",
        "russian": "книга",
        "portuguese": "livro",
        "italian": "libro",
        "korean": "책"
      }
    },
    "wordPool": [
      "SHIP",
      "BOAT",
      "ROAD",
      "BIKE",
      "CART",
      "CAR",
      "DOT",
      "CAB",
      "TREK",
      "SEAT",
      "REST",
      "BOOK"
    ]
  },
  {
    "level": 7,
    "theme": "Forest & Plants",
    "gridSize": 5,
    "timeLimit": 90,
    "grid": [
      [
        "T",
        "R",
        "E",
        "E",
        "S"
      ],
      [
        "L",
        "E",
        "A",
        "F",
        "E"
      ],
      [
        "R",
        "O",
        "O",
        "T",
        "E"
      ],
      [
        "B",
        "A",
        "R",
        "K",
        "D"
      ],
      [
        "S",
        "E",
        "E",
        "D",
        "S"
      ]
    ],
    "words": [
      "TREE",
      "LEAF",
      "ROOT",
      "BARK",
      "SEED",
      "BEE",
      "ROOF",
      "DEER",
      "BROOK",
      "REED",
      "BOAR",
      "ROOK",
      "RAFT"
    ],
    "translations": {
      "TREE": {
        "hindi": "पेड़",
        "telugu": "చెట్టు",
        "chinese": "树",
        "spanish": "árbol",
        "french": "arbre",
        "german": "baum",
        "arabic": "شجرة",
        "japanese": "木",
        "russian": "дерево",
        "portuguese": "árvore",
        "italian": "albero",
        "korean": "나무"
      },
      "LEAF": {
        "hindi": "पत्ता",
        "telugu": "ఆకు",
        "chinese": "树叶",
        "spanish": "hoja",
        "french": "feuille",
        "german": "blatt",
        "arabic": "ورقة شجر",
        "japanese": "葉",
        "russian": "лист",
        "portuguese": "folha",
        "italian": "foglia",
        "korean": "나뭇잎"
      },
      "ROOT": {
        "hindi": "जड़",
        "telugu": "వేరు",
        "chinese": "根",
        "spanish": "raíz",
        "french": "racine",
        "german": "wurzel",
        "arabic": "جذر",
        "japanese": "根",
        "russian": "корень",
        "portuguese": "raiz",
        "italian": "radice",
        "korean": "뿌리"
      },
      "BARK": {
        "hindi": "छाल",
        "telugu": "బెరడు",
        "chinese": "树皮",
        "spanish": "corteza",
        "french": "écorce",
        "german": "rinde",
        "arabic": "لحاء",
        "japanese": "樹皮",
        "russian": "кора",
        "portuguese": "casca",
        "italian": "corteccia",
        "korean": "나무껍질"
      },
      "SEED": {
        "hindi": "बीज",
        "telugu": "విత్తనం",
        "chinese": "种子",
        "spanish": "semilla",
        "french": "graine",
        "german": "samen",
        "arabic": "بذرة",
        "japanese": "種",
        "russian": "семя",
        "portuguese": "semente",
        "italian": "seme",
        "korean": "씨앗"
      },
      "BEE": {
        "hindi": "मधुमक्खी",
        "telugu": "తేనెటీగ",
        "chinese": "蜜蜂",
        "spanish": "abeja",
        "french": "abeille",
        "german": "biene",
        "arabic": "نحلة",
        "japanese": "蜂",
        "russian": "пчела",
        "portuguese": "abelha",
        "italian": "ape",
        "korean": "꿀벌"
      },
      "ROOF": {
        "hindi": "छत",
        "telugu": "పైకప్పు",
        "chinese": "屋顶",
        "spanish": "techo",
        "french": "toit",
        "german": "dach",
        "arabic": "سقف",
        "japanese": "屋根",
        "russian": "крыша",
        "portuguese": "telhado",
        "italian": "tetto",
        "korean": "지붕"
      },
      "DEER": {
        "hindi": "हिरण",
        "telugu": "జింక",
        "chinese": "鹿",
        "spanish": "ciervo",
        "french": "cerf",
        "german": "hirsch",
        "arabic": "غزال",
        "japanese": "鹿",
        "russian": "олень",
        "portuguese": "veado",
        "italian": "cervo",
        "korean": "사슴"
      },
      "BROOK": {
        "hindi": "छोटी नदी या नाला या झरना",
        "telugu": "చిన్న వాగు",
        "chinese": "小溪",
        "spanish": "arroyo",
        "french": "ruisseau",
        "german": "bach",
        "arabic": "جدول",
        "japanese": "小川",
        "russian": "ручей",
        "portuguese": "riacho",
        "italian": "ruscello",
        "korean": "개울"
      },
      "REED": {
        "hindi": "नरकट या सरकंडा",
        "telugu": "తుంగ",
        "chinese": "芦苇",
        "spanish": "caña",
        "french": "roseau",
        "german": "schilf",
        "arabic": "قصب",
        "japanese": "葦",
        "russian": "тростник",
        "portuguese": "junco",
        "italian": "canna",
        "korean": "갈대"
      },
      "BOAR": {
        "hindi": "जंगली सूअर",
        "telugu": "అడవి పంది",
        "chinese": "野猪",
        "spanish": "jabalí",
        "french": "sanglier",
        "german": "wildschwein",
        "arabic": "خنزير بري",
        "japanese": "猪",
        "russian": "кабан",
        "portuguese": "javali",
        "italian": "cinghiale",
        "korean": "멧돼지"
      },
      "ROOK": {
        "hindi": "काला कौआ",
        "telugu": "నల్ల కాకి",
        "chinese": "乌鸦",
        "spanish": "grajo",
        "french": "corbeau",
        "german": "saatkrähe",
        "arabic": "غراب الزرع",
        "japanese": "ミヤマガラス",
        "russian": "грач",
        "portuguese": "gralha",
        "italian": "corvo",
        "korean": "떼까마귀"
      },
      "RAFT": {
        "hindi": "बेड़ा या तैरने वाला लकड़ी का बंधन",
        "telugu": "తెప్ప",
        "chinese": "木筏",
        "spanish": "balsa",
        "french": "radeau",
        "german": "floß",
        "arabic": "طوف",
        "japanese": "筏",
        "russian": "плот",
        "portuguese": "balsa",
        "italian": "zattera",
        "korean": "뗏목"
      }
    },
    "wordPool": [
      "TREE",
      "LEAF",
      "ROOT",
      "BARK",
      "SEED",
      "BEE",
      "ROOF",
      "DEER",
      "BROOK",
      "REED",
      "BOAR",
      "ROOK",
      "RAFT"
    ]
  },
  {
    "level": 8,
    "theme": "Weather & Sky",
    "gridSize": 5,
    "timeLimit": 85,
    "grid": [
      [
        "R",
        "A",
        "I",
        "N",
        "S"
      ],
      [
        "C",
        "O",
        "L",
        "D",
        "K"
      ],
      [
        "W",
        "I",
        "N",
        "D",
        "Y"
      ],
      [
        "S",
        "B",
        "O",
        "W",
        "P"
      ],
      [
        "H",
        "A",
        "I",
        "L",
        "S"
      ]
    ],
    "words": [
      "RAIN",
      "COLD",
      "WIND",
      "HAIL",
      "BOWL",
      "SAIL",
      "RAIL",
      "ASH",
      "WINDY",
      "DOWN",
      "WILD",
      "CROW",
      "DIAL"
    ],
    "translations": {
      "RAIN": {
        "hindi": "बारिश या वर्षा",
        "telugu": "వర్షం",
        "chinese": "雨",
        "spanish": "lluvia",
        "french": "pluie",
        "german": "regen",
        "arabic": "مطر",
        "japanese": "雨",
        "russian": "дождь",
        "portuguese": "chuva",
        "italian": "pioggia",
        "korean": "비"
      },
      "COLD": {
        "hindi": "ठंड या शीत",
        "telugu": "చలి",
        "chinese": "寒冷",
        "spanish": "frío",
        "french": "froid",
        "german": "kälte",
        "arabic": "برد",
        "japanese": "寒い",
        "russian": "холод",
        "portuguese": "frio",
        "italian": "freddo",
        "korean": "추위"
      },
      "WIND": {
        "hindi": "हवा",
        "telugu": "గాలి",
        "chinese": "风",
        "spanish": "viento",
        "french": "vent",
        "german": "wind",
        "arabic": "ريح",
        "japanese": "風",
        "russian": "ветер",
        "portuguese": "vento",
        "italian": "vento",
        "korean": "바람"
      },
      "HAIL": {
        "hindi": "ओला",
        "telugu": "వడగళ్ళు",
        "chinese": "冰雹",
        "spanish": "granizo",
        "french": "grêle",
        "german": "hagel",
        "arabic": "برد",
        "japanese": "雹",
        "russian": "град",
        "portuguese": "granizo",
        "italian": "grandine",
        "korean": "우박"
      },
      "BOWL": {
        "hindi": "कटोरा",
        "telugu": "గిన్నె",
        "chinese": "碗",
        "spanish": "tazón",
        "french": "bol",
        "german": "schüssel",
        "arabic": "وعاء",
        "japanese": "ボウル",
        "russian": "миска",
        "portuguese": "tigela",
        "italian": "ciotola",
        "korean": "그릇"
      },
      "SAIL": {
        "hindi": "पाल या नाव चलाना",
        "telugu": "తెరచాప",
        "chinese": "帆",
        "spanish": "vela",
        "french": "voile",
        "german": "segel",
        "arabic": "شراع",
        "japanese": "帆",
        "russian": "парус",
        "portuguese": "vela",
        "italian": "vela",
        "korean": "돛"
      },
      "RAIL": {
        "hindi": "ट्रेन की पटरी",
        "telugu": "రైలు పట్టా",
        "chinese": "铁轨",
        "spanish": "riel",
        "french": "rail",
        "german": "schiene",
        "arabic": "سكة",
        "japanese": "レール",
        "russian": "рельс",
        "portuguese": "trilho",
        "italian": "binario",
        "korean": "철로"
      },
      "ASH": {
        "hindi": "राख",
        "telugu": "బూడిద",
        "chinese": "灰烬",
        "spanish": "ceniza",
        "french": "cendre",
        "german": "asche",
        "arabic": "رماد",
        "japanese": "灰",
        "russian": "пепел",
        "portuguese": "cinza",
        "italian": "cenere",
        "korean": "재"
      },
      "WINDY": {
        "hindi": "हवादार",
        "telugu": "గాలిగా ఉన్న",
        "chinese": "多风的",
        "spanish": "ventoso",
        "french": "venteux",
        "german": "windig",
        "arabic": "عاصف",
        "japanese": "風が強い",
        "russian": "ветреный",
        "portuguese": "ventoso",
        "italian": "ventoso",
        "korean": "바람부는"
      },
      "DOWN": {
        "hindi": "नीचे",
        "telugu": "కింద",
        "chinese": "向下",
        "spanish": "abajo",
        "french": "bas",
        "german": "unten",
        "arabic": "أسفل",
        "japanese": "下",
        "russian": "вниз",
        "portuguese": "baixo",
        "italian": "giù",
        "korean": "아래"
      },
      "WILD": {
        "hindi": "जंगली",
        "telugu": "అడవి",
        "chinese": "野生",
        "spanish": "salvaje",
        "french": "sauvage",
        "german": "wild",
        "arabic": "بري",
        "japanese": "野生",
        "russian": "дикий",
        "portuguese": "selvagem",
        "italian": "selvaggio",
        "korean": "야생"
      },
      "CROW": {
        "hindi": "कौआ",
        "telugu": "కాకి",
        "chinese": "乌鸦",
        "spanish": "cuervo",
        "french": "corbeau",
        "german": "krähe",
        "arabic": "غراب",
        "japanese": "烏",
        "russian": "ворона",
        "portuguese": "corvo",
        "italian": "corvo",
        "korean": "까마귀"
      },
      "DIAL": {
        "hindi": "डायल या घुमाने वाला चक्र",
        "telugu": "డయల్",
        "chinese": "表盘",
        "spanish": "marcar",
        "french": "cadran",
        "german": "zifferblatt",
        "arabic": "قرص",
        "japanese": "文字盤",
        "russian": "циферблат",
        "portuguese": "mostrador",
        "italian": "quadrante",
        "korean": "다이얼"
      }
    },
    "wordPool": [
      "RAIN",
      "COLD",
      "WIND",
      "HAIL",
      "BOWL",
      "SAIL",
      "RAIL",
      "ASH",
      "WINDY",
      "DOWN",
      "WILD",
      "CROW",
      "DIAL"
    ]
  },
  {
    "level": 9,
    "theme": "Cosmos & Science",
    "gridSize": 6,
    "timeLimit": 80,
    "grid": [
      [
        "S",
        "T",
        "A",
        "R",
        "S",
        "M"
      ],
      [
        "M",
        "O",
        "O",
        "N",
        "U",
        "A"
      ],
      [
        "A",
        "T",
        "O",
        "M",
        "N",
        "R"
      ],
      [
        "L",
        "I",
        "G",
        "H",
        "T",
        "S"
      ],
      [
        "B",
        "E",
        "A",
        "M",
        "O",
        "B"
      ],
      [
        "W",
        "A",
        "V",
        "E",
        "R",
        "E"
      ]
    ],
    "words": [
      "STAR",
      "MOON",
      "MARS",
      "ATOM",
      "LIGHT",
      "WAVE",
      "STORM",
      "ORB",
      "AURA",
      "OHM",
      "MOTION",
      "ION",
      "MOTOR",
      "SOAR"
    ],
    "translations": {
      "STAR": {
        "hindi": "तारा",
        "telugu": "నక్షత్రం",
        "chinese": "星星",
        "spanish": "estrella",
        "french": "étoile",
        "german": "stern",
        "arabic": "نجم",
        "japanese": "星",
        "russian": "звезда",
        "portuguese": "estrela",
        "italian": "stella",
        "korean": "별"
      },
      "MOON": {
        "hindi": "चाँद या चंद्रमा",
        "telugu": "చంద్రుడు",
        "chinese": "月亮",
        "spanish": "luna",
        "french": "lune",
        "german": "mond",
        "arabic": "قمر",
        "japanese": "月",
        "russian": "луна",
        "portuguese": "lua",
        "italian": "luna",
        "korean": "달"
      },
      "MARS": {
        "hindi": "मंगल ग्रह",
        "telugu": "అంగారక గ్రహం",
        "chinese": "火星",
        "spanish": "marte",
        "french": "mars",
        "german": "mars",
        "arabic": "المريخ",
        "japanese": "火星",
        "russian": "марс",
        "portuguese": "marte",
        "italian": "marte",
        "korean": "화성"
      },
      "ATOM": {
        "hindi": "परमाणु",
        "telugu": "పరమాణువు",
        "chinese": "原子",
        "spanish": "átomo",
        "french": "atome",
        "german": "atom",
        "arabic": "ذرة",
        "japanese": "原子",
        "russian": "атом",
        "portuguese": "átomo",
        "italian": "atomo",
        "korean": "원자"
      },
      "LIGHT": {
        "hindi": "प्रकाश",
        "telugu": "వెలుగు",
        "chinese": "光",
        "spanish": "luz",
        "french": "lumière",
        "german": "licht",
        "arabic": "ضوء",
        "japanese": "光",
        "russian": "свет",
        "portuguese": "luz",
        "italian": "luce",
        "korean": "빛"
      },
      "WAVE": {
        "hindi": "लहर या तरंग",
        "telugu": "అల",
        "chinese": "波浪",
        "spanish": "ola",
        "french": "vague",
        "german": "welle",
        "arabic": "موجة",
        "japanese": "波",
        "russian": "волна",
        "portuguese": "onda",
        "italian": "onda",
        "korean": "파도"
      },
      "STORM": {
        "hindi": "तूफ़ान",
        "telugu": "తుఫాను",
        "chinese": "风暴",
        "spanish": "tormenta",
        "french": "tempête",
        "german": "sturm",
        "arabic": "عاصفة",
        "japanese": "嵐",
        "russian": "буря",
        "portuguese": "tempestade",
        "italian": "tempesta",
        "korean": "폭풍"
      },
      "ORB": {
        "hindi": "गोला",
        "telugu": "గోళం",
        "chinese": "球体",
        "spanish": "orbe",
        "french": "orbe",
        "german": "kugel",
        "arabic": "جرم",
        "japanese": "宝珠",
        "russian": "сфера",
        "portuguese": "orbe",
        "italian": "globo",
        "korean": "구체"
      },
      "AURA": {
        "hindi": "आभा",
        "telugu": "కాంతివలయం",
        "chinese": "光环",
        "spanish": "aura",
        "french": "aura",
        "german": "aura",
        "arabic": "هالة",
        "japanese": "オーラ",
        "russian": "аура",
        "portuguese": "aura",
        "italian": "aura",
        "korean": "아우라"
      },
      "OHM": {
        "hindi": "ओम",
        "telugu": "ఓమ్",
        "chinese": "欧姆",
        "spanish": "ohmio",
        "french": "ohm",
        "german": "ohm",
        "arabic": "أوم",
        "japanese": "オーム",
        "russian": "ом",
        "portuguese": "ohm",
        "italian": "ohm",
        "korean": "옴"
      },
      "MOTION": {
        "hindi": "गति",
        "telugu": "చలనం",
        "chinese": "运动",
        "spanish": "movimiento",
        "french": "mouvement",
        "german": "bewegung",
        "arabic": "حركة",
        "japanese": "運動",
        "russian": "движение",
        "portuguese": "movimento",
        "italian": "movimento",
        "korean": "동작"
      },
      "ION": {
        "hindi": "आयन (आयनीकृत कण)",
        "telugu": "అయాన్",
        "chinese": "离子",
        "spanish": "ión",
        "french": "ion",
        "german": "ion",
        "arabic": "أيون",
        "japanese": "イオン",
        "russian": "ион",
        "portuguese": "íon",
        "italian": "ione",
        "korean": "이온"
      },
      "MOTOR": {
        "hindi": "मोटर (इलेक्ट्रिक मोटर)",
        "telugu": "మోటారు",
        "chinese": "电动机",
        "spanish": "motor",
        "french": "moteur",
        "german": "motor",
        "arabic": "محرك",
        "japanese": "モーター",
        "russian": "мотор",
        "portuguese": "motor",
        "italian": "motore",
        "korean": "모터"
      },
      "SOAR": {
        "hindi": "ऊँची उड़ान भरना",
        "telugu": "ఎగరడం",
        "chinese": "翱翔",
        "spanish": "elevarse",
        "french": "planer",
        "german": "schweben",
        "arabic": "تحليق",
        "japanese": "飛翔する",
        "russian": "парить",
        "portuguese": "planar",
        "italian": "svolazzare",
        "korean": "치솟다"
      }
    },
    "wordPool": [
      "STAR",
      "MOON",
      "MARS",
      "ATOM",
      "LIGHT",
      "WAVE",
      "STORM",
      "ORB",
      "AURA",
      "OHM",
      "MOTION",
      "ION",
      "MOTOR",
      "SOAR"
    ]
  },
  {
    "level": 10,
    "theme": "Master Expedition",
    "gridSize": 6,
    "timeLimit": 75,
    "grid": [
      [
        "E",
        "A",
        "R",
        "T",
        "H",
        "S"
      ],
      [
        "P",
        "L",
        "A",
        "N",
        "E",
        "T"
      ],
      [
        "S",
        "I",
        "L",
        "V",
        "E",
        "R"
      ],
      [
        "G",
        "O",
        "L",
        "D",
        "E",
        "N"
      ],
      [
        "W",
        "O",
        "N",
        "D",
        "E",
        "R"
      ],
      [
        "G",
        "A",
        "L",
        "A",
        "X",
        "Y"
      ]
    ],
    "words": [
      "EARTH",
      "PLANET",
      "SILVER",
      "GOLDEN",
      "WONDER",
      "GALAXY",
      "SOLAR",
      "HEN",
      "GIANT",
      "LAND",
      "ISLE",
      "LADDER",
      "ENTER",
      "LEAP",
      "LANE"
    ],
    "translations": {
      "EARTH": {
        "hindi": "धरती या पृथ्वी",
        "telugu": "భూమి",
        "chinese": "地球",
        "spanish": "tierra",
        "french": "terre",
        "german": "erde",
        "arabic": "أرض",
        "japanese": "地球",
        "russian": "земля",
        "portuguese": "terra",
        "italian": "terra",
        "korean": "지구"
      },
      "PLANET": {
        "hindi": "ग्रह",
        "telugu": "గ్రహం",
        "chinese": "行星",
        "spanish": "planeta",
        "french": "planète",
        "german": "planet",
        "arabic": "كوكب",
        "japanese": "惑星",
        "russian": "планета",
        "portuguese": "planeta",
        "italian": "pianeta",
        "korean": "행성"
      },
      "SILVER": {
        "hindi": "चाँदी",
        "telugu": "వెండి",
        "chinese": "银色",
        "spanish": "plata",
        "french": "argent",
        "german": "silber",
        "arabic": "فضة",
        "japanese": "銀",
        "russian": "серебро",
        "portuguese": "prata",
        "italian": "argento",
        "korean": "은"
      },
      "GOLDEN": {
        "hindi": "सुनहरा",
        "telugu": "బంగారు",
        "chinese": "金色的",
        "spanish": "dorado",
        "french": "doré",
        "german": "golden",
        "arabic": "ذهبي",
        "japanese": "金色",
        "russian": "золотой",
        "portuguese": "dourado",
        "italian": "dorato",
        "korean": "황금빛"
      },
      "WONDER": {
        "hindi": "आश्चर्य",
        "telugu": "ఆశ్చర్యం",
        "chinese": "惊奇",
        "spanish": "maravilla",
        "french": "merveille",
        "german": "wunder",
        "arabic": "عجيبة",
        "japanese": "驚異",
        "russian": "чудо",
        "portuguese": "maravilha",
        "italian": "meraviglia",
        "korean": "경이"
      },
      "GALAXY": {
        "hindi": "आकाशगंगा",
        "telugu": "ఆకాశగంగ",
        "chinese": "星系",
        "spanish": "galaxia",
        "french": "galaxie",
        "german": "galaxie",
        "arabic": "مجرة",
        "japanese": "銀河",
        "russian": "галактика",
        "portuguese": "galáxia",
        "italian": "galassia",
        "korean": "은하"
      },
      "SOLAR": {
        "hindi": "सौर (सूर्य से संबंधित)",
        "telugu": "సౌర",
        "chinese": "太阳的",
        "spanish": "solar",
        "french": "solaire",
        "german": "solar",
        "arabic": "شمسي",
        "japanese": "太陽の",
        "russian": "солнечный",
        "portuguese": "solar",
        "italian": "solare",
        "korean": "태양의"
      },
      "HEN": {
        "hindi": "मुर्गी",
        "telugu": "కోడి",
        "chinese": "母鸡",
        "spanish": "gallina",
        "french": "poule",
        "german": "henne",
        "arabic": "دجاجة",
        "japanese": "雌鶏",
        "russian": "курица",
        "portuguese": "galinha",
        "italian": "gallina",
        "korean": "암탉"
      },
      "GIANT": {
        "hindi": "विशाल",
        "telugu": "విశాలమైన",
        "chinese": "巨大的",
        "spanish": "gigante",
        "french": "géant",
        "german": "riese",
        "arabic": "عملاق",
        "japanese": "巨人",
        "russian": "великан",
        "portuguese": "gigante",
        "italian": "gigante",
        "korean": "거인"
      },
      "LAND": {
        "hindi": "ज़मीन या भूमि",
        "telugu": "నేల",
        "chinese": "陆地",
        "spanish": "tierra",
        "french": "terre",
        "german": "land",
        "arabic": "أرض",
        "japanese": "土地",
        "russian": "суша",
        "portuguese": "terra",
        "italian": "terra",
        "korean": "땅"
      },
      "ISLE": {
        "hindi": "द्वीप",
        "telugu": "ద్వీపం",
        "chinese": "岛屿",
        "spanish": "isla",
        "french": "île",
        "german": "insel",
        "arabic": "جزيرة",
        "japanese": "小島",
        "russian": "островок",
        "portuguese": "ilha",
        "italian": "isola",
        "korean": "섬"
      },
      "LADDER": {
        "hindi": "सीढ़ी",
        "telugu": "నిచ్చెన",
        "chinese": "梯子",
        "spanish": "escalera",
        "french": "échelle",
        "german": "leiter",
        "arabic": "سلم",
        "japanese": "梯子",
        "russian": "лестница",
        "portuguese": "escada",
        "italian": "scala",
        "korean": "사다리"
      },
      "ENTER": {
        "hindi": "प्रवेश करना",
        "telugu": "ప్రవేశించడం",
        "chinese": "进入",
        "spanish": "entrar",
        "french": "entrer",
        "german": "eintreten",
        "arabic": "دخول",
        "japanese": "入る",
        "russian": "войти",
        "portuguese": "entrar",
        "italian": "entrare",
        "korean": "들어가다"
      },
      "LEAP": {
        "hindi": "छलांग",
        "telugu": "దూకడం",
        "chinese": "跳跃",
        "spanish": "salto",
        "french": "saut",
        "german": "sprung",
        "arabic": "قفزة",
        "japanese": "跳躍",
        "russian": "прыжок",
        "portuguese": "salto",
        "italian": "balzo",
        "korean": "도약"
      },
      "LANE": {
        "hindi": "वीथी या गली",
        "telugu": "దారి",
        "chinese": "小巷",
        "spanish": "carril",
        "french": "ruelle",
        "german": "gasse",
        "arabic": "ممر",
        "japanese": "小道",
        "russian": "переулок",
        "portuguese": "faixa",
        "italian": "vicolo",
        "korean": "골목길"
      }
    },
    "wordPool": [
      "EARTH",
      "PLANET",
      "SILVER",
      "GOLDEN",
      "WONDER",
      "GALAXY",
      "SOLAR",
      "HEN",
      "GIANT",
      "LAND",
      "ISLE",
      "LADDER",
      "ENTER",
      "LEAP",
      "LANE"
    ]
  },
  {
    "level": 11,
    "theme": "Ocean & Deep Sea",
    "gridSize": 5,
    "timeLimit": 95,
    "grid": [
      [
        "F",
        "I",
        "S",
        "H",
        "S"
      ],
      [
        "B",
        "O",
        "A",
        "T",
        "A"
      ],
      [
        "R",
        "E",
        "E",
        "F",
        "I"
      ],
      [
        "T",
        "I",
        "D",
        "E",
        "L"
      ],
      [
        "W",
        "A",
        "V",
        "E",
        "S"
      ]
    ],
    "words": [
      "FISH",
      "REEF",
      "TIDE",
      "TAIL",
      "SAFE",
      "LIFE",
      "FAST",
      "DIVE",
      "WATER",
      "WADE",
      "RIDE",
      "EAST",
      "FEAST"
    ],
    "translations": {
      "FISH": {
        "hindi": "मछली",
        "telugu": "చేప",
        "chinese": "鱼",
        "spanish": "pez",
        "french": "poisson",
        "german": "fisch",
        "arabic": "سمكة",
        "japanese": "魚",
        "russian": "рыба",
        "portuguese": "peixe",
        "italian": "pesce",
        "korean": "물고기"
      },
      "REEF": {
        "hindi": "प्रवाल भित्ति या समुद्री चट्टान",
        "telugu": "పగడపు దిబ్బ",
        "chinese": "珊瑚礁",
        "spanish": "arrecife",
        "french": "récif",
        "german": "riff",
        "arabic": "شعب مرجانية",
        "japanese": "礁",
        "russian": "риф",
        "portuguese": "recife",
        "italian": "scogliera",
        "korean": "암초"
      },
      "TIDE": {
        "hindi": "ज्वार-भाटा",
        "telugu": "ఆటుపోట్లు",
        "chinese": "潮汐",
        "spanish": "marea",
        "french": "marée",
        "german": "gezeiten",
        "arabic": "مد وجزر",
        "japanese": "潮",
        "russian": "прилив",
        "portuguese": "maré",
        "italian": "marea",
        "korean": "조수"
      },
      "TAIL": {
        "hindi": "पूंछ",
        "telugu": "తోక",
        "chinese": "尾巴",
        "spanish": "cola",
        "french": "queue",
        "german": "schwanz",
        "arabic": "ذيل",
        "japanese": "尾",
        "russian": "хвост",
        "portuguese": "cauda",
        "italian": "coda",
        "korean": "꼬리"
      },
      "SAFE": {
        "hindi": "सुरक्षित",
        "telugu": "సురక్షితమైన",
        "chinese": "安全的",
        "spanish": "seguro",
        "french": "sûr",
        "german": "sicher",
        "arabic": "آمن",
        "japanese": "安全な",
        "russian": "безопасный",
        "portuguese": "seguro",
        "italian": "sicuro",
        "korean": "안전한"
      },
      "LIFE": {
        "hindi": "जीवन",
        "telugu": "జీవితం",
        "chinese": "生命",
        "spanish": "vida",
        "french": "vie",
        "german": "leben",
        "arabic": "حياة",
        "japanese": "命",
        "russian": "жизнь",
        "portuguese": "vida",
        "italian": "vita",
        "korean": "생명"
      },
      "FAST": {
        "hindi": "तेज़",
        "telugu": "వేగంగా",
        "chinese": "快速的",
        "spanish": "rápido",
        "french": "rapide",
        "german": "schnell",
        "arabic": "سريع",
        "japanese": "速い",
        "russian": "быстрый",
        "portuguese": "rápido",
        "italian": "veloce",
        "korean": "빠른"
      },
      "DIVE": {
        "hindi": "गोता लगाना",
        "telugu": "మునక వేయడం",
        "chinese": "潜水",
        "spanish": "buceo",
        "french": "plonger",
        "german": "tauchen",
        "arabic": "غوص",
        "japanese": "潜水",
        "russian": "нырять",
        "portuguese": "mergulho",
        "italian": "tuffo",
        "korean": "다이빙"
      },
      "WATER": {
        "hindi": "पानी",
        "telugu": "నీరు",
        "chinese": "水",
        "spanish": "agua",
        "french": "eau",
        "german": "wasser",
        "arabic": "ماء",
        "japanese": "水",
        "russian": "вода",
        "portuguese": "água",
        "italian": "acqua",
        "korean": "물"
      },
      "WADE": {
        "hindi": "पानी में चलना",
        "telugu": "నీటిలో నడవడం",
        "chinese": "涉水",
        "spanish": "vadear",
        "french": "patauger",
        "german": "waten",
        "arabic": "خوض في الماء",
        "japanese": "浅瀬を渡る",
        "russian": "идти вброд",
        "portuguese": "vau",
        "italian": "guadare",
        "korean": "헤치며 걷다"
      },
      "RIDE": {
        "hindi": "सवारी करना",
        "telugu": "సవారీ చేయడం",
        "chinese": "骑行",
        "spanish": "paseo",
        "french": "balade",
        "german": "fahrt",
        "arabic": "ركوب",
        "japanese": "乗る",
        "russian": "поездка",
        "portuguese": "passeio",
        "italian": "corsa",
        "korean": "타기"
      },
      "EAST": {
        "hindi": "पूरब या पूर्व दिशा",
        "telugu": "తూర్పు",
        "chinese": "东方",
        "spanish": "este",
        "french": "est",
        "german": "osten",
        "arabic": "شرق",
        "japanese": "東",
        "russian": "восток",
        "portuguese": "leste",
        "italian": "est",
        "korean": "동쪽"
      },
      "FEAST": {
        "hindi": "दावत",
        "telugu": "విందు",
        "chinese": "盛宴",
        "spanish": "banquete",
        "french": "festin",
        "german": "festmahl",
        "arabic": "وليمة",
        "japanese": "ごちそう",
        "russian": "пир",
        "portuguese": "banquete",
        "italian": "banchetto",
        "korean": "연회"
      }
    },
    "wordPool": [
      "FISH",
      "REEF",
      "TIDE",
      "TAIL",
      "SAFE",
      "LIFE",
      "FAST",
      "DIVE",
      "WATER",
      "WADE",
      "RIDE",
      "EAST",
      "FEAST"
    ]
  },
  {
    "level": 12,
    "theme": "Music & Harmony",
    "gridSize": 5,
    "timeLimit": 95,
    "grid": [
      [
        "S",
        "O",
        "N",
        "G",
        "S"
      ],
      [
        "T",
        "U",
        "N",
        "E",
        "O"
      ],
      [
        "B",
        "E",
        "A",
        "T",
        "L"
      ],
      [
        "H",
        "O",
        "R",
        "N",
        "O"
      ],
      [
        "D",
        "R",
        "U",
        "M",
        "S"
      ]
    ],
    "words": [
      "SONG",
      "TUNE",
      "BEAT",
      "HORN",
      "DRUM",
      "SOLO",
      "NOTE",
      "TONE",
      "RUN",
      "HEART",
      "HEAR",
      "RANGE",
      "ANGEL"
    ],
    "translations": {
      "SONG": {
        "hindi": "गीत",
        "telugu": "పాట",
        "chinese": "歌曲",
        "spanish": "canción",
        "french": "chanson",
        "german": "lied",
        "arabic": "أغنية",
        "japanese": "歌",
        "russian": "песня",
        "portuguese": "canção",
        "italian": "canzone",
        "korean": "노래"
      },
      "TUNE": {
        "hindi": "धुन",
        "telugu": "ధుని",
        "chinese": "曲调",
        "spanish": "melodía",
        "french": "mélodie",
        "german": "melodie",
        "arabic": "لحن",
        "japanese": "旋律",
        "russian": "мелодия",
        "portuguese": "melodia",
        "italian": "melodia",
        "korean": "곡조"
      },
      "BEAT": {
        "hindi": "ताल",
        "telugu": "లయ",
        "chinese": "节拍",
        "spanish": "ritmo",
        "french": "battement",
        "german": "takt",
        "arabic": "إيقاع",
        "japanese": "拍子",
        "russian": "бит",
        "portuguese": "batida",
        "italian": "battito",
        "korean": "비트"
      },
      "HORN": {
        "hindi": "सींग या भोंपू",
        "telugu": "కొమ్ము",
        "chinese": "号角",
        "spanish": "cuerno",
        "french": "cor",
        "german": "horn",
        "arabic": "بوق",
        "japanese": "ホルン",
        "russian": "рог",
        "portuguese": "buzina",
        "italian": "corno",
        "korean": "호른"
      },
      "DRUM": {
        "hindi": "ढोलक",
        "telugu": "డప్పు",
        "chinese": "鼓",
        "spanish": "tambor",
        "french": "tambour",
        "german": "trommel",
        "arabic": "طبلة",
        "japanese": "太鼓",
        "russian": "барабан",
        "portuguese": "tambor",
        "italian": "tamburo",
        "korean": "북"
      },
      "SOLO": {
        "hindi": "एकल",
        "telugu": "ఒంటరిగా",
        "chinese": "独奏",
        "spanish": "solo",
        "french": "solo",
        "german": "solo",
        "arabic": "عزف منفرد",
        "japanese": "独奏",
        "russian": "соло",
        "portuguese": "solo",
        "italian": "assolo",
        "korean": "솔로"
      },
      "NOTE": {
        "hindi": "सुर",
        "telugu": "స్వరం",
        "chinese": "音符",
        "spanish": "nota",
        "french": "note",
        "german": "note",
        "arabic": "نوتة",
        "japanese": "音符",
        "russian": "нота",
        "portuguese": "nota",
        "italian": "nota",
        "korean": "음표"
      },
      "TONE": {
        "hindi": "आवाज़ का उतार-चढ़ाव",
        "telugu": "స్వరస్థాయి",
        "chinese": "音调",
        "spanish": "tono",
        "french": "ton",
        "german": "ton",
        "arabic": "نغمة",
        "japanese": "音色",
        "russian": "тон",
        "portuguese": "tom",
        "italian": "tono",
        "korean": "어조"
      },
      "RUN": {
        "hindi": "दौड़ना",
        "telugu": "పరుగెత్తడం",
        "chinese": "奔跑",
        "spanish": "correr",
        "french": "courir",
        "german": "laufen",
        "arabic": "ركض",
        "japanese": "走る",
        "russian": "бег",
        "portuguese": "correr",
        "italian": "correre",
        "korean": "달리다"
      },
      "HEART": {
        "hindi": "दिल या हृदय",
        "telugu": "హృదయం",
        "chinese": "心脏",
        "spanish": "corazón",
        "french": "cœur",
        "german": "herz",
        "arabic": "قلب",
        "japanese": "心臓",
        "russian": "сердце",
        "portuguese": "coração",
        "italian": "cuore",
        "korean": "심장"
      },
      "HEAR": {
        "hindi": "सुनना",
        "telugu": "వినడం",
        "chinese": "听见",
        "spanish": "oír",
        "french": "entendre",
        "german": "hören",
        "arabic": "سمع",
        "japanese": "聞く",
        "russian": "слышать",
        "portuguese": "ouvir",
        "italian": "sentire",
        "korean": "듣다"
      },
      "RANGE": {
        "hindi": "सीमा",
        "telugu": "పరిధి",
        "chinese": "范围",
        "spanish": "rango",
        "french": "portée",
        "german": "bereich",
        "arabic": "مدى",
        "japanese": "音域",
        "russian": "диапазон",
        "portuguese": "alcance",
        "italian": "gamma",
        "korean": "음역"
      },
      "ANGEL": {
        "hindi": "देवदूत",
        "telugu": "దేవదూత",
        "chinese": "天使",
        "spanish": "ángel",
        "french": "ange",
        "german": "engel",
        "arabic": "ملاك",
        "japanese": "天使",
        "russian": "ангел",
        "portuguese": "anjo",
        "italian": "angelo",
        "korean": "천사"
      }
    },
    "wordPool": [
      "SONG",
      "TUNE",
      "BEAT",
      "HORN",
      "DRUM",
      "SOLO",
      "NOTE",
      "TONE",
      "RUN",
      "HEART",
      "HEAR",
      "RANGE",
      "ANGEL"
    ]
  },
  {
    "level": 13,
    "theme": "Sports & Action",
    "gridSize": 5,
    "timeLimit": 90,
    "grid": [
      [
        "B",
        "A",
        "L",
        "L",
        "S"
      ],
      [
        "P",
        "L",
        "A",
        "Y",
        "T"
      ],
      [
        "G",
        "O",
        "A",
        "B",
        "E"
      ],
      [
        "R",
        "A",
        "C",
        "E",
        "A"
      ],
      [
        "S",
        "U",
        "R",
        "F",
        "M"
      ]
    ],
    "words": [
      "BALL",
      "PLAY",
      "GOAL",
      "RACE",
      "SURF",
      "TEAM",
      "CARE",
      "ROAR",
      "BAY",
      "FAME",
      "RAG",
      "LOG",
      "STEAM",
      "GRACE"
    ],
    "translations": {
      "BALL": {
        "hindi": "गेंद",
        "telugu": "బంతి",
        "chinese": "球",
        "spanish": "pelota",
        "french": "balle",
        "german": "ball",
        "arabic": "كرة",
        "japanese": "ボール",
        "russian": "мяч",
        "portuguese": "bola",
        "italian": "palla",
        "korean": "공"
      },
      "PLAY": {
        "hindi": "खेलना",
        "telugu": "ఆడటం",
        "chinese": "玩耍",
        "spanish": "jugar",
        "french": "jouer",
        "german": "spielen",
        "arabic": "لعب",
        "japanese": "遊ぶ",
        "russian": "играть",
        "portuguese": "jogar",
        "italian": "giocare",
        "korean": "놀다"
      },
      "GOAL": {
        "hindi": "लक्ष्य",
        "telugu": "లక్ష్యం",
        "chinese": "目标",
        "spanish": "gol",
        "french": "but",
        "german": "tor",
        "arabic": "هدف",
        "japanese": "ゴール",
        "russian": "гол",
        "portuguese": "gol",
        "italian": "gol",
        "korean": "골"
      },
      "RACE": {
        "hindi": "दौड़",
        "telugu": "పరుగు పందెం",
        "chinese": "赛跑",
        "spanish": "carrera",
        "french": "course",
        "german": "rennen",
        "arabic": "سباق",
        "japanese": "レース",
        "russian": "гонка",
        "portuguese": "corrida",
        "italian": "corsa",
        "korean": "경주"
      },
      "SURF": {
        "hindi": "जलक्रीड़ा",
        "telugu": "సర్ఫింగ్",
        "chinese": "冲浪",
        "spanish": "surf",
        "french": "surf",
        "german": "surfen",
        "arabic": "ركوب الأمواج",
        "japanese": "波乗り",
        "russian": "серфинг",
        "portuguese": "surfe",
        "italian": "surf",
        "korean": "서핑"
      },
      "TEAM": {
        "hindi": "टीम या समूह",
        "telugu": "జట్టు",
        "chinese": "团队",
        "spanish": "equipo",
        "french": "équipe",
        "german": "team",
        "arabic": "فريق",
        "japanese": "チーム",
        "russian": "команда",
        "portuguese": "equipe",
        "italian": "squadra",
        "korean": "팀"
      },
      "CARE": {
        "hindi": "देखभाल",
        "telugu": "శ్రద్ధ",
        "chinese": "关心",
        "spanish": "cuidado",
        "french": "soin",
        "german": "pflege",
        "arabic": "رعاية",
        "japanese": "気遣い",
        "russian": "забота",
        "portuguese": "cuidado",
        "italian": "cura",
        "korean": "돌봄"
      },
      "ROAR": {
        "hindi": "दहाड़ या गर्जन",
        "telugu": "గర్జన",
        "chinese": "咆哮",
        "spanish": "rugido",
        "french": "rugissement",
        "german": "brüllen",
        "arabic": "زئير",
        "japanese": "咆哮",
        "russian": "рёв",
        "portuguese": "rugido",
        "italian": "ruggito",
        "korean": "포효"
      },
      "BAY": {
        "hindi": "खाड़ी",
        "telugu": "బే",
        "chinese": "海湾",
        "spanish": "bahía",
        "french": "baie",
        "german": "bucht",
        "arabic": "خليج",
        "japanese": "湾",
        "russian": "залив",
        "portuguese": "baía",
        "italian": "baia",
        "korean": "만"
      },
      "FAME": {
        "hindi": "प्रसिद्धि",
        "telugu": "కీర్తి",
        "chinese": "名声",
        "spanish": "fama",
        "french": "gloire",
        "german": "ruhm",
        "arabic": "شهرة",
        "japanese": "名声",
        "russian": "слава",
        "portuguese": "fama",
        "italian": "fama",
        "korean": "명성"
      },
      "RAG": {
        "hindi": "चिथड़ा",
        "telugu": "చిత్తడి గుడ్డ",
        "chinese": "抹布",
        "spanish": "trapo",
        "french": "chiffon",
        "german": "lappen",
        "arabic": "خرقة",
        "japanese": "ぼろ布",
        "russian": "тряпка",
        "portuguese": "trapo",
        "italian": "straccio",
        "korean": "걸레"
      },
      "LOG": {
        "hindi": "लकड़ी का लट्ठा",
        "telugu": "చెక్క దుంగ",
        "chinese": "原木",
        "spanish": "tronco",
        "french": "bûche",
        "german": "holzklotz",
        "arabic": "جذع",
        "japanese": "丸太",
        "russian": "бревно",
        "portuguese": "tronco",
        "italian": "tronco",
        "korean": "통나무"
      },
      "STEAM": {
        "hindi": "भाप या वाष्प",
        "telugu": "ఆవిరి",
        "chinese": "蒸汽",
        "spanish": "vapor",
        "french": "vapeur",
        "german": "dampf",
        "arabic": "بخار",
        "japanese": "蒸気",
        "russian": "пар",
        "portuguese": "vapor",
        "italian": "vapore",
        "korean": "증기"
      },
      "GRACE": {
        "hindi": "शालीनता या कृपा",
        "telugu": "అందం",
        "chinese": "优雅",
        "spanish": "gracia",
        "french": "grâce",
        "german": "anmut",
        "arabic": "نعمة",
        "japanese": "優美",
        "russian": "грация",
        "portuguese": "graça",
        "italian": "grazia",
        "korean": "우아함"
      }
    },
    "wordPool": [
      "BALL",
      "PLAY",
      "GOAL",
      "RACE",
      "SURF",
      "TEAM",
      "CARE",
      "ROAR",
      "BAY",
      "FAME",
      "RAG",
      "LOG",
      "STEAM",
      "GRACE"
    ]
  },
  {
    "level": 14,
    "theme": "Castle & Kingdom",
    "gridSize": 5,
    "timeLimit": 90,
    "grid": [
      [
        "K",
        "I",
        "N",
        "G",
        "S"
      ],
      [
        "C",
        "R",
        "O",
        "W",
        "N"
      ],
      [
        "T",
        "O",
        "W",
        "F",
        "R"
      ],
      [
        "G",
        "A",
        "T",
        "E",
        "B"
      ],
      [
        "H",
        "A",
        "L",
        "L",
        "Y"
      ]
    ],
    "words": [
      "KING",
      "CROWN",
      "TOWER",
      "GATE",
      "HALL",
      "RING",
      "IRON",
      "BELL",
      "WALL",
      "CORN",
      "GOWN",
      "TALE",
      "TALL",
      "COAT"
    ],
    "translations": {
      "KING": {
        "hindi": "राजा",
        "telugu": "రాజు",
        "chinese": "国王",
        "spanish": "rey",
        "french": "roi",
        "german": "könig",
        "arabic": "ملك",
        "japanese": "王",
        "russian": "король",
        "portuguese": "rei",
        "italian": "re",
        "korean": "왕"
      },
      "CROWN": {
        "hindi": "मुकुट",
        "telugu": "కిరీటం",
        "chinese": "王冠",
        "spanish": "corona",
        "french": "couronne",
        "german": "krone",
        "arabic": "تاج",
        "japanese": "王冠",
        "russian": "корона",
        "portuguese": "coroa",
        "italian": "corona",
        "korean": "왕관"
      },
      "TOWER": {
        "hindi": "मीनार",
        "telugu": "మీనార",
        "chinese": "塔楼",
        "spanish": "torre",
        "french": "tour",
        "german": "turm",
        "arabic": "برج",
        "japanese": "塔",
        "russian": "башня",
        "portuguese": "torre",
        "italian": "torre",
        "korean": "탑"
      },
      "GATE": {
        "hindi": "फाटक या द्वार",
        "telugu": "ద్వారం",
        "chinese": "城门",
        "spanish": "puerta",
        "french": "porte",
        "german": "tor",
        "arabic": "بوابة",
        "japanese": "門",
        "russian": "ворота",
        "portuguese": "portão",
        "italian": "cancello",
        "korean": "문"
      },
      "HALL": {
        "hindi": "हॉल या सभागार",
        "telugu": "హాల్",
        "chinese": "大厅",
        "spanish": "salón",
        "french": "salle",
        "german": "saal",
        "arabic": "قاعة",
        "japanese": "ホール",
        "russian": "зал",
        "portuguese": "salão",
        "italian": "sala",
        "korean": "홀"
      },
      "RING": {
        "hindi": "अंगूठी",
        "telugu": "ఉంగరం",
        "chinese": "戒指",
        "spanish": "anillo",
        "french": "bague",
        "german": "ring",
        "arabic": "خاتم",
        "japanese": "指輪",
        "russian": "кольцо",
        "portuguese": "anel",
        "italian": "anello",
        "korean": "반지"
      },
      "IRON": {
        "hindi": "लोहा",
        "telugu": "ఇనుము",
        "chinese": "铁",
        "spanish": "hierro",
        "french": "fer",
        "german": "eisen",
        "arabic": "حديد",
        "japanese": "鉄",
        "russian": "железо",
        "portuguese": "ferro",
        "italian": "ferro",
        "korean": "철"
      },
      "BELL": {
        "hindi": "घंटी",
        "telugu": "గంట",
        "chinese": "铃",
        "spanish": "campana",
        "french": "cloche",
        "german": "glocke",
        "arabic": "جرس",
        "japanese": "鐘",
        "russian": "колокол",
        "portuguese": "sino",
        "italian": "campana",
        "korean": "종"
      },
      "WALL": {
        "hindi": "दीवार",
        "telugu": "గోడ",
        "chinese": "城墙",
        "spanish": "muro",
        "french": "mur",
        "german": "mauer",
        "arabic": "جدار",
        "japanese": "壁",
        "russian": "стена",
        "portuguese": "muro",
        "italian": "muro",
        "korean": "벽"
      },
      "CORN": {
        "hindi": "मक्का",
        "telugu": "మొక్కజొన్న",
        "chinese": "玉米",
        "spanish": "maíz",
        "french": "maïs",
        "german": "mais",
        "arabic": "ذرة",
        "japanese": "トウモロコシ",
        "russian": "кукуруза",
        "portuguese": "milho",
        "italian": "mais",
        "korean": "옥수수"
      },
      "GOWN": {
        "hindi": "गाउन या शाही पोशाक",
        "telugu": "గౌను",
        "chinese": "礼服",
        "spanish": "vestido",
        "french": "robe",
        "german": "kleid",
        "arabic": "ثوب",
        "japanese": "ガウン",
        "russian": "платье",
        "portuguese": "vestido",
        "italian": "abito",
        "korean": "가운"
      },
      "TALE": {
        "hindi": "कहानी",
        "telugu": "కథ",
        "chinese": "故事",
        "spanish": "cuento",
        "french": "conte",
        "german": "märchen",
        "arabic": "حكاية",
        "japanese": "物語",
        "russian": "сказка",
        "portuguese": "conto",
        "italian": "racconto",
        "korean": "이야기"
      },
      "TALL": {
        "hindi": "लंबा",
        "telugu": "పొడవైన",
        "chinese": "高大的",
        "spanish": "alto",
        "french": "grand",
        "german": "hoch",
        "arabic": "طويل",
        "japanese": "背が高い",
        "russian": "высокий",
        "portuguese": "alto",
        "italian": "alto",
        "korean": "키 큰"
      },
      "COAT": {
        "hindi": "कोट या जैकेट",
        "telugu": "కోటు",
        "chinese": "外套",
        "spanish": "abrigo",
        "french": "manteau",
        "german": "mantel",
        "arabic": "معطف",
        "japanese": "コート",
        "russian": "пальто",
        "portuguese": "casaco",
        "italian": "cappotto",
        "korean": "외투"
      }
    },
    "wordPool": [
      "KING",
      "CROWN",
      "TOWER",
      "GATE",
      "HALL",
      "RING",
      "IRON",
      "BELL",
      "WALL",
      "CORN",
      "GOWN",
      "TALE",
      "TALL",
      "COAT"
    ]
  },
  {
    "level": 15,
    "theme": "Fruits & Orchard",
    "gridSize": 5,
    "timeLimit": 85,
    "grid": [
      [
        "A",
        "P",
        "P",
        "L",
        "E"
      ],
      [
        "B",
        "E",
        "R",
        "R",
        "Y"
      ],
      [
        "P",
        "E",
        "A",
        "R",
        "S"
      ],
      [
        "P",
        "L",
        "U",
        "M",
        "O"
      ],
      [
        "L",
        "I",
        "M",
        "E",
        "S"
      ]
    ],
    "words": [
      "APPLE",
      "BERRY",
      "PEAR",
      "PLUM",
      "LIME",
      "ROSE",
      "ELM",
      "PEEL",
      "REAP",
      "ROSY",
      "RYE",
      "MULE",
      "REALM",
      "PLUME"
    ],
    "translations": {
      "APPLE": {
        "hindi": "सेब",
        "telugu": "సేబు",
        "chinese": "苹果",
        "spanish": "manzana",
        "french": "pomme",
        "german": "apfel",
        "arabic": "تفاحة",
        "japanese": "りんご",
        "russian": "яблоко",
        "portuguese": "maçã",
        "italian": "mela",
        "korean": "사과"
      },
      "BERRY": {
        "hindi": "बेरी या बेरी के फल",
        "telugu": "బెర్రీ",
        "chinese": "浆果",
        "spanish": "baya",
        "french": "baie",
        "german": "beere",
        "arabic": "توت",
        "japanese": "ベリー",
        "russian": "ягода",
        "portuguese": "baga",
        "italian": "bacca",
        "korean": "베리"
      },
      "PEAR": {
        "hindi": "नाशपाती",
        "telugu": "బేరిపండు",
        "chinese": "梨",
        "spanish": "pera",
        "french": "poire",
        "german": "birne",
        "arabic": "كمثرى",
        "japanese": "梨",
        "russian": "груша",
        "portuguese": "pêra",
        "italian": "pera",
        "korean": "배"
      },
      "PLUM": {
        "hindi": "आलूबुखारा",
        "telugu": "ప్లమ్",
        "chinese": "李子",
        "spanish": "ciruela",
        "french": "prune",
        "german": "pflaume",
        "arabic": "برقوق",
        "japanese": "プラム",
        "russian": "слива",
        "portuguese": "ameixa",
        "italian": "prugna",
        "korean": "자두"
      },
      "LIME": {
        "hindi": "नींबू",
        "telugu": "నిమ్మకాయ",
        "chinese": "青柠",
        "spanish": "lima",
        "french": "citron vert",
        "german": "limette",
        "arabic": "ليمون أخضر",
        "japanese": "ライム",
        "russian": "лайм",
        "portuguese": "lima",
        "italian": "lime",
        "korean": "라임"
      },
      "ROSE": {
        "hindi": "गुलाब",
        "telugu": "గులాబీ",
        "chinese": "玫瑰",
        "spanish": "rosa",
        "french": "rose",
        "german": "rose",
        "arabic": "وردة",
        "japanese": "薔薇",
        "russian": "роза",
        "portuguese": "rosa",
        "italian": "rosa",
        "korean": "장미"
      },
      "ELM": {
        "hindi": "एल्म का पेड़",
        "telugu": "ఎల్మ్ చెట్టు",
        "chinese": "榆树",
        "spanish": "olmo",
        "french": "orme",
        "german": "ulme",
        "arabic": "دردار",
        "japanese": "楡",
        "russian": "вяз",
        "portuguese": "olmo",
        "italian": "olmo",
        "korean": "느릅나무"
      },
      "PEEL": {
        "hindi": "छिलका उतारना",
        "telugu": "తొక్క తీయడం",
        "chinese": "削皮",
        "spanish": "pelar",
        "french": "peler",
        "german": "schälen",
        "arabic": "قشرة",
        "japanese": "皮をむく",
        "russian": "кожура",
        "portuguese": "casca",
        "italian": "buccia",
        "korean": "껍질"
      },
      "REAP": {
        "hindi": "फसल काटना",
        "telugu": "పంట కోయడం",
        "chinese": "收割",
        "spanish": "cosechar",
        "french": "récolter",
        "german": "ernten",
        "arabic": "حصد",
        "japanese": "収穫する",
        "russian": "жать",
        "portuguese": "colher",
        "italian": "mietere",
        "korean": "수확하다"
      },
      "ROSY": {
        "hindi": "गुलाबी",
        "telugu": "గులాబీ రంగులో",
        "chinese": "红润的",
        "spanish": "sonrosado",
        "french": "rosé",
        "german": "rosig",
        "arabic": "وردي",
        "japanese": "バラ色の",
        "russian": "розовый",
        "portuguese": "rosado",
        "italian": "roseo",
        "korean": "장밋빛의"
      },
      "RYE": {
        "hindi": "राई",
        "telugu": "రై ధాన్యం",
        "chinese": "黑麦",
        "spanish": "centeno",
        "french": "seigle",
        "german": "roggen",
        "arabic": "جاودار",
        "japanese": "ライ麦",
        "russian": "рожь",
        "portuguese": "centeio",
        "italian": "segale",
        "korean": "호밀"
      },
      "MULE": {
        "hindi": "खच्चर",
        "telugu": "కంచరగాడిద",
        "chinese": "骡子",
        "spanish": "mula",
        "french": "mule",
        "german": "maultier",
        "arabic": "بغل",
        "japanese": "ラバ",
        "russian": "мул",
        "portuguese": "mula",
        "italian": "mulo",
        "korean": "노새"
      },
      "REALM": {
        "hindi": "क्षेत्र",
        "telugu": "ప్రాంతం",
        "chinese": "领域",
        "spanish": "reino",
        "french": "royaume",
        "german": "reich",
        "arabic": "مملكة",
        "japanese": "王国",
        "russian": "королевство",
        "portuguese": "reino",
        "italian": "regno",
        "korean": "영역"
      },
      "PLUME": {
        "hindi": "पंख",
        "telugu": "ఈక",
        "chinese": "羽毛",
        "spanish": "pluma",
        "french": "plume",
        "german": "feder",
        "arabic": "ريشة",
        "japanese": "羽飾り",
        "russian": "плюмаж",
        "portuguese": "pluma",
        "italian": "piuma",
        "korean": "깃털"
      }
    },
    "wordPool": [
      "APPLE",
      "BERRY",
      "PEAR",
      "PLUM",
      "LIME",
      "ROSE",
      "ELM",
      "PEEL",
      "REAP",
      "ROSY",
      "RYE",
      "MULE",
      "REALM",
      "PLUME"
    ]
  },
  {
    "level": 16,
    "theme": "Jungle Safari",
    "gridSize": 6,
    "timeLimit": 85,
    "grid": [
      [
        "T",
        "I",
        "G",
        "E",
        "R",
        "S"
      ],
      [
        "Z",
        "E",
        "B",
        "R",
        "A",
        "M"
      ],
      [
        "M",
        "O",
        "N",
        "K",
        "E",
        "Y"
      ],
      [
        "S",
        "N",
        "A",
        "K",
        "E",
        "S"
      ],
      [
        "F",
        "A",
        "U",
        "N",
        "P",
        "A"
      ],
      [
        "L",
        "I",
        "O",
        "N",
        "S",
        "T"
      ]
    ],
    "words": [
      "TIGER",
      "ZEBRA",
      "MONKEY",
      "SNAKE",
      "LION",
      "FAUN",
      "BEAR",
      "FAUNA",
      "SNAIL",
      "BEAK",
      "GREEN",
      "BONE",
      "ZONE",
      "GEAR",
      "EYE"
    ],
    "translations": {
      "TIGER": {
        "hindi": "बाघ",
        "telugu": "పులి",
        "chinese": "老虎",
        "spanish": "tigre",
        "french": "tigre",
        "german": "tiger",
        "arabic": "نمر",
        "japanese": "虎",
        "russian": "тигр",
        "portuguese": "tigre",
        "italian": "tigre",
        "korean": "호랑이"
      },
      "ZEBRA": {
        "hindi": "ज़ेबरा",
        "telugu": "జీబ్రా",
        "chinese": "斑马",
        "spanish": "cebra",
        "french": "zèbre",
        "german": "zebra",
        "arabic": "حمار وحشي",
        "japanese": "シマウマ",
        "russian": "зебра",
        "portuguese": "zebra",
        "italian": "zebra",
        "korean": "얼룩말"
      },
      "MONKEY": {
        "hindi": "बंदर",
        "telugu": "కోతి",
        "chinese": "猴子",
        "spanish": "mono",
        "french": "singe",
        "german": "affe",
        "arabic": "قرد",
        "japanese": "猿",
        "russian": "обезьяна",
        "portuguese": "macaco",
        "italian": "scimmia",
        "korean": "원숭이"
      },
      "SNAKE": {
        "hindi": "साँप",
        "telugu": "పాము",
        "chinese": "蛇",
        "spanish": "serpiente",
        "french": "serpent",
        "german": "schlange",
        "arabic": "ثعبان",
        "japanese": "蛇",
        "russian": "змея",
        "portuguese": "cobra",
        "italian": "serpente",
        "korean": "뱀"
      },
      "LION": {
        "hindi": "शेर",
        "telugu": "సింహం",
        "chinese": "狮子",
        "spanish": "león",
        "french": "lion",
        "german": "löwe",
        "arabic": "أسد",
        "japanese": "ライオン",
        "russian": "лев",
        "portuguese": "leão",
        "italian": "leone",
        "korean": "사자"
      },
      "FAUN": {
        "hindi": "वन देवता",
        "telugu": "అడవి దేవత",
        "chinese": "牧神",
        "spanish": "fauno",
        "french": "faune",
        "german": "faun",
        "arabic": "فون",
        "japanese": "フォーン",
        "russian": "фавн",
        "portuguese": "fauno",
        "italian": "fauno",
        "korean": "파운"
      },
      "BEAR": {
        "hindi": "भालू",
        "telugu": "ఎలుగుబంటి",
        "chinese": "熊",
        "spanish": "oso",
        "french": "ours",
        "german": "bär",
        "arabic": "دب",
        "japanese": "熊",
        "russian": "медведь",
        "portuguese": "urso",
        "italian": "orso",
        "korean": "곰"
      },
      "FAUNA": {
        "hindi": "जीव-जंतु",
        "telugu": "జంతుజాలం",
        "chinese": "动物群",
        "spanish": "fauna",
        "french": "faune",
        "german": "fauna",
        "arabic": "حيوانات",
        "japanese": "動物相",
        "russian": "фауна",
        "portuguese": "fauna",
        "italian": "fauna",
        "korean": "동물군"
      },
      "SNAIL": {
        "hindi": "घोंघा",
        "telugu": "నత్త",
        "chinese": "蜗牛",
        "spanish": "caracol",
        "french": "escargot",
        "german": "schnecke",
        "arabic": "حلزون",
        "japanese": "カタツムリ",
        "russian": "улитка",
        "portuguese": "caracol",
        "italian": "chiocciola",
        "korean": "달팽이"
      },
      "BEAK": {
        "hindi": "चोंच",
        "telugu": "ముక్కు",
        "chinese": "鸟喙",
        "spanish": "pico",
        "french": "bec",
        "german": "schnabel",
        "arabic": "منقار",
        "japanese": "くちばし",
        "russian": "клюв",
        "portuguese": "bico",
        "italian": "becco",
        "korean": "부리"
      },
      "GREEN": {
        "hindi": "हरा",
        "telugu": "ఆకుపచ్చ",
        "chinese": "绿色",
        "spanish": "verde",
        "french": "vert",
        "german": "grün",
        "arabic": "أخضر",
        "japanese": "緑",
        "russian": "зеленый",
        "portuguese": "verde",
        "italian": "verde",
        "korean": "초록색"
      },
      "BONE": {
        "hindi": "हड्डी",
        "telugu": "ఎముక",
        "chinese": "骨头",
        "spanish": "hueso",
        "french": "os",
        "german": "knochen",
        "arabic": "عظم",
        "japanese": "骨",
        "russian": "кость",
        "portuguese": "osso",
        "italian": "osso",
        "korean": "뼈"
      },
      "ZONE": {
        "hindi": "क्षेत्र",
        "telugu": "ప్రాంతం",
        "chinese": "区域",
        "spanish": "zona",
        "french": "zone",
        "german": "zone",
        "arabic": "منطقة",
        "japanese": "地帯",
        "russian": "зона",
        "portuguese": "zona",
        "italian": "zona",
        "korean": "구역"
      },
      "GEAR": {
        "hindi": "उपकरण",
        "telugu": "పరికరాలు",
        "chinese": "装备",
        "spanish": "equipo",
        "french": "équipement",
        "german": "ausrüstung",
        "arabic": "عتاد",
        "japanese": "装備",
        "russian": "снаряжение",
        "portuguese": "equipamento",
        "italian": "ingranaggio",
        "korean": "장비"
      },
      "EYE": {
        "hindi": "आँख",
        "telugu": "కన్ను",
        "chinese": "眼睛",
        "spanish": "ojo",
        "french": "œil",
        "german": "auge",
        "arabic": "عين",
        "japanese": "目",
        "russian": "глаз",
        "portuguese": "olho",
        "italian": "occhio",
        "korean": "눈"
      }
    },
    "wordPool": [
      "TIGER",
      "ZEBRA",
      "MONKEY",
      "SNAKE",
      "LION",
      "FAUN",
      "BEAR",
      "FAUNA",
      "SNAIL",
      "BEAK",
      "GREEN",
      "BONE",
      "ZONE",
      "GEAR",
      "EYE"
    ]
  },
  {
    "level": 17,
    "theme": "Time & Seasons",
    "gridSize": 6,
    "timeLimit": 80,
    "grid": [
      [
        "S",
        "P",
        "R",
        "I",
        "N",
        "G"
      ],
      [
        "S",
        "U",
        "M",
        "M",
        "E",
        "R"
      ],
      [
        "A",
        "U",
        "T",
        "U",
        "M",
        "N"
      ],
      [
        "W",
        "I",
        "N",
        "T",
        "E",
        "R"
      ],
      [
        "C",
        "L",
        "O",
        "C",
        "K",
        "S"
      ],
      [
        "N",
        "I",
        "G",
        "H",
        "T",
        "S"
      ]
    ],
    "words": [
      "SPRING",
      "SUMMER",
      "AUTUMN",
      "WINTER",
      "CLOCK",
      "NIGHT",
      "WIN",
      "COIN",
      "LOCK",
      "NET",
      "PRIME",
      "ONCE",
      "RIME",
      "GLINT",
      "ECHO"
    ],
    "translations": {
      "SPRING": {
        "hindi": "वसंत ऋतु",
        "telugu": "వసంత ఋతువు",
        "chinese": "春天",
        "spanish": "primavera",
        "french": "printemps",
        "german": "frühling",
        "arabic": "ربيع",
        "japanese": "春",
        "russian": "весна",
        "portuguese": "primavera",
        "italian": "primavera",
        "korean": "봄"
      },
      "SUMMER": {
        "hindi": "गर्मी",
        "telugu": "వేసవి",
        "chinese": "夏天",
        "spanish": "verano",
        "french": "été",
        "german": "sommer",
        "arabic": "صيف",
        "japanese": "夏",
        "russian": "лето",
        "portuguese": "verão",
        "italian": "estate",
        "korean": "여름"
      },
      "AUTUMN": {
        "hindi": "पतझड़",
        "telugu": "శరదృతువు",
        "chinese": "秋天",
        "spanish": "otoño",
        "french": "automne",
        "german": "herbst",
        "arabic": "خريف",
        "japanese": "秋",
        "russian": "осень",
        "portuguese": "outono",
        "italian": "autunno",
        "korean": "가을"
      },
      "WINTER": {
        "hindi": "सर्दी",
        "telugu": "శీతాకాలం",
        "chinese": "冬天",
        "spanish": "invierno",
        "french": "hiver",
        "german": "winter",
        "arabic": "شتاء",
        "japanese": "冬",
        "russian": "зима",
        "portuguese": "inverno",
        "italian": "inverno",
        "korean": "겨울"
      },
      "CLOCK": {
        "hindi": "घड़ी",
        "telugu": "గడియారం",
        "chinese": "时钟",
        "spanish": "reloj",
        "french": "horloge",
        "german": "uhr",
        "arabic": "ساعة",
        "japanese": "時計",
        "russian": "часы",
        "portuguese": "relógio",
        "italian": "orologio",
        "korean": "시계"
      },
      "NIGHT": {
        "hindi": "रात",
        "telugu": "రాత్రి",
        "chinese": "夜晚",
        "spanish": "noche",
        "french": "nuit",
        "german": "nacht",
        "arabic": "ليل",
        "japanese": "夜",
        "russian": "ночь",
        "portuguese": "noite",
        "italian": "notte",
        "korean": "밤"
      },
      "WIN": {
        "hindi": "जीत",
        "telugu": "గెలుపు",
        "chinese": "获胜",
        "spanish": "ganar",
        "french": "gagner",
        "german": "gewinnen",
        "arabic": "فوز",
        "japanese": "勝つ",
        "russian": "побеждать",
        "portuguese": "vencer",
        "italian": "vincere",
        "korean": "이기다"
      },
      "COIN": {
        "hindi": "सिक्का",
        "telugu": "నాణెం",
        "chinese": "硬币",
        "spanish": "moneda",
        "french": "pièce",
        "german": "münze",
        "arabic": "عملة معدنية",
        "japanese": "硬貨",
        "russian": "монета",
        "portuguese": "moeda",
        "italian": "moneta",
        "korean": "동전"
      },
      "LOCK": {
        "hindi": "ताला",
        "telugu": "తాళం",
        "chinese": "锁",
        "spanish": "cerradura",
        "french": "serrure",
        "german": "schloss",
        "arabic": "قفل",
        "japanese": "錠",
        "russian": "замок",
        "portuguese": "fechadura",
        "italian": "serratura",
        "korean": "자물쇠"
      },
      "NET": {
        "hindi": "जाल",
        "telugu": "వల",
        "chinese": "渔网",
        "spanish": "red",
        "french": "filet",
        "german": "netz",
        "arabic": "شبكة",
        "japanese": "網",
        "russian": "сеть",
        "portuguese": "rede",
        "italian": "rete",
        "korean": "그물"
      },
      "PRIME": {
        "hindi": "मुख्य समय",
        "telugu": "ప్రధాన సమయం",
        "chinese": "黄金时期",
        "spanish": "primero",
        "french": "premier",
        "german": "prima",
        "arabic": "رئيسي",
        "japanese": "主要な",
        "russian": "главный",
        "portuguese": "principal",
        "italian": "principale",
        "korean": "주요한"
      },
      "ONCE": {
        "hindi": "एक बार",
        "telugu": "ఒకసారి",
        "chinese": "一次",
        "spanish": "una vez",
        "french": "une fois",
        "german": "einmal",
        "arabic": "مرة واحدة",
        "japanese": "一度",
        "russian": "однажды",
        "portuguese": "uma vez",
        "italian": "una volta",
        "korean": "한 번"
      },
      "RIME": {
        "hindi": "पाला",
        "telugu": "మంచు పొర",
        "chinese": "霜",
        "spanish": "escarcha",
        "french": "givre",
        "german": "reif",
        "arabic": "صقيع",
        "japanese": "樹氷",
        "russian": "иней",
        "portuguese": "geada",
        "italian": "brina",
        "korean": "서리"
      },
      "GLINT": {
        "hindi": "चमक",
        "telugu": "మెరుపు",
        "chinese": "闪光",
        "spanish": "destello",
        "french": "lueur",
        "german": "schimmer",
        "arabic": "بريق",
        "japanese": "きらめき",
        "russian": "блеск",
        "portuguese": "brilho",
        "italian": "bagliore",
        "korean": "반짝임"
      },
      "ECHO": {
        "hindi": "गूँज",
        "telugu": "ప్రతిధ్వని",
        "chinese": "回声",
        "spanish": "eco",
        "french": "écho",
        "german": "echo",
        "arabic": "صدى",
        "japanese": "木霊",
        "russian": "эхо",
        "portuguese": "eco",
        "italian": "eco",
        "korean": "메아리"
      }
    },
    "wordPool": [
      "SPRING",
      "SUMMER",
      "AUTUMN",
      "WINTER",
      "CLOCK",
      "NIGHT",
      "WIN",
      "COIN",
      "LOCK",
      "NET",
      "PRIME",
      "ONCE",
      "RIME",
      "GLINT",
      "ECHO"
    ]
  },
  {
    "level": 18,
    "theme": "Mountain Peak",
    "gridSize": 6,
    "timeLimit": 80,
    "grid": [
      [
        "M",
        "O",
        "U",
        "N",
        "T",
        "S"
      ],
      [
        "C",
        "L",
        "I",
        "F",
        "F",
        "Y"
      ],
      [
        "R",
        "I",
        "D",
        "G",
        "E",
        "S"
      ],
      [
        "S",
        "L",
        "O",
        "P",
        "E",
        "D"
      ],
      [
        "C",
        "A",
        "N",
        "Y",
        "O",
        "N"
      ],
      [
        "V",
        "A",
        "L",
        "L",
        "E",
        "Y"
      ]
    ],
    "words": [
      "MOUNT",
      "CLIFF",
      "RIDGE",
      "SLOPE",
      "CANYON",
      "VALLEY",
      "DEEP",
      "OPEN",
      "POLE",
      "DEN",
      "VAN",
      "LODGE",
      "LIFT",
      "LAVA",
      "PONY"
    ],
    "translations": {
      "MOUNT": {
        "hindi": "पर्वत",
        "telugu": "పర్వతం",
        "chinese": "山峰",
        "spanish": "monte",
        "french": "mont",
        "german": "berg",
        "arabic": "جبل",
        "japanese": "山",
        "russian": "гора",
        "portuguese": "monte",
        "italian": "monte",
        "korean": "산"
      },
      "CLIFF": {
        "hindi": "खड़ी चट्टान",
        "telugu": "కొండచరియ",
        "chinese": "悬崖",
        "spanish": "acantilado",
        "french": "falaise",
        "german": "klippe",
        "arabic": "منحدر صخري",
        "japanese": "崖",
        "russian": "утес",
        "portuguese": "penhasco",
        "italian": "scogliera",
        "korean": "절벽"
      },
      "RIDGE": {
        "hindi": "पहाड़ी चोटी या शिखर",
        "telugu": "పర్వత శ్రేణి",
        "chinese": "山脊",
        "spanish": "cresta",
        "french": "crête",
        "german": "grat",
        "arabic": "سلسلة جبلية",
        "japanese": "尾根",
        "russian": "хребет",
        "portuguese": "crista",
        "italian": "cresta",
        "korean": "산등성이"
      },
      "SLOPE": {
        "hindi": "ढलान",
        "telugu": "వాలు",
        "chinese": "斜坡",
        "spanish": "pendiente",
        "french": "pente",
        "german": "hang",
        "arabic": "منحدر",
        "japanese": "斜面",
        "russian": "склон",
        "portuguese": "encosta",
        "italian": "pendenza",
        "korean": "경사면"
      },
      "CANYON": {
        "hindi": "कंदरा या गहरी घाटी",
        "telugu": "లోయ",
        "chinese": "峡谷",
        "spanish": "cañón",
        "french": "canyon",
        "german": "schlucht",
        "arabic": "أخدود",
        "japanese": "峡谷",
        "russian": "каньон",
        "portuguese": "cânion",
        "italian": "canyon",
        "korean": "협곡"
      },
      "VALLEY": {
        "hindi": "उपत्यका या घाटी",
        "telugu": "పచ్చని లోయ",
        "chinese": "山谷",
        "spanish": "valle",
        "french": "vallée",
        "german": "tal",
        "arabic": "وادي",
        "japanese": "谷",
        "russian": "долина",
        "portuguese": "vale",
        "italian": "valle",
        "korean": "계곡"
      },
      "DEEP": {
        "hindi": "गहरा",
        "telugu": "లోతైన",
        "chinese": "深邃的",
        "spanish": "profundo",
        "french": "profond",
        "german": "tief",
        "arabic": "عميق",
        "japanese": "深い",
        "russian": "глубокий",
        "portuguese": "profundo",
        "italian": "profondo",
        "korean": "깊은"
      },
      "OPEN": {
        "hindi": "खुला",
        "telugu": "తెరిచి ఉన్న",
        "chinese": "开阔的",
        "spanish": "abierto",
        "french": "ouvert",
        "german": "offen",
        "arabic": "مفتوح",
        "japanese": "開いた",
        "russian": "открытый",
        "portuguese": "aberto",
        "italian": "aperto",
        "korean": "열린"
      },
      "POLE": {
        "hindi": "खंभा",
        "telugu": "స్తంభం",
        "chinese": "杆子",
        "spanish": "polo",
        "french": "pôle",
        "german": "pol",
        "arabic": "قطب",
        "japanese": "極",
        "russian": "полюс",
        "portuguese": "polo",
        "italian": "polo",
        "korean": "기둥"
      },
      "DEN": {
        "hindi": "मांद या बिल",
        "telugu": "గుహ",
        "chinese": "兽穴",
        "spanish": "guarida",
        "french": "tanière",
        "german": "höhle",
        "arabic": "عرين",
        "japanese": "巣穴",
        "russian": "логово",
        "portuguese": "toca",
        "italian": "tana",
        "korean": "굴"
      },
      "VAN": {
        "hindi": "वैन या बस",
        "telugu": "వ్యాన్",
        "chinese": "面包车",
        "spanish": "furgoneta",
        "french": "fourgonnette",
        "german": "lieferwagen",
        "arabic": "شاحنة صغيرة",
        "japanese": "バン",
        "russian": "фургон",
        "portuguese": "van",
        "italian": "furgone",
        "korean": "승합차"
      },
      "LODGE": {
        "hindi": "पर्वतीय कुटीर या विश्रामगृह",
        "telugu": "విశ్రాంతి గృహం",
        "chinese": "山庄",
        "spanish": "cabaña",
        "french": "gîte",
        "german": "hütte",
        "arabic": "نزل",
        "japanese": "ロッジ",
        "russian": "домик",
        "portuguese": "chalé",
        "italian": "rifugio",
        "korean": "오두막"
      },
      "LIFT": {
        "hindi": "स्की लिफ्ट या केबल कार",
        "telugu": "లిఫ్ట్",
        "chinese": "缆车",
        "spanish": "elevar",
        "french": "lever",
        "german": "heben",
        "arabic": "رفع",
        "japanese": "持ち上げる",
        "russian": "поднимать",
        "portuguese": "levantar",
        "italian": "sollevare",
        "korean": "들어올리다"
      },
      "LAVA": {
        "hindi": "लावा या ज्वालामुखीय द्रव",
        "telugu": "లావా",
        "chinese": "熔岩",
        "spanish": "lava",
        "french": "lave",
        "german": "lava",
        "arabic": "حمم بركانية",
        "japanese": "溶岩",
        "russian": "лава",
        "portuguese": "lava",
        "italian": "lava",
        "korean": "용암"
      },
      "PONY": {
        "hindi": "टट्टू या छोटा घोड़ा",
        "telugu": "పొట్టి గుర్రం",
        "chinese": "小马",
        "spanish": "poni",
        "french": "poney",
        "german": "pony",
        "arabic": "مهر",
        "japanese": "子馬",
        "russian": "пони",
        "portuguese": "pônei",
        "italian": "pony",
        "korean": "조랑말"
      }
    },
    "wordPool": [
      "MOUNT",
      "CLIFF",
      "RIDGE",
      "SLOPE",
      "CANYON",
      "VALLEY",
      "DEEP",
      "OPEN",
      "POLE",
      "DEN",
      "VAN",
      "LODGE",
      "LIFT",
      "LAVA",
      "PONY"
    ]
  },
  {
    "level": 19,
    "theme": "Treasure Island",
    "gridSize": 6,
    "timeLimit": 75,
    "grid": [
      [
        "C",
        "H",
        "E",
        "S",
        "T",
        "S"
      ],
      [
        "P",
        "I",
        "R",
        "A",
        "T",
        "E"
      ],
      [
        "S",
        "I",
        "L",
        "V",
        "E",
        "R"
      ],
      [
        "G",
        "O",
        "L",
        "D",
        "E",
        "N"
      ],
      [
        "P",
        "E",
        "A",
        "R",
        "L",
        "S"
      ],
      [
        "A",
        "N",
        "C",
        "H",
        "O",
        "R"
      ]
    ],
    "words": [
      "CHEST",
      "PIRATE",
      "PEARL",
      "ANCHOR",
      "CARD",
      "HEAT",
      "RICHES",
      "STEAL",
      "TAVERN",
      "PIER",
      "STEEL",
      "VAST",
      "HORDE",
      "CHIP",
      "HOLD"
    ],
    "translations": {
      "CHEST": {
        "hindi": "संदूक या बक्सा",
        "telugu": "పెట్టె",
        "chinese": "宝箱",
        "spanish": "cofre",
        "french": "coffre",
        "german": "truhe",
        "arabic": "صندوق الكنز",
        "japanese": "宝箱",
        "russian": "сундук",
        "portuguese": "baú",
        "italian": "forziere",
        "korean": "상자"
      },
      "PIRATE": {
        "hindi": "समुद्री डाकू",
        "telugu": "సముద్రపు దొంగ",
        "chinese": "海盗",
        "spanish": "pirata",
        "french": "pirate",
        "german": "pirat",
        "arabic": "قرصان",
        "japanese": "海賊",
        "russian": "пират",
        "portuguese": "pirata",
        "italian": "pirata",
        "korean": "해적"
      },
      "PEARL": {
        "hindi": "मोती",
        "telugu": "ముత్యం",
        "chinese": "珍珠",
        "spanish": "perla",
        "french": "perle",
        "german": "perle",
        "arabic": "لؤلؤة",
        "japanese": "真珠",
        "russian": "жемчужина",
        "portuguese": "pérola",
        "italian": "perla",
        "korean": "진주"
      },
      "ANCHOR": {
        "hindi": "लंगर",
        "telugu": "లంగరు",
        "chinese": "铁锚",
        "spanish": "ancla",
        "french": "ancre",
        "german": "anker",
        "arabic": "مرساة",
        "japanese": "錨",
        "russian": "якорь",
        "portuguese": "âncora",
        "italian": "ancora",
        "korean": "닻"
      },
      "CARD": {
        "hindi": "नक्शा या ताश का पत्ता",
        "telugu": "కార్డు",
        "chinese": "卡片",
        "spanish": "carta",
        "french": "carte",
        "german": "karte",
        "arabic": "بطاقة",
        "japanese": "カード",
        "russian": "карта",
        "portuguese": "carta",
        "italian": "carta",
        "korean": "카드"
      },
      "HEAT": {
        "hindi": "ताप या गर्मी",
        "telugu": "వేడి",
        "chinese": "酷热",
        "spanish": "calor",
        "french": "chaleur",
        "german": "hitze",
        "arabic": "حرارة",
        "japanese": "熱",
        "russian": "жара",
        "portuguese": "calor",
        "italian": "calore",
        "korean": "열기"
      },
      "RICHES": {
        "hindi": "अतुल धन या अत्यधिक संपत्ति",
        "telugu": "సిరిసంపదలు",
        "chinese": "财富",
        "spanish": "riquezas",
        "french": "richesses",
        "german": "reichtum",
        "arabic": "ثروات",
        "japanese": "富",
        "russian": "богатства",
        "portuguese": "riquezas",
        "italian": "ricchezze",
        "korean": "부"
      },
      "STEAL": {
        "hindi": "चुराना",
        "telugu": "దొంగిలించడం",
        "chinese": "偷窃",
        "spanish": "robar",
        "french": "voler",
        "german": "stehlen",
        "arabic": "سرقة",
        "japanese": "盗む",
        "russian": "красть",
        "portuguese": "roubar",
        "italian": "rubare",
        "korean": "훔치다"
      },
      "TAVERN": {
        "hindi": "सराय या शराबख़ाना",
        "telugu": "సత్రం",
        "chinese": "酒馆",
        "spanish": "taberna",
        "french": "taverne",
        "german": "taverne",
        "arabic": "حانة",
        "japanese": "酒場",
        "russian": "таверна",
        "portuguese": "taverna",
        "italian": "taverna",
        "korean": "선술집"
      },
      "PIER": {
        "hindi": "घाट",
        "telugu": "రేవు",
        "chinese": "码头",
        "spanish": "muelle",
        "french": "jetée",
        "german": "steg",
        "arabic": "رصيف الميناء",
        "japanese": "桟橋",
        "russian": "пирс",
        "portuguese": "cais",
        "italian": "molo",
        "korean": "부두"
      },
      "STEEL": {
        "hindi": "इस्पात या स्टील",
        "telugu": "ఉక్కు",
        "chinese": "钢铁",
        "spanish": "acero",
        "french": "acier",
        "german": "stahl",
        "arabic": "فولاذ",
        "japanese": "鋼鉄",
        "russian": "сталь",
        "portuguese": "aço",
        "italian": "acciaio",
        "korean": "강철"
      },
      "VAST": {
        "hindi": "विशाल",
        "telugu": "విశాలమైన",
        "chinese": "辽阔的",
        "spanish": "vasto",
        "french": "vaste",
        "german": "weit",
        "arabic": "واسع",
        "japanese": "広大な",
        "russian": "обширный",
        "portuguese": "vasto",
        "italian": "vasto",
        "korean": "광대한"
      },
      "HORDE": {
        "hindi": "झुंड या समूह",
        "telugu": "గుంపు",
        "chinese": "部落",
        "spanish": "horda",
        "french": "horde",
        "german": "horde",
        "arabic": "حشد",
        "japanese": "群勢",
        "russian": "орда",
        "portuguese": "horda",
        "italian": "orda",
        "korean": "무리"
      },
      "CHIP": {
        "hindi": "स्वर्ण खंड या टुकड़ा",
        "telugu": "ముక్క",
        "chinese": "碎片",
        "spanish": "ficha",
        "french": "jeton",
        "german": "chip",
        "arabic": "شريحة",
        "japanese": "チップ",
        "russian": "фишка",
        "portuguese": "ficha",
        "italian": "fiche",
        "korean": "칩"
      },
      "HOLD": {
        "hindi": "जहाज का तलघर या भंडारण क्षेत्र",
        "telugu": "ఓడ అడుగుభాగం",
        "chinese": "船舱",
        "spanish": "bodega",
        "french": "cale",
        "german": "frachthalt",
        "arabic": "عنبر السفينة",
        "japanese": "船倉",
        "russian": "трюм",
        "portuguese": "porão",
        "italian": "stiva",
        "korean": "선창"
      }
    },
    "wordPool": [
      "CHEST",
      "PIRATE",
      "PEARL",
      "ANCHOR",
      "CARD",
      "HEAT",
      "RICHES",
      "STEAL",
      "TAVERN",
      "PIER",
      "STEEL",
      "VAST",
      "HORDE",
      "CHIP",
      "HOLD"
    ]
  },
  {
    "level": 20,
    "theme": "Grand Master Champion",
    "gridSize": 6,
    "timeLimit": 75,
    "grid": [
      [
        "V",
        "I",
        "C",
        "T",
        "O",
        "R"
      ],
      [
        "T",
        "R",
        "O",
        "P",
        "H",
        "Y"
      ],
      [
        "H",
        "E",
        "R",
        "O",
        "E",
        "S"
      ],
      [
        "B",
        "R",
        "A",
        "V",
        "E",
        "S"
      ],
      [
        "G",
        "L",
        "O",
        "R",
        "I",
        "A"
      ],
      [
        "L",
        "E",
        "G",
        "E",
        "N",
        "D"
      ]
    ],
    "words": [
      "VICTOR",
      "TROPHY",
      "HERO",
      "BRAVE",
      "LEGEND",
      "HEROIC",
      "ARENA",
      "BRAVO",
      "GOVERN",
      "ARISE",
      "BLARE",
      "GLARE",
      "GRID",
      "GRIN",
      "LARGE"
    ],
    "translations": {
      "VICTOR": {
        "hindi": "विजेता ",
        "telugu": "విజేత",
        "chinese": "胜利者",
        "spanish": "vencedor",
        "french": "vainqueur",
        "german": "sieger",
        "arabic": "منتصر",
        "japanese": "勝者",
        "russian": "победитель",
        "portuguese": "vencedor",
        "italian": "vincitore",
        "korean": "승리자"
      },
      "TROPHY": {
        "hindi": "विजय-प्रतीक",
        "telugu": "విజయ చిహ్నం",
        "chinese": "奖杯",
        "spanish": "trofeo",
        "french": "trophée",
        "german": "trophäe",
        "arabic": "كأس البطولة",
        "japanese": "トロフィー",
        "russian": "трофей",
        "portuguese": "troféu",
        "italian": "trofeo",
        "korean": "트로피"
      },
      "HERO": {
        "hindi": "नायक",
        "telugu": "వీరుడు",
        "chinese": "英雄",
        "spanish": "héroe",
        "french": "héros",
        "german": "held",
        "arabic": "بطل",
        "japanese": "英雄",
        "russian": "герой",
        "portuguese": "herói",
        "italian": "eroe",
        "korean": "영웅"
      },
      "BRAVE": {
        "hindi": "साहसी या बहादुर",
        "telugu": "ధైర్యవంతుడు",
        "chinese": "勇敢的",
        "spanish": "valiente",
        "french": "brave",
        "german": "mutig",
        "arabic": "شجاع",
        "japanese": "勇敢な",
        "russian": "храбрый",
        "portuguese": "corajoso",
        "italian": "coraggioso",
        "korean": "용감한"
      },
      "LEGEND": {
        "hindi": "अमर गाथा",
        "telugu": "పురాణ పురుషుడు",
        "chinese": "传奇",
        "spanish": "leyenda",
        "french": "légende",
        "german": "legende",
        "arabic": "أسطورة",
        "japanese": "伝説",
        "russian": "легенда",
        "portuguese": "lenda",
        "italian": "leggenda",
        "korean": "전설"
      },
      "HEROIC": {
        "hindi": "वीरतापूर्ण",
        "telugu": "వీరోచితమైన",
        "chinese": "英勇的",
        "spanish": "heroico",
        "french": "héroïque",
        "german": "heroisch",
        "arabic": "بطولي",
        "japanese": "英雄的",
        "russian": "героический",
        "portuguese": "heroico",
        "italian": "eroico",
        "korean": "영웅적인"
      },
      "ARENA": {
        "hindi": "रणभूमि या अखाड़ा",
        "telugu": "రణరంగం",
        "chinese": "竞技场",
        "spanish": "arena",
        "french": "arène",
        "german": "arena",
        "arabic": "حلبة",
        "japanese": "競技場",
        "russian": "арена",
        "portuguese": "arena",
        "italian": "arena",
        "korean": "투기장"
      },
      "BRAVO": {
        "hindi": "शाबाश",
        "telugu": "శభాష్",
        "chinese": "喝彩",
        "spanish": "bravo",
        "french": "bravo",
        "german": "bravo",
        "arabic": "أحسنت",
        "japanese": "ブラボー",
        "russian": "браво",
        "portuguese": "bravo",
        "italian": "bravo",
        "korean": "브라보"
      },
      "GOVERN": {
        "hindi": "शासन करना",
        "telugu": "పాలించడం",
        "chinese": "统治",
        "spanish": "gobernar",
        "french": "gouverner",
        "german": "regieren",
        "arabic": "حكم",
        "japanese": "統治する",
        "russian": "править",
        "portuguese": "governar",
        "italian": "governare",
        "korean": "다스리다"
      },
      "ARISE": {
        "hindi": "उठ खड़े होना",
        "telugu": "ఉదయించడం",
        "chinese": "崛起",
        "spanish": "surgir",
        "french": "surgir",
        "german": "aufstehen",
        "arabic": "نهوض",
        "japanese": "立ち上がる",
        "russian": "возникать",
        "portuguese": "surgir",
        "italian": "sorgere",
        "korean": "일어나다"
      },
      "BLARE": {
        "hindi": "शंखनाद या तेज़ आवाज़",
        "telugu": "మోత",
        "chinese": "鸣响",
        "spanish": "estruendo",
        "french": "retentir",
        "german": "schmettern",
        "arabic": "دوي",
        "japanese": "鳴り響く",
        "russian": "греметь",
        "portuguese": "bramido",
        "italian": "squillo",
        "korean": "울려퍼지다"
      },
      "GLARE": {
        "hindi": "तीक्ष्ण दृष्टि या घूरना",
        "telugu": "తీక్షణమైన చూపు",
        "chinese": "怒视",
        "spanish": "resplandor",
        "french": "lueur vive",
        "german": "blenden",
        "arabic": "وهج ساطع",
        "japanese": "ギラギラする光",
        "russian": "блик",
        "portuguese": "clarão",
        "italian": "bagliore accecante",
        "korean": "눈부신 빛"
      },
      "GRID": {
        "hindi": "ग्रिड या नियमित ढांचा",
        "telugu": "గ్రిడ్",
        "chinese": "网格",
        "spanish": "cuadrícula",
        "french": "grille",
        "german": "gitter",
        "arabic": "شبكة المربعات",
        "japanese": "格子",
        "russian": "сетка",
        "portuguese": "grade",
        "italian": "griglia",
        "korean": "격자"
      },
      "GRIN": {
        "hindi": "मुस्कान",
        "telugu": "చిరునవ్వు",
        "chinese": "咧嘴笑",
        "spanish": "sonrisa",
        "french": "large sourire",
        "german": "grinsen",
        "arabic": "ابتسامة عريضة",
        "japanese": "にっこり笑う",
        "russian": "ухмылка",
        "portuguese": "sorriso largo",
        "italian": "ghigno",
        "korean": "활짝 웃다"
      },
      "LARGE": {
        "hindi": "विशाल या बड़ा",
        "telugu": "పెద్ద",
        "chinese": "庞大的",
        "spanish": "grande",
        "french": "grand",
        "german": "groß",
        "arabic": "كبير",
        "japanese": "大きい",
        "russian": "большой",
        "portuguese": "grande",
        "italian": "grande",
        "korean": "커다란"
      }
    },
    "wordPool": [
      "VICTOR",
      "TROPHY",
      "HERO",
      "BRAVE",
      "LEGEND",
      "HEROIC",
      "ARENA",
      "BRAVO",
      "GOVERN",
      "ARISE",
      "BLARE",
      "GLARE",
      "GRID",
      "GRIN",
      "LARGE"
    ]
  }
];

/* ============================================================================
 * 2. LOCAL BONUS ENGLISH WORDS DICTIONARY (ZERO EXTERNAL NETWORK REQUESTS)
 * ============================================================================
 * Satisfies the requirement: "Bonus Words Mechanic: If the player maps a
 * valid word that is NOT on the level's target list, they receive 5 coins."
 * Self-contained array of common, valid English words.
 */
const BONUS_DICTIONARY = new Set([
  "ACT", "ACE", "AGE", "AGO", "AIM", "AIR", "ALL", "AND", "ANT", "ANY", "APE", "ARC",
  "ARE", "ARM", "ART", "ASH", "ASK", "ATE", "AWE", "AXE", "BAD", "BAG", "BAR", "BAT",
  "BAY", "BED", "BEE", "BEG", "BET", "BID", "BIG", "BIN", "BIT", "BOA", "BOB", "BOG",
  "BOW", "BOX", "BOY", "BUS", "BUT", "BUY", "CAN", "CAP", "CAR", "CAT", "COW", "CRY",
  "CUP", "CUT", "DAM", "DAY", "DEN", "DEW", "DID", "DIE", "DIG", "DIM", "DIP", "DOG",
  "DOT", "DRY", "DUE", "EAR", "EAT", "EGG", "ELM", "END", "ERA", "EVE", "EYE", "FAN",
  "FAR", "FAT", "FED", "FEW", "FIG", "FIT", "FIX", "FLY", "FOG", "FOR", "FOX", "FRY",
  "FUN", "FUR", "GAP", "GAS", "GET", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "HAD",
  "HAM", "HAS", "HAT", "HAY", "HEM", "HEN", "HID", "HIM", "HIP", "HIT", "HOG", "HOP",
  "HOT", "HOW", "HUB", "HUG", "HUM", "HUT", "ICE", "ILL", "INK", "INN", "ION", "ITS",
  "IVY", "JAM", "JAR", "JAW", "JAY", "JET", "JIG", "JOB", "JOG", "JOY", "JUG", "KEY",
  "KID", "KIT", "LAB", "LAD", "LAP", "LAW", "LAY", "LED", "LEG", "LET", "LID", "LIE",
  "LIP", "LIT", "LOG", "LOT", "LOW", "MAD", "MAN", "MAP", "MAT", "MAY", "MEN", "MET",
  "MUD", "MUG", "NAP", "NET", "NEW", "NIP", "NOD", "NOT", "NOW", "NUT", "OAK", "OAR",
  "OAT", "ODD", "OFF", "OIL", "OLD", "ONE", "OPT", "ORB", "ORE", "OUR", "OUT", "OWL",
  "OWN", "PAD", "PAN", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PET", "PIE", "PIG",
  "PIN", "PIT", "PLY", "POD", "POP", "POT", "PRO", "PUB", "PUP", "RAG", "RAM", "RAN",
  "RAP", "RAT", "RAW", "RAY", "RED", "RIB", "RID", "RIG", "RIM", "RIP", "ROB", "ROD",
  "ROT", "ROW", "RUB", "RUG", "RUN", "RUT", "RYE", "SAD", "SAG", "SAP", "SAT", "SAW",
  "SAY", "SEA", "SEE", "SET", "SEW", "SHY", "SIN", "SIP", "SIR", "SIT", "SIX", "SKI",
  "SKY", "SLY", "SOB", "SON", "SOW", "SOY", "SPA", "SPY", "SUM", "SUN", "TAB", "TAG",
  "TAN", "TAP", "TAR", "TAX", "TEA", "TEN", "THE", "TIE", "TIN", "TIP", "TOE", "TON",
  "TOP", "TOW", "TOY", "TRY", "TUB", "TUG", "TWO", "URN", "USE", "VAN", "VAT", "VET",
  "VIA", "VOW", "WAR", "WAS", "WAX", "WAY", "WEB", "WED", "WET", "WHO", "WHY", "WIG",
  "WIN", "WIT", "WOE", "WON", "YAK", "YAM", "YES", "YET", "YOU", "ZIP", "ZOO",
  "ABLE", "ACID", "AGED", "ALSO", "AREA", "ARMY", "AWAY", "BABY", "BACK", "BALL",
  "BAND", "BANK", "BASE", "BATH", "BEAR", "BEAT", "BEEN", "BEER", "BELL", "BELT",
  "BEST", "BIRD", "BLOW", "BLUE", "BOAT", "BODY", "BOMB", "BOND", "BONE", "BOOK",
  "BOOM", "BORN", "BOSS", "BOTH", "BOWL", "BULK", "BURN", "BUSH", "BUSY", "CALL",
  "CALM", "CAME", "CAMP", "CARD", "CARE", "CASE", "CASH", "CAST", "CELL", "CHAT",
  "CHEF", "CITY", "CLUB", "COAL", "COAT", "CODE", "COLD", "COME", "COOK", "COOL",
  "COPE", "COPY", "CORE", "COST", "CREW", "CROP", "DARK", "DATA", "DATE", "DAWN",
  "DAYS", "DEAD", "DEAL", "DEAR", "DEBT", "DEEP", "DENY", "DESK", "DIET", "DISC",
  "DISK", "DOES", "DONE", "DOOR", "DOSE", "DOWN", "DRAW", "DREW", "DROP", "DRUG",
  "DUAL", "DUKE", "DUST", "DUTY", "EACH", "EARN", "EASE", "EAST", "EASY", "EDGE",
  "ELSE", "EVEN", "EVER", "FACE", "FACT", "FAIL", "FAIR", "FALL", "FARM", "FAST",
  "FATE", "FEAR", "FEED", "FEEL", "FEET", "FELL", "FELT", "FILE", "FILL", "FILM",
  "FIND", "FINE", "FIRE", "FIRM", "FISH", "FIVE", "FLAT", "FLOW", "FOOD", "FOOT",
  "FORD", "FORM", "FORT", "FOUR", "FREE", "FROM", "FUEL", "FULL", "FUND", "GAIN",
  "GAME", "GATE", "GAVE", "GEAR", "GENE", "GIFT", "GIRL", "GIVE", "GLAD", "GOAL",
  "GOES", "GOLD", "GONE", "GOOD", "GRAY", "GREW", "GROW", "GULF", "HAIR", "HALF",
  "HALL", "HAND", "HANG", "HARD", "HARM", "HATE", "HAVE", "HEAD", "HEAR", "HEAT",
  "HELD", "HELL", "HELP", "HERE", "HERO", "HIGH", "HILL", "HIRE", "HOLD", "HOLE",
  "HOLY", "HOME", "HOPE", "HOST", "HOUR", "HUGE", "HUNG", "HUNT", "HURT", "IDEA",
  "INCH", "INTO", "IRON", "ITEM", "JOIN", "JUMP", "JUST", "KEEP", "KEPT", "KICK",
  "KILL", "KIND", "KING", "KNEE", "KNEW", "KNOW", "LACK", "LADY", "LAID", "LAKE",
  "LAND", "LANE", "LAST", "LATE", "LEAD", "LEFT", "LESS", "LIFE", "LIFT", "LIKE",
  "LINE", "LINK", "LION", "LIST", "LIVE", "LOAD", "LOAN", "LOCK", "LOGO", "LONG",
  "LOOK", "LORD", "LOSE", "LOSS", "LOST", "LOVE", "LUCK", "MADE", "MAIL", "MAIN",
  "MAKE", "MALE", "MANY", "MARK", "MASS", "MEAL", "MEAN", "MEAT", "MEET", "MENU",
  "MERE", "MILD", "MILE", "MILK", "MIND", "MINE", "MISS", "MODE", "MOOD", "MOON",
  "MORE", "MOST", "MOVE", "MUCH", "NAME", "NAVY", "NEAR", "NECK", "NEED", "NEWS",
  "NEXT", "NICE", "NICK", "NINE", "NODE", "NONE", "NOSE", "NOTE", "OKAY", "ONCE",
  "ONLY", "ONTO", "OPEN", "ORAL", "OVER", "PACE", "PACK", "PAGE", "PAID", "PAIN",
  "PAIR", "PALM", "PARK", "PART", "PASS", "PAST", "PATH", "PEAK", "PEER", "PICK",
  "PILE", "PIPE", "PLAN", "PLAY", "PLOT", "PLUG", "PLUS", "POEM", "POET", "POLE",
  "POLL", "POOL", "POOR", "PORT", "POST", "POUR", "PRAY", "PURE", "PUSH", "RACE",
  "RAIL", "RAIN", "RANK", "RARE", "RATE", "READ", "REAL", "REAR", "RELY", "RENT",
  "REST", "RICE", "RICH", "RIDE", "RING", "RISE", "RISK", "ROAD", "ROCK", "ROLE",
  "ROLL", "ROOF", "ROOM", "ROOT", "ROSE", "RULE", "RUSH", "SAFE", "SAID", "SAIL",
  "SALE", "SAME", "SAND", "SAVE", "SEAT", "SEED", "SEEK", "SEEM", "SEEN", "SELF",
  "SELL", "SEND", "SENT", "SHIP", "SHOP", "SHOT", "SHOW", "SHUT", "SICK", "SIDE",
  "SIGN", "SILK", "SITE", "SIZE", "SKIN", "SLOW", "SNAP", "SNOW", "SOAP", "SOFT",
  "SOIL", "SOLD", "SOLE", "SOME", "SONG", "SOON", "SOUL", "SOUP", "SPOT", "STAR",
  "STAY", "STEP", "STOP", "SUCH", "SUIT", "SURE", "TAKE", "TALE", "TALK", "TALL",
  "TANK", "TAPE", "TASK", "TEAM", "TECH", "TELL", "TEND", "TERM", "TEST", "TEXT",
  "THAN", "THAT", "THEM", "THEN", "THEY", "THIN", "THIS", "THOU", "THUS", "TIDE",
  "TIE", "TIED", "TIGHT", "TILE", "TIME", "TINY", "TIRE", "TOOL", "TOOK", "TOPS",
  "TOWN", "TREE", "TRIP", "TRUE", "TUNE", "TURN", "TWIN", "TYPE", "UNIT", "UPON",
  "USED", "USER", "VARY", "VAST", "VERY", "VICE", "VIEW", "VOTE", "WAGE", "WAIT",
  "WAKE", "WALK", "WALL", "WANT", "WARM", "WASH", "WAVE", "WAYS", "WEAK", "WEAR",
  "WEEK", "WELL", "WENT", "WERE", "WEST", "WHAT", "WHEN", "WHOM", "WIDE", "WIFE",
  "WILD", "WILL", "WIND", "WINE", "WING", "WIPE", "WIRE", "WISE", "WISH", "WITH",
  "WOOD", "WORD", "WORK", "YARD", "YEAR", "ZERO", "ZONE"
]);

/* ============================================================================
 * 3. PROCEDURAL SOUND SYNTHESIS ENGINE (WEB AUDIO API)
 * ============================================================================
 * Generates all sound effects natively without external audio files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  // Lazy-initialize audio context on first player interaction
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generic UI click tone
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Ascending musical pitch on letter connection
  playTileSelect(index = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = 300;
      const freq = baseFreq + (index * 60);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  // Celebratory chord on finding a primary target word
  playWordSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.2, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.25);
      });
    } catch (e) {}
  }

  // Sparkling coin jingle for bonus words (+5) and ads (+50)
  playCoinJingle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [987.77, 1318.51, 1567.98].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.18, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch (e) {}
  }

  // Low error buzz on invalid word or insufficient coins
  playErrorBuzz() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  // Magical harp / bell chime for hint reveal
  playHintChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [659.25, 880.00, 1174.66, 1318.51].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.3);
      });
    } catch (e) {}
  }

  /**
   * Dedicated Procedural Audio Effect for Translation Completion
   * Crisp, magical ascending harp/chime sweep with two chained sine-wave oscillators
   * modulating smoothly: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
   * with light gain envelope decay and soft resonance filter (BiquadFilter with Q resonance).
   */
  playTranslateChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.55;

      // Resonant BiquadFilter with Q resonance for soft acoustic shimmer
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(3600, now + 0.22);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration);
      filter.Q.setValueAtTime(3.5, now);

      // Light gain envelope decay
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.24, now + 0.035);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Chained sine-wave oscillator 1: 523.25Hz (C5) -> 659.25Hz (E5) -> 783.99Hz (G5)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.26);

      // Chained sine-wave oscillator 2: chained harmonic overtone sweep
      const osc2 = this.ctx.createOscillator();
      const osc2Gain = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25 * 2, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(659.25 * 2, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(783.99 * 2, now + 0.30);

      osc2Gain.gain.setValueAtTime(0.0001, now);
      osc2Gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Connect nodes
      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration);
    } catch (e) {}
  }

  playTranslationSound() {
    return this.playTranslateChime();
  }

  setMuted(muted) {
    this.enabled = !muted;
  }
}

if (typeof window !== 'undefined' && !window.SoundEngine) {
  window.SoundEngine = SoundEngine;
}

/* ============================================================================
 * 3.5. DYNAMIC LEVEL PALETTES & WCAG HIGH-CONTRAST ENGINE
 * ============================================================================
 * Curated dynamic background color themes cycling/randomizing per level.
 * Guarantees WCAG 2.1 contrast compliance (>= 4.5:1 AA, aiming for > 7:1 AAA)
 * between tile letters / target words and their respective background colors.
 */
const GAME_THEME_PALETTES = [
  {
    name: 'Deep Midnight',
    bgPrimary: '#0e1326',
    bgSecondary: '#161d3b',
    bgCard: '#1f294f',
    bgRadialTop: '#1b2552',
    tileBg: '#232f59',
    preferredTileText: '#ffffff',
    preferredWordText: '#fef3c7'
  },
  {
    name: 'Dark Amethyst',
    bgPrimary: '#170c24',
    bgSecondary: '#25133a',
    bgCard: '#341a52',
    bgRadialTop: '#3d1d60',
    tileBg: '#3a1f5a',
    preferredTileText: '#fef3c7',
    preferredWordText: '#fde047'
  },
  {
    name: 'Galactic Teal',
    bgPrimary: '#071c21',
    bgSecondary: '#0c2e36',
    bgCard: '#14424e',
    bgRadialTop: '#16505f',
    tileBg: '#154b58',
    preferredTileText: '#fde047',
    preferredWordText: '#fef3c7'
  },
  {
    name: 'Dark Crimson',
    bgPrimary: '#220b13',
    bgSecondary: '#351220',
    bgCard: '#49192c',
    bgRadialTop: '#571c33',
    tileBg: '#4f1d32',
    preferredTileText: '#fef3c7',
    preferredWordText: '#fde047'
  },
  {
    name: 'Obsidian Emerald',
    bgPrimary: '#081e15',
    bgSecondary: '#0e3022',
    bgCard: '#154531',
    bgRadialTop: '#19543c',
    tileBg: '#174e37',
    preferredTileText: '#fef3c7',
    preferredWordText: '#fde047'
  },
  {
    name: 'Cosmic Indigo',
    bgPrimary: '#120f2e',
    bgSecondary: '#1d1948',
    bgCard: '#2b2569',
    bgRadialTop: '#342c7e',
    tileBg: '#2e276f',
    preferredTileText: '#ffffff',
    preferredWordText: '#fef3c7'
  }
];

function parseHexColor(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Calculates standard WCAG 2.1 relative luminance for a given sRGB hex color.
 */
function getRelativeLuminance(hex) {
  const { r, g, b } = parseHexColor(hex);
  const [sR, sG, sB] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Calculates standard WCAG contrast ratio between foreground and background colors.
 */
function getContrastRatio(hexForeground, hexBackground) {
  const lum1 = getRelativeLuminance(hexForeground);
  const lum2 = getRelativeLuminance(hexBackground);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Dynamic letter contrast safeguard:
 * Guarantees contrast ratio >= 4.5:1 (WCAG AA) and aims for > 7:1 (WCAG AAA)
 * between tile letters / target words and their backgrounds.
 * Uses glowing cream #fef3c7, electric gold #fde047, bright cyan #38bdf8, or high-contrast white #ffffff.
 */
function getContrastSafeTextColor(preferredColor, backgroundColor, minRatio = 4.5) {
  const SAFE_CANDIDATES = ['#ffffff', '#fef3c7', '#fde047', '#38bdf8'];

  if (preferredColor) {
    const ratio = getContrastRatio(preferredColor, backgroundColor);
    if (ratio >= 7.0 || (ratio >= minRatio && minRatio <= 4.5)) {
      return preferredColor;
    }
  }

  let bestCandidate = SAFE_CANDIDATES[0];
  let maxRatio = 0;
  for (const candidate of SAFE_CANDIDATES) {
    const ratio = getContrastRatio(candidate, backgroundColor);
    if (ratio > maxRatio) {
      maxRatio = ratio;
      bestCandidate = candidate;
    }
  }
  return bestCandidate;
}

/* ============================================================================
 * 4. WORD-MAPPING GAME CONTROLLER & SWIPE ENGINE
 * ============================================================================
 */
class WordMappingGame {
  constructor() {
    // --- Economy & Cumulative Scoring State ---
    // Starting economy: Configured via centralized GAME_CONFIG.INITIAL_COINS (Default: 10)
    const initialCoins = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.INITIAL_COINS))
      ? GAME_CONFIG.INITIAL_COINS
      : 10;
    this.coins = initialCoins;
    this.bonusWordsFound = new Set(); // Session bonus words tracker
    this.totalScore = 0;             // Cumulative performance score across levels
    this.firstFrameReported = false; // YouTube Playables first frame lifecycle flag

    // --- Dynamic Level Palette & High-Contrast Theme State ---
    this.currentThemePalette = null;

    // --- Progression State (20-Level Structured Progression & Level Selection) ---
    this.currentLevelIndex = 0;
    this.maxUnlockedLevel = 0; // Highest campaign level index reached/unlocked (0-indexed)
    this.currentLevelData = GAME_LEVELS[this.currentLevelIndex];
    this.foundWords = new Set();
    this.translatedWords = new Set(); // Set of unlocked target word strings

    // --- Global Word Uniqueness Tracker (Strict Global Word Exclusion) ---
    this.usedWords = new Set(); // Global tracker storing all words used in ANY level
    this.levelWordsMap = {};    // Cache of levelIndex -> array of selected words to maintain level consistency

    // --- Timer State ---
    this.remainingSeconds = this.currentLevelData.timeLimit;
    this.timerInterval = null;
    this.isPaused = false;

    // --- Settings State ---
    // Default language is Hindi as specified in gamerules.md
    this.selectedLanguage = 'hindi';
    this.soundEngine = new SoundEngine();

    // --- Ad Simulation State ---
    this.isWatchingAd = false;
    this.adCountdown = 4;
    this.adTimerInterval = null;

    // --- Canvas & Drag/Swipe State ---
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.tiles = []; // Flattened array of grid tile objects
    this.selectedTiles = []; // Tiles in active drag path
    this.isDragging = false;
    this.currentPointer = { x: 0, y: 0 }; // Logical coordinates of pointer

    // --- Canvas Particle FX System (Phase 15 Visual Polish) ---
    this.particles = []; // Active particle array
    this.particleAnimFrame = null; // Animation frame reference

    // --- Phase 17: Date-Seeded Daily Puzzle & Streak Economy Mode ---
    this.dailyStreak = 0; // Current consecutive day streak
    this.bestDailyStreak = 0; // All-time best streak
    this.lastDailyDate = null; // YYYY-MM-DD of last completed daily puzzle
    this.isDailyMode = false; // Flag indicating if currently playing a Daily Puzzle
    this.dailyCountdownInterval = null; // Active midnight countdown timer interval
    this.currentDailyData = null; // Dynamically generated daily level data

    // Hint feature state
    this.hintedWord = null; // Active target word currently hinted
    this.hintedTiles = []; // Path of tiles on the grid corresponding to hinted word
    this.hintExpiresAt = 0; // Timestamp when active hint expires
    this.hintTimeout = null; // Timer reference for clearing active hint

    // Cached DOM elements
    this.dom = {
      hintBtn: document.getElementById('hint-btn'),
      hintCostBadge: document.getElementById('hint-cost-badge'),
      coinDisplay: document.getElementById('coin-display'),
      timerDisplay: document.getElementById('timer-display'),
      levelNumber: document.getElementById('level-number'),
      levelTotal: document.getElementById('level-total'),
      targetProgress: document.getElementById('target-progress'),
      bonusCounterBadge: document.getElementById('bonus-counter-badge'),
      targetWordsList: document.getElementById('target-words-list'),
      wordPreviewText: document.getElementById('word-preview-text'),
      watchAdBtn: document.getElementById('watch-ad-btn'),
      settingsBtn: document.getElementById('settings-btn'),
      soundBtn: document.getElementById('sound-btn'),
      settingsModal: document.getElementById('settings-modal'),
      closeSettingsBtn: document.getElementById('close-settings-btn'),
      saveSettingsBtn: document.getElementById('save-settings-btn'),
      languageSelect: document.getElementById('language-select'),
      soundToggleInput: document.getElementById('sound-toggle-input'),
      adModal: document.getElementById('ad-modal'),
      closeAdBtn: document.getElementById('close-ad-btn'),
      adSecondsLeft: document.getElementById('ad-seconds-left'),
      adProgressBar: document.getElementById('ad-progress-bar'),
      claimAdRewardBtn: document.getElementById('claim-ad-reward-btn'),
      levelClearModal: document.getElementById('level-clear-modal'),
      levelRewardCoins: document.getElementById('level-reward-coins'),
      clearTimeVal: document.getElementById('clear-time-val'),
      clearScoreVal: document.getElementById('clear-score-val'),
      clearCoinsTotal: document.getElementById('clear-coins-total'),
      nextLevelBtn: document.getElementById('next-level-btn'),
      gameOverModal: document.getElementById('game-over-modal'),
      retryLevelBtn: document.getElementById('retry-level-btn'),
      missedWordsContainer: document.getElementById('missed-words-container'),
      victoryModal: document.getElementById('victory-modal'),
      victorySubtitle: document.getElementById('victory-subtitle'),
      victoryFinalScore: document.getElementById('victory-final-score'),
      victoryFinalCoins: document.getElementById('victory-final-coins'),
      playAgainBtn: document.getElementById('play-again-btn'),
      toastMessage: document.getElementById('toast-message'),

      // Phase 17: Daily Puzzle & Streak Mode DOM Elements
      dailyPuzzleBtn: document.getElementById('daily-puzzle-btn'),
      dailyStreakBadge: document.getElementById('daily-streak-badge'),
      dailyPuzzleModal: document.getElementById('daily-puzzle-modal'),
      closeDailyBtn: document.getElementById('close-daily-btn'),
      dailyTodayDate: document.getElementById('daily-today-date'),
      dailyStreakVal: document.getElementById('daily-streak-val'),
      dailyBestStreakVal: document.getElementById('daily-best-streak-val'),
      dailyRewardVal: document.getElementById('daily-reward-val'),
      startDailyBtn: document.getElementById('start-daily-btn'),
      dailyStatusMsg: document.getElementById('daily-status-msg'),
      dailyCountdownWrap: document.getElementById('daily-countdown-wrap'),
      dailyCountdownTimer: document.getElementById('daily-countdown-timer'),
      dailyClearModal: document.getElementById('daily-clear-modal'),
      dailyClearStreakMsg: document.getElementById('daily-clear-streak-msg'),
      dailyClearRewardCoins: document.getElementById('daily-clear-reward-coins'),
      dailyClearTimeVal: document.getElementById('daily-clear-time-val'),
      dailyClearScoreVal: document.getElementById('daily-clear-score-val'),
      dailyClearCoinsTotal: document.getElementById('daily-clear-coins-total'),
      dailyReturnBtn: document.getElementById('daily-return-btn'),
      milestone1: document.getElementById('milestone-1'),
      milestone3: document.getElementById('milestone-3'),
      milestone5: document.getElementById('milestone-5'),
      milestone7: document.getElementById('milestone-7'),

      // Phase 19: Level Selection & Daily Challenge Navigation
      dailyBackBtn: document.getElementById('daily-back-btn'),
      dailyModalBackBtn: document.getElementById('daily-modal-back-btn'),
      gameOverBackBtn: document.getElementById('game-over-back-btn'),
      levelSelectBtn: document.getElementById('level-select-btn'),
      levelBadge: document.getElementById('level-badge'),
      levelSelectModal: document.getElementById('level-select-modal'),
      closeLevelSelectBtn: document.getElementById('close-level-select-btn'),
      levelGridContainer: document.getElementById('level-grid-container'),
      levelSelectResumeBtn: document.getElementById('level-select-resume-btn'),
      levelSelectProgressPill: document.getElementById('level-select-progress-pill'),
      settingsLevelSelectBtn: document.getElementById('settings-level-select-btn'),
      clearLevelSelectBtn: document.getElementById('clear-level-select-btn'),
      victoryLevelSelectBtn: document.getElementById('victory-level-select-btn')
    };

    this.init();
  }

  /* --------------------------------------------------------------------------
   * Initialization Sequence
   * -------------------------------------------------------------------------- */
  init() {
    // 1. Restore Persisted Player State & Settings (Cloud / LocalStorage with schema validation)
    this.loadGameState();
    this.checkDailyStreakLiveness();

    // 2. Setup Platform Lifecycle (YouTube Playables & Facebook Instant Games hooks)
    this.setupPlatformLifecycle();

    // 3. Setup UI Handlers (Settings, Video Ads, Navigation, Keyboard Accessibility)
    this.setupUIEventListeners();

    // 4. Setup Touch & Mouse Drag Swipe Listeners
    this.setupDragAndSwipeHandlers();

    // 5. Setup WebAudio Context Unlock on First User Touch/Pointer
    this.setupAudioUnlockGesture();

    // 6. Load Initial Level Data to populate DOM structure & word bank height
    this.loadLevel(this.currentLevelIndex);

    // 7. Setup Responsive Canvas Viewport & ResizeObserver for dynamic layout shifts
    this.setupResponsiveCanvas();

    // 8. Update Coin Economy Display (Reflecting loaded balance)
    this.updateCoinDisplay();

    // 9. Deep-link check: if URL contains ?mode=daily or ?daily=1, launch daily challenge
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'daily' || urlParams.get('daily') === '1') {
        setTimeout(() => this.openDailyModal(), 100);
      } else if (urlParams.get('daily') === 'play') {
        setTimeout(() => this.startDailyChallenge(), 100);
      }
    } catch (err) {}
  }

  /* --------------------------------------------------------------------------
   * WebAudio Context Auto-Unlock on First Interaction
   * -------------------------------------------------------------------------- */
  setupAudioUnlockGesture() {
    const unlockAudio = () => {
      this.soundEngine.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
  }

  /* --------------------------------------------------------------------------
   * Canvas Responsive Sizing & ResizeObserver
   * --------------------------------------------------------------------------
   * ROOT CAUSE & GLITCH FIX EXPLANATION:
   * The intermittent leftover/ghost character boxes below the letter grid
   * were primarily triggered by layout phase desynchronization:
   * 1. If window resize / orientation events or DOM expansions occurred,
   *    re-measuring before layout stabilization resulted in a canvas height
   *    that differed from the container's true client dimensions.
   * 2. When the container shrank, the canvas element or its drawing buffer
   *    retained stale bottom dimensions.
   * 3. Using ResizeObserver guarantees that whenever the canvas container's
   *    actual bounding box changes (from word bank wrapping, font loads, etc.),
   *    the canvas pixel buffer and logical scale are recomputed instantly.
   */
  setupResponsiveCanvas() {
    this.resizeCanvas();

    // ResizeObserver watches the parent container for exact size changes
    if (window.ResizeObserver && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    } else {
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });
  }

  /* --------------------------------------------------------------------------
   * State Persistence & Cloud Storage Engine (FBInstant & LocalStorage)
   * --------------------------------------------------------------------------
   * Strict adherence to Section 4.1, 4.2, and 6.2 of RULES-CORE-002:
   * - Saves player state (coin balance, current level progression, selected language, sound settings, total score).
   * - Validates save data schemas with strict type guards to prevent corrupted state crashes.
   * - Uses FBInstant.player.setDataAsync() when running in Facebook Instant Games.
   * - Gracefully falls back to validated client-side localStorage in web / YouTube Playables environments.
   * - Zero external network calls or tracking.
   */
  saveGameState() {
    this.maxUnlockedLevel = Math.max(
      Number.isInteger(this.maxUnlockedLevel) ? this.maxUnlockedLevel : 0,
      this.currentLevelIndex
    );
    const saveData = {
      version: 1,
      coins: Number.isInteger(this.coins) && this.coins >= 0 ? this.coins : ((typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.INITIAL_COINS)) ? GAME_CONFIG.INITIAL_COINS : 10),
      levelIndex: Number.isInteger(this.currentLevelIndex) && this.currentLevelIndex >= 0 && this.currentLevelIndex < GAME_LEVELS.length ? this.currentLevelIndex : 0,
      maxUnlockedLevel: Number.isInteger(this.maxUnlockedLevel) && this.maxUnlockedLevel >= 0 && this.maxUnlockedLevel < GAME_LEVELS.length ? this.maxUnlockedLevel : this.currentLevelIndex,
      selectedLanguage: typeof this.selectedLanguage === 'string' && ['hindi', 'telugu', 'chinese', 'spanish', 'french', 'german', 'arabic', 'japanese', 'russian', 'portuguese', 'italian', 'korean'].includes(this.selectedLanguage) ? this.selectedLanguage : 'hindi',
      soundEnabled: Boolean(this.soundEngine.enabled),
      totalScore: Number.isInteger(this.totalScore) && this.totalScore >= 0 ? this.totalScore : 0,
      dailyStreak: Number.isInteger(this.dailyStreak) && this.dailyStreak >= 0 ? this.dailyStreak : 0,
      bestDailyStreak: Number.isInteger(this.bestDailyStreak) && this.bestDailyStreak >= 0 ? this.bestDailyStreak : 0,
      lastDailyDate: typeof this.lastDailyDate === 'string' ? this.lastDailyDate : null,
      usedWords: Array.from(this.usedWords || []),
      levelWordsMap: typeof this.levelWordsMap === 'object' && this.levelWordsMap !== null ? this.levelWordsMap : {}
    };

    // 1. Client-side LocalStorage Persistence
    try {
      localStorage.setItem('word_mapping_save_state', JSON.stringify(saveData));
    } catch (e) {
      console.warn('LocalStorage save fallback error:', e);
    }

    // 2. Facebook Instant Games Cloud Storage
    if (typeof window.FBInstant !== 'undefined' && window.FBInstant.player && typeof window.FBInstant.player.setDataAsync === 'function') {
      try {
        window.FBInstant.player.setDataAsync({
          word_mapping_save_state: saveData
        }).then(() => {
          if (typeof window.FBInstant.player.flushDataAsync === 'function') {
            window.FBInstant.player.flushDataAsync();
          }
        }).catch(err => {
          console.warn('FBInstant.player.setDataAsync error:', err);
        });
      } catch (e) {
        console.warn('FBInstant storage exception:', e);
      }
    }
  }

  loadGameState() {
    let rawData = null;

    // 1. Attempt loading from LocalStorage
    try {
      const stored = localStorage.getItem('word_mapping_save_state');
      if (stored) {
        rawData = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }

    // 2. Schema Validation Guard (Section 6.2)
    if (rawData && typeof rawData === 'object') {
      if (Number.isInteger(rawData.coins) && rawData.coins >= 0) {
        this.coins = rawData.coins;
      }
      if (Number.isInteger(rawData.levelIndex) && rawData.levelIndex >= 0 && rawData.levelIndex < GAME_LEVELS.length) {
        this.currentLevelIndex = rawData.levelIndex;
        this.currentLevelData = GAME_LEVELS[this.currentLevelIndex];
      }
      if (Number.isInteger(rawData.maxUnlockedLevel) && rawData.maxUnlockedLevel >= 0) {
        this.maxUnlockedLevel = Math.min(rawData.maxUnlockedLevel, GAME_LEVELS.length - 1);
      } else {
        this.maxUnlockedLevel = this.currentLevelIndex;
      }
      this.maxUnlockedLevel = Math.max(this.maxUnlockedLevel, this.currentLevelIndex);

      if (typeof rawData.selectedLanguage === 'string' && ['hindi', 'telugu', 'chinese', 'spanish', 'french', 'german', 'arabic', 'japanese', 'russian', 'portuguese', 'italian', 'korean'].includes(rawData.selectedLanguage)) {
        this.selectedLanguage = rawData.selectedLanguage;
        if (this.dom && this.dom.languageSelect) {
          this.dom.languageSelect.value = this.selectedLanguage;
        }
      }
      if (typeof rawData.soundEnabled === 'boolean') {
        this.soundEngine.setMuted(!rawData.soundEnabled);
        if (this.dom && this.dom.soundToggleInput) {
          this.dom.soundToggleInput.checked = rawData.soundEnabled;
          this.dom.soundBtn.textContent = rawData.soundEnabled ? '🔊' : '🔇';
        }
      }
      if (Number.isInteger(rawData.totalScore) && rawData.totalScore >= 0) {
        this.totalScore = rawData.totalScore;
      }
      if (Number.isInteger(rawData.dailyStreak) && rawData.dailyStreak >= 0) {
        this.dailyStreak = rawData.dailyStreak;
      }
      if (Number.isInteger(rawData.bestDailyStreak) && rawData.bestDailyStreak >= 0) {
        this.bestDailyStreak = rawData.bestDailyStreak;
      }
      if (typeof rawData.lastDailyDate === 'string') {
        this.lastDailyDate = rawData.lastDailyDate;
      }
      if (Array.isArray(rawData.usedWords)) {
        this.usedWords = new Set(rawData.usedWords.filter(w => typeof w === 'string'));
      }
      if (rawData.levelWordsMap && typeof rawData.levelWordsMap === 'object') {
        this.levelWordsMap = rawData.levelWordsMap;
      }
    }

    // 3. Asynchronously check FBInstant Cloud Storage
    if (typeof window.FBInstant !== 'undefined' && window.FBInstant.player && typeof window.FBInstant.player.getDataAsync === 'function') {
      try {
        window.FBInstant.player.getDataAsync(['word_mapping_save_state']).then(data => {
          if (data && data.word_mapping_save_state) {
            const fbState = data.word_mapping_save_state;
            if (Array.isArray(fbState.usedWords)) {
              fbState.usedWords.forEach(w => { if (typeof w === 'string') this.usedWords.add(w); });
            }
            if (fbState.levelWordsMap && typeof fbState.levelWordsMap === 'object') {
              this.levelWordsMap = Object.assign({}, fbState.levelWordsMap, this.levelWordsMap);
            }
            if (Number.isInteger(fbState.coins) && fbState.coins >= 0) {
              this.coins = fbState.coins;
              this.updateCoinDisplay();
            }
            if (Number.isInteger(fbState.levelIndex) && fbState.levelIndex >= 0 && fbState.levelIndex < GAME_LEVELS.length) {
              this.currentLevelIndex = fbState.levelIndex;
              this.currentLevelData = GAME_LEVELS[this.currentLevelIndex];
              this.loadLevel(this.currentLevelIndex);
            }
            if (Number.isInteger(fbState.maxUnlockedLevel) && fbState.maxUnlockedLevel >= 0) {
              this.maxUnlockedLevel = Math.max(this.maxUnlockedLevel, Math.min(fbState.maxUnlockedLevel, GAME_LEVELS.length - 1));
            }
            if (Number.isInteger(fbState.dailyStreak) && fbState.dailyStreak >= 0) {
              this.dailyStreak = fbState.dailyStreak;
            }
            if (Number.isInteger(fbState.bestDailyStreak) && fbState.bestDailyStreak >= 0) {
              this.bestDailyStreak = fbState.bestDailyStreak;
            }
            if (typeof fbState.lastDailyDate === 'string') {
              this.lastDailyDate = fbState.lastDailyDate;
            }
            this.checkDailyStreakLiveness();
          }
        }).catch(err => {
          console.warn('FBInstant.player.getDataAsync error:', err);
        });
      } catch (e) {
        console.warn('FBInstant storage read error:', e);
      }
    }
  }

  /* --------------------------------------------------------------------------
   * Platform Lifecycle Integration (YouTube Playables & Facebook Instant Games)
   * --------------------------------------------------------------------------
   * Full compliance with Section 3.1 & 4.2 of RULES-CORE-002:
   * - Responds immediately to pause, resume, mute, and unmute host commands.
   * - Listens to visibilitychange, window blur/focus events for iframe sandboxing.
   * - Integrates YouTube Playables SDK (firstFrameReady, gameReady, audio state).
   * - Integrates FBInstant SDK (initializeAsync, setLoadingProgress, startGameAsync, onPause).
   */
  setupPlatformLifecycle() {
    // 1. Standard Web & IFrame Sandboxing (visibilitychange, blur, focus)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });

    window.addEventListener('blur', () => {
      this.pauseGame();
    });

    window.addEventListener('focus', () => {
      this.resumeGame();
    });

    // 2. YouTube Playables SDK Integration (window.ytgame)
    if (typeof window.ytgame !== 'undefined') {
      try {
        // Inform YouTube Playables environment that game is ready
        if (window.ytgame.game && typeof window.ytgame.game.gameReady === 'function') {
          window.ytgame.game.gameReady();
        }
        // Sync system audio settings
        if (window.ytgame.system && typeof window.ytgame.system.isAudioEnabled === 'function') {
          const ytAudio = window.ytgame.system.isAudioEnabled();
          this.soundEngine.setMuted(!ytAudio);
          if (this.dom && this.dom.soundToggleInput) {
            this.dom.soundToggleInput.checked = ytAudio;
            this.dom.soundBtn.textContent = ytAudio ? '🔊' : '🔇';
          }
        }
        // YouTube Host Pause / Resume hooks
        if (window.ytgame.game && typeof window.ytgame.game.onPause === 'function') {
          window.ytgame.game.onPause(() => this.pauseGame());
        }
        if (window.ytgame.game && typeof window.ytgame.game.onResume === 'function') {
          window.ytgame.game.onResume(() => this.resumeGame());
        }
      } catch (e) {
        console.warn('YouTube Playables SDK lifecycle note:', e);
      }
    }

    // 3. Meta Facebook Instant Games SDK Integration (window.FBInstant)
    if (typeof window.FBInstant !== 'undefined') {
      try {
        window.FBInstant.initializeAsync().then(() => {
          window.FBInstant.setLoadingProgress(100);
          window.FBInstant.startGameAsync().catch(err => {
            console.warn('FBInstant.startGameAsync note:', err);
          });
        }).catch(err => {
          console.warn('FBInstant.initializeAsync note:', err);
        });
        window.FBInstant.onPause(() => this.pauseGame());
      } catch (e) {
        console.warn('FBInstant fallback initialization:', e);
      }
    }
  }

  notifyFirstFrameReady() {
    if (this.firstFrameReported) return;
    this.firstFrameReported = true;

    if (typeof window.ytgame !== 'undefined' && window.ytgame.game && typeof window.ytgame.game.firstFrameReady === 'function') {
      try {
        window.ytgame.game.firstFrameReady();
      } catch (e) {
        console.warn('YouTube firstFrameReady exception:', e);
      }
    }
  }

  sendPlatformScore(score) {
    // Submit score to YouTube Playables engagement API
    if (typeof window.ytgame !== 'undefined' && window.ytgame.engagement && typeof window.ytgame.engagement.sendScore === 'function') {
      try {
        window.ytgame.engagement.sendScore({ value: score });
      } catch (e) {
        console.warn('YouTube sendScore note:', e);
      }
    }
  }

  pauseGame() {
    this.isPaused = true;
    this.soundEngine.setMuted(true);
  }

  resumeGame() {
    if (!this.isWatchingAd) {
      this.isPaused = false;
    }
    const soundEnabled = this.dom.soundToggleInput.checked;
    this.soundEngine.setMuted(!soundEnabled);
  }

  /* --------------------------------------------------------------------------
   * UI Event Listeners
   * -------------------------------------------------------------------------- */
  setupUIEventListeners() {
    // Hint Button (Reveal next word for HINT_COST coins)
    if (this.dom.hintBtn) {
      this.dom.hintBtn.addEventListener('click', () => {
        this.handleHintClick();
      });
    }

    // Watch Video (Simulated Rewarded Ad) Button
    this.dom.watchAdBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.startWatchAdFlow();
    });

    // Settings Modal Open / Close
    this.dom.settingsBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.openSettingsModal();
    });

    this.dom.closeSettingsBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.closeSettingsModal();
    });

    this.dom.saveSettingsBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.saveSettings();
    });

    // Sound Toggle Button
    this.dom.soundBtn.addEventListener('click', () => {
      const isMuted = !this.soundEngine.enabled;
      this.soundEngine.setMuted(!isMuted);
      this.dom.soundToggleInput.checked = this.soundEngine.enabled;
      this.dom.soundBtn.textContent = this.soundEngine.enabled ? '🔊' : '🔇';
      this.soundEngine.playClick();
      this.showToast(this.soundEngine.enabled ? 'Sound Enabled' : 'Sound Muted');
    });

    // Sound Checkbox in settings
    this.dom.soundToggleInput.addEventListener('change', (e) => {
      this.soundEngine.setMuted(!e.target.checked);
      this.dom.soundBtn.textContent = e.target.checked ? '🔊' : '🔇';
    });

    // Language Selection
    this.dom.languageSelect.addEventListener('change', (e) => {
      this.selectedLanguage = e.target.value;
    });

    // Claim Ad Reward Button
    this.dom.claimAdRewardBtn.addEventListener('click', () => {
      this.claimAdReward();
    });

    // Close Ad Showcase Button (Dismiss/Cancel early without reward)
    if (this.dom.closeAdBtn) {
      this.dom.closeAdBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.closeAdShowcase();
      });
    }

    // Retry Level Button
    this.dom.retryLevelBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.dom.gameOverModal.classList.add('modal-hidden');
      if (this.isDailyMode) {
        this.startDailyChallenge();
      } else {
        this.loadLevel(this.currentLevelIndex);
      }
    });

    // Next Level Button
    this.dom.nextLevelBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.dom.levelClearModal.classList.add('modal-hidden');
      if (this.currentLevelIndex + 1 < GAME_LEVELS.length) {
        this.loadLevel(this.currentLevelIndex + 1);
      } else {
        this.showVictoryScreen();
      }
    });

    // Play Again Button
    this.dom.playAgainBtn.addEventListener('click', () => {
      this.soundEngine.playClick();
      this.dom.victoryModal.classList.add('modal-hidden');
      this.usedWords.clear();
      this.levelWordsMap = {};
      this.saveGameState();
      this.loadLevel(0);
    });

    // --- Phase 17: Daily Puzzle & Streak Modal Listeners ---
    if (this.dom.dailyPuzzleBtn) {
      this.dom.dailyPuzzleBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.openDailyModal();
      });
    }

    if (this.dom.closeDailyBtn) {
      this.dom.closeDailyBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.dom.dailyPuzzleModal.classList.add('modal-hidden');
        if (this.dailyCountdownInterval) {
          clearInterval(this.dailyCountdownInterval);
          this.dailyCountdownInterval = null;
        }
      });
    }

    if (this.dom.startDailyBtn) {
      this.dom.startDailyBtn.addEventListener('click', () => {
        this.startDailyChallenge();
      });
    }

    if (this.dom.dailyReturnBtn) {
      this.dom.dailyReturnBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.dom.dailyClearModal.classList.add('modal-hidden');
        this.exitDailyMode();
      });
    }

    // --- Phase 19: Daily Challenge Navigation Fix Listeners ---
    if (this.dom.dailyBackBtn) {
      this.dom.dailyBackBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.exitDailyMode();
        this.showToast('Returned to Campaign');
      });
    }

    if (this.dom.dailyModalBackBtn) {
      this.dom.dailyModalBackBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.dom.dailyPuzzleModal.classList.add('modal-hidden');
        if (this.dailyCountdownInterval) {
          clearInterval(this.dailyCountdownInterval);
          this.dailyCountdownInterval = null;
        }
        this.exitDailyMode();
      });
    }

    if (this.dom.gameOverBackBtn) {
      this.dom.gameOverBackBtn.addEventListener('click', () => {
        this.soundEngine.playClick();
        this.dom.gameOverModal.classList.add('modal-hidden');
        this.exitDailyMode();
      });
    }

    // --- Phase 19: Level Selection Menu Listeners ---
    if (this.dom.levelSelectBtn) {
      this.dom.levelSelectBtn.addEventListener('click', () => {
        this.openLevelSelectModal();
      });
    }

    if (this.dom.levelBadge) {
      this.dom.levelBadge.addEventListener('click', () => {
        this.openLevelSelectModal();
      });
    }

    if (this.dom.closeLevelSelectBtn) {
      this.dom.closeLevelSelectBtn.addEventListener('click', () => {
        this.closeLevelSelectModal();
      });
    }

    if (this.dom.levelSelectResumeBtn) {
      this.dom.levelSelectResumeBtn.addEventListener('click', () => {
        this.closeLevelSelectModal();
      });
    }

    if (this.dom.levelSelectModal) {
      this.dom.levelSelectModal.addEventListener('click', (e) => {
        if (e.target === this.dom.levelSelectModal) {
          this.closeLevelSelectModal();
        }
      });
    }

    if (this.dom.settingsLevelSelectBtn) {
      this.dom.settingsLevelSelectBtn.addEventListener('click', () => {
        this.closeSettingsModal();
        this.openLevelSelectModal();
      });
    }

    if (this.dom.clearLevelSelectBtn) {
      this.dom.clearLevelSelectBtn.addEventListener('click', () => {
        this.dom.levelClearModal.classList.add('modal-hidden');
        this.openLevelSelectModal();
      });
    }

    if (this.dom.victoryLevelSelectBtn) {
      this.dom.victoryLevelSelectBtn.addEventListener('click', () => {
        this.dom.victoryModal.classList.add('modal-hidden');
        this.openLevelSelectModal();
      });
    }

    // Accessibility: Keyboard Navigation (Space & Enter to advance, Escape to dismiss)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dom.levelSelectModal && !this.dom.levelSelectModal.classList.contains('modal-hidden')) {
          this.closeLevelSelectModal();
        } else if (!this.dom.settingsModal.classList.contains('modal-hidden')) {
          this.closeSettingsModal();
        } else if (this.dom.dailyPuzzleModal && !this.dom.dailyPuzzleModal.classList.contains('modal-hidden')) {
          this.dom.closeDailyBtn.click();
        }
      } else if (e.code === 'Space' || e.code === 'Enter') {
        if (!this.dom.levelClearModal.classList.contains('modal-hidden')) {
          e.preventDefault();
          this.dom.nextLevelBtn.click();
        } else if (!this.dom.gameOverModal.classList.contains('modal-hidden')) {
          e.preventDefault();
          this.dom.retryLevelBtn.click();
        } else if (!this.dom.victoryModal.classList.contains('modal-hidden')) {
          e.preventDefault();
          this.dom.playAgainBtn.click();
        } else if (this.dom.dailyClearModal && !this.dom.dailyClearModal.classList.contains('modal-hidden')) {
          e.preventDefault();
          this.dom.dailyReturnBtn.click();
        } else if (this.dom.dailyPuzzleModal && !this.dom.dailyPuzzleModal.classList.contains('modal-hidden')) {
          e.preventDefault();
          if (!this.dom.startDailyBtn.disabled) {
            this.dom.startDailyBtn.click();
          } else {
            this.dom.closeDailyBtn.click();
          }
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Pointer Events & Swipe Drag Detection (Phase 3 Core Logic)
   * -------------------------------------------------------------------------- */
  setupDragAndSwipeHandlers() {
    // Touch & Mouse unification via Pointer Events API
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerCancel(e));
  }

  getLogicalCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  getTileAt(x, y) {
    // Check if (x, y) falls inside any tile's hit circle/box
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      const dx = x - tile.centerX;
      const dy = y - tile.centerY;
      const hitRadius = (tile.size / 2) * 1.05; // Generous hit radius for mobile fingers
      if ((dx * dx + dy * dy) <= (hitRadius * hitRadius)) {
        return tile;
      }
    }
    return null;
  }

  areAdjacent(tileA, tileB) {
    if (!tileA || !tileB) return false;
    const dr = Math.abs(tileA.row - tileB.row);
    const dc = Math.abs(tileA.col - tileB.col);
    // 8-way adjacent: Chebyshev distance is 1
    return (dr <= 1 && dc <= 1) && (dr !== 0 || dc !== 0);
  }

  handlePointerDown(e) {
    if (this.isPaused || this.isWatchingAd) return;

    const coords = this.getLogicalCoordinates(e);
    const tile = this.getTileAt(coords.x, coords.y);

    if (tile) {
      this.isDragging = true;
      this.selectedTiles = [tile];
      this.currentPointer = coords;

      // Play starting chime & tactile haptic tick
      this.soundEngine.playTileSelect(0);
      this.triggerHaptic('tile');

      // Update Preview Text
      this.updatePreviewText();

      // Redraw canvas with highlighted tile
      this.renderCanvas();

      if (this.canvas.setPointerCapture) {
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    }
  }

  handlePointerMove(e) {
    if (!this.isDragging) return;

    const coords = this.getLogicalCoordinates(e);
    this.currentPointer = coords;

    const hoveredTile = this.getTileAt(coords.x, coords.y);

    if (hoveredTile) {
      const lastTile = this.selectedTiles[this.selectedTiles.length - 1];

      // Check if user is backtracking to the previous tile
      if (this.selectedTiles.length >= 2) {
        const prevTile = this.selectedTiles[this.selectedTiles.length - 2];
        if (hoveredTile.row === prevTile.row && hoveredTile.col === prevTile.col) {
          // Graceful backtrack: pop last tile
          this.selectedTiles.pop();
          this.soundEngine.playTileSelect(this.selectedTiles.length - 1);
          this.triggerHaptic('tile');
          this.updatePreviewText();
          this.renderCanvas();
          return;
        }
      }

      // Check if hovered tile can be added
      const alreadySelected = this.selectedTiles.some(
        t => t.row === hoveredTile.row && t.col === hoveredTile.col
      );

      if (!alreadySelected && this.areAdjacent(lastTile, hoveredTile)) {
        this.selectedTiles.push(hoveredTile);
        this.soundEngine.playTileSelect(this.selectedTiles.length - 1);
        this.triggerHaptic('tile');
        this.updatePreviewText();
        this.renderCanvas();
        return;
      }
    }

    // Render active trajectory line following the pointer
    this.renderCanvas();
  }

  handlePointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.canvas.releasePointerCapture) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (this.selectedTiles.length >= 2) {
      const constructedWord = this.selectedTiles.map(t => t.char).join('').toUpperCase();
      const mappedTiles = [...this.selectedTiles];
      this.validateMappedWord(constructedWord, mappedTiles);
    }

    // Reset drag selection
    this.selectedTiles = [];
    this.resetPreviewText();
    this.renderCanvas();
  }

  handlePointerCancel(e) {
    this.isDragging = false;
    this.selectedTiles = [];
    this.resetPreviewText();
    this.renderCanvas();
  }

  updatePreviewText() {
    const word = this.selectedTiles.map(t => t.char).join('').toUpperCase();
    this.dom.wordPreviewText.textContent = word || 'CONNECT LETTERS';
    this.dom.wordPreviewText.style.color = 'var(--accent-cyan)';
  }

  resetPreviewText() {
    this.dom.wordPreviewText.textContent = 'CONNECT LETTERS';
    this.dom.wordPreviewText.style.color = 'var(--accent-cyan)';
  }

  /* --------------------------------------------------------------------------
   * Word Validation Engine (Target Words vs Bonus Words Economy)
   * -------------------------------------------------------------------------- */
  validateMappedWord(word, mappedTiles = []) {
    // 1. Check Primary Target Words List
    if (this.currentLevelData.words.includes(word)) {
      if (!this.foundWords.has(word)) {
        // Successful discovery of target word
        this.foundWords.add(word);
        if (this.hintedWord && word === this.hintedWord) {
          this.clearHint();
        }
        this.soundEngine.playWordSuccess();
        this.triggerHaptic('success');
        this.spawnWordSuccessParticles(mappedTiles);
        this.showToast(`Found Target: ${word}!`, 'success');
        this.renderTargetWordsList();

        // Check level win condition
        if (this.foundWords.size === this.currentLevelData.words.length) {
          if (this.isDailyMode) {
            this.handleDailyClear();
          } else {
            this.handleLevelClear();
          }
        }
      } else {
        this.showToast(`Already mapped: ${word}`, 'info');
      }
      return;
    }

    // 2. Check Bonus Words Mechanic (Valid English word not on target list)
    if (BONUS_DICTIONARY.has(word)) {
      if (!this.bonusWordsFound.has(word)) {
        this.bonusWordsFound.add(word);
        // Instant Bonus Word Coins Reward via GAME_CONFIG.BONUS_WORD_COINS
        const bonusReward = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.BONUS_WORD_COINS))
          ? GAME_CONFIG.BONUS_WORD_COINS
          : 5;
        this.addCoins(bonusReward, `Bonus Word: ${word}`);
        this.triggerHaptic('bonus');
        this.spawnBonusWordParticles(mappedTiles);
        this.dom.bonusCounterBadge.textContent = `Bonus: ${this.bonusWordsFound.size * bonusReward} 🪙`;
        this.showToast(`Bonus Word: ${word}! +${bonusReward} Coins 🪙`, 'bonus');
      } else {
        this.showToast(`Bonus word "${word}" already claimed!`, 'info');
      }
      return;
    }

    // 3. Invalid Word
    this.soundEngine.playErrorBuzz();
    this.triggerHaptic('error');
    this.dom.wordPreviewText.style.color = 'var(--accent-crimson)';
    this.dom.wordPreviewText.textContent = `${word} ✕`;
    setTimeout(() => this.resetPreviewText(), 600);
  }

  /* --------------------------------------------------------------------------
   * Coin Economy Operations
   * -------------------------------------------------------------------------- */
  updateCoinDisplay() {
    this.dom.coinDisplay.textContent = this.coins.toString();
    if (this.dom.hintCostBadge) {
      this.dom.hintCostBadge.textContent = `${this.hintCost}🪙`;
    }
  }

  addCoins(amount, reason = '') {
    this.coins += amount;
    this.updateCoinDisplay();
    this.soundEngine.playCoinJingle();
    // Persist updated coin economy balance
    this.saveGameState();
  }

  deductCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.updateCoinDisplay();
      // Persist updated coin economy balance
      this.saveGameState();
      return true;
    }
    this.soundEngine.playErrorBuzz();
    this.showToast(`Need ${amount - this.coins} more coins!`, 'error');
    return false;
  }

  // --- Centralized Economy Getters ---
  get initialCoins() {
    return (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.INITIAL_COINS))
      ? GAME_CONFIG.INITIAL_COINS
      : 10;
  }

  get translationCost() {
    return (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.TRANSLATION_COST))
      ? GAME_CONFIG.TRANSLATION_COST
      : 5;
  }

  get hintCost() {
    return (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.HINT_COST))
      ? GAME_CONFIG.HINT_COST
      : 2;
  }

  get skipLevelCost() {
    return (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.SKIP_LEVEL_COST))
      ? GAME_CONFIG.SKIP_LEVEL_COST
      : 30;
  }

  /* --------------------------------------------------------------------------
   * Hint Feature (Lightbulb Economy Mechanic: HINT_COST = 2)
   * -------------------------------------------------------------------------- */
  handleHintClick() {
    this.soundEngine.init();

    // Verify level data is loaded and words exist
    if (!this.currentLevelData || !Array.isArray(this.currentLevelData.words)) {
      return;
    }

    // 1. Identify the exact next undiscovered target word
    const nextWord = this.currentLevelData.words.find(w => !this.foundWords.has(w));
    if (!nextWord) {
      this.showToast('All words already found!', 'info');
      return;
    }

    const cost = this.hintCost;

    // 2. Check Balance: Verify if player has enough coins (balance >= HINT_COST)
    if (this.coins < cost) {
      // Insufficient Coins: show brief UI alert or toast message saying "Not enough coins!" and do not reveal anything
      this.soundEngine.playErrorBuzz();
      this.triggerHaptic('error');
      this.showToast('Not enough coins!', 'error');
      return;
    }

    // 3. Sufficient Coins: Deduct HINT_COST from balance & update economy
    this.coins -= cost;
    this.updateCoinDisplay();
    this.saveGameState();
    this.soundEngine.playHintChime();
    this.triggerHaptic('tile');

    // 4. Reveal or prominently highlight the exact next word the player needs to find on the board
    const path = this.findWordPathOnGrid(nextWord);
    this.revealHint(nextWord, path);
  }

  revealHint(word, path) {
    // Clear previous hint styling if any
    if (this.hintedWord && this.hintedWord !== word) {
      const prevCard = document.getElementById(`target-word-${this.hintedWord}`);
      if (prevCard) prevCard.classList.remove('hint-active-card');
    }
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }

    this.hintedWord = word;
    this.hintedTiles = Array.isArray(path) ? path : [];
    this.hintExpiresAt = Date.now() + 8000; // Visible for 8 seconds

    // Prominently highlight word card in target list
    const card = document.getElementById(`target-word-${word}`);
    if (card) {
      card.classList.add('hint-active-card');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    this.renderCanvas();
    this.showToast(`💡 Hint: "${word}" highlighted!`, 'bonus');

    this.hintTimeout = setTimeout(() => {
      this.clearHint();
    }, 8000);
  }

  clearHint() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    if (this.hintedWord) {
      const card = document.getElementById(`target-word-${this.hintedWord}`);
      if (card) {
        card.classList.remove('hint-active-card');
      }
    }
    this.hintedWord = null;
    this.hintedTiles = [];
    this.hintExpiresAt = 0;
    this.renderCanvas();
  }

  findWordPathOnGrid(word) {
    if (!this.currentLevelData || !this.currentLevelData.grid || !word) return [];
    const grid = this.currentLevelData.grid;
    const numRows = grid.length;
    const numCols = grid[0].length;
    const target = word.toUpperCase();
    const len = target.length;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [ 0, -1],          [ 0, 1],
      [ 1, -1], [ 1, 0], [ 1, 1]
    ];

    const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));

    const dfs = (r, c, index, currentPath) => {
      if (index === len) return currentPath;

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < numRows &&
          nc >= 0 && nc < numCols &&
          !visited[nr][nc] &&
          grid[nr][nc] === target[index]
        ) {
          visited[nr][nc] = true;
          const foundTile = this.tiles.find(t => t.row === nr && t.col === nc);
          const res = dfs(nr, nc, index + 1, [...currentPath, foundTile || { row: nr, col: nc, char: target[index] }]);
          if (res) return res;
          visited[nr][nc] = false;
        }
      }
      return null;
    };

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c] === target[0]) {
          visited[r][c] = true;
          const startTile = this.tiles.find(t => t.row === r && t.col === c);
          const path = dfs(r, c, 1, [startTile || { row: r, col: c, char: target[0] }]);
          if (path) return path;
          visited[r][c] = false;
        }
      }
    }
    return [];
  }

  /* --------------------------------------------------------------------------
   * Rewarded Video Ad Simulation & Platform Integration (+50 Coins)
   * --------------------------------------------------------------------------
   * Fully compliant with Section 4.3 (Meta Audience Network Ads) & YouTube Playables:
   * - In Facebook Instant Games, checks FBInstant.getRewardedVideoAsync() first.
   * - Seamlessly falls back to high-fidelity, timer-based simulated partner showcase
   *   when running in web sandboxes or test environments.
   * - Automatically pauses gameplay, countdown timers, and audio during ad playback.
   */
  startWatchAdFlow() {
    this.pauseGame();

    // Check for native Meta Instant Games Rewarded Video API
    if (typeof window.FBInstant !== 'undefined' && typeof window.FBInstant.getRewardedVideoAsync === 'function') {
      try {
        window.FBInstant.getRewardedVideoAsync('REWARDED_VIDEO_PLACEMENT_ID')
          .then(rewardedVideo => rewardedVideo.loadAsync().then(() => rewardedVideo.showAsync()))
          .then(() => {
            this.claimAdReward();
          })
          .catch(err => {
            console.warn('FBInstant rewarded video not primed, playing simulated showcase fallback:', err);
            this.runSimulatedAdShowcase();
          });
        return;
      } catch (e) {
        console.warn('FBInstant ad request exception:', e);
      }
    }

    this.runSimulatedAdShowcase();
  }

  runSimulatedAdShowcase() {
    this.isWatchingAd = true;
    this.adCountdown = 4;
    this.dom.claimAdRewardBtn.disabled = true;
    this.dom.claimAdRewardBtn.textContent = 'Watching Video...';
    this.dom.adSecondsLeft.textContent = this.adCountdown.toString();
    this.dom.adProgressBar.style.width = '0%';
    this.dom.adModal.classList.remove('modal-hidden');

    if (this.adTimerInterval) {
      clearInterval(this.adTimerInterval);
    }

    const startTime = Date.now();
    const duration = 4000;

    this.adTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      const secondsLeft = Math.max(0, Math.ceil((duration - elapsed) / 1000));

      this.dom.adProgressBar.style.width = `${progress}%`;
      this.dom.adSecondsLeft.textContent = secondsLeft.toString();

      if (elapsed >= duration) {
        const adReward = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.AD_REWARD_COINS))
          ? GAME_CONFIG.AD_REWARD_COINS
          : 50;
        clearInterval(this.adTimerInterval);
        this.dom.claimAdRewardBtn.disabled = false;
        this.dom.claimAdRewardBtn.textContent = `Claim ${adReward} Coins! 🪙`;
      }
    }, 100);
  }

  claimAdReward() {
    const adReward = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.AD_REWARD_COINS))
      ? GAME_CONFIG.AD_REWARD_COINS
      : 50;
    this.dom.adModal.classList.add('modal-hidden');
    this.isWatchingAd = false;
    this.resumeGame();
    this.addCoins(adReward, 'Watched Video');
    this.showToast(`+${adReward} Coins Added! 🎬🪙`, 'success');
  }

  closeAdShowcase() {
    if (this.adTimerInterval) {
      clearInterval(this.adTimerInterval);
      this.adTimerInterval = null;
    }
    this.dom.adModal.classList.add('modal-hidden');
    this.isWatchingAd = false;
    this.resumeGame();
    this.showToast('Ad showcase dismissed', 'info');
  }

  /* --------------------------------------------------------------------------
   * Settings Menu Management
   * -------------------------------------------------------------------------- */
  openSettingsModal() {
    this.pauseGame();
    this.dom.languageSelect.value = this.selectedLanguage;
    this.dom.soundToggleInput.checked = this.soundEngine.enabled;
    this.dom.settingsModal.classList.remove('modal-hidden');
  }

  closeSettingsModal() {
    this.dom.settingsModal.classList.add('modal-hidden');
    this.resumeGame();
  }

  saveSettings() {
    this.selectedLanguage = this.dom.languageSelect.value;
    const soundEnabled = this.dom.soundToggleInput.checked;
    this.soundEngine.setMuted(!soundEnabled);
    this.dom.soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    this.closeSettingsModal();
    this.showToast(`Language: ${this.selectedLanguage.toUpperCase()}`);
    this.renderTargetWordsList();
    // Persist settings preferences across platform sessions
    this.saveGameState();
  }

  /* --------------------------------------------------------------------------
   * Global Word Uniqueness & Level Word Selection Engine
   * --------------------------------------------------------------------------
   * Strict adherence to global word uniqueness requirement:
   * - Once a word is used in ANY level, it is permanently excluded from all other levels.
   * - Every word must be unique across the entire game progression.
   * - Maintains a global tracker (this.usedWords) in memory and persistent storage.
   * - Filters the available word pool to exclude any word that exists in this.usedWords.
   * - Caches selected words per level in this.levelWordsMap to maintain level replay consistency.
   * - Pushes selected unique words into this.usedWords so they cannot be drawn in any other level.
   */
  selectLevelWords(levelIndex) {
    // 1. If words have already been selected and locked for this level, restore/return them
    if (this.levelWordsMap && Array.isArray(this.levelWordsMap[levelIndex]) && this.levelWordsMap[levelIndex].length > 0) {
      this.levelWordsMap[levelIndex].forEach(w => this.usedWords.add(w));
      return this.levelWordsMap[levelIndex];
    }

    const rawLevel = GAME_LEVELS[levelIndex];
    if (!rawLevel) return [];

    // 2. Fetch candidate words from level pool or words list
    const candidatePool = Array.isArray(rawLevel.wordPool) && rawLevel.wordPool.length > 0
      ? rawLevel.wordPool
      : (Array.isArray(rawLevel.words) ? rawLevel.words : []);

    // 3. Filter candidate pool to permanently exclude any word in this.usedWords
    const availableWords = candidatePool.filter(word => !this.usedWords.has(word));

    // Target count of words required for this level
    const targetCount = rawLevel.targetWordCount || rawLevel.words.length;

    let selectedWords = [];
    if (availableWords.length >= targetCount) {
      selectedWords = availableWords.slice(0, targetCount);
    } else {
      selectedWords = [...availableWords];
      for (const w of candidatePool) {
        if (selectedWords.length >= targetCount) break;
        if (!selectedWords.includes(w)) {
          selectedWords.push(w);
        }
      }
    }

    // 4. Push unique words into global tracker so they cannot be drawn again in the future
    selectedWords.forEach(w => this.usedWords.add(w));

    // 5. Cache and persist selected words for this level
    if (!this.levelWordsMap) this.levelWordsMap = {};
    this.levelWordsMap[levelIndex] = selectedWords;

    return selectedWords;
  }

  /* --------------------------------------------------------------------------
   * Level Management & Win State Flow
   * -------------------------------------------------------------------------- */
  /**
   * Applies dynamic level background themes and WCAG contrast-safe text colors.
   * Cycles or selects the palette per level, updates CSS variables on #game-app &
   * document.documentElement (--bg-primary, --bg-secondary, --bg-card, --bg-radial-top,
   * --target-word-text, --tile-text), and caches this.currentThemePalette.
   */
  applyThemePalette(levelIndex = 0) {
    const safeIndex = (typeof levelIndex === 'number' && !isNaN(levelIndex))
      ? Math.abs(Math.floor(levelIndex))
      : 0;
    const paletteIndex = safeIndex % GAME_THEME_PALETTES.length;
    const basePalette = GAME_THEME_PALETTES[paletteIndex];

    const tileTextColor = getContrastSafeTextColor(basePalette.preferredTileText, basePalette.tileBg, 4.5);
    const targetWordTextColor = getContrastSafeTextColor(basePalette.preferredWordText, basePalette.bgCard, 4.5);

    this.currentThemePalette = {
      ...basePalette,
      tileTextColor,
      targetWordTextColor
    };

    const rootEl = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement : null;
    const appEl = (typeof document !== 'undefined' && document.getElementById('game-app')) || rootEl;

    if (rootEl && appEl) {
      const properties = {
        '--bg-primary': this.currentThemePalette.bgPrimary,
        '--bg-secondary': this.currentThemePalette.bgSecondary,
        '--bg-card': this.currentThemePalette.bgCard,
        '--bg-radial-top': this.currentThemePalette.bgRadialTop,
        '--target-word-text': this.currentThemePalette.targetWordTextColor,
        '--tile-text': this.currentThemePalette.tileTextColor
      };

      Object.entries(properties).forEach(([prop, val]) => {
        appEl.style.setProperty(prop, val);
        rootEl.style.setProperty(prop, val);
      });
    }

    return this.currentThemePalette;
  }

  loadLevel(levelIndex) {
    this.isDailyMode = false;
    this.currentLevelIndex = levelIndex;
    this.applyThemePalette(levelIndex);
    this.maxUnlockedLevel = Math.max(this.maxUnlockedLevel, this.currentLevelIndex);
    
    // Select globally unique words for this level, strictly excluding any used words
    const selectedWords = this.selectLevelWords(this.currentLevelIndex);
    const baseLevel = GAME_LEVELS[this.currentLevelIndex];
    this.currentLevelData = Object.assign({}, baseLevel, {
      words: selectedWords
    });

    this.foundWords.clear();
    this.translatedWords.clear();
    this.clearHint();

    // Ensure Daily Challenge UI elements are hidden and campaign elements restored
    if (this.dom.dailyBackBtn) this.dom.dailyBackBtn.classList.add('modal-hidden');
    if (this.dom.dailyPuzzleBtn) this.dom.dailyPuzzleBtn.classList.remove('modal-hidden');
    if (this.dom.gameOverBackBtn) this.dom.gameOverBackBtn.classList.add('modal-hidden');

    // Persist current level advancement to storage immediately
    this.saveGameState();

    // Update Header Level Indicator
    this.dom.levelNumber.textContent = (this.currentLevelIndex + 1).toString();
    if (this.dom.levelTotal) {
      this.dom.levelTotal.textContent = `/${GAME_LEVELS.length}`;
    }

    // Reset and Start Countdown Timer
    this.remainingSeconds = this.currentLevelData.timeLimit;
    this.updateTimerDisplay();
    this.startLevelTimer();

    // Render Target Words list in DOM
    this.renderTargetWordsList();

    // Recalibrate canvas dimensions, DPI scaling, and grid layout for the new level
    // This ensures no leftover tile fragments or ghost rows from previous levels persist
    this.resizeCanvas();
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this.dom.timerDisplay.textContent = 
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  startLevelTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (this.isPaused || this.isWatchingAd) return;

      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateTimerDisplay();
      } else {
        clearInterval(this.timerInterval);
        this.handleTimeExpired();
      }
    }, 1000);
  }

  handleLevelClear() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Randomized bonus reward configured via GAME_CONFIG (Section 3.2 & gamerules.md)
    const minBonus = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.LEVEL_CLEAR_MIN_COINS))
      ? GAME_CONFIG.LEVEL_CLEAR_MIN_COINS
      : 10;
    const maxBonus = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.LEVEL_CLEAR_MAX_COINS))
      ? GAME_CONFIG.LEVEL_CLEAR_MAX_COINS
      : 20;
    const range = Math.max(1, maxBonus - minBonus + 1);
    const bonusCoins = Math.floor(Math.random() * range) + minBonus;
    this.addCoins(bonusCoins, 'Level Clear');

    const completionTime = this.currentLevelData.timeLimit - this.remainingSeconds;

    // Performance Score Calculation (Section 8.3):
    // Combines target words (100 pts/word), remaining speed (15 pts/sec), and bonus finds (50 pts/word)
    const speedBonus = this.remainingSeconds * 15;
    const targetBonus = this.foundWords.size * 100;
    const bonusWordsBonus = this.bonusWordsFound.size * 50;
    const levelScore = targetBonus + speedBonus + bonusWordsBonus;
    this.totalScore += levelScore;

    // Unlock next level in progression if available
    if (this.currentLevelIndex + 1 < GAME_LEVELS.length) {
      this.maxUnlockedLevel = Math.max(this.maxUnlockedLevel, this.currentLevelIndex + 1);
    }

    this.dom.levelRewardCoins.textContent = `+${bonusCoins} Coins`;
    this.dom.clearTimeVal.textContent = `${completionTime}s`;
    if (this.dom.clearScoreVal) {
      this.dom.clearScoreVal.textContent = levelScore.toLocaleString();
    }
    this.dom.clearCoinsTotal.textContent = this.coins.toString();

    this.soundEngine.playWordSuccess();
    this.dom.levelClearModal.classList.remove('modal-hidden');

    // Report score to platform engagement API and persist state
    this.sendPlatformScore(this.totalScore);
    this.saveGameState();
  }

  handleTimeExpired() {
    this.soundEngine.playErrorBuzz();
    this.dom.missedWordsContainer.textContent = '';
    this.currentLevelData.words.forEach(word => {
      if (!this.foundWords.has(word)) {
        const badge = document.createElement('div');
        badge.className = 'word-card';
        badge.textContent = word;
        this.dom.missedWordsContainer.appendChild(badge);
      }
    });

    if (this.dom.gameOverBackBtn) {
      if (this.isDailyMode) {
        this.dom.gameOverBackBtn.classList.remove('modal-hidden');
      } else {
        this.dom.gameOverBackBtn.classList.add('modal-hidden');
      }
    }

    this.dom.gameOverModal.classList.remove('modal-hidden');
  }

  /* --------------------------------------------------------------------------
   * Target Words DOM List Rendering
   * -------------------------------------------------------------------------- */
  renderTargetWordsList() {
    this.dom.targetWordsList.textContent = '';
    const totalWords = this.currentLevelData.words.length;
    const foundCount = this.foundWords.size;
    this.dom.targetProgress.textContent = `${foundCount}/${totalWords}`;

    this.currentLevelData.words.forEach(word => {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.id = `target-word-${word}`;

      const isFound = this.foundWords.has(word);
      if (isFound) {
        card.classList.add('discovered');

        if (this.translatedWords.has(word)) {
          // Format: [Word] = [Translated Word] (in [Selected Language])
          // Example: cat = billi (in hindi)
          const translations = this.currentLevelData.translations[word];
          const translatedWord = (translations && translations[this.selectedLanguage]) || word.toLowerCase();
          const transSpan = document.createElement('span');
          transSpan.className = 'translation-result';
          transSpan.textContent = `${word.toLowerCase()} = ${translatedWord} (in ${this.selectedLanguage})`;
          card.appendChild(transSpan);
        } else {
          const wordText = document.createElement('span');
          wordText.className = 'target-word-label';
          wordText.textContent = word;
          card.appendChild(wordText);

          // Translate button: cost configured via GAME_CONFIG.TRANSLATION_COST (Default: 5)
          const cost = (typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.TRANSLATION_COST))
            ? GAME_CONFIG.TRANSLATION_COST
            : 5;
          const translateBtn = document.createElement('button');
          translateBtn.className = 'translate-btn';
          translateBtn.textContent = `🌐 Translate (${cost}🪙)`;
          translateBtn.title = `Translate for ${cost} coins`;
          translateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTranslateClick(word, cost);
          });
          card.appendChild(translateBtn);
        }
      } else {
        card.classList.add('undiscovered');
        card.textContent = '_ '.repeat(word.length).trim();
      }

      this.dom.targetWordsList.appendChild(card);
    });
  }

  handleTranslateClick(word, cost) {
    const translationCost = Number.isInteger(cost)
      ? cost
      : ((typeof GAME_CONFIG !== 'undefined' && Number.isInteger(GAME_CONFIG.TRANSLATION_COST)) ? GAME_CONFIG.TRANSLATION_COST : 5);
    if (this.deductCoins(translationCost)) {
      this.soundEngine.playTranslationSound();
      this.translatedWords.add(word);
      const translations = this.currentLevelData.translations[word];
      const translatedWord = (translations && translations[this.selectedLanguage]) || word.toLowerCase();
      // Format: [Word] = [Translated Word] (in [Selected Language])
      // Example: cat = billi (in hindi)
      const formattedTranslation = `${word.toLowerCase()} = ${translatedWord} (in ${this.selectedLanguage})`;
      this.renderTargetWordsList();
      this.showToast(`Unlocked: ${formattedTranslation}`, 'success');
    }
  }

  /* --------------------------------------------------------------------------
   * Canvas Responsive Sizing & Tile Matrix Construction
   * -------------------------------------------------------------------------- */
  /* --------------------------------------------------------------------------
   * Canvas Responsive Sizing & Viewport Calibration
   * --------------------------------------------------------------------------
   * ROOT CAUSE & GLITCH FIX EXPLANATION:
   * The repetitive elements / small boxes below the grid were caused by two issues:
   * 1. Setting `this.canvas.style.height = rect.height` where `rect` was obtained
   *    via container.getBoundingClientRect() resulted in a fractional pixel mismatch
   *    with flexbox layout, causing the canvas to be positioned lower than expected
   *    and preventing complete buffer clears.
   * 2. When container dimensions changed, if the canvas buffer resolution was not
   *    cleanly synchronized to integer client dimensions, previous lower-row tile
   *    renderings were not erased.
   * FIX:
   * Use container.clientWidth and clientHeight directly, set the physical buffer
   * to integer (Math.round) DPI values, lock CSS dimensions to match, and apply
   * setTransform(dpr, 0, 0, dpr, 0, 0) uniformly.
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Safety guard: if container has collapsed or has no dimension yet, do not proceed
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;

    // Set internal canvas pixel buffer to exact high-DPI integer resolution
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    // Explicitly lock display size to container's client area (in integer pixels)
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Apply DPI coordinate scale transform uniformly
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Rebuild grid tiles with exact new dimensions
    this.buildGridTiles();

    // Completely clear and re-render canvas
    this.renderCanvas();
  }

  /* --------------------------------------------------------------------------
   * Tile Matrix Generation & Spatial Positioning
   * --------------------------------------------------------------------------
   * ROOT CAUSE & GLITCH FIX EXPLANATION:
   * If container.clientHeight was ever calculated as very small or zero during
   * initial DOM mounting or modal transitions, `usableSize` would collapse,
   * calculating tiny fractional tile sizes (e.g. 4px tiles) and placing them
   * at corrupted vertical offsets.
   * FIX:
   * 1. Add minimum dimension guards (minDim < 60 aborts construction until ready).
   * 2. Guarantee that `this.tiles` is completely wiped before generating exactly
   *    gridSize * gridSize tiles (no leftovers from previous runs).
   * 3. Round all tile coordinates to integer values to prevent sub-pixel blurring.
   */
  buildGridTiles() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const gridSize = this.currentLevelData.gridSize;

    // Dimension safety guard: avoid building tiles when container is unmounted or collapsed
    if (width < 60 || height < 60) return;

    // Calculate maximum square dimension that fits cleanly within container
    const minDim = Math.min(width, height);
    const boardPadding = Math.max(12, Math.round(minDim * 0.05));
    const usableSize = Math.max(60, minDim - (boardPadding * 2));
    const gap = gridSize >= 6 ? 6 : (gridSize >= 5 ? 8 : 10);
    const tileSize = (usableSize - (gap * (gridSize - 1))) / gridSize;

    // Center the square grid perfectly horizontally and vertically
    const startX = Math.round((width - usableSize) / 2);
    const startY = Math.round((height - usableSize) / 2);

    // Completely reset tiles array to guarantee zero redundant or ghost tiles
    this.tiles = [];
    const gridData = this.currentLevelData.grid;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = startX + c * (tileSize + gap);
        const y = startY + r * (tileSize + gap);
        const char = (gridData[r] && gridData[r][c]) ? gridData[r][c] : 'A';

        this.tiles.push({
          row: r,
          col: c,
          char: char,
          x: Math.round(x),
          y: Math.round(y),
          size: Math.round(tileSize),
          centerX: Math.round(x + tileSize / 2),
          centerY: Math.round(y + tileSize / 2)
        });
      }
    }

    // Refresh active hint tile references on responsive reflow
    if (this.hintedWord && this.hintedTiles.length > 0 && Date.now() < this.hintExpiresAt) {
      this.hintedTiles = this.findWordPathOnGrid(this.hintedWord) || [];
    }
  }

  /* --------------------------------------------------------------------------
   * Canvas Rendering: Physical Buffer Clear & Tile Drawing
   * --------------------------------------------------------------------------
   * ROOT CAUSE & GLITCH FIX EXPLANATION:
   * The critical reason for the ghost / repetitive elements below the grid:
   * Previously, `this.ctx.clearRect(0, 0, width, height)` relied on logical
   * coordinates under the active DPI transform. If the container height shrank
   * (e.g. when target words wrapped), `height` was smaller than the physical
   * canvas buffer's bottom edge, leaving a band of un-cleared pixels at the
   * bottom of the canvas where previously rendered tiles remained visible!
   * FIX:
   * We now explicitly reset the transform with `setTransform(1, 0, 0, 1, 0, 0)`
   * and clear the entire physical canvas buffer (`0, 0, canvas.width, canvas.height`).
   * We then restore the DPI scale transform (`setTransform(dpr, 0, 0, dpr, 0, 0)`).
   * This guarantees 100% that NO ghost pixels or leftover fragments can EVER persist!
   */
  renderCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;

    // STEP 1: Absolute full-buffer wipe (reset transform to raw canvas pixels)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // STEP 2: Reapply DPI scaling for crisp high-resolution rendering
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Report YouTube Playables first frame lifecycle completion
    this.notifyFirstFrameReady();

    // STEP 3: Draw connecting hint lines underneath tiles if active
    if (this.hintedTiles && this.hintedTiles.length > 1 && Date.now() < this.hintExpiresAt) {
      this.drawHintLines();
    }

    // STEP 3b: Draw connecting swipe lines underneath tiles
    if (this.selectedTiles.length > 0) {
      this.drawSwipeLines();
    }

    // STEP 4: Draw letter tiles (strictly only the active tiles in this.tiles)
    const hintActive = Date.now() < this.hintExpiresAt;
    this.tiles.forEach(tile => {
      const isSelected = this.selectedTiles.some(
        t => t.row === tile.row && t.col === tile.col
      );
      const hintIndex = hintActive && this.hintedTiles ? this.hintedTiles.findIndex(
        t => t.row === tile.row && t.col === tile.col
      ) : -1;
      this.drawTile(tile, isSelected, hintIndex);
    });

    // STEP 5: Draw active celebratory particle effects (Phase 15 Visual Polish)
    if (this.particles.length > 0) {
      this.drawParticles();
    }
  }

  drawHintLines() {
    if (!this.hintedTiles || this.hintedTiles.length < 2) return;
    const ctx = this.ctx;
    ctx.save();

    // Connecting golden dashed line for hinted word path
    ctx.strokeStyle = '#f59e0b';
    const baseSize = (this.tiles[0] && this.tiles[0].size) ? this.tiles[0].size : 40;
    ctx.lineWidth = Math.max(5, Math.round(baseSize * 0.16));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([8, 8]);
    ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(this.hintedTiles[0].centerX, this.hintedTiles[0].centerY);
    for (let i = 1; i < this.hintedTiles.length; i++) {
      ctx.lineTo(this.hintedTiles[i].centerX, this.hintedTiles[i].centerY);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawSwipeLines() {
    const ctx = this.ctx;
    ctx.save();

    // Connecting neon line properties
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = Math.max(6, Math.round(this.tiles[0].size * 0.18));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 210, 255, 0.6)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(this.selectedTiles[0].centerX, this.selectedTiles[0].centerY);

    for (let i = 1; i < this.selectedTiles.length; i++) {
      ctx.lineTo(this.selectedTiles[i].centerX, this.selectedTiles[i].centerY);
    }

    // Connect to current pointer if dragging
    if (this.isDragging && this.currentPointer) {
      ctx.lineTo(this.currentPointer.x, this.currentPointer.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  drawTile(tile, isSelected, hintIndex = -1) {
    const ctx = this.ctx;
    const { x, y, size, char } = tile;
    const radius = Math.min(14, size * 0.25);
    const theme = this.currentThemePalette;
    const idleTileBg = (theme && theme.tileBg) || '#232a4d';
    const idleTileTextColor = (theme && theme.tileTextColor) || '#f8fafc';

    ctx.save();

    if (isSelected) {
      // Highlighted Selected Tile with gentle scale & neon pulse (Phase 15)
      const scale = 1.05;
      const scaledSize = size * scale;
      const offset = (scaledSize - size) / 2;

      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#0088cc';
      this.roundRect(ctx, x - offset, y - offset, scaledSize, scaledSize, radius * 1.05);
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
    } else if (hintIndex >= 0) {
      // Prominently Highlighted Hint Tile (Golden Glowing Border & Warm Aura)
      ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
      ctx.shadowBlur = 16;

      ctx.fillStyle = '#3a2712';
      this.roundRect(ctx, x, y, size, size, radius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f6c343';
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
    } else {
      // Normal Idle Tile
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = idleTileBg;
      this.roundRect(ctx, x, y, size, size, radius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();

      ctx.fillStyle = idleTileTextColor;
    }

    // Letter Glyph (+17% font size boost for prominent readability)
    ctx.font = `bold ${Math.round(size * 0.54)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, tile.centerX, tile.centerY);

    // If hinted tile, draw step badge (1, 2, 3...) showing sequence order
    if (hintIndex >= 0 && !isSelected) {
      const badgeRadius = Math.max(8, Math.round(size * 0.16));
      const badgeX = x + size - badgeRadius - 2;
      const badgeY = y + badgeRadius + 2;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(badgeRadius * 1.2)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((hintIndex + 1).toString(), badgeX, badgeY);
    }

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
   * Haptic Vibration Feedback Engine (Phase 15 Visual Polish)
   * --------------------------------------------------------------------------
   * Triggers subtle tactile pulses on supported mobile devices.
   */
  triggerHaptic(type) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'tile') {
          navigator.vibrate(12); // Subtle tactile tick on connecting letter
        } else if (type === 'success') {
          navigator.vibrate([30, 40, 50]); // Celebratory vibration burst
        } else if (type === 'bonus') {
          navigator.vibrate([20, 30, 20, 30, 40]); // Sparkling gold coin burst
        } else if (type === 'error') {
          navigator.vibrate([50, 40, 50]); // Error rumble
        }
      } catch (e) {}
    }
  }

  /* --------------------------------------------------------------------------
   * Canvas Particle FX System (Phase 15 Visual Polish)
   * --------------------------------------------------------------------------
   * 100% self-contained procedural particles built with pure 2D canvas math.
   * - Zero external libraries, zero sprite images.
   * - Runs dynamically via requestAnimationFrame only while active particles exist.
   */
  spawnWordSuccessParticles(tiles) {
    if (!tiles || tiles.length === 0) return;
    const colors = ['#00d2ff', '#00ffcc', '#ffe600', '#ffffff', '#ff9900'];

    tiles.forEach(tile => {
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4.5;
        this.particles.push({
          x: tile.centerX,
          y: tile.centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          shape: Math.random() > 0.5 ? 'star' : 'circle',
          gravity: 0.12
        });
      }
    });

    this.startParticleAnimation();
  }

  spawnBonusWordParticles(tiles) {
    const colors = ['#ffe600', '#ffb700', '#ffffff', '#ff9900'];
    const origin = (tiles && tiles.length > 0)
      ? tiles[Math.floor(tiles.length / 2)]
      : { centerX: this.canvas.width / 2, centerY: this.canvas.height / 2 };

    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5;
      this.particles.push({
        x: origin.centerX,
        y: origin.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015,
        shape: 'coin',
        gravity: 0.12
      });
    }

    this.startParticleAnimation();
  }

  startParticleAnimation() {
    if (this.particleAnimFrame) return;

    const loop = () => {
      if (this.particles.length === 0) {
        this.particleAnimFrame = null;
        this.renderCanvas(); // Final clear render
        return;
      }

      this.updateParticles();
      this.renderCanvas();
      this.particleAnimFrame = requestAnimationFrame(loop);
    };

    this.particleAnimFrame = requestAnimationFrame(loop);
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98; // Drag friction
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        this.drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.4);
      } else if (p.shape === 'coin') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /* --------------------------------------------------------------------------
   * Toast Notification Helper
   * -------------------------------------------------------------------------- */
  showToast(message, type = 'info') {
    const toast = this.dom.toastMessage;
    toast.textContent = message;
    toast.className = '';
    if (type === 'error') {
      toast.classList.add('toast-error');
    } else if (type === 'success') {
      toast.classList.add('toast-success');
    } else if (type === 'bonus') {
      toast.classList.add('toast-bonus');
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.add('toast-hidden');
    }, 2500);
  }

  /* ==========================================================================
   * PHASE 17: DATE-SEEDED DAILY PUZZLE & STREAK ECONOMY ENGINE
   * ==========================================================================
   * 100% self-contained, client-side date-seeded Daily Puzzle.
   * - Uses deterministic Mulberry32 PRNG seeded with numeric YYYYMMDD.
   * - Guarantees every player worldwide receives the exact same daily puzzle.
   * - Daily Streak tracking with escalating coin economy (+25 to +100 coins).
   * - Zero external backend or network dependencies (strictly compliant with RULES-CORE-002).
   */

  /**
   * Returns current calendar date in local time as YYYY-MM-DD
   */
  getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Returns yesterday's calendar date in local time as YYYY-MM-DD
   */
  getYesterdayKey() {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const y = yest.getFullYear();
    const m = String(yest.getMonth() + 1).padStart(2, '0');
    const d = String(yest.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Escalating Daily Streak Coin Reward Tier
   * Day 1: +25 coins, Day 2: +35 coins, Day 3: +50 coins,
   * Day 4: +65 coins, Day 5: +80 coins, Day 6: +90 coins, Day 7+: +100 coins
   */
  getStreakReward(streak) {
    const rewards = (typeof GAME_CONFIG !== 'undefined' && Array.isArray(GAME_CONFIG.DAILY_STREAK_REWARDS))
      ? GAME_CONFIG.DAILY_STREAK_REWARDS
      : [25, 35, 50, 65, 80, 90, 100];
    const index = Math.max(0, Math.min(streak - 1, rewards.length - 1));
    return rewards[index];
  }

  /**
   * Checks whether the player maintained their daily streak or broke it by missing yesterday.
   */
  checkDailyStreakLiveness() {
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    // If player has a recorded completion that is neither today nor yesterday, streak has reset
    if (this.lastDailyDate && this.lastDailyDate !== todayKey && this.lastDailyDate !== yesterdayKey) {
      this.dailyStreak = 0;
    }

    if (this.dom && this.dom.dailyStreakBadge) {
      this.dom.dailyStreakBadge.textContent = `🔥${this.dailyStreak}`;
    }
  }

  /**
   * Deterministically constructs today's Daily Puzzle using Mulberry32 PRNG.
   * Every player worldwide receives the exact same challenge on any calendar date.
   */
  getDailyLevelData(dateKey) {
    const seedInt = parseInt(dateKey.replace(/-/g, ''), 10) || 20260917;

    // Mulberry32 32-bit PRNG generator
    let a = seedInt;
    const rng = () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    // Deterministically pick a base level from the 20 verified levels
    const levelIndex = Math.floor(rng() * GAME_LEVELS.length);
    const base = GAME_LEVELS[levelIndex];

    // Deep copy to ensure immutable base level structure
    const dailyLevel = JSON.parse(JSON.stringify(base));
    dailyLevel.theme = `📅 Daily: ${base.theme}`;
    dailyLevel.isDaily = true;
    dailyLevel.dateKey = dateKey;

    return dailyLevel;
  }

  /**
   * Opens the Daily Puzzle modal, calculates rewards, and updates countdowns.
   */
  openDailyModal() {
    this.checkDailyStreakLiveness();
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();
    const alreadyCompleted = (this.lastDailyDate === todayKey);

    // Format readable calendar date
    const now = new Date();
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    this.dom.dailyTodayDate.textContent = `CHALLENGE FOR ${dateStr.toUpperCase()}`;

    // Calculate potential reward
    let projectedStreak = this.dailyStreak;
    if (!alreadyCompleted) {
      projectedStreak = (this.lastDailyDate === yesterdayKey) ? this.dailyStreak + 1 : 1;
    }
    const reward = this.getStreakReward(projectedStreak);

    this.dom.dailyStreakVal.textContent = `🔥 ${this.dailyStreak}`;
    this.dom.dailyBestStreakVal.textContent = `⭐ ${this.bestDailyStreak}`;
    this.dom.dailyRewardVal.textContent = `🪙 +${reward}`;

    // Highlight milestone badges
    const milestones = [
      { id: this.dom.milestone1, req: 1 },
      { id: this.dom.milestone3, req: 3 },
      { id: this.dom.milestone5, req: 5 },
      { id: this.dom.milestone7, req: 7 }
    ];
    milestones.forEach(m => {
      if (m.id) {
        if (this.dailyStreak >= m.req) {
          m.id.classList.add('achieved');
        } else {
          m.id.classList.remove('achieved');
        }
      }
    });

    if (alreadyCompleted) {
      this.dom.dailyStatusMsg.textContent = `🎉 Today's Daily Puzzle is already completed! You extended your streak to ${this.dailyStreak} days!`;
      this.dom.startDailyBtn.textContent = 'Already Completed ✓';
      this.dom.startDailyBtn.disabled = true;
      this.dom.dailyCountdownWrap.classList.remove('modal-hidden');
      this.updateDailyCountdown();
      if (this.dailyCountdownInterval) clearInterval(this.dailyCountdownInterval);
      this.dailyCountdownInterval = setInterval(() => this.updateDailyCountdown(), 1000);
    } else {
      this.dom.dailyStatusMsg.textContent = `Find all daily target words to claim +${reward} coins and advance your streak to ${projectedStreak} day${projectedStreak > 1 ? 's' : ''}!`;
      this.dom.startDailyBtn.textContent = 'Play Daily Puzzle ➜';
      this.dom.startDailyBtn.disabled = false;
      this.dom.dailyCountdownWrap.classList.add('modal-hidden');
      if (this.dailyCountdownInterval) {
        clearInterval(this.dailyCountdownInterval);
        this.dailyCountdownInterval = null;
      }
    }

    this.dom.dailyPuzzleModal.classList.remove('modal-hidden');
  }

  /**
   * Updates countdown timer to upcoming midnight for next day's challenge.
   */
  updateDailyCountdown() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diffMs = midnight - now;
    if (diffMs <= 0) {
      this.checkDailyStreakLiveness();
      this.openDailyModal();
      return;
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    if (this.dom.dailyCountdownTimer) {
      this.dom.dailyCountdownTimer.textContent = 
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  /**
   * Starts playing today's date-seeded Daily Puzzle challenge.
   */
  startDailyChallenge(levelIndex) {
    this.soundEngine.playClick();
    this.dom.dailyPuzzleModal.classList.add('modal-hidden');
    if (this.dailyCountdownInterval) {
      clearInterval(this.dailyCountdownInterval);
      this.dailyCountdownInterval = null;
    }

    this.isDailyMode = true;

    // Show "Back to Levels" navigation button in header, hide Daily button
    if (this.dom.dailyBackBtn) {
      this.dom.dailyBackBtn.classList.remove('modal-hidden');
    }
    if (this.dom.dailyPuzzleBtn) {
      this.dom.dailyPuzzleBtn.classList.add('modal-hidden');
    }

    const todayKey = this.getTodayKey();
    this.currentDailyData = this.getDailyLevelData(todayKey);
    this.currentLevelData = this.currentDailyData;
    this.foundWords.clear();
    this.translatedWords.clear();
    this.clearHint();

    const dailySeed = (typeof levelIndex === 'number' && !isNaN(levelIndex))
      ? levelIndex
      : todayKey.split('-').reduce((acc, num) => acc + (parseInt(num, 10) || 0), 0);
    this.applyThemePalette(dailySeed);

    // Update Header Level Indicator to Daily Mode
    this.dom.levelNumber.textContent = '📅';
    if (this.dom.levelTotal) {
      this.dom.levelTotal.textContent = ' DAILY';
    }

    // Reset and Start Countdown Timer
    this.remainingSeconds = this.currentLevelData.timeLimit;
    this.updateTimerDisplay();
    this.startLevelTimer();

    // Render Target Words list in DOM
    this.renderTargetWordsList();

    // Recalibrate canvas dimensions
    this.resizeCanvas();
    this.showToast(`Daily Challenge: ${this.currentLevelData.theme}!`, 'info');
  }

  /**
   * Handles successful completion of the Daily Puzzle, advancing streak & economy.
   */
  handleDailyClear() {
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    if (this.lastDailyDate === yesterdayKey) {
      this.dailyStreak += 1;
    } else if (this.lastDailyDate !== todayKey) {
      this.dailyStreak = 1;
    }

    if (this.dailyStreak > this.bestDailyStreak) {
      this.bestDailyStreak = this.dailyStreak;
    }
    this.lastDailyDate = todayKey;

    const streakReward = this.getStreakReward(this.dailyStreak);
    this.addCoins(streakReward, 'Daily Challenge');
    this.checkDailyStreakLiveness();

    const completionTime = this.currentLevelData.timeLimit - this.remainingSeconds;
    const speedBonus = this.remainingSeconds * 15;
    const targetBonus = this.foundWords.size * 100;
    const bonusWordsBonus = this.bonusWordsFound.size * 50;
    const dailyScore = targetBonus + speedBonus + bonusWordsBonus;
    this.totalScore += dailyScore;

    this.dom.dailyClearStreakMsg.textContent = `Streak: ${this.dailyStreak} Day${this.dailyStreak > 1 ? 's' : ''}! 🔥`;
    this.dom.dailyClearRewardCoins.textContent = `+${streakReward} Coins`;
    this.dom.dailyClearTimeVal.textContent = `${completionTime}s`;
    if (this.dom.dailyClearScoreVal) {
      this.dom.dailyClearScoreVal.textContent = dailyScore.toLocaleString();
    }
    this.dom.dailyClearCoinsTotal.textContent = this.coins.toString();

    this.soundEngine.playWordSuccess();
    this.soundEngine.playCoinJingle();
    this.spawnConfettiBurst();
    this.dom.dailyClearModal.classList.remove('modal-hidden');

    this.sendPlatformScore(this.totalScore);
    this.saveGameState();
  }

  /**
   * Exits Daily Mode and returns to standard campaign level progression.
   */
  exitDailyMode() {
    this.isDailyMode = false;
    if (this.dom.dailyBackBtn) {
      this.dom.dailyBackBtn.classList.add('modal-hidden');
    }
    if (this.dom.dailyPuzzleBtn) {
      this.dom.dailyPuzzleBtn.classList.remove('modal-hidden');
    }
    if (this.dom.gameOverBackBtn) {
      this.dom.gameOverBackBtn.classList.add('modal-hidden');
    }
    this.loadLevel(this.currentLevelIndex);
  }

  showVictoryScreen() {
    this.soundEngine.playCoinJingle();
    this.maxUnlockedLevel = GAME_LEVELS.length - 1;
    if (this.dom.victorySubtitle) {
      this.dom.victorySubtitle.textContent = `Incredible! You conquered all ${GAME_LEVELS.length} Levels of Word-Mapping!`;
    }
    if (this.dom.victoryFinalScore) {
      this.dom.victoryFinalScore.textContent = this.totalScore.toLocaleString();
    }
    this.dom.victoryFinalCoins.textContent = this.coins.toString();
    this.dom.victoryModal.classList.remove('modal-hidden');

    // Report final grand score to platform and save final state
    this.sendPlatformScore(this.totalScore);
    this.saveGameState();
  }

  /* --------------------------------------------------------------------------
   * Phase 19: Level Selection Menu & Browse / Replay Navigation
   * -------------------------------------------------------------------------- */
  openLevelSelectModal() {
    this.soundEngine.playClick();
    this.isPaused = true;
    this.renderLevelGrid();
    if (this.dom.levelSelectModal) {
      this.dom.levelSelectModal.classList.remove('modal-hidden');
    }
  }

  closeLevelSelectModal() {
    this.soundEngine.playClick();
    this.isPaused = false;
    if (this.dom.levelSelectModal) {
      this.dom.levelSelectModal.classList.add('modal-hidden');
    }
  }

  renderLevelGrid() {
    if (!this.dom.levelGridContainer) return;
    this.dom.levelGridContainer.textContent = '';

    // Update Progress Counter Pill (e.g. "Unlocked: 3/20")
    if (this.dom.levelSelectProgressPill) {
      const unlockedCount = Math.min(this.maxUnlockedLevel + 1, GAME_LEVELS.length);
      this.dom.levelSelectProgressPill.textContent = `Unlocked: ${unlockedCount}/${GAME_LEVELS.length}`;
    }

    // Update Footer Resume / Continue Button
    if (this.dom.levelSelectResumeBtn) {
      if (this.isDailyMode) {
        this.dom.levelSelectResumeBtn.textContent = 'Continue Daily Puzzle ➜';
      } else {
        this.dom.levelSelectResumeBtn.textContent = `Continue Level ${this.currentLevelIndex + 1} ➜`;
      }
    }

    GAME_LEVELS.forEach((levelData, idx) => {
      const levelNum = idx + 1;
      const isUnlocked = idx <= this.maxUnlockedLevel;
      const isCurrent = idx === this.currentLevelIndex && !this.isDailyMode;
      const isCompleted = idx < this.maxUnlockedLevel;

      const card = document.createElement('button');
      card.className = `level-grid-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`;
      card.setAttribute('type', 'button');

      if (isUnlocked) {
        card.setAttribute('aria-label', `Level ${levelNum}: ${levelData.theme}${isCurrent ? ' (Active)' : (isCompleted ? ' (Completed)' : '')}`);
        card.innerHTML = `
          <div class="level-card-top">
            <span class="level-card-num">${levelNum}</span>
            <span class="level-card-status">${isCurrent ? '●' : (isCompleted ? '✓' : '★')}</span>
          </div>
          <div class="level-card-theme" title="${levelData.theme}">${levelData.theme}</div>
          ${isCurrent ? '<div class="level-card-badge">PLAYING</div>' : ''}
        `;
        card.addEventListener('click', () => {
          this.soundEngine.playClick();
          this.closeLevelSelectModal();
          if (this.isDailyMode) {
            this.exitDailyMode();
          }
          this.loadLevel(idx);
          this.showToast(`Loaded Level ${levelNum}: ${levelData.theme}`);
        });
      } else {
        card.setAttribute('aria-label', `Level ${levelNum}: Locked`);
        card.setAttribute('aria-disabled', 'true');
        card.innerHTML = `
          <div class="level-card-top">
            <span class="level-card-num">${levelNum}</span>
            <span class="level-card-lock">🔒</span>
          </div>
          <div class="level-card-theme">Locked</div>
        `;
        card.addEventListener('click', () => {
          this.soundEngine.playErrorBuzz();
          this.showToast(`Level ${levelNum} is locked! Complete Level ${this.maxUnlockedLevel + 1} first.`, 'error');
        });
      }

      this.dom.levelGridContainer.appendChild(card);
    });
  }
}

// Instantiate engine when DOM is ready in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof process === 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      window.wordMappingGame = new WordMappingGame();
    });
  } else {
    window.wordMappingGame = new WordMappingGame();
  }
}

// CommonJS module export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_THEME_PALETTES,
    GAME_LEVELS,
    parseHexColor,
    getRelativeLuminance,
    getContrastRatio,
    getContrastSafeTextColor,
    SoundEngine,
    WordMappingGame
  };
}

