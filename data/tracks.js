// 唯一手工维护的赛道配置。ID 只能末尾追加，不得重排、删除或复用。
// 修改后运行 node scripts/build_lap_config.cjs，同步云函数配置。
module.exports = {
  "regions": [
    {
      "id": 0,
      "name": "北京",
      "pinyin": "beijing"
    },
    {
      "id": 1,
      "name": "浙江",
      "pinyin": "zhejiang"
    },
    {
      "id": 2,
      "name": "上海",
      "pinyin": "shanghai"
    },
    {
      "id": 3,
      "name": "四川",
      "pinyin": "sichuan"
    },
    {
      "id": 4,
      "name": "广东",
      "pinyin": "guangdong"
    },
    {
      "id": 5,
      "name": "德国",
      "pinyin": "deguo",
      "overseas": true
    },
    {
      "id": 6,
      "name": "内蒙古",
      "pinyin": "neimenggu"
    },
    {
      "id": 7,
      "name": "天津",
      "pinyin": "tianjin"
    },
    {
      "id": 8,
      "name": "湖南",
      "pinyin": "hunan"
    },
    {
      "id": 9,
      "name": "湖北",
      "pinyin": "hubei"
    },
    {
      "id": 10,
      "name": "山东",
      "pinyin": "shandong"
    },
    {
      "id": 11,
      "name": "河北",
      "pinyin": "hebei"
    }
  ],
  "tracks": [
    {
      "id": 0,
      "name": "北京锐思赛车场",
      "region": 0,
      "pinyin": "beijingruisi"
    },
    {
      "id": 1,
      "name": "北京易车金港赛车场",
      "region": 0,
      "pinyin": "beijingyichejingang"
    },
    {
      "id": 2,
      "name": "浙江国际赛车场",
      "region": 1,
      "pinyin": "zhejiangguoji"
    },
    {
      "id": 3,
      "name": "宁波国际赛车场",
      "region": 1,
      "pinyin": "ningboguoji"
    },
    {
      "id": 4,
      "name": "上海天马赛车场",
      "region": 2,
      "pinyin": "shanghaitianma"
    },
    {
      "id": 5,
      "name": "上海国际赛车场",
      "region": 2,
      "pinyin": "shanghaiguoji"
    },
    {
      "id": 6,
      "name": "成都天府国际赛车场",
      "region": 3,
      "pinyin": "chengdutianfuguoji"
    },
    {
      "id": 7,
      "name": "广东竞速国际赛车场（麻涌）",
      "region": 4,
      "pinyin": "guangdongjingsuguoji"
    },
    {
      "id": 8,
      "name": "纽博格林北环（完整圈 20.832km）",
      "region": 5,
      "pinyin": "niubogelinbeihuan-full"
    },
    {
      "id": 9,
      "name": "纽博格林北环（BTG 桥到龙门架）",
      "region": 5,
      "pinyin": "niubogelinbeihuan-btg"
    },
    {
      "id": 10,
      "name": "鄂尔多斯国际赛车场",
      "region": 6,
      "pinyin": "eerduosiguoji"
    },
    {
      "id": 11,
      "name": "天津V1国际赛车场（2.4km）",
      "region": 7,
      "pinyin": "tianjinv1-2.4"
    },
    {
      "id": 12,
      "name": "株洲国际赛车场",
      "region": 8,
      "pinyin": "zhuzhouguoji"
    },
    {
      "id": 13,
      "name": "武汉国际赛道",
      "region": 9,
      "pinyin": "wuhanguoji"
    },
    {
      "id": 14,
      "name": "珠海国际赛车场",
      "region": 4,
      "pinyin": "zhuhaiguoji"
    },
    {
      "id": 15,
      "name": "广东国际赛车场",
      "region": 4,
      "pinyin": "guangdongguoji"
    },
    {
      "id": 16,
      "name": "山东菏泽国际赛车场",
      "region": 10,
      "pinyin": "shandonghezeguoji"
    },
    {
      "id": 17,
      "name": "首钢赛车场",
      "region": 11,
      "pinyin": "shougang"
    },
    {
      "id": 18,
      "name": "天津GOGOGO赛车场",
      "region": 7,
      "pinyin": "tianjingogogo"
    },
    {
      "id": 19,
      "name": "天津V1国际赛车场（4.29km）",
      "region": 7,
      "pinyin": "tianjinv1-4.29"
    }
  ]
}
