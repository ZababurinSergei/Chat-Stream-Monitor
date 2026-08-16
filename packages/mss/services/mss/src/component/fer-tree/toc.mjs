export default [
  {
    "children": [
      1
    ],
    "link": "",
    "name": "",
    "id": 0,
    "parent": null
  },
  {
    "children": [
      2,
      4,
      6,
      8,
      10,
      12,
      14,
      16,
      18,
      20,
      22,
      24,
      26,
      28,
      30,
      32,
      34,
      36,
      38,
      40,
      42,
      44,
      46,
      48,
      50,
      52,
      54,
      56
    ],
    "link": "http://localhost:3004",
    "name": "МКБ-11 для ведения статистики смертности и заболеваемости",
    "id": 1,
    "parent": 0
  },
  {
    "name": "01 Некоторые инфекционные и паразитарные болезни",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1435254666",
    "id": 2,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Инфекционный процесс, вызванный установкой медицинского изделия или устройства либо иной имплантацией, не классифицированный в других рубриках"
        },
        "foundationReference": "http://id.who.int/icd/entity/1612485599",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1612485599"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Некоторые инфекционные и паразитарные болезни",
    "code": "01",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/588616678",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1904876434",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/979278646",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1539889147",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1412960686",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1935092859",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/487269828",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1000704511",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1104303944",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1585949804",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1959883044",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/921595235",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1251496839",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1136802325",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/145723401",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/985510409",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1646490591",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1939815950",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/255141529",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/293771399",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1760597414",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/458687859",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1435254666/unspecified"
    ],
    "children": [
      3
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 3,
    "parent": 2
  },
  {
    "name": "02 Новообразования",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1630407678",
    "id": 4,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Новообразования",
    "code": "02",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/879154182",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/944754984",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2009008947",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/531713107",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1167133946",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1158485193",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1844086508",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/264268169"
    ],
    "children": [
      5
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 5,
    "parent": 4
  },
  {
    "name": "03 Болезни системы крови или кроветворных органов",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1766440644",
    "id": 6,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни иммунной системы"
        },
        "foundationReference": "http://id.who.int/icd/entity/1954798891",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1954798891"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезнь, вызванная вирусом иммунодефицита человека"
        },
        "foundationReference": "http://id.who.int/icd/entity/1000704511",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1000704511"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Другие заболевания крови или органов кроветворения и некоторые иммунные нарушения, осложняющие беременность, роды или послеродовый период"
        },
        "foundationReference": "http://id.who.int/icd/entity/809926550",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/809926550"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Врожденные пороки развития, деформации или хромосомные аномалии"
        },
        "foundationReference": "http://id.who.int/icd/entity/223744320",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/223744320"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни системы крови или кроветворных органов",
    "code": "03",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/224336967",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1762461746",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/567425990",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1766440644/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1766440644/unspecified"
    ],
    "children": [
      7
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 7,
    "parent": 6
  },
  {
    "name": "04 Болезни иммунной системы",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1954798891",
    "id": 8,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Новообразования"
        },
        "foundationReference": "http://id.who.int/icd/entity/1630407678",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1630407678"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Аномалии развития"
        },
        "foundationReference": "http://id.who.int/icd/entity/223744320",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/223744320"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни иммунной системы",
    "code": "04",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/587326822",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/609223181",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1008515027",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2115467890",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/642618805",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/966435382",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1860070272",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/603645706",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/183978472",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1954798891/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1954798891/unspecified"
    ],
    "children": [
      9
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 9,
    "parent": 8
  },
  {
    "name": "05 Болезни эндокринной системы, расстройства питания и нарушения обмена веществ",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/21500692",
    "id": 10,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Транзиторные \r\nэндокринные нарушения или нарушения обмена веществ, специфичные для плода или новорожденного"
        },
        "foundationReference": "http://id.who.int/icd/entity/1004987305",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1004987305"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Беременность, роды и послеродовый период"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ",
    "code": "05",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/461716838",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1671987290",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/155258022",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1915134721"
    ],
    "children": [
      11
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 11,
    "parent": 10
  },
  {
    "name": "06 Психические, поведенческие расстройства и расстройства нейропсихического развития",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/334423054",
    "id": 12,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Острая стрессовая реакция"
        },
        "foundationReference": "http://id.who.int/icd/entity/505909942",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/505909942"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Неосложненная тяжелая утрата"
        },
        "foundationReference": "http://id.who.int/icd/entity/2009949293",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/2009949293"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Психические, поведенческие расстройства и расстройства нейропсихического развития",
    "code": "06",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1516623224",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/405565289",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/486722075",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/76398729",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1336943699",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1321276661",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/991786158",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/108180424",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1412387537",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1884115764",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/794195577",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1602669465",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/826065555",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/310393530",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/37291724",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2110604642",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/430567349",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/213458094",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/882114523",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/523677473",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/302122526",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/334423054/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/334423054/unspecified"
    ],
    "children": [
      13
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 13,
    "parent": 12
  },
  {
    "name": "07 Расстройства цикла сон-бодрствование",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/274880002",
    "id": 14,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Расстройства цикла сон-бодрствование",
    "code": "07",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1038292737",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2024456840",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/877557231",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1359329403",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/49589409",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/151357345",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/274880002/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/274880002/unspecified"
    ],
    "children": [
      15
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 15,
    "parent": 14
  },
  {
    "name": "08 Болезни нервной системы",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1296093776",
    "id": 16,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни нервной системы",
    "code": "08",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/384289569",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1719545571",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/724748131",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1397288146",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/28995849",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/843843448",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2021326314",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1861279867",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1730644960",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1297080916",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/76906748",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1119245712",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/23958598",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1397803237",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1965146397",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/81068077",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/988657115",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1510094736",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1743839677",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1125774661",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1296093776/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1296093776/unspecified"
    ],
    "children": [
      17
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 17,
    "parent": 16
  },
  {
    "name": "09 Заболевания зрительной системы",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/868865918",
    "id": 18,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Задняя корковая атрофия"
        },
        "foundationReference": "http://id.who.int/icd/entity/377572273",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/377572273"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и в послеродовый период"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Заболевания зрительной системы",
    "code": "09",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/946652467",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/65880823",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2000687626",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/503601360",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/696932440",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/551713432",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1060046426",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1266833063",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/566574133",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1611601779",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/30317704",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/201567715",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/940938694",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/868865918/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/868865918/unspecified"
    ],
    "children": [
      19
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 19,
    "parent": 18
  },
  {
    "name": "10 Болезни уха или сосцевидного отростка",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1218729044",
    "id": 20,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Новообразования"
        },
        "foundationReference": "http://id.who.int/icd/entity/1630407678",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1630407678"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и в послеродовый период"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни уха или сосцевидного отростка",
    "code": "10",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1046187143",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/902999289",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1111681557",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/601591344",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1769556904",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2145129894",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1218729044/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1218729044/unspecified"
    ],
    "children": [
      21
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 21,
    "parent": 20
  },
  {
    "name": "11 Болезни системы кровообращения",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/426429380",
    "id": 22,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Врожденные мальформации, деформации и хромосомные аномалии"
        },
        "foundationReference": "http://id.who.int/icd/entity/223744320",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/223744320"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни системы кровообращения",
    "code": "11",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/924915526",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1663360295",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1964269418",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1059873720",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1703442464",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1296696944",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/162683166",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1121431779",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/291726710",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2135151223",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1457291912",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1458683894",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1164983645",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/723430526",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1025888387",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1925333068",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/539975693",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/966120194",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1651137927",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/426429380/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/426429380/unspecified"
    ],
    "children": [
      23
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 23,
    "parent": 22
  },
  {
    "name": "12 Болезни органов дыхания",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/197934298",
    "id": 24,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Врожденные пороки развития, деформации и хромосомные аномалии"
        },
        "foundationReference": "http://id.who.int/icd/entity/223744320",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/223744320"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни органов дыхания",
    "code": "12",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1971756453",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1582386590",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/915779102",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1332995100",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/111658096",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/390439470",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/850824593",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/370028006",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1654881561",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/760239795",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/761789312",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/197934298/unspecified"
    ],
    "children": [
      25
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 25,
    "parent": 24
  },
  {
    "name": "13 Болезни органов пищеварения",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1256772020",
    "id": 26,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Новообразования"
        },
        "foundationReference": "http://id.who.int/icd/entity/1630407678",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1630407678"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Психические, поведенческие расстройства и расстройства нейропсихического развития"
        },
        "foundationReference": "http://id.who.int/icd/entity/334423054",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/334423054"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни органов пищеварения",
    "code": "13",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1167594753",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1594312948",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/914520008",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2086488820",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1980672892",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1644587915",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1305923085",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1784240230",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/587365414",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1726554290",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/851941810",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1265113635",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/696703416",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1294458332",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/598093212",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/132592466",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2031646451",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1256772020/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1256772020/unspecified"
    ],
    "children": [
      27
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 27,
    "parent": 26
  },
  {
    "name": "14 Болезни кожи",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1639304259",
    "id": 28,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни кожи",
    "code": "14",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/384984571",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/533054712",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/237197715",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/106304476",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/157326074",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1569145337",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/602989108",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1803768976",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/489508344",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1223380074",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1397253045",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1173690756",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/141396655",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1336446723",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1365615047",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1639304259/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1639304259/unspecified"
    ],
    "children": [
      29
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 29,
    "parent": 28
  },
  {
    "name": "15 Болезни опорно-двигательного аппарата или соединительной ткани",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1473673350",
    "id": 30,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "болезни височно-нижнечелюстного сустава"
        },
        "foundationReference": "http://id.who.int/icd/entity/897101649",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/897101649"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни опорно-двигательного аппарата или соединительной ткани",
    "code": "15",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1525792972",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1989556002",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/789630210",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1523445293",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1507462233",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/762797224",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/252326937",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1473673350/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1473673350/unspecified"
    ],
    "children": [
      31
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 31,
    "parent": 30
  },
  {
    "name": "16 Болезни мочеполовой системы",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/30659757",
    "id": 32,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Осложнения беременности, родов и послеродового периода"
        },
        "foundationReference": "http://id.who.int/icd/entity/714000734",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/714000734"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Болезни мочеполовой системы",
    "code": "16",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/585064432",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1392133133",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1433201931",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1932345217",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1534678903",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1369041370",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/30659757/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/30659757/unspecified"
    ],
    "children": [
      33
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 33,
    "parent": 32
  },
  {
    "name": "17 Состояния, связанные с сексуальным здоровьем",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/577470983",
    "id": 34,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Состояния, связанные с сексуальным здоровьем",
    "code": "17",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/160690465",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/73410310",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1099536224",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/411470068",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1513302415",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/554839264",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/577470983/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/577470983/unspecified"
    ],
    "children": [
      35
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 35,
    "parent": 34
  },
  {
    "name": "18 Беременность, роды и послеродовый период",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/714000734",
    "id": 36,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Акушерский столбняк"
        },
        "foundationReference": "http://id.who.int/icd/entity/262236278",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/262236278"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Послеродовый некроз гипофиза"
        },
        "foundationReference": "http://id.who.int/icd/entity/768216194",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/768216194"
      }
    ],
    "codingNote": {
      "@language": "ru",
      "@value": "Коды, включенные в эту главу, должны использоваться для состояний, относящихся к беременности, родам или послеродовому периоду, или усугубленных ими (материнские или акушерские причины)"
    },
    "classKind": "chapter",
    "title": "Беременность, роды и послеродовый период",
    "code": "18",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/877352786",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1042184245",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/903303141",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/21112155",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1864248550",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/299840850",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/973282267",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1421997617",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1781019902",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/207290928"
    ],
    "children": [
      37
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 37,
    "parent": 36
  },
  {
    "name": "19 Отдельные состояния, возникающие в перинатальном периоде",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1306203631",
    "id": 38,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Болезни эндокринной системы, расстройства питания и нарушения обмена веществ"
        },
        "foundationReference": "http://id.who.int/icd/entity/21500692",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/21500692"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Новообразования"
        },
        "foundationReference": "http://id.who.int/icd/entity/1630407678",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1630407678"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Травмы, отравления или некоторые другие последствия воздействия внешних причин"
        },
        "foundationReference": "http://id.who.int/icd/entity/435227771",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/435227771"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Гастроэнтерит или колит инфекционной этиологии"
        },
        "foundationReference": "http://id.who.int/icd/entity/588616678",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/588616678"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Наследственная гемолитическая анемия"
        },
        "foundationReference": "http://id.who.int/icd/entity/1909380523",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1909380523"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Транзиторная младенческая гипогаммаглобулинемия"
        },
        "foundationReference": "http://id.who.int/icd/entity/1686370790",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1686370790"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Паралитический илеус"
        },
        "foundationReference": "http://id.who.int/icd/entity/1868011045",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1868011045"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "\"Чепчик младенца\"."
        },
        "foundationReference": "http://id.who.int/icd/entity/1315633810",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1315633810"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Врожденная гонококковая инфекция"
        },
        "foundationReference": "http://id.who.int/icd/entity/609214049",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/609214049"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые инфекционные и паразитарные болезни, приобретенные после рождения"
        },
        "foundationReference": "http://id.who.int/icd/entity/1435254666",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1435254666"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые врожденные болезни нервной системы"
        },
        "foundationReference": "http://id.who.int/icd/entity/1296093776",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1296093776"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "врожденная кардиомиопатия"
        },
        "foundationReference": "http://id.who.int/icd/entity/282225286",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/282225286"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "пузырчатка новорожденных"
        },
        "foundationReference": "http://id.who.int/icd/entity/1631069488",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/918813679"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Врожденные пороки развития, деформации и хромосомные аномалии"
        },
        "foundationReference": "http://id.who.int/icd/entity/223744320",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/223744320"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "VA Tetanus neonatorum [No translation available]"
        },
        "foundationReference": "http://id.who.int/icd/entity/1650244559"
      }
    ],
    "codingNote": {
      "@language": "ru",
      "@value": "Патологические состояния, которые начинаются в перинатальном периоде, даже если смерть или болезнь наступит позже, следует по мере возможности кодировать кодами класса 19, который имеет преимущественное значение по отношению к другим классам, содержащим коды, присваиваемые болезням в соответствии с их анатомической локализацией. У детей в возрасте менее 28 дней следует принимать допущение о том, что указываемое патологическое состояние развилось в перинатальном периоде, если только не указана его продолжительность и оно не наступило после первой полной недели жизни."
    },
    "classKind": "chapter",
    "title": "Отдельные состояния, возникающие в перинатальном периоде",
    "code": "19",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/927970860",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/287901798",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/624443803",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/911707612",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1800910986",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/426167863",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1858685964",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1008196289",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1004987305",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/494951911",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1024145243",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/680361950",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1319339568",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/861066692",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1306203631/unspecified"
    ],
    "children": [
      39
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 39,
    "parent": 38
  },
  {
    "name": "20 Аномалии развития",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/223744320",
    "id": 40,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "врожденные ошибки метаболизма"
        },
        "foundationReference": "http://id.who.int/icd/entity/733825440",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/733825440"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Аномалии развития",
    "code": "20",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/258484393",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/770439884",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/939957586",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/775270311",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/223744320/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/223744320/unspecified"
    ],
    "children": [
      41
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 41,
    "parent": 40
  },
  {
    "name": "21 Симптомы, признаки или клинические данные, не классифицированные в других рубриках",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1843895818",
    "id": 42,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Отдельные состояния, возникающие в перинатальном периоде"
        },
        "foundationReference": "http://id.who.int/icd/entity/1306203631",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1306203631"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Отклонения от нормы, выявленные при антенатальном обследовании беременной"
        },
        "foundationReference": "http://id.who.int/icd/entity/64782063",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/64782063"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Симптомы, признаки или клинические данные, не классифицированные в других рубриках",
    "code": "21",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1994504557",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/922175770",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/181201280",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1597934337",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1088544686",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2138796426",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1564218495",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/796618507",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/346645181",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/14576949",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1342309622",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1810466448",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1907275850",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/509543139",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1452443292",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1843895818/other"
    ],
    "children": [
      43
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 43,
    "parent": 42
  },
  {
    "name": "22 Травмы, отравления или некоторые другие последствия воздействия внешних причин",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/435227771",
    "id": 44,
    "exclusion": [
      {
        "label": {
          "@language": "ru",
          "@value": "Стрессовый перелом, не классифицированный в других рубриках"
        },
        "foundationReference": "http://id.who.int/icd/entity/1439320197",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1439320197"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Патологический перелом, не классифицированные в других рубриках"
        },
        "foundationReference": "http://id.who.int/icd/entity/639949585",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/639949585"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Некоторые уточненные акушерские травмы"
        },
        "foundationReference": "http://id.who.int/icd/entity/1146004591",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1146004591"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Неправильная консолидация перелома"
        },
        "foundationReference": "http://id.who.int/icd/entity/560404604",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/560404604"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Родовая травма"
        },
        "foundationReference": "http://id.who.int/icd/entity/624443803",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/624443803"
      },
      {
        "label": {
          "@language": "ru",
          "@value": "Несращение перелома"
        },
        "foundationReference": "http://id.who.int/icd/entity/1143789038",
        "linearizationReference": "http://id.who.int/icd/release/11/2022-02/mms/1143789038"
      }
    ],
    "codingNote": {},
    "classKind": "chapter",
    "title": "Травмы, отравления или некоторые другие последствия воздействия внешних причин",
    "code": "22",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/452386362",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1842013215",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/805284915",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1489212950",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1416283029",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/592902578",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1633923486",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/375360441",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2016483996",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/252518591",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/159081656",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1121827324",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1237810616",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/163532889",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/152692065",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1236563202",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/383104340",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/609351978",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/435227771/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/435227771/unspecified"
    ],
    "children": [
      45
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 45,
    "parent": 44
  },
  {
    "name": "23 Внешние причины заболеваемости или смертности",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/850137482",
    "id": 46,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Внешние причины заболеваемости или смертности",
    "code": "23",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/980862652",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/851395624",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/73322695",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/128104623",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1491356379",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/491063206",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/185842968",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2143219175",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/558785723",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/850137482/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/850137482/unspecified"
    ],
    "children": [
      47
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 47,
    "parent": 46
  },
  {
    "name": "24 Факторы, влияющие на состояние здоровья или обращение в медицинские организации",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1249056269",
    "id": 48,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Факторы, влияющие на состояние здоровья или обращение в медицинские организации",
    "code": "24",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1206995198",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/57624301",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1249056269/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1249056269/unspecified"
    ],
    "children": [
      49
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 49,
    "parent": 48
  },
  {
    "name": "25 Коды для особых целей",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/1596590595",
    "id": 50,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Коды для особых целей",
    "code": "25",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/486488173",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/311473325"
    ],
    "children": [
      51
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 51,
    "parent": 50
  },
  {
    "name": "26 Дополнительный класс патологических состояний в системе традиционной медицины, Модуль I",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/718687701",
    "id": 52,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Дополнительный класс патологических состояний в системе традиционной медицины, Модуль I",
    "code": "26",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/66486001",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/347093131",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/718687701/other",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/718687701/unspecified"
    ],
    "children": [
      53
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 53,
    "parent": 52
  },
  {
    "name": "V Дополнительный раздел для оценки функционирования",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/231358748",
    "id": 54,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Дополнительный раздел для оценки функционирования",
    "code": "V",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/2144513044",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1114122847",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/861284911"
    ],
    "children": [
      55
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 55,
    "parent": 54
  },
  {
    "name": "X Коды расширения",
    "link": "http://localhost:3004/v1/icd/release/11/2022-02/mms/979408586",
    "id": 56,
    "codingNote": {},
    "classKind": "chapter",
    "title": "Коды расширения",
    "code": "X",
    "child": [
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/815889539",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/614922797",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/71556738",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1413523709",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1154280071",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/411368752",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/870996432",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1004338415",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/69327534",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1321407960",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1897222875",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1693181075",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1597357976",
      "http://localhost:3004/v1/icd/release/11/2022-02/mms/1948746454"
    ],
    "children": [
      57
    ],
    "parent": 1
  },
  {
    "name": "",
    "id": 57,
    "parent": 56
  }
]