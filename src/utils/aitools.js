//======================== ai调用工具 ============================
export const tools = [
  {
    //添加物品
    type: "function",
    function: {
      name: "Backpack_additems",
      description:
        "【只能调用一次】这是一个向背包中添加物品的工具(可批量添加),当用户获得(包括且不限于捡到,抢到,击杀获得等等)物品时,在背包数据中添加物品,绝对不能拆分成多次调用",
      parameters: {
        type: "object",
        required: ["items"], // 必填：必须传入物品数组
        properties: {
          // ==============================================
          // 第一层：表示这个工具需要传递的参数是一个数组
          // ==============================================
          items: {
            type: "array",
            description: "要添加的物品列表,必须包含所有物品,不得遗漏",
            // ==============================================
            // 第二层：数组里面的每一个值,都是一个对象,每一个对象包含三个属性
            // ==============================================
            items: {
              type: "object",
              required: ["name", "value", "mount"], // 单个物品的必填字段
              properties: {
                name: {
                  type: "string",
                  description: "物品的具体名字,必须是中文",
                },
                value: {
                  type: "number",
                  description: "单个此物品的具体价值,只能是正整数",
                  minimum: 1, //注意是minimum,别写错了
                },
                mount: {
                  type: "number",
                  description: "所有此物品的具体数量,只能是正整数",
                  minimum: 1,
                },
              },
            },
          },
        },
      }, //parameters括号
    },
  },
  {
    //删除物品
    type: "function",
    function: {
      name: "Backpack_reduceitems",
      description:
        "【只能调用一次】这是一个减少背包中物品的工具(可批量减少),当用户使用(包括且不限于使用,丢弃,贩卖等等)物品时,在背包数据中减少物品,绝对不能拆分成多次调用",
      parameters: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            description: "要减少的物品列表,必须包含所有物品,不得遗漏",
            items: {
              type: "object",
              required: ["name", "value", "mount"],
              properties: {
                name: {
                  type: "string",
                  description: "物品的具体名字,必须是中文",
                },
                value: {
                  type: "number",
                  description: "单个此物品的具体价值,只能是正整数",
                  minimum: 1, //注意是minimum,别写错了
                },
                mount: {
                  type: "number",
                  description: "所有此物品的具体数量,只能是正整数",
                  minimum: 1,
                },
              },
            },
          },
        },
      },
    },
  },

  //{}
  //ai搜索设定数据库
  //流程,ai提取用户想问的内容,直接返回对应的名字
  {
    type: "function",
    function: {
      name: "Query_Data",
      description:
        "查询世界观,设定,功法,物品,法宝,丹药等等各种数据的工具,检测到用户询问:什么,啥,有什么用,介绍等等关键词时,使用当前工具给用户解惑,可多次使用",
      parameters: {
        type: "object",
        required: ["queryName"],
        properties: {
          queryName: {
            type: "string",
            description: `当进行查找时,请必须将句子拆分,拆成多个词语和关键字进行查找,比如用户询问"结丹是多少修为",那么就提取"结丹"和"修为"等关键字,进行查找,绝对不能直接使用工具查询一整句话,绝对不能加入标点符号`,
          },
        },
      },
    },
  },

  //{}
  //ai修改个人面板
];
